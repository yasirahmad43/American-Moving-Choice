-- Company onboarding (build plan §11, slice S5): saved application progress and the record of
-- each acceptance of the movers-only terms with the authorized representative's attestation.
-- Company details, numbers, capabilities, coverage and credentials keep living in the 002 tables;
-- the application only stores what has no other home (draft answers and step progress).

-- One row per company. data holds the wizard's answers by step (validated in
-- packages/server/src/companies/application-schema.ts); completed_steps lists the steps saved
-- with valid answers. submitted_at is the latest submission; the company status and
-- company_status_history say what happened next.
create table company_applications (
  company_id uuid primary key references companies(id),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  completed_steps text[] not null default '{}',
  submitted_at timestamptz,
  submitted_by uuid references users(id) on delete set null,
  submission_count integer not null default 0 check (submission_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id) on delete set null
);

create trigger company_applications_set_updated_at before update on company_applications
  for each row execute function set_updated_at();

-- Evidence that the company accepted a specific version of the movers-only terms (consent draft
-- §11) through a named representative who attested to their authority to bind the company
-- (mover verification §2). Append-only: a new submission adds a row.
create table mover_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  user_id uuid not null references users(id),
  terms_version text not null check (terms_version ~ '^[a-z0-9][a-z0-9.-]*$'),
  terms_sha256 text not null check (terms_sha256 ~ '^[0-9a-f]{64}$'),
  representative_name text not null check (length(btrim(representative_name)) > 1),
  representative_title text not null check (length(btrim(representative_title)) > 1),
  representative_email text not null check (representative_email = lower(btrim(representative_email)) and representative_email like '%_@_%'),
  representative_phone text,
  authority_attested boolean not null check (authority_attested),
  ip text,
  user_agent text,
  accepted_at timestamptz not null default now()
);
create index on mover_terms_acceptances (company_id, accepted_at desc);

create trigger mover_terms_acceptances_append_only before update or delete on mover_terms_acceptances
  for each row execute function reject_update_delete();
create trigger mover_terms_acceptances_no_truncate before truncate on mover_terms_acceptances
  for each statement execute function reject_update_delete();

-- Lookups the portal makes often.
create index if not exists coverage_rules_company_idx on coverage_rules (company_id, created_at);
create index if not exists credentials_company_idx on credentials (company_id, credential_type);
create index if not exists company_status_history_company_idx on company_status_history (company_id, created_at);
