"use server";

/**
 * Coverage editor actions, called from the client island. Each resolves the member and role on
 * the server; @amc/server/coverage validates the input (shape, geography, capability ceiling) and
 * checks the membership again inside its transaction.
 */
import { COMPANY_MANAGERS, PermissionError } from "@amc/server/companies";
import {
  deleteCoverageRule,
  saveCoverageRule,
  setRulesPaused,
  testMove,
  updateCapabilities,
  type TestMoveResult,
} from "@amc/server/coverage";
import { countiesByState } from "@amc/server/geo";
import { refresh } from "next/cache";
import { actionContext } from "@/components/portal/onboarding/server-helpers";

export type RuleActionResult = { ok: true } | { ok: false; errors: string[] };

const denied = (error: unknown): RuleActionResult => {
  if (error instanceof PermissionError) return { ok: false, errors: [error.message] };
  throw error;
};

export async function saveRuleAction(ruleId: string | null, rule: unknown): Promise<RuleActionResult> {
  const ctx = await actionContext(COMPANY_MANAGERS);
  try {
    const result = await saveCoverageRule(ctx.actor, typeof ruleId === "string" ? ruleId : null, rule, { ip: ctx.ip });
    if (!result.ok) return { ok: false, errors: result.errors };
  } catch (error) {
    return denied(error);
  }
  refresh();
  return { ok: true };
}

export async function deleteRuleAction(ruleId: string): Promise<RuleActionResult> {
  const ctx = await actionContext(COMPANY_MANAGERS);
  try {
    const deleted = await deleteCoverageRule(ctx.actor, String(ruleId), { ip: ctx.ip });
    if (!deleted) return { ok: false, errors: ["That rule no longer exists."] };
  } catch (error) {
    return denied(error);
  }
  refresh();
  return { ok: true };
}

export async function setPausedAction(ruleId: string | null, paused: boolean): Promise<RuleActionResult> {
  const ctx = await actionContext(COMPANY_MANAGERS);
  try {
    await setRulesPaused(ctx.actor, typeof ruleId === "string" ? ruleId : null, paused === true, { ip: ctx.ip });
  } catch (error) {
    return denied(error);
  }
  refresh();
  return { ok: true };
}

export type CapabilitiesActionResult = { ok: true } | { ok: false; fieldErrors: Record<string, string>; errors?: string[] };

export async function saveCapabilitiesAction(input: unknown): Promise<CapabilitiesActionResult> {
  const ctx = await actionContext(COMPANY_MANAGERS);
  try {
    const result = await updateCapabilities(ctx.actor, input, { ip: ctx.ip });
    if (!result.ok) return { ok: false, fieldErrors: result.fieldErrors as Record<string, string> };
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, fieldErrors: {}, errors: [error.message] };
    throw error;
  }
  refresh();
  return { ok: true };
}

export async function testMoveAction(input: { fromZip: string; toZip: string; moveSize: string; services: string[] }): Promise<TestMoveResult> {
  const ctx = await actionContext(COMPANY_MANAGERS);
  try {
    return await testMove(ctx.actor, {
      fromZip: String(input?.fromZip ?? ""),
      toZip: String(input?.toZip ?? ""),
      moveSize: String(input?.moveSize ?? "") as never,
      services: Array.isArray(input?.services) ? input.services.map(String) as never : ([] as never),
    });
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Counties of one state from the bundled geo module (for the county picker). */
export async function countiesAction(state: string): Promise<{ fips: string; name: string }[]> {
  await actionContext(COMPANY_MANAGERS);
  return countiesByState(String(state ?? "").slice(0, 2)).map((c) => ({ fips: c.fips, name: c.name }));
}
