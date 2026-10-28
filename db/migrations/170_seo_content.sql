-- American Moving Choice: programmatic SEO geo entities and content store (migrations 170-179;
-- docs/seo/site-architecture.md §1-§4, §8). Everything public renders from these rows: a page
-- exists only when seo_pages holds it as published, and a page's facts, sources and links are
-- stored with it so the templates never invent anything at render time.
--
-- Tables:
--   seo_states, seo_cities, seo_zips   geo entities, imported by `pnpm seo:import-geo`
--   seo_routes                         generated city/state pairs with haversine distance and band
--   seo_facts                          sourced facts (claim + official source + access date)
--   seo_research                       keywords and questions ingested from research CSVs
--   seo_pages                          the content store (one row per URL)
--   seo_links                          the internal link graph between pages
--   seo_media_usage                    which page holds which media asset (never reused)
--   seo_redirects                      301s for renamed slugs

-- ================================================================ geo entities

create table seo_states (
  code text primary key references states(code),
  slug text not null unique,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  zip_count integer not null check (zip_count >= 0),
  county_count integer not null check (county_count >= 0),
  city_count integer not null default 0 check (city_count >= 0),
  -- Sum of the known populations of the state's cities (the top-1000 list only; never a state total).
  known_city_population bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table seo_cities (
  id serial primary key,
  state_code text not null references states(code),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  county_name text,
  county_fips text check (county_fips ~ '^[0-9]{5}$'),
  lat double precision not null,
  lng double precision not null,
  population integer check (population >= 0),
  zips text[] not null default '{}',
  zip_count integer generated always as (cardinality(zips)) stored,
  -- Rank by population within the state (1 = largest known); null without a population figure.
  population_rank_in_state integer,
  updated_at timestamptz not null default now(),
  unique (state_code, slug)
);
create index seo_cities_population_idx on seo_cities (population desc nulls last);
create index seo_cities_county_idx on seo_cities (county_fips);

create table seo_zips (
  zip text primary key check (zip ~ '^[0-9]{5}$'),
  state_code text not null references states(code),
  city_id integer references seo_cities(id) on delete set null,
  place_name text not null,
  county_fips text not null check (county_fips ~ '^[0-9]{5}$'),
  lat double precision not null,
  lng double precision not null
);
create index seo_zips_city_idx on seo_zips (city_id);
create index seo_zips_state_idx on seo_zips (state_code);
create index seo_zips_county_idx on seo_zips (county_fips);

-- Generated route candidates. kind = 'city' pairs two cities; kind = 'state' pairs two states.
-- A→B and B→A are separate rows (site architecture §0: never canonicalized to each other).
create table seo_routes (
  id serial primary key,
  kind text not null check (kind in ('city', 'state')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  origin_state text not null references states(code),
  destination_state text not null references states(code),
  origin_city_id integer references seo_cities(id) on delete cascade,
  destination_city_id integer references seo_cities(id) on delete cascade,
  distance_miles double precision not null check (distance_miles >= 0),
  -- local (≤ local radius), intrastate, interstate (@amc/core classifyMove)
  move_type text not null check (move_type in ('local', 'intrastate', 'interstate')),
  -- Cost-model distance band (null for local moves).
  distance_band text check (distance_band in ('0_250', '250_500', '500_1000', '1000_1500', '1500_plus')),
  -- Why this pair was generated: metro_pair, intrastate_pair, state_pair, research.
  reason text not null,
  created_at timestamptz not null default now(),
  check ((kind = 'city') = (origin_city_id is not null and destination_city_id is not null))
);
create index seo_routes_origin_idx on seo_routes (origin_state, origin_city_id);
create index seo_routes_destination_idx on seo_routes (destination_state, destination_city_id);

-- ================================================================ facts registry

-- A claim a page may make, with its official source and the date it was read (site architecture
-- §6.2). Scope: national | state:{CODE} | city:{id} | route:{slug} | service:{slug}. Expired or
-- rejected facts never render.
create table seo_facts (
  id serial primary key,
  scope text not null check (scope ~ '^(national|state:[A-Z]{2}|city:[0-9]+|route:[a-z0-9-]+|service:[a-z0-9-]+)$'),
  topic text not null check (topic ~ '^[a-z][a-z0-9_]*$'),   -- regulator, interstate_rules, estimates, insurance, season, ...
  claim text not null,
  source_label text not null,
  source_url text not null check (source_url ~ '^https://'),
  accessed_on date not null,
  status text not null default 'verified' check (status in ('to_verify', 'verified', 'rejected', 'expired')),
  verified_by text,
  recheck_due date,
  created_at timestamptz not null default now(),
  unique (scope, topic, claim)
);
create index seo_facts_scope_idx on seo_facts (scope, status);

-- ================================================================ research

-- Keywords and questions from research CSVs (docs/research/*.csv, docs/seo/keyword-to-page-map.csv).
create table seo_research (
  id serial primary key,
  kind text not null check (kind in ('keyword', 'question')),
  keyword text not null,
  keyword_normalized text not null,
  intent text check (intent in ('informational', 'commercial', 'transactional', 'navigational', 'unknown')),
  geography text,
  family text check (family in ('state', 'city', 'zip', 'route', 'service', 'cost', 'question', 'planning', 'mover-profile')),
  target_url text,
  volume integer check (volume >= 0),
  difficulty integer check (difficulty between 0 and 100),
  cpc_cents integer check (cpc_cents >= 0),
  market text not null default 'us',
  source text not null,
  source_file text not null,
  researched_on date,
  priority text,
  notes text,
  imported_at timestamptz not null default now(),
  unique (keyword_normalized, market, source_file)
);
create index seo_research_family_idx on seo_research (family, target_url);

-- ================================================================ content store

create table seo_pages (
  id uuid primary key default gen_random_uuid(),
  -- Absolute path with a leading and trailing slash, lowercase (site architecture §2.2).
  url text not null unique check (url ~ '^/([a-z0-9]+(-[a-z0-9]+)*/)+$'),
  slug text not null,
  family text not null check (family in ('state', 'city', 'zip', 'route', 'service', 'cost', 'question', 'planning', 'mover-profile')),
  state_code text references states(code),
  city_id integer references seo_cities(id) on delete cascade,
  zip text references seo_zips(zip) on delete cascade,
  route_id integer references seo_routes(id) on delete cascade,
  primary_keyword text not null,
  primary_keyword_normalized text not null,
  intent text not null check (intent in ('informational', 'commercial', 'transactional', 'navigational')),
  supporting_keywords jsonb not null default '[]'::jsonb check (jsonb_typeof(supporting_keywords) = 'array'),
  parent_url text,
  title text not null check (length(title) between 10 and 120),
  meta_description text not null check (length(meta_description) between 40 and 320),
  h1 text not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'ready', 'published')),
  indexable boolean not null default false,
  -- Structured sections (see @amc/server/seo types): intro answer, sections, FAQ, data blocks.
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  -- Share of 5-word shingles found on no other page of the family (G7); null until measured.
  unique_share double precision check (unique_share between 0 and 1),
  -- Distinct data-backed facts the page cites (its evidence count).
  evidence_count integer not null default 0 check (evidence_count >= 0),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  media_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(media_ids) = 'array'),
  -- Why the page is held back ("blocked: insufficient evidence"); null when nothing blocks it.
  blocked_reason text,
  gate_results jsonb not null default '{}'::jsonb check (jsonb_typeof(gate_results) = 'object'),
  reviewed_by text,
  last_reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  -- Last substantive change (content, facts, links): the sitemap lastmod. Never the render time.
  updated_at timestamptz not null default now(),
  canonical_url text not null,
  check (indexable = false or status = 'published'),
  check (canonical_url = url or status <> 'published' or indexable = false)
);
-- Duplicate-intent check: one page per normalized primary keyword and intent.
create unique index seo_pages_keyword_intent_idx on seo_pages (primary_keyword_normalized, intent);
-- Duplicate-content check: two pages may never share a content hash.
create unique index seo_pages_content_hash_idx on seo_pages (content_hash);
create index seo_pages_family_status_idx on seo_pages (family, status, indexable);
create index seo_pages_state_idx on seo_pages (state_code);
create index seo_pages_city_idx on seo_pages (city_id);
create index seo_pages_route_idx on seo_pages (route_id);
create index seo_pages_parent_idx on seo_pages (parent_url);

create function seo_pages_touch() returns trigger language plpgsql
set search_path from current as $$
begin
  if new.content_hash is distinct from old.content_hash
     or new.title is distinct from old.title
     or new.meta_description is distinct from old.meta_description
     or new.sources is distinct from old.sources
     or new.status is distinct from old.status
     or new.indexable is distinct from old.indexable then
    new.updated_at := now();
  end if;
  return new;
end $$;
create trigger seo_pages_touch before update on seo_pages for each row execute function seo_pages_touch();

-- Internal link graph: rendered modules read it, and the crawl checks (orphans, depth) use it.
create table seo_links (
  from_page_id uuid not null references seo_pages(id) on delete cascade,
  to_url text not null,
  -- breadcrumb, child, parent, sibling, nearby, route, reverse_route, service, cost, question, planning, mover
  relation text not null check (relation ~ '^[a-z][a-z0-9_]*$'),
  anchor text not null,
  position integer not null default 0,
  primary key (from_page_id, to_url, relation)
);
create index seo_links_to_idx on seo_links (to_url);

-- One asset, one page (never reuse the same asset on two pages).
create table seo_media_usage (
  media_id text primary key,
  page_id uuid not null references seo_pages(id) on delete cascade,
  assigned_at timestamptz not null default now()
);

-- Permanent redirects for slugs that changed (site architecture §2.5): one hop, checked in CI.
create table seo_redirects (
  source_url text primary key check (source_url ~ '^/'),
  target_url text not null check (target_url ~ '^/'),
  reason text not null,
  created_at timestamptz not null default now(),
  check (source_url <> target_url)
);

-- The public site reads these tables as amc_app (the owner); the admin writes them. No RLS: they
-- hold no personal data.
