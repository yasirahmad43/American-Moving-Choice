-- American Moving Choice: slice S6 (marketplace, purchase, CRM, billing, company review tools).
--
-- Adds what the purchase orchestration needs around the 001 functions, which stay the only path
-- for money and disclosure:
--   * the card-payment authorization text (consent draft §9) as a versioned text, and the exact
--     rendered authorization stored with each saved payment method;
--   * payment_charges: one row per provider charge for a purchase attempt (the card remainder after
--     credit), so every provider movement is reconciled against purchase_attempts;
--   * payment_refunds: provider refunds of a charge whose purchase could not be honoured
--     (complete_purchase returned null). No purchase exists in that case, so refund_purchase does
--     not apply and the credit balance is untouched; the row records the cash movement only;
--   * crm_notes.author_user_id, so the notes timeline shows who wrote each note.

-- ---------------------------------------------------------------- payment authorization text

-- Kept apart from consent_text_versions (consumer consent): this is the mover's card
-- authorization. A version cited by a saved payment method is never edited; a change is a new row.
create table payment_authorization_texts (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  body text not null,
  sha256 text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  effective_from timestamptz,
  approved_by text,                    -- counsel / Stripe sign-off reference
  created_at timestamptz not null default now(),
  check (sha256 = encode(sha256(convert_to(body, 'UTF8')), 'hex')),
  check (status <> 'approved' or (approved_by is not null and effective_from is not null))
);

create function payment_authorization_texts_freeze() returns trigger language plpgsql
set search_path from current as $$
begin
  if exists (select 1 from payment_methods m where m.authorization_text_version = old.id)
     and (tg_op = 'DELETE' or new.body is distinct from old.body or new.id is distinct from old.id) then
    raise exception 'payment_authorization_text_frozen: % is cited by a payment method', old.id using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger payment_authorization_texts_freeze
  before update or delete on payment_authorization_texts
  for each row execute function payment_authorization_texts_freeze();

-- Consent draft §9, verbatim, with its placeholders. A draft for counsel and Stripe review: not
-- approved for live billing (shared pricing §9).
insert into payment_authorization_texts (id, body, sha256, status)
select t.id, t.body, encode(sha256(convert_to(t.body, 'UTF8')), 'hex'), 'draft'
from (values
  ('card-auth-v0-draft',
   'I authorize American Moving Choice to save this payment method and charge it for the move requests I or members of my company purchase, in the amounts shown at the time of each purchase, and for any amounts owed under the Mover Terms. Account credits are applied before charging this payment method. I can remove this payment method at any time in Billing, which stops future charges but doesn''t cancel purchases already made. Authorized by {user_name} for {company_legal_name} on {timestamp}.')
) as t(id, body);

alter table payment_methods
  add column authorization_rendered_text text,
  add column authorization_text_sha256 text check (authorization_text_sha256 ~ '^[0-9a-f]{64}$'),
  add constraint payment_methods_authorization_hash_matches
    check (authorization_rendered_text is null
           or authorization_text_sha256 = encode(sha256(convert_to(authorization_rendered_text, 'UTF8')), 'hex'));

-- ---------------------------------------------------------------- provider charges and refunds

-- The provider charge for an attempt's card amount. provider_ref is the value passed to
-- complete_purchase (demo_<attempt_id> or the Stripe PaymentIntent ID).
create table payment_charges (
  attempt_id uuid primary key references purchase_attempts(id),
  company_id uuid not null references companies(id),
  provider text not null check (provider in ('demo', 'stripe')),
  payment_method_id uuid references payment_methods(id),
  provider_ref text unique,
  amount_cents integer not null check (amount_cents > 0),
  status text not null check (status in ('processing', 'succeeded', 'failed')),
  failure_code text check (failure_code ~ '^[a-z][a-z0-9_]*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_refunds (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references purchase_attempts(id),
  company_id uuid not null references companies(id),
  provider text not null check (provider in ('demo', 'stripe')),
  provider_ref text not null,              -- the charge refunded
  provider_refund_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  -- slot_unavailable: the payment succeeded but complete_purchase could not honour it (late
  -- success after the hold expired, a withdrawal, or a lowered sharing limit during payment).
  reason text not null check (reason in ('slot_unavailable')),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  error_code text check (error_code ~ '^[a-z][a-z0-9_]*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, reason)
);

create trigger payment_charges_set_updated_at before update on payment_charges
  for each row execute function set_updated_at();
create trigger payment_refunds_set_updated_at before update on payment_refunds
  for each row execute function set_updated_at();

create index payment_charges_company_idx on payment_charges (company_id, created_at desc);
create index payment_refunds_company_idx on payment_refunds (company_id, created_at desc);
create index payment_refunds_pending_idx on payment_refunds (created_at) where status <> 'succeeded';

-- ---------------------------------------------------------------- CRM notes author

alter table crm_notes add column author_user_id uuid references users(id) on delete set null;
