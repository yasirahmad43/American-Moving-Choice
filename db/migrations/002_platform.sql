-- American Moving Choice: platform tables for the MVP preview (docs/architecture/build-plan.md §4, §4.1).
-- Adds identity and access, company verification and coverage, lead intake and consent evidence,
-- CRM, billing records, reviews, cases, the message outbox and the audit log. Seeds the states,
-- the platform settings, the active sharing policy and the draft consent text.
--
-- Conventions (as in 001): money in integer cents, ZIP and FIPS codes as text, times as timestamptz.
-- Enumerations are text columns with CHECK constraints so later migrations can widen them.
-- Columns holding a hash of a secret (tokens, sessions) must be lowercase sha256 hex, which keeps
-- raw tokens out of them. email_hash and phone_hash are keyed HMAC-SHA256 hex (contactHash() in
-- @amc/server/contact, keyed with HMAC_SECRET): an unkeyed hash of a phone number can be reversed
-- by enumeration. They are still personal data: never put them in logs, analytics or URLs.
-- Names are unqualified: db/scripts/bundle-supabase.ts sets the schema (amc) and role (amc_app).

-- ================================================================ shared helpers

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Evidence, consent, audit and money tables are append-only: a correction is a new row.
create function reject_update_delete() returns trigger language plpgsql as $$
begin
  raise exception 'append_only: % is not allowed on %', lower(tg_op), tg_table_name using errcode = 'P0001';
end $$;

-- Human-friendly request reference such as AMC-7K3P-9QXD (Crockford base32: no I, L, O or U).
-- Uses only random bytes of a v4 UUID (byte 6 holds the version and byte 8 the variant).
create function generate_reference_code() returns text language sql volatile as $$
  with r as (select uuid_send(gen_random_uuid()) as b),
       c as (
         select t.n, substr('0123456789ABCDEFGHJKMNPQRSTVWXYZ', get_byte(r.b, t.p) % 32 + 1, 1) as ch
         from r, unnest(array[0, 1, 2, 3, 4, 5, 10, 11]) with ordinality as t(p, n)
       )
  select 'AMC-' || string_agg(ch, '' order by n) filter (where n <= 4)
             || '-' || string_agg(ch, '' order by n) filter (where n > 4)
  from c
$$;

-- ================================================================ geography

create table states (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z]+(-[a-z]+)*$'),
  fips text not null unique check (fips ~ '^[0-9]{2}$')
);

insert into states (code, name, slug, fips) values
  ('AL', 'Alabama', 'alabama', '01'),
  ('AK', 'Alaska', 'alaska', '02'),
  ('AZ', 'Arizona', 'arizona', '04'),
  ('AR', 'Arkansas', 'arkansas', '05'),
  ('CA', 'California', 'california', '06'),
  ('CO', 'Colorado', 'colorado', '08'),
  ('CT', 'Connecticut', 'connecticut', '09'),
  ('DE', 'Delaware', 'delaware', '10'),
  ('DC', 'District of Columbia', 'district-of-columbia', '11'),
  ('FL', 'Florida', 'florida', '12'),
  ('GA', 'Georgia', 'georgia', '13'),
  ('HI', 'Hawaii', 'hawaii', '15'),
  ('ID', 'Idaho', 'idaho', '16'),
  ('IL', 'Illinois', 'illinois', '17'),
  ('IN', 'Indiana', 'indiana', '18'),
  ('IA', 'Iowa', 'iowa', '19'),
  ('KS', 'Kansas', 'kansas', '20'),
  ('KY', 'Kentucky', 'kentucky', '21'),
  ('LA', 'Louisiana', 'louisiana', '22'),
  ('ME', 'Maine', 'maine', '23'),
  ('MD', 'Maryland', 'maryland', '24'),
  ('MA', 'Massachusetts', 'massachusetts', '25'),
  ('MI', 'Michigan', 'michigan', '26'),
  ('MN', 'Minnesota', 'minnesota', '27'),
  ('MS', 'Mississippi', 'mississippi', '28'),
  ('MO', 'Missouri', 'missouri', '29'),
  ('MT', 'Montana', 'montana', '30'),
  ('NE', 'Nebraska', 'nebraska', '31'),
  ('NV', 'Nevada', 'nevada', '32'),
  ('NH', 'New Hampshire', 'new-hampshire', '33'),
  ('NJ', 'New Jersey', 'new-jersey', '34'),
  ('NM', 'New Mexico', 'new-mexico', '35'),
  ('NY', 'New York', 'new-york', '36'),
  ('NC', 'North Carolina', 'north-carolina', '37'),
  ('ND', 'North Dakota', 'north-dakota', '38'),
  ('OH', 'Ohio', 'ohio', '39'),
  ('OK', 'Oklahoma', 'oklahoma', '40'),
  ('OR', 'Oregon', 'oregon', '41'),
  ('PA', 'Pennsylvania', 'pennsylvania', '42'),
  ('RI', 'Rhode Island', 'rhode-island', '44'),
  ('SC', 'South Carolina', 'south-carolina', '45'),
  ('SD', 'South Dakota', 'south-dakota', '46'),
  ('TN', 'Tennessee', 'tennessee', '47'),
  ('TX', 'Texas', 'texas', '48'),
  ('UT', 'Utah', 'utah', '49'),
  ('VT', 'Vermont', 'vermont', '50'),
  ('VA', 'Virginia', 'virginia', '51'),
  ('WA', 'Washington', 'washington', '53'),
  ('WV', 'West Virginia', 'west-virginia', '54'),
  ('WI', 'Wisconsin', 'wisconsin', '55'),
  ('WY', 'Wyoming', 'wyoming', '56');

-- ================================================================ identity and access

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and email like '%_@_%'),
  password_hash text,                 -- bcrypt; null until the user sets a password
  full_name text,
  phone text,
  email_verified_at timestamptz,
  mfa_secret_enc text,                -- TOTP secret encrypted with AES-256-GCM (APP_ENCRYPTION_KEY), never plaintext
  mfa_enabled_at timestamptz,
  mfa_last_step bigint,               -- TOTP time step of the last accepted code; a code is never accepted twice (RFC 6238 §5.2)
  failed_logins integer not null default 0 check (failed_logins >= 0),
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sessions (
  id text primary key check (id ~ '^[0-9a-f]{64}$'),   -- sha256 hex of the cookie token; the token is never stored
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  ip text,
  user_agent text,
  mfa_passed_at timestamptz,
  revoked_at timestamptz
);

create table admin_users (
  user_id uuid primary key references users(id) on delete cascade,
  admin_role text not null check (admin_role in
    ('super_admin', 'ops', 'verification', 'finance', 'content_editor', 'moderator', 'support')),
  created_at timestamptz not null default now(),
  created_by uuid references users(id) on delete set null
);

create table auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  purpose text not null check (purpose in ('password_reset', 'email_verify')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Fixed-window counters for login, signup, survey, password-reset and review rate limits.
create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (key, window_start)
);

-- ================================================================ companies

alter table companies
  add column address_line1 text,
  add column address_line2 text,
  add column address_city text,
  add column address_state text references states(code),
  add column address_zip text check (address_zip ~ '^[0-9]{5}$'),
  add column phone text,
  add column website text,
  add column billing_status text not null default 'good' check (billing_status in ('good', 'past_due', 'suspended')),
  add column stripe_customer_id text unique,
  add column is_demo boolean not null default false,   -- fictional company shown in the preview
  add column approved_at timestamptz,
  add column suspended_at timestamptz,
  add column status_reason text,
  add column updated_at timestamptz not null default now();

-- Same signature as 001; adds billing in good standing (lead lifecycle §3 item 1).
create or replace function company_can_purchase(c companies) returns boolean language sql stable as $$
  select c.status = 'approved'
     and c.billing_status = 'good'
     and not c.has_broker_authority
     and c.usdot_number is not null
     and (c.mc_number is not null or not setting_bool('require_mc_number', true))
     and (c.credentials_valid_until is null or c.credentials_valid_until >= current_date)
$$;

create table company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'agent', 'billing')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  can_purchase boolean not null default false,   -- per-user purchase toggle (data-model §2 permission matrix)
  invited_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  email text not null check (email = lower(btrim(email))),
  role text not null check (role in ('owner', 'manager', 'agent', 'billing')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid references users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table company_status_history (
  id bigserial primary key,
  company_id uuid not null references companies(id),
  from_status company_status,          -- null for the first status
  to_status company_status not null,
  reason text,
  changed_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table company_profiles (
  company_id uuid primary key references companies(id),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text not null,
  description text,                    -- company-written, moderated
  logo_url text,
  website text,
  public_status text not null default 'hidden' check (public_status in ('live', 'under_review', 'hidden')),
  network_joined_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Verified service ceiling: coverage rules can never widen these. Values match @amc/core
-- (MoveType, MoveSize, Service in packages/core/src/geo.ts and matching.ts).
create table company_capabilities (
  company_id uuid primary key references companies(id),
  move_types text[] not null default '{}' check (move_types <@ array['local', 'intrastate', 'interstate']),
  move_sizes text[] not null default '{}'
    check (move_sizes <@ array['studio', '1br', '2br', '3br', '4br_plus', 'office', 'partial']),
  services text[] not null default '{}'
    check (services <@ array['full_service', 'packing', 'storage', 'auto_transport', 'labor_only', 'specialty_items']),
  updated_at timestamptz not null default now()
);

-- ================================================================ coverage

-- A rule matches when every specified dimension matches; an empty array or a side without
-- locations is unconstrained (an include rule with no locations is nationwide). Exclusions
-- override inclusions and paused rules are ignored (lead lifecycle §3, @amc/core matchCompany).
create table coverage_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  kind text not null check (kind in ('include', 'exclude')),
  move_types text[] not null default '{}' check (move_types <@ array['local', 'intrastate', 'interstate']),
  move_sizes text[] not null default '{}'
    check (move_sizes <@ array['studio', '1br', '2br', '3br', '4br_plus', 'office', 'partial']),
  services text[] not null default '{}'
    check (services <@ array['full_service', 'packing', 'storage', 'auto_transport', 'labor_only', 'specialty_items']),
  paused boolean not null default false,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Inside one side, any listed location matches (state OR county FIPS OR ZIP).
create table coverage_rule_locations (
  rule_id uuid not null references coverage_rules(id) on delete cascade,
  side text not null check (side in ('origin', 'destination')),
  level text not null check (level in ('state', 'county', 'zip')),
  value text not null,
  primary key (rule_id, side, level, value),
  check ((level = 'state' and value ~ '^[A-Z]{2}$') or (level in ('county', 'zip') and value ~ '^[0-9]{5}$'))
);

-- Any change to coverage or capabilities moves companies.coverage_version on, so eligibility
-- snapshots taken before the change fail at purchase with 'eligibility_stale' (see 001).
-- Trigger functions that reference tables pin the search_path in effect when they are created
-- (amc, public, extensions on Supabase), so edits made from another search_path still work.
create function bump_coverage_version(p_company uuid) returns void language sql
set search_path from current as $$
  update companies set coverage_version = coverage_version + 1 where id = p_company
$$;

-- coverage_rules and company_capabilities carry company_id directly.
create function coverage_changed_for_company() returns trigger language plpgsql
set search_path from current as $$
begin
  if tg_op = 'INSERT' then
    perform bump_coverage_version(new.company_id);
  elsif tg_op = 'DELETE' then
    perform bump_coverage_version(old.company_id);
  else
    perform bump_coverage_version(new.company_id);
    if new.company_id is distinct from old.company_id then
      perform bump_coverage_version(old.company_id);
    end if;
  end if;
  return null;
end $$;

-- coverage_rule_locations resolve the company through their rule. When a rule is deleted its
-- locations cascade after it is gone; the rule's own trigger has already bumped the version.
create function coverage_changed_for_location() returns trigger language plpgsql
set search_path from current as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform bump_coverage_version(r.company_id) from coverage_rules r where r.id = new.rule_id;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.rule_id is distinct from old.rule_id) then
    perform bump_coverage_version(r.company_id) from coverage_rules r where r.id = old.rule_id;
  end if;
  return null;
end $$;

create trigger coverage_rules_bump_coverage_version
  after insert or update or delete on coverage_rules
  for each row execute function coverage_changed_for_company();
create trigger company_capabilities_bump_coverage_version
  after insert or update or delete on company_capabilities
  for each row execute function coverage_changed_for_company();
create trigger coverage_rule_locations_bump_coverage_version
  after insert or update or delete on coverage_rule_locations
  for each row execute function coverage_changed_for_location();

-- ================================================================ verification

-- Evidence record for every check (mover verification §3). Append-only: a reviewer decision or a
-- recheck is a new row. check_type values are the checks listed in mover verification §3.
create table verification_checks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  check_type text not null check (check_type in (
    'usdot_active',           -- USDOT record exists and is active
    'identity_match',         -- legal name, DBA and address match the application
    'authority_type',         -- carrier authority with HHG scope; no broker authority on any docket
    'authority_status',       -- authority granted and active
    'insurance_filings',      -- required filings on file and active
    'recent_record_changes',  -- recent contact, address or officer changes on the FMCSA record
    'callback_verification',  -- call to the phone number on the official record
    'state_credentials',      -- state number verified against the state lookup
    'insurance_certificate'   -- certificate parsed, named insured matches, expiry captured
  )),
  source text not null check (source ~ '^[a-z][a-z0-9_]*$'),   -- fixture, fmcsa_qcmobile, state_lookup, document, manual
  source_url text,
  payload_snapshot jsonb,
  payload_sha256 text check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  result text not null check (result in ('pass', 'fail', 'needs_review')),
  reviewer_id uuid references users(id),
  decision_note text,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table credentials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  credential_type text not null check (credential_type in
    ('usdot', 'docket', 'state_license', 'insurance_coi', 'insurance_filing')),
  number text,
  state text references states(code),
  issuer text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
  issued_on date,
  expires_on date,
  verified_at timestamptz,
  verified_by uuid references users(id) on delete set null,
  source_check_id uuid references verification_checks(id),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'verified' or verified_at is not null)
);

-- Latest FMCSA authority per docket. Movers-only claims render only from these rows (implications §4.1).
create table authority_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  docket_number text not null,
  authority_type text not null check (authority_type in ('common', 'contract', 'broker')),
  scope text not null check (scope in ('household_goods', 'property')),
  status text not null check (status in ('active', 'pending', 'revoked', 'inactive')),
  effective_from date,
  effective_to date,
  source_check_id uuid references verification_checks(id),
  created_at timestamptz not null default now()
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  badge_type text not null default 'preferred_mover' check (badge_type in ('preferred_mover')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  reason text,
  evidence_check_ids uuid[] not null check (cardinality(evidence_check_ids) > 0)
);

-- A badge is issued only from verification results (implications §4.3): every evidence check
-- must be a passing check recorded for the same company.
create function badges_check_evidence() returns trigger language plpgsql
set search_path from current as $$
begin
  if exists (
    select 1 from unnest(new.evidence_check_ids) as e(check_id)
    where not exists (select 1 from verification_checks v
                      where v.id = e.check_id and v.company_id = new.company_id and v.result = 'pass')
  ) then
    raise exception 'badge_evidence_invalid' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger badges_check_evidence
  before insert or update of evidence_check_ids, company_id on badges
  for each row execute function badges_check_evidence();

-- Cost calculator inputs (build plan §7.3). local and long_distance follow the documented shapes;
-- the required top-level keys are checked here, the values by the cost model. Service prices
-- (packing, storage, specialty items) belong in rate_cards.services, which slice S3 adds.
create table rate_cards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  states text[] not null check (cardinality(states) > 0 and array_position(states, null) is null
                                and array_to_string(states, ',') ~ '^[A-Z]{2}(,[A-Z]{2})*$'),
  local jsonb check (local is null or (jsonb_typeof(local) = 'object'
    and local ?& array['crew_hourly_cents', 'travel_fee_cents', 'hours_by_size', 'crew_by_size'])),
  long_distance jsonb check (long_distance is null or (jsonb_typeof(long_distance) = 'object'
    and long_distance ?& array['cwt_cents_by_band', 'weight_lbs_by_size'])),
  status text not null default 'active' check (status in ('active', 'superseded')),
  submitted_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (local is not null or long_distance is not null)
);

-- ================================================================ leads and consent

alter table leads
  add column reference_code text not null unique default generate_reference_code(),
  add column status text not null default 'submitted'
    check (status in ('submitted', 'rejected', 'needs_review', 'qualified', 'unmatched')),
  add column move_date date,
  add column move_date_flexible boolean not null default false,
  add column move_size text check (move_size in ('studio', '1br', '2br', '3br', '4br_plus', 'office', 'partial')),
  add column services text[] not null default '{}'
    check (services <@ array['full_service', 'packing', 'storage', 'auto_transport', 'labor_only', 'specialty_items']),
  add column origin_city text,
  add column origin_state text references states(code),
  add column origin_county_fips text check (origin_county_fips ~ '^[0-9]{5}$'),
  add column dest_city text,
  add column dest_state text references states(code),
  add column dest_county_fips text check (dest_county_fips ~ '^[0-9]{5}$'),
  add column distance_miles double precision check (distance_miles >= 0),
  add column move_type text check (move_type in ('local', 'intrastate', 'interstate')),
  add column channel_scope text[] not null default '{}' check (channel_scope <@ array['call', 'sms', 'email']),
  add column email_hash text check (email_hash ~ '^[0-9a-f]{64}$'),
  add column phone_hash text check (phone_hash ~ '^[0-9a-f]{64}$'),
  add column risk_score integer check (risk_score between 0 and 100),
  add column source_category text not null default 'other' check (source_category in
    ('organic_search', 'paid_search', 'paid_social', 'referral', 'direct', 'other')),
  add column manage_token_hash text unique check (manage_token_hash ~ '^[0-9a-f]{64}$'),
  add column withdrawn_at timestamptz,
  add column profile_company_id uuid references companies(id);   -- request started from this company's profile

create table lead_validation_results (
  id bigserial primary key,
  lead_id uuid not null references leads(id),
  check_type text not null check (check_type ~ '^[a-z][a-z0-9_]*$'),   -- honeypot, phone_format, email_mx, ...
  result text not null check (result in ('pass', 'fail', 'flag', 'skipped')),
  reason text,
  provider_ref text,
  created_at timestamptz not null default now()
);

-- Versioned consent text. sha256 is the hex digest of the UTF-8 body. kind separates the
-- contact-consent checkbox text from the Terms and privacy acknowledgment, which is a separate
-- control (build plan §7.2, implications §3.2). Text that a consent record cites never changes;
-- approved and retired versions are frozen except for retiring an approved one.
create table consent_text_versions (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null default 'contact_consent' check (kind in ('contact_consent', 'terms_privacy_ack')),
  body text not null,
  sha256 text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  effective_from timestamptz,
  approved_by text,                    -- counsel sign-off reference
  created_at timestamptz not null default now(),
  check (sha256 = encode(sha256(convert_to(body, 'UTF8')), 'hex')),
  check (status <> 'approved' or (approved_by is not null and effective_from is not null))
);

create function consent_text_versions_freeze() returns trigger language plpgsql
set search_path from current as $$
declare
  cited boolean := exists (select 1 from consent_records r where r.consent_text_version_id = old.id);
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' or cited then
      raise exception 'consent_text_frozen: % is % and cannot be deleted', old.id,
        case when cited then 'cited by consent records' else old.status end using errcode = 'P0001';
    end if;
    return old;
  end if;
  -- Text a consumer saw stays exactly as it was, whatever its status.
  if cited and (new.id is distinct from old.id or new.kind is distinct from old.kind
                or new.body is distinct from old.body or new.sha256 is distinct from old.sha256) then
    raise exception 'consent_text_frozen: % is cited by consent records', old.id using errcode = 'P0001';
  end if;
  -- Approved and retired versions: the only change allowed is approved -> retired.
  if old.status <> 'draft' and not (
       old.status = 'approved' and new.status = 'retired'
       and (new.id, new.kind, new.body, new.sha256, new.approved_by, new.effective_from, new.created_at)
           is not distinct from (old.id, old.kind, old.body, old.sha256, old.approved_by, old.effective_from, old.created_at)) then
    raise exception 'consent_text_frozen: % is %', old.id, old.status using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger consent_text_versions_freeze
  before update or delete on consent_text_versions
  for each row execute function consent_text_versions_freeze();

-- Consent evidence for one submitted request (lead lifecycle §6, implications §3.6). Append-only.
-- rendered_text is exactly what the consumer saw, mover names in the order shown;
-- named_company_ids are the movers left on the list (only they may buy) and
-- removed_company_ids the movers the consumer removed.
create table consent_records (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references leads(id),
  consent_text_version_id text not null references consent_text_versions(id),
  rendered_text text not null,
  rendered_text_sha256 text not null,
  named_company_ids uuid[] not null,
  removed_company_ids uuid[] not null default '{}',
  selected_limit integer not null check (selected_limit >= 1),
  channel_scope text[] not null,
  checkbox_state boolean not null,
  terms_version text not null,
  terms_accepted boolean not null,
  privacy_version text not null,
  privacy_acknowledged boolean not null,
  ip text,
  user_agent text,
  page_url text not null,
  form_version text not null,
  form_state_sha256 text not null check (form_state_sha256 ~ '^[0-9a-f]{64}$'),
  ab_variant text not null,
  phone_hash text not null check (phone_hash ~ '^[0-9a-f]{64}$'),
  email_hash text not null check (email_hash ~ '^[0-9a-f]{64}$'),
  tag_manifest_version text not null,
  certificate_id text,                 -- third-party consent certificate, if one is adopted
  submitted_at timestamptz not null default now(),
  check (rendered_text_sha256 = encode(sha256(convert_to(rendered_text, 'UTF8')), 'hex')),
  check (cardinality(named_company_ids) > 0 and not (named_company_ids && removed_company_ids)),
  check (cardinality(channel_scope) > 0 and channel_scope <@ array['call', 'sms', 'email']),
  -- No consented lead without full evidence (implications §3.6), and a record exists only for
  -- submitted consent: both checkboxes ticked.
  check (btrim(rendered_text) <> '' and btrim(terms_version) <> '' and btrim(privacy_version) <> ''
         and btrim(page_url) <> '' and btrim(form_version) <> '' and btrim(ab_variant) <> ''
         and btrim(tag_manifest_version) <> ''),
  check (checkbox_state and terms_accepted and privacy_acknowledged)
);

-- Opt-outs and withdrawals keyed by contact hash. company_id and channel narrow a stop to one
-- mover or one channel; null means every mover or every channel.
create table consumer_contact_preferences (
  id uuid primary key default gen_random_uuid(),
  email_hash text check (email_hash ~ '^[0-9a-f]{64}$'),
  phone_hash text check (phone_hash ~ '^[0-9a-f]{64}$'),
  lead_id uuid references leads(id),
  company_id uuid references companies(id),
  channel text check (channel in ('call', 'sms', 'email')),
  do_not_contact boolean not null default false,
  withdrawn_at timestamptz,
  source text not null,                -- sms_stop, manage_page, support, ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email_hash is not null or phone_hash is not null)
);

create table attribution_touches (
  id bigserial primary key,
  lead_id uuid not null references leads(id),
  touch text not null check (touch in ('first', 'last')),
  landing_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  click_ids jsonb,                     -- admin-only
  device text,
  source_category text not null default 'other' check (source_category in
    ('organic_search', 'paid_search', 'paid_social', 'referral', 'direct', 'other')),
  evidence_level text not null default 'unknown' check (evidence_level in ('observed', 'referrer_inferred', 'unknown')),
  created_at timestamptz not null default now(),
  unique (lead_id, touch)
);

-- ================================================================ CRM

-- One record per purchase. Private to the buying company, even on shared leads: forced RLS keyed
-- on app.company_id, like crm_notes in 001 (the app sets it per transaction with set_config).
create table crm_records (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references purchases(id),
  company_id uuid not null references companies(id),
  stage text not null default 'new' check (stage in
    ('new', 'contacted', 'qualified', 'quote_sent', 'follow_up', 'booked', 'completed', 'lost')),
  assignee_user_id uuid references users(id) on delete set null,
  estimated_value_cents integer check (estimated_value_cents >= 0),
  follow_up_at timestamptz,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table crm_records enable row level security;
alter table crm_records force row level security;
create policy crm_records_company_isolation on crm_records
  using (company_id = nullif(current_setting('app.company_id', true), '')::uuid)
  with check (company_id = nullif(current_setting('app.company_id', true), '')::uuid
              and exists (select 1 from purchases p
                          where p.id = crm_records.purchase_id and p.company_id = crm_records.company_id));

create table crm_activities (
  id bigserial primary key,
  record_id uuid not null references crm_records(id),
  company_id uuid not null references companies(id),
  type text not null check (type ~ '^[a-z][a-z0-9_]*$'),   -- call, email, sms, stage_change, assignment, ...
  body text,
  actor_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table crm_activities enable row level security;
alter table crm_activities force row level security;
create policy crm_activities_company_isolation on crm_activities
  using (company_id = nullif(current_setting('app.company_id', true), '')::uuid)
  with check (company_id = nullif(current_setting('app.company_id', true), '')::uuid
              and exists (select 1 from crm_records r
                          where r.id = crm_activities.record_id and r.company_id = crm_activities.company_id));

-- Every view, export or notification of purchased contact details (build plan §5).
create table contact_access_log (
  id bigserial primary key,
  purchase_id uuid not null references purchases(id),
  company_id uuid not null references companies(id),
  user_id uuid references users(id) on delete set null,
  action text not null check (action in ('view', 'export', 'notify')),
  ip text,
  created_at timestamptz not null default now()
);

-- ================================================================ billing

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  provider text not null check (provider in ('demo', 'stripe')),
  provider_pm_id text not null,
  brand text,
  last4 text check (last4 ~ '^[0-9]{4}$'),
  exp_month integer check (exp_month between 1 and 12),
  exp_year integer check (exp_year between 2000 and 2100),
  authorization_text_version text not null,   -- version of the authorization text shown (consent draft §9)
  authorized_by uuid references users(id),
  authorized_at timestamptz not null default now(),
  authorized_ip text,
  is_default boolean not null default false,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_pm_id)
);

create table lead_quality_claims (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id),
  company_id uuid not null references companies(id),
  submitted_by uuid references users(id) on delete set null,
  reason text not null check (reason ~ '^[a-z][a-z0-9_]*$'),   -- disconnected_phone, never_requested, ...
  evidence text,
  status text not null default 'open' check (status in ('open', 'approved', 'rejected', 'withdrawn')),
  decided_by uuid references users(id) on delete set null,
  decided_at timestamptz,
  decision text,
  refund_mode text check (refund_mode in ('credit', 'cash')),
  refund_amount_cents integer check (refund_amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  stripe_dispute_id text unique,
  purchase_id uuid references purchases(id),
  company_id uuid not null references companies(id),
  amount_cents integer check (amount_cents >= 0),
  reason text,
  status text not null default 'open' check (status in ('open', 'evidence_submitted', 'won', 'lost', 'closed')),
  evidence_submitted_at timestamptz,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ================================================================ reviews

-- Sent by AMC, never by the company: a quote-experience invitation after each purchase and a
-- move-experience invitation after the move or on a company request (mover verification §6).
create table review_invitations (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id),
  company_id uuid not null references companies(id),
  review_type text not null check (review_type in ('quote_experience', 'move_experience')),
  requested_by text not null default 'system' check (requested_by in ('system', 'company')),
  requested_by_user uuid references users(id) on delete set null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  opened_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (purchase_id, review_type)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  purchase_id uuid not null references purchases(id),
  invitation_id uuid not null unique references review_invitations(id),
  review_type text not null check (review_type in ('quote_experience', 'move_experience')),
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  reviewer_display_name text not null,
  origin_state text references states(code),
  dest_state text references states(code),
  evidence_level text not null check (evidence_level in ('platform_inquiry', 'verified_customer', 'completed_move')),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'removed')),
  incentive_disclosure text,
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null),
  check (status <> 'rejected' or rejection_reason is not null),
  -- Only a verified completed move can rate the moving experience (mover verification §6).
  check (review_type <> 'move_experience' or status <> 'published' or evidence_level = 'completed_move')
);

create table review_evidence (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id),
  kind text not null check (kind in
    ('estimate', 'order_for_service', 'deposit_receipt', 'bill_of_lading', 'final_invoice', 'delivery_receipt')),
  file_ref text,
  checked_by uuid references users(id),
  checked_at timestamptz,
  result text not null default 'pending' check (result in ('pending', 'accepted', 'rejected')),
  note text,
  created_at timestamptz not null default now()
);

create table review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id),
  company_id uuid not null references companies(id),
  author_user_id uuid references users(id) on delete set null,
  body text not null,
  status text not null default 'published' check (status in ('pending', 'published', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id),
  reporter_type text not null check (reporter_type in ('company', 'consumer')),
  reporter_company_id uuid references companies(id),
  reporter_user_id uuid references users(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'upheld', 'dismissed')),
  decision text,
  decided_by uuid references users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- Append-only log of every moderation decision (reviews, responses, reports, profiles).
create table moderation_actions (
  id bigserial primary key,
  target_type text not null check (target_type ~ '^[a-z][a-z0-9_]*$'),
  target_id uuid not null,
  action text not null check (action ~ '^[a-z][a-z0-9_]*$'),
  reason text,
  moderator_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- ================================================================ cases, messages, jobs, audit

create table cases (
  id uuid primary key default gen_random_uuid(),
  case_type text not null check (case_type in
    ('broker_activity', 'credential', 'misconduct', 'review', 'privacy', 'billing', 'unlisted_contact', 'other')),
  company_id uuid references companies(id),
  lead_id uuid references leads(id),
  review_id uuid references reviews(id),
  reporter_name text,                  -- reporter contact fields are private (admin only)
  reporter_email text,
  reporter_phone text,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  assignee uuid references users(id) on delete set null,
  sla_due_at timestamptz,
  outcome text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Outbox: written in the same transaction as the change that causes it, delivered afterwards.
-- Without a provider key a message is stored with status 'demo' and shown in the admin mailbox.
create table messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'sms')),
  to_address text not null,
  template text not null,
  subject text,
  body_text text not null,            -- what the admin mailbox shows: links carrying a token are redacted
  -- The deliverable body when it carries a secret (reset or invitation link): AES-256-GCM with
  -- APP_ENCRYPTION_KEY, bound to the message ID. Cleared once a live provider has it.
  body_secret_enc text,
  related_type text,
  related_id uuid,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'demo', 'failed')),
  provider text,
  provider_ref text,
  error text,
  attempts integer not null default 0 check (attempts >= 0),
  claimed_at timestamptz,             -- when a delivery run claimed it (status sending)
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table job_runs (
  id bigserial primary key,
  job_name text not null,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  items_processed integer,
  error text,
  details jsonb
);

-- Append-only. actor_id and entity_id are text because actors and entities are not all UUIDs
-- (system jobs, settings keys).
create table audit_log (
  id bigserial primary key,
  actor_type text not null check (actor_type in ('user', 'admin', 'system', 'consumer')),
  actor_id text,
  company_id uuid references companies(id),
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  created_at timestamptz not null default now()
);

-- ================================================================ triggers

create trigger verification_checks_append_only before update or delete on verification_checks
  for each row execute function reject_update_delete();
create trigger consent_records_append_only before update or delete on consent_records
  for each row execute function reject_update_delete();
create trigger audit_log_append_only before update or delete on audit_log
  for each row execute function reject_update_delete();
create trigger moderation_actions_append_only before update or delete on moderation_actions
  for each row execute function reject_update_delete();
create trigger ledger_entries_append_only before update or delete on ledger_entries
  for each row execute function reject_update_delete();
-- TRUNCATE skips row triggers, so each append-only table also refuses it per statement.
create trigger verification_checks_no_truncate before truncate on verification_checks
  for each statement execute function reject_update_delete();
create trigger consent_records_no_truncate before truncate on consent_records
  for each statement execute function reject_update_delete();
create trigger audit_log_no_truncate before truncate on audit_log
  for each statement execute function reject_update_delete();
create trigger moderation_actions_no_truncate before truncate on moderation_actions
  for each statement execute function reject_update_delete();
create trigger ledger_entries_no_truncate before truncate on ledger_entries
  for each statement execute function reject_update_delete();

create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();
create trigger companies_set_updated_at before update on companies
  for each row execute function set_updated_at();
create trigger company_profiles_set_updated_at before update on company_profiles
  for each row execute function set_updated_at();
create trigger company_capabilities_set_updated_at before update on company_capabilities
  for each row execute function set_updated_at();
create trigger coverage_rules_set_updated_at before update on coverage_rules
  for each row execute function set_updated_at();
create trigger credentials_set_updated_at before update on credentials
  for each row execute function set_updated_at();
create trigger consumer_contact_preferences_set_updated_at before update on consumer_contact_preferences
  for each row execute function set_updated_at();
create trigger crm_records_set_updated_at before update on crm_records
  for each row execute function set_updated_at();
create trigger lead_quality_claims_set_updated_at before update on lead_quality_claims
  for each row execute function set_updated_at();
create trigger disputes_set_updated_at before update on disputes
  for each row execute function set_updated_at();
create trigger reviews_set_updated_at before update on reviews
  for each row execute function set_updated_at();
create trigger review_responses_set_updated_at before update on review_responses
  for each row execute function set_updated_at();
create trigger cases_set_updated_at before update on cases
  for each row execute function set_updated_at();

-- ================================================================ indexes

create index sessions_user_idx on sessions (user_id);
create index sessions_expires_idx on sessions (expires_at);
create index auth_tokens_user_idx on auth_tokens (user_id);
create index rate_limits_window_idx on rate_limits (window_start);
create index company_memberships_user_idx on company_memberships (user_id);
create index invitations_company_idx on invitations (company_id);
create index company_status_history_company_idx on company_status_history (company_id, created_at);
create index coverage_rules_company_idx on coverage_rules (company_id);
-- One approved account per carrier, so one carrier can't fill two "distinct company" slots on a
-- shared lead (shared pricing §1). Applications may repeat a USDOT number; review sorts them out.
create unique index companies_one_approved_per_usdot on companies (usdot_number) where status = 'approved';
create index companies_usdot_idx on companies (usdot_number);
create index verification_checks_company_idx on verification_checks (company_id, check_type, created_at desc);
create index credentials_company_idx on credentials (company_id);
create index authority_records_company_idx on authority_records (company_id, created_at desc);
create unique index badges_one_active_per_type on badges (company_id, badge_type) where revoked_at is null;
create index rate_cards_company_idx on rate_cards (company_id, status);
create index rate_cards_active_states_idx on rate_cards using gin (states) where status = 'active';

create index leads_status_created_idx on leads (status, created_at desc);
create index leads_group_idx on leads (group_id);
create index leads_email_hash_idx on leads (email_hash, created_at desc) where email_hash is not null;
create index leads_phone_hash_idx on leads (phone_hash, created_at desc) where phone_hash is not null;
create index lead_groups_status_expires_idx on lead_groups (status, expires_at);
create index lead_eligibility_company_idx on lead_eligibility (company_id, matched_at desc);
create index lead_validation_results_lead_idx on lead_validation_results (lead_id);
create index consumer_contact_preferences_email_idx on consumer_contact_preferences (email_hash) where email_hash is not null;
create index consumer_contact_preferences_phone_idx on consumer_contact_preferences (phone_hash) where phone_hash is not null;

create index purchases_company_idx on purchases (company_id, created_at desc);
create index ledger_entries_company_idx on ledger_entries (company_id, created_at desc);
create index ledger_entries_purchase_idx on ledger_entries (purchase_id);
create index crm_records_company_stage_idx on crm_records (company_id, stage);
create index crm_activities_record_idx on crm_activities (record_id, created_at);
create index crm_notes_purchase_idx on crm_notes (purchase_id, created_at);
create index contact_access_log_purchase_idx on contact_access_log (purchase_id, created_at);
create index contact_access_log_company_idx on contact_access_log (company_id, created_at desc);
create index payment_methods_company_idx on payment_methods (company_id);
create unique index payment_methods_one_default on payment_methods (company_id) where is_default and removed_at is null;
create index lead_quality_claims_company_idx on lead_quality_claims (company_id, created_at desc);
create index lead_quality_claims_status_idx on lead_quality_claims (status, created_at);
create unique index lead_quality_claims_one_open on lead_quality_claims (purchase_id) where status = 'open';
create index disputes_company_idx on disputes (company_id);

create index review_invitations_company_idx on review_invitations (company_id);
create index review_invitations_unsent_idx on review_invitations (send_after) where sent_at is null;
create index reviews_company_status_idx on reviews (company_id, status, published_at desc);
create index review_evidence_review_idx on review_evidence (review_id);
create index review_responses_review_idx on review_responses (review_id);
create index review_reports_review_idx on review_reports (review_id);
create index review_reports_status_idx on review_reports (status, created_at);
create index moderation_actions_target_idx on moderation_actions (target_type, target_id, created_at);

create index cases_status_idx on cases (status, sla_due_at);
create index cases_company_idx on cases (company_id);
create index messages_status_idx on messages (status, created_at);
create index messages_to_address_idx on messages (to_address, created_at desc);
create index messages_related_idx on messages (related_type, related_id);
create index job_runs_job_idx on job_runs (job_name, started_at desc);
create index audit_log_created_idx on audit_log (created_at desc);
create index audit_log_entity_idx on audit_log (entity, entity_id, created_at desc);
create index audit_log_company_idx on audit_log (company_id, created_at desc);

-- ================================================================ settings, policy, consent text

insert into platform_settings (key, value) values
  ('max_sharing_limit', '5'),
  ('sale_window_hours', '72'),
  ('local_max_miles', '50'),
  ('quote_invite_delay_days', '7'),
  ('post_move_invite_days', '21'),
  ('rank_min_reviews', '5'),
  ('duplicate_window_days', '30'),
  ('new_to_network_days', '90'),
  ('claim_window_hours', '72'),
  ('show_zip_in_preview', 'false'),
  ('active_policy_version', '"share-stepdown-v1-proposal"'),
  ('active_consent_version', '"consent-v0-draft"');

-- Shared pricing §3 option B, factors 100 / 80 / 65 / 55 / 50 % (a proposal awaiting owner approval).
insert into sharing_policies (version, factors_bp) values
  ('share-stepdown-v1-proposal', '{10000,8000,6500,5500,5000}');

-- Checkbox text from docs/business-rules/consent-and-disclosure-copy-draft.md §5, with {N} kept as
-- the placeholder for the selected limit. Drafts for counsel: not approved for public use.
-- The draft's closing Terms and privacy sentence is stored as its own version (kind
-- terms_privacy_ack) because the contact-consent box must not contain Terms text (build plan
-- §7.2, implications §2.4 and §3.2); consent_records.terms_version and privacy_version record it.
insert into consent_text_versions (id, kind, body, sha256, status)
select t.id, t.kind, t.body, encode(sha256(convert_to(t.body, 'UTF8')), 'hex'), 'draft'
from (values
  ('consent-v0-draft', 'contact_consent',
   'I agree that up to {N} of the movers listed above may contact me about my move at the phone number and email I provided, including by calls and text messages that may use automated technology or prerecorded voice. Consent isn''t required to buy any goods or services. Message and data rates may apply. I can opt out at any time by replying STOP to a text or by contacting the mover or American Moving Choice.'),
  ('terms-ack-v0-draft', 'terms_privacy_ack',
   'I agree to the [Terms of Use] and acknowledge the [Privacy Policy].')
) as t(id, kind, body);

-- ================================================================ function privileges

-- lead_contact_for_company (001) is SECURITY DEFINER: pin its search_path so a caller cannot
-- redirect the tables it reads, and let only the owning role run AMC functions (functions get
-- PUBLIC EXECUTE by default). Trigger functions fire without an EXECUTE check.
alter function lead_contact_for_company(uuid, uuid) set search_path from current;
do $$
declare
  f regprocedure;
begin
  -- Every function in this schema except those that belong to an extension (pgcrypto lives in
  -- public locally; extension functions keep their own grants).
  for f in
    select p.oid::regprocedure from pg_proc p
    where p.pronamespace = current_schema()::regnamespace
      and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public', f);
  end loop;
end $$;
alter default privileges revoke execute on functions from public;
