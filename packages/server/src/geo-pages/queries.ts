/**
 * Coverage counts for the location-page gates (site architecture §4.1 G1) and the /movers/ ZIP
 * check. Only approved movers that can buy requests count (company_can_purchase), with active,
 * unpaused include rules. Container, storage and truck-rental firms never join the network, so
 * they never appear in a count.
 */
import type { MoveType } from "@amc/core";
import { getPool, type Queryable } from "../db/pool";
import { countyByFips, lookupZip, stateBySlug, type ZipLocation } from "../geo/geo";
import { STATES, type StateInfo } from "../geo/states";
import { evaluateGates, type GateEvaluation } from "./gates";

interface RuleRow {
  company_id: string;
  rule_id: string;
  kind: "include" | "exclude";
  rule_types: MoveType[];
  capability_types: MoveType[];
  side: "origin" | "destination" | null;
  level: "state" | "county" | "zip" | null;
  value: string | null;
}

interface Rule {
  companyId: string;
  kind: "include" | "exclude";
  moveTypes: MoveType[];
  capabilityTypes: MoveType[];
  origin: { states: string[]; counties: string[]; zips: string[] };
  destinationSpecified: boolean;
}

async function activeRules(db: Queryable): Promise<Rule[]> {
  const rows = await db.query<RuleRow>(
    `select r.company_id, r.id as rule_id, r.kind, r.move_types as rule_types, coalesce(cap.move_types, '{}') as capability_types,
            l.side, l.level, l.value
     from coverage_rules r
     join companies c on c.id = r.company_id
     left join company_capabilities cap on cap.company_id = r.company_id
     left join coverage_rule_locations l on l.rule_id = r.id
     where not r.paused and company_can_purchase(c)`,
  );
  const rules = new Map<string, Rule>();
  for (const row of rows.rows) {
    let rule = rules.get(row.rule_id);
    if (!rule) {
      rule = {
        companyId: row.company_id,
        kind: row.kind,
        moveTypes: row.rule_types,
        capabilityTypes: row.capability_types,
        origin: { states: [], counties: [], zips: [] },
        destinationSpecified: false,
      };
      rules.set(row.rule_id, rule);
    }
    if (row.side === "destination") rule.destinationSpecified = true;
    if (row.side === "origin" && row.level && row.value) {
      (row.level === "state" ? rule.origin.states : row.level === "county" ? rule.origin.counties : rule.origin.zips).push(row.value);
    }
  }
  return [...rules.values()];
}

const typesOf = (rule: Rule): MoveType[] =>
  (rule.moveTypes.length ? rule.moveTypes : rule.capabilityTypes).filter((t) => rule.capabilityTypes.includes(t));

const zipState = (zip: string) => lookupZip(zip)?.state ?? null;
const zipCounty = (zip: string) => lookupZip(zip)?.countyFips ?? null;

/** The origin side names a location inside the state (a state, county or ZIP rule, never nationwide). */
function namesState(rule: Rule, state: StateInfo): boolean {
  return (
    rule.origin.states.includes(state.code) ||
    rule.origin.counties.some((fips) => fips.startsWith(state.fips)) ||
    rule.origin.zips.some((zip) => zipState(zip) === state.code)
  );
}

/** A statewide exclusion of every move type starting in the state. */
function excludesState(rule: Rule, state: StateInfo): boolean {
  return rule.kind === "exclude" && rule.origin.states.includes(state.code) && !rule.moveTypes.length && !rule.destinationSpecified;
}

/**
 * G1 for a state hub: movers with an include rule that explicitly names a location in the state on
 * the origin side and a move type within their verified capabilities. Nationwide rules don't count.
 */
export async function countStateHubMovers(stateCode: string, db: Queryable = getPool()): Promise<number> {
  const state = STATES.find((s) => s.code === stateCode);
  return state ? stateHubCount(await activeRules(db), state) : 0;
}

function stateHubCount(rules: Rule[], state: StateInfo): number {
  const excluded = new Set(rules.filter((r) => excludesState(r, state)).map((r) => r.companyId));
  const counted = new Set(
    rules.filter((r) => r.kind === "include" && namesState(r, state) && typesOf(r).length > 0 && !excluded.has(r.companyId)).map((r) => r.companyId),
  );
  return counted.size;
}

/**
 * G1 for a city page: local coverage counts only explicit county or ZIP inclusions plus local
 * capability, never nationwide or statewide catch-all rules (site architecture §4.1).
 */
export async function countCityMovers(countyFips: string, db: Queryable = getPool()): Promise<number> {
  const rules = await activeRules(db);
  const counted = new Set(
    rules
      .filter((r) => r.kind === "include" && typesOf(r).includes("local"))
      .filter((r) => r.origin.counties.includes(countyFips) || r.origin.zips.some((zip) => zipCounty(zip) === countyFips))
      .map((r) => r.companyId),
  );
  return counted.size;
}

/** Gate evaluation for /movers/{state}/. Null for an unknown state slug. */
export async function evaluateStateHub(stateSlug: string, db: Queryable = getPool()): Promise<{ state: StateInfo; evaluation: GateEvaluation } | null> {
  const state = stateBySlug(stateSlug);
  if (!state) return null;
  const movers = await countStateHubMovers(state.code, db);
  return { state, evaluation: evaluateGates("state_hub", { approvedMoversWithCoverage: movers }) };
}

/** Gate evaluation for a city page, identified by its county. Null for an unknown county. */
export async function evaluateCityPage(countyFips: string, db: Queryable = getPool()): Promise<GateEvaluation | null> {
  if (!countyByFips(countyFips)) return null;
  return evaluateGates("city", { approvedMoversWithCoverage: await countCityMovers(countyFips, db) });
}

export type ZipCoverage =
  | { status: "invalid" }
  | { status: "unknown" }
  | { status: "ok"; location: Pick<ZipLocation, "city" | "state">; stateName: string; moversStartingInState: number; explicitInState: number };

/**
 * What the network covers for moves starting in a ZIP's state: movers with any active include rule
 * whose origin side covers the state (nationwide rules included), and how many of those name the
 * state explicitly. The ZIP itself is never stored or logged.
 */
export async function coverageForZip(zip: string, db: Queryable = getPool()): Promise<ZipCoverage> {
  if (!/^\s*\d{5}\s*$/.test(zip)) return { status: "invalid" };
  const location = lookupZip(zip);
  if (!location) return { status: "unknown" };
  const state = STATES.find((s) => s.code === location.state)!;
  const rules = await activeRules(db);
  const excluded = new Set(rules.filter((r) => excludesState(r, state)).map((r) => r.companyId));
  const includes = rules.filter((r) => r.kind === "include" && typesOf(r).length > 0 && !excluded.has(r.companyId));
  const unconstrainedOrigin = (r: Rule) => !r.origin.states.length && !r.origin.counties.length && !r.origin.zips.length;
  const any = new Set(includes.filter((r) => unconstrainedOrigin(r) || namesState(r, state)).map((r) => r.companyId));
  const explicit = new Set(includes.filter((r) => namesState(r, state)).map((r) => r.companyId));
  return {
    status: "ok",
    location: { city: location.city, state: location.state },
    stateName: state.name,
    moversStartingInState: any.size,
    explicitInState: explicit.size,
  };
}

/** State hubs whose gates all pass (the /movers/ index lists only these). */
export async function publishedStateHubs(db: Queryable = getPool()): Promise<StateInfo[]> {
  const rules = await activeRules(db);
  const out: StateInfo[] = [];
  for (const state of STATES) {
    const movers = stateHubCount(rules, state);
    if (evaluateGates("state_hub", { approvedMoversWithCoverage: movers }).publishable) out.push(state);
  }
  return out;
}
