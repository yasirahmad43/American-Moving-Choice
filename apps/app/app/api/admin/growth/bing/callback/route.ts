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

type CallbackFailureReason = "origin" | "input_too_large" | "missing_state" | "duplicate_state" | "malformed_state" | "provider_error" | "missing_code" | "duplicate_code" | "malformed_code";
function inputFailure(reason: CallbackFailureReason): void {
  console.warn("reporting_bing_callback_failure", { stage: "callback_input", reason });
}

/** Callback values never enter logs, redirects or client components; diagnostics are fixed categories. */
export async function GET(request: Request): Promise<Response> {
  let origin: string | undefined;
  let stage: "callback_config" | "callback_auth" | "callback_input" | "callback_complete" = "callback_config";
  try {
    origin = configuredOrigin();
    stage = "callback_auth";
    const user = await getCurrentUser();
    if (!user || user.mfa !== "ok") return loginRedirect(origin);
    if (user.adminRole !== "super_admin") return Response.json({ error: "forbidden" }, { status: 403, headers });
    stage = "callback_input";
    const url = new URL(request.url);
    if (url.origin !== origin) { inputFailure("origin"); return cleanRedirect(origin, "bing_failed"); }
    if (request.url.length > 32_768) { inputFailure("input_too_large"); return cleanRedirect(origin, "bing_failed"); }
    const values = url.searchParams;
    const states = values.getAll("state"), codes = values.getAll("code"), errors = values.getAll("error");
    if (states.length !== 1) { inputFailure(states.length === 0 ? "missing_state" : "duplicate_state"); return cleanRedirect(origin, "bing_failed"); }
    if (!/^[A-Za-z0-9_-]{43}$/u.test(states[0]!)) { inputFailure("malformed_state"); return cleanRedirect(origin, "bing_failed"); }
    if (errors.length) {
      // Cancellation changes no credentials and never attempts a token exchange.
      const cancelled = errors.length === 1 && errors[0] === "access_denied" && codes.length === 0;
      if (!cancelled) inputFailure("provider_error");
      return cleanRedirect(origin, cancelled ? "bing_cancelled" : "bing_failed");
    }
    if (codes.length !== 1) { inputFailure(codes.length === 0 ? "missing_code" : "duplicate_code"); return cleanRedirect(origin, "bing_failed"); }
    if (!/^[\x21-\x7e]{1,8192}$/u.test(codes[0]!)) { inputFailure("malformed_code"); return cleanRedirect(origin, "bing_failed"); }
    stage = "callback_complete";
    await completeBingConnection({ userId: user.id, sessionId: user.session.id, state: states[0]!, code: codes[0]! });
    return cleanRedirect(origin, "bing_connected");
  } catch {
    // The core logs its exact completion stage; avoid duplicating that failure with a vague route log.
    if (stage !== "callback_complete") console.warn("reporting_bing_callback_failure", { stage, reason: "unavailable" });
    // Even a configuration/auth outage must remove the sensitive callback query from navigation.
    return cleanRedirect(origin ?? "", "bing_failed");
  }
}
