/**
 * `pnpm seo:import-geo`: loads data/seo-geo/{states,cities,places,counties,zctas}.json and
 * data/zip5.json into seo_states, seo_cities, seo_counties and seo_zips, generates the route
 * candidates (seo_routes) and seeds the facts registry (seo_facts). Idempotent: rows are upserted
 * by their natural keys.
 *
 * Census facts (ACS 5-year population and housing units, Gazetteer land area, county time zones)
 * come from places.json, counties.json and zctas.json (bdurand/us_geo, MIT; see
 * data/seo-geo/ATTRIBUTION.md). A city's population is the ACS figure when the city matched a
 * Census place, else the top-1000 list's figure (population_source says which).
 *
 * ZIP attachment: a ZIP belongs to the city whose name GeoNames gives it (cities.json), else to
 * the city whose Census place is the ZCTA's primary place. seo_cities.zips is then rebuilt from
 * seo_zips so both agree.
 *
 * Route generation (site architecture §1.2, §5): never the cartesian product. Candidates are
 *   - metro pairs: the top N cities by population to each other (both directions);
 *   - intrastate pairs: within each state, the top K cities to each other;
 *   - city to state top: every city at or above the page population threshold to its state's
 *     five largest cities (both directions);
 *   - state pairs: every state to every other state (51 × 50 directional pairs).
 * Distance is the haversine between centroids (@amc/server/geo distanceMiles); the move type
 * uses @amc/core classifyMove with the platform's local radius; drive_miles_estimate is the
 * transit model's road-distance estimate (straight line × 1.18).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyMove, distanceBandFor, estimateRoadTransit, isStateCode, type ResolvedLocation } from "@amc/core";
import type { Queryable } from "../db/pool";
import { distanceMiles } from "../geo/geo";
import { NATIONAL_FACTS, STATE_FACTS, type FactSeed } from "./facts";
import { buildCityAttachments, type GeoCityCandidate } from "./geo-zip-attachment";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "..", "data");

type StateRow = { code: string; slug: string; name: string; lat: number; lng: number; zipCount: number; countyCount: number };
type CityTuple = [state: string, slug: string, name: string, county: string, countyFips: string | null, lat: number, lng: number, population: number | null, zips: string[]];
type ZipTuple = [city: string, state: string, countyFips: string, lat: number, lng: number];
type PlaceTuple = [state: string, slug: string, geoid: string, population: number | null, housingUnits: number | null, landAreaSqMi: number | null, fipsClass: string, countyGeoid: string];
type CountyTuple = [fips: string, name: string, state: string, population: number | null, housingUnits: number | null, landAreaSqMi: number | null, timeZone: string | null, cbsa: string | null, central: boolean, lat: number, lng: number];
type ZctaTuple = [population: number | null, housingUnits: number | null, landAreaSqMi: number | null, primaryPlace: string | null];

/** Cities at or above this population get a page and routes to their state's largest cities. */
export const CITY_PAGE_MIN_POPULATION = 10_000;

export interface ImportGeoOptions {
  /** Top cities nationally paired with each other (default 100 → 9,900 directional pairs). */
  metroCount?: number;
  /** Top cities per state paired within the state (default 10). */
  intrastatePerState?: number;
  /** Each city with a page is paired with this many of its state's largest cities (default 5). */
  topPerStateForCities?: number;
  minCityPopulation?: number;
  localMaxMiles?: number;
  log?: (line: string) => void;
}

export interface ImportGeoResult {
  states: number;
  cities: number;
  counties: number;
  zips: number;
  routes: number;
  facts: number;
}

async function batchInsert(db: Queryable, sql: string, rows: unknown[][], columns: number): Promise<void> {
  const chunk = Math.max(1, Math.floor(30_000 / columns));
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const values = slice.map((_, r) => `(${Array.from({ length: columns }, (_, c) => `$${r * columns + c + 1}`).join(", ")})`).join(", ");
    await db.query(sql.replace("%VALUES%", values), slice.flat());
  }
}

const readJson = <T>(name: string): T => JSON.parse(readFileSync(join(dataDir, "seo-geo", name), "utf8")) as T;

export async function importGeo(db: Queryable, options: ImportGeoOptions = {}): Promise<ImportGeoResult> {
  const log = options.log ?? (() => undefined);
  const metroCount = options.metroCount ?? 100;
  const perState = options.intrastatePerState ?? 10;
  const topForCities = options.topPerStateForCities ?? 5;
  const minPop = options.minCityPopulation ?? CITY_PAGE_MIN_POPULATION;
  const localMax = options.localMaxMiles ?? 50;

  const states = readJson<StateRow[]>("states.json");
  const cities = readJson<CityTuple[]>("cities.json");
  const places = readJson<PlaceTuple[]>("places.json");
  const counties = readJson<CountyTuple[]>("counties.json");
  const zctas = readJson<Record<string, ZctaTuple>>("zctas.json");
  const zips = JSON.parse(readFileSync(join(dataDir, "zip5.json"), "utf8")) as Record<string, ZipTuple>;

  // States
  await batchInsert(
    db,
    `insert into seo_states (code, slug, name, lat, lng, zip_count, county_count) values %VALUES%
     on conflict (code) do update set slug = excluded.slug, name = excluded.name, lat = excluded.lat, lng = excluded.lng,
       zip_count = excluded.zip_count, county_count = excluded.county_count, updated_at = now()`,
    states.map((s) => [s.code, s.slug, s.name, s.lat, s.lng, s.zipCount, s.countyCount]),
    7,
  );
  log(`states: ${states.length}`);

  // Counties
  await batchInsert(
    db,
    `insert into seo_counties (fips, name, state_code, population, housing_units, land_area_sqmi, time_zone, cbsa_geoid, central, lat, lng) values %VALUES%
     on conflict (fips) do update set name = excluded.name, state_code = excluded.state_code, population = excluded.population, housing_units = excluded.housing_units,
       land_area_sqmi = excluded.land_area_sqmi, time_zone = excluded.time_zone, cbsa_geoid = excluded.cbsa_geoid, central = excluded.central, lat = excluded.lat, lng = excluded.lng, updated_at = now()`,
    counties.filter((c) => isStateCode(c[2])).map((c) => [c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10]]),
    11,
  );
  log(`counties: ${counties.length}`);

  // Cities, with Census place facts where a place matched
  const placeByCity = new Map(places.map((p) => [`${p[0]}|${p[1]}`, p]));
  await batchInsert(
    db,
    `insert into seo_cities (state_code, slug, name, county_name, county_fips, lat, lng, population, zips, place_geoid, housing_units, land_area_sqmi, fips_class, population_source) values %VALUES%
     on conflict (state_code, slug) do update set name = excluded.name, county_name = excluded.county_name, county_fips = excluded.county_fips,
       lat = excluded.lat, lng = excluded.lng, population = excluded.population, zips = excluded.zips, place_geoid = excluded.place_geoid,
       housing_units = excluded.housing_units, land_area_sqmi = excluded.land_area_sqmi, fips_class = excluded.fips_class, population_source = excluded.population_source, updated_at = now()`,
    cities.map((c) => {
      const p = placeByCity.get(`${c[0]}|${c[1]}`);
      const acs = p?.[3] ?? null;
      const population = acs ?? c[7];
      return [c[0], c[1], c[2], c[3] || null, c[4] ?? (p ? p[7] : null), c[5], c[6], population, c[8], p?.[2] ?? null, p?.[4] ?? null, p?.[5] ?? null, p?.[6] ?? null, population === null ? null : acs !== null ? "acs" : "plotly"];
    }),
    14,
  );
  log(`cities: ${cities.length} (${places.length} with Census place facts)`);

  // Prefer the GeoNames place/state for shared ZIPs, then a stable semantic city key;
  // otherwise attach by the ZCTA's primary Census place. Database row order is irrelevant.
  const cityIds = await db.query<GeoCityCandidate>("select id, state_code, slug, name, zips, place_geoid from seo_cities");
  const { cityByZip, cityByPlace } = buildCityAttachments(cityIds.rows, zips);
  const zipRows: unknown[][] = [];
  let viaPlace = 0;
  for (const [zip, [place, state, countyFips, lat, lng]] of Object.entries(zips)) {
    if (!isStateCode(state)) continue;
    const zcta = zctas[zip];
    let cityId = cityByZip.get(zip) ?? null;
    if (cityId === null && zcta?.[3]) {
      const viaPlaceId = cityByPlace.get(zcta[3]);
      if (viaPlaceId !== undefined) {
        cityId = viaPlaceId;
        viaPlace++;
      }
    }
    zipRows.push([zip, state, cityId, place, countyFips, lat, lng, zcta?.[0] ?? null, zcta?.[1] ?? null, zcta?.[2] ?? null]);
  }
  await batchInsert(
    db,
    `insert into seo_zips (zip, state_code, city_id, place_name, county_fips, lat, lng, population, housing_units, land_area_sqmi) values %VALUES%
     on conflict (zip) do update set state_code = excluded.state_code, city_id = excluded.city_id, place_name = excluded.place_name,
       county_fips = excluded.county_fips, lat = excluded.lat, lng = excluded.lng, population = excluded.population, housing_units = excluded.housing_units, land_area_sqmi = excluded.land_area_sqmi`,
    zipRows,
    10,
  );
  // The city's ZIP list is the set of ZIPs attached to it (name match plus ZCTA primary place).
  await db.query(
    `update seo_cities c set zips = coalesce(z.zips, '{}') from (select city_id, array_agg(zip order by zip) as zips from seo_zips where city_id is not null group by city_id) z where z.city_id = c.id and c.zips is distinct from coalesce(z.zips, '{}')`,
  );
  await db.query(
    `update seo_cities c set population_rank_in_state = r.rank from (
       select id, rank() over (partition by state_code order by population desc, slug) as rank from seo_cities where population is not null
     ) r where r.id = c.id`,
  );
  await db.query(`update seo_cities set population_rank_in_state = null where population is null`);
  await db.query(
    `update seo_states s set city_count = c.n, known_city_population = c.pop, updated_at = now()
     from (select state_code, count(*)::int as n, coalesce(sum(population), 0)::bigint as pop from seo_cities group by state_code) c
     where c.state_code = s.code`,
  );
  log(`zips: ${zipRows.length} (${viaPlace} attached through the ZCTA's primary place)`);

  // Routes
  const cityRows = await db.query<{ id: number; state_code: string; slug: string; lat: number; lng: number; population: number | null; county_fips: string | null; zips: string[] }>(
    "select id, state_code, slug, lat, lng, population, county_fips, zips from seo_cities where population is not null and cardinality(zips) > 0 order by population desc, slug",
  );
  const routes: unknown[][] = [];
  const seen = new Set<string>();
  type C = (typeof cityRows.rows)[number];
  const loc = (c: C): ResolvedLocation => ({ zip: (c.zips[0] ?? "00000") as ResolvedLocation["zip"], city: c.slug, state: c.state_code as ResolvedLocation["state"], countyFips: c.county_fips ?? "00000" });
  const addCityPair = (a: C, b: C, reason: string) => {
    const slug = `${a.slug}-${a.state_code.toLowerCase()}-to-${b.slug}-${b.state_code.toLowerCase()}`;
    if (seen.has(slug)) return;
    seen.add(slug);
    const miles = Math.round(distanceMiles(a, b) * 10) / 10;
    const moveType = classifyMove(loc(a), loc(b), miles, localMax);
    routes.push(["city", slug, a.state_code, b.state_code, a.id, b.id, miles, moveType, moveType === "local" ? null : distanceBandFor(miles), reason, estimateRoadTransit(miles, a.state_code, b.state_code)?.drivingMiles ?? null]);
  };
  const metros = cityRows.rows.slice(0, metroCount);
  for (const a of metros) for (const b of metros) if (a.id !== b.id && a.state_code !== b.state_code) addCityPair(a, b, "metro_pair");
  const byState = new Map<string, C[]>();
  for (const c of cityRows.rows) {
    const list = byState.get(c.state_code) ?? [];
    if (list.length < perState) list.push(c);
    byState.set(c.state_code, list);
  }
  for (const list of byState.values()) for (const a of list) for (const b of list) if (a.id !== b.id) addCityPair(a, b, "intrastate_pair");
  for (const c of cityRows.rows) {
    if ((c.population ?? 0) < minPop) continue;
    for (const top of (byState.get(c.state_code) ?? []).slice(0, topForCities)) {
      if (top.id === c.id) continue;
      addCityPair(c, top, "city_to_state_top");
      addCityPair(top, c, "city_to_state_top");
    }
  }
  for (const a of states) {
    for (const b of states) {
      if (a.code === b.code) continue;
      const slug = `${a.slug}-to-${b.slug}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      const miles = Math.round(distanceMiles(a, b) * 10) / 10;
      routes.push(["state", slug, a.code, b.code, null, null, miles, "interstate", distanceBandFor(miles), "state_pair", estimateRoadTransit(miles, a.code, b.code)?.drivingMiles ?? null]);
    }
  }
  await batchInsert(
    db,
    `insert into seo_routes (kind, slug, origin_state, destination_state, origin_city_id, destination_city_id, distance_miles, move_type, distance_band, reason, drive_miles_estimate)
     values %VALUES%
     on conflict (slug) do update set distance_miles = excluded.distance_miles, move_type = excluded.move_type, distance_band = excluded.distance_band, drive_miles_estimate = excluded.drive_miles_estimate`,
    routes,
    11,
  );
  log(`routes: ${routes.length}`);

  // Facts
  const facts: FactSeed[] = [...NATIONAL_FACTS, ...STATE_FACTS];
  await batchInsert(
    db,
    `insert into seo_facts (scope, topic, claim, source_label, source_url, accessed_on, status, verified_by) values %VALUES%
     on conflict (scope, topic, claim) do update set source_label = excluded.source_label, source_url = excluded.source_url, accessed_on = excluded.accessed_on, status = excluded.status`,
    facts.map((f) => [f.scope, f.topic, f.claim, f.sourceLabel, f.sourceUrl, f.accessedOn, f.verify ? "to_verify" : "verified", "docs/research/content-claims (2026-10-28)"]),
    8,
  );
  log(`facts: ${facts.length}`);

  return { states: states.length, cities: cities.length, counties: counties.length, zips: zipRows.length, routes: routes.length, facts: facts.length };
}
