"use server";

import { lookupZip } from "@amc/server/geo";
import { publicFormRateLimit, publicRequestMeta } from "@amc/server/public-forms";

/** A throttled helper label only; a missing label never blocks a valid quote request. */
export async function lookupZipAction(zip: unknown): Promise<{ city: string; state: string } | null> {
  try {
    const { ip } = await publicRequestMeta();
    const limited = await publicFormRateLimit("survey:zip:ip", ip, 120, 10 * 60);
    if (!limited.allowed || typeof zip !== "string" || !/^\d{5}$/u.test(zip)) return null;
    const found = lookupZip(zip);
    return found ? { city: found.city, state: found.state } : null;
  } catch {
    // Optional place labels must not expose storage errors or interrupt the form.
    return null;
  }
}
