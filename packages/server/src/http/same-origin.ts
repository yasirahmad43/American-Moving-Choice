/**
 * Same-origin check for POST route handlers that browsers call (build plan §2: route handlers
 * check Origin on POST). Server Actions have Next's own check; webhooks and cron routes use their
 * signature or CRON_SECRET instead and must not call this.
 */

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originOf(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * True when the request may proceed: a safe method, or an Origin header naming one of the allowed
 * origins (for example env().APP_URL and env().WEB_URL). A missing or "null" Origin on an unsafe
 * method is refused; every current browser sends Origin on cross-site and same-site POSTs.
 */
export function isSameOrigin(request: Pick<Request, "method" | "headers">, allowedOrigins: readonly string[]): boolean {
  if (!UNSAFE_METHODS.has(request.method.toUpperCase())) return true;
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  const actual = originOf(origin);
  if (!actual) return false;
  return allowedOrigins.some((allowed) => originOf(allowed) === actual);
}

/** A 403 response when the request fails isSameOrigin, else null: `const denied = assertSameOrigin(req, [...]); if (denied) return denied;` */
export function assertSameOrigin(request: Pick<Request, "method" | "headers">, allowedOrigins: readonly string[]): Response | null {
  if (isSameOrigin(request, allowedOrigins)) return null;
  return Response.json({ error: "forbidden", message: "Cross-origin request refused." }, { status: 403 });
}
