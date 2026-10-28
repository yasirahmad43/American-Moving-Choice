/**
 * Admin coverage and distribution tools (MVP scope M10 "coverage … distribution"; audit fix F4).
 *
 * Coverage: the admin edits a company's rules and capabilities through the same functions the
 * portal uses (packages/server/src/coverage), as an AdminCoverageActor, so validation, the
 * capability ceiling, coverage_version bumps and the audit rows are identical; only actor_type
 * differs ('admin'). Changes apply to future requests, as for the company itself.
 *
 * Distribution: "re-run matching" refreshes a request group's lead_eligibility snapshots against
 * the companies' current coverage. Consent scope never widens: only companies already named in the
 * consumer's consent (named_in_consent) are refreshed, a company the consumer removed stays
 * removed, and no company is ever added to a request it was not shown for.
 */
import { audit } from "../audit/audit";
import {
  deleteCoverageRule,
  getCoverage,
  saveCoverageRule,
  setRulesPaused,
  updateCapabilities,
  type AdminCoverageActor,
  type CapabilitiesResult,
  type CoverageOverview,
  type SaveRuleResult,
} from "../coverage/coverage";
import { getPool, isUuid, type Queryable } from "../db/pool";
import { refreshEligibility, type RefreshResult } from "../marketplace/eligibility";
import { AdminError, type AdminActor } from "./common";

const asCoverageActor = (actor: AdminActor, companyId: string): AdminCoverageActor => {
  if (!isUuid(companyId)) throw new AdminError("Company not found.", "not_found");
  return { admin: true, userId: actor.userId, companyId };
};

export async function adminGetCoverage(actor: AdminActor, companyId: string): Promise<CoverageOverview> {
  return getCoverage(asCoverageActor(actor, companyId));
}

/** Creates (ruleId null) or replaces one of the company's coverage rules. */
export async function adminSaveCoverageRule(actor: AdminActor, companyId: string, ruleId: string | null, input: unknown): Promise<SaveRuleResult> {
  return saveCoverageRule(asCoverageActor(actor, companyId), ruleId, input, { ip: actor.ip ?? null });
}

export async function adminDeleteCoverageRule(actor: AdminActor, companyId: string, ruleId: string): Promise<boolean> {
  return deleteCoverageRule(asCoverageActor(actor, companyId), ruleId, { ip: actor.ip ?? null });
}

/** Pauses or resumes one rule, or every rule of the company (ruleId null). Returns the rules changed. */
export async function adminSetRulesPaused(actor: AdminActor, companyId: string, ruleId: string | null, paused: boolean): Promise<number> {
  return setRulesPaused(asCoverageActor(actor, companyId), ruleId, paused, { ip: actor.ip ?? null });
}

export async function adminUpdateCapabilities(actor: AdminActor, companyId: string, input: unknown): Promise<CapabilitiesResult> {
  return updateCapabilities(asCoverageActor(actor, companyId), input, { ip: actor.ip ?? null });
}

export interface RematchOutcome {
  groupId: string;
  /** Companies named in the consent whose snapshot now carries their current coverage. */
  refreshed: { companyId: string; ruleId: string }[];
  /** Named companies whose current coverage no longer matches (their stale snapshot keeps blocking purchase). */
  notMatching: { companyId: string; reason: string }[];
  /** Companies the consumer removed: never re-added. */
  removed: number;
}

/**
 * Re-runs the matcher for every company named in a request's consent. A refreshed snapshot takes
 * the company's current coverage_version, so reserve_purchase stops reporting eligibility_stale;
 * a company whose coverage no longer includes the move keeps its stale snapshot. Companies the
 * consumer removed, and companies never shown to the consumer, are not touched (lead lifecycle
 * §3, §4: consent scope never widens).
 */
export async function rematchLeadGroup(actor: AdminActor, groupId: string, db: Queryable = getPool()): Promise<RematchOutcome> {
  if (!isUuid(groupId)) throw new AdminError("Request not found.", "not_found");
  const group = await db.query<{ status: string }>("select status from lead_groups where id = $1", [groupId]);
  if (!group.rows[0]) throw new AdminError("Request not found.", "not_found");
  if (group.rows[0].status !== "available") throw new AdminError("Only a request that is still on sale can be re-matched.", "bad_status");
  const snapshots = await db.query<{ company_id: string; named_in_consent: boolean }>(
    "select company_id, named_in_consent from lead_eligibility where group_id = $1 order by company_id",
    [groupId],
  );
  const outcome: RematchOutcome = { groupId, refreshed: [], notMatching: [], removed: snapshots.rows.filter((r) => !r.named_in_consent).length };
  for (const row of snapshots.rows) {
    if (!row.named_in_consent) continue;
    const result: RefreshResult = await refreshEligibility(row.company_id, groupId);
    if (result.refreshed) outcome.refreshed.push({ companyId: row.company_id, ruleId: result.ruleId });
    else outcome.notMatching.push({ companyId: row.company_id, reason: result.reason });
  }
  await audit(
    {
      actorType: "admin",
      actorId: actor.userId,
      action: "lead.rematch",
      entity: "lead_group",
      entityId: groupId,
      after: {
        refreshed: outcome.refreshed.map((r) => r.companyId),
        not_matching: outcome.notMatching.map((r) => ({ company_id: r.companyId, reason: r.reason })),
        removed_untouched: outcome.removed,
      },
      ip: actor.ip ?? null,
    },
    db,
  );
  return outcome;
}
