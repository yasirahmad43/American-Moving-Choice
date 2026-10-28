"use server";

/** Admin accounts: invite with a role, revoke an invitation, change a role, remove access. */
import { changeAdminRole, inviteAdmin, removeAdmin, revokeAdminInvitation } from "@amc/server/admin";
import { deliverPending } from "@amc/server/outbox";
import { after } from "next/server";
import type { FormState } from "@/lib/form";
import { adminAction, field, idField } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const PATHS = ["/admin/users"];

export async function inviteAdminAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.platform, async ({ actor }) => {
    await inviteAdmin(actor, { email: field(formData, "email", 254), role: field(formData, "role", 30) });
    after(async () => {
      try {
        await deliverPending({ limit: 10 });
      } catch {
        console.error("[outbox] delivery after response failed");
      }
    });
    return "Invitation sent. The link works once and expires in 3 days.";
  }, PATHS);
}

export async function revokeInvitationAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.platform, async ({ actor }) => {
    await revokeAdminInvitation(actor, idField(formData, "invitationId"));
    return "Invitation revoked.";
  }, PATHS);
}

export async function changeRoleAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.platform, async ({ actor }) => {
    await changeAdminRole(actor, idField(formData, "userId"), field(formData, "role", 30));
    return "Role changed.";
  }, PATHS);
}

export async function removeAdminAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.platform, async ({ actor }) => {
    await removeAdmin(actor, idField(formData, "userId"), field(formData, "reason", 500));
    return "Admin access removed and the user signed out everywhere.";
  }, PATHS);
}
