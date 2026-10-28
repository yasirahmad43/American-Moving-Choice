import { env } from "@amc/server/env";

/**
 * /for-movers/apply/ sends movers to the company sign-up on the app (site architecture §1.1). A
 * temporary redirect, read at request time, so a change to APP_URL never needs a rebuild.
 */
export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(null, { status: 307, headers: { Location: `${env().APP_URL}/signup`, "Cache-Control": "no-store" } });
}
