"use server";

/**
 * Account settings actions for the signed-in user (any company role). The user and session come
 * from the server-side session, never from the form.
 */
import { changePassword, disableMfa, signOutOtherSessions, updateFullName } from "@amc/server/team";
import { refresh } from "next/cache";
import { errorResult, successResult, type ActionState } from "@/components/portal/onboarding/form-state";
import { actionContext } from "@/components/portal/onboarding/server-helpers";

const raw = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

export async function updateNameAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext();
  const fullName = raw(formData, "fullName");
  const result = await updateFullName(ctx.user.id, fullName, { ip: ctx.ip });
  if (!result.ok) return errorResult(previous, "Check the highlighted field.", { fieldErrors: { fullName: result.message }, values: { fullName } });
  refresh();
  return successResult(previous, "Name saved.");
}

export async function changePasswordAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext();
  const result = await changePassword({
    userId: ctx.user.id,
    sessionId: ctx.user.session.id,
    current: raw(formData, "current"),
    password: raw(formData, "password"),
    confirm: raw(formData, "confirm"),
    ip: ctx.ip,
  });
  if (!result.ok) {
    return result.field ? errorResult(previous, "The password wasn't changed.", { fieldErrors: { [result.field]: result.message } }) : errorResult(previous, result.message);
  }
  refresh();
  return successResult(
    previous,
    result.otherSessionsSignedOut
      ? `Password changed. We signed you out on ${result.otherSessionsSignedOut} other device${result.otherSessionsSignedOut === 1 ? "" : "s"}.`
      : "Password changed.",
  );
}

export async function signOutOthersAction(previous: ActionState): Promise<ActionState> {
  const ctx = await actionContext();
  const count = await signOutOtherSessions(ctx.user.id, ctx.user.session.id, { ip: ctx.ip });
  refresh();
  return successResult(previous, count ? `Signed out of ${count} other session${count === 1 ? "" : "s"}.` : "No other sessions were signed in.");
}

export async function disableMfaAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext();
  const result = await disableMfa({ userId: ctx.user.id, password: raw(formData, "mfaPassword"), code: raw(formData, "code"), ip: ctx.ip });
  if (!result.ok) {
    const fieldName = result.field === "password" ? "mfaPassword" : result.field;
    return fieldName ? errorResult(previous, "Two-step verification is still on.", { fieldErrors: { [fieldName]: result.message } }) : errorResult(previous, result.message);
  }
  refresh();
  return successResult(previous, "Two-step verification is off. You can set it up again at any time.");
}
