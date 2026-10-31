/**
 * Cheap checks before rendering (build plan §2). Requests to /portal and /admin without a session
 * cookie go to /login. Real authorization happens in layouts, pages and actions through the
 * @amc/server/auth guards; this proxy never reads the database.
 *
 * It also passes the requested path to the guards (x-amc-pathname) so they can return users to
 * it after login, and rolls the session cookie's 30-day expiry forward on page views.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@amc/server/session-cookie";
import { countryAccessResponse } from "@amc/server/access";

const PATHNAME_HEADER = "x-amc-pathname";

const isProtected = (pathname: string) =>
  pathname === "/portal" || pathname.startsWith("/portal/") || pathname === "/admin" || pathname.startsWith("/admin/");

export function proxy(request: NextRequest) {
  const countryDenied = countryAccessResponse(request, { publicWeb: false });
  if (countryDenied) return countryDenied;
  const { pathname, search } = request.nextUrl;
  // Preserve the original auth-proxy exclusions after the country gate checks every route.
  if (["/api/", "/_next/static", "/_next/image", "/favicon.ico"].some(prefix => pathname.startsWith(prefix))) return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (isProtected(pathname) && !token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, `${pathname}${search}`);
  const response = NextResponse.next({ request: { headers } });
  // Only on GET: a POST may be the logout action clearing the cookie in the same response.
  if (token && request.method === "GET") response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export const config = {
  matcher: ["/((?!\\.well-known/vercel/security(?:/|$)).*)"],
};
