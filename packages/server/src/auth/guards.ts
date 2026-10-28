/**
 * Server-side guards for layouts, pages, server actions and route handlers (build plan §2, §5, §6).
 * The proxy only redirects requests without a cookie; these guards are the real authorization.
 *
 * - requireSession: signed in, second factor may still be pending (used by the MFA pages).
 * - requireUser: signed in and past MFA (admins must enroll TOTP and pass it every session).
 * - requireMembership: requireUser plus an active company membership, optionally with a role.
 * - requireAdmin: requireUser plus an admin role; non-admins get a 404 so the area stays hidden.
 */
import { notFound, redirect } from "next/navigation";
import { activeCompanyPreference, currentPath, getSessionUserUnverified, type CurrentUser, type Membership } from "./context";
import type { CompanyRole } from "./invitations";
import { safeNextPath } from "./redirects";
import type { AdminRole } from "./sessions";

export { safeNextPath } from "./redirects";

function withNext(path: string, next: string | null): string {
  const target = next ? safeNextPath(next, "") : "";
  return target ? `${path}?next=${encodeURIComponent(target)}` : path;
}

/** Where a signed-in user belongs by default. */
export function landingPath(user: CurrentUser): string {
  if (user.mfa === "setup") return "/mfa/setup";
  if (user.mfa === "verify") return "/mfa";
  if (user.adminRole) return "/admin";
  if (user.memberships.length > 0) return "/portal";
  return "/access-denied?reason=no-company";
}

export async function requireSession(): Promise<CurrentUser> {
  const user = await getSessionUserUnverified();
  if (!user) redirect(withNext("/login", await currentPath()));
  return user;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await requireSession();
  if (user.mfa === "setup") redirect(withNext("/mfa/setup", await currentPath()));
  if (user.mfa === "verify") redirect(withNext("/mfa", await currentPath()));
  return user;
}

export interface MembershipContext {
  user: CurrentUser;
  membership: Membership;
}

/**
 * The user's active membership (the company chosen with the amc_company cookie, else the oldest),
 * optionally limited to roles. Admins without a company go to /admin.
 */
export async function requireMembership(options: { roles?: readonly CompanyRole[]; companyId?: string } = {}): Promise<MembershipContext> {
  const user = await requireUser();
  const preferred = options.companyId ?? (await activeCompanyPreference());
  const membership = user.memberships.find((m) => m.companyId === preferred) ?? (options.companyId ? undefined : user.memberships[0]);
  if (!membership) {
    if (user.adminRole && !options.companyId) redirect("/admin");
    redirect("/access-denied?reason=no-company");
  }
  if (options.roles && !options.roles.includes(membership.role)) redirect("/access-denied?reason=role");
  return { user, membership };
}

export interface AdminContext {
  user: CurrentUser;
  adminRole: AdminRole;
}

/** An admin past MFA, optionally limited to roles (super_admin always passes). */
export async function requireAdmin(options: { roles?: readonly AdminRole[] } = {}): Promise<AdminContext> {
  const user = await requireUser();
  const adminRole = user.adminRole;
  if (!adminRole) notFound();
  if (options.roles && adminRole !== "super_admin" && !options.roles.includes(adminRole)) redirect("/access-denied?reason=admin-role");
  return { user, adminRole };
}

/** True when the role list allows this membership; for showing or hiding actions. */
export function hasCompanyRole(membership: Pick<Membership, "role">, roles: readonly CompanyRole[]): boolean {
  return roles.includes(membership.role);
}

/** True when the admin role may use something limited to `roles` (super_admin always may). */
export function hasAdminRole(adminRole: AdminRole | null, roles: readonly AdminRole[]): boolean {
  return adminRole === "super_admin" || (adminRole !== null && roles.includes(adminRole));
}
