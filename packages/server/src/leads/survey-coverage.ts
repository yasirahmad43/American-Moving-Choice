/**
 * What we found, as the survey island calls it: validates the move details, rate limits per IP
 * address, runs checkCoverage and hands back what the next steps need (the count question's
 * maximum, the active consent text and a signed survey ticket for the minimum completion time).
 * Nothing here receives or stores contact details.
 */
import { parseSize, parseWhere, servicesForNeed, type FieldErrors } from "@amc/core/src/survey";
import { publicFormRateLimit } from "../public-forms/guards";
import { hmacSecret } from "../env/env";
import { getSettings } from "../settings/settings";
import { anonymousCoverage, checkCoverage, type CoverageResult } from "./coverage";
import { issueSurveyTicket } from "./quality";
import { coverageRequestSchema } from "./schemas";
import { activeConsent, type ActiveConsent } from "./submit";

/** Coverage checks per IP address per hour; generous, it only slows enumeration of the network. */
export const COVERAGE_RATE_LIMIT = { limit: 60, windowSeconds: 60 * 60 } as const;

export type SurveyCoverageResult =
  | { ok: false; kind: "invalid"; errors: FieldErrors }
  | { ok: false; kind: "rate_limited" }
  | { ok: true; coverage: CoverageResult; ticket: string; consent: ActiveConsent; maxLimit: number };

export async function surveyCoverage(raw: unknown, meta: { ip: string | null }): Promise<SurveyCoverageResult> {
  const limit = await publicFormRateLimit("survey:coverage:ip", meta.ip, COVERAGE_RATE_LIMIT.limit, COVERAGE_RATE_LIMIT.windowSeconds);
  if (!limit.allowed) return { ok: false, kind: "rate_limited" };
  const parsed = coverageRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, kind: "invalid", errors: { form: "Something in the form didn't come through. Check your answers and try again." } };
  const input = parsed.data;
  const where = parseWhere(input);
  const size = parseSize(input);
  const errors: FieldErrors = {};
  if (!where.ok) Object.assign(errors, where.errors);
  if (!size.ok) Object.assign(errors, size.errors);
  if (input.need === "vehicle_only" || input.need === "truck_rental") errors.need = "We don't send vehicle-only or truck-rental requests to movers.";
  if (!where.ok || !size.ok || Object.keys(errors).length) return { ok: false, kind: "invalid", errors };

  const coverage = await checkCoverage({
    originZip: where.value.originZip,
    destZip: where.value.destZip,
    moveSize: size.value.moveSize,
    services: servicesForNeed(input.need, size.value.services),
    profileCompanyId: null,
  });
  if (!coverage.ok) {
    return { ok: false, kind: "invalid", errors: coverage.reason === "unknown_origin" ? { originZip: "We don't recognize this ZIP code. Check it and try again." } : { destZip: "We don't recognize this ZIP code. Check it and try again." } };
  }
  const settings = await getSettings();
  return { ok: true, coverage: anonymousCoverage(coverage), ticket: issueSurveyTicket(hmacSecret()), consent: await activeConsent(), maxLimit: settings.max_sharing_limit };
}
