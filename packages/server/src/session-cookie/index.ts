/**
 * Session cookie name and options. Deliberately free of `server-only` and of any secret, so the
 * app's proxy.ts (which runs outside React Server Components) can import it to check for the
 * cookie and to roll its expiry forward.
 */

export const SESSION_COOKIE = "amc_session";
/** Which company a multi-company user is acting for (portal). */
export const ACTIVE_COMPANY_COOKIE = "amc_company";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Secure in production. The one exception is a production build served from an explicit
 * http://localhost APP_URL (local `next start`), where browsers would drop a Secure cookie.
 */
export function cookieSecure(source: Record<string, string | undefined> = process.env): boolean {
  if (source.NODE_ENV !== "production") return false;
  const appUrl = source.APP_URL?.trim();
  if (!appUrl) return true;
  try {
    const url = new URL(appUrl);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    return !(url.protocol === "http:" && local);
  } catch {
    return true;
  }
}

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

export function sessionCookieOptions(maxAgeSeconds: number = SESSION_TTL_SECONDS): SessionCookieOptions {
  return { httpOnly: true, secure: cookieSecure(), sameSite: "lax", path: "/", maxAge: maxAgeSeconds };
}
