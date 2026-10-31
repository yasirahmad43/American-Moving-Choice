/**
 * Coverage pre-check for What we found (build plan §7.2; lead lifecycle §2 step 5, §3). Resolves
 * the ZIP codes, distance and move type, loads every company that can buy now (company_can_purchase
 * in SQL), its verified capabilities and its coverage rules, and runs the @amc/core matcher. The
 * eligible movers come back in the neutral order (profile-origin company first).
 */
import {
  matchCompany,
  type CompanyMatchProfile,
  type CoverageRule,
  type LeadFacts,
  type MoveSize,
  type MoveType,
  type Service,
  type StateCode,
  type Zip5,
} from "@amc/core";
import { neutralOrder } from "@amc/core/src/survey";
import { getPool, isUuid, type Queryable } from "../db/pool";
import { lookupZip, resolveMove, type ZipLocation } from "../geo/geo";
import { getLocalMaxMiles } from "../settings/settings";

export interface CoverageInput {
  originZip: string;
  destZip: string;
  moveSize: MoveSize;
  services: Service[];
  /** The request started from this company's profile; it is listed first when eligible. */
  profileCompanyId?: string | null;
}

/** What the consumer may see about an eligible mover: no prices, no phone numbers. */
export interface CoverageMover {
  companyId: string;
  displayName: string;
  usdotNumber: string | null;
  /** Latest passing federal-record check (ISO timestamp), or null when none is recorded. */
  checkedAt: string | null;
  /** Public profile slug (/companies/{slug}/) when the profile is live. */
  profileSlug: string | null;
  isDemo: boolean;
}

/** Server-only match details kept for the eligibility snapshot. */
export interface MatchedMover extends CoverageMover {
  ruleId: string;
  coverageVersion: number;
}

export interface MoveFacts {
  origin: { zip: string; city: string; state: StateCode; countyFips: string };
  destination: { zip: string; city: string; state: StateCode; countyFips: string };
  distanceMiles: number;
  moveType: MoveType;
}

export type CoverageResult<M extends CoverageMover = CoverageMover> =
  | { ok: false; reason: "unknown_origin" | "unknown_destination" }
  | {
      ok: true;
      move: MoveFacts;
      movers: M[];
      /** The profile-origin company, when there is one, and whether it serves this move. */
      profileCompany: { companyId: string; displayName: string; eligible: boolean } | null;
    };

interface CompanyRow {
  id: string;
  usdot_number: string | null;
  coverage_version: number;
  is_demo: boolean;
  display_name: string;
  profile_slug: string | null;
  move_types: MoveType[] | null;
  move_sizes: MoveSize[] | null;
  services: Service[] | null;
  checked_at: Date | null;
}

interface RuleRow {
  id: string;
  company_id: string;
  kind: "include" | "exclude";
  move_types: MoveType[];
  move_sizes: MoveSize[];
  services: Service[];
  paused: boolean;
  side: "origin" | "destination" | null;
  level: "state" | "county" | "zip" | null;
  value: string | null;
}

/** Federal-record checks whose latest pass is shown as "checked on" (mover verification §3). */
const FEDERAL_CHECKS = ["usdot_active", "authority_type", "authority_status", "insurance_filings"];

async function loadPurchasableCompanies(db: Queryable): Promise<CompanyRow[]> {
  // Fixtures remain usable in local/test workflows, but can never receive a real
  // production customer's request, even if DEMO_MODE was left enabled at launch.
  const allowDemoCompanies = process.env.NODE_ENV !== "production";
  const result = await db.query<CompanyRow>(
    `select c.id, c.usdot_number, c.coverage_version, c.is_demo,
            coalesce(p.display_name, c.dba_name, c.legal_name) as display_name,
            case when p.public_status = 'live' then p.slug end as profile_slug,
            cap.move_types, cap.move_sizes, cap.services,
            (select max(v.created_at) from verification_checks v
              where v.company_id = c.id and v.result = 'pass' and v.check_type = any($1::text[])) as checked_at
       from companies c
       left join company_profiles p on p.company_id = c.id
       left join company_capabilities cap on cap.company_id = c.id
      where company_can_purchase(c)
        and ($2::boolean or not c.is_demo)
      order by c.id`,
    [FEDERAL_CHECKS, allowDemoCompanies],
  );
  return result.rows;
}

async function loadRules(companyIds: string[], db: Queryable): Promise<Map<string, CoverageRule[]>> {
  const byCompany = new Map<string, CoverageRule[]>();
  if (companyIds.length === 0) return byCompany;
  const result = await db.query<RuleRow>(
    `select r.id, r.company_id, r.kind, r.move_types, r.move_sizes, r.services, r.paused, l.side, l.level, l.value
       from coverage_rules r
       left join coverage_rule_locations l on l.rule_id = r.id
      where r.company_id = any($1::uuid[])
      order by r.company_id, r.created_at, r.id`,
    [companyIds],
  );
  const rules = new Map<string, CoverageRule & { companyId: string }>();
  for (const row of result.rows) {
    let rule = rules.get(row.id);
    if (!rule) {
      rule = {
        id: row.id,
        companyId: row.company_id,
        kind: row.kind,
        moveTypes: row.move_types,
        moveSizes: row.move_sizes,
        services: row.services,
        paused: row.paused,
      };
      rules.set(row.id, rule);
    }
    if (row.side && row.level && row.value) {
      const set = (rule[row.side] ??= {});
      if (row.level === "state") (set.states ??= []).push(row.value as StateCode);
      else if (row.level === "county") (set.countyFips ??= []).push(row.value);
      else (set.zips ??= []).push(row.value as Zip5);
    }
  }
  for (const rule of rules.values()) {
    const { companyId, ...plain } = rule;
    const list = byCompany.get(companyId) ?? [];
    list.push(plain);
    byCompany.set(companyId, list);
  }
  return byCompany;
}

const factsFrom = (loc: ZipLocation) => ({ zip: loc.zip, city: loc.city, state: loc.state, countyFips: loc.countyFips });

/** The full match, with the snapshot details submission needs. Server-only. */
export async function matchMovers(input: CoverageInput, db: Queryable = getPool()): Promise<CoverageResult<MatchedMover>> {
  const localMaxMiles = await getLocalMaxMiles(db);
  const move = resolveMove(input.originZip, input.destZip, localMaxMiles);
  if (!move) {
    return { ok: false, reason: lookupZip(input.originZip) ? "unknown_destination" : "unknown_origin" };
  }
  const lead: LeadFacts = {
    origin: move.origin,
    destination: move.destination,
    moveType: move.moveType,
    moveSize: input.moveSize,
    services: input.services,
  };

  const companies = await loadPurchasableCompanies(db);
  const rules = await loadRules(companies.map((c) => c.id), db);
  const eligible: MatchedMover[] = [];
  for (const company of companies) {
    const profile: CompanyMatchProfile = {
      companyId: company.id,
      eligibleToPurchase: true, // company_can_purchase already filtered the rows
      capabilities: { moveTypes: company.move_types ?? [], moveSizes: company.move_sizes ?? [], services: company.services ?? [] },
      rules: rules.get(company.id) ?? [],
    };
    const result = matchCompany(profile, lead);
    if (!result.eligible) continue;
    eligible.push({
      companyId: company.id,
      displayName: company.display_name,
      usdotNumber: company.usdot_number,
      checkedAt: company.checked_at ? company.checked_at.toISOString() : null,
      profileSlug: company.profile_slug,
      isDemo: company.is_demo,
      ruleId: result.ruleId,
      coverageVersion: company.coverage_version,
    });
  }

  const profileId = input.profileCompanyId && isUuid(input.profileCompanyId) ? input.profileCompanyId : null;
  let profileCompany: { companyId: string; displayName: string; eligible: boolean } | null = null;
  if (profileId) {
    const match = eligible.find((m) => m.companyId === profileId);
    if (match) {
      profileCompany = { companyId: profileId, displayName: match.displayName, eligible: true };
    } else {
      const found = await db.query<{ display_name: string }>(
        `select coalesce(p.display_name, c.dba_name, c.legal_name) as display_name
           from companies c left join company_profiles p on p.company_id = c.id
          where c.id = $1 and c.status = 'approved' and p.public_status = 'live'
            and ($2::boolean or not c.is_demo)`,
        [profileId, process.env.NODE_ENV !== "production"],
      );
      if (found.rows[0]) profileCompany = { companyId: profileId, displayName: found.rows[0].display_name, eligible: false };
    }
  }

  return {
    ok: true,
    move: { origin: factsFrom(move.origin), destination: factsFrom(move.destination), distanceMiles: move.distanceMiles, moveType: move.moveType },
    movers: neutralOrder(eligible, (m) => m.companyId, profileCompany?.eligible ? profileId : null),
    profileCompany,
  };
}

/** Strips the snapshot fields: what the browser may receive. */
export function publicMover(m: MatchedMover): CoverageMover {
  return {
    companyId: m.companyId,
    displayName: m.displayName,
    usdotNumber: m.usdotNumber,
    checkedAt: m.checkedAt,
    profileSlug: m.profileSlug,
    isDemo: m.isDemo,
  };
}

/** checkCoverage for What we found: eligible movers in the neutral order, display fields only. */
export async function checkCoverage(input: CoverageInput, db: Queryable = getPool()): Promise<CoverageResult> {
  const result = await matchMovers(input, db);
  if (!result.ok) return result;
  return { ...result, movers: result.movers.map(publicMover) };
}

/** Consumer boundary: retain opaque match IDs for the revalidated eligibility snapshot only.
 * Real names, registration numbers, profile URLs and check metadata stay on the server. */
export function anonymousCoverage(result: CoverageResult): CoverageResult {
  if (!result.ok) return result;
  return {
    ...result,
    profileCompany: null,
    movers: result.movers.map((m) => ({
      companyId: m.companyId,
      displayName: "Participating moving company",
      usdotNumber: null,
      checkedAt: null,
      profileSlug: null,
      isDemo: m.isDemo,
    })),
  };
}
