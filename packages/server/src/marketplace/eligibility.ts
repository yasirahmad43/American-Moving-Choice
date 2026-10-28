/**
 * Re-running the matcher for one company and one request (lead lifecycle §3): used when
 * reserve_purchase reports eligibility_stale (the company's coverage changed after matching) and to
 * decide whether a stale snapshot still belongs in the marketplace list.
 *
 * Consent scope never widens: only an existing lead_eligibility row with named_in_consent = true is
 * refreshed, and the refresh keeps named_in_consent as it is.
 */
import {
  matchCompany,
  type CompanyMatchProfile,
  type CoverageRule,
  type LeadFacts,
  type LocationSet,
  type MoveSize,
  type MoveType,
  type ResolvedLocation,
  type Service,
  type StateCode,
  type Zip5,
} from "@amc/core";
import { tx, type Queryable } from "../db/pool";

interface RuleRow {
  id: string;
  kind: "include" | "exclude";
  move_types: MoveType[];
  move_sizes: MoveSize[];
  services: Service[];
  paused: boolean;
  locations: { side: "origin" | "destination"; level: "state" | "county" | "zip"; value: string }[] | null;
}

function locationSet(locations: NonNullable<RuleRow["locations"]>, side: "origin" | "destination"): LocationSet | undefined {
  const mine = locations.filter((l) => l.side === side);
  if (mine.length === 0) return undefined;
  return {
    states: mine.filter((l) => l.level === "state").map((l) => l.value as StateCode),
    countyFips: mine.filter((l) => l.level === "county").map((l) => l.value),
    zips: mine.filter((l) => l.level === "zip").map((l) => l.value as Zip5),
  };
}

export interface MatchProfileWithVersion {
  profile: CompanyMatchProfile;
  coverageVersion: number;
}

/** The company's matcher input from the database (capabilities, rules, company_can_purchase). */
export async function loadMatchProfile(db: Queryable, companyId: string, options: { lock?: boolean } = {}): Promise<MatchProfileWithVersion | null> {
  const company = await db.query<{ eligible: boolean; coverage_version: number; move_types: MoveType[] | null; move_sizes: MoveSize[] | null; services: Service[] | null }>(
    `select company_can_purchase(c) as eligible, c.coverage_version, cap.move_types, cap.move_sizes, cap.services
     from companies c left join company_capabilities cap on cap.company_id = c.id
     where c.id = $1 ${options.lock ? "for update of c" : ""}`,
    [companyId],
  );
  const row = company.rows[0];
  if (!row) return null;
  const rules = await db.query<RuleRow>(
    `select r.id, r.kind, r.move_types, r.move_sizes, r.services, r.paused,
            (select json_agg(json_build_object('side', l.side, 'level', l.level, 'value', l.value))
             from coverage_rule_locations l where l.rule_id = r.id) as locations
     from coverage_rules r where r.company_id = $1 order by r.created_at, r.id`,
    [companyId],
  );
  const coverage: CoverageRule[] = rules.rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    origin: locationSet(r.locations ?? [], "origin"),
    destination: locationSet(r.locations ?? [], "destination"),
    moveTypes: r.move_types,
    moveSizes: r.move_sizes,
    services: r.services,
    paused: r.paused,
  }));
  return {
    coverageVersion: row.coverage_version,
    profile: {
      companyId,
      eligibleToPurchase: row.eligible,
      capabilities: { moveTypes: row.move_types ?? [], moveSizes: row.move_sizes ?? [], services: row.services ?? [] },
      rules: coverage,
    },
  };
}

/** The matcher facts of a request group's primary lead, or null when they are incomplete. */
export async function leadFactsForGroup(db: Queryable, groupId: string): Promise<LeadFacts | null> {
  const result = await db.query<{
    origin_zip: string;
    origin_city: string | null;
    origin_state: string | null;
    origin_county_fips: string | null;
    dest_zip: string;
    dest_city: string | null;
    dest_state: string | null;
    dest_county_fips: string | null;
    move_type: MoveType | null;
    move_size: MoveSize | null;
    services: Service[];
  }>(
    `select origin_zip, origin_city, origin_state, origin_county_fips, dest_zip, dest_city, dest_state, dest_county_fips,
            move_type, move_size, services
     from leads where group_id = $1 and is_primary order by created_at limit 1`,
    [groupId],
  );
  const l = result.rows[0];
  if (!l || !l.move_type || !l.move_size || !l.origin_state || !l.dest_state) return null;
  const origin: ResolvedLocation = { zip: l.origin_zip as Zip5, city: l.origin_city ?? "", state: l.origin_state as StateCode, countyFips: l.origin_county_fips ?? "" };
  const destination: ResolvedLocation = { zip: l.dest_zip as Zip5, city: l.dest_city ?? "", state: l.dest_state as StateCode, countyFips: l.dest_county_fips ?? "" };
  return { origin, destination, moveType: l.move_type, moveSize: l.move_size, services: l.services };
}

export type RefreshResult = { refreshed: true; ruleId: string } | { refreshed: false; reason: string };

/**
 * Re-runs the matcher for the company and request after a coverage change. When the move still
 * matches, the snapshot takes the company's current coverage_version and rule (named_in_consent
 * unchanged) so reserve_purchase can be retried; otherwise the stale snapshot stays as it is and
 * keeps blocking the purchase.
 */
export async function refreshEligibility(companyId: string, groupId: string): Promise<RefreshResult> {
  return tx(async (client) => {
    // Lock the company row: coverage edits bump coverage_version on it, so the version read here is
    // the one the rules below belong to.
    const loaded = await loadMatchProfile(client, companyId, { lock: true });
    if (!loaded) return { refreshed: false, reason: "company_not_found" };
    const snapshot = await client.query<{ named_in_consent: boolean }>(
      "select named_in_consent from lead_eligibility where group_id = $1 and company_id = $2 for update",
      [groupId, companyId],
    );
    if (!snapshot.rows[0]?.named_in_consent) return { refreshed: false, reason: "not_named_in_consent" };
    const facts = await leadFactsForGroup(client, groupId);
    if (!facts) return { refreshed: false, reason: "lead_facts_incomplete" };
    const result = matchCompany(loaded.profile, facts);
    if (!result.eligible) return { refreshed: false, reason: result.reason };
    await client.query(
      `update lead_eligibility set coverage_version = $3, matched_rule_id = $4, matched_at = now()
       where group_id = $1 and company_id = $2 and named_in_consent`,
      [groupId, companyId, loaded.coverageVersion, result.ruleId],
    );
    return { refreshed: true, ruleId: result.ruleId };
  });
}
