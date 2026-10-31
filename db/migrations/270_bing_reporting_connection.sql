-- Backend-only OAuth state and encrypted Bing reporting credentials. No existing data changes.
create table reporting_oauth_states (
  state_hash text primary key check (state_hash ~ '^[0-9a-f]{64}$'),
  provider text not null check (provider = 'bing'),
  site_url text not null,
  client_id text not null,
  redirect_uri text not null,
  user_id uuid not null references users(id) on delete cascade,
  session_id text not null references sessions(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index reporting_oauth_states_expiry on reporting_oauth_states(expires_at);

create table reporting_oauth_connections (
  provider text not null check (provider = 'bing'),
  site_url text not null,
  client_id text not null,
  scope text not null check (scope = 'webmaster.read'),
  refresh_token_enc text not null check (refresh_token_enc like 'v1.%'),
  access_token_enc text not null check (access_token_enc like 'v1.%'),
  access_expires_at timestamptz not null,
  credential_version bigint not null default 1 check (credential_version > 0),
  reauthorization_required boolean not null default false,
  connected_by uuid references users(id) on delete set null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (provider, site_url, client_id)
);

-- These relations must never be exposed through public REST grants or realtime publication.
revoke all on reporting_oauth_states, reporting_oauth_connections from public;
alter table reporting_oauth_states enable row level security;
alter table reporting_oauth_connections enable row level security;
do $$
declare role_name text;
begin
  foreach role_name in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format('revoke all on reporting_oauth_states, reporting_oauth_connections from %I', role_name);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'amc_app') then
    grant select, insert, update, delete on reporting_oauth_states, reporting_oauth_connections to amc_app;
    create policy reporting_oauth_states_backend on reporting_oauth_states for all to amc_app using (true) with check (true);
    create policy reporting_oauth_connections_backend on reporting_oauth_connections for all to amc_app using (true) with check (true);
  end if;
end $$;
