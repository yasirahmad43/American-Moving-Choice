/**
 * Who may manage content, research, media and publication: super_admin, ops and content_editor.
 * The app's action wrapper checks the role before calling (requireAdmin), and every content
 * service checks it again from the actor it receives, so a call from anywhere else fails the
 * same way.
 */
import type { AdminRole } from "../auth/sessions";
import { AdminError, type AdminActor } from "./common";

export const CONTENT_ROLES: readonly AdminRole[] = ["super_admin", "ops", "content_editor"];

export interface ContentActor extends AdminActor {
  adminRole: AdminRole;
}

export function canManageContent(role: AdminRole | null | undefined): boolean {
  return role === "super_admin" || (!!role && CONTENT_ROLES.includes(role));
}

export function assertContentRole(actor: ContentActor): void {
  if (!canManageContent(actor.adminRole)) throw new AdminError("Your admin role can't manage content.", "forbidden");
}
