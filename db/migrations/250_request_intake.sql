-- Accept every valid request, including routes with no currently eligible recipient.
-- Contact evidence for this explicit intake mode can have an empty recipient snapshot;
-- legacy modes keep their nonempty-snapshot requirement and all evidence remains immutable.
alter table lead_groups add column request_intake_pending boolean not null default false;
comment on column lead_groups.request_intake_pending is
  'Current serialized intake has no eligible recipient. Blocks reservations and paid settlement until a later valid intake supplies an authorized eligible snapshot.';

alter table consent_records drop constraint consent_records_recipient_disclosure_mode_check;
alter table consent_records add constraint consent_records_recipient_disclosure_mode_check
  check (recipient_disclosure_mode in ('named_before_send', 'contact_introduction', 'request_intake'));

do $$
declare constraint_row record;
begin
  for constraint_row in
    select conname from pg_constraint
     where conrelid = 'consent_records'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%cardinality(named_company_ids)%'
  loop
    execute format('alter table consent_records drop constraint %I', constraint_row.conname);
  end loop;
end $$;

alter table consent_records add constraint consent_records_recipient_snapshot_check check (
  (recipient_disclosure_mode = 'request_intake' and not (named_company_ids && removed_company_ids))
  or (recipient_disclosure_mode <> 'request_intake' and cardinality(named_company_ids) > 0
      and not (named_company_ids && removed_company_ids))
);

insert into consent_text_versions (id, kind, body, sha256, status)
select 'contact-request-intake-v1', 'contact_consent', body,
       encode(sha256(convert_to(body, 'UTF8')), 'hex'), 'draft'
from (values ($intake${REQUEST_INTAKE_SCOPE} I agree to be contacted about my move {CHANNELS} by American Moving Choice and up to {N} participating moving companies, and to share my move and contact details with those companies. Each moving company will identify itself when it contacts me. {AUTOMATED}Consent isn't required to buy any goods or services.{RATES} I can opt out at any time by {STOP}contacting the mover or American Moving Choice.$intake$)) as v(body);

update platform_settings set value = '"contact-request-intake-v1"'::jsonb
where key = 'active_consent_version'
  and value in ('"contact-introduction-v1-draft"'::jsonb, '"consent-v0-draft"'::jsonb);

-- Keep legacy all-submitted fixtures compatible while explicitly holding unmatched intakes.
create or replace function refuse_unqualified_reservation() returns trigger language plpgsql as $$
begin
  if new.status = 'reserved' and (
       exists (select 1 from lead_groups where id = new.group_id and request_intake_pending)
       or (not exists (select 1 from leads where group_id = new.group_id and status = 'qualified')
           and exists (select 1 from leads where group_id = new.group_id and status in ('needs_review', 'rejected', 'unmatched')))
     ) then
    raise exception 'lead_unavailable' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- A payment already in flight must not disclose an intake whose latest recipient scope is empty.
-- Return null through the existing settlement/refund path rather than throwing after payment.
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
  if g.status = 'withdrawn' or g.status = 'expired' or g.expires_at < now() or a.position > g.sharing_limit
     or g.request_intake_pending
     or (exists (select 1 from consent_records cr join leads l on l.id = cr.lead_id
                  where l.group_id = g.id and cr.recipient_disclosure_mode = 'request_intake')
         and not exists (select 1 from lead_eligibility e where e.group_id = g.id and e.company_id = a.company_id and e.named_in_consent)) then
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
