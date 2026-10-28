/**
 * Company permission matrix (data model §2) for the onboarding areas. Pure, so the matrix is
 * unit-testable; the server functions load the actor's membership from the database and call
 * these, and the pages use the same helpers to show or hide controls.
 */
import type { CompanyRole } from "../auth/invitations";

/** Coverage, services and profile; the application and verification pages. */
export const COMPANY_MANAGERS: readonly CompanyRole[] = ["owner", "manager"];

export interface Actor {
  userId: string;
  companyId: string;
}

export interface ActorMembership extends Actor {
  membershipId: string;
  role: CompanyRole;
}

export class PermissionError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "PermissionError";
  }
}

export const canManageCompany = (role: CompanyRole) => COMPANY_MANAGERS.includes(role);

/** Team management: owners manage everything; managers may only invite agents. */
export function canInviteRole(actorRole: CompanyRole, invitedRole: CompanyRole): boolean {
  if (actorRole === "owner") return true;
  if (actorRole === "manager") return invitedRole === "agent";
  return false;
}

/** Roles an actor may offer in the invitation form. */
export function invitableRoles(actorRole: CompanyRole): CompanyRole[] {
  return (["owner", "manager", "agent", "billing"] as const).filter((role) => canInviteRole(actorRole, role));
}

/** Changing roles, disabling members and the purchase toggle are owner-only. */
export const canManageMembers = (role: CompanyRole) => role === "owner";

/** Seeing the team list (owners and managers). */
export const canViewTeam = (role: CompanyRole) => role === "owner" || role === "manager";

/** Revoking a pending invitation: owners any, managers only agent invitations they could have sent. */
export function canRevokeInvitation(actorRole: CompanyRole, invitedRole: CompanyRole): boolean {
  return canInviteRole(actorRole, invitedRole);
}
