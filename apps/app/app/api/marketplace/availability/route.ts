/**
 * Real-time availability for the marketplace (lead lifecycle §5: "updates carry only lead ID,
 * status and buyer count"). GET /api/marketplace/availability?ids=<uuid>,<uuid>… answers for the
 * signed-in member's active company and only for request groups that company is named in; any
 * other ID reads "unavailable". Polled by LiveAvailability every 10 s while the page is visible.
 * Buying always re-checks on the server: this endpoint is advisory.
 */
import { activeCompanyPreference, getCurrentUser } from "@amc/server/auth";
import { AVAILABILITY_MAX_IDS, PermissionError, availabilityFor } from "@amc/server/marketplace";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || user.mfa !== "ok") return Response.json({ error: "unauthorized" }, { status: 401, headers });
  const preferred = await activeCompanyPreference();
  const membership = user.memberships.find((m) => m.companyId === preferred) ?? user.memberships[0];
  if (!membership) return Response.json({ error: "no_company" }, { status: 403, headers });

  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0 || ids.length > AVAILABILITY_MAX_IDS) return Response.json({ error: "bad_request" }, { status: 400, headers });

  try {
    const rows = await availabilityFor({ userId: user.id, companyId: membership.companyId }, ids);
    return Response.json({ at: new Date().toISOString(), rows }, { headers });
  } catch (error) {
    if (error instanceof PermissionError) return Response.json({ error: "forbidden" }, { status: 403, headers });
    console.error(`[availability] failed${error instanceof Error ? ` (${error.name})` : ""}`);
    return Response.json({ error: "unavailable" }, { status: 500, headers });
  }
}
