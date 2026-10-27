import type { MoveType, ResolvedLocation, StateCode, Zip5 } from "./geo";

export type MoveSize = "studio" | "1br" | "2br" | "3br" | "4br_plus" | "office" | "partial";
export type Service = "full_service" | "packing" | "storage" | "auto_transport" | "labor_only" | "specialty_items";

/** Any listed member matches ("any within group"). An empty set means the group is not constrained. */
export interface LocationSet {
  states?: StateCode[];
  countyFips?: string[];
  zips?: Zip5[];
}

/**
 * A coverage rule. Every *specified* dimension must match ("all enabled groups").
 * - Nationwide: no location dimensions.
 * - Origin-only: origin set, destination unset.
 * - Directional route FL->GA: origin {FL}, destination {GA}; GA->FL is a separate rule.
 */
export interface CoverageRule {
  id: string;
  kind: "include" | "exclude";
  origin?: LocationSet;
  destination?: LocationSet;
  moveTypes?: MoveType[];
  moveSizes?: MoveSize[];
  services?: Service[];
  paused?: boolean;
}

export interface LeadFacts {
  origin: ResolvedLocation;
  destination: ResolvedLocation;
  moveType: MoveType;
  moveSize: MoveSize;
  services: Service[];
}

export interface CompanyMatchProfile {
  companyId: string;
  /** Approved, credentials valid, not suspended, billing in good standing, not a broker. */
  eligibleToPurchase: boolean;
  /** Service capabilities from the verified profile; a rule cannot widen these. */
  capabilities: { moveTypes: MoveType[]; moveSizes: MoveSize[]; services: Service[] };
  rules: CoverageRule[];
}

function isSpecified(s?: LocationSet): s is LocationSet {
  return !!s && !!(s.states?.length || s.countyFips?.length || s.zips?.length);
}

export function locationMatches(set: LocationSet, loc: ResolvedLocation): boolean {
  return !!(
    set.zips?.includes(loc.zip) ||
    set.countyFips?.includes(loc.countyFips) ||
    set.states?.includes(loc.state)
  );
}

function listMatches<T>(allowed: T[] | undefined, value: T): boolean {
  return !allowed?.length || allowed.includes(value);
}

/** Services: the lead's requested services must all be within the rule's list (if the rule constrains services). */
function servicesMatch(allowed: Service[] | undefined, requested: Service[]): boolean {
  return !allowed?.length || requested.every((s) => allowed.includes(s));
}

export function ruleMatches(rule: CoverageRule, lead: LeadFacts): boolean {
  if (isSpecified(rule.origin) && !locationMatches(rule.origin, lead.origin)) return false;
  if (isSpecified(rule.destination) && !locationMatches(rule.destination, lead.destination)) return false;
  if (!listMatches(rule.moveTypes, lead.moveType)) return false;
  if (!listMatches(rule.moveSizes, lead.moveSize)) return false;
  if (!servicesMatch(rule.services, lead.services)) return false;
  return true;
}

export type MatchResult = { eligible: true; ruleId: string } | { eligible: false; reason: string };

/** Exclusions override inclusions; paused rules are ignored; capabilities are a hard ceiling. */
export function matchCompany(c: CompanyMatchProfile, lead: LeadFacts): MatchResult {
  if (!c.eligibleToPurchase) return { eligible: false, reason: "company_not_eligible" };
  const cap = c.capabilities;
  if (!cap.moveTypes.includes(lead.moveType)) return { eligible: false, reason: "move_type_not_offered" };
  if (!cap.moveSizes.includes(lead.moveSize)) return { eligible: false, reason: "move_size_not_offered" };
  if (!lead.services.every((s) => cap.services.includes(s))) return { eligible: false, reason: "service_not_offered" };
  const active = c.rules.filter((r) => !r.paused);
  const excluded = active.find((r) => r.kind === "exclude" && ruleMatches(r, lead));
  if (excluded) return { eligible: false, reason: `excluded_by:${excluded.id}` };
  const included = active.find((r) => r.kind === "include" && ruleMatches(r, lead));
  return included ? { eligible: true, ruleId: included.id } : { eligible: false, reason: "no_matching_coverage" };
}

/**
 * Eligibility snapshot for a newly qualified lead. These rows are written to `lead_eligibility`
 * (named_in_consent = true for the movers shown to the consumer) and rechecked at purchase time.
 */
export function eligibleCompanies(companies: CompanyMatchProfile[], lead: LeadFacts): { companyId: string; ruleId: string }[] {
  const out: { companyId: string; ruleId: string }[] = [];
  for (const c of companies) {
    const r = matchCompany(c, lead);
    if (r.eligible) out.push({ companyId: c.companyId, ruleId: r.ruleId });
  }
  return out;
}
