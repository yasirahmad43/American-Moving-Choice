-- Bundled media stays in Git. Runtime uploads and editorial overrides are durable DB records.
-- No storage.* DDL here: amc_app does not own Supabase's storage schema. Provision the bucket
-- through Supabase Storage with a server credential as described in docs/media/storage.md.
create table media_assets (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]*$'),
  asset jsonb not null check (jsonb_typeof(asset) = 'object' and asset->>'id' = id),
  origin text not null check (origin in ('bundled', 'upload')),
  storage_bucket text,
  storage_objects jsonb not null default '[]'::jsonb check (jsonb_typeof(storage_objects) = 'array'),
  sha256 text unique check (sha256 ~ '^[0-9a-f]{64}$'),
  total_bytes bigint not null default 0 check (total_bytes >= 0),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((origin = 'bundled' and storage_bucket is null and sha256 is null and total_bytes = 0)
    or (origin = 'upload' and storage_bucket is not null and sha256 is not null
        and jsonb_array_length(storage_objects) > 0 and total_bytes > 0))
);

comment on table media_assets is
  'Server-managed media manifest overlay. Uploads have immutable Storage keys; bundled rows store editorial overrides. No browser writes or Supabase Data API exposure.';
-- Like seo_pages, this is accessed through the application server as amc_app. Authorization
-- for mutations is enforced by the existing content-role services and every mutation is audited.
