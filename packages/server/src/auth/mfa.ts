/**
 * TOTP enrollment and verification (build plan §6). Admins enroll at first login and pass TOTP on
 * every new session; company users may enroll.
 *
 * Enrollment writes nothing until the user proves the app works: the setup page gets a new secret
 * plus a sealed setup token (the secret and user ID, encrypted with APP_ENCRYPTION_KEY, valid for
 * 15 minutes). Confirming with a correct code stores the secret encrypted, bound to the user ID.
 *
 * A code works once: users.mfa_last_step holds the time step of the last accepted code, and only a
 * newer step is accepted (RFC 6238 §5.2), so a code seen over someone's shoulder or replayed from
 * another session fails. Wrong codes count toward a lockout: 5 in 15 minutes lock the account for
 * 15 minutes, sign out the session and write the audit log.
 */
import { audit } from "../audit/audit";
import { tx, type Queryable } from "../db/pool";
import { encryptionKey } from "../env/env";
import { DecryptionError, decrypt, encrypt, openSealed, seal } from "./crypto";
import { LOCKOUT_DURATION_SECONDS, countInSlidingWindow } from "./lockout";
import { AUTH_RATE_LIMITS, checkRateLimit } from "./rate-limit";
import { markSessionMfaPassed, revokeSessionById, revokeUserSessions } from "./sessions";
import { generateTotpSecret, matchTotpStep, totpQrDataUrl, totpUri } from "./totp";

export const MFA_SETUP_MAX_AGE_MS = 15 * 60 * 1000;
const SETUP_PURPOSE = "mfa-setup";
const secretAad = (userId: string) => `users.mfa_secret_enc:${userId}`;
const failureKey = (userId: string) => `mfa-failures:${userId}`;

export function encryptTotpSecret(userId: string, secret: string): string {
  return encrypt(secret, encryptionKey(), secretAad(userId));
}

export function decryptTotpSecret(userId: string, sealed: string): string {
  return decrypt(sealed, encryptionKey(), secretAad(userId));
}

export interface MfaSetup {
  /** Base32 secret, shown for manual entry. */
  secret: string;
  uri: string;
  qrDataUrl: string;
  /** Hidden form field for confirmMfaSetup. */
  setupToken: string;
}

/** A fresh enrollment for the setup page. Has no side effects. */
export async function createMfaSetup(user: { id: string; email: string }): Promise<MfaSetup> {
  const secret = generateTotpSecret();
  const uri = totpUri(secret, user.email);
  return {
    secret,
    uri,
    qrDataUrl: await totpQrDataUrl(uri),
    setupToken: seal({ uid: user.id, secret }, encryptionKey(), SETUP_PURPOSE),
  };
}

export type MfaFailureReason =
  | "invalid_code"
  | "expired_setup"
  | "already_enrolled"
  | "not_enrolled"
  /** The stored secret can't be decrypted (for example after APP_ENCRYPTION_KEY changed): a super admin must reset it. */
  | "secret_unreadable"
  | "rate_limited"
  /** Too many wrong codes: the account is locked for 15 minutes and this session is signed out. */
  | "locked";

export type MfaResult = { ok: true } | { ok: false; reason: MfaFailureReason };

async function withinMfaLimit(userId: string): Promise<boolean> {
  const { limit, windowSeconds } = AUTH_RATE_LIMITS.mfaPerUser;
  return (await checkRateLimit(`mfa:${userId}`, limit, windowSeconds)).allowed;
}

async function isLocked(db: Queryable, userId: string): Promise<boolean> {
  const found = await db.query<{ locked: boolean }>("select coalesce(locked_until > now(), false) as locked from users where id = $1", [userId]);
  return found.rows[0]?.locked ?? false;
}

/**
 * Records a wrong (or replayed) code. At the threshold it locks the account, revokes this
 * session and audits the lock; every failure is audited.
 */
async function recordMfaFailure(userId: string, sessionId: string, ip: string | null): Promise<MfaResult> {
  return tx(async (client) => {
    const { limit, windowSeconds } = AUTH_RATE_LIMITS.mfaFailuresPerUser;
    const failures = await countInSlidingWindow(client, failureKey(userId), windowSeconds);
    await audit({ actorType: "user", actorId: userId, action: "auth.mfa_failed", entity: "user", entityId: userId, after: { failures }, ip }, client);
    if (failures < limit) return { ok: false, reason: "invalid_code" } as const;
    await client.query("update users set locked_until = now() + make_interval(secs => $2) where id = $1", [userId, LOCKOUT_DURATION_SECONDS]);
    await client.query("delete from rate_limits where key = $1", [failureKey(userId)]);
    await revokeSessionById(sessionId, client);
    await audit(
      { actorType: "system", action: "auth.mfa_locked", entity: "user", entityId: userId, after: { failures, minutes: LOCKOUT_DURATION_SECONDS / 60 }, ip },
      client,
    );
    return { ok: false, reason: "locked" } as const;
  });
}

/** Confirms enrollment with the first code; on success the current session counts as MFA-passed. */
export async function confirmMfaSetup(input: {
  userId: string;
  sessionId: string;
  setupToken: string;
  code: string;
  ip?: string | null;
}): Promise<MfaResult> {
  const ip = input.ip ?? null;
  if (!(await withinMfaLimit(input.userId))) return { ok: false, reason: "rate_limited" };
  const setup = openSealed<{ uid: string; secret: string }>(input.setupToken, encryptionKey(), SETUP_PURPOSE, MFA_SETUP_MAX_AGE_MS);
  if (!setup || setup.uid !== input.userId) return { ok: false, reason: "expired_setup" };
  const step = matchTotpStep(setup.secret, input.code);
  if (step === null) return recordMfaFailure(input.userId, input.sessionId, ip);

  return tx(async (client) => {
    if (await isLocked(client, input.userId)) return { ok: false, reason: "locked" } as const;
    const updated = await client.query(
      "update users set mfa_secret_enc = $2, mfa_enabled_at = now(), mfa_last_step = $3 where id = $1 and mfa_enabled_at is null",
      [input.userId, encryptTotpSecret(input.userId, setup.secret), step],
    );
    if (!updated.rowCount) return { ok: false, reason: "already_enrolled" } as const;
    await markSessionMfaPassed(input.sessionId, client);
    await client.query("delete from rate_limits where key = $1", [failureKey(input.userId)]);
    await audit({ actorType: "user", actorId: input.userId, action: "auth.mfa_enrolled", entity: "user", entityId: input.userId, ip }, client);
    return { ok: true } as const;
  });
}

/** Verifies a code for an enrolled user and marks the session as MFA-passed. Each code works once. */
export async function verifyMfaCode(input: { userId: string; sessionId: string; code: string; ip?: string | null }): Promise<MfaResult> {
  const ip = input.ip ?? null;
  if (!(await withinMfaLimit(input.userId))) return { ok: false, reason: "rate_limited" };
  const outcome = await tx(async (client): Promise<MfaResult | "wrong_code"> => {
    // Row lock: two sessions submitting the same code at once can't both pass.
    const found = await client.query<{ mfa_secret_enc: string | null; mfa_enabled_at: Date | null; mfa_last_step: string | null; locked: boolean }>(
      "select mfa_secret_enc, mfa_enabled_at, mfa_last_step, coalesce(locked_until > now(), false) as locked from users where id = $1 for update",
      [input.userId],
    );
    const row = found.rows[0];
    if (!row?.mfa_secret_enc || !row.mfa_enabled_at) return { ok: false, reason: "not_enrolled" };
    if (row.locked) return { ok: false, reason: "locked" };
    let secret: string;
    try {
      secret = decryptTotpSecret(input.userId, row.mfa_secret_enc);
    } catch (error) {
      if (error instanceof DecryptionError) return { ok: false, reason: "secret_unreadable" };
      throw error;
    }
    const step = matchTotpStep(secret, input.code);
    // pg returns bigint as a string; steps are far below 2^53.
    const lastStep = row.mfa_last_step === null ? -1 : Number(row.mfa_last_step);
    if (step === null || step <= lastStep) return "wrong_code";
    await client.query("update users set mfa_last_step = $2 where id = $1", [input.userId, step]);
    await markSessionMfaPassed(input.sessionId, client);
    await client.query("delete from rate_limits where key = $1", [failureKey(input.userId)]);
    await audit({ actorType: "user", actorId: input.userId, action: "auth.mfa_passed", entity: "session", entityId: null, ip }, client);
    return { ok: true };
  });
  return outcome === "wrong_code" ? recordMfaFailure(input.userId, input.sessionId, ip) : outcome;
}

/**
 * Removes a user's TOTP enrollment (lost authenticator, or a secret that no longer decrypts after
 * a key change) and signs out every session, so the next sign-in enrolls again. The caller must
 * check that the actor is a super admin (or run it from an operator script) and must confirm the
 * person's identity out of band.
 */
export async function resetUserMfa(input: { userId: string; actorId: string; reason: string; ip?: string | null }): Promise<boolean> {
  const reason = input.reason.trim();
  if (!reason) throw new Error("resetUserMfa needs a reason for the audit log");
  return tx(async (client) => {
    const updated = await client.query(
      "update users set mfa_secret_enc = null, mfa_enabled_at = null, mfa_last_step = null where id = $1 and mfa_enabled_at is not null",
      [input.userId],
    );
    if (!updated.rowCount) return false;
    const revoked = await revokeUserSessions(input.userId, null, client);
    await audit(
      { actorType: "admin", actorId: input.actorId, action: "auth.mfa_reset", entity: "user", entityId: input.userId, after: { reason, sessions_revoked: revoked }, ip: input.ip ?? null },
      client,
    );
    return true;
  });
}
