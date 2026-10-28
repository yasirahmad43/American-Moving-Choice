"use server";

import { checkRateLimit, rateLimitKey, requestMeta } from "@amc/server/auth";
import { coverageForZip } from "@amc/server/geo-pages";
import type { ActionState } from "@/components/directory/form-state";

export interface CoverageReport {
  city: string;
  stateCode: string;
  stateName: string;
  moversStartingInState: number;
  explicitInState: number;
}

export type ZipCheckState = ActionState<"zip", CoverageReport>;

/**
 * Reports what the network covers for moves starting in a ZIP's state. The form posts, so the ZIP
 * never appears in a URL, and nothing stores it (site architecture §0: ZIPs are for matching only).
 */
export async function checkZipCoverage(previous: ZipCheckState, form: FormData): Promise<ZipCheckState> {
  const attempt = previous.attempt + 1;
  const zip = typeof form.get("zip") === "string" ? (form.get("zip") as string).trim() : "";
  const { ip } = await requestMeta();
  const limit = await checkRateLimit(rateLimitKey("movers:zip", ip ?? "unknown"), 60, 10 * 60);
  if (!limit.allowed) return { status: "error", attempt, message: "Too many checks from this connection. Try again in a few minutes.", values: { zip } };
  const coverage = await coverageForZip(zip);
  if (coverage.status === "invalid") return { status: "error", attempt, fieldErrors: { zip: "Enter a 5-digit ZIP code." }, values: { zip } };
  if (coverage.status === "unknown") return { status: "error", attempt, fieldErrors: { zip: "We don't recognize that ZIP code. Check it and try again." }, values: { zip } };
  return {
    status: "success",
    attempt,
    values: { zip },
    result: {
      city: coverage.location.city,
      stateCode: coverage.location.state,
      stateName: coverage.stateName,
      moversStartingInState: coverage.moversStartingInState,
      explicitInState: coverage.explicitInState,
    },
  };
}
