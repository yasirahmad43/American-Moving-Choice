/**
 * What the network can say about a place or route, from data only: which approved movers'
 * coverage rules match a representative request (the @amc/core matcher, as the survey uses it),
 * which of them name the place explicitly (site architecture §4.1 G1), and the cost ranges the
 * rate cards support (cost-model-v1; at least 5 movers or no range).
 *
 * Reads company status, coverage, capabilities, profiles and rate cards. Reads no money input:
 * purchases, prices, balances and plans never influence what a page shows (ST-3).
 */
import {
  COST_MODEL_V1,
  computeCost,
  matchCompany,
  type CompanyMatchProfile,
  type CostRange,
  type CostResult,
  type CoverageRule,
  type HomeSize,
  type LeadFacts,
  type MoveType,
  type ResolvedLocation,
  type StateCode,
  type Zip5,
} from "@amc/core";
import type { Queryable } from "../db/pool";
import { countyByFips, lookupZip, stateByCode } from "../geo/geo";
import { loadAreaRateCards } from "../rates/rates";
import type { CostBlock, MoverItem } from "./types";

export interface NetworkMover {
  companyId: string;
  slug: string;
  name: string;
  basedIn: { city: string; state: string } | null;
  profile: CompanyMatchProfile;
  /** Origin-side places each include rule names, for the explicit-coverage count. */
  explicit: { states: Set<string>; counties: Set<string>; zips: Set<string>; moveTypes: Set<MoveType> }[];
}

interface MoverRow {
  id: string;
  slug: string;
  display_name: string;
  address_city: string | null;
  address_state: string | null;
  move_types: MoveType[] | null;
  move_sizes: string[] | null;
  services: string[] | null;
}

interface RuleRow {
  company_id: string;
  id: string;
  kind: "include" | "exclude";
  paused: boolean;
  move_types: MoveType[];
  move_sizes: string[];
  services: string[];
  side: "origin" | "destination" | null;
  level: "state" | "county" | "zip" | null;
  value: string | null;
}

/** Approved, purchase-eligible movers with live profiles and their active coverage. */
export async function loadNetwork(db: Queryable): Promise<NetworkMover[]> {
  const companies = await db.query<MoverRow>(
    `select c.id, p.slug, p.display_name, c.address_city, c.address_state, cap.move_types, cap.move_sizes, cap.services
       from companies c
       join company_profiles p on p.company_id = c.id
       left join company_capabilities cap on cap.company_id = c.id
      where company_can_purchase(c) and p.public_status = 'live' and c.suspended_at is null
      order by p.display_name`,
  );
  if (!companies.rows.length) return [];
  const ids = companies.rows.map((r) => r.id);
  const rules = await db.query<RuleRow>(
    `select r.company_id, r.id, r.kind, r.paused, r.move_types, r.move_sizes, r.services, l.side, l.level, l.value
       from coverage_rules r left join coverage_rule_locations l on l.rule_id = r.id
      where r.company_id = any($1::uuid[]) and not r.paused
      order by r.company_id, r.created_at, r.id`,
    [ids],
  );
  const byCompany = new Map<string, Map<string, CoverageRule & { originExplicit: NetworkMover["explicit"][number] }>>();
  for (const row of rules.rows) {
    const forCompany = byCompany.get(row.company_id) ?? new Map();
    byCompany.set(row.company_id, forCompany);
    let rule = forCompany.get(row.id);
    if (!rule) {
      rule = {
        id: row.id,
        kind: row.kind,
        paused: row.paused,
        moveTypes: row.move_types.length ? row.move_types : undefined,
        moveSizes: row.move_sizes.length ? (row.move_sizes as CoverageRule["moveSizes"]) : undefined,
        services: row.services.length ? (row.services as CoverageRule["services"]) : undefined,
        origin: { states: [], countyFips: [], zips: [] },
        destination: { states: [], countyFips: [], zips: [] },
        originExplicit: { states: new Set(), counties: new Set(), zips: new Set(), moveTypes: new Set(row.move_types) },
      };
      forCompany.set(row.id, rule);
    }
    if (row.side && row.level && row.value) {
      const set = row.side === "origin" ? rule.origin! : rule.destination!;
      if (row.level === "state") set.states!.push(row.value as StateCode);
      else if (row.level === "county") set.countyFips!.push(row.value);
      else set.zips!.push(row.value as Zip5);
      if (row.side === "origin" && row.kind === "include") {
        if (row.level === "state") rule.originExplicit.states.add(row.value);
        else if (row.level === "county") rule.originExplicit.counties.add(row.value);
        else rule.originExplicit.zips.add(row.value);
      }
    }
  }
  return companies.rows.map((row) => {
    const ruleMap = byCompany.get(row.id) ?? new Map();
    const list = [...ruleMap.values()] as (CoverageRule & { originExplicit: NetworkMover["explicit"][number] })[];
    const capabilities = { moveTypes: row.move_types ?? [], moveSizes: (row.move_sizes ?? []) as CompanyMatchProfile["capabilities"]["moveSizes"], services: (row.services ?? []) as CompanyMatchProfile["capabilities"]["services"] };
    return {
      companyId: row.id,
      slug: row.slug,
      name: row.display_name,
      basedIn: row.address_city && row.address_state ? { city: row.address_city, state: row.address_state } : null,
      profile: {
        companyId: row.id,
        eligibleToPurchase: true,
        capabilities,
        rules: list.map(({ originExplicit: _omit, ...rule }) => rule),
      },
      explicit: list
        .filter((r) => r.kind === "include")
        .map((r) => ({ ...r.originExplicit, moveTypes: new Set((r.moveTypes?.length ? r.moveTypes : capabilities.moveTypes).filter((t) => capabilities.moveTypes.includes(t))) })),
    };
  });
}

export function resolved(zip: string): ResolvedLocation | null {
  const loc = lookupZip(zip);
  return loc ? { zip: loc.zip, city: loc.city, state: loc.state, countyFips: loc.countyFips } : null;
}

export interface CoverageCount {
  /** Movers the matcher would offer a representative request (2 bedrooms, no extra services). */
  matched: NetworkMover[];
  /** Of those, movers whose include rules name the place (state, county or ZIP) on the origin side. */
  explicit: NetworkMover[];
}

const representative = (origin: ResolvedLocation, destination: ResolvedLocation, moveType: MoveType): LeadFacts => ({ origin, destination, moveType, moveSize: "2br", services: [] });

/** Movers matching a representative move, and which of them name the origin place explicitly. */
export function coverageFor(network: NetworkMover[], lead: LeadFacts, explicitWhere: (e: NetworkMover["explicit"][number]) => boolean): CoverageCount {
  const matched = network.filter((m) => matchCompany(m.profile, lead).eligible);
  const explicit = matched.filter((m) => m.explicit.some((e) => e.moveTypes.has(lead.moveType) && explicitWhere(e)));
  return { matched, explicit };
}

const stateFips = (code: string) => stateByCode(code)?.fips ?? "";

export const namesState = (code: string) => (e: NetworkMover["explicit"][number]) =>
  e.states.has(code) || [...e.counties].some((f) => f.startsWith(stateFips(code))) || [...e.zips].some((z) => lookupZip(z)?.state === code);

export const namesCounty = (countyFips: string) => (e: NetworkMover["explicit"][number]) =>
  e.counties.has(countyFips) || [...e.zips].some((z) => lookupZip(z)?.countyFips === countyFips);

export const namesZip = (zip: string, countyFips: string) => (e: NetworkMover["explicit"][number]) => e.zips.has(zip) || e.counties.has(countyFips);

/** Coverage for moves starting in a state, by move type (interstate uses a neighbouring destination). */
export function stateCoverage(network: NetworkMover[], originZip: string, destZipSameState: string, destZipOtherState: string): Record<MoveType, CoverageCount> {
  const o = resolved(originZip);
  const sameState = resolved(destZipSameState);
  const other = resolved(destZipOtherState);
  const empty = { matched: [], explicit: [] };
  if (!o) return { local: empty, intrastate: empty, interstate: empty };
  const where = namesState(o.state);
  return {
    local: coverageFor(network, representative(o, o, "local"), where),
    intrastate: sameState ? coverageFor(network, representative(o, sameState, "intrastate"), where) : empty,
    interstate: other ? coverageFor(network, representative(o, other, "interstate"), where) : empty,
  };
}

export function cityCoverage(network: NetworkMover[], cityZip: string, countyFips: string, destZipOtherState: string): { local: CoverageCount; interstate: CoverageCount } {
  const o = resolved(cityZip);
  const other = resolved(destZipOtherState);
  const empty = { matched: [], explicit: [] };
  if (!o) return { local: empty, interstate: empty };
  return {
    local: coverageFor(network, representative(o, o, "local"), namesCounty(countyFips)),
    interstate: other ? coverageFor(network, representative(o, other, "interstate"), namesState(o.state)) : empty,
  };
}

export function zipCoverage(network: NetworkMover[], zip: string): CoverageCount {
  const o = resolved(zip);
  if (!o) return { matched: [], explicit: [] };
  return coverageFor(network, representative(o, o, "local"), namesZip(zip, o.countyFips));
}

export function routeCoverage(network: NetworkMover[], originZip: string, destZip: string, moveType: MoveType): CoverageCount {
  const o = resolved(originZip);
  const d = resolved(destZip);
  if (!o || !d) return { matched: [], explicit: [] };
  return coverageFor(network, representative(o, d, moveType), namesState(o.state));
}

export function moverItems(movers: NetworkMover[], coverageNote: (m: NetworkMover) => string, limit = 10): MoverItem[] {
  return movers.slice(0, limit).map((m) => ({
    slug: m.slug,
    name: m.name,
    basedIn: m.basedIn ? `${m.basedIn.city}, ${m.basedIn.state}` : null,
    coverageNote: coverageNote(m),
  }));
}

/** "Travis County, TX" from a FIPS code. */
export function countyLabel(fips: string | null): string | null {
  if (!fips) return null;
  const county = countyByFips(fips);
  return county ? `${county.name} County, ${county.state}` : null;
}

// ------------------------------------------------------------------ cost ranges

const HOME_SIZE_LABEL: Record<HomeSize, string> = { studio: "Studio", "1br": "1 bedroom", "2br": "2 bedrooms", "3br": "3 bedrooms", "4br_plus": "4+ bedrooms" };
const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString("en-US")}`;

const BAND_LABEL: Record<string, string> = {
  "0_250": "up to 250 miles",
  "250_500": "250 to 500 miles",
  "500_1000": "500 to 1,000 miles",
  "1000_1500": "1,000 to 1,500 miles",
  "1500_plus": "more than 1,500 miles",
};

export interface CostRequest {
  originState: string;
  areaName: string;
  miles: number;
  moveType: MoveType;
  scope: string;
  sizes?: HomeSize[];
}

/**
 * A cost block for a route shape, from the origin state's active rate cards: rows only for sizes
 * with a range (≥5 movers), and an honest noData line when none has one.
 */
export async function costBlockFor(db: Queryable, request: CostRequest, now = new Date()): Promise<CostBlock> {
  const cards = await loadAreaRateCards(request.originState, db);
  const sizes = request.sizes ?? (["1br", "2br", "3br"] as HomeSize[]);
  const rows: CostBlock["rows"] = [];
  let asOf: string | null = null;
  let band: string | null = null;
  let cause: CostResult | null = null;
  for (const size of sizes) {
    const result = computeCost({ route: { miles: request.miles, moveType: request.moveType }, moveSize: size, services: [], cards, area: { state: request.originState, name: request.areaName }, now });
    band = result.band;
    if (result.kind === "range") {
      const r = result as CostRange;
      const typical = r.typicalJob.moveType === "local" ? `${r.typicalJob.crew} movers, ${r.typicalJob.hours} hours` : `${Math.round(r.typicalJob.weightLbs).toLocaleString("en-US")} lb`;
      rows.push({ homeSize: HOME_SIZE_LABEL[size], low: dollars(r.lowCents), high: dollars(r.highCents), movers: r.moverCount, typical });
      if (!asOf || r.asOf < asOf) asOf = r.asOf;
    } else if (!cause) cause = result;
  }
  const distinct = new Set(cards.map((c) => c.companyId)).size;
  let noData: string | undefined;
  if (!rows.length) {
    const typeWords = request.moveType === "local" ? "local moves" : request.moveType === "intrastate" ? "in-state long-distance moves" : "interstate moves";
    noData =
      cause && cause.kind === "no_data" && cause.cause === "stale"
        ? `Too few cards under ${COST_MODEL_V1.maxDataAgeMonths} months old cover ${typeWords} from ${request.areaName}: no range.`
        : `${distinct} of the ${COST_MODEL_V1.minMovers} movers' rate cards needed cover ${typeWords} from ${request.areaName}: no range.`;
  }
  return {
    scope: request.scope + (band ? ` (${BAND_LABEL[band] ?? band})` : ""),
    moveType: request.moveType,
    band,
    rows,
    asOf: asOf ? asOf.slice(0, 10) : now.toISOString().slice(0, 10),
    modelVersion: "cost-model-v1",
    noData,
  };
}

/** Active-card counts per state, for the cost family (pages only where ≥5 distinct movers). */
export async function rateCardMoversByState(db: Queryable): Promise<Map<string, number>> {
  const result = await db.query<{ state: string; n: number }>(
    `select s as state, count(distinct rc.company_id)::int as n
       from rate_cards rc join companies c on c.id = rc.company_id, unnest(rc.states) as s
      where rc.status = 'active' and c.status = 'approved' and c.suspended_at is null
      group by s`,
  );
  return new Map(result.rows.map((r) => [r.state, r.n]));
}
