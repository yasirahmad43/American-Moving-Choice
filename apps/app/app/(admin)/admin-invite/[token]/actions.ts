"use server";

/**
 * Accepting an admin invitation: creates the account (or adds the role to the signed-in account
 * the invitation was sent to), signs in a new account, and sends it to two-step setup. The admin
 * area stays closed until TOTP is enrolled (requireAdmin).
 */
import { acceptAdminInvitation } from "@amc/server/admin";
import { createSession, getSessionUserUnverified, passwordProblem, requestMeta, setSessionCookie } from "@amc/server/auth";
import { redirect } from "next/navigation";
import { errorState, formRaw, formString, type FormState } from "@/lib/form";

type Field = "fullName" | "password" | "confirm";

const ERRORS: Record<string, string> = {
  invalid: "This invitation link isn't valid.",
  expired: "This invitation has expired. Ask a super admin to send a new one.",
  used: "This invitation was already used or revoked.",
  account_exists: "An account already uses this email. Sign in, then open the link again.",
  wrong_user: "You're signed in with a different email than the one invited. Sign out, then open the link again.",
  invalid_name: "Enter your full name.",
  rate_limited: "Too many attempts from this connection. Wait an hour, then try again.",
};

export async function acceptAdminInvitationAction(previous: FormState<Field>, formData: FormData): Promise<FormState<Field>> {
  const token = formString(formData, "token");
  const fullName = formString(formData, "fullName");
  const meta = await requestMeta();
  const user = await getSessionUserUnverified();
  let result;
  if (user) {
    result = await acceptAdminInvitation(token, { kind: "existing", userId: user.id }, meta.ip);
  } else {
    const password = formRaw(formData, "password");
    const fieldErrors: Partial<Record<Field, string>> = {};
    if (fullName.length < 2) fieldErrors.fullName = "Enter your full name.";
    const problem = passwordProblem(password);
    if (problem) fieldErrors.password = problem;
    if (password !== formRaw(formData, "confirm")) fieldErrors.confirm = "Type the same password again.";
    if (Object.keys(fieldErrors).length) return errorState(previous, "Check the highlighted fields.", { fieldErrors, values: { fullName } });
    result = await acceptAdminInvitation(token, { kind: "new", fullName, password }, meta.ip);
  }
  if (!result.ok) {
    if (result.reason === "weak_password") return errorState(previous, "Check the password.", { fieldErrors: { password: result.message ?? "Choose a stronger password." }, values: { fullName } });
    return errorState(previous, ERRORS[result.reason] ?? "The invitation couldn't be accepted.", { values: { fullName } });
  }
  if (!user) {
    const { token: sessionToken } = await createSession(result.userId, meta);
    await setSessionCookie(sessionToken);
  }
  redirect("/mfa/setup?next=%2Fadmin");
}
