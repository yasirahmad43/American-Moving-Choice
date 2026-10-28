-- One-time bootstrap for a Supabase project (run before the bundles in db/out/supabase/).
--
-- Run it as the postgres role with the SQL editor or the Supabase connector's execute_sql,
-- not as a recorded migration. Replace :'amc_app_verifier' with a SCRAM-SHA-256 verifier made
-- locally from a generated password:
--   pnpm --filter @amc/db scram-verifier --generate
-- Only the verifier (SCRAM-SHA-256$4096:…) leaves your machine; Postgres stores it as given, so
-- the password itself never appears in SQL editor history, tool transcripts or statement logs.
-- The password goes only into DATABASE_URL in the Vercel project settings.
--
-- Why a separate role and schema (build plan §4, §10):
-- - amc_app owns every AMC object, so the app connects as the owner and row-level security
--   applies only where a table forces it (the CRM tables), exactly as in local tests.
-- - Schema amc is not in the Data API's exposed schemas (public, graphql_public), so no AMC
--   table or function is reachable through PostgREST with the anon or authenticated keys.

create role amc_app login password :'amc_app_verifier' noinherit;

-- Lets postgres run migrations as amc_app (set local role amc_app) so amc_app owns the objects.
grant amc_app to postgres;

create schema if not exists amc authorization amc_app;
revoke all on schema amc from public;

-- Functions such as digest() live in the extensions schema on Supabase.
grant usage on schema extensions to amc_app;

-- Every amc_app session (including pooled ones) resolves AMC objects first.
alter role amc_app set search_path = amc, public, extensions;
