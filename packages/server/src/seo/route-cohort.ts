import { distanceBandFor, isStateCode } from "@amc/core";
import type { Queryable } from "../db/pool";
import { distanceMiles, lookupZip } from "../geo/geo";
import { routeCensusPlace, routeComparisonSections } from "./route-comparisons";

export const ROUTE_COHORT_REASON = "city_interstate_hub";
export interface RouteEndpoint {
  id: number; stateCode: string; slug: string; name: string; lat: number; lng: number;
  population: number; placeGeoid: string; zips: string[];
}
export interface RouteCohortPair { slug: string; origin: RouteEndpoint; destination: RouteEndpoint; distanceMiles: number }
const key = (city: RouteEndpoint) => `${city.stateCode}|${city.slug}|${city.name.toLowerCase()}`;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** One sourced origin per Census place; nearest out-of-state major-city comparator.
 * This is a geography-based coverage selection, never a claim about route demand or popularity.
 */
export function selectRouteCohort(endpoints: RouteEndpoint[]): RouteCohortPair[] {
  const byPlace = new Map<string, RouteEndpoint>();
  for (const city of [...endpoints].sort((a, b) => compare(key(a), key(b)))) {
    if (!isStateCode(city.stateCode) || city.stateCode === "AK" || city.stateCode === "HI" || city.population < 10_000 || !city.placeGeoid || !Number.isFinite(city.lat) || !Number.isFinite(city.lng) || Math.abs(city.lat) > 90 || Math.abs(city.lng) > 180) continue;
    if (!byPlace.has(city.placeGeoid)) byPlace.set(city.placeGeoid, city);
  }
  const cities = [...byPlace.values()];
  const hubs = [...cities].filter((city) => city.population >= 100_000).sort((a, b) => b.population - a.population || compare(key(a), key(b))).slice(0, 100);
  return cities.flatMap((origin) => {
    const nearest = hubs.filter((city) => city.stateCode !== origin.stateCode).map((city) => ({ city, miles: distanceMiles(origin, city) })).sort((a, b) => a.miles - b.miles || compare(key(a.city), key(b.city)))[0];
    return nearest ? [{ slug: `${origin.slug}-${origin.stateCode.toLowerCase()}-to-${nearest.city.slug}-${nearest.city.stateCode.toLowerCase()}`, origin, destination: nearest.city, distanceMiles: Math.round(nearest.miles * 10) / 10 }] : [];
  });
}

export async function loadRouteCohort(db: Queryable): Promise<RouteCohortPair[]> {
  const rows = await db.query<RouteEndpoint>(`select id,state_code as "stateCode",slug,name,lat,lng,population,place_geoid as "placeGeoid",zips
    from seo_cities where population_source='acs' and population>=10000 and housing_units>0 and land_area_sqmi>0
    and cardinality(zips)>0 and state_code not in ('AK','HI') order by state_code,slug,name`);
  const eligible = rows.rows.filter((city) => routeCensusPlace(city.placeGeoid) && city.zips.some((zip) => lookupZip(zip)?.state === city.stateCode));
  return selectRouteCohort(eligible).filter((pair) => routeComparisonSections(pair.origin, pair.destination).evidence >= 9);
}

/** Only missing candidates are inserted. Existing source rows/reasons and saved content are preserved. */
export async function importRouteCohort(db: Queryable, cohort: RouteCohortPair[], onProgress?: () => Promise<void>): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < cohort.length; i += 100) {
    const batch = cohort.slice(i, i + 100).map((pair) => ({ slug: pair.slug, origin: pair.origin.stateCode, destination: pair.destination.stateCode, originId: pair.origin.id, destinationId: pair.destination.id, miles: pair.distanceMiles, band: distanceBandFor(pair.distanceMiles) }));
    const result = await db.query(`insert into seo_routes(kind,slug,origin_state,destination_state,origin_city_id,destination_city_id,distance_miles,move_type,distance_band,reason,drive_miles_estimate)
      select 'city',slug,origin,destination,"originId","destinationId",miles,'interstate',band,$2,null
      from jsonb_to_recordset($1::jsonb) as r(slug text,origin text,destination text,"originId" integer,"destinationId" integer,miles double precision,band text)
      on conflict(slug) do nothing`, [JSON.stringify(batch), ROUTE_COHORT_REASON]);
    inserted += result.rowCount ?? 0;
    await onProgress?.();
  }
  return inserted;
}
