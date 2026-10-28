/**
 * Coverage rules and the capability ceiling (lead lifecycle §3; data model §4). Owners and
 * managers edit them; every write runs in one transaction with an audit entry, and the 002
 * triggers move companies.coverage_version on, so eligibility snapshots taken earlier fail at
 * purchase with eligibility_stale. Changes apply to future requests only.
 */
import type { CompanyMatchProfile, CoverageRule, LocationSet, MoveSize, MoveType, Service, StateCode, Zip5 } from "@amc/core";
import { matchCompany } from "@amc/core";
import { audit } from "../audit/audit";
import { getPool, isUuid, tx, type Queryable } from "../db/pool";
import { countyByFips, lookupZip, resolveMove } from "../geo/geo";
import { getSetting } from "../settings/settings";
import { loadActor } from "../companies/actor";
import { COMPANY_MANAGERS, PermissionError, type Actor } from "../companies/permissions";
import {
  COVERAGE_LIMITS,
  MOVE_SIZES,
  SERVICES,
  capabilitiesSchema,
  coverageRuleSchema,
  isEmptySet,
  matchReasonText,
  ruleCapabilityProblems,
  type Capabilities,
  type CoverageRuleInput,
  type GeoValidator,
  type LocationSetInput,
} from "./schema";

export const bundledGeo: GeoValidator = {
  countyState: (fips) => countyByFips(fips)?.state ?? null,
  zipExists: (zip) => lookupZip(zip) !== null,
};

export interface StoredRule extends CoverageRuleInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverageOverview {
  coverageVersion: number;
  capabilities: Capabilities;
  rules: StoredRule[];
}

type RuleRow = {
  id: string;
  kind: "include" | "exclude";
  label: string | null;
  move_types: MoveType[];
  move_sizes: MoveSize[];
  services: Service[];
  paused: boolean;
  created_at: Date;
  updated_at: Date;
  locations: { side: "origin" | "destination"; level: "state" | "county" | "zip"; value: string }[] | null;
};

const emptySet = (): LocationSetInput => ({ states: [], counties: [], zips: [] });

function toStoredRule(row: RuleRow): StoredRule {
  const origin = emptySet();
  const destination = emptySet();
  for (const loc of row.locations ?? []) {
    const set = loc.side === "origin" ? origin : destination;
    if (loc.level === "state") set.states.push(loc.value as StateCode);
    else if (loc.level === "county") set.counties.push(loc.value);
    else set.zips.push(loc.value);
  }
  for (const set of [origin, destination]) {
    set.states.sort();
    set.counties.sort();
    set.zips.sort();
  }
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    origin,
    destination,
    moveTypes: row.move_types,
    moveSizes: row.move_sizes,
    services: row.services,
    paused: row.paused,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Rules with their locations, oldest first. No permission check: callers check first. */
export async function loadRules(companyId: string, db: Queryable = getPool()): Promise<StoredRule[]> {
  const result = await db.query<RuleRow>(
    `select r.id, r.kind, r.label, r.move_types, r.move_sizes, r.services, r.paused, r.created_at, r.updated_at,
            (select json_agg(json_build_object('side', l.side, 'level', l.level, 'value', l.value))
             from coverage_rule_locations l where l.rule_id = r.id) as locations
     from coverage_rules r where r.company_id = $1
     order by r.created_at, r.id`,
    [companyId],
  );
  return result.rows.map(toStoredRule);
}

export async function loadCapabilities(companyId: string, db: Queryable = getPool()): Promise<Capabilities> {
  const result = await db.query<{ move_types: MoveType[]; move_sizes: MoveSize[]; services: Service[] }>(
    "select move_types, move_sizes, services from company_capabilities where company_id = $1",
    [companyId],
  );
  const row = result.rows[0];
  return { moveTypes: row?.move_types ?? [], moveSizes: row?.move_sizes ?? [], services: row?.services ?? [] };
}

/** Coverage rules, capabilities and the current coverage_version (owners and managers). */
export async function getCoverage(actor: Actor): Promise<CoverageOverview> {
  await loadActor(actor, COMPANY_MANAGERS);
  const db = getPool();
  const version = await db.query<{ coverage_version: number }>("select coverage_version from companies where id = $1", [actor.companyId]);
  return {
    coverageVersion: version.rows[0]?.coverage_version ?? 0,
    capabilities: await loadCapabilities(actor.companyId, db),
    rules: await loadRules(actor.companyId, db),
  };
}

async function insertLocations(client: Queryable, ruleId: string, rule: Pick<CoverageRuleInput, "origin" | "destination">): Promise<void> {
  const sides = [] as string[];
  const levels = [] as string[];
  const values = [] as string[];
  for (const side of ["origin", "destination"] as const) {
    const set = rule[side];
    for (const [level, list] of [["state", set.states], ["county", set.counties], ["zip", set.zips]] as const) {
      for (const value of list) {
        sides.push(side);
        levels.push(level);
        values.push(value);
      }
    }
  }
  if (!values.length) return;
  await client.query(
    `insert into coverage_rule_locations (rule_id, side, level, value)
     select $1, s, l, v from unnest($2::text[], $3::text[], $4::text[]) as t(s, l, v)`,
    [ruleId, sides, levels, values],
  );
}

/** Inserts a validated rule (inside the caller's transaction). Returns its ID. */
export async function insertRule(client: Queryable, companyId: string, rule: CoverageRuleInput): Promise<string> {
  const inserted = await client.query<{ id: string }>(
    `insert into coverage_rules (company_id, kind, move_types, move_sizes, services, paused, label)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [companyId, rule.kind, rule.moveTypes, rule.moveSizes, rule.services, rule.paused, rule.label],
  );
  const id = inserted.rows[0]!.id;
  await insertLocations(client, id, rule);
  return id;
}

export type SaveRuleResult = { ok: true; ruleId: string; coverageVersion: number } | { ok: false; errors: string[] };

const versionOf = async (client: Queryable, companyId: string) =>
  (await client.query<{ coverage_version: number }>("select coverage_version from companies where id = $1", [companyId])).rows[0]!.coverage_version;

function ruleAuditView(rule: CoverageRuleInput) {
  return {
    kind: rule.kind,
    label: rule.label,
    origin: rule.origin,
    destination: rule.destination,
    move_types: rule.moveTypes,
    move_sizes: rule.moveSizes,
    services: rule.services,
    paused: rule.paused,
  };
}

/**
 * Creates a rule (ruleId null) or replaces one of the company's rules. Validates shape,
 * geography and the capability ceiling on the server.
 */
export async function saveCoverageRule(
  actor: Actor,
  ruleId: string | null,
  input: unknown,
  meta: { ip?: string | null } = {},
): Promise<SaveRuleResult> {
  const parsed = coverageRuleSchema(bundledGeo).safeParse(input);
  if (!parsed.success) return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  const rule = parsed.data;
  if (rule.kind === "exclude" && isEmptySet(rule.origin) && isEmptySet(rule.destination) && !rule.moveTypes.length && !rule.moveSizes.length && !rule.services.length) {
    return { ok: false, errors: ["An exclusion with nothing chosen would remove all of your coverage. Choose what it excludes, or pause your rules instead."] };
  }
  if (ruleId !== null && !isUuid(ruleId)) return { ok: false, errors: ["That rule doesn't exist."] };

  return tx(async (client): Promise<SaveRuleResult> => {
    const member = await loadActor(actor, COMPANY_MANAGERS, client);
    await client.query("select 1 from companies where id = $1 for update", [actor.companyId]);
    const problems = ruleCapabilityProblems(rule, await loadCapabilities(actor.companyId, client));
    if (problems.length) return { ok: false, errors: problems };

    let id: string;
    let before: unknown = null;
    if (ruleId === null) {
      const count = await client.query<{ n: number }>("select count(*)::int as n from coverage_rules where company_id = $1", [actor.companyId]);
      if ((count.rows[0]?.n ?? 0) >= COVERAGE_LIMITS.rulesPerCompany) {
        return { ok: false, errors: [`You can have up to ${COVERAGE_LIMITS.rulesPerCompany} rules. Combine or delete some first.`] };
      }
      id = await insertRule(client, actor.companyId, rule);
    } else {
      const existing = (await loadRules(actor.companyId, client)).find((r) => r.id === ruleId);
      if (!existing) return { ok: false, errors: ["That rule doesn't exist."] };
      before = ruleAuditView(existing);
      await client.query(
        `update coverage_rules set kind = $3, move_types = $4, move_sizes = $5, services = $6, paused = $7, label = $8
         where id = $1 and company_id = $2`,
        [ruleId, actor.companyId, rule.kind, rule.moveTypes, rule.moveSizes, rule.services, rule.paused, rule.label],
      );
      await client.query("delete from coverage_rule_locations where rule_id = $1", [ruleId]);
      await insertLocations(client, ruleId, rule);
      id = ruleId;
    }
    await audit(
      {
        actorType: "user",
        actorId: member.userId,
        companyId: actor.companyId,
        action: ruleId === null ? "coverage.rule_created" : "coverage.rule_updated",
        entity: "coverage_rule",
        entityId: id,
        before,
        after: ruleAuditView(rule),
        ip: meta.ip ?? null,
      },
      client,
    );
    return { ok: true, ruleId: id, coverageVersion: await versionOf(client, actor.companyId) };
  });
}

/** Deletes one of the company's rules. */
export async function deleteCoverageRule(actor: Actor, ruleId: string, meta: { ip?: string | null } = {}): Promise<boolean> {
  if (!isUuid(ruleId)) return false;
  return tx(async (client) => {
    const member = await loadActor(actor, COMPANY_MANAGERS, client);
    const existing = (await loadRules(actor.companyId, client)).find((r) => r.id === ruleId);
    if (!existing) return false;
    await client.query("delete from coverage_rules where id = $1 and company_id = $2", [ruleId, actor.companyId]);
    await audit(
      { actorType: "user", actorId: member.userId, companyId: actor.companyId, action: "coverage.rule_deleted", entity: "coverage_rule", entityId: ruleId, before: ruleAuditView(existing), ip: meta.ip ?? null },
      client,
    );
    return true;
  });
}

/** Pauses or resumes one rule, or every rule when ruleId is null ("pause all coverage"). */
export async function setRulesPaused(actor: Actor, ruleId: string | null, paused: boolean, meta: { ip?: string | null } = {}): Promise<number> {
  if (ruleId !== null && !isUuid(ruleId)) return 0;
  return tx(async (client) => {
    const member = await loadActor(actor, COMPANY_MANAGERS, client);
    const updated = await client.query<{ id: string }>(
      `update coverage_rules set paused = $3 where company_id = $1 and ($2::uuid is null or id = $2) and paused <> $3 returning id`,
      [actor.companyId, ruleId, paused],
    );
    if (updated.rowCount) {
      await audit(
        {
          actorType: "user",
          actorId: member.userId,
          companyId: actor.companyId,
          action: paused ? "coverage.paused" : "coverage.resumed",
          entity: "coverage_rule",
          entityId: ruleId,
          after: { rule_ids: updated.rows.map((r) => r.id), paused },
          ip: meta.ip ?? null,
        },
        client,
      );
    }
    return updated.rowCount ?? 0;
  });
}

export type CapabilitiesResult = { ok: true; coverageVersion: number } | { ok: false; fieldErrors: Partial<Record<keyof Capabilities, string>> };

/** Writes the capability ceiling (inside a transaction when `client` is given). */
export async function writeCapabilities(client: Queryable, companyId: string, capabilities: Capabilities): Promise<void> {
  await client.query(
    `insert into company_capabilities (company_id, move_types, move_sizes, services) values ($1, $2, $3, $4)
     on conflict (company_id) do update set move_types = excluded.move_types, move_sizes = excluded.move_sizes, services = excluded.services
     where (company_capabilities.move_types, company_capabilities.move_sizes, company_capabilities.services)
       is distinct from (excluded.move_types, excluded.move_sizes, excluded.services)`,
    [companyId, capabilities.moveTypes, capabilities.moveSizes, capabilities.services],
  );
}

/** Updates what the company offers at all (the ceiling rules can't widen). */
export async function updateCapabilities(actor: Actor, input: unknown, meta: { ip?: string | null } = {}): Promise<CapabilitiesResult> {
  const parsed = capabilitiesSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof Capabilities, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof Capabilities | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  return tx(async (client) => {
    const member = await loadActor(actor, COMPANY_MANAGERS, client);
    const before = await loadCapabilities(actor.companyId, client);
    await writeCapabilities(client, actor.companyId, parsed.data);
    await audit(
      { actorType: "user", actorId: member.userId, companyId: actor.companyId, action: "coverage.capabilities_updated", entity: "company_capabilities", entityId: actor.companyId, before, after: parsed.data, ip: meta.ip ?? null },
      client,
    );
    return { ok: true, coverageVersion: await versionOf(client, actor.companyId) };
  });
}

// ------------------------------------------------------------------ test a move

export interface TestMoveInput {
  fromZip: string;
  toZip: string;
  moveSize: MoveSize;
  services: Service[];
}

export type TestMoveResult =
  | {
      ok: true;
      origin: { zip: string; city: string; state: string; countyName: string | null };
      destination: { zip: string; city: string; state: string; countyName: string | null };
      distanceMiles: number;
      moveType: MoveType;
      /** Coverage and capabilities only, as if the company could buy. */
      matches: boolean;
      matchedRule: { id: string; label: string | null } | null;
      reason: string | null;
      /** Whether the company can buy requests right now (company_can_purchase). */
      canPurchase: boolean;
    }
  | { ok: false; error: string };

/** The matcher profile of one company, as the lead intake builds it (rules with locations, ceiling, purchase eligibility). */
export async function companyMatchProfile(companyId: string, db: Queryable = getPool()): Promise<CompanyMatchProfile & { labels: Map<string, string | null> }> {
  const eligible = await db.query<{ ok: boolean }>("select company_can_purchase(c) as ok from companies c where c.id = $1", [companyId]);
  const capabilities = await loadCapabilities(companyId, db);
  const rules = await loadRules(companyId, db);
  const toSet = (set: LocationSetInput): LocationSet => ({ states: set.states, countyFips: set.counties, zips: set.zips as Zip5[] });
  return {
    companyId,
    eligibleToPurchase: eligible.rows[0]?.ok ?? false,
    capabilities,
    rules: rules.map(
      (r): CoverageRule => ({
        id: r.id,
        kind: r.kind,
        origin: toSet(r.origin),
        destination: toSet(r.destination),
        moveTypes: r.moveTypes,
        moveSizes: r.moveSizes,
        services: r.services,
        paused: r.paused,
      }),
    ),
    labels: new Map(rules.map((r) => [r.id, r.label])),
  };
}

/** Runs the @amc/core matcher for a hypothetical move between two ZIP codes (owners and managers). */
export async function testMove(actor: Actor, input: TestMoveInput): Promise<TestMoveResult> {
  await loadActor(actor, COMPANY_MANAGERS);
  if (!(MOVE_SIZES as readonly string[]).includes(input.moveSize)) return { ok: false, error: "Choose a move size." };
  if (!Array.isArray(input.services) || input.services.some((s) => !(SERVICES as readonly string[]).includes(s))) {
    return { ok: false, error: "Choose services from the list." };
  }
  const localMaxMiles = await getSetting("local_max_miles");
  const move = resolveMove(input.fromZip, input.toZip, localMaxMiles);
  if (!move) {
    const bad = !lookupZip(input.fromZip) ? "pickup" : "destination";
    return { ok: false, error: `We don't recognize the ${bad} ZIP code. Enter a 5-digit US ZIP code.` };
  }
  const profile = await companyMatchProfile(actor.companyId);
  const result = matchCompany(
    { ...profile, eligibleToPurchase: true },
    { origin: move.origin, destination: move.destination, moveType: move.moveType, moveSize: input.moveSize, services: input.services },
  );
  const place = (l: typeof move.origin) => ({ zip: l.zip, city: l.city, state: l.state, countyName: l.countyName });
  return {
    ok: true,
    origin: place(move.origin),
    destination: place(move.destination),
    distanceMiles: move.distanceMiles,
    moveType: move.moveType,
    matches: result.eligible,
    matchedRule: result.eligible ? { id: result.ruleId, label: profile.labels.get(result.ruleId) ?? null } : null,
    reason: result.eligible ? null : matchReasonText(result.reason, (id) => profile.labels.get(id) ?? null),
    canPurchase: profile.eligibleToPurchase,
  };
}

export { PermissionError };
