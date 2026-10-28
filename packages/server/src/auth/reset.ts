/**
 * Password reset by emailed link (build plan §6). The link carries a random token; auth_tokens
 * stores its sha256 hex with a one-hour expiry. A token works once: using it marks every
 * outstanding reset token of that user as used and signs out all of the user's sessions.
 * In demo mode the email lands in the admin mailbox instead of being sent.
 */
import { normalizeEmail } from "@amc/core";
import { audit } from "../audit/audit";
import { getPool, tx } from "../db/pool";
import { env } from "../env/env";
import { REDACTED_LINK, enqueueEmail } from "../outbox/outbox";
import { hashPassword, passwordProblem } from "./password";
import { AUTH_RATE_LIMITS, checkRateLimit, rateLimitKey } from "./rate-limit";
import { revokeUserSessions } from "./sessions";
import { isTokenShaped, newToken, sha256Hex } from "./tokens";

export const RESET_TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Starts a reset. Always resolves the same way for the caller's UI ("if an account exists, we sent
 * a link"); `queued` is for tests and must not change what the user sees.
 */
export async function requestPasswordReset(input: { email: string; ip?: string | null }): Promise<{ queued: boolean }> {
  const email = normalizeEmail(input.email);
  const ip = input.ip ?? null;
  const perIp = await checkRateLimit(rateLimitKey("reset:ip", ip ?? "unknown"), AUTH_RATE_LIMITS.passwordResetPerIp.limit, AUTH_RATE_LIMITS.passwordResetPerIp.windowSeconds);
  const perEmail = await checkRateLimit(rateLimitKey("reset:email", email), AUTH_RATE_LIMITS.passwordResetPerEmail.limit, AUTH_RATE_LIMITS.passwordResetPerEmail.windowSeconds);
  if (!perIp.allowed || !perEmail.allowed) return { queued: false };

  const user = await getPool().query<{ id: string }>("select id from users where email = $1", [email]);
  const userId = user.rows[0]?.id;
  if (!userId) return { queued: false };

  const token = newToken();
  const link = `${env().APP_URL}/reset-password/${token}`;
  await tx(async (client) => {
    await client.query(
      `insert into auth_tokens (user_id, purpose, token_hash, expires_at)
       values ($1, 'password_reset', $2, now() + make_interval(secs => $3))`,
      [userId, sha256Hex(token), RESET_TOKEN_TTL_SECONDS],
    );
    const body = (linkText: string) =>
      [
        "Someone asked to reset the password for your American Moving Choice account.",
        "",
        `To choose a new password, open this link within ${RESET_TOKEN_TTL_SECONDS / 60} minutes. It works once:`,
        linkText,
        "",
        "If you didn't ask for this, ignore this email. Your password stays the same.",
      ].join("\n");
    await enqueueEmail(
      {
        to: email,
        template: "password_reset",
        subject: "Reset your American Moving Choice password",
        // The stored body_text never holds the token; only the encrypted deliverable body does.
        bodyText: body(REDACTED_LINK),
        secretBodyText: body(link),
        relatedType: "user",
        relatedId: userId,
      },
      client,
    );
    await audit({ actorType: "user", actorId: userId, action: "auth.password_reset_requested", entity: "user", entityId: userId, ip }, client);
  });
  return { queued: true };
}

/** The user a still-usable reset token belongs to, for the reset page; null otherwise. */
export async function findPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
  if (!isTokenShaped(token)) return null;
  const found = await getPool().query<{ user_id: string; expires_at: Date }>(
    `select user_id, expires_at from auth_tokens
     where token_hash = $1 and purpose = 'password_reset' and used_at is null and expires_at > now()`,
    [sha256Hex(token)],
  );
  const row = found.rows[0];
  return row ? { userId: row.user_id, expiresAt: row.expires_at } : null;
}

export type ResetResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid_token" | "weak_password" | "rate_limited"; message?: string };

/**
 * Sets a new password with a reset token. Single use; signs the user out everywhere. Rate limited
 * per IP, and the token is looked up before the (deliberately slow) bcrypt hash, so made-up
 * tokens cost a cheap indexed query instead of 300 ms of CPU.
 */
export async function resetPassword(input: { token: string; password: string; ip?: string | null }): Promise<ResetResult> {
  const problem = passwordProblem(input.password);
  if (problem) return { ok: false, reason: "weak_password", message: problem };
  if (!isTokenShaped(input.token)) return { ok: false, reason: "invalid_token" };
  const { limit, windowSeconds } = AUTH_RATE_LIMITS.passwordResetSubmitPerIp;
  if (!(await checkRateLimit(rateLimitKey("reset:submit-ip", input.ip ?? "unknown"), limit, windowSeconds)).allowed) {
    return { ok: false, reason: "rate_limited" };
  }
  if (!(await findPasswordResetToken(input.token))) return { ok: false, reason: "invalid_token" };
  const passwordHash = await hashPassword(input.password); // slow, so outside the transaction

  return tx(async (client) => {
    const found = await client.query<{ user_id: string }>(
      `select user_id from auth_tokens
       where token_hash = $1 and purpose = 'password_reset' and used_at is null and expires_at > now()
       for update`,
      [sha256Hex(input.token)],
    );
    const userId = found.rows[0]?.user_id;
    if (!userId) return { ok: false, reason: "invalid_token" } as const;
    await client.query(
      "update auth_tokens set used_at = now() where user_id = $1 and purpose = 'password_reset' and used_at is null",
      [userId],
    );
    await client.query(
      "update users set password_hash = $2, failed_logins = 0, locked_until = null where id = $1",
      [userId, passwordHash],
    );
    await client.query("delete from rate_limits where key = $1", [`login-failures:${userId}`]);
    await revokeUserSessions(userId, null, client);
    await audit({ actorType: "user", actorId: userId, action: "auth.password_reset", entity: "user", entityId: userId, ip: input.ip ?? null }, client);
    return { ok: true, userId } as const;
  });
}
