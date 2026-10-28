/**
 * Request-scoped auth for Next.js: the current user from the session cookie, cookie writes for
 * server actions, and request metadata. Server Components can read; only Server Actions and
 * Route Handlers can set or clear cookies (Next.js rule).
 */
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getPool } from "../db/pool";
import { ACTIVE_COMPANY_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "../session-cookie";
import type { CompanyRole } from "./invitations";
import { mfaRequirement, readSession, revokeSession, type AdminRole } from "./sessions";

export type CompanyStatus = "applied" | "verifying" | "in_review" | "approved" | "rejected" | "suspended";

export interface Membership {
  id: string;
  companyId: string;
  companyName: string;
  companyStatus: CompanyStatus;
  role: CompanyRole;
  canPurchase: boolean;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  adminRole: AdminRole | null;
  mfaEnabled: boolean;
  /** "ok", or what the session still needs: TOTP enrollment ("setup") or a code ("verify"). */
  mfa: "ok" | "setup" | "verify";
  session: { id: string; expiresAt: Date; mfaPassedAt: Date | null };
  /** Active memberships, oldest first. */
  memberships: Membership[];
}

async function loadMemberships(userId: string): Promise<Membership[]> {
  const result = await getPool().query<{
    id: string;
    company_id: string;
    legal_name: string;
    status: CompanyStatus;
    role: CompanyRole;
    can_purchase: boolean;
  }>(
    `select m.id, m.company_id, c.legal_name, c.status, m.role, m.can_purchase
     from company_memberships m join companies c on c.id = m.company_id
     where m.user_id = $1 and m.status = 'active'
     order by m.created_at, m.id`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    companyId: row.company_id,
    companyName: row.legal_name,
    companyStatus: row.status,
    role: row.role,
    canPurchase: row.can_purchase,
  }));
}

/**
 * The session's user for this request, or null, whether or not the second factor is done
 * (`mfa` says what is still needed). Cached per request. For routing and the sign-in and MFA
 * pages only: never authorize with it. Use requireUser/requireMembership/requireAdmin, or
 * getCurrentUser, which hides a session that has not passed MFA.
 */
export const getSessionUserUnverified = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const entry = await readSession(store.get(SESSION_COOKIE)?.value);
  if (!entry) return null;
  return {
    id: entry.user.id,
    email: entry.user.email,
    fullName: entry.user.fullName,
    adminRole: entry.user.adminRole,
    mfaEnabled: entry.user.mfaEnabled,
    mfa: mfaRequirement(entry),
    session: { id: entry.session.id, expiresAt: entry.session.expiresAt, mfaPassedAt: entry.session.mfaPassedAt },
    memberships: await loadMemberships(entry.user.id),
  };
});

/**
 * The signed-in user, or null when nobody is signed in or the session still needs TOTP
 * enrollment or a code. Safe to authorize with, though the guards are the preferred API.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await getSessionUserUnverified();
  return user && user.mfa === "ok" ? user : null;
}

/** The raw session token from the cookie (for logout). */
export async function sessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Sets the session cookie. Server Actions and Route Handlers only. */
export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

/** Clears the session cookie. Server Actions and Route Handlers only. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  store.delete(ACTIVE_COMPANY_COOKIE);
}

/**
 * Signs out: revokes the session row behind the cookie and clears the cookie (build plan §6).
 * Server Actions and Route Handlers only. Returns the user who was signed in, if any.
 */
export async function endSession(): Promise<CurrentUser | null> {
  const user = await getSessionUserUnverified();
  const token = await sessionToken();
  if (token) await revokeSession(token);
  await clearSessionCookie();
  return user;
}

/** The company a multi-company user picked, if any. */
export async function activeCompanyPreference(): Promise<string | null> {
  return (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value ?? null;
}

/**
 * Client IP and user agent. Prefers the headers Vercel sets itself (a client cannot forge them
 * there), then the first X-Forwarded-For hop. Behind another proxy, make sure it overwrites these.
 */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  return { ip: ip ? ip.slice(0, 64) : null, userAgent: h.get("user-agent")?.slice(0, 512) ?? null };
}

/** Header the app's proxy sets with the requested path, so guards can send users back after login. */
export const PATHNAME_HEADER = "x-amc-pathname";

export async function currentPath(): Promise<string | null> {
  return (await headers()).get(PATHNAME_HEADER);
}
