"use server";

import { checkRateLimit, rateLimitKey, requestMeta } from "@amc/server/auth";
import { lookupMover, type LookupKind, type MoverLookupResult } from "@amc/server/profiles";
import type { ActionState } from "@/components/directory/form-state";

/** The lookup result as plain data for the client (dates as ISO strings). */
export type LookupView = Exclude<MoverLookupResult, { status: "invalid" }> extends infer R
  ? R extends { retrievedAt: Date }
    ? Omit<R, "retrievedAt"> & { retrievedAt: string }
    : never
  : never;

export type LookupState = ActionState<"kind" | "number", LookupView>;

/** Looks a mover up by USDOT or MC number. A POST, so the number never appears in a URL. */
export async function lookupMoverAction(previous: LookupState, form: FormData): Promise<LookupState> {
  const attempt = previous.attempt + 1;
  const kindRaw = form.get("kind");
  const number = typeof form.get("number") === "string" ? (form.get("number") as string).trim() : "";
  const values = { kind: typeof kindRaw === "string" ? kindRaw : "", number };
  if (kindRaw !== "usdot" && kindRaw !== "mc") {
    return { status: "error", attempt, fieldErrors: { kind: "Choose USDOT number or MC number." }, values };
  }
  const { ip } = await requestMeta();
  const limit = await checkRateLimit(rateLimitKey("verify:ip", ip ?? "unknown"), 30, 10 * 60);
  if (!limit.allowed) return { status: "error", attempt, message: "Too many lookups from this connection. Try again in a few minutes.", values };
  const result = await lookupMover(kindRaw as LookupKind, number);
  if (result.status === "invalid") return { status: "error", attempt, fieldErrors: { number: result.message }, values };
  return { status: "success", attempt, values, result: { ...result, retrievedAt: result.retrievedAt.toISOString() } as LookupView };
}
