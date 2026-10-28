"use server";

/**
 * Team actions. Each resolves the member and role on the server; @amc/server/team checks the
 * permission matrix (owners manage the team; managers invite agents) and that every target
 * belongs to the same company.
 */
import { PermissionError } from "@amc/server/companies";
import { cancelInvitation, changeMemberRole, inviteMember, setAgentPurchase, setMemberStatus } from "@amc/server/team";
import { refresh } from "next/cache";
import { errorResult, successResult, type ActionState } from "@/components/portal/onboarding/form-state";
import { actionContext, deliverOutboxLater } from "@/components/portal/onboarding/server-helpers";

const TEAM_ROLES = ["owner", "manager"] as const;

const field = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export async function inviteAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext(TEAM_ROLES);
  const email = field(formData, "email");
  const role = field(formData, "role");
  const values = { email, role };
  try {
    const result = await inviteMember(ctx.actor, { email, role }, { ip: ctx.ip });
    if (!result.ok) {
      return errorResult(previous, result.field ? "Check the highlighted field." : result.message, {
        fieldErrors: result.field ? { [result.field]: result.message } : {},
        values,
      });
    }
  } catch (error) {
    if (error instanceof PermissionError) return errorResult(previous, error.message, { values });
    throw error;
  }
  deliverOutboxLater();
  refresh();
  return successResult(previous, `Invitation sent to ${email.toLowerCase()}. The link works once and expires in 7 days.`);
}

export async function memberAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext(["owner"]);
  const membershipId = field(formData, "membershipId");
  const op = field(formData, "op");
  try {
    let result;
    if (op === "role") result = await changeMemberRole(ctx.actor, membershipId, field(formData, "role"), { ip: ctx.ip });
    else if (op === "disable" || op === "enable") result = await setMemberStatus(ctx.actor, membershipId, op === "disable" ? "disabled" : "active", { ip: ctx.ip });
    else if (op === "purchase_on" || op === "purchase_off") result = await setAgentPurchase(ctx.actor, membershipId, op === "purchase_on", { ip: ctx.ip });
    else return errorResult(previous, "Unknown action.");
    if (!result.ok) return errorResult(previous, result.message);
  } catch (error) {
    if (error instanceof PermissionError) return errorResult(previous, error.message);
    throw error;
  }
  refresh();
  const done: Record<string, string> = {
    role: "Role changed.",
    disable: "Access turned off. They can no longer reach this company in the portal.",
    enable: "Access turned back on.",
    purchase_on: "They can now buy requests.",
    purchase_off: "They can no longer buy requests.",
  };
  return successResult(previous, done[op] ?? "Saved.");
}

export async function cancelInvitationAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext(TEAM_ROLES);
  try {
    const ok = await cancelInvitation(ctx.actor, field(formData, "invitationId"), { ip: ctx.ip });
    if (!ok) return errorResult(previous, "That invitation was already used or withdrawn.");
  } catch (error) {
    if (error instanceof PermissionError) return errorResult(previous, error.message);
    throw error;
  }
  refresh();
  return successResult(previous, "Invitation withdrawn. The link no longer works.");
}
