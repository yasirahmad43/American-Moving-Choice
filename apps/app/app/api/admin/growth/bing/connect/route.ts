import { getCurrentUser } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { beginBingConnection, bingConnectionAvailable } from "@amc/server/reporting";

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

/** A native same-origin POST starts the owner-bound authorization; URL/body redirect inputs are ignored. */
export async function POST(request: Request): Promise<Response> {
  let origin: string | undefined;
  try {
    const user = await getCurrentUser();
    if (!user || user.mfa !== "ok") return Response.json({ error: "unauthorized" }, { status: 401, headers });
    if (user.adminRole !== "super_admin") return Response.json({ error: "forbidden" }, { status: 403, headers });
    origin = configuredOrigin();
    if (new URL(request.url).origin !== origin || request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") !== "same-origin") {
      return Response.json({ error: "forbidden" }, { status: 403, headers });
    }
    if (!bingConnectionAvailable()) return cleanFailure(origin);
    const started = await beginBingConnection({ userId: user.id, sessionId: user.session.id });
    return new Response(null, { status: 303, headers: { ...headers, Location: authorizationUrl(started.authorizeUrl, origin) } });
  } catch {
    return origin ? cleanFailure(origin) : Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}

/** Link previews and ordinary GET navigation must never create an authorization state. */
export async function GET(): Promise<Response> {
  return Response.json({ error: "method_not_allowed" }, { status: 405, headers: { ...headers, Allow: "POST" } });
}
