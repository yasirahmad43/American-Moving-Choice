import { getCurrentUser } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { beginBingConnection, bingConnectionAvailable, BingConnectionError } from "@amc/server/reporting";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "Vary": "Cookie",
  "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
};
function configuredOrigin(): string {
  const configured = env().APP_URL;
  const url = new URL(configured);
  if (!/^https?:$/u.test(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/" || configured !== url.origin) {
    throw new Error("Connection unavailable");
  }
  return url.origin;
}
function cleanFailure(origin: string): Response {
  return new Response(null, { status: 303, headers: { ...headers, Location: origin + "/admin/growth?connection=bing_failed" } });
}
function authorizationUrl(value: string, origin: string): string {
  const url = new URL(value);
  const expected = ["client_id", "response_type", "redirect_uri", "scope", "state"];
  if (url.origin !== "https://www.bing.com" || url.pathname !== "/webmasters/oauth/authorize" || url.username || url.password || url.hash ||
      [...url.searchParams.keys()].some(key => !expected.includes(key)) || expected.some(key => url.searchParams.getAll(key).length !== 1) ||
      !/^[A-Za-z0-9._-]{1,200}$/u.test(url.searchParams.get("client_id") ?? "") ||
      url.searchParams.get("response_type") !== "code" || url.searchParams.get("scope") !== "webmaster.read" ||
      url.searchParams.get("redirect_uri") !== origin + "/api/admin/growth/bing/callback" ||
      !/^[A-Za-z0-9_-]{43}$/u.test(url.searchParams.get("state") ?? "")) throw new Error("Connection unavailable");
  return url.toString();
}

type StartStage = "connect_auth" | "connect_config" | "connect_request" | "connect_configured" | "connect_core" | "connect_authorize";
type StartReason = "unauthorized" | "forbidden" | "unavailable" | "request_origin" | "origin_header" | "fetch_site" | "not_configured" | "authorize_url";
interface OriginChecks { headerPresent: boolean; headerMatches: boolean; requestOriginMatches: boolean; fetchSiteMatches: boolean }
function startFailure(stage: StartStage, reason: StartReason, checks?: OriginChecks): void {
  // Fixed enums and booleans only; never inspect/log a header value, callback value or error.
  console.warn("reporting_bing_start_failure", { stage, reason, ...checks });
}

/** A native same-origin POST starts the owner-bound authorization; URL/body redirect inputs are ignored. */
export async function POST(request: Request): Promise<Response> {
  let origin: string | undefined;
  let stage: StartStage = "connect_auth";
  try {
    const user = await getCurrentUser();
    if (!user || user.mfa !== "ok") { startFailure(stage, "unauthorized"); return Response.json({ error: "unauthorized" }, { status: 401, headers }); }
    if (user.adminRole !== "super_admin") { startFailure(stage, "forbidden"); return Response.json({ error: "forbidden" }, { status: 403, headers }); }
    stage = "connect_config";
    origin = configuredOrigin();
    stage = "connect_request";
    const checks: OriginChecks = {
      headerPresent: request.headers.has("origin"), headerMatches: request.headers.get("origin") === origin,
      requestOriginMatches: new URL(request.url).origin === origin, fetchSiteMatches: request.headers.get("sec-fetch-site") === "same-origin",
    };
    if (!checks.requestOriginMatches || !checks.headerMatches || !checks.fetchSiteMatches) {
      startFailure(stage, !checks.requestOriginMatches ? "request_origin" : !checks.headerMatches ? "origin_header" : "fetch_site", checks);
      return Response.json({ error: "forbidden" }, { status: 403, headers });
    }
    stage = "connect_configured";
    if (!bingConnectionAvailable()) { startFailure(stage, "not_configured"); return cleanFailure(origin); }
    stage = "connect_core";
    const started = await beginBingConnection({ userId: user.id, sessionId: user.session.id });
    stage = "connect_authorize";
    return new Response(null, { status: 303, headers: { ...headers, Location: authorizationUrl(started.authorizeUrl, origin) } });
  } catch (error) {
    // Classified core errors already have diagnostics; route failures and unexpected core-entry errors need one event.
    if (stage !== "connect_core" || !(error instanceof BingConnectionError)) startFailure(stage, stage === "connect_authorize" ? "authorize_url" : "unavailable");
    return origin ? cleanFailure(origin) : Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}

/** Link previews and ordinary GET navigation must never create an authorization state. */
export async function GET(): Promise<Response> {
  return Response.json({ error: "method_not_allowed" }, { status: 405, headers: { ...headers, Allow: "POST" } });
}
