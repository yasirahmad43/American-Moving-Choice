-- American Moving Choice: admin portal and operations (slice S7; build plan §11, migrations 160-169).
--
-- Adds:
--   * company_profiles.description_status: the company-written description is moderated before
--     a profile goes live (S7 must: "profile live when its description is approved"). A changed
--     description goes back to pending automatically.
--   * credential_alerts (data model §3): expiry alerts at 30 / 14 / 7 / 0 days and failed
--     rechecks, one row per credential and alert type so a job never sends the same alert twice.
--   * admin_invitations: single-use links that create admin accounts with a role (the company
--     invitations table is tied to a company and company roles).

-- ================================================================ profile description moderation

alter table company_profiles
  add column description_status text not null default 'pending'
    check (description_status in ('pending', 'approved', 'rejected')),
  add column description_reviewed_at timestamptz,
  add column description_reviewed_by uuid references users(id) on delete set null,
  add column description_rejection_reason text;

-- Profiles that are already live were published with their description.
update company_profiles set description_status = 'approved', description_reviewed_at = updated_at
where public_status = 'live';

create function company_profiles_description_moderation() returns trigger language plpgsql
set search_path from current as $$
begin
  if tg_op = 'INSERT' then
    -- A profile created live (seed, imports) carries an approved description.
    if new.public_status = 'live' and new.description_status = 'pending' then
      new.description_status := 'approved';
      new.description_reviewed_at := coalesce(new.description_reviewed_at, now());
    end if;
    return new;
  end if;
  -- An edited description needs moderation again, unless the same statement records a decision.
  if new.description is distinct from old.description and new.description_status is not distinct from old.description_status then
    new.description_status := 'pending';
    new.description_reviewed_at := null;
    new.description_reviewed_by := null;
    new.description_rejection_reason := null;
  end if;
  return new;
end $$;

create trigger company_profiles_description_moderation
  before insert or update on company_profiles
  for each row execute function company_profiles_description_moderation();

-- ================================================================ credential alerts

create table credential_alerts (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references credentials(id),
  company_id uuid not null references companies(id),
  alert_type text not null check (alert_type in ('expiry_30', 'expiry_14', 'expiry_7', 'expiry_0', 'failed_recheck')),
  -- The expiry date the alert was about: a renewed credential (new expires_on) can be alerted again.
  expires_on date,
  message_id uuid references messages(id),
  sent_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index credential_alerts_once on credential_alerts (credential_id, alert_type, coalesce(expires_on, '-infinity'::date));
create index credential_alerts_company_idx on credential_alerts (company_id, sent_at desc);

-- ================================================================ admin invitations

create table admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and email like '%_@_%'),
  admin_role text not null check (admin_role in
    ('super_admin', 'ops', 'verification', 'finance', 'content_editor', 'moderator', 'support')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid references users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index admin_invitations_email_idx on admin_invitations (email, created_at desc);

-- ================================================================ indexes for admin lists and jobs

create index if not exists purchases_created_idx on purchases (created_at desc);
create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists credentials_expiry_idx on credentials (expires_on) where expires_on is not null;
create index if not exists reviews_status_created_idx on reviews (status, created_at);
create index if not exists companies_status_idx on companies (status, updated_at desc);

-- Functions created here follow 002: only the owning role may run them.
revoke execute on function company_profiles_description_moderation() from public;
