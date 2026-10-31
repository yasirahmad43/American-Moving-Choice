import { checkRateLimit, getCurrentUser, hasAdminRole, rateLimitKey } from "@amc/server/auth";

export const growthHeaders = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };

/** API routes bypass layout protection; authorize every read before any reporting query. */
export async function growthAccess(request: Request, scope: "requests" | "providers"): Promise<Response | null> {
  const user = await getCurrentUser();
  if (!user || user.mfa !== "ok") return Response.json({ error: "unauthorized" }, { status: 401, headers: growthHeaders });
  if (!hasAdminRole(user.adminRole, ["super_admin", "ops"])) return Response.json({ error: "forbidden" }, { status: 403, headers: growthHeaders });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "forbidden" }, { status: 403, headers: growthHeaders });
  const limit = await checkRateLimit(rateLimitKey(`admin-growth:${scope}`, user.id), scope === "requests" ? 30 : 15, 60);
  if (!limit.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { ...growthHeaders, "Retry-After": "60" } });
  return null;
}
