/**
 * The signed-in user's own account (portal settings): name, password change with the current
 * password (re-authentication), optional TOTP removal for company users, and signing out other
 * sessions. TOTP enrollment itself uses the shared /mfa/setup flow in @amc/server/auth.
 */
import { z } from "zod";
import { audit } from "../audit/audit";
import { decryptTotpSecret } from "../auth/mfa";
import { hashPassword, passwordProblem, verifyPassword } from "../auth/password";
import { checkRateLimit } from "../auth/rate-limit";
import { recordFailedLogin } from "../auth/lockout";
import { revokeUserSessions } from "../auth/sessions";
import { matchTotpStep } from "../auth/totp";
import { getPool, tx } from "../db/pool";

export const nameSchema = z
  .string({ error: "Enter your full name." })
  .trim()
  .min(2, "Enter your full name.")
  .max(120, "Keep your name under 120 characters.");

/** Password changes per user per hour. */
export const PASSWORD_CHANGES_PER_HOUR = 10;

export async function updateFullName(userId: string, input: string, meta: { ip?: string | null } = {}): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter your full name." };
  await tx(async (client) => {
    await client.query("update users set full_name = $2 where id = $1", [userId, parsed.data]);
    await audit({ actorType: "user", actorId: userId, action: "account.name_changed", entity: "user", entityId: userId, ip: meta.ip ?? null }, client);
  });
  return { ok: true };
}

export type PasswordChangeResult =
  | { ok: true; otherSessionsSignedOut: number }
  | { ok: false; field: "current" | "password" | "confirm" | null; message: string };

/** Changes the password after checking the current one, and signs out the user's other sessions. */
export async function changePassword(input: {
  userId: string;
  sessionId: string;
  current: string;
  password: string;
  confirm: string;
  ip?: string | null;
}): Promise<PasswordChangeResult> {
  const limited = await checkRateLimit(`password-change:${input.userId}`, PASSWORD_CHANGES_PER_HOUR, 3600);
  if (!limited.allowed) return { ok: false, field: null, message: "Too many attempts. Wait an hour, then try again." };
  if (!input.current) return { ok: false, field: "current", message: "Enter your current password." };
  const problem = passwordProblem(input.password);
  if (problem) return { ok: false, field: "password", message: problem };
  if (input.password !== input.confirm) return { ok: false, field: "confirm", message: "Type the same new password again." };
  const user = (await getPool().query<{ password_hash: string | null }>("select password_hash from users where id = $1", [input.userId])).rows[0];
  if (!user || !(await verifyPassword(input.current, user.password_hash))) {
    const outcome = await recordFailedLogin(input.userId, input.ip ?? null);
    return {
      ok: false,
      field: "current",
      message: outcome.locked ? "Too many incorrect passwords. Sign-in is paused for 15 minutes." : "Your current password is incorrect.",
    };
  }
  if (input.current === input.password) return { ok: false, field: "password", message: "Choose a password different from your current one." };
  const hash = await hashPassword(input.password);
  return tx(async (client) => {
    await client.query("update users set password_hash = $2, failed_logins = 0, locked_until = null where id = $1", [input.userId, hash]);
    // Any password-reset links still out there stop working.
    await client.query("update auth_tokens set used_at = now() where user_id = $1 and purpose = 'password_reset' and used_at is null", [input.userId]);
    const revoked = await revokeUserSessions(input.userId, input.sessionId, client);
    await audit({ actorType: "user", actorId: input.userId, action: "auth.password_changed", entity: "user", entityId: input.userId, after: { other_sessions_revoked: revoked }, ip: input.ip ?? null }, client);
    return { ok: true, otherSessionsSignedOut: revoked } as const;
  });
}

export interface SessionView {
  id: string;
  current: boolean;
  createdAt: Date;
  lastSeenAt: Date;
  /** A short device description from the user agent (no IP addresses shown). */
  device: string;
}

/** "Chrome on macOS" from a user agent; deliberately coarse. */
export function describeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "A browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : null;
  return os ? `${browser} on ${os}` : browser;
}

export async function listSessions(userId: string, currentSessionId: string): Promise<SessionView[]> {
  const result = await getPool().query<{ id: string; created_at: Date; last_seen_at: Date; user_agent: string | null }>(
    `select id, created_at, last_seen_at, user_agent from sessions
     where user_id = $1 and revoked_at is null and expires_at > now() order by last_seen_at desc limit 50`,
    [userId],
  );
  return result.rows.map((r) => ({ id: r.id, current: r.id === currentSessionId, createdAt: r.created_at, lastSeenAt: r.last_seen_at, device: describeUserAgent(r.user_agent) }));
}

/** Signs out every other session of the user. */
export async function signOutOtherSessions(userId: string, currentSessionId: string, meta: { ip?: string | null } = {}): Promise<number> {
  return tx(async (client) => {
    const revoked = await revokeUserSessions(userId, currentSessionId, client);
    await audit({ actorType: "user", actorId: userId, action: "auth.other_sessions_revoked", entity: "user", entityId: userId, after: { revoked }, ip: meta.ip ?? null }, client);
    return revoked;
  });
}

export type DisableMfaResult = { ok: true } | { ok: false; field: "password" | "code" | null; message: string };

/**
 * Turns off two-step verification for a company user who proves both factors (current password
 * and a fresh code). Admins can't: their accounts require it.
 */
export async function disableMfa(input: { userId: string; password: string; code: string; ip?: string | null }): Promise<DisableMfaResult> {
  const limited = await checkRateLimit(`mfa-disable:${input.userId}`, 10, 3600);
  if (!limited.allowed) return { ok: false, field: null, message: "Too many attempts. Wait an hour, then try again." };
  const row = (
    await getPool().query<{ password_hash: string | null; mfa_secret_enc: string | null; mfa_last_step: string | null; is_admin: boolean }>(
      `select u.password_hash, u.mfa_secret_enc, u.mfa_last_step, exists (select 1 from admin_users a where a.user_id = u.id) as is_admin
       from users u where u.id = $1`,
      [input.userId],
    )
  ).rows[0];
  if (!row?.mfa_secret_enc) return { ok: false, field: null, message: "Two-step verification isn't turned on." };
  if (row.is_admin) return { ok: false, field: null, message: "Admin accounts must keep two-step verification." };
  if (!(await verifyPassword(input.password, row.password_hash))) {
    const outcome = await recordFailedLogin(input.userId, input.ip ?? null);
    return { ok: false, field: "password", message: outcome.locked ? "Too many incorrect passwords. Sign-in is paused for 15 minutes." : "Your password is incorrect." };
  }
  let step: number | null = null;
  try {
    step = matchTotpStep(decryptTotpSecret(input.userId, row.mfa_secret_enc), input.code);
  } catch {
    return { ok: false, field: null, message: "Your two-step verification can't be checked right now. Contact support." };
  }
  const last = row.mfa_last_step === null ? -1 : Number(row.mfa_last_step);
  if (step === null || step <= last) return { ok: false, field: "code", message: "That code didn't match. Enter the 6-digit code your app shows now." };
  await tx(async (client) => {
    await client.query("update users set mfa_secret_enc = null, mfa_enabled_at = null, mfa_last_step = null where id = $1", [input.userId]);
    await audit({ actorType: "user", actorId: input.userId, action: "auth.mfa_disabled", entity: "user", entityId: input.userId, ip: input.ip ?? null }, client);
  });
  return { ok: true };
}
