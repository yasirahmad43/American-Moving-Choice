"use server";

/**
 * Server actions for the auth pages. Each validates its input with zod, applies rate limits
 * through @amc/server/auth, sets or clears the session cookie and redirects. Messages never reveal
 * more than the user needs (for example, whether an email has an account).
 */
import {
  SignupError,
  acceptInvitation,
  authenticate,
  checkSignupRateLimit,
  confirmMfaSetup,
  createSession,
  getSessionUserUnverified,
  landingPath,
  parseSignup,
  passwordProblem,
  requestMeta,
  requestPasswordReset,
  resetPassword,
  safeNextPath,
  setSessionCookie,
  signupCompany,
  verifyMfaCode,
  type SignupField,
} from "@amc/server/auth";
import { one } from "@amc/server/db";
import { deliverPending } from "@amc/server/outbox";
import { getRequireMcNumber } from "@amc/server/settings";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { errorState, formRaw, formString, parseForm, type FormState } from "@/lib/form";

const withNext = (path: string, next: string) => {
  const target = safeNextPath(next, "");
  return target ? `${path}?next=${encodeURIComponent(target)}` : path;
};

/** Send queued emails after the response (demo mode just marks them "demo" for the mailbox). */
function deliverOutboxLater() {
  after(async () => {
    try {
      await deliverPending({ limit: 20 });
    } catch {
      console.error("[outbox] delivery after response failed");
    }
  });
}

async function defaultLanding(userId: string, isAdmin: boolean): Promise<string> {
  if (isAdmin) return "/admin";
  const membership = await one("select 1 from company_memberships where user_id = $1 and status = 'active' limit 1", [userId]);
  return membership ? "/portal" : "/access-denied?reason=no-company";
}

// ------------------------------------------------------------------ schemas

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const newPassword = z.string().superRefine((value, ctx) => {
  const problem = passwordProblem(value);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});

const passwordsMatch = (value: { password: string; confirm: string }) => value.password === value.confirm;
const mismatch = { path: ["confirm"], message: "Type the same password again." };

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(1024),
});

const forgotSchema = z.object({
  email: z.string().trim().max(254).regex(EMAIL, "Enter an email address like name@company.com."),
});

const resetSchema = z.object({ password: newPassword, confirm: z.string() }).refine(passwordsMatch, mismatch);

const inviteSchema = z
  .object({ fullName: z.string().trim().min(2, "Enter your full name.").max(120, "Keep your name under 120 characters."), password: newPassword, confirm: z.string() })
  .refine(passwordsMatch, mismatch);

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{3}\s?\d{3}$/, "Enter the 6 digits your authenticator app shows.") });

// ------------------------------------------------------------------ sign in

type LoginField = "email" | "password";

export async function loginAction(previous: FormState<LoginField>, formData: FormData): Promise<FormState<LoginField>> {
  const email = formString(formData, "email");
  const next = formString(formData, "next");
  const parsed = parseForm<typeof loginSchema, LoginField>(loginSchema, { email, password: formRaw(formData, "password") });
  if (!parsed.ok) return errorState(previous, "Enter your email and password to sign in.", { fieldErrors: parsed.fieldErrors, values: { email } });

  const meta = await requestMeta();
  const result = await authenticate({ ...parsed.data, ip: meta.ip });
  if (!result.ok) {
    const message =
      result.reason === "locked"
        ? "Too many failed sign-in attempts. To protect the account, sign-in is paused for 15 minutes. You can reset your password instead."
        : result.reason === "rate_limited"
          ? "Too many sign-in attempts from this connection. Wait a few minutes, then try again."
          : "The email or password is incorrect.";
    return errorState(previous, message, { values: { email } });
  }

  const { token } = await createSession(result.userId, meta);
  await setSessionCookie(token);
  if (result.mfa === "setup") redirect(withNext("/mfa/setup", next));
  if (result.mfa === "verify") redirect(withNext("/mfa", next));
  redirect(safeNextPath(next, await defaultLanding(result.userId, result.adminRole !== null)));
}

// ------------------------------------------------------------------ company application, step 1

const SIGNUP_FIELDS: SignupField[] = ["fullName", "email", "password", "legalName", "usdot", "mc", "phone"];

export async function signupAction(previous: FormState<SignupField>, formData: FormData): Promise<FormState<SignupField>> {
  const raw = Object.fromEntries(SIGNUP_FIELDS.map((field) => [field, field === "password" ? formRaw(formData, field) : formString(formData, field)])) as Record<
    SignupField,
    string
  >;
  const { password: _password, ...values } = raw;
  // Validate first (zod, in @amc/server/auth), so corrections don't use up the per-connection
  // limit: only valid applications count against it.
  const parsed = parseSignup(raw, { requireMc: await getRequireMcNumber() });
  if (!parsed.ok) return errorState(previous, "Check the highlighted fields.", { fieldErrors: parsed.fieldErrors, values });
  const meta = await requestMeta();
  if (!(await checkSignupRateLimit(meta.ip))) {
    return errorState(previous, "Too many applications from this connection. Try again in an hour.", { values });
  }
  let userId: string;
  try {
    ({ userId } = await signupCompany(raw, { ip: meta.ip }));
  } catch (error) {
    if (error instanceof SignupError) {
      const message = error.code === "email_taken" ? "An account with this email already exists." : "Check the highlighted fields.";
      return errorState(previous, message, { fieldErrors: error.fieldErrors, values });
    }
    throw error;
  }
  const { token } = await createSession(userId, meta);
  await setSessionCookie(token);
  redirect("/portal");
}

// ------------------------------------------------------------------ password reset

export async function forgotPasswordAction(previous: FormState<"email">, formData: FormData): Promise<FormState<"email">> {
  const email = formString(formData, "email");
  const parsed = parseForm<typeof forgotSchema, "email">(forgotSchema, { email });
  if (!parsed.ok) return errorState(previous, "Enter the email address you sign in with.", { fieldErrors: parsed.fieldErrors, values: { email } });
  const { ip } = await requestMeta();
  await requestPasswordReset({ email: parsed.data.email, ip });
  deliverOutboxLater();
  // The same answer whether or not the email has an account.
  return {
    status: "success",
    message: "If an account uses that email, we've sent it a link to reset the password. The link works once and expires in 60 minutes.",
    attempt: (previous.attempt ?? 0) + 1,
  };
}

type ResetField = "password" | "confirm";

export async function resetPasswordAction(previous: FormState<ResetField>, formData: FormData): Promise<FormState<ResetField>> {
  const parsed = parseForm<typeof resetSchema, ResetField>(resetSchema, { password: formRaw(formData, "password"), confirm: formRaw(formData, "confirm") });
  if (!parsed.ok) return errorState(previous, "Check the new password.", { fieldErrors: parsed.fieldErrors });
  const { ip } = await requestMeta();
  const result = await resetPassword({ token: formString(formData, "token"), password: parsed.data.password, ip });
  if (!result.ok) {
    if (result.reason === "weak_password") {
      return errorState(previous, "Check the new password.", { fieldErrors: { password: result.message ?? "Choose a stronger password." } });
    }
    if (result.reason === "rate_limited") return errorState(previous, "Too many attempts from this connection. Wait an hour, then try again.");
    return errorState(previous, "This reset link has expired or was already used. Ask for a new one.");
  }
  redirect("/login?reset=1");
}

// ------------------------------------------------------------------ invitations

type InviteField = "fullName" | "password" | "confirm";

const INVITE_ERRORS: Record<string, string> = {
  invalid_token: "This invitation link isn't valid.",
  expired: "This invitation has expired. Ask the person who invited you to send a new one.",
  already_used: "This invitation was already used.",
  account_exists: "An account already uses this email. Sign in to accept the invitation.",
  wrong_user: "You're signed in with a different email than the one invited. Sign out, then open the link again.",
  already_member: "You're already on this company's team.",
  invalid_name: "Enter your full name.",
  rate_limited: "Too many attempts from this connection. Wait an hour, then try again.",
};

export async function acceptInvitationAction(previous: FormState<InviteField>, formData: FormData): Promise<FormState<InviteField>> {
  const token = formString(formData, "token");
  const fullName = formString(formData, "fullName");
  const meta = await requestMeta();
  const user = await getSessionUserUnverified();
  // A signed-in account must finish its second step before it can join a company.
  if (user && user.mfa !== "ok") redirect(withNext(user.mfa === "setup" ? "/mfa/setup" : "/mfa", `/invite/${token}`));

  let result;
  if (user) {
    result = await acceptInvitation(token, { kind: "existing", userId: user.id }, meta.ip);
  } else {
    const parsed = parseForm<typeof inviteSchema, InviteField>(inviteSchema, {
      fullName,
      password: formRaw(formData, "password"),
      confirm: formRaw(formData, "confirm"),
    });
    if (!parsed.ok) return errorState(previous, "Check the highlighted fields.", { fieldErrors: parsed.fieldErrors, values: { fullName } });
    result = await acceptInvitation(token, { kind: "new", fullName: parsed.data.fullName, password: parsed.data.password }, meta.ip);
  }
  if (!result.ok) {
    const message = result.reason === "weak_password" ? (result.message ?? "Choose a stronger password.") : (INVITE_ERRORS[result.reason] ?? "The invitation couldn't be accepted.");
    return errorState(previous, message, { values: { fullName } });
  }
  if (!user) {
    const { token: sessionToken } = await createSession(result.userId, meta);
    await setSessionCookie(sessionToken);
  }
  redirect("/portal");
}

// ------------------------------------------------------------------ two-step verification

const MFA_ERRORS: Record<string, string> = {
  invalid_code: "That code didn't match. Enter the 6-digit code your app shows now.",
  expired_setup: "The setup took too long. We've made a new code to scan.",
  already_enrolled: "Two-step verification is already set up for this account.",
  not_enrolled: "Two-step verification isn't set up for this account yet.",
  rate_limited: "Too many attempts. Wait 15 minutes, then try again.",
  locked: "Too many incorrect codes. To protect the account, sign-in is paused for 15 minutes and you've been signed out.",
  secret_unreadable: "Your two-step verification can't be checked right now. Ask a super admin to reset it, then sign in again to set it up.",
};

function mfaError(previous: FormState<"code">, reason: string): FormState<"code"> {
  if (reason === "rate_limited" || reason === "locked" || reason === "secret_unreadable") return errorState(previous, MFA_ERRORS[reason]!);
  return errorState(previous, "The code wasn't accepted.", { fieldErrors: { code: MFA_ERRORS[reason] ?? "Try again." } });
}

export async function mfaSetupAction(previous: FormState<"code">, formData: FormData): Promise<FormState<"code">> {
  const user = await getSessionUserUnverified();
  if (!user) redirect("/login");
  const next = formString(formData, "next");
  const parsed = parseForm<typeof codeSchema, "code">(codeSchema, { code: formString(formData, "code") });
  if (!parsed.ok) return errorState(previous, "The code wasn't accepted.", { fieldErrors: parsed.fieldErrors });
  const { ip } = await requestMeta();
  const result = await confirmMfaSetup({ userId: user.id, sessionId: user.session.id, setupToken: formString(formData, "setupToken"), code: parsed.data.code, ip });
  if (!result.ok) {
    if (result.reason === "already_enrolled") redirect(withNext("/mfa", next));
    if (result.reason === "expired_setup") redirect(withNext("/mfa/setup", next));
    return mfaError(previous, result.reason);
  }
  redirect(safeNextPath(next, landingPath({ ...user, mfa: "ok", mfaEnabled: true })));
}

export async function mfaVerifyAction(previous: FormState<"code">, formData: FormData): Promise<FormState<"code">> {
  const user = await getSessionUserUnverified();
  if (!user) redirect("/login");
  const next = formString(formData, "next");
  const parsed = parseForm<typeof codeSchema, "code">(codeSchema, { code: formString(formData, "code") });
  if (!parsed.ok) return errorState(previous, "The code wasn't accepted.", { fieldErrors: parsed.fieldErrors });
  const { ip } = await requestMeta();
  const result = await verifyMfaCode({ userId: user.id, sessionId: user.session.id, code: parsed.data.code, ip });
  if (!result.ok) {
    if (result.reason === "not_enrolled") redirect(withNext("/mfa/setup", next));
    return mfaError(previous, result.reason);
  }
  redirect(safeNextPath(next, landingPath({ ...user, mfa: "ok" })));
}
