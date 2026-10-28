"use server";

import { lookupZip } from "@amc/server/geo";

/** City and state for the ZIP helper line (VD §9.2). Pure lookup in the bundled dataset; nothing is stored. */
export async function lookupZipAction(zip: unknown): Promise<{ city: string; state: string } | null> {
  if (typeof zip !== "string" || !/^\d{5}$/.test(zip)) return null;
  const found = lookupZip(zip);
  return found ? { city: found.city, state: found.state } : null;
}
