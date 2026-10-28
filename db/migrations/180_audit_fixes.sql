-- 180: fixes from the marketplace rules audit (docs/audit/marketplace-rules-audit.md §8).
--
--   F7   reserve_purchase refuses an idempotency key that was first used for another request.
--   F9   sharing_policies: the factor schedule must be non-increasing and start at 100%, so the
--        credits posted on purchase k can never exceed what a buyer was charged (SP §4).
--   F5   release_expired_attempts takes a list of attempts to leave alone: the sweeper passes the
--        reservations whose card payment the provider still reports as processing.
--   F14  complete_purchase re-checks the sale window: a reservation made inside the window is not
--        honoured after it closes (the caller refunds the card).
--   F15  complete_purchase re-checks for the purchase after taking its locks, so two concurrent
--        settlements of one attempt both return the purchase instead of the second refunding it.
--   F10  Row-level security on purchases, ledger_entries and payment_methods, company-scoped when a
--        transaction has set app.company_id (withCompany), as the CRM tables already are. Without
--        a company context (admin pages, jobs, the purchase functions) the policies are open, so
--        the service and admin paths keep working; inside a company transaction another company's
--        rows are invisible and unwritable.
--   F11  reconciliation_reports: one row per daily reconcile-payments run.
--   F3   review_invitation_audits: one row per company per review-invitation-audit run.

-- ---------------------------------------------------------------- F9: non-increasing factors
create function sharing_factors_valid(p_factors integer[]) returns boolean language sql immutable as $$
  select p_factors is not null
     and array_length(p_factors, 1) >= 1
     and p_factors[1] = 10000
     and not exists (
       select 1 from generate_subscripts(p_factors, 1) as i
       where p_factors[i] is null or p_factors[i] < 0 or p_factors[i] > 10000
          or (i > 1 and p_factors[i] > p_factors[i - 1])
     )
$$;

alter table sharing_policies add constraint sharing_policies_factors_non_increasing check (sharing_factors_valid(factors_bp));

-- ---------------------------------------------------------------- F5: sweeper skip list
drop function release_expired_attempts();
create function release_expired_attempts(p_skip uuid[] default '{}'::uuid[]) returns integer language plpgsql as $$
declare n integer;
begin
  -- The production sweeper first asks the payment provider whether a PaymentIntent is still
  -- processing and passes those attempts in p_skip; they keep their reservation for the next sweep.
  update purchase_attempts set status = 'expired'
   where status = 'reserved' and expires_at < now() and not (id = any(p_skip));
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------- F7: key scoped to the request
create or replace function reserve_purchase(p_company uuid, p_group uuid, p_idem text, p_hold interval default interval '2 minutes')
returns purchase_attempts language plpgsql as $$
declare
  g lead_groups; c companies; pr company_prices; a purchase_attempts; e lead_eligibility;
  n_sold integer; pos integer; price integer; charge integer; credit_avail integer; credit_use integer;
  factors integer[];
begin
  select * into a from purchase_attempts where company_id = p_company and idempotency_key = p_idem;
  if found then
    -- A key belongs to one request: replaying it for another request is a client error, never a
    -- silent "success" for the wrong lead.
    if a.group_id <> p_group then raise exception 'idempotency_key_reused' using errcode = 'P0001'; end if;
    return a;
  end if;

  select * into c from companies where id = p_company for update;       -- serializes this company's credit holds
  if not found or not company_can_purchase(c) then raise exception 'company_not_eligible' using errcode = 'P0001'; end if;

  select * into g from lead_groups where id = p_group for update;       -- serializes this lead's inventory
  if not found then raise exception 'lead_not_found' using errcode = 'P0001'; end if;

  select * into e from lead_eligibility where group_id = p_group and company_id = p_company;
  if not found or not e.named_in_consent then raise exception 'not_eligible_for_lead' using errcode = 'P0001'; end if;
  -- Coverage changed since matching: the caller re-runs the matcher, refreshes the snapshot, then retries.
  if e.coverage_version <> c.coverage_version then raise exception 'eligibility_stale' using errcode = 'P0001'; end if;

  update purchase_attempts set status = 'expired' where group_id = p_group and status = 'reserved' and expires_at < now();

  if g.status <> 'available' or g.expires_at < now() then raise exception 'lead_unavailable' using errcode = 'P0001'; end if;
  if exists (select 1 from purchases where group_id = p_group and company_id = p_company) then
    raise exception 'already_purchased' using errcode = 'P0001';
  end if;
  if exists (select 1 from purchase_attempts where group_id = p_group and status = 'reserved') then
    raise exception 'purchase_in_progress' using errcode = 'P0001';  -- client retries shortly
  end if;

  select count(*) into n_sold from purchases where group_id = p_group;  -- refunded purchases still count
  if n_sold >= g.sharing_limit then raise exception 'sold_out' using errcode = 'P0001'; end if;
  pos := n_sold + 1;

  pr := current_price(p_company);
  if pr.id is null then raise exception 'no_price_configured' using errcode = 'P0001'; end if;

  if g.sharing_limit = 1 then
    price := pr.exclusive_cents; charge := price;
  else
    select factors_bp into factors from sharing_policies where version = g.policy_version;
    if pos > array_length(factors, 1) then raise exception 'policy_limit' using errcode = 'P0001'; end if;
    price := pr.shared_cents;
    charge := floor((price::bigint * factors[pos] + 5000) / 10000);
  end if;

  select balance_cents - coalesce((select sum(credit_applied_cents) from purchase_attempts
                                   where company_id = p_company and status = 'reserved'), 0)
    into credit_avail from company_credit_balance where company_id = p_company;
  credit_use := greatest(0, least(credit_avail, charge));

  insert into purchase_attempts(group_id, company_id, idempotency_key, lead_type, position, price_row_id,
                                list_price_cents, charge_cents, credit_applied_cents, card_amount_cents, expires_at)
  values (p_group, p_company, p_idem, case when g.sharing_limit = 1 then 'exclusive' else 'shared' end, pos, pr.id,
          price, charge, credit_use, charge - credit_use, now() + p_hold)
  returning * into a;
  return a;
end $$;

-- ---------------------------------------------------------------- F14: sale window at completion
create or replace function complete_purchase(p_attempt uuid, p_payment_ref text) returns purchases language plpgsql as $$
declare
  a purchase_attempts; g lead_groups; p purchases; prior record; factors integer[];
  credit integer; n_sold integer;
begin
  select * into a from purchase_attempts where id = p_attempt;
  if not found then raise exception 'attempt_not_found'; end if;

  select * into p from purchases where attempt_id = p_attempt;
  if found then return p; end if;                                       -- duplicate notification

  select * into g from lead_groups where id = a.group_id for update;
  select * into a from purchase_attempts where id = p_attempt for update;

  -- Two callers settling the same attempt at once (a double submit of one idempotency key, or the
  -- synchronous path racing the webhook): the second waited on the lock above while the first
  -- completed, so look again before treating the succeeded attempt as a late success to refund.
  select * into p from purchases where attempt_id = p_attempt;
  if found then return p; end if;

  -- Re-check the lead itself: a withdrawal, a lowered sharing limit or a sale window that closed
  -- during the payment means the purchase can't be honoured. Release the hold; the caller refunds.
  if g.status = 'withdrawn' or g.status = 'expired' or g.expires_at < now() or a.position > g.sharing_limit then
    update purchase_attempts set status = 'failed' where id = p_attempt and status = 'reserved';
    return null;
  end if;

  if a.status <> 'reserved' then
    -- Late success after expiry/failure: honour only if the slot is still free and nobody else holds it.
    select count(*) into n_sold from purchases where group_id = a.group_id;
    if a.status = 'succeeded' or n_sold + 1 <> a.position
       or exists (select 1 from purchase_attempts where group_id = a.group_id and status = 'reserved')
       or exists (select 1 from purchases where group_id = a.group_id and company_id = a.company_id) then
      return null;
    end if;
  end if;

  update purchase_attempts set status = 'succeeded', payment_ref = p_payment_ref where id = p_attempt;

  insert into purchases(group_id, company_id, attempt_id, lead_type, position, price_row_id, list_price_cents, charged_cents, policy_version)
  values (a.group_id, a.company_id, a.id, a.lead_type, a.position, a.price_row_id, a.list_price_cents, a.charge_cents, g.policy_version)
  returning * into p;

  insert into ledger_entries(company_id, kind, amount_cents, purchase_id, dedupe_key)
  values (a.company_id, 'purchase_charge', a.charge_cents, p.id, 'charge:' || p.id);
  if a.credit_applied_cents > 0 then
    insert into ledger_entries(company_id, kind, amount_cents, purchase_id, dedupe_key)
    values (a.company_id, 'credit_spend', -a.credit_applied_cents, p.id, 'spend:' || p.id);
  end if;

  if a.lead_type = 'shared' and a.position > 1 then
    select factors_bp into factors from sharing_policies where version = g.policy_version;
    -- Refunded purchases stop accruing sharing credits (their buyer has already been made whole).
    for prior in select * from purchases where group_id = a.group_id and position < a.position and refunded_at is null order by position loop
      credit := floor((prior.list_price_cents::bigint * factors[a.position - 1] + 5000) / 10000)
              - floor((prior.list_price_cents::bigint * factors[a.position] + 5000) / 10000);
      if credit > 0 then
        insert into ledger_entries(company_id, kind, amount_cents, purchase_id, source_purchase_id, dedupe_key)
        values (prior.company_id, 'sharing_credit', credit, prior.id, p.id, 'share:' || prior.id || ':' || p.id);
      end if;
    end loop;
  end if;

  insert into disclosures(purchase_id) values (p.id);

  if a.position >= g.sharing_limit then
    update lead_groups set status = 'sold_out' where id = g.id;
  end if;
  return p;
end $$;

-- ---------------------------------------------------------------- F10: company-scoped RLS
-- The CRM policies hide every row without a company context. These tables are also read by the
-- purchase functions, the listing, admin pages and jobs with no company context, so their policies
-- scope rows only once app.company_id is set (withCompany). Forced, so the owner role is bound too.
-- The expression is inlined (no helper function) so a role that is granted the tables but not
-- the schema's functions, as in db/test, evaluates the policy the same way.
alter table purchases enable row level security;
alter table purchases force row level security;
create policy purchases_company_scope on purchases
  using (nullif(current_setting('app.company_id', true), '') is null
         or company_id = nullif(current_setting('app.company_id', true), '')::uuid)
  with check (nullif(current_setting('app.company_id', true), '') is null
              or company_id = nullif(current_setting('app.company_id', true), '')::uuid);

alter table ledger_entries enable row level security;
alter table ledger_entries force row level security;
create policy ledger_entries_company_scope on ledger_entries
  using (nullif(current_setting('app.company_id', true), '') is null
         or company_id = nullif(current_setting('app.company_id', true), '')::uuid)
  with check (nullif(current_setting('app.company_id', true), '') is null
              or company_id = nullif(current_setting('app.company_id', true), '')::uuid);

alter table payment_methods enable row level security;
alter table payment_methods force row level security;
create policy payment_methods_company_scope on payment_methods
  using (nullif(current_setting('app.company_id', true), '') is null
         or company_id = nullif(current_setting('app.company_id', true), '')::uuid)
  with check (nullif(current_setting('app.company_id', true), '') is null
              or company_id = nullif(current_setting('app.company_id', true), '')::uuid);

-- ---------------------------------------------------------------- F11: daily reconciliation report
create table reconciliation_reports (
  id bigserial primary key,
  job_run_id bigint references job_runs(id) on delete set null,
  issues_count integer not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);
create index reconciliation_reports_created_at on reconciliation_reports (created_at desc);

-- ---------------------------------------------------------------- F3: selective-invitation monitoring
create table review_invitation_audits (
  id bigserial primary key,
  company_id uuid not null references companies(id),
  job_run_id bigint references job_runs(id) on delete set null,
  window_days integer not null,
  eligible_count integer not null,
  requested_count integer not null,
  coverage_pct integer,
  requested_avg_value_cents integer,
  other_avg_value_cents integer,
  repeat_share_requested_pct integer,
  repeat_share_base_pct integer,
  flags text[] not null default '{}',
  case_id uuid references cases(id) on delete set null,
  created_at timestamptz not null default now()
);
create index review_invitation_audits_company on review_invitation_audits (company_id, created_at desc);
