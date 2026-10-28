-- American Moving Choice: programmatic SEO expansion (docs/seo/programmatic-pipeline.md, branch
-- seo/expand). Adds the Census facts the expanded page families render (ACS 5-year population and
-- housing units, Gazetteer land area, county time zones), a county table, a persisted shingle
-- index for the uniqueness gate at scale, and widens the route candidate reasons.
--
-- Sources and licences: packages/server/data/seo-geo/ATTRIBUTION.md (bdurand/us_geo, MIT; data
-- from the U.S. Census Bureau 2023 Gazetteer and the 2022 ACS 5-year estimates).

-- ================================================================ counties

create table seo_counties (
  fips text primary key check (fips ~ '^[0-9]{5}$'),
  state_code text not null references states(code),
  name text not null,
  -- ACS 5-year estimates (B01003 population, B25001 housing units); null when the source has none.
  population integer check (population >= 0),
  housing_units integer check (housing_units >= 0),
  land_area_sqmi double precision check (land_area_sqmi >= 0),
  -- IANA time zone of the county seat area (us_geo), e.g. America/Chicago.
  time_zone text,
  cbsa_geoid text,
  central boolean not null default false,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);
create index seo_counties_state_idx on seo_counties (state_code);

-- ================================================================ cities and ZIPs

alter table seo_cities
  add column place_geoid text,
  add column housing_units integer check (housing_units >= 0),
  add column land_area_sqmi double precision check (land_area_sqmi >= 0),
  add column fips_class text,
  -- Where the population figure comes from: 'acs' (ACS 5-year, the vintage in ATTRIBUTION.md) or
  -- 'plotly' (the top-1000 list used before the expansion).
  add column population_source text check (population_source in ('acs', 'plotly'));
create index seo_cities_place_idx on seo_cities (place_geoid);

alter table seo_zips
  add column population integer check (population >= 0),
  add column housing_units integer check (housing_units >= 0),
  add column land_area_sqmi double precision check (land_area_sqmi >= 0);

-- ================================================================ shingle index

-- One row per distinct 5-word shingle (32-bit hash) of a page's main text, per family. The
-- uniqueness gate (site architecture §4.1 G7) counts, for each page, the share of its shingles that
-- no other page of the family holds; keeping the index in the database lets a family of tens of
-- thousands of pages be gated without holding every page's text in memory.
create table seo_shingles (
  family text not null,
  page_url text not null,
  h integer not null
);
create index seo_shingles_family_h_idx on seo_shingles (family, h);
create index seo_shingles_url_idx on seo_shingles (page_url);

-- ================================================================ routes

-- Route candidates now also include every city with a page to its state's largest cities.
alter table seo_routes add column drive_miles_estimate double precision check (drive_miles_estimate >= 0);

-- The public site reads these tables as amc_app (the owner); the admin writes them. No RLS: they
-- hold no personal data.
