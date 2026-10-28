-- A transaction-pooler-safe deployment lease and durable phase checkpoints. Session advisory
-- locks cannot guard work through Supabase's transaction pooler (port 6543).
create table seo_bootstrap_runs (
  version text primary key,
  owner_token uuid,
  lease_until timestamptz,
  completed_steps text[] not null default '{}',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  published_count integer,
  check ((owner_token is null) = (lease_until is null))
);
