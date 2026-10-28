/**
 * `pnpm seo:generate <family> --limit N`: builds a structured brief for each candidate from data
 * (geo tables, Census facts, the facts registry, network coverage, rate cards, research keywords
 * and questions), writes the page's content, runs the automated gates and upserts seo_pages.
 * Nothing is invented: every figure on a page is read from a table or computed from one, and a
 * page whose brief lacks enough distinct facts is stored as draft, indexable = false, with
 * blocked_reason set.
 *
 * Scale: candidates are drafted in chunks (never the whole family in memory). Each page's 5-word
 * shingles are hashed into seo_shingles; after the run, one query counts for every page of the
 * run the share of its shingles that no other page of the family holds (the uniqueness gate,
 * site architecture §4.1 G7), and the status is set: `ready` when every automated gate passes,
 * else `draft`. Human review (G9) is recorded separately (reviewed_by, last_reviewed_at).
 */
import { TRANSIT_MODEL_V1, estimateTransit, type CostRateCard, type MoveType } from "@amc/core";
import type { Queryable } from "../db/pool";
import { countyByFips, distanceMiles, lookupZip } from "../geo/geo";
import { STATES, type StateInfo } from "../geo/states";
import { CATALOG, type CatalogEntry } from "./catalog";
import { FMCSA_LINKS } from "./facts";
import { CITY_PAGE_MIN_POPULATION } from "./geo-import";
import {
  cityCoverage,
  costBlockFor,
  countyLabel,
  loadNetwork,
  moverItems,
  rateCardMoversByState,
  routeCoverage,
  stateCoverage,
  zipCoverage,
  type CoverageCount,
  type NetworkMover,
} from "./network";
import { loadResearch, researchForCity, researchForCityRoute, researchForState, researchForStateRoute, researchForUrl, stateDemand, type ResearchKeyword } from "./research";
import { RESERVED_CITY_SLUGS, normalizeKeyword, slugify, type SeoFamily } from "./slugs";
import { clampDescription, joinAnd, mainText, miles as milesText, n, pick, plural, seedOf, sha256, shingleHashes } from "./text";
import type { ContentBlock, ContentSection, CostBlock, DataPoint, FaqItem, MediaAsset, RelatedGroup, SeoContent, SourceRef } from "./types";

// ------------------------------------------------------------------ shared data

interface StateRec extends StateInfo {
  lat: number;
  lng: number;
  zipCount: number;
  countyCount: number;
  cityCount: number;
}

interface CityRec {
  id: number;
  stateCode: string;
  slug: string;
  name: string;
  countyName: string | null;
  countyFips: string | null;
  lat: number;
  lng: number;
  population: number | null;
  populationSource: "acs" | "plotly" | null;
  housingUnits: number | null;
  landAreaSqMi: number | null;
  fipsClass: string | null;
  zips: string[];
  rank: number | null;
}

interface CountyRec {
  fips: string;
  name: string;
  stateCode: string;
  population: number | null;
  housingUnits: number | null;
  landAreaSqMi: number | null;
  timeZone: string | null;
  cbsa: string | null;
  central: boolean;
}

interface ZipRec {
  zip: string;
  place: string;
  countyFips: string;
  lat: number;
  lng: number;
  cityId: number | null;
  population: number | null;
  housingUnits: number | null;
  landAreaSqMi: number | null;
}

interface RouteRec {
  id: number;
  kind: "city" | "state";
  slug: string;
  originState: string;
  destinationState: string;
  originCityId: number | null;
  destinationCityId: number | null;
  distanceMiles: number;
  moveType: MoveType;
  distanceBand: string | null;
  reason: string;
}

interface Fact {
  scope: string;
  topic: string;
  claim: string;
  sourceLabel: string;
  sourceUrl: string;
  accessedOn: string;
  status: string;
}

interface QuestionRow {
  keyword: string;
  intent: string | null;
  geography: string | null;
  source: string;
  researchedOn: string | null;
}

interface Context {
  db: Queryable;
  today: string;
  states: StateRec[];
  stateByCode: Map<string, StateRec>;
  cities: CityRec[]; // with population, by population desc
  cityById: Map<number, CityRec>;
  citiesByState: Map<string, CityRec[]>;
  grid: CityGrid;
  counties: Map<string, CountyRec>;
  facts: Fact[];
  questions: QuestionRow[];
  network: NetworkMover[];
  research: Awaited<ReturnType<typeof loadResearch>>;
  cardMovers: Map<string, number>;
  cardCache: Map<string, CostRateCard[]>;
  /** Counties per state with their ZIP counts, largest first. */
  countyZips: Map<string, { fips: string; name: string; zips: number }[]>;
  /** Lowest and highest ZIP code per state. */
  zipRange: Map<string, [string, string]>;
  /** Every ZIP of a state with its place, county, centroid and Census facts (loaded once per state). */
  zipsOf: (stateCode: string) => Promise<ZipRec[]>;
  /** Route candidates by origin city id (loaded once). */
  routesFrom: (cityId: number) => Promise<RouteRec[]>;
  media: MediaAsset[];
  usedMedia: Set<string>;
  /** Existing claims by URL, so a regenerated page keeps the assets it already holds. */
  mediaByUrl: Map<string, string[]>;
  log: (line: string) => void;
}

const stateUrl = (s: StateInfo) => `/movers/${s.slug}/`;
const cityUrl = (s: StateInfo, c: CityRec) => `/movers/${s.slug}/${c.slug}/`;
const zipUrl = (s: StateInfo, c: CityRec, zip: string) => `/movers/${s.slug}/${c.slug}/${zip}/`;
const routeUrl = (slug: string) => `/routes/${slug}/`;
const costStateUrl = (s: StateInfo) => `/moving-costs/${s.slug}/`;

export const ACS_VINTAGE = "2022 ACS 5-year estimates";
export const GAZETTEER_VINTAGE = "2023 Census Gazetteer";

const CREDITS = {
  geonames: "ZIP code data from GeoNames, CC BY 4.0.",
  cities: "City data from kelvins/US-Cities-Database (MIT); population from plotly/datasets us-cities-top-1k (MIT).",
  census: `Population and housing units (${ACS_VINTAGE}), land area (${GAZETTEER_VINTAGE}) and county time zones from the U.S. Census Bureau via bdurand/us_geo, MIT License.`,
};

const CENSUS_BASIS = `U.S. Census Bureau, ${ACS_VINTAGE} (via bdurand/us_geo, MIT)`;
const GAZ_BASIS = `U.S. Census Bureau, ${GAZETTEER_VINTAGE} (via bdurand/us_geo, MIT)`;
const TRANSIT_NOTE = `${TRANSIT_MODEL_V1.drivingDistanceFactor}× the straight-line distance (transit-model-v1 planning assumption)`;
const METHOD_NOTE = `Distances are straight-line miles between centroids; road miles are ${TRANSIT_MODEL_V1.drivingDistanceFactor}× that and driving days allow up to ${n(TRANSIT_MODEL_V1.milesPerDrivingDay)} road miles a day (transit-model-v1 planning assumptions, not a delivery window). Coverage counts are recomputed when movers change their rules.`;
const DRIVING_DAYS_NOTE = `at up to ${n(TRANSIT_MODEL_V1.milesPerDrivingDay)} road miles a day (transit-model-v1 planning assumption; loading, unloading and the delivery spread are extra)`;

/** A 1° × 1° grid over city centroids so nearest-city searches never scan every city. */
class CityGrid {
  private cells = new Map<string, CityRec[]>();
  constructor(cities: CityRec[]) {
    for (const c of cities) {
      const key = CityGrid.key(c.lat, c.lng);
      const list = this.cells.get(key);
      if (list) list.push(c);
      else this.cells.set(key, [c]);
    }
  }
  private static key(lat: number, lng: number): string {
    return `${Math.floor(lat)}|${Math.floor(lng)}`;
  }
  /** The `count` nearest cities passing `pred`, by straight-line miles (rings of cells until enough are found). */
  nearest(point: { lat: number; lng: number }, count: number, pred: (c: CityRec) => boolean, maxRings = 30): { city: CityRec; miles: number }[] {
    const lat0 = Math.floor(point.lat);
    const lng0 = Math.floor(point.lng);
    const found: { city: CityRec; miles: number }[] = [];
    for (let r = 0; r <= maxRings; r++) {
      for (let dLat = -r; dLat <= r; dLat++) {
        for (let dLng = -r; dLng <= r; dLng++) {
          if (Math.max(Math.abs(dLat), Math.abs(dLng)) !== r) continue;
          const list = this.cells.get(`${lat0 + dLat}|${lng0 + dLng}`);
          if (!list) continue;
          for (const c of list) if (pred(c)) found.push({ city: c, miles: distanceMiles(point, c) });
        }
      }
      // Everything within r cells is in hand; a city in ring r+1 is at least ~ (r × 50 miles) away (1° latitude ≈ 69 miles, longitude shrinks).
      if (found.length >= count) {
        found.sort((a, b) => a.miles - b.miles);
        if (found[count - 1]!.miles <= r * 45) return found.slice(0, count);
      }
    }
    found.sort((a, b) => a.miles - b.miles);
    return found.slice(0, count);
  }
}

async function loadContext(db: Queryable, options: GenerateOptions): Promise<Context> {
  const stateRows = await db.query<{ code: string; lat: number; lng: number; zip_count: number; county_count: number; city_count: number }>("select code, lat, lng, zip_count, county_count, city_count from seo_states");
  const states: StateRec[] = STATES.map((s) => {
    const row = stateRows.rows.find((r) => r.code === s.code);
    if (!row) throw new Error(`seo_states has no row for ${s.code}; run pnpm seo:import-geo first`);
    return { ...s, lat: row.lat, lng: row.lng, zipCount: row.zip_count, countyCount: row.county_count, cityCount: row.city_count };
  });
  const cityRows = await db.query<{ id: number; state_code: string; slug: string; name: string; county_name: string | null; county_fips: string | null; lat: number; lng: number; population: number | null; population_source: "acs" | "plotly" | null; housing_units: number | null; land_area_sqmi: number | null; fips_class: string | null; zips: string[]; population_rank_in_state: number | null }>(
    "select id, state_code, slug, name, county_name, county_fips, lat, lng, population, population_source, housing_units, land_area_sqmi, fips_class, zips, population_rank_in_state from seo_cities where population is not null order by population desc, slug",
  );
  const cities: CityRec[] = cityRows.rows.map((r) => ({ id: r.id, stateCode: r.state_code, slug: r.slug, name: r.name, countyName: r.county_name, countyFips: r.county_fips, lat: r.lat, lng: r.lng, population: r.population, populationSource: r.population_source, housingUnits: r.housing_units, landAreaSqMi: r.land_area_sqmi, fipsClass: r.fips_class, zips: r.zips, rank: r.population_rank_in_state }));
  const citiesByState = new Map<string, CityRec[]>();
  for (const c of cities) {
    const list = citiesByState.get(c.stateCode);
    if (list) list.push(c);
    else citiesByState.set(c.stateCode, [c]);
  }
  const countyRows = await db.query<{ fips: string; name: string; state_code: string; population: number | null; housing_units: number | null; land_area_sqmi: number | null; time_zone: string | null; cbsa_geoid: string | null; central: boolean }>("select fips, name, state_code, population, housing_units, land_area_sqmi, time_zone, cbsa_geoid, central from seo_counties");
  const counties = new Map(countyRows.rows.map((r) => [r.fips, { fips: r.fips, name: r.name, stateCode: r.state_code, population: r.population, housingUnits: r.housing_units, landAreaSqMi: r.land_area_sqmi, timeZone: r.time_zone, cbsa: r.cbsa_geoid, central: r.central } satisfies CountyRec]));
  const facts = (await db.query<Fact>("select scope, topic, claim, source_label as \"sourceLabel\", source_url as \"sourceUrl\", accessed_on::text as \"accessedOn\", status from seo_facts where status in ('verified', 'to_verify')")).rows;
  const questions = (await db.query<{ keyword: string; intent: string | null; geography: string | null; source: string; researched_on: string | null }>("select keyword, intent, geography, source, researched_on from seo_research where kind = 'question' order by keyword")).rows.map((r) => ({ keyword: r.keyword, intent: r.intent, geography: r.geography, source: r.source, researchedOn: r.researched_on }));
  const usedMedia = new Set((await db.query<{ media_id: string }>("select media_id from seo_media_usage")).rows.map((r) => r.media_id));
  const mediaByUrl = new Map((await db.query<{ url: string; media_ids: string[] }>("select url, media_ids from seo_pages where jsonb_array_length(media_ids) > 0")).rows.map((r) => [r.url, r.media_ids]));
  const countyZipRows = await db.query<{ state_code: string; county_fips: string; n: number }>("select state_code, county_fips, count(*)::int as n from seo_zips group by state_code, county_fips order by state_code, n desc, county_fips");
  const countyZips = new Map<string, { fips: string; name: string; zips: number }[]>();
  for (const r of countyZipRows.rows) countyZips.set(r.state_code, [...(countyZips.get(r.state_code) ?? []), { fips: r.county_fips, name: countyByFips(r.county_fips)?.name ?? r.county_fips, zips: r.n }]);
  const rangeRows = await db.query<{ state_code: string; lo: string; hi: string }>("select state_code, min(zip) as lo, max(zip) as hi from seo_zips group by state_code");
  const zipRange = new Map<string, [string, string]>(rangeRows.rows.map((r) => [r.state_code, [r.lo, r.hi]]));
  const zipCache = new Map<string, ZipRec[]>();
  const zipsOf = async (stateCode: string) => {
    let list = zipCache.get(stateCode);
    if (!list) {
      const rows = await db.query<{ zip: string; place_name: string; county_fips: string; lat: number; lng: number; city_id: number | null; population: number | null; housing_units: number | null; land_area_sqmi: number | null }>("select zip, place_name, county_fips, lat, lng, city_id, population, housing_units, land_area_sqmi from seo_zips where state_code = $1 order by zip", [stateCode]);
      list = rows.rows.map((r) => ({ zip: r.zip, place: r.place_name, countyFips: r.county_fips, lat: r.lat, lng: r.lng, cityId: r.city_id, population: r.population, housingUnits: r.housing_units, landAreaSqMi: r.land_area_sqmi }));
      zipCache.set(stateCode, list);
    }
    return list;
  };
  let routesByOrigin: Map<number, RouteRec[]> | null = null;
  const routesFrom = async (cityId: number) => {
    if (!routesByOrigin) {
      routesByOrigin = new Map();
      const rows = await db.query<{ id: number; kind: "city" | "state"; slug: string; origin_state: string; destination_state: string; origin_city_id: number | null; destination_city_id: number | null; distance_miles: number; move_type: MoveType; distance_band: string | null; reason: string }>("select id, kind, slug, origin_state, destination_state, origin_city_id, destination_city_id, distance_miles, move_type, distance_band, reason from seo_routes where kind = 'city'");
      for (const r of rows.rows) {
        const rec = toRoute(r);
        const list = routesByOrigin.get(r.origin_city_id!);
        if (list) list.push(rec);
        else routesByOrigin.set(r.origin_city_id!, [rec]);
      }
    }
    return routesByOrigin.get(cityId) ?? [];
  };
  return {
    db,
    today: new Date().toISOString().slice(0, 10),
    states,
    stateByCode: new Map(states.map((s) => [s.code, s])),
    cities,
    cityById: new Map(cities.map((c) => [c.id, c])),
    citiesByState,
    grid: new CityGrid(cities),
    counties,
    facts,
    questions,
    network: await loadNetwork(db),
    research: await loadResearch(db),
    cardMovers: await rateCardMoversByState(db),
    cardCache: new Map(),
    countyZips,
    zipRange,
    zipsOf,
    routesFrom,
    media: options.media ?? [],
    usedMedia,
    mediaByUrl,
    log: options.log ?? (() => undefined),
  };
}

const toRoute = (r: { id: number; kind: "city" | "state"; slug: string; origin_state: string; destination_state: string; origin_city_id: number | null; destination_city_id: number | null; distance_miles: number; move_type: MoveType; distance_band: string | null; reason: string }): RouteRec => ({ id: r.id, kind: r.kind, slug: r.slug, originState: r.origin_state, destinationState: r.destination_state, originCityId: r.origin_city_id, destinationCityId: r.destination_city_id, distanceMiles: r.distance_miles, moveType: r.move_type, distanceBand: r.distance_band, reason: r.reason });

const factsFor = (ctx: Context, scope: string, topics?: string[]): Fact[] =>
  ctx.facts.filter((f) => f.scope === scope && (!topics || topics.includes(f.topic))).sort((a, b) => (topics ? topics.indexOf(a.topic) - topics.indexOf(b.topic) : a.topic.localeCompare(b.topic)));

const factsBlock = (facts: Fact[]): ContentBlock => ({
  type: "facts",
  items: facts.map((f) => ({ claim: f.status === "to_verify" ? `${f.claim} [Verify: primary page not yet confirmed.]` : f.claim, source: { label: f.sourceLabel, url: f.sourceUrl, accessedOn: f.accessedOn } })),
});

const sourcesOf = (facts: Fact[]): SourceRef[] => facts.map((f) => ({ label: f.sourceLabel, url: f.sourceUrl, accessedOn: f.accessedOn }));

const paidLine = true;

function nearestStates(ctx: Context, state: StateRec, count: number): { state: StateRec; miles: number }[] {
  return ctx.states
    .filter((s) => s.code !== state.code)
    .map((s) => ({ state: s, miles: distanceMiles(state, s) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, count);
}

/** Nearest cities with a page candidate (population at or above the page threshold). */
function nearestCities(ctx: Context, city: CityRec, count: number, sameState: boolean | null = true, minPopulation = CITY_PAGE_MIN_POPULATION): { city: CityRec; miles: number }[] {
  return ctx.grid.nearest(city, count, (c) => c.id !== city.id && (c.population ?? 0) >= minPopulation && (sameState === null ? true : sameState ? c.stateCode === city.stateCode : c.stateCode !== city.stateCode));
}

const bandOf = (miles: number) => (miles <= 250 ? "up to 250 miles" : miles <= 500 ? "250 to 500 miles" : miles <= 1000 ? "500 to 1,000 miles" : miles <= 1500 ? "1,000 to 1,500 miles" : "more than 1,500 miles");
const classify = (sameState: boolean, miles: number): MoveType => (!sameState ? "interstate" : miles <= 50 ? "local" : "intrastate");
const typeWords: Record<MoveType, string> = { local: "a local move", intrastate: "an in-state long-distance move", interstate: "an interstate move" };
const typeShort = (t: MoveType) => typeWords[t].replace(/^an? /, "");
const mi = (miles: number) => n(Math.round(miles));
/** Eight-point compass direction from a to b ("NE"), from the initial great-circle bearing. */
function compass(a: { lat: number; lng: number }, b: { lat: number; lng: number }): string {
  const rad = Math.PI / 180;
  const dLng = (b.lng - a.lng) * rad;
  const y = Math.sin(dLng) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos(dLng);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8]!;
}
const bandShort = (miles: number) => (miles <= 250 ? "0-250" : miles <= 500 ? "250-500" : miles <= 1000 ? "500-1,000" : miles <= 1500 ? "1,000-1,500" : "1,500+");
const driveText = (miles: number) => `about ${n(estimateTransit(miles).drivingMiles)} road miles`;
const daysText = (miles: number) => {
  const d = estimateTransit(miles).drivingDays;
  return `${d} driving ${d === 1 ? "day" : "days"}`;
};
const density = (population: number | null, landArea: number | null): number | null => (population !== null && landArea && landArea > 0 ? Math.round(population / landArea) : null);
const perUnit = (population: number | null, units: number | null): string | null => (population !== null && units ? (population / units).toFixed(2) : null);
const placeClass = (fipsClass: string | null): string | null => (!fipsClass ? null : fipsClass.startsWith("U") ? "census-designated place (unincorporated)" : fipsClass === "C7" ? "independent city" : fipsClass.startsWith("C") ? "incorporated place" : fipsClass.startsWith("M") ? "military or special place" : null);
const popBasis = (c: CityRec) => (c.populationSource === "acs" ? CENSUS_BASIS : "plotly us-cities-top-1k (MIT), latest published figure");

/** The UTC offset of an IANA zone on a date, in minutes (Node's Intl, no table of our own). */
function tzOffsetMinutes(timeZone: string, date: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
    if (!m) return name === "GMT" ? 0 : null;
    return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
  } catch {
    return null;
  }
}

function tzLabel(timeZone: string | null): string | null {
  if (!timeZone) return null;
  return timeZone.replace(/^America\//, "").replace(/^Pacific\//, "").replace(/_/g, " ").replace(/\//g, ", ");
}

/** "clocks in Denver are one hour behind Chicago" from the two counties' zones, for the date given. */
function tzDifference(a: string | null, b: string | null, aName: string, bName: string, date: Date): string | null {
  if (!a || !b) return null;
  const oa = tzOffsetMinutes(a, date);
  const ob = tzOffsetMinutes(b, date);
  if (oa === null || ob === null) return null;
  const diff = (ob - oa) / 60;
  if (diff === 0) return `${aName} and ${bName} keep the same clock time (${tzLabel(a)}${a !== b ? ` and ${tzLabel(b)}` : ""} zones).`;
  const hours = Math.abs(diff) === 1 ? "one hour" : `${Math.abs(diff)} hours`;
  return `Clocks in ${bName} (${tzLabel(b)}) run ${hours} ${diff > 0 ? "ahead of" : "behind"} ${aName} (${tzLabel(a)}) on ${date.toISOString().slice(0, 10)}.`;
}

function keywordFor(research: ResearchKeyword[], fallback: string, fallbackIntent: "commercial" | "informational"): { keyword: string; intent: "commercial" | "informational" | "transactional" | "navigational"; supporting: string[]; hypothesis: boolean; basis: string } {
  const measured = research.filter((r) => !r.hypothesis && r.volume !== null).sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  const primary = measured[0];
  const allowed = new Set(["commercial", "informational", "transactional", "navigational"]);
  if (primary) {
    const intent = (allowed.has(primary.intent ?? "") ? primary.intent : fallbackIntent) as "commercial" | "informational" | "transactional" | "navigational";
    return {
      keyword: primary.keyword,
      intent,
      supporting: [...new Set(research.filter((r) => r.keyword !== primary.keyword).map((r) => r.keyword))].slice(0, 8),
      hypothesis: false,
      basis: `${primary.source} (${primary.researchedOn ?? "undated"}), ${n(primary.volume ?? 0)}/mo`,
    };
  }
  return { keyword: fallback, intent: fallbackIntent, supporting: [...new Set(research.map((r) => r.keyword))].slice(0, 8), hypothesis: true, basis: "hypothesis: no measured volume for this keyword" };
}

/**
 * Claims at most one hero and one card image for a page, by tag preference, from assets no other
 * page holds (manifest usedOn and seo_media_usage). A page that already holds assets keeps them.
 * When the pool is exhausted the page gets no image: assets are never reused.
 */
function pickMedia(ctx: Context, url: string, preferences: { hero: string[][]; card: string[][] }): string[] {
  const existing = ctx.mediaByUrl.get(url);
  if (existing?.length) return existing;
  if (!ctx.media.length) return [];
  const claimed: string[] = [];
  const claim = (sets: string[][]) => {
    for (const set of sets) {
      const asset = ctx.media.find((m) => m.kind === "image" && !ctx.usedMedia.has(m.id) && !(m.usedOn?.length) && set.every((t) => m.tags.includes(t)));
      if (asset) {
        ctx.usedMedia.add(asset.id);
        claimed.push(asset.id);
        return;
      }
    }
  };
  claim(preferences.hero);
  claim(preferences.card);
  return claimed;
}

const stateTag = (code: string) => `state:${code}`;

// ------------------------------------------------------------------ page drafts

export interface Draft {
  url: string;
  slug: string;
  family: SeoFamily;
  stateCode: string | null;
  cityId: number | null;
  zip: string | null;
  routeId: number | null;
  primaryKeyword: string;
  intent: string;
  supportingKeywords: string[];
  parentUrl: string | null;
  title: string;
  metaDescription: string;
  h1: string;
  content: SeoContent;
  sources: SourceRef[];
  mediaIds: string[];
  evidenceCount: number;
  /** Family-specific blocks found before the generic gates run. */
  blocked: string[];
  keywordBasis: string;
  minEvidence: number;
  _finish?: () => Promise<void>;
}

const coverageSentence = (count: CoverageCount, what: string, place: string) => {
  const e = count.explicit.length;
  const m = count.matched.length;
  if (!m) return `no network mover covers ${what} from ${place}`;
  if (e === m) return `${plural(m, "network mover")} ${m === 1 ? "lists" : "list"} ${place} for ${what}`;
  if (e === 0) return `${plural(m, "network mover")} can receive ${what} from ${place} through rules that don't name it`;
  return `${plural(m, "network mover")} can receive ${what} from ${place}, ${e} naming ${place}`;
};

const moversBlock = (count: CoverageCount, note: (m: NetworkMover) => string, heading: string): ContentBlock => ({ type: "movers", heading, items: moverItems(count.explicit.length ? count.explicit : count.matched, note), paidLine });

const quoteFor = (originZip: string | undefined, destZip: string | undefined, place: string, seed: number) => ({
  entry: "household" as const,
  originZip,
  destZip,
  heading: pick(seed, 11, ["See which movers cover your move", "Check coverage for this move", "Which movers can receive your request?"]),
  text: `Start the quote survey with ${place} filled in. We show the movers that cover your move, by name and USDOT number, before asking for any contact details, and you choose how many may contact you.`,
  cta: pick(seed, 12, ["Start a quote request", "See available movers", "Check my move"]),
});

const cityRouteSlug = (a: CityRec, b: CityRec) => `${a.slug}-${a.stateCode.toLowerCase()}-to-${b.slug}-${b.stateCode.toLowerCase()}`;

/** The place-facts rows a city (or a route endpoint) can state from Census data. */
function placeFactRows(ctx: Context, city: CityRec): string[][] {
  const rows: string[][] = [];
  const county = city.countyFips ? ctx.counties.get(city.countyFips) : undefined;
  if (city.population !== null) rows.push(["Population", n(city.population)]);
  if (city.housingUnits !== null) rows.push(["Housing units", n(city.housingUnits)]);
  const ppu = perUnit(city.population, city.housingUnits);
  if (ppu) rows.push(["Residents per housing unit", ppu]);
  if (city.landAreaSqMi !== null) rows.push(["Land area (sq mi)", `${n(Math.round(city.landAreaSqMi * 10) / 10)}`]);
  const d = density(city.population, city.landAreaSqMi);
  if (d !== null) rows.push(["Density (per sq mi)", n(d)]);
  const cls = placeClass(city.fipsClass);
  if (cls) rows.push(["Census place type", cls]);
  if (county) {
    if (county.population !== null) rows.push([`${county.name} population`, `${n(county.population)}${city.population !== null && county.population > 0 ? ` (${((100 * city.population) / county.population).toFixed(1)}% in ${city.name})` : ""}`]);
    if (county.housingUnits !== null) rows.push([`${county.name} housing units`, n(county.housingUnits)]);
    if (county.timeZone) rows.push(["Time zone", `${tzLabel(county.timeZone)}`]);
  }
  return rows;
}

// ---------------------------------------------------------------- state

function stateDraft(ctx: Context, state: StateRec): Draft {
  const seed = seedOf(state.slug);
  const cities = ctx.citiesByState.get(state.code) ?? [];
  const largest = cities[0];
  const second = cities[1];
  const nearest = nearestStates(ctx, state, 5);
  const farBig = ["CA", "TX", "FL", "NY"].filter((c) => c !== state.code && !nearest.some((x) => x.state.code === c)).slice(0, 3).map((c) => ({ state: ctx.stateByCode.get(c)!, miles: distanceMiles(state, ctx.stateByCode.get(c)!) }));
  const otherZip = nearest[0]?.state ? (ctx.citiesByState.get(nearest[0].state.code)?.[0]?.zips[0] ?? "") : "";
  const coverage = stateCoverage(ctx.network, largest?.zips[0] ?? "", second?.zips[0] ?? largest?.zips[0] ?? "", otherZip);
  const regulator = factsFor(ctx, `state:${state.code}`, ["regulator"]);
  const counties = ctx.countyZips.get(state.code) ?? [];
  const zipRange = ctx.zipRange.get(state.code);
  const kw = keywordFor(researchForState(ctx.research, state.code), `moving companies ${state.name.toLowerCase()}`, "commercial");
  const metroOut = largest ? ctx.grid.nearest(largest, 5, (c) => c.stateCode !== state.code && (c.population ?? 0) >= 200_000) : [];
  const stateCounties = [...ctx.counties.values()].filter((c) => c.stateCode === state.code);
  const statePop = stateCounties.reduce((s, c) => s + (c.population ?? 0), 0);
  const stateUnits = stateCounties.reduce((s, c) => s + (c.housingUnits ?? 0), 0);
  const withPages = cities.filter((c) => (c.population ?? 0) >= CITY_PAGE_MIN_POPULATION);
  const zones = [...new Set(stateCounties.map((c) => c.timeZone).filter((z): z is string => !!z))];

  const dataPoints: DataPoint[] = [
    { label: "ZIP codes", value: n(state.zipCount), basis: "GeoNames postal codes (CC BY 4.0), built 2026-10-28" },
    { label: "Counties", value: n(state.countyCount), basis: "GeoNames county codes, built 2026-10-28" },
    { label: "Movers listing the state (local)", value: n(coverage.local.explicit.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
    { label: "Movers for moves between states", value: n(coverage.interstate.matched.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  if (statePop) dataPoints.push({ label: "Population (sum of counties)", value: n(statePop), basis: CENSUS_BASIS });
  if (stateUnits) dataPoints.push({ label: "Housing units (sum of counties)", value: n(stateUnits), basis: CENSUS_BASIS });
  if (largest?.population) dataPoints.push({ label: "Largest city by population", value: `${largest.name} (${n(largest.population)})`, basis: popBasis(largest) });
  if (withPages.length) dataPoints.push({ label: `Cities of ${n(CITY_PAGE_MIN_POPULATION)} or more`, value: n(withPages.length), basis: CENSUS_BASIS });

  const answerVariants = [
    `${state.name} has ${n(state.zipCount)} ZIP codes across ${n(state.countyCount)} counties${largest ? `, and its largest city by population is ${largest.name}` : ""}${statePop ? ` (${n(statePop)} residents in ${n(stateUnits)} housing units, ${ACS_VINTAGE})` : ""}. As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", state.name)}, and ${coverageSentence(coverage.interstate, "moves between states", state.name)}.`,
    `As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", state.name)}; for moves between states, ${coverageSentence(coverage.interstate, "those moves", state.name)}. ${state.name} spans ${n(state.countyCount)} counties and ${n(state.zipCount)} ZIP codes${largest ? `; ${largest.name} is its largest city` : ""}${withPages.length ? `, and ${plural(withPages.length, "city", "cities")} of ${n(CITY_PAGE_MIN_POPULATION)} people or more have their own pages` : ""}.`,
    `${largest ? `From ${largest.name} to the smallest towns, ${state.name}` : state.name} covers ${n(state.countyCount)} counties and ${n(state.zipCount)} ZIP codes${zipRange ? ` (${zipRange[0]} to ${zipRange[1]})` : ""}${zones.length > 1 ? `, across ${zones.length} time zones` : ""}. On ${ctx.today}, ${coverageSentence(coverage.local, "local moves", state.name)}, while ${coverageSentence(coverage.interstate, "interstate moves", state.name)}.`,
  ];

  const sections: ContentSection[] = [];
  if (cities.length) {
    const top = cities.slice(0, 20);
    sections.push({
      id: "cities",
      heading: pick(seed, 2, [`Cities in ${state.name} with their own pages`, `Where ${state.name} moves start: the largest cities`, `${state.name} cities by population`]),
      blocks: [
        { type: "paragraph", text: `${plural(withPages.length, "city", "cities")} in ${state.name} ${withPages.length === 1 ? "has" : "have"} ${n(CITY_PAGE_MIN_POPULATION)} residents or more and ${withPages.length === 1 ? "its" : "their"} own page${top.length < cities.length ? `; the ${top.length} largest are listed here` : ""}. ${largest ? `${largest.name} alone has ${plural(largest.zips.length, "ZIP code")}${largest.housingUnits ? ` and ${n(largest.housingUnits)} housing units` : ""}` : ""}${second ? `, ${second.name} ${n(second.zips.length)}${second.housingUnits ? ` and ${n(second.housingUnits)}` : ""}` : ""}.` },
        { type: "table", caption: `Population and housing units (${ACS_VINTAGE}), ZIP codes and county`, columns: ["City", "Population", "Housing units", "ZIP codes", "County"], rows: top.map((c) => [`[${c.name}](${cityUrl(state, c)})`, c.population ? n(c.population) : "n/a", c.housingUnits ? n(c.housingUnits) : "n/a", n(c.zips.length), c.countyName ? `${c.countyName} County` : "n/a"]) },
      ],
    });
  }
  if (counties.length) {
    const rows = counties.slice(0, 12).map((c) => {
      const rec = ctx.counties.get(c.fips);
      return [`${c.name} County`, n(c.zips), rec?.population ? n(rec.population) : "n/a", rec?.housingUnits ? n(rec.housingUnits) : "n/a", rec?.timeZone ? tzLabel(rec.timeZone)! : "n/a"];
    });
    sections.push({
      id: "counties",
      heading: pick(seed, 8, [`${state.name} counties by ZIP code count`, `Where ${state.name}'s ZIP codes and people are`, `The ${state.name} counties movers name most`]),
      blocks: [
        { type: "paragraph", text: `Movers name counties in their coverage rules, so a county's ZIP count is a rough measure of how much of the state a county rule covers. ${counties[0]!.name} County holds ${plural(counties[0]!.zips, "ZIP code")}${ctx.counties.get(counties[0]!.fips)?.population ? ` and ${n(ctx.counties.get(counties[0]!.fips)!.population!)} residents` : ""}, ${counties[1] ? `${counties[1].name} County ${n(counties[1].zips)}` : ""}${counties[2] ? ` and ${counties[2].name} County ${n(counties[2].zips)}` : ""}; the twelve largest by ZIP count together hold ${n(counties.slice(0, 12).reduce((s, c) => s + c.zips, 0))} of the state's ${n(state.zipCount)}.` },
        { type: "table", caption: `Population and housing units are ${ACS_VINTAGE}; time zones per county`, columns: ["County", "ZIP codes", "Population", "Housing units", "Time zone"], rows },
      ],
    });
  }
  if (largest && cities.length > 1) {
    const others = cities.slice(1, 7).map((c) => ({ city: c, miles: distanceMiles(largest, c) }));
    sections.push({
      id: "distances",
      heading: pick(seed, 9, [`Distances from ${largest.name} across ${state.name}`, `How far apart ${state.name}'s cities are`, `${largest.name} to the rest of ${state.name}`]),
      blocks: [
        { type: "paragraph", text: `Straight-line miles between city centroids, the figure that decides whether a move counts as local (50 miles or less) or in-state long distance; road miles are estimated at ${TRANSIT_NOTE}. ${others[0] ? `${others[0].city.name} is ${milesText(others[0].miles)} from ${largest.name}` : ""}${others.length > 1 ? `; ${others[others.length - 1]!.city.name} is ${milesText(others[others.length - 1]!.miles)}` : ""}.` },
        { type: "table", columns: [`From ${largest.name} to`, "Straight line", "Est. road miles", "Classified as"], rows: others.map(({ city: c, miles }) => [`[${c.name}](${cityUrl(state, c)})`, milesText(miles), n(estimateTransit(miles).drivingMiles), typeShort(classify(true, miles))]) },
      ],
    });
  }
  sections.push({
    id: "movers",
    heading: pick(seed, 3, [`Movers in our network that cover ${state.name}`, `Who can receive a request starting in ${state.name}`, `${state.name} coverage in the network`]),
    blocks: coverage.local.matched.length || coverage.interstate.matched.length
      ? [
          { type: "paragraph", text: `For a 2-bedroom move starting in ${largest?.name ?? state.name}: ${coverageSentence(coverage.local, "local moves", state.name)}; ${coverageSentence(coverage.intrastate, "in-state long-distance moves", state.name)}; ${coverageSentence(coverage.interstate, "moves between states", state.name)}. Counts are recomputed when coverage changes.` },
          moversBlock(coverage.interstate.matched.length >= coverage.local.matched.length ? coverage.interstate : coverage.local, (m) => (m.basedIn ? `Based in ${m.basedIn.city}, ${m.basedIn.state}` : "Covers moves starting in " + state.name), "Listed movers"),
        ]
      : [{ type: "paragraph", text: `As of ${ctx.today}, no mover in our network lists ${state.name} as a place its moves can start, and this page says so rather than list movers based elsewhere. A request from a ${state.name} ZIP code tells you before any contact details whether that has changed.` }],
  });
  const routeRows = [...nearest, ...farBig].map(({ state: s, miles }) => [`[${state.name} to ${s.name}](${routeUrl(`${state.slug}-to-${s.slug}`)})`, milesText(miles), n(estimateTransit(miles).drivingMiles), bandOf(miles), daysText(miles), `[${s.name} to ${state.name}](${routeUrl(`${s.slug}-to-${state.slug}`)})`]);
  const cityRouteRows = largest ? metroOut.map(({ city: c, miles }) => [`[${largest.name} to ${c.name}, ${c.stateCode}](${routeUrl(cityRouteSlug(largest, c))})`, milesText(miles), n(estimateTransit(miles).drivingMiles), bandOf(miles), daysText(miles), `[${c.name} to ${largest.name}](${routeUrl(cityRouteSlug(c, largest))})`]) : [];
  sections.push({
    id: "routes",
    heading: pick(seed, 4, [`Routes out of and into ${state.name}`, `Moving between ${state.name} and other states`, `${state.name} state-to-state routes`]),
    blocks: [
      { type: "paragraph", text: `Centroid-to-centroid distances (the mean of each state's ZIP centroids), road miles at ${TRANSIT_NOTE}, and driving days ${DRIVING_DAYS_NOTE}. ${nearest[0] ? `${nearest[0].state.name} is the nearest state at ${milesText(nearest[0].miles)}` : ""}${farBig.length ? `, ${farBig[farBig.length - 1]!.state.name} the farthest listed at ${milesText(farBig[farBig.length - 1]!.miles)}` : ""}.` },
      { type: "table", caption: "State-to-state routes and their cost-model band", columns: ["Route", "Centroid distance", "Est. road miles", "Band", "Driving days", "Reverse route"], rows: routeRows },
      ...(cityRouteRows.length ? [{ type: "table" as const, caption: `City routes from ${largest!.name} to large out-of-state metros`, columns: ["Route", "Distance", "Est. road miles", "Band", "Driving days", "Reverse route"], rows: cityRouteRows }] : []),
    ],
  });
  return finishStateDraft(ctx, state, seed, kw, dataPoints, answerVariants, sections, coverage, regulator, largest, second, cities, counties, withPages);
}

function finishStateDraft(ctx: Context, state: StateRec, seed: number, kw: ReturnType<typeof keywordFor>, dataPoints: DataPoint[], answerVariants: string[], sections: ContentSection[], coverage: ReturnType<typeof stateCoverage>, regulator: Fact[], largest: CityRec | undefined, second: CityRec | undefined, cities: CityRec[], counties: { fips: string; name: string; zips: number }[], withPages: CityRec[]): Draft {
  const costs: CostBlock[] = [];
  const draft: Draft = {
    url: stateUrl(state),
    slug: state.slug,
    family: "state",
    stateCode: state.code,
    cityId: null,
    zip: null,
    routeId: null,
    primaryKeyword: kw.keyword,
    intent: kw.intent,
    supportingKeywords: kw.supporting,
    parentUrl: "/movers/",
    title: `Moving Companies in ${state.name} | Screened ${state.name} Movers & Costs`,
    metaDescription: clampDescription(`${state.name} movers screened on their FMCSA record: ${n(coverage.interstate.matched.length)} network movers for moves between states and ${n(coverage.local.explicit.length)} listing the state for local moves as of ${ctx.today}, ${n(state.zipCount)} ZIP codes in ${n(state.countyCount)} counties, ${plural(withPages.length, "city page")}, cost factors and the state's regulator.`),
    h1: `Moving companies in ${state.name}`,
    content: {
      version: 1,
      intro: { answer: pick(seed, 0, answerVariants), dataPoints },
      sections,
      faq: [],
      related: [],
      quote: quoteFor(largest?.zips[0], undefined, `the ZIP code of ${largest?.name ?? state.name}`, seed),
      schemaType: "CollectionPage",
      credits: [CREDITS.geonames, CREDITS.cities, CREDITS.census],
      dataAsOf: ctx.today,
    },
    sources: sourcesOf(regulator).concat([{ label: FMCSA_LINKS.protectYourMove.label, url: FMCSA_LINKS.protectYourMove.url, accessedOn: "2026-10-27" }]),
    mediaIds: pickMedia(ctx, stateUrl(state), { hero: [[stateTag(state.code), "hero"], [stateTag(state.code), "landscape"]], card: [[stateTag(state.code), "card"], [stateTag(state.code), "tile"]] }),
    evidenceCount: 0,
    blocked: [],
    keywordBasis: kw.basis,
    minEvidence: 6,
  };
  draft._finish = async () => {
    const localBlock = await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: 10, moveType: "local", scope: `a local move within ${state.name} (within 50 miles)` }, new Date(), ctx.cardCache);
    const intraMiles = largest && second ? distanceMiles(largest, second) : 120;
    const intraBlock = await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: Math.max(51, intraMiles), moveType: "intrastate", scope: `an in-state long-distance move in ${state.name}${largest && second ? `, for example ${largest.name} to ${second.name} at ${milesText(intraMiles)}` : ""}` }, new Date(), ctx.cardCache);
    costs.push(localBlock, intraBlock);
    const hasRange = costs.some((c) => c.rows.length);
    const cards = ctx.cardMovers.get(state.code) ?? 0;
    // Major in-state routes: the state's top-10 intrastate candidate pairs by combined population.
    const intra = (await ctx.db.query<{ slug: string; origin_city_id: number; destination_city_id: number; distance_miles: number; move_type: MoveType }>("select slug, origin_city_id, destination_city_id, distance_miles, move_type from seo_routes where kind = 'city' and origin_state = $1 and destination_state = $1 and reason = 'intrastate_pair'", [state.code])).rows
      .map((r) => ({ ...r, o: ctx.cityById.get(r.origin_city_id)!, d: ctx.cityById.get(r.destination_city_id)! }))
      .filter((r) => r.o && r.d && r.o.id < r.d.id)
      .sort((a, b) => (b.o.population ?? 0) + (b.d.population ?? 0) - ((a.o.population ?? 0) + (a.d.population ?? 0)))
      .slice(0, 10);
    if (intra.length) {
      draft.content.sections.splice(4, 0, {
        id: "intrastate",
        heading: pick(seed, 10, [`Major moves within ${state.name}`, `The busiest city pairs inside ${state.name}`, `In-state routes between ${state.name}'s largest cities`]),
        blocks: [
          { type: "paragraph", text: `The ${plural(intra.length, "pair")} of ${state.name}'s largest cities by combined population; each direction has its own page. ${intra[0] ? `${intra[0].o.name} to ${intra[0].d.name} is ${milesText(intra[0].distance_miles)} in a straight line (${driveText(intra[0].distance_miles)}), ${typeShort(intra[0].move_type)}` : ""}.` },
          { type: "table", columns: ["Route", "Straight line", "Est. road miles", "Classified as", "Driving days", "Reverse"], rows: intra.map((r) => [`[${r.o.name} to ${r.d.name}](${routeUrl(r.slug)})`, milesText(r.distance_miles), n(estimateTransit(r.distance_miles).drivingMiles), typeShort(r.move_type), r.move_type === "local" ? "same day" : daysText(r.distance_miles), `[${r.d.name} to ${r.o.name}](${routeUrl(cityRouteSlug(r.d, r.o))})`]) },
        ],
      });
    }
    draft.content.sections.push({
      id: "costs",
      heading: pick(seed, 5, [`What moves starting in ${state.name} cost: the data we have`, `Cost factors for ${state.name} moves`, `${state.name} moving cost ranges from rate cards`]),
      blocks: [
        { type: "paragraph", text: hasRange ? `${plural(cards, "mover")} with active rate cards cover ${state.name}; the ranges are the 25th to 75th percentile of what they would charge for a typical job (cost-model-v1, [method](/moving-cost-calculator/method/)). Planning figures, never a quote: movers set their own prices.` : `${cards ? `${plural(cards, "mover")} with a rate card ${cards === 1 ? "covers" : "cover"} ${state.name}` : `No mover has filed a rate card covering ${state.name}`}; five are needed before a range is shown, so the blocks say what is missing.` },
        { type: "cost", block: localBlock },
        { type: "cost", block: intraBlock },
      ],
    });
    draft.content.sections.push({
      id: "rules",
      heading: pick(seed, 6, [`Who regulates movers in ${state.name}`, `${state.name} moving rules: what we have verified`, `Licensing and rules for ${state.name} moves`]),
      blocks: regulator.length
        ? [factsBlock(regulator), { type: "paragraph", text: `A move that leaves ${state.name} falls under FMCSA's rules instead: [what an interstate mover owes you](/questions/what-documents-should-a-mover-give-me/), [the 110% rule](/questions/what-is-the-110-percent-rule/) and [full value protection](/questions/what-is-full-value-protection/). Check any mover on [${FMCSA_LINKS.protectYourMove.label}](${FMCSA_LINKS.protectYourMove.url}).` }]
        : [{ type: "paragraph", text: `We have not yet verified which ${state.name} agency licenses movers for moves within the state, so this page makes no claim about it. A move that leaves ${state.name} falls under FMCSA's rules: [what an interstate mover owes you](/questions/what-documents-should-a-mover-give-me/), [the 110% rule](/questions/what-is-the-110-percent-rule/) and [full value protection](/questions/what-is-full-value-protection/). Check any mover on [${FMCSA_LINKS.protectYourMove.label}](${FMCSA_LINKS.protectYourMove.url}).` }],
    });
    const distLargest = largest && second ? distanceMiles(largest, second) : null;
    const faq: FaqItem[] = [
      { question: `How many ZIP codes and counties does ${state.name} have?`, answer: `${n(state.zipCount)} ZIP codes and ${n(state.countyCount)} counties in the GeoNames postal dataset (built 2026-10-28)${counties[0] ? `; ${counties[0].name} County alone has ${n(counties[0].zips)}` : ""}.` },
      { question: `Which movers in the network cover moves starting in ${state.name}?`, answer: coverage.interstate.matched.length || coverage.local.matched.length ? `As of ${ctx.today}: ${coverageSentence(coverage.local, "local moves", state.name)}, and ${coverageSentence(coverage.interstate, "moves between states", state.name)}. The list above names them; the survey checks your exact ZIP codes.` : `None as of ${ctx.today}. The survey will tell you so before asking for contact details.` },
    ];
    if (largest && second && distLargest !== null) faq.push({ question: `Is a move from ${largest.name} to ${second.name} a local move?`, answer: `${distLargest <= 50 ? "Yes: " : "No: "}the two centroids are ${milesText(distLargest)} apart (${driveText(distLargest)}), so it counts as ${typeWords[classify(true, distLargest)]}${distLargest > 50 ? ", priced by weight and distance rather than by the hour" : ""}.` });
    faq.push({ question: `Who licenses movers for moves within ${state.name}?`, answer: regulator[0] ? `${regulator[0].claim} (Source: ${regulator[0].sourceLabel}, read ${regulator[0].accessedOn}.)` : `We have not verified a ${state.name} regulator yet and won't guess. Interstate moves starting or ending in ${state.name} fall under FMCSA's rules; check the mover's USDOT record before hiring.` });
    faq.push({ question: `Is there a cost range for ${state.name}?`, answer: hasRange ? `Yes, for the move types shown above, from at least five movers' active rate cards (as of ${costs.find((c) => c.rows.length)!.asOf}).` : `Not yet: ${cards} of the five movers' active rate cards a range needs cover ${state.name}.` });
    draft.content.faq = faq;
    const related: RelatedGroup[] = [];
    // Every city with a page candidate (the render keeps only published ones), so no city page is an orphan (site architecture §3.3).
    if (withPages.length) related.push({ heading: `${state.name} city pages`, links: withPages.map((c) => ({ href: cityUrl(state, c), label: `Movers in ${c.name}, ${state.code}`, relation: "child" })) });
    related.push({ heading: "Routes", links: [...nearestStates(ctx, state, 4).map(({ state: s }) => ({ href: routeUrl(`${state.slug}-to-${s.slug}`), label: `${state.name} to ${s.name}`, relation: "route" })), ...nearestStates(ctx, state, 4).map(({ state: s }) => ({ href: routeUrl(`${s.slug}-to-${state.slug}`), label: `${s.name} to ${state.name}`, relation: "route" }))] });
    related.push({ heading: "Costs and services", links: [{ href: costStateUrl(state), label: `Moving costs in ${state.name}`, relation: "cost" }, { href: "/moving-costs/", label: "How much do movers cost?", relation: "cost" }, { href: "/services/local/", label: "Local movers", relation: "service" }, { href: "/services/interstate/", label: "Interstate movers", relation: "service" }] });
    related.push({ heading: "Questions people ask", links: [{ href: "/questions/who-regulates-moving-companies/", label: "Who regulates moving companies?", relation: "question" }, { href: "/questions/what-is-a-binding-estimate/", label: "What is a binding estimate?", relation: "question" }, { href: "/planning/moving-out-of-state-checklist/", label: "Moving out of state checklist", relation: "planning" }, { href: "/verify-a-mover/", label: "Verify a mover", relation: "tool" }] });
    draft.content.related = related;
    draft.evidenceCount = dataPoints.length + regulator.length + costs.filter((c) => c.rows.length).length + Math.min(cities.length, 20) + Math.min(counties.length, 12) + intra.length + 1;
  };
  return draft;
}

// ---------------------------------------------------------------- city

function cityDraft(ctx: Context, city: CityRec): Draft {
  const state = ctx.stateByCode.get(city.stateCode)!;
  const seed = seedOf(`${state.slug}/${city.slug}`);
  const nearby = nearestCities(ctx, city, 12, null);
  const nearestOther = nearestCities(ctx, city, 1, false)[0];
  const coverage = cityCoverage(ctx.network, city.zips[0] ?? "", city.countyFips ?? "", nearestOther?.city.zips[0] ?? "");
  const regulator = factsFor(ctx, `state:${state.code}`, ["regulator"]);
  const accessorials = factsFor(ctx, "national", ["accessorials"]);
  const ambiguous = city.slug !== slugify(city.name);
  const kw = keywordFor(researchForCity(ctx.research, state.slug, state.code, city.slug), `moving companies ${city.name.toLowerCase()}${ambiguous && city.countyName ? ` ${city.countyName.toLowerCase()} county` : ""} ${state.code.toLowerCase()}`, "commercial");
  const county = city.countyName ? `${city.countyName} County` : countyLabel(city.countyFips)?.replace(/, [A-Z]{2}$/, "") ?? "its county";
  const countyRec = city.countyFips ? ctx.counties.get(city.countyFips) : undefined;
  const largestInState = ctx.citiesByState.get(state.code)?.[0];
  const toLargest = largestInState && largestInState.id !== city.id ? distanceMiles(city, largestInState) : null;
  const dens = density(city.population, city.landAreaSqMi);
  const ppu = perUnit(city.population, city.housingUnits);
  const cls = placeClass(city.fipsClass);

  const dataPoints: DataPoint[] = [
    { label: "ZIP codes", value: n(city.zips.length), basis: "GeoNames postal codes (CC BY 4.0), built 2026-10-28" },
    { label: "County", value: county, basis: "GeoNames county of the city's ZIP codes" },
    { label: "Movers naming the county (local)", value: n(coverage.local.explicit.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
    { label: "Movers for moves between states", value: n(coverage.interstate.matched.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  if (city.population) dataPoints.push({ label: "Population", value: n(city.population), basis: popBasis(city) });
  if (city.housingUnits) dataPoints.push({ label: "Housing units", value: n(city.housingUnits), basis: CENSUS_BASIS });
  if (dens !== null) dataPoints.push({ label: "Density", value: `${n(dens)} per sq mi (${n(Math.round(city.landAreaSqMi! * 10) / 10)} sq mi)`, basis: GAZ_BASIS });
  if (countyRec?.timeZone) dataPoints.push({ label: "Time zone", value: tzLabel(countyRec.timeZone)!, basis: `${county} (bdurand/us_geo, MIT)` });
  if (toLargest !== null) dataPoints.push({ label: `Distance to ${largestInState!.name}`, value: `${milesText(toLargest)} (${driveText(toLargest)})`, basis: `Haversine between centroids; road miles ${TRANSIT_NOTE}` });

  const answer = pick(seed, 0, [
    `${city.name} sits in ${county}, ${state.name}, with ${plural(city.zips.length, "ZIP code")}${city.population ? ` and a population of ${n(city.population)}` : ""}${city.housingUnits ? ` in ${n(city.housingUnits)} housing units` : ""}${city.rank ? ` (${ordinal(city.rank)} largest in the state by population)` : ""}. As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", county)}, and ${coverageSentence(coverage.interstate, "moves between states", state.name)}.`,
    `As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", county)}; for moves between states starting in ${state.name}, ${coverageSentence(coverage.interstate, "those moves", state.name)}. ${city.name} covers ${plural(city.zips.length, "ZIP code")} in ${county}${city.population ? ` and has ${n(city.population)} residents` : ""}${dens !== null ? ` at ${n(dens)} per square mile` : ""}${nearby[0] ? `; ${nearby[0].city.name} is the nearest city with a page, ${milesText(nearby[0].miles)} away` : ""}.`,
    `${city.name}, ${state.code}${city.population ? ` (population ${n(city.population)}${city.housingUnits ? `, ${n(city.housingUnits)} housing units` : ""})` : ""} spans ${plural(city.zips.length, "ZIP code")} in ${county}${toLargest !== null ? `, ${milesText(toLargest)} from ${largestInState!.name}` : ""}. On ${ctx.today}, ${coverageSentence(coverage.local, "local moves", county)}, while ${coverageSentence(coverage.interstate, "interstate moves", state.name)}.`,
  ]);

  const nearbyRows = nearby.map(({ city: c, miles }) => {
    const same = c.stateCode === city.stateCode;
    const t = classify(same, miles);
    const dd = density(c.population, c.landAreaSqMi);
    return [`[${c.name}, ${c.stateCode}](${cityUrl(ctx.stateByCode.get(c.stateCode)!, c)})`, mi(miles), compass(city, c), c.population ? n(c.population) : "n/a", c.housingUnits ? n(c.housingUnits) : "n/a", n(estimateTransit(miles).drivingMiles), t === "local" ? "local" : `${t}, ${bandShort(miles)}`, dd !== null ? n(dd) : "n/a"];
  });
  const localCount = nearby.filter(({ city: c, miles }) => c.stateCode === city.stateCode && miles <= 50).length;
  const sections: ContentSection[] = [];
  const factRows = placeFactRows(ctx, city);
  if (factRows.length >= 3) {
    sections.push({
      id: "housing",
      heading: pick(seed, 1, [`${city.name} in numbers: people, homes and land`, `Housing stock and density in ${city.name}`, `What ${city.name}'s Census facts mean for a move`]),
      blocks: [
        { type: "table", caption: `Census facts for ${city.name}${cls ? ` (${cls})` : ""}: population and housing units ${ACS_VINTAGE}, land area ${GAZETTEER_VINTAGE}`, columns: ["Fact", "Value"], rows: factRows },
        { type: "paragraph", text: `${city.population && city.housingUnits ? `${n(city.population)} residents, ${n(city.housingUnits)} housing units (${ppu} per unit)${dens !== null ? `, ${n(Math.round(city.landAreaSqMi! * 10) / 10)} sq mi at ${n(dens)} per sq mi` : ""}. ` : ""}${dens !== null ? (dens >= 5000 ? `Apartments, elevators and limited parking are the norm at this density.` : dens >= 1500 ? `Detached homes and apartments mix at this density, so access varies street by street.` : `Mostly detached homes with driveway access at this density, so home size drives the hours.`) : "Access sets a local move's hours as much as home size does."} Stairs, elevators, long carries and parking are priced as tariff extras${accessorials[0] ? ` ([${accessorials[0].sourceLabel.split(" and ")[0]}](${accessorials[0].sourceUrl}))` : ""}; cost-model-v1 prices by home size ([${state.name} costs](${costStateUrl(state)})).` },
      ],
    });
  }
  const draft: Draft = {
    url: cityUrl(state, city),
    slug: city.slug,
    family: "city",
    stateCode: state.code,
    cityId: city.id,
    zip: null,
    routeId: null,
    primaryKeyword: kw.keyword,
    intent: kw.intent,
    supportingKeywords: kw.supporting,
    parentUrl: stateUrl(state),
    title: `Movers in ${city.name}, ${state.code} | Compare Screened Moving Companies`,
    metaDescription: clampDescription(`${city.name}, ${state.code} movers screened on their FMCSA record: ${n(coverage.local.explicit.length)} network movers name ${county} for local moves and ${n(coverage.interstate.matched.length)} cover interstate moves as of ${ctx.today}; ${plural(city.zips.length, "ZIP code")}${city.population ? `, ${n(city.population)} residents` : ""}, distances, routes and cost factors.`),
    h1: `Movers in ${city.name}, ${state.code}: compare screened moving companies`,
    content: { version: 1, intro: { answer, dataPoints }, sections, faq: [], related: [], quote: quoteFor(city.zips[0], undefined, `${city.name}'s ZIP code ${city.zips[0] ?? ""}`, seed), schemaType: "CollectionPage", credits: [CREDITS.geonames, CREDITS.cities, CREDITS.census], dataAsOf: ctx.today },
    sources: sourcesOf([...regulator, ...accessorials]).concat([{ label: FMCSA_LINKS.protectYourMove.label, url: FMCSA_LINKS.protectYourMove.url, accessedOn: "2026-10-27" }]),
    mediaIds: pickMedia(ctx, cityUrl(state, city), { hero: [[stateTag(state.code), "card"], [stateTag(state.code), "tile"], ["season", "landscape"], ["size", "landscape"]], card: [] }),
    evidenceCount: 0,
    blocked: [],
    keywordBasis: kw.basis,
    minEvidence: 6,
  };
  draft._finish = async () => {
    const localBlock = await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: 10, moveType: "local", scope: `a local move within ${state.name}`, sizes: ["2br"] }, new Date(), ctx.cardCache);
    const interBlock = nearestOther ? await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: nearestOther.miles, moveType: "interstate", scope: `an interstate move from ${state.name}`, sizes: ["2br"] }, new Date(), ctx.cardCache) : null;
    const cards = ctx.cardMovers.get(state.code) ?? 0;
    const twoLocal = localBlock.rows[0];
    const twoInter = interBlock?.rows[0];
    const stateZips = await ctx.zipsOf(state.code);
    const own = new Map(stateZips.filter((z) => z.cityId === city.id).map((z) => [z.zip, z]));
    // ZIP coverage table: every ZIP of the city with its Census facts and the movers naming it (or its county).
    const zipRows = city.zips.slice(0, 60).map((z) => {
      const rec = own.get(z);
      const loc = lookupZip(z);
      const cov = zipCoverage(ctx.network, z);
      return { zip: z, place: rec?.place ?? loc?.city ?? city.name, population: rec?.population ?? null, units: rec?.housingUnits ?? null, land: rec?.landAreaSqMi ?? null, lat: loc?.lat ?? null, lng: loc?.lng ?? null, miles: loc ? distanceMiles(loc, city) : null, naming: cov.explicit.length, matched: cov.matched.length };
    });
    const zipPop = zipRows.reduce((s, r) => s + (r.population ?? 0), 0);
    const biggestZip = [...zipRows].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
    const namedZips = zipRows.filter((r) => r.naming > 0).length;
    const farthestZip = [...zipRows].filter((r) => r.miles !== null).sort((a, b) => b.miles! - a.miles!)[0];
    draft.content.sections.push({
      id: "zips",
      heading: pick(seed, 2, [`${city.name}'s ZIP codes and who covers each`, `ZIP codes in ${city.name}, ${state.code}: coverage by ZIP`, `The ${plural(city.zips.length, "ZIP code")} of ${city.name}, with movers naming each`]),
      blocks: [
        { type: "paragraph", text: `${plural(city.zips.length, "ZIP code")}${city.zips.length > 60 ? " (first 60 listed)" : ""}${zipPop ? `, ${n(zipPop)} people in their tabulation areas (${ACS_VINTAGE})` : ""}. ${biggestZip?.population ? `${biggestZip.zip} is the most populous at ${n(biggestZip.population)}${biggestZip.units ? ` (${n(biggestZip.units)} housing units)` : ""}` : ""}${farthestZip ? `; ${farthestZip.zip} is farthest from the centroid at ${milesText(farthestZip.miles!)}` : ""}. ${namedZips ? `${namedZips} of ${n(zipRows.length)} ${namedZips === 1 ? "is" : "are"} named by a network mover's local rule (ZIP or county) as of ${ctx.today}` : `No network mover's local rule names these ZIP codes or ${county} as of ${ctx.today}`}.` },
        { type: "table", columns: ["ZIP code", "Place name", "Population", "Housing units", "Land (sq mi)", "Density", "From centroid (mi)", "Centroid (lat, lng)", "Movers naming it (local)"], rows: zipRows.map((r) => [r.zip, r.place, r.population !== null ? n(r.population) : "n/a", r.units !== null ? n(r.units) : "n/a", r.land !== null ? r.land.toFixed(2) : "n/a", density(r.population, r.land) !== null ? n(density(r.population, r.land)!) : "n/a", r.miles !== null ? (Math.round(r.miles * 10) / 10).toFixed(1) : "n/a", r.lat !== null ? `${r.lat.toFixed(3)}, ${r.lng!.toFixed(3)}` : "n/a", r.naming ? `${n(r.naming)} of ${n(r.matched)}` : String(r.matched)]) },
      ],
    });
    const nearbyZips = stateZips
      .filter((z) => z.cityId !== city.id)
      .map((z) => ({ ...z, miles: distanceMiles(z, city) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 15);
    if (nearbyZips.length) {
      draft.content.sections.push({
        id: "nearby-zips",
        heading: pick(seed, 7, [`ZIP codes just outside ${city.name}`, `Neighbouring ZIP codes around ${city.name}`, `${city.name}'s nearest ZIP codes in other places`]),
        blocks: [
          { type: "paragraph", text: `${nearbyZips[0]!.zip} (${nearbyZips[0]!.place}) is the nearest ZIP code listed under another place, ${milesText(nearbyZips[0]!.miles)} from the ${city.name} centroid${nearbyZips.length > 1 ? `; ${nearbyZips[nearbyZips.length - 1]!.zip} (${nearbyZips[nearbyZips.length - 1]!.place}) is ${milesText(nearbyZips[nearbyZips.length - 1]!.miles)}` : ""}. A county rule covers those in ${county}; a ZIP rule covers only the ZIP codes it lists.` },
          { type: "table", columns: ["ZIP code", "From centroid (mi)", "Direction", "Place", "County", "Population", "Est. road (mi)", "Housing units", "Land (sq mi)"], rows: nearbyZips.map((z) => [z.zip, (Math.round(z.miles * 10) / 10).toFixed(1), compass(city, z), z.place, countyLabel(z.countyFips)?.replace(/, [A-Z]{2}$/, "") ?? "n/a", z.population !== null ? n(z.population) : "n/a", (Math.round(z.miles * TRANSIT_MODEL_V1.drivingDistanceFactor * 10) / 10).toFixed(1), z.housingUnits !== null ? n(z.housingUnits) : "n/a", z.landAreaSqMi !== null ? z.landAreaSqMi.toFixed(2) : "n/a"]) },
        ],
      });
    }
    draft.content.sections.push({
      id: "nearby",
      heading: pick(seed, 3, [`Nearest cities to ${city.name} with their own pages`, `How far is ${city.name} from nearby cities?`, `Around ${city.name}: the ten nearest cities`]),
      blocks: [
        { type: "paragraph", text: `${localCount ? `${plural(localCount, "city", "cities")} of ${n(CITY_PAGE_MIN_POPULATION)}+ people within ${city.name}'s 50-mile local radius in ${state.name}` : `No city of ${n(CITY_PAGE_MIN_POPULATION)}+ people within ${city.name}'s 50-mile local radius in ${state.name}`}${nearby[0] ? `; nearest is ${nearby[0].city.name}, ${nearby[0].city.stateCode} at ${milesText(nearby[0].miles)} (${driveText(nearby[0].miles)})` : ""}${nearestOther ? `; nearest out of state, ${nearestOther.city.name}, ${nearestOther.city.stateCode} at ${milesText(nearestOther.miles)} (${bandOf(nearestOther.miles)} band)` : ""}.` },
        { type: "table", caption: "Straight-line miles between city centroids, estimated road miles, and how the move is classified", columns: ["City", "Straight line (mi)", "Direction", "Population", "Housing units", "Est. road (mi)", "Classified as, band (mi)", "Density (per sq mi)"], rows: nearbyRows },
      ],
    });
    // The county around the city: its other places with a population figure, largest first.
    const countyMates = city.countyFips ? (ctx.citiesByState.get(state.code) ?? []).filter((c) => c.countyFips === city.countyFips && c.id !== city.id).slice(0, 15) : [];
    if (countyMates.length && countyRec) {
      const countyDens = density(countyRec.population, countyRec.landAreaSqMi);
      draft.content.sections.push({
        id: "county",
        heading: pick(seed, 9, [`${county}: the places around ${city.name}`, `Other places in ${county}`, `${city.name}'s county neighbours`]),
        blocks: [
          { type: "paragraph", text: `${county}${countyRec.population ? ` has ${n(countyRec.population)} residents${countyRec.housingUnits ? ` in ${n(countyRec.housingUnits)} housing units` : ""}` : ""}${countyRec.landAreaSqMi ? ` on ${n(Math.round(countyRec.landAreaSqMi))} sq mi${countyDens !== null ? ` (${n(countyDens)} per sq mi)` : ""}` : ""}; a mover naming the county covers every place below. ${countyMates[0] ? `${countyMates[0].name} is the largest other place at ${n(countyMates[0].population!)}, ${milesText(distanceMiles(city, countyMates[0]))} from ${city.name}` : ""}.` },
          { type: "table", columns: ["Place", `From ${city.name} (mi)`, "Direction", "Population", "Housing units", "Est. road (mi)", "Density", "ZIP codes"], rows: countyMates.map((c) => [(c.population ?? 0) >= CITY_PAGE_MIN_POPULATION ? `[${c.name}](${cityUrl(state, c)})` : c.name, (Math.round(distanceMiles(city, c) * 10) / 10).toFixed(1), compass(city, c), n(c.population!), c.housingUnits ? n(c.housingUnits) : "n/a", (Math.round(distanceMiles(city, c) * TRANSIT_MODEL_V1.drivingDistanceFactor * 10) / 10).toFixed(1), density(c.population, c.landAreaSqMi) !== null ? n(density(c.population, c.landAreaSqMi)!) : "n/a", n(c.zips.length)]) },
        ],
      });
    }
    // Routes from here: the twelve largest destinations among this city's route candidates.
    const routes = (await ctx.routesFrom(city.id)).map((r) => ({ r, d: ctx.cityById.get(r.destinationCityId!)! })).filter((x) => x.d).sort((a, b) => (b.d.population ?? 0) - (a.d.population ?? 0)).slice(0, 12);
    // Plus the largest US cities without a tracked route: distances only (no page to link).
    const tracked = new Set(routes.map((x) => x.d.id));
    const bigMetros = ctx.cities.filter((c) => c.id !== city.id && !tracked.has(c.id)).slice(0, Math.max(0, 14 - routes.length)).map((c) => ({ city: c, miles: distanceMiles(city, c) }));
    const routeRows = [
      ...routes.map(({ r, d }) => [`[${d.name}, ${d.stateCode}](${routeUrl(r.slug)})`, mi(r.distanceMiles), compass(city, d), d.population ? n(d.population) : "n/a", d.housingUnits ? n(d.housingUnits) : "n/a", n(estimateTransit(r.distanceMiles).drivingMiles), r.moveType === "local" ? "local" : `${r.moveType}, ${bandShort(r.distanceMiles)}`, r.moveType === "local" ? "0" : String(estimateTransit(r.distanceMiles).drivingDays)]),
      ...bigMetros.map(({ city: c, miles }) => [`${c.name}, ${c.stateCode}`, mi(miles), compass(city, c), c.population ? n(c.population) : "n/a", c.housingUnits ? n(c.housingUnits) : "n/a", n(estimateTransit(miles).drivingMiles), c.stateCode === city.stateCode && miles <= 50 ? "local" : `${classify(c.stateCode === city.stateCode, miles)}, ${bandShort(miles)}`, c.stateCode === city.stateCode && miles <= 50 ? "0" : String(estimateTransit(miles).drivingDays)]),
    ];
    const cardsHere = ctx.cardMovers.get(state.code) ?? 0;
    if (routeRows.length) {
      draft.content.sections.push({
        id: "routes",
        heading: pick(seed, 8, [`Routes from ${city.name}: the largest destinations`, `Moving from ${city.name} to the biggest cities`, `Where ${city.name} moves go: distance, band and driving days`]),
        blocks: [
          { type: "paragraph", text: `The ${plural(routes.length, "largest destination")} by population among the routes tracked from ${city.name}, each with a page in both directions${bigMetros.length ? `, then the largest US cities for scale` : ""}; ${cardsHere >= 5 ? `${state.name} rate cards support a range on each route page` : `${cardsHere} of the 5 ${state.name} rate cards a route range needs exist`}. ${routes[0] ? `${routes[0].d.name}, ${routes[0].d.stateCode}: ${milesText(routes[0].r.distanceMiles)}, ${driveText(routes[0].r.distanceMiles)}${routes[0].r.moveType !== "local" ? `, ${daysText(routes[0].r.distanceMiles)}` : ""}` : ""}${routes.length > 1 ? `; ${routes[routes.length - 1]!.d.name}, ${routes[routes.length - 1]!.d.stateCode}: ${milesText(routes[routes.length - 1]!.r.distanceMiles)}` : ""}.` },
          { type: "table", columns: ["Destination", "Straight line (mi)", "Direction", "Population", "Housing units", "Est. road (mi)", "Classified as, band (mi)", "Driving days"], rows: routeRows },
          { type: "note", text: METHOD_NOTE },
        ],
      });
    }
    draft.content.sections.push({
      id: "movers",
      heading: pick(seed, 4, [`Movers that name ${county} for local moves`, `Network movers covering ${city.name}`, `Who can receive a ${city.name} request`]),
      blocks: coverage.local.matched.length || coverage.interstate.matched.length
        ? [
            { type: "paragraph", text: `Local coverage counts only rules that name ${county} or a ${city.name} ZIP code, never statewide or nationwide catch-all rules. ${coverageSentence(coverage.local, "local moves", county)}; ${coverageSentence(coverage.interstate, "moves between states", state.name)}.` },
            moversBlock(coverage.local.explicit.length ? coverage.local : coverage.interstate, (m) => (m.basedIn ? `Based in ${m.basedIn.city}, ${m.basedIn.state}` : `Covers ${county}`), coverage.local.explicit.length ? `Movers naming ${county}` : `Movers covering moves between states from ${state.name}`),
          ]
        : [{ type: "paragraph", text: `As of ${ctx.today}, no network mover names ${county} or any of ${city.name}'s ${plural(city.zips.length, "ZIP code")} for local moves, and none covers moves between states from ${state.name}; the page lists none.` }],
    });
    draft.content.sections.push({
      id: "costs",
      heading: pick(seed, 5, [`What a move from ${city.name} costs: the data we have`, `${city.name} moving cost ranges`, `Cost factors for ${city.name} moves`]),
      blocks: [
        {
          type: "paragraph",
          text: twoLocal
            ? `A 2-bedroom local move within ${state.name} ranges from ${twoLocal.low} to ${twoLocal.high} across ${plural(twoLocal.movers, "mover")}' rate cards (as of ${localBlock.asOf}; cost-model-v1 counts cards by origin state, so the figure is state-level, not ${city.name}-specific)${twoInter ? `; an interstate 2-bedroom move of about ${milesText(nearestOther!.miles)}, such as ${city.name} to ${nearestOther!.city.name}, ranges from ${twoInter.low} to ${twoInter.high} across ${plural(twoInter.movers, "mover")}' cards` : ""}. Planning ranges from rate cards, never quotes: [Moving costs in ${state.name}](${costStateUrl(state)}) has every size and move type.`
            : `${cards} of the 5 rate cards a ${city.name} range needs cover ${state.name}, so none is shown; hours, crew and access set a local price, weight and the ${nearestOther ? bandOf(nearestOther.miles) : "distance"} band an interstate one ([Moving costs in ${state.name}](${costStateUrl(state)})).`,
        },
      ],
    });
    draft.content.sections.push({
      id: "rules",
      heading: pick(seed, 6, [`Rules that apply to ${city.name} moves`, `Licensing and your rights on a ${city.name} move`, `Who regulates movers serving ${city.name}`]),
      blocks: [
        {
          type: "paragraph",
          text: regulator.length
            ? `Moves within ${state.name} from ${city.name} are regulated by the state: ${regulator[0]!.claim.split(". ")[0]} ([${regulator[0]!.sourceLabel}](${regulator[0]!.sourceUrl}), read ${regulator[0]!.accessedOn}). A move that crosses the state line follows FMCSA's rules: [the documents an interstate mover owes you](/questions/what-documents-should-a-mover-give-me/) and [the 110% rule](/questions/what-is-the-110-percent-rule/).`
            : `${state.name}'s regulator for in-state moves is not yet verified, so no claim is made for ${city.name}; a move across the state line follows FMCSA Part 375 ([documents owed](/questions/what-documents-should-a-mover-give-me/), [110% rule](/questions/what-is-the-110-percent-rule/), [${FMCSA_LINKS.protectYourMove.label}](${FMCSA_LINKS.protectYourMove.url})).`,
        },
      ],
    });
    draft.content.faq = [
      ...(nearby[0] ? [{ question: `Is moving from ${city.name} to ${nearby[0].city.name} a local move?`, answer: `${nearby[0].city.stateCode === city.stateCode && nearby[0].miles <= 50 ? "Yes" : "No"}: the centroids are ${milesText(nearby[0].miles)} apart (${driveText(nearby[0].miles)}), ${typeWords[classify(nearby[0].city.stateCode === city.stateCode, nearby[0].miles)]}${nearby[0].city.stateCode === city.stateCode && nearby[0].miles <= 50 ? ", priced by the hour" : ", priced by weight and distance"}.` }] : []),
      { question: `How many ZIP codes does ${city.name} have?`, answer: `${plural(city.zips.length, "ZIP code")} in the GeoNames dataset, ${city.zips[0]}${city.zips.length > 1 ? ` to ${city.zips[city.zips.length - 1]}` : ""}${biggestZip?.population ? `; ${biggestZip.zip} holds the most people (${n(biggestZip.population)}, ${ACS_VINTAGE})` : ""}.` },
      ...(city.population && city.housingUnits ? [{ question: `How many homes are there in ${city.name}?`, answer: `${n(city.housingUnits)} housing units for ${n(city.population)} residents (${ACS_VINTAGE}), ${ppu} per unit${dens !== null ? `, at ${n(dens)} people per square mile` : ""}.` }] : []),
      { question: `Which movers cover local moves in ${county}?`, answer: coverage.local.explicit.length ? `As of ${ctx.today}, ${joinAnd(coverage.local.explicit.slice(0, 5).map((m) => m.name))}${coverage.local.explicit.length > 5 ? ` and ${coverage.local.explicit.length - 5} more` : ""} name ${county} or a ${city.name} ZIP code for local moves.` : `None names ${county} for local moves as of ${ctx.today}. ${coverage.interstate.matched.length ? `${plural(coverage.interstate.matched.length, "mover")} cover moves between states starting in ${state.name}.` : "The survey will say so before asking for contact details."}` },
      ...(routes[0] ? [{ question: `How long does a move from ${city.name} to ${routes[0].d.name} take?`, answer: `${milesText(routes[0].r.distanceMiles)} straight line, ${driveText(routes[0].r.distanceMiles)}, ${routes[0].r.moveType === "local" ? "a same-day local move" : `${daysText(routes[0].r.distanceMiles)} for the truck`}; the [delivery spread](/questions/what-is-a-moving-delivery-spread/) is set in the bill of lading.` }] : []),
    ];
    const sameState = nearby.filter(({ city: c }) => c.stateCode === city.stateCode).slice(0, 5);
    draft.content.related = [
      { heading: "Nearby city pages", links: (sameState.length >= 3 ? sameState : nearby.slice(0, 5)).map(({ city: c }) => ({ href: cityUrl(ctx.stateByCode.get(c.stateCode)!, c), label: `Movers in ${c.name}, ${c.stateCode}`, relation: "nearby" })) },
      { heading: `${state.name}`, links: [{ href: stateUrl(state), label: `Moving companies in ${state.name}`, relation: "parent" }, { href: costStateUrl(state), label: `Moving costs in ${state.name}`, relation: "cost" }] },
      { heading: `Routes from ${city.name}`, links: routes.slice(0, 6).map(({ r, d }) => ({ href: routeUrl(r.slug), label: `Moving from ${city.name} to ${d.name}, ${d.stateCode}`, relation: "route" })) },
      { heading: "Services and questions", links: [{ href: "/services/local/", label: "Local movers", relation: "service" }, { href: "/services/packing/", label: "Packing services", relation: "service" }, { href: "/questions/how-much-do-local-movers-cost/", label: "How much do local movers cost?", relation: "question" }, { href: "/questions/how-many-movers-do-i-need/", label: "How many movers do I need?", relation: "question" }, { href: "/planning/moving-day-checklist/", label: "Moving day checklist", relation: "planning" }] },
    ];
    draft.evidenceCount = dataPoints.length + regulator.length + (twoLocal ? 1 : 0) + (twoInter ? 1 : 0) + nearbyRows.length + zipRows.length + routeRows.length + factRows.length + countyMates.length + nearbyZips.length;
  };
  return draft;
}

const ordinal = (k: number) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? "th" : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][k % 10]}`;

// ---------------------------------------------------------------- zip

/** Movers that must name the ZIP or its county before a ZIP page can publish (pipeline decision, 2026-10-28). */
export const ZIP_PAGE_MIN_MOVERS = 2;

function zipDraft(ctx: Context, zip: string, city: CityRec, rec: ZipRec | undefined): Draft {
  const state = ctx.stateByCode.get(city.stateCode)!;
  const seed = seedOf(zip);
  const loc = lookupZip(zip)!;
  const coverage = zipCoverage(ctx.network, zip);
  const toCenter = distanceMiles(loc, city);
  const siblings = city.zips.filter((z) => z !== zip).map((z) => ({ zip: z, miles: distanceMiles(loc, lookupZip(z)!) })).sort((a, b) => a.miles - b.miles);
  const county = countyLabel(loc.countyFips) ?? "its county";
  const cityCounty = city.countyFips;
  const distinctCounty = cityCounty !== null && loc.countyFips !== cityCounty;
  const national = factsFor(ctx, "national", ["accessorials"]);
  const dens = density(rec?.population ?? null, rec?.landAreaSqMi ?? null);
  const share = rec?.population && city.population ? ((100 * rec.population) / city.population).toFixed(1) : null;
  const dataPoints: DataPoint[] = [
    { label: "Place name", value: `${loc.city}, ${loc.state}`, basis: "GeoNames" },
    { label: "County", value: county, basis: "GeoNames" },
    { label: `Distance to the ${city.name} centroid`, value: milesText(toCenter), basis: "Haversine between centroids" },
    { label: "Movers naming this ZIP or county (local)", value: n(coverage.explicit.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  if (rec?.population) dataPoints.push({ label: "Population (ZCTA)", value: n(rec.population), basis: CENSUS_BASIS });
  if (rec?.housingUnits) dataPoints.push({ label: "Housing units (ZCTA)", value: n(rec.housingUnits), basis: CENSUS_BASIS });
  const glance: string[][] = [["Place", `${loc.city}, ${state.name}`], ["County", county + (distinctCounty ? ` (the ${city.name} page's main county is ${city.countyName} County)` : "")], ["Centroid", `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`]];
  if (rec?.population) glance.push(["Population", `${n(rec.population)} (${ACS_VINTAGE})${share ? `, ${share}% of ${city.name}` : ""}`]);
  if (rec?.housingUnits) glance.push(["Housing units", `${n(rec.housingUnits)}${perUnit(rec.population, rec.housingUnits) ? ` (${perUnit(rec.population, rec.housingUnits)} residents per unit)` : ""}`]);
  if (rec?.landAreaSqMi) glance.push(["Land area", `${n(Math.round(rec.landAreaSqMi * 100) / 100)} sq mi${dens !== null ? ` (${n(dens)} people per sq mi)` : ""}`]);
  glance.push([`Other ${city.name} ZIP codes`, n(siblings.length)], ["Nearest ZIP codes", siblings.slice(0, 5).map((s) => `${s.zip} (${milesText(s.miles)})`).join(", ") || "none in this city"]);
  const draft: Draft = {
    url: zipUrl(state, city, zip),
    slug: zip,
    family: "zip",
    stateCode: state.code,
    cityId: city.id,
    zip,
    routeId: null,
    primaryKeyword: `movers ${zip}`,
    intent: "commercial",
    supportingKeywords: [`moving companies ${zip}`, `movers ${loc.city.toLowerCase()} ${zip}`],
    parentUrl: cityUrl(state, city),
    title: `Movers in ${zip} (${loc.city}, ${state.code}) | Screened Local Moving Companies`,
    metaDescription: clampDescription(`ZIP ${zip} in ${county}: ${n(coverage.explicit.length)} network movers name this ZIP code or county for local moves as of ${ctx.today}, ${milesText(toCenter)} from the ${city.name} centroid${rec?.population ? `, ${n(rec.population)} residents` : ""}, with the rules and cost factors that apply.`),
    h1: `Movers in ZIP code ${zip}, ${loc.city}, ${state.code}`,
    content: {
      version: 1,
      intro: {
        answer: pick(seed, 0, [
          `ZIP code ${zip} belongs to ${loc.city} in ${county}, ${milesText(toCenter)} from the ${city.name} centroid${rec?.population ? `, with ${n(rec.population)} residents${rec.housingUnits ? ` in ${n(rec.housingUnits)} housing units` : ""}` : ""}. As of ${ctx.today}, ${coverageSentence(coverage, "local moves", `ZIP ${zip} or ${county}`)}.`,
          `As of ${ctx.today}, ${coverageSentence(coverage, "local moves", `ZIP ${zip} or ${county}`)}. The ZIP sits in ${loc.city}, ${county}, ${milesText(toCenter)} from ${city.name}'s centroid${rec?.population ? `; ${n(rec.population)} people live in its tabulation area (${ACS_VINTAGE})` : ""}.`,
        ]),
        dataPoints,
      },
      sections: [
        { id: "glance", heading: `ZIP ${zip} at a glance`, blocks: [{ type: "table", columns: ["Fact", "Value"], rows: glance }] },
        { id: "movers", heading: `Movers naming ZIP ${zip} or ${county}`, blocks: [{ type: "paragraph", text: `A local request from ${zip} reaches only movers whose rules name this ZIP code or ${county} for local moves. ${coverageSentence(coverage, "local moves", `ZIP ${zip}`)}.` }, moversBlock(coverage, (m) => (m.explicit.some((e) => e.zips.has(zip)) ? `Names ZIP ${zip}` : `Names ${county}`), "Movers")] },
        { id: "rules", heading: "Charges that depend on the address", blocks: [{ type: "paragraph", text: `Stairs, elevators, long carries and parking at a ${zip} address change a local move's hours and an interstate move's tariff charges${dens !== null ? ` (${n(dens)} people per square mile here)` : ""}. Describe them at the survey.` }, factsBlock(national)] },
      ],
      faq: [
        { question: `Is ZIP ${zip} part of ${city.name}?`, answer: `GeoNames lists it under ${loc.city}, ${county}, ${milesText(toCenter)} from the ${city.name} centroid${distinctCounty ? `, in a different county from the city's main county` : ""}${share ? `; its tabulation area holds ${share}% of ${city.name}'s population` : ""}.` },
        { question: `How many movers cover ZIP ${zip}?`, answer: `${plural(coverage.explicit.length, "mover")} name${coverage.explicit.length === 1 ? "s" : ""} it or ${county} for local moves as of ${ctx.today}; ${plural(coverage.matched.length, "mover")} could receive a local request from it.` },
      ],
      related: [
        { heading: "Parent pages", links: [{ href: cityUrl(state, city), label: `Movers in ${city.name}, ${state.code}`, relation: "parent" }, { href: stateUrl(state), label: `Moving companies in ${state.name}`, relation: "parent" }] },
        { heading: "Services", links: [{ href: "/services/local/", label: "Local movers", relation: "service" }, { href: "/questions/do-movers-charge-for-stairs-and-long-carries/", label: "Do movers charge extra for stairs?", relation: "question" }] },
      ],
      quote: quoteFor(zip, undefined, `ZIP ${zip}`, seed),
      schemaType: "CollectionPage",
      credits: [CREDITS.geonames, CREDITS.census],
      dataAsOf: ctx.today,
    },
    sources: sourcesOf(national),
    mediaIds: [],
    evidenceCount: dataPoints.length + national.length + Math.min(siblings.length, 5) + (rec?.landAreaSqMi ? 1 : 0),
    blocked: [],
    keywordBasis: "hypothesis: ZIP-level keywords are not measured",
    minEvidence: 5,
  };
  if (coverage.explicit.length < ZIP_PAGE_MIN_MOVERS) draft.blocked.push(`blocked: insufficient evidence (zip gate: ${coverage.explicit.length} movers name the ZIP or county, ${ZIP_PAGE_MIN_MOVERS} needed)`);
  return draft;
}

// ---------------------------------------------------------------- route

/** Route-relevant questions from the question library, each with the fact topic that answers it. */
const ROUTE_QUESTION_TOPICS: { pattern: RegExp; topic: string; link: string }[] = [
  { pattern: /deliver|delivery window|how many days|how long/i, topic: "bill_of_lading", link: "/questions/what-is-a-moving-delivery-spread/" },
  { pattern: /binding|non-binding|estimate/i, topic: "written_estimate", link: "/questions/what-is-a-binding-estimate/" },
  { pattern: /survey|video|in-home/i, topic: "physical_survey", link: "/questions/does-a-mover-have-to-do-a-survey/" },
  { pattern: /weigh|weight|cubic/i, topic: "weighing", link: "/questions/can-i-watch-my-shipment-being-weighed/" },
  { pattern: /insurance|valuation|released value|full value|breaks/i, topic: "valuation", link: "/questions/what-is-full-value-protection/" },
  { pattern: /deposit/i, topic: "deposits", link: "/questions/how-to-spot-a-moving-scam/" },
  { pattern: /collect at delivery|price jump|more money|110|hostage/i, topic: "rule_110", link: "/questions/what-is-the-110-percent-rule/" },
  { pattern: /bill of lading|order for service|paperwork|booklet|rights and responsibilities/i, topic: "booklets", link: "/questions/what-documents-should-a-mover-give-me/" },
  { pattern: /arbitration|dispute|claim/i, topic: "arbitration", link: "/questions/what-happens-if-my-goods-are-damaged-in-a-move/" },
  { pattern: /complaint/i, topic: "complaints", link: "/questions/how-do-i-file-a-complaint-against-a-mover/" },
  { pattern: /phone|sight unseen|warning sign|scam|legitimate|trade association/i, topic: "red_flags", link: "/questions/how-to-spot-a-moving-scam/" },
];

function routeQuestions(ctx: Context, seed: number, interstate: boolean, count = 3): { question: string; topic: string; link: string; source: string; researchedOn: string | null }[] {
  const pool = ctx.questions
    .filter((q) => (q.intent === "informational" || q.intent === "commercial") && /long distance|interstate|->|national/i.test(q.geography ?? ""))
    .map((q) => {
      const hit = ROUTE_QUESTION_TOPICS.find((t) => t.pattern.test(q.keyword));
      return hit ? { question: q.keyword, topic: hit.topic, link: hit.link, source: q.source, researchedOn: q.researchedOn } : null;
    })
    .filter((q): q is NonNullable<typeof q> => q !== null && (interstate || q.topic !== "rule_110"));
  if (!pool.length) return [];
  const out: typeof pool = [];
  const topics = new Set<string>();
  for (let i = 0; i < pool.length && out.length < count; i++) {
    const q = pool[(seed + i * 7919) % pool.length]!;
    if (topics.has(q.topic) || out.includes(q)) continue;
    topics.add(q.topic);
    out.push(q);
  }
  return out;
}

function routeDraft(ctx: Context, route: RouteRec): Draft {
  const o = ctx.stateByCode.get(route.originState)!;
  const d = ctx.stateByCode.get(route.destinationState)!;
  const oc = route.originCityId ? ctx.cityById.get(route.originCityId) : undefined;
  const dc = route.destinationCityId ? ctx.cityById.get(route.destinationCityId) : undefined;
  const isCity = route.kind === "city";
  const originName = isCity ? `${oc!.name}, ${o.code}` : o.name;
  const destName = isCity ? `${dc!.name}, ${d.code}` : d.name;
  const originShort = isCity ? oc!.name : o.name;
  const destShort = isCity ? dc!.name : d.name;
  const seed = seedOf(route.slug);
  const originZip = isCity ? oc!.zips[0] : ctx.citiesByState.get(o.code)?.[0]?.zips[0];
  const destZip = isCity ? dc!.zips[0] : ctx.citiesByState.get(d.code)?.[0]?.zips[0];
  const coverage = originZip && destZip ? routeCoverage(ctx.network, originZip, destZip, route.moveType) : { matched: [], explicit: [] };
  const originReg = factsFor(ctx, `state:${o.code}`, ["regulator"]);
  const destReg = o.code === d.code ? [] : factsFor(ctx, `state:${d.code}`, ["regulator"]);
  const national = route.moveType === "interstate" ? factsFor(ctx, "national", [pick(seed, 1, ["written_estimate", "physical_survey", "rule_110", "bill_of_lading", "binding_estimate", "valuation", "weighing", "arbitration", "booklets"])]) : factsFor(ctx, "national", ["interstate_scope"]);
  const reverseSlug = isCity ? `${dc!.slug}-${d.code.toLowerCase()}-to-${oc!.slug}-${o.code.toLowerCase()}` : `${d.slug}-to-${o.slug}`;
  const research = isCity ? researchForCityRoute(ctx.research, oc!.slug, dc!.slug) : researchForStateRoute(ctx.research, o.code, d.code, route.slug);
  const kw = keywordFor(research, isCity ? `moving from ${originShort.toLowerCase()} ${o.code.toLowerCase()} to ${destShort.toLowerCase()} ${d.code.toLowerCase()}` : `moving from ${originShort.toLowerCase()} to ${destShort.toLowerCase()}`, "informational");
  const band = route.distanceBand ? bandOf(route.distanceMiles) : null;
  const transit = estimateTransit(route.distanceMiles);
  const oCounty = oc?.countyFips ? ctx.counties.get(oc.countyFips) : undefined;
  const dCounty = dc?.countyFips ? ctx.counties.get(dc.countyFips) : undefined;
  const tzNote = isCity ? tzDifference(oCounty?.timeZone ?? null, dCounty?.timeZone ?? null, originShort, destShort, new Date(`${ctx.today}T12:00:00Z`)) : null;
  const dataPoints: DataPoint[] = [
    { label: "Straight-line distance", value: milesText(route.distanceMiles), basis: `Haversine between ${isCity ? "city" : "state"} centroids (GeoNames)` },
    { label: "Estimated driving distance", value: `${n(transit.drivingMiles)} miles`, basis: TRANSIT_NOTE },
    { label: "Driving days", value: route.moveType === "local" ? "same day" : `${transit.drivingDays}`, basis: DRIVING_DAYS_NOTE },
    { label: "Classified as", value: `${typeShort(route.moveType)}${band ? ` (${band})` : ""}`, basis: "@amc/core classifyMove, 50-mile local radius" },
    { label: "Movers covering this direction", value: n(coverage.matched.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  if (isCity) {
    if (oc!.population && dc!.population) dataPoints.push({ label: "Populations", value: `${originShort} ${n(oc!.population)}; ${destShort} ${n(dc!.population)}`, basis: oc!.populationSource === "acs" && dc!.populationSource === "acs" ? CENSUS_BASIS : "Census ACS and plotly us-cities-top-1k" });
  } else {
    dataPoints.push({ label: "ZIP codes at each end", value: `${o.name} ${n(o.zipCount)}; ${d.name} ${n(d.zipCount)}`, basis: "GeoNames" });
  }
  const answer = pick(seed, 0, [
    `Moving from ${originName} to ${destName} is ${typeWords[route.moveType]} of about ${milesText(route.distanceMiles)} in a straight line, roughly ${n(transit.drivingMiles)} road miles${route.moveType !== "local" ? ` and ${daysText(route.distanceMiles)}` : ""}${band ? `, which the cost model prices in the ${band} band` : ""}. As of ${ctx.today}, ${coverageSentence(coverage, "this direction", originShort)}${route.moveType === "interstate" ? ", and FMCSA's interstate rules apply from the written estimate to delivery" : ""}.`,
    `${originName} to ${destName} measures about ${milesText(route.distanceMiles)} between centroids (${driveText(route.distanceMiles)}), so it is ${typeWords[route.moveType]}${band ? ` in the ${band} band` : ""}${route.moveType !== "local" ? `, ${daysText(route.distanceMiles)} for the truck` : ""}. On ${ctx.today}, ${coverageSentence(coverage, "moves in this direction", originShort)}. The reverse direction has [its own page](${routeUrl(reverseSlug)}).`,
    `About ${milesText(route.distanceMiles)} separate ${originName} and ${destName} in a straight line, ${driveText(route.distanceMiles)} by the transit model's estimate, making this ${typeWords[route.moveType]}${band ? ` (${band})` : ""}. As of ${ctx.today}, ${coverageSentence(coverage, "this route", originShort)}.`,
  ]);
  // Route-specific data: the origin side's largest cities and their distance to the destination, and the destination's largest cities.
  const originCities = (ctx.citiesByState.get(o.code) ?? []).filter((c) => c.id !== oc?.id).slice(0, 8);
  const destCities = (ctx.citiesByState.get(d.code) ?? []).filter((c) => c.id !== dc?.id).slice(0, 8);
  const matrixOrigins = (isCity ? [oc!, ...originCities] : originCities).slice(0, 6);
  const matrixDests = (isCity ? [dc!, ...destCities] : destCities).slice(0, 4);
  const matrixRows = matrixOrigins.map((a) => [`${a.name}, ${a.stateCode}`, ...matrixDests.map((b) => mi(distanceMiles(a, b)))]);
  const destPoint = isCity ? dc! : d;
  const originPoint = isCity ? oc! : o;
  const originRows = originCities.map((c) => [`[${c.name}, ${c.stateCode}](${cityUrl(o, c)})`, c.population ? n(c.population) : "n/a", mi(distanceMiles(c, destPoint)), n(estimateTransit(distanceMiles(c, destPoint)).drivingMiles), bandShort(distanceMiles(c, destPoint))]);
  const destRows = destCities.map((c) => [`[${c.name}, ${c.stateCode}](${cityUrl(d, c)})`, c.population ? n(c.population) : "n/a", n(c.zips.length), mi(distanceMiles(originPoint, c)), n(estimateTransit(distanceMiles(originPoint, c)).drivingMiles), bandShort(distanceMiles(originPoint, c))]);
  const zipCityO = isCity ? oc! : originCities[0];
  const zipCityD = isCity ? dc! : destCities[0];
  const originZipRows = zipCityO ? zipCityO.zips.slice(0, 6).map((z) => { const loc = lookupZip(z)!; return [z, loc.city, mi(distanceMiles(loc, destPoint)), `${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`]; }) : [];
  const destZipRows = zipCityD ? zipCityD.zips.slice(0, 6).map((z) => { const loc = lookupZip(z)!; return [z, loc.city, mi(distanceMiles(originPoint, loc)), `${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`]; }) : [];
  const endRows: string[][] = isCity
    ? [
        ["Page", `[${originName}](${cityUrl(o, oc!)})`, `[${destName}](${cityUrl(d, dc!)})`],
        ["County", oc!.countyName ? `${oc!.countyName} County` : "n/a", dc!.countyName ? `${dc!.countyName} County` : "n/a"],
        ["Population", oc!.population ? `${n(oc!.population)}` : "n/a", dc!.population ? `${n(dc!.population)}` : "n/a"],
        ["Housing units", oc!.housingUnits ? n(oc!.housingUnits) : "n/a", dc!.housingUnits ? n(dc!.housingUnits) : "n/a"],
        ["Density (people per sq mi)", density(oc!.population, oc!.landAreaSqMi) !== null ? n(density(oc!.population, oc!.landAreaSqMi)!) : "n/a", density(dc!.population, dc!.landAreaSqMi) !== null ? n(density(dc!.population, dc!.landAreaSqMi)!) : "n/a"],
        ["ZIP codes", n(oc!.zips.length), n(dc!.zips.length)],
        ["Time zone", oCounty?.timeZone ? tzLabel(oCounty.timeZone)! : "n/a", dCounty?.timeZone ? tzLabel(dCounty.timeZone)! : "n/a"],
      ]
    : [
        ["Page", `[${o.name}](${stateUrl(o)})`, `[${d.name}](${stateUrl(d)})`],
        ["Counties", n(o.countyCount), n(d.countyCount)],
        ["ZIP codes", n(o.zipCount), n(d.zipCount)],
        ["Largest city", ctx.citiesByState.get(o.code)?.[0]?.name ?? "n/a", ctx.citiesByState.get(d.code)?.[0]?.name ?? "n/a"],
        ["Population (sum of counties)", n([...ctx.counties.values()].filter((c) => c.stateCode === o.code).reduce((s, c) => s + (c.population ?? 0), 0)), n([...ctx.counties.values()].filter((c) => c.stateCode === d.code).reduce((s, c) => s + (c.population ?? 0), 0))],
      ];
  const sections: ContentSection[] = [
    { id: "facts", heading: pick(seed, 2, [`${originShort} to ${destShort}: both ends in numbers`, `Route facts: ${originName} to ${destName}`, `What defines the ${originShort} to ${destShort} move`]), blocks: [{ type: "table", caption: isCity ? `${ACS_VINTAGE} population and housing units; ${GAZETTEER_VINTAGE} land area` : "Counts from GeoNames and the Census county table", columns: ["Fact", originShort, destShort], rows: endRows }, { type: "paragraph", text: `${originShort} to ${destShort} measures ${milesText(route.distanceMiles)} centroid to centroid; the transit model's estimate of driving distance is ${n(transit.drivingMiles)} miles (${TRANSIT_NOTE})${route.moveType !== "local" ? `, ${daysText(route.distanceMiles)} ${DRIVING_DAYS_NOTE}` : ""}. A route near a band edge may be priced in the next band.${tzNote ? ` ${tzNote}` : ""} The reverse route, [${destShort} to ${originShort}](${routeUrl(reverseSlug)}), has its own count.` }] },
    ...(originZipRows.length && zipCityO && zipCityD ? [{ id: "zips", heading: pick(seed, 6, [`ZIP codes at each end: ${zipCityO.name} and ${zipCityD.name}`, `${zipCityO.name} and ${zipCityD.name} ZIP codes on this route`]), blocks: [{ type: "paragraph" as const, text: `${zipCityO.name} has ${plural(zipCityO.zips.length, "ZIP code")} and ${zipCityD.name} ${n(zipCityD.zips.length)}; the first six of each, with their straight-line distance to the other end.` }, { type: "table" as const, caption: `${zipCityO.name} ZIP codes`, columns: ["ZIP code", "Place", `To ${destShort} (mi)`, "Centroid"], rows: originZipRows }, { type: "table" as const, caption: `${zipCityD.name} ZIP codes`, columns: ["ZIP code", "Place", `From ${originShort} (mi)`, "Centroid"], rows: destZipRows }] }] : []),
    ...(matrixDests.length && matrixRows.length ? [{ id: "matrix", heading: pick(seed, 8, [`City-to-city distances, ${o.name} to ${d.name}`, `${o.name} cities to ${d.name} cities, in miles`, `Distance table: ${o.name} origins, ${d.name} destinations`]), blocks: [{ type: "paragraph" as const, text: `Straight-line miles from the largest ${o.name} cities to the largest ${d.name} cities. ${matrixRows[0] ? `${matrixOrigins[0]!.name} to ${matrixDests[0]!.name} is ${matrixRows[0][1]}` : ""}${matrixRows.length > 1 && matrixDests.length > 1 ? `; ${matrixOrigins[matrixRows.length - 1]!.name} to ${matrixDests[matrixDests.length - 1]!.name} is ${matrixRows[matrixRows.length - 1]![matrixDests.length]}` : ""}.` }, { type: "table" as const, caption: "Straight-line miles", columns: ["From \\ to", ...matrixDests.map((b) => `${b.name}, ${b.stateCode}`)], rows: matrixRows }] }] : []),
    ...(originRows.length || destRows.length ? [{ id: "cities", heading: pick(seed, 7, [`Other ${o.name} origins and ${d.name} destinations`, `Cities on the ${o.name} to ${d.name} corridor`, `Starting elsewhere in ${o.name}, arriving elsewhere in ${d.name}`]), blocks: [{ type: "paragraph" as const, text: `${originRows[0] ? `From ${originCities[0]!.name}, ${destShort} is ${milesText(distanceMiles(originCities[0]!, destPoint))}` : ""}${destRows[0] ? `; from ${originShort}, ${destCities[0]!.name} is ${milesText(distanceMiles(originPoint, destCities[0]!))}` : ""}. Each city has its own page with the movers that name its county.` }, ...(originRows.length ? [{ type: "table" as const, caption: `${o.name} cities and their distance to ${destShort}`, columns: ["Origin city", "Population", `To ${destShort} (mi)`, "Est. road (mi)", "Band (mi)"], rows: originRows }] : []), ...(destRows.length ? [{ type: "table" as const, caption: `${d.name} cities and their distance from ${originShort}`, columns: ["Destination city", "Population", "ZIP codes", `From ${originShort} (mi)`, "Est. road (mi)", "Band (mi)"], rows: destRows }] : [])] }] : []),
    {
      id: "movers",
      heading: pick(seed, 3, [`Movers covering ${originShort} to ${destShort}`, `Who can receive a ${originShort} to ${destShort} request`, `Directional coverage: ${originShort} → ${destShort}`]),
      blocks: coverage.matched.length
        ? [{ type: "paragraph", text: `${coverageSentence(coverage, `${originShort} to ${destShort} moves`, originShort)} (rules are directional: ${o.name} origins to ${d.name} destinations, or between states from anywhere).` }, moversBlock(coverage, (m) => (m.basedIn ? `Based in ${m.basedIn.city}, ${m.basedIn.state}` : `Covers ${o.name} to ${d.name}`), "Listed movers")]
        : [{ type: "paragraph", text: `As of ${ctx.today}, no mover in our network covers a 2-bedroom move from ${originName} to ${destName}; the survey checks your exact ZIP codes and sizes.` }],
    },
  ];
  const draft: Draft = {
    url: routeUrl(route.slug),
    slug: route.slug,
    family: "route",
    stateCode: o.code,
    cityId: oc?.id ?? null,
    zip: null,
    routeId: route.id,
    primaryKeyword: kw.keyword,
    intent: kw.intent,
    supportingKeywords: kw.supporting,
    parentUrl: "/routes/",
    title: `Moving from ${originShort} to ${destShort}${isCity && (o.code !== d.code || originShort === destShort) ? ` (${o.code} to ${d.code})` : ""}: Costs, Movers & Planning Guide`,
    metaDescription: clampDescription(`${originName} to ${destName}: about ${milesText(route.distanceMiles)} straight line, ${n(transit.drivingMiles)} estimated road miles, ${typeShort(route.moveType)}${band ? ` in the ${band} band` : ""}; ${n(coverage.matched.length)} network movers cover this direction as of ${ctx.today}, with cost ranges where rate cards exist and the rules that apply.`),
    h1: `Moving from ${originName} to ${destName}`,
    content: { version: 1, intro: { answer, dataPoints }, sections, faq: [], related: [], quote: quoteFor(originZip, destZip, `${originShort} and ${destShort} ZIP codes`, seed), schemaType: "Article", credits: [CREDITS.geonames, CREDITS.cities, CREDITS.census], dataAsOf: ctx.today },
    sources: sourcesOf([...originReg, ...destReg, ...national]),
    mediaIds: pickMedia(ctx, routeUrl(route.slug), { hero: [["route", stateTag(o.code)], ["route", stateTag(d.code)], ["route", "hero"], ["route", "landscape"]], card: [] }),
    evidenceCount: 0,
    blocked: [],
    keywordBasis: kw.basis,
    minEvidence: 6,
  };
  draft._finish = async () => {
    const block = await costBlockFor(ctx.db, { originState: o.code, areaName: o.name, miles: route.distanceMiles, moveType: route.moveType, scope: `${typeWords[route.moveType]} from ${o.name} of about ${milesText(route.distanceMiles)} (${originShort} to ${destShort})` }, new Date(), ctx.cardCache);
    draft.content.sections.push({ id: "costs", heading: pick(seed, 4, [`What ${originShort} to ${destShort} costs: rate-card ranges`, `Cost ranges for ${originShort} to ${destShort}`, `${originShort} to ${destShort} moving cost, from the data we have`]), blocks: [{ type: "paragraph", text: block.rows.length ? `${plural(block.rows[0]!.movers, "mover")} with active cards covering ${o.name} price the ${band ?? "local"} band; the 2-bedroom typical shipment is ${block.rows.find((r) => r.homeSize === "2 bedrooms")?.typical ?? block.rows[0]!.typical} (cost-model-v1, [method](/moving-cost-calculator/method/)). Planning figures, never a quote.` : `${ctx.cardMovers.get(o.code) ?? 0} of the five movers' rate cards a ${originShort} to ${destShort} range needs cover ${o.name}, so no figure is shown.` }, { type: "cost", block }] });
    const ruleBlocks: ContentBlock[] = [];
    if (route.moveType === "interstate") ruleBlocks.push({ type: "paragraph", text: `${o.name} to ${d.name} crosses a state line, so FMCSA's rules apply ([every document an interstate mover owes you](/questions/what-documents-should-a-mover-give-me/)); one in full:` }, factsBlock(national));
    else ruleBlocks.push({ type: "paragraph", text: `Both ends are in ${o.name}, so the state's rules apply rather than FMCSA's Part 375 (unless the route crosses another state).` }, factsBlock(national));
    if (originReg.length) ruleBlocks.push({ type: "paragraph", text: `Departure side (${o.name}):` }, factsBlock(originReg));
    if (destReg.length) ruleBlocks.push({ type: "paragraph", text: `Arrival side (${d.name}):` }, factsBlock(destReg));
    if (!originReg.length && !destReg.length) ruleBlocks.push({ type: "note", text: `We have not yet verified the state regulators for ${o.name}${o.code !== d.code ? ` or ${d.name}` : ""}, so this page makes no claim about state licensing. Check any mover's USDOT record on [${FMCSA_LINKS.protectYourMove.label}](${FMCSA_LINKS.protectYourMove.url}).` });
    draft.content.sections.push({ id: "rules", heading: pick(seed, 5, [`Rules on a ${originShort} to ${destShort} move`, `Departure and arrival: what applies`, `Your rights moving from ${o.name} to ${d.name}`]), blocks: ruleBlocks });
    // Questions people ask about long-distance routes, from the question library, answered with this route's figures and a sourced fact.
    const questions = routeQuestions(ctx, seed, route.moveType === "interstate");
    const qFacts = questions.map((q) => ({ q, fact: factsFor(ctx, "national", [q.topic])[0] })).filter((x) => x.fact);
    if (qFacts.length) {
      draft.content.sections.push({
        id: "questions",
        heading: pick(seed, 9, [`Questions people ask about a ${originShort} to ${destShort} move`, `Before you book ${originShort} to ${destShort}`, `${originShort} to ${destShort}: the questions the research turned up`]),
        blocks: qFacts.flatMap(({ q, fact }) => [
          { type: "paragraph" as const, text: `${q.question} For ${originShort} to ${destShort} (${milesText(route.distanceMiles)}, ${driveText(route.distanceMiles)}${route.moveType !== "local" ? `, ${daysText(route.distanceMiles)}` : ""}): ${fact!.claim} ([${fact!.sourceLabel}](${fact!.sourceUrl}), read ${fact!.accessedOn}; more on [this page](${q.link}). Question from ${q.source}${q.researchedOn ? `, ${q.researchedOn}` : ""}.)` },
        ]),
      });
      draft.sources.push(...sourcesOf(qFacts.map((x) => x.fact!)).filter((s) => !draft.sources.some((e) => e.url === s.url)));
    }
    draft.content.faq = [
      { question: `How far is ${originShort} from ${destShort}?`, answer: `About ${milesText(route.distanceMiles)} centroid to centroid (${band ?? "local"} band), an estimated ${n(transit.drivingMiles)} road miles.` },
      ...(route.moveType !== "local" ? [{ question: `How many days does a move from ${originShort} to ${destShort} take?`, answer: `${daysText(route.distanceMiles)} for the truck ${DRIVING_DAYS_NOTE}. The delivery spread an interstate mover commits to is written in the bill of lading; [what a delivery spread is](/questions/what-is-a-moving-delivery-spread/).` }] : []),
      { question: `How many movers cover ${originShort} to ${destShort}?`, answer: `${plural(coverage.matched.length, "mover")} as of ${ctx.today}${coverage.explicit.length ? `, ${coverage.explicit.length} naming ${o.name} explicitly` : ""}.` },
      { question: `What does a ${originShort} to ${destShort} move cost?`, answer: block.rows.length ? `From rate cards covering ${o.name}, as of ${block.asOf}: ${block.rows.map((r) => `${r.homeSize} ${r.low} to ${r.high}`).join("; ")}. Planning ranges, not quotes.` : `No range yet: ${ctx.cardMovers.get(o.code) ?? 0} of five movers' cards cover ${o.name}.` },
    ];
    const otherFromOrigin = isCity
      ? (await ctx.routesFrom(oc!.id)).filter((r) => r.id !== route.id).map((r) => ({ r, d: ctx.cityById.get(r.destinationCityId!)! })).filter((x) => x.d).sort((a, b) => (b.d.population ?? 0) - (a.d.population ?? 0)).slice(0, 4).map(({ r, d: c }) => ({ href: routeUrl(r.slug), label: `${originShort} to ${c.name}, ${c.stateCode}`, relation: "route" }))
      : nearestStates(ctx, o, 3).map(({ state: s }) => ({ href: routeUrl(`${o.slug}-to-${s.slug}`), label: `${o.name} to ${s.name}`, relation: "route" }));
    draft.content.related = [
      { heading: "Reverse and related routes", links: [{ href: routeUrl(reverseSlug), label: `Moving from ${destName} to ${originName}`, relation: "reverse_route" }, ...otherFromOrigin] },
      { heading: "Origin and destination", links: isCity ? [{ href: cityUrl(o, oc!), label: `Movers in ${originName}`, relation: "origin" }, { href: cityUrl(d, dc!), label: `Movers in ${destName}`, relation: "destination" }, { href: stateUrl(o), label: `Moving companies in ${o.name}`, relation: "origin_state" }, ...(o.code !== d.code ? [{ href: stateUrl(d), label: `Moving companies in ${d.name}`, relation: "destination_state" }] : [])] : [{ href: stateUrl(o), label: `Moving companies in ${o.name}`, relation: "origin_state" }, { href: stateUrl(d), label: `Moving companies in ${d.name}`, relation: "destination_state" }, { href: costStateUrl(o), label: `Moving costs in ${o.name}`, relation: "cost" }] },
      { heading: "Services and questions", links: [{ href: route.moveType === "interstate" ? "/services/interstate/" : route.moveType === "local" ? "/services/local/" : "/services/long-distance/", label: route.moveType === "interstate" ? "Interstate movers" : route.moveType === "local" ? "Local movers" : "Long-distance movers", relation: "service" }, { href: route.moveType === "local" ? "/moving-costs/local/" : "/moving-costs/long-distance/", label: route.moveType === "local" ? "Local moving costs" : "Long-distance moving costs", relation: "cost" }, { href: "/questions/what-is-a-moving-delivery-spread/", label: "What is a delivery spread?", relation: "question" }, { href: "/questions/what-is-the-110-percent-rule/", label: "What is the 110% rule?", relation: "question" }, { href: "/planning/moving-out-of-state-checklist/", label: "Moving out of state checklist", relation: "planning" }] },
    ];
    draft.evidenceCount = dataPoints.length + endRows.length + national.length + originReg.length + destReg.length + (block.rows.length ? 1 : 0) + originRows.length + destRows.length + originZipRows.length + destZipRows.length + matrixRows.length * matrixDests.length + qFacts.length + (tzNote ? 1 : 0);
  };
  return draft;
}

// ---------------------------------------------------------------- service / question / planning (catalog)

function catalogDraft(ctx: Context, entry: CatalogEntry): Draft {
  const url = `/${entry.family === "service" ? "services" : entry.family === "question" ? "questions" : "planning"}/${entry.slug}/`;
  const seed = seedOf(url);
  const facts = factsFor(ctx, "national", entry.factTopics);
  const research = researchForUrl(ctx.research, url).concat(ctx.research.filter((r) => normalizeKeyword(r.keyword) === normalizeKeyword(entry.primaryKeyword)).map((r) => ({ keyword: r.keyword, intent: r.intent, volume: r.volume, difficulty: r.difficulty, source: r.source, researchedOn: r.researched_on, hypothesis: r.volume === null })));
  const measured = research.find((r) => !r.hypothesis);
  const dataPoints: DataPoint[] = [];
  const sections: ContentSection[] = entry.sections.map((s, i) => ({ id: `s${i + 1}`, heading: s.heading, blocks: [...s.blocks] }));
  if (entry.network) {
    const movers = ctx.network.filter((m) => (entry.network!.moveType ? m.profile.capabilities.moveTypes.includes(entry.network!.moveType) : true) && (entry.network!.service ? m.profile.capabilities.services.includes(entry.network!.service) : true));
    const byState = new Map<string, number>();
    for (const m of movers) for (const e of m.explicit) for (const s of e.states) byState.set(s, (byState.get(s) ?? 0) + 1);
    for (const m of movers) for (const e of m.explicit) for (const c of e.counties) {
      const st = ctx.states.find((s) => c.startsWith(s.fips));
      if (st) byState.set(st.code, (byState.get(st.code) ?? 0) + 1);
    }
    const what = entry.network.service ? `offer ${entry.network.service.replace("_", " ")}` : `take ${typeShort(entry.network.moveType!)}s`;
    dataPoints.push({ label: `Network movers that ${what}`, value: n(movers.length), basis: `American Moving Choice capabilities, ${ctx.today}` });
    const stateRows = [...byState.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, count]) => [`[${ctx.stateByCode.get(code)!.name}](${stateUrl(ctx.stateByCode.get(code)!)})`, n(count)]);
    sections.push({
      id: "network",
      heading: pick(seed, 2, ["Where the network covers this today", "Coverage in our network, by state", "Network coverage as of today"]),
      blocks: movers.length
        ? [{ type: "paragraph", text: `As of ${ctx.today}, ${plural(movers.length, "mover")} in our network ${what} (${joinAnd(movers.slice(0, 4).map((m) => `[${m.name}](/companies/${m.slug}/)`))}${movers.length > 4 ? ` and ${movers.length - 4} more` : ""}). The table counts the coverage rules that name each state on the origin side; a request from your ZIP code gets the exact answer.` }, ...(stateRows.length ? [{ type: "table" as const, columns: ["State", "Rules naming it"], rows: stateRows }] : [])]
        : [{ type: "paragraph", text: `As of ${ctx.today}, no mover in our network ${what}. We say so rather than imply coverage; the survey tells you before any contact details whether that has changed.` }],
    });
  }
  if (facts.length) sections.push({ id: "facts", heading: pick(seed, 3, ["The rules behind this answer", "What the regulations say", "Sources: the rules, read on the dates shown"]), blocks: [factsBlock(facts)] });
  const draft: Draft = {
    url,
    slug: entry.slug,
    family: entry.family,
    stateCode: null,
    cityId: null,
    zip: null,
    routeId: null,
    primaryKeyword: entry.primaryKeyword,
    intent: entry.intent,
    supportingKeywords: [...new Set([...entry.supportingKeywords, ...research.filter((r) => r.keyword !== entry.primaryKeyword).map((r) => r.keyword)])].slice(0, 8),
    parentUrl: `/${url.split("/")[1]}/`,
    title: entry.title,
    metaDescription: clampDescription(entry.metaDescription),
    h1: entry.h1,
    content: {
      version: 1,
      intro: { answer: entry.answer, dataPoints },
      sections,
      faq: entry.faq,
      related: [],
      quote: { entry: "household", heading: pick(seed, 11, ["See which movers cover your move", "Check coverage for your move"]), text: "The quote survey shows the movers that cover your route, by name and USDOT number, before asking for any contact details. You choose how many may contact you.", cta: pick(seed, 12, ["Start a quote request", "See available movers"]) },
      schemaType: "Article",
      credits: [],
      dataAsOf: ctx.today,
    },
    sources: sourcesOf(facts),
    mediaIds: pickMedia(ctx, url, { hero: entry.family === "service" ? [[`service:${entry.slug}`, "hero"], [`service:${entry.slug}`], ["services", "landscape"]] : entry.family === "question" ? [["questions", "landscape"], ["trust", "landscape"]] : [["planning", "landscape"], ["theme:checklist"]], card: [] }),
    evidenceCount:
      facts.length +
      dataPoints.length +
      entry.sections.reduce((sum, s) => sum + s.blocks.filter((b) => b.type === "table" || b.type === "list").length, 0) +
      // References to the platform's own published rules (verification, consent, money) count as sourced claims.
      new Set((JSON.stringify(entry.sections) + entry.answer).match(/\]\((\/(?:how-we-verify-movers|which-companies-receive-my-request|advertising-disclosure|movers-vs-brokers|review-methodology|moving-cost-calculator\/method)\/)\)/g) ?? []).size,
    blocked: [],
    keywordBasis: measured ? `${measured.source} (${measured.researchedOn ?? "undated"}), ${n(measured.volume ?? 0)}/mo` : "hypothesis: no measured volume for this keyword",
    minEvidence: 1,
  };
  const links = entry.related.map((ref) => {
    const [kind, slug] = ref.split(":") as [string, string];
    if (kind === "movers") return { href: "/movers/", label: "Movers by state", relation: "hub" };
    if (kind === "cost") return { href: `/moving-costs/${slug}/`, label: slug === "local" ? "Local moving costs" : "Long-distance moving costs", relation: "cost" };
    const target = CATALOG.find((e) => e.family === kind && e.slug === slug);
    if (!target) return null;
    return { href: `/${kind === "service" ? "services" : kind === "question" ? "questions" : "planning"}/${slug}/`, label: target.h1, relation: kind };
  }).filter((l): l is { href: string; label: string; relation: string } => l !== null);
  draft.content.related = [{ heading: "Related", links }];
  return draft;
}

// ---------------------------------------------------------------- cost

async function costDrafts(ctx: Context, limit: number): Promise<Draft[]> {
  const drafts: Draft[] = [];
  const withData = ctx.states.filter((s) => (ctx.cardMovers.get(s.code) ?? 0) >= 5);
  const without = ctx.states.filter((s) => (ctx.cardMovers.get(s.code) ?? 0) < 5);
  // National spokes
  for (const kind of ["local", "long-distance"] as const) {
    const moveType: MoveType = kind === "local" ? "local" : "interstate";
    const rows: [string, string, string, string][] = [];
    const blocks: ContentBlock[] = [];
    let asOf: string | null = null;
    for (const s of withData) {
      const block = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: kind === "local" ? 10 : 750, moveType, scope: `${typeWords[moveType]} starting in ${s.name}${kind === "local" ? " (within 50 miles)" : " of about 750 miles"}`, sizes: ["2br"] }, new Date(), ctx.cardCache);
      const row = block.rows[0];
      if (row) {
        rows.push([`[${s.name}](${costStateUrl(s)})`, `${row.low} to ${row.high}`, n(row.movers), block.asOf]);
        if (!asOf || block.asOf < asOf) asOf = block.asOf;
      }
    }
    const url = `/moving-costs/${kind}/`;
    const seed = seedOf(url);
    const facts = factsFor(ctx, "national", kind === "local" ? ["interstate_scope", "accessorials", "labor_wages"] : ["written_estimate", "rule_110", "weighing", "volume_pricing"]);
    const kw = keywordFor(researchForUrl(ctx.research, url), kind === "local" ? "local moving costs" : "long distance moving costs", "informational");
    const answer = kind === "local"
      ? `Local movers price by the hour per crew plus a travel fee, so a local move's cost follows home size (crew and hours), access and extras. ${rows.length ? `As of ${asOf}, our rate cards support a 2-bedroom local range in ${plural(rows.length, "state")}: ${rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ")}.` : `As of ${ctx.today}, no state has the five movers' rate cards a local range needs, so this page explains the method and shows no figure.`} Planning ranges only, never a quote.`
      : `Long-distance moves are priced by shipment weight and distance band rather than by the hour. ${rows.length ? `As of ${asOf}, our rate cards support a 2-bedroom range for a 750-mile interstate move from ${plural(rows.length, "state")}: ${rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ")}.` : `As of ${ctx.today}, no state has the five movers' rate cards a long-distance range needs, so this page explains the method and shows no figure.`} Planning ranges only, never a quote.`;
    blocks.push({ type: "paragraph", text: `cost-model-v1 builds a typical job from the medians of what an area's movers state for a home size, prices each mover on that job with its own rates, and shows the 25th to 75th percentile rounded outward${kind === "local" ? " to $50" : " to $100"}. It needs at least five different movers' active cards for the origin state, and cards older than 12 months don't count. [Method](/moving-cost-calculator/method/).` });
    if (rows.length) blocks.push({ type: "table", caption: `2-bedroom ${kind === "local" ? "local move (within 50 miles)" : "interstate move of about 750 miles (500 to 1,000 band)"}, by origin state`, columns: ["Origin state", "Range", "Movers", "Cards as of"], rows });
    blocks.push({ type: "paragraph", text: `States without a range (${n(without.length)}): ${without.length ? `fewer than five movers' active rate cards cover ${kind === "local" ? "local" : "interstate"} moves there. ${without.slice(0, 8).map((s) => s.name).join(", ")}${without.length > 8 ? ` and ${without.length - 8} more` : ""}.` : "none."} A range appears for a state once enough cards exist; we never estimate one.` });
    drafts.push({
      url,
      slug: kind,
      family: "cost",
      stateCode: null,
      cityId: null,
      zip: null,
      routeId: null,
      primaryKeyword: kw.keyword,
      intent: kw.intent,
      supportingKeywords: kw.supporting,
      parentUrl: "/moving-costs/",
      title: kind === "local" ? "Local Moving Costs: Hourly Pricing and Rate-Card Ranges by State" : "Long-Distance Moving Costs: Weight-Based Pricing and Ranges by State",
      metaDescription: clampDescription(kind === "local" ? `How local movers price by the hour and the 2-bedroom local ranges our network's rate cards support as of ${asOf ?? ctx.today}: ${rows.length ? rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ") : "no state has enough cards yet"}. Planning ranges, not quotes.` : `How long-distance moves are priced by weight and band, and the 2-bedroom 750-mile ranges our rate cards support as of ${asOf ?? ctx.today}: ${rows.length ? rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ") : "no state has enough cards yet"}. Not quotes.`),
      h1: kind === "local" ? "Local moving costs" : "Long-distance moving costs",
      content: {
        version: 1,
        intro: { answer, dataPoints: [{ label: "States with a range", value: n(rows.length), basis: `Active rate cards, ${ctx.today}` }, { label: "States without one", value: n(without.length), basis: `Active rate cards, ${ctx.today}` }, { label: "Model", value: "cost-model-v1 (25th to 75th percentile, ≥5 movers)", basis: "/moving-cost-calculator/method/" }] },
        sections: [{ id: "ranges", heading: pick(seed, 2, ["Ranges by origin state", "Where the data supports a range"]), blocks }, { id: "factors", heading: kind === "local" ? "What moves a local price" : "What moves a long-distance price", blocks: [kind === "local" ? { type: "list", items: ["Home size sets the typical crew and hours.", "Access: stairs, elevators, long carries and parking add time.", "Extras: packing, storage and specialty items, priced separately by the movers that offer them.", "Travel fee: a flat charge for the drive."] } : { type: "list", items: ["Shipment weight: the median weight movers state for your home size, then the certified weighing on a non-binding estimate.", "Distance band: five bands from up to 250 miles to more than 1,500.", "Extras from the tariff: packing, storage-in-transit, shuttles, stairs.", "Valuation: full value protection is priced in the tariff; released value is free."] }, factsBlock(facts)] }],
        faq: [{ question: "Why is there no range for my state?", answer: "A range needs at least five different movers' active rate cards covering the move type in the origin state, each less than 12 months old. Fewer than that, and a range could mislead, so we show none." }, { question: "Is a range a quote?", answer: "No. Movers set their own prices and American Moving Choice gives no estimates. A written estimate after a survey is the only figure that binds a mover." }, { question: kind === "local" ? "Does the range include packing?" : "Does the range include storage?", answer: "No. Ranges here are for the move alone; the calculator adds a service only for movers that price it." }],
        related: [{ heading: "Cost pages", links: [...withData.map((s) => ({ href: costStateUrl(s), label: `Moving costs in ${s.name}`, relation: "cost" })), { href: "/moving-costs/", label: "How much do movers cost?", relation: "hub" }, { href: "/moving-cost-calculator/", label: "Moving cost calculator", relation: "tool" }, { href: kind === "local" ? "/moving-costs/long-distance/" : "/moving-costs/local/", label: kind === "local" ? "Long-distance moving costs" : "Local moving costs", relation: "sibling" }] }, { heading: "Services and questions", links: [{ href: kind === "local" ? "/services/local/" : "/services/long-distance/", label: kind === "local" ? "Local movers" : "Long-distance movers", relation: "service" }, { href: "/questions/how-do-moving-companies-charge/", label: "How do moving companies charge?", relation: "question" }, { href: kind === "local" ? "/questions/how-much-do-local-movers-cost/" : "/questions/can-a-mover-charge-more-than-the-estimate/", label: kind === "local" ? "How much do local movers cost?" : "Can movers charge more than the estimate?", relation: "question" }] }],
        quote: { entry: "household", heading: "See which movers cover your move", text: "The survey shows the movers that cover your route before asking for contact details; the calculator shows a range for your exact ZIP codes.", cta: "Start a quote request" },
        schemaType: "Article",
        credits: [],
        dataAsOf: ctx.today,
      },
      sources: sourcesOf(facts),
      mediaIds: [],
      evidenceCount: rows.length + facts.length + 3,
      blocked: [],
      keywordBasis: kw.basis,
      minEvidence: 3,
    });
  }
  // State cost pages, only where ≥5 movers' cards exist
  for (const s of withData.slice(0, Math.max(0, limit - 2))) {
    const cities = ctx.citiesByState.get(s.code) ?? [];
    const largest = cities[0];
    const second = cities[1];
    const intraMiles = largest && second ? distanceMiles(largest, second) : 150;
    const nearest = nearestStates(ctx, s, 1)[0];
    const sizes = ["studio", "1br", "2br", "3br", "4br_plus"] as const;
    const local = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: 10, moveType: "local", scope: `a local move within ${s.name} (within 50 miles)`, sizes: [...sizes] }, new Date(), ctx.cardCache);
    const intra = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: Math.max(51, intraMiles), moveType: "intrastate", scope: `an in-state long-distance move in ${s.name} of about ${milesText(Math.max(51, intraMiles))}${largest && second ? ` (${largest.name} to ${second.name})` : ""}`, sizes: [...sizes] }, new Date(), ctx.cardCache);
    const inter = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: nearest ? Math.max(100, nearest.miles) : 500, moveType: "interstate", scope: `an interstate move from ${s.name} of about ${milesText(nearest ? Math.max(100, nearest.miles) : 500)}${nearest ? ` (to ${nearest.state.name})` : ""}`, sizes: [...sizes] }, new Date(), ctx.cardCache);
    const blocksWithRows = [local, intra, inter].filter((b) => b.rows.length);
    const url = costStateUrl(s);
    const seed = seedOf(url);
    const facts = factsFor(ctx, `state:${s.code}`, ["regulator"]);
    const sizeRows = sizes.map((size) => {
      const label = { studio: "Studio", "1br": "1 bedroom", "2br": "2 bedrooms", "3br": "3 bedrooms", "4br_plus": "4+ bedrooms" }[size];
      const cell = (b: CostBlock) => { const r = b.rows.find((x) => x.homeSize === label); return r ? `${r.low} to ${r.high} (${r.typical})` : "no range"; };
      return [label, cell(local), cell(intra), cell(inter)];
    });
    const kw = keywordFor(ctx.research.filter((r) => r.target_url === url).map((r) => ({ keyword: r.keyword, intent: r.intent, volume: r.volume, difficulty: r.difficulty, source: r.source, researchedOn: r.researched_on, hypothesis: r.volume === null })), `moving costs ${s.name.toLowerCase()}`, "informational");
    const two = local.rows.find((r) => r.homeSize === "2 bedrooms");
    const cardCount = ctx.cardMovers.get(s.code) ?? 0;
    const answer = `${blocksWithRows.length ? `As of ${blocksWithRows[0]!.asOf}, ${plural(cardCount, "mover")} in our network have active rate cards covering ${s.name}, enough for ranges on ${joinAnd(blocksWithRows.map((b) => b.moveType === "local" ? "local moves" : b.moveType === "intrastate" ? "in-state long-distance moves" : "interstate moves"))}.` : `${plural(cardCount, "mover")} have cards covering ${s.name}, but no move type yet reaches five movers for a range.`} ${two ? `A 2-bedroom local move within ${s.name} ranges from ${two.low} to ${two.high} across ${two.movers} movers' cards.` : ""} Ranges are planning figures from rate cards, never quotes; movers set their own prices.`;
    drafts.push({
      url,
      slug: s.slug,
      family: "cost",
      stateCode: s.code,
      cityId: null,
      zip: null,
      routeId: null,
      primaryKeyword: kw.keyword,
      intent: kw.intent,
      supportingKeywords: kw.supporting,
      parentUrl: "/moving-costs/",
      title: `Moving Costs in ${s.name}: Rate-Card Ranges by Home Size and Move Type`,
      metaDescription: clampDescription(`${s.name} moving cost ranges from ${plural(cardCount, "mover")}' active rate cards as of ${blocksWithRows[0]?.asOf ?? ctx.today}: ${two ? `2-bedroom local ${two.low} to ${two.high}; ` : ""}local, in-state long-distance and interstate by home size. Planning ranges, not quotes.`),
      h1: `Moving costs in ${s.name}`,
      content: {
        version: 1,
        intro: { answer, dataPoints: [{ label: "Movers with active rate cards covering the state", value: n(cardCount), basis: `rate_cards, ${ctx.today}` }, { label: "Move types with a range", value: n(blocksWithRows.length), basis: "cost-model-v1" }, ...(two ? [{ label: "2-bedroom local range", value: `${two.low} to ${two.high}`, basis: `${two.movers} movers' cards, as of ${local.asOf}` }] : [])] },
        sections: [
          { id: "summary", heading: pick(seed, 3, [`${s.name} at a glance: every size, every move type`, `One table: ${s.name} ranges by home size`]), blocks: [{ type: "paragraph", text: `${plural(cardCount, "mover")}' cards; the typical job in brackets is the median crew and hours (local) or shipment weight (long distance) those movers state for the size. ${two ? `A 2-bedroom local job is typically ${two.typical}.` : ""}` }, { type: "table", columns: ["Home size", `Local (${local.scope.replace(/^a local move within /, "within ")})`, "In-state long distance", "Interstate"], rows: sizeRows }] },
          { id: "ranges", heading: pick(seed, 2, [`${s.name} ranges by move type and home size`, `What the ${s.name} rate cards support`]), blocks: [{ type: "cost", block: local }, { type: "cost", block: intra }, { type: "cost", block: inter }] },
          ...(facts.length ? [{ id: "rules", heading: `Who licenses ${s.name} movers`, blocks: [factsBlock(facts)] }] : []),
        ],
        faq: [{ question: `What is the typical 2-bedroom job in ${s.name}?`, answer: two ? `${two.typical} for a local move, priced from ${two.low} to ${two.high} across ${two.movers} movers' cards as of ${local.asOf}.` : `No local 2-bedroom range yet: fewer than five ${s.name} cards price it.` }, { question: `How many ${s.name} movers' cards are behind these ranges?`, answer: `${cardCount} active cards cover ${s.name} as of ${ctx.today}; each range names how many price that size. The [calculator](/moving-cost-calculator/) uses the same cards for your exact ZIP codes.` }],
        related: [{ heading: `${s.name}`, links: [{ href: stateUrl(s), label: `Moving companies in ${s.name}`, relation: "state" }, ...cities.slice(0, 4).map((c) => ({ href: cityUrl(s, c), label: `Movers in ${c.name}, ${s.code}`, relation: "city" }))] }, { heading: "Costs", links: [{ href: "/moving-costs/local/", label: "Local moving costs", relation: "sibling" }, { href: "/moving-costs/long-distance/", label: "Long-distance moving costs", relation: "sibling" }, { href: "/moving-cost-calculator/", label: "Moving cost calculator", relation: "tool" }, { href: "/questions/how-do-moving-companies-charge/", label: "How do moving companies charge?", relation: "question" }] }],
        quote: { entry: "household", originZip: largest?.zips[0], heading: "See which movers cover your move", text: `Start the survey with ${largest?.name ?? s.name}'s ZIP code filled in; we show the movers that cover your move before asking for contact details.`, cta: "Start a quote request" },
        schemaType: "Article",
        credits: [],
        dataAsOf: ctx.today,
      },
      sources: sourcesOf(facts),
      mediaIds: [],
      evidenceCount: blocksWithRows.reduce((sum, b) => sum + b.rows.length, 0) + facts.length + 2,
      blocked: blocksWithRows.length ? [] : ["blocked: insufficient evidence (no move type has five movers' cards)"],
      keywordBasis: kw.basis,
      minEvidence: 4,
    });
  }
  return drafts;
}

// ------------------------------------------------------------------ candidates

/** A candidate is cheap to hold; its draft is built chunk by chunk. */
type Candidate = () => Promise<Draft> | Draft;

async function candidates(ctx: Context, family: SeoFamily, limit: number, only: string[] | undefined, options: GenerateOptions): Promise<Candidate[]> {
  const take = <T>(list: T[]) => list.slice(0, limit);
  switch (family) {
    case "state": {
      const demand = stateDemand(ctx.research);
      const ordered = [...ctx.states].sort((a, b) => (demand.get(b.code) ?? 0) - (demand.get(a.code) ?? 0) || a.name.localeCompare(b.name));
      return take(ordered.filter((s) => !only || only.includes(s.slug))).map((s) => () => stateDraft(ctx, s));
    }
    case "city": {
      const minPop = options.minPopulation ?? CITY_PAGE_MIN_POPULATION;
      const list = ctx.cities.filter((c) => (c.population ?? 0) >= minPop && c.zips.length > 0 && !RESERVED_CITY_SLUGS.has(c.slug) && (!only || only.includes(`${ctx.stateByCode.get(c.stateCode)!.slug}/${c.slug}`)));
      return take(list).map((c) => () => cityDraft(ctx, c));
    }
    case "zip": {
      // Only ZIPs of cities whose page is published, where enough movers name the ZIP or county.
      const published = await ctx.db.query<{ city_id: number }>("select city_id from seo_pages where family = 'city' and status = 'published' and city_id is not null");
      const ids = new Set(published.rows.map((r) => r.city_id));
      const out: Candidate[] = [];
      for (const city of ctx.cities) {
        if (!ids.has(city.id)) continue;
        for (const zip of city.zips) {
          if (!lookupZip(zip)) continue;
          if (only && !only.includes(zip)) continue;
          out.push(async () => zipDraft(ctx, zip, city, (await ctx.zipsOf(city.stateCode)).find((z) => z.zip === zip)));
          if (out.length >= limit) return out;
        }
      }
      return out;
    }
    case "route": {
      const rows = (await ctx.db.query<{ id: number; kind: "city" | "state"; slug: string; origin_state: string; destination_state: string; origin_city_id: number | null; destination_city_id: number | null; distance_miles: number; move_type: MoveType; distance_band: string | null; reason: string }>("select id, kind, slug, origin_state, destination_state, origin_city_id, destination_city_id, distance_miles, move_type, distance_band, reason from seo_routes" + (options.reasons?.length ? " where reason = any($1::text[])" : ""), options.reasons?.length ? [options.reasons] : [])).rows.map(toRoute);
      const demand = stateDemand(ctx.research);
      const score = (r: RouteRec): number => {
        const research = r.kind === "state" ? researchForStateRoute(ctx.research, r.originState, r.destinationState, r.slug) : researchForCityRoute(ctx.research, ctx.cityById.get(r.originCityId!)?.slug ?? "", ctx.cityById.get(r.destinationCityId!)?.slug ?? "");
        const measured = research.reduce((sum, k) => sum + (k.volume ?? 0), 0);
        const pop = r.kind === "city" ? (ctx.cityById.get(r.originCityId!)?.population ?? 0) + (ctx.cityById.get(r.destinationCityId!)?.population ?? 0) : (demand.get(r.originState) ?? 0) + (demand.get(r.destinationState) ?? 0);
        return measured * 1000 + (r.kind === "state" ? pop * 10 : pop / 1000);
      };
      const ordered = rows.filter((r) => !only || only.includes(r.slug)).filter((r) => r.kind === "state" || (ctx.cityById.has(r.originCityId!) && ctx.cityById.has(r.destinationCityId!))).map((r) => ({ r, s: score(r) })).sort((a, b) => b.s - a.s).map((x) => x.r);
      return take(ordered).map((r) => () => routeDraft(ctx, r));
    }
    case "service":
    case "question":
    case "planning":
      return take(CATALOG.filter((e) => e.family === family && (!only || only.includes(e.slug)))).map((e) => () => catalogDraft(ctx, e));
    case "cost":
      return (await costDrafts(ctx, limit)).map((d) => () => d);
    case "mover-profile":
      return []; // Profiles are owned by the directory slice (/companies/{slug}/); nothing is generated here.
  }
}

// ------------------------------------------------------------------ gates and storage

export interface GenerateOptions {
  limit?: number;
  only?: string[];
  /** Route reasons to include (metro_pair, intrastate_pair, city_to_state_top, state_pair). */
  reasons?: string[];
  /** City pages: the population threshold (default CITY_PAGE_MIN_POPULATION). */
  minPopulation?: number;
  media?: MediaAsset[];
  chunkSize?: number;
  log?: (line: string) => void;
}

export interface GenerateSummary {
  family: SeoFamily;
  planned: number;
  written: number;
  ready: number;
  draft: number;
  blocked: Record<string, number>;
}

export const UNIQUE_SHARE_MIN = 0.4;

/**
 * The share of each listed page's shingles that no other page of the family holds, from the
 * seo_shingles index. Computed in memory with typed arrays (every hash of the family sorted once,
 * then the singletons kept as a sorted array for binary search), which stays fast and predictable
 * for tens of millions of rows where a grouped SQL join is at the planner's mercy.
 */
export async function uniqueShares(db: Queryable, family: SeoFamily, urls: string[], log: (line: string) => void = () => undefined): Promise<Map<string, number>> {
  const started = Date.now();
  const total = (await db.query<{ n: string }>("select count(*)::text as n from seo_shingles where family = $1", [family])).rows[0]!.n;
  const all = new Int32Array(Number(total));
  let filled = 0;
  // Page by page so no single result set holds the whole family.
  const pages = await db.query<{ page_url: string }>("select distinct page_url from seo_shingles where family = $1", [family]);
  const batch = 500;
  for (let i = 0; i < pages.rows.length; i += batch) {
    const rows = await db.query<{ hs: number[] }>("select array_agg(h) as hs from seo_shingles where family = $1 and page_url = any($2::text[]) group by page_url", [family, pages.rows.slice(i, i + batch).map((r) => r.page_url)]);
    for (const r of rows.rows) {
      all.set(r.hs, filled);
      filled += r.hs.length;
    }
  }
  const sorted = all.subarray(0, filled).slice().sort();
  const singles: number[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i + 1;
    while (j < sorted.length && sorted[j] === sorted[i]) j++;
    if (j === i + 1) singles.push(sorted[i]!);
    i = j;
  }
  const single = Int32Array.from(singles);
  const isSingle = (h: number): boolean => {
    let lo = 0;
    let hi = single.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const v = single[mid]!;
      if (v === h) return true;
      if (v < h) lo = mid + 1;
      else hi = mid - 1;
    }
    return false;
  };
  const out = new Map<string, number>();
  for (let i = 0; i < urls.length; i += batch) {
    const rows = await db.query<{ page_url: string; hs: number[] }>("select page_url, array_agg(h) as hs from seo_shingles where family = $1 and page_url = any($2::text[]) group by page_url", [family, urls.slice(i, i + batch)]);
    for (const r of rows.rows) {
      let uniq = 0;
      for (const h of r.hs) if (isSingle(h)) uniq++;
      out.set(r.page_url, r.hs.length ? uniq / r.hs.length : 0);
    }
  }
  log(`${family}: uniqueness over ${n(filled)} shingles of ${n(pages.rows.length)} pages (${Math.round((Date.now() - started) / 1000)}s)`);
  return out;
}

export async function generateFamily(db: Queryable, family: SeoFamily, options: GenerateOptions = {}): Promise<GenerateSummary> {
  const ctx = await loadContext(db, options);
  const limit = options.limit ?? 50;
  const chunkSize = options.chunkSize ?? 250;
  const cands = await candidates(ctx, family, limit, options.only, options);
  const summary: GenerateSummary = { family, planned: cands.length, written: 0, ready: 0, draft: 0, blocked: {} };
  const bump = (reason: string) => {
    const key = reason.split(" (")[0]!;
    summary.blocked[key] = (summary.blocked[key] ?? 0) + 1;
  };
  // Duplicate-content and duplicate-intent owners among pages outside this run.
  const existing = await db.query<{ url: string; content_hash: string; primary_keyword_normalized: string; intent: string }>("select url, content_hash, primary_keyword_normalized, intent from seo_pages");
  const hashOwner = new Map(existing.rows.map((r) => [r.content_hash, r.url]));
  const keywordOwner = new Map(existing.rows.map((r) => [`${r.primary_keyword_normalized}|${r.intent}`, r.url]));
  const written: { url: string; evidence: { passed: boolean; detail: string }; blocked: string[] }[] = [];
  const started = Date.now();

  for (let i = 0; i < cands.length; i += chunkSize) {
    const drafts: Draft[] = [];
    for (const make of cands.slice(i, i + chunkSize)) {
      const draft = await make();
      if (draft._finish) await draft._finish();
      drafts.push(draft);
    }
    for (const draft of drafts) {
      const text = mainText(draft.content);
      const hash = sha256(text);
      const blocked = [...draft.blocked];
      const gates: Record<string, { passed: boolean; detail: string }> = {};
      gates.evidence = { passed: draft.evidenceCount >= draft.minEvidence, detail: `${draft.evidenceCount} data-backed facts; ${draft.minEvidence} needed` };
      if (!gates.evidence.passed) blocked.push(`blocked: insufficient evidence (${draft.evidenceCount} facts, ${draft.minEvidence} needed)`);
      const hashDup = hashOwner.get(hash);
      gates.duplicate_content = { passed: !hashDup || hashDup === draft.url, detail: hashDup && hashDup !== draft.url ? `same content hash as ${hashDup}` : "content hash is unique" };
      if (!gates.duplicate_content.passed) blocked.push(`blocked: duplicate content (same as ${hashDup})`);
      const kwKey = `${normalizeKeyword(draft.primaryKeyword)}|${draft.intent}`;
      const kwDup = keywordOwner.get(kwKey);
      gates.duplicate_intent = { passed: !kwDup || kwDup === draft.url, detail: kwDup && kwDup !== draft.url ? `keyword and intent already target ${kwDup}` : "keyword and intent are unique" };
      if (!gates.duplicate_intent.passed) blocked.push(`blocked: duplicate intent (keyword "${draft.primaryKeyword}" already targets ${kwDup})`);
      gates.keyword = { passed: true, detail: draft.keywordBasis };
      const words = text.split(/\s+/).length;
      gates.words = { passed: words >= 300, detail: `${words} words of main content` };
      gates.unique = { passed: false, detail: "pending: measured after the run" };
      if (!gates.duplicate_content.passed || !gates.duplicate_intent.passed) {
        bump(blocked[blocked.length - 1]!);
        ctx.log(`skip ${draft.url}: ${blocked.join("; ")}`);
        continue;
      }
      hashOwner.set(hash, draft.url);
      keywordOwner.set(kwKey, draft.url);
      const reason = blocked[0] ?? null;
      await db.query(
        `insert into seo_pages (url, slug, family, state_code, city_id, zip, route_id, primary_keyword, primary_keyword_normalized, intent, supporting_keywords, parent_url,
           title, meta_description, h1, status, indexable, content, content_hash, unique_share, evidence_count, sources, media_ids, blocked_reason, gate_results, canonical_url)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, 'draft', false, $16::jsonb, $17, null, $18, $19::jsonb, $20::jsonb, $21, $22::jsonb, $1)
         on conflict (url) do update set slug = excluded.slug, state_code = excluded.state_code, city_id = excluded.city_id, zip = excluded.zip, route_id = excluded.route_id,
           primary_keyword = excluded.primary_keyword, primary_keyword_normalized = excluded.primary_keyword_normalized, intent = excluded.intent,
           supporting_keywords = excluded.supporting_keywords, parent_url = excluded.parent_url, title = excluded.title, meta_description = excluded.meta_description,
           h1 = excluded.h1, content = excluded.content, content_hash = excluded.content_hash, unique_share = null, evidence_count = excluded.evidence_count,
           sources = excluded.sources, media_ids = excluded.media_ids, blocked_reason = excluded.blocked_reason, gate_results = excluded.gate_results,
           -- A published page keeps its status until the uniqueness pass below settles it; a blocked one drops to draft and out of the index there.
           status = seo_pages.status, indexable = seo_pages.indexable`,
        [draft.url, draft.slug, draft.family, draft.stateCode, draft.cityId, draft.zip, draft.routeId, draft.primaryKeyword, normalizeKeyword(draft.primaryKeyword), draft.intent, JSON.stringify(draft.supportingKeywords), draft.parentUrl, draft.title, draft.metaDescription, draft.h1, JSON.stringify(draft.content), hash, draft.evidenceCount, JSON.stringify(draft.sources), JSON.stringify(draft.mediaIds), reason, JSON.stringify(gates)],
      );
      for (const id of draft.mediaIds) {
        await db.query("insert into seo_media_usage (media_id, page_id) select $1, id from seo_pages where url = $2 on conflict (media_id) do nothing", [id, draft.url]);
      }
      await db.query("delete from seo_shingles where page_url = $1", [draft.url]);
      await db.query("insert into seo_shingles (family, page_url, h) select $1, $2, unnest($3::int[])", [family, draft.url, shingleHashes(text)]);
      written.push({ url: draft.url, evidence: gates.evidence, blocked });
      summary.written++;
    }
    ctx.log(`${family}: ${Math.min(i + chunkSize, cands.length)} of ${cands.length} drafted (${Math.round((Date.now() - started) / 1000)}s)`);
  }

  // Uniqueness against every page of the family (this run and earlier ones), from the shingle index.
  const shares = written.length ? await uniqueShares(db, family, written.map((w) => w.url), ctx.log) : new Map<string, number>();
  for (const w of written) {
    const share = shares.get(w.url) ?? 0;
    const unique = { passed: share >= UNIQUE_SHARE_MIN, detail: `${Math.round(share * 100)}% of 5-word shingles unique within the family; ${Math.round(UNIQUE_SHARE_MIN * 100)}% needed` };
    const blocked = [...w.blocked];
    if (!unique.passed) blocked.push(`blocked: below ${Math.round(UNIQUE_SHARE_MIN * 100)}% unique content (${Math.round(share * 100)}%)`);
    const reason = blocked[0] ?? null;
    const status = reason ? "draft" : "ready";
    await db.query(
      `update seo_pages set unique_share = $2, gate_results = gate_results || jsonb_build_object('unique', $3::jsonb), blocked_reason = $4,
         status = case when $4::text is null and status = 'published' then 'published' else $5 end,
         indexable = case when $4::text is null and status = 'published' then indexable else false end
       where url = $1`,
      [w.url, share, JSON.stringify(unique), reason, status],
    );
    if (reason) {
      summary.draft++;
      bump(reason);
    } else summary.ready++;
  }
  ctx.log(`${family}: planned ${summary.planned}, written ${summary.written}, ready ${summary.ready}, draft ${summary.draft}${Object.keys(summary.blocked).length ? `, blocked: ${JSON.stringify(summary.blocked)}` : ""}`);
  return summary;
}
