"use server";

import { publicFormRateLimit, publicRequestMeta } from "@amc/server/public-forms";
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
  const attempt = Number.isSafeInteger(previous?.attempt) ? Math.min(Math.max(previous.attempt, 0), 1_000_000) + 1 : 1;
  const value = form.get("zip");
  const zip = typeof value === "string" && value.length <= 20 ? value.trim() : "";
  const { ip } = await publicRequestMeta();
  const limit = await publicFormRateLimit("movers:zip", ip, 60, 10 * 60);
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
