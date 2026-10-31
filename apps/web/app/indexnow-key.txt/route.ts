import { env } from "@amc/server/env";
import { indexNowKeyResponse } from "@/lib/search-verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A root keyLocation covers this host's public URLs without a DNS change. */
export function GET(): Response {
  return indexNowKeyResponse(env());
}
