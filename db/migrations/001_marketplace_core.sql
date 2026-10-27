-- American Moving Choice: transactional marketplace core (Phase 5 foundation).
-- Scope: companies, pricing history, sharing policies, leads/request groups, purchase
-- reservations, purchases, disclosures, ledger, payment-event dedupe, CRM isolation.
-- Money is integer cents. ZIP codes are text. All business rules that protect inventory,
-- money and private data are enforced here, not only in application code.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- companies
create type company_status as enum ('applied','verifying','in_review','approved','rejected','suspended');

create table companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  dba_name text,
  status company_status not null default 'applied',
  usdot_number text,
  mc_number text,
  -- Movers-only: any broker authority (including dual carrier/broker registration) makes a company ineligible.
  has_broker_authority boolean not null default false,
  credentials_valid_until date,
  -- Incremented on every coverage/capability change so stale eligibility snapshots are detected at purchase.
  coverage_version integer not null default 1,
  created_at timestamptz not null default now()
);

-- Admin-configurable platform rules. 'require_mc_number' defaults to true (client policy). It is a
-- setting, not a constant, because FMCSA has announced plans to stop assigning MC numbers to new
-- carriers (see docs/research/compliance-and-platform-facts.md section 1).
create table platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'system'
);
insert into platform_settings(key, value) values ('require_mc_number', 'true');

create function setting_bool(p_key text, p_default boolean) returns boolean language sql stable as $$
  select coalesce((select (value)::boolean from platform_settings where key = p_key), p_default)
$$;

create function company_can_purchase(c companies) returns boolean language sql stable as $$
  select c.status = 'approved'
     and not c.has_broker_authority
     and c.usdot_number is not null
     and (c.mc_number is not null or not setting_bool('require_mc_number', true))
     and (c.credentials_valid_until is null or c.credentials_valid_until >= current_date)
$$;

-- Append-only price history. Purchases snapshot the row they used.
create table company_prices (
  id bigserial primary key,
  company_id uuid not null references companies(id),
  exclusive_cents integer not null check (exclusive_cents >= 0),
  shared_cents integer not null check (shared_cents >= 0),
  effective_from timestamptz not null default now(),
  set_by text not null
);
create index on company_prices (company_id, effective_from desc);

create function current_price(p_company uuid) returns company_prices language sql stable as $$
  select * from company_prices where company_id = p_company and effective_from <= now()
  order by effective_from desc, id desc limit 1
$$;

create table sharing_policies (
  version text primary key,
  factors_bp integer[] not null check (factors_bp[1] = 10000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- leads
-- A request group is the sellable unit. Duplicate consumer submissions join the original group,
-- the group limit is the lowest limit the consumer selected, and buyers are counted per group.
create type group_status as enum ('available','sold_out','expired','withdrawn');

create table lead_groups (
  id uuid primary key default gen_random_uuid(),
  sharing_limit integer not null check (sharing_limit >= 1),
  policy_version text not null references sharing_policies(version),
  status group_status not null default 'available',
  expires_at timestamptz not null default now() + interval '72 hours',
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references lead_groups(id),
  selected_limit integer not null check (selected_limit >= 1),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone_e164 text not null,
  origin_zip text not null check (origin_zip ~ '^[0-9]{5}$'),
  dest_zip text not null check (dest_zip ~ '^[0-9]{5}$'),
  is_primary boolean not null default true,
  created_at timestamptz not null default now()
);

-- Eligibility snapshot written by the matching engine (packages/core/src/matching.ts) when a lead is
-- listed. named_in_consent records that the consumer saw this mover named at submission; only those
-- movers may ever buy the lead. coverage_version detects coverage edits made after matching.
create table lead_eligibility (
  group_id uuid not null references lead_groups(id),
  company_id uuid not null references companies(id),
  matched_rule_id text,
  named_in_consent boolean not null,
  coverage_version integer not null,
  matched_at timestamptz not null default now(),
  primary key (group_id, company_id)
);

create function attach_duplicate(p_group uuid, p_selected_limit integer) returns void language plpgsql as $$
declare g lead_groups;
begin
  select * into g from lead_groups where id = p_group for update;
  update lead_groups set sharing_limit = least(sharing_limit, p_selected_limit) where id = p_group returning * into g;
  if (select count(*) from purchases where group_id = p_group) >= g.sharing_limit and g.status = 'available' then
    update lead_groups set status = 'sold_out' where id = p_group;
  end if;
end $$;

-- Consumer withdraws consent: no further sales or disclosures, including payments already in flight.
create function withdraw_lead_group(p_group uuid) returns void language plpgsql as $$
begin
  update lead_groups set status = 'withdrawn' where id = p_group;
end $$;

-- ---------------------------------------------------------------- purchases
create type attempt_status as enum ('reserved','succeeded','failed','expired');

create table purchase_attempts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references lead_groups(id),
  company_id uuid not null references companies(id),
  idempotency_key text not null,
  status attempt_status not null default 'reserved',
  lead_type text not null check (lead_type in ('exclusive','shared')),
  position integer not null,
  price_row_id bigint not null references company_prices(id),
  list_price_cents integer not null,
  charge_cents integer not null,
  credit_applied_cents integer not null default 0,
  card_amount_cents integer not null,
  payment_ref text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (company_id, idempotency_key)
);
-- At most one in-flight reservation per group: purchases of a lead are serialized, which makes
-- position and price deterministic and makes overselling structurally impossible.
create unique index one_active_attempt_per_group on purchase_attempts (group_id) where status = 'reserved';

create table purchases (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references lead_groups(id),
  company_id uuid not null references companies(id),
  attempt_id uuid not null unique references purchase_attempts(id),
  lead_type text not null,
  position integer not null,
  price_row_id bigint not null references company_prices(id),
  list_price_cents integer not null,   -- company's exclusive or shared price at purchase time
  charged_cents integer not null,
  policy_version text not null,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, company_id),       -- distinct companies, not team members
  unique (group_id, position)
);

create table disclosures (
  purchase_id uuid primary key references purchases(id),
  disclosed_at timestamptz not null default now()
);

create type ledger_kind as enum (
  'purchase_charge',      -- informational record of the price (funded by card and/or credit)
  'credit_spend',         -- negative: account credit consumed by a purchase
  'sharing_credit',       -- positive: automatic credit when a later buyer joins a shared lead
  'quality_refund_credit',-- positive: lead-quality refund issued as account credit
  'cash_refund',          -- refund to the original payment method (no credit-balance effect)
  'adjustment'            -- admin adjustment to credit balance (+/-)
);

create table ledger_entries (
  id bigserial primary key,
  company_id uuid not null references companies(id),
  kind ledger_kind not null,
  amount_cents integer not null,
  purchase_id uuid references purchases(id),
  source_purchase_id uuid references purchases(id), -- for sharing credits: the purchase that triggered it
  note text,
  dedupe_key text not null unique,                  -- makes every financial effect idempotent
  created_at timestamptz not null default now()
);

create view company_credit_balance as
  select c.id as company_id,
         coalesce(sum(l.amount_cents) filter (where l.kind in ('credit_spend','sharing_credit','quality_refund_credit','adjustment')), 0)::integer as balance_cents
  from companies c left join ledger_entries l on l.company_id = c.id
  group by c.id;

create table payment_events (
  provider_event_id text primary key,
  received_at timestamptz not null default now()
);

-- Returns true the first time an event id is seen, false for redeliveries.
create function record_payment_event(p_event_id text) returns boolean language plpgsql as $$
begin
  insert into payment_events(provider_event_id) values (p_event_id);
  return true;
exception when unique_violation then
  return false;
end $$;

-- ---------------------------------------------------------------- purchase flow
create function release_expired_attempts() returns integer language plpgsql as $$
declare n integer;
begin
  -- Production: the sweeper first asks the payment provider whether a PaymentIntent is still processing.
  update purchase_attempts set status = 'expired' where status = 'reserved' and expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;

-- Step 1: reserve. Idempotent per (company, idempotency_key).
create function reserve_purchase(p_company uuid, p_group uuid, p_idem text, p_hold interval default interval '2 minutes')
returns purchase_attempts language plpgsql as $$
declare
  g lead_groups; c companies; pr company_prices; a purchase_attempts; e lead_eligibility;
  n_sold integer; pos integer; price integer; charge integer; credit_avail integer; credit_use integer;
  factors integer[];
begin
  select * into a from purchase_attempts where company_id = p_company and idempotency_key = p_idem;
  if found then return a; end if;

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

-- Step 2 (failure path): release the reservation. No contact data was ever disclosed.
create function fail_purchase(p_attempt uuid) returns void language plpgsql as $$
begin
  update purchase_attempts set status = 'failed' where id = p_attempt and status = 'reserved';
end $$;

-- Step 2 (success path): called after the payment provider confirms success (synchronous result
-- or webhook). Idempotent: repeated calls return the same purchase and create no new entries.
-- Returns null when the payment succeeded but the slot can no longer be honoured (caller refunds).
create function complete_purchase(p_attempt uuid, p_payment_ref text) returns purchases language plpgsql as $$
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

  -- Re-check the lead itself: a withdrawal or a lowered sharing limit during the payment means the
  -- purchase can't be honoured. Release the hold; the caller refunds the payment.
  if g.status = 'withdrawn' or a.position > g.sharing_limit then
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

-- Refunds never reopen a disclosed slot and never reverse other buyers' sharing credits.
-- The refund cap is the buyer's net paid for this lead: charge minus sharing credits already received.
create function refund_purchase(p_purchase uuid, p_mode text, p_amount integer, p_note text) returns void language plpgsql as $$
declare p purchases; net integer;
begin
  select * into p from purchases where id = p_purchase for update;
  if p.refunded_at is not null then return; end if;
  select p.charged_cents - coalesce(sum(amount_cents), 0) into net
    from ledger_entries where purchase_id = p.id and kind = 'sharing_credit';
  if p_amount < 0 or p_amount > net then raise exception 'refund_exceeds_net_paid'; end if;
  update purchases set refunded_at = now() where id = p_purchase;
  insert into ledger_entries(company_id, kind, amount_cents, purchase_id, note, dedupe_key)
  values (p.company_id, case p_mode when 'credit' then 'quality_refund_credit' else 'cash_refund' end::ledger_kind,
          p_amount, p.id, p_note, 'refund:' || p.id);
end $$;

-- ---------------------------------------------------------------- private data access
-- Contact details are only returned to a company holding a completed, disclosed purchase.
create function lead_contact_for_company(p_group uuid, p_company uuid)
returns table(first_name text, last_name text, email text, phone_e164 text) language sql stable security definer as $$
  select l.first_name, l.last_name, l.email, l.phone_e164
  from leads l
  join purchases p on p.group_id = l.group_id and p.company_id = p_company
  join disclosures d on d.purchase_id = p.id
  where l.group_id = p_group and l.is_primary
$$;

-- CRM notes are private per company, even on a shared lead. RLS is defence-in-depth behind
-- server-side authorization; the app sets app.company_id per request.
create table crm_notes (
  id bigserial primary key,
  purchase_id uuid not null references purchases(id),
  company_id uuid not null references companies(id),
  body text not null,
  created_at timestamptz not null default now()
);
alter table crm_notes enable row level security;
alter table crm_notes force row level security;
create policy crm_notes_company_isolation on crm_notes
  using (company_id = nullif(current_setting('app.company_id', true), '')::uuid)
  with check (company_id = nullif(current_setting('app.company_id', true), '')::uuid
              and exists (select 1 from purchases p where p.id = purchase_id and p.company_id = crm_notes.company_id));
