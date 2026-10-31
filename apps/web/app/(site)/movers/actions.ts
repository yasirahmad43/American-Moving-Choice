"use server";

import { checkRateLimit, rateLimitKey, requestMeta } from "@amc/server/auth";
import { lookupZip, stateByCode } from "@amc/server/geo";
import type { ActionState } from "@/components/directory/form-state";

export interface LocationReport {
  city: string;
  stateCode: string;
  stateName: string;
  stateSlug: string;
}

export type ZipCheckState = ActionState<"zip", LocationReport>;

/**
 * Resolves a ZIP to real postal location data for guide navigation. It reads no company,
 * availability or coverage records. The entered ZIP is not put in a URL or stored.
 */
export async function findZipGuides(previous: ZipCheckState, form: FormData): Promise<ZipCheckState> {
  const attempt = previous.attempt + 1;
  const zip = typeof form.get("zip") === "string" ? (form.get("zip") as string).trim() : "";
  const { ip } = await requestMeta();
  const limit = await checkRateLimit(rateLimitKey("movers:zip", ip ?? "unknown"), 60, 10 * 60);
  if (!limit.allowed) return { status: "error", attempt, message: "Too many checks from this connection. Try again in a few minutes.", values: { zip } };
  if (!/^\d{5}$/u.test(zip)) return { status: "error", attempt, fieldErrors: { zip: "Enter a 5-digit ZIP code." }, values: { zip } };
  const location = lookupZip(zip);
  const state = location ? stateByCode(location.state) : null;
  if (!location || !state) return { status: "error", attempt, fieldErrors: { zip: "We don't recognize that ZIP code. Check it and try again." }, values: { zip } };
  return {
    status: "success",
    attempt,
    values: { zip },
    result: {
      city: location.city,
      stateCode: state.code,
      stateName: state.name,
      stateSlug: state.slug,
    },
  };
}
