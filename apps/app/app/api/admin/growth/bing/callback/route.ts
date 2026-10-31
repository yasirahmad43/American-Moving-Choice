import { getCurrentUser } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { completeBingConnection } from "@amc/server/reporting";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
function cleanRedirect(origin: string, notice: "bing_connected" | "bing_cancelled" | "bing_failed"): Response {
  return new Response(null, { status: 303, headers: { ...headers, Location: origin + "/admin/growth?connection=" + notice } });
}
function loginRedirect(origin: string): Response {
  return new Response(null, { status: 303, headers: { ...headers, Location: origin + "/login?next=%2Fadmin%2Fgrowth" } });
}

/** Never render, log, retain in a redirect, or send callback codes/errors to a client component. */
export async function GET(request: Request): Promise<Response> {
  let origin: string | undefined;
  try {
    origin = configuredOrigin();
    const user = await getCurrentUser();
    if (!user || user.mfa !== "ok") return loginRedirect(origin);
    if (user.adminRole !== "super_admin") return Response.json({ error: "forbidden" }, { status: 403, headers });
    const url = new URL(request.url);
    if (url.origin !== origin || request.url.length > 32_768) return cleanRedirect(origin, "bing_failed");
    const values = url.searchParams;
    const states = values.getAll("state"), codes = values.getAll("code"), errors = values.getAll("error");
    if (states.length !== 1 || !/^[A-Za-z0-9_-]{43}$/u.test(states[0]!)) return cleanRedirect(origin, "bing_failed");
    if (errors.length) {
      // Cancellation changes no credentials and never attempts a token exchange.
      return cleanRedirect(origin, errors.length === 1 && errors[0] === "access_denied" && codes.length === 0 ? "bing_cancelled" : "bing_failed");
    }
    if (codes.length !== 1 || !/^[\x21-\x7e]{1,8192}$/u.test(codes[0]!)) return cleanRedirect(origin, "bing_failed");
    await completeBingConnection({ userId: user.id, sessionId: user.session.id, state: states[0]!, code: codes[0]! });
    return cleanRedirect(origin, "bing_connected");
  } catch {
    // Even a configuration/auth outage must remove the sensitive callback query from navigation.
    return cleanRedirect(origin ?? "", "bing_failed");
  }
}
