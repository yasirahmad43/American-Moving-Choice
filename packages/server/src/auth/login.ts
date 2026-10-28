/**
 * Email and password check with rate limits and lockout (build plan §6). Creates no session: the
 * caller (a server action) creates it and sets the cookie, so this stays testable without Next.
 *
 * Unknown emails get the same treatment as wrong passwords: a dummy bcrypt comparison for equal
 * timing and their own failure counter, so the "locked" answer does not reveal whether an account
 * exists either.
 */
import { normalizeEmail } from "@amc/core";
import { audit } from "../audit/audit";
import { getPool, tx } from "../db/pool";
import { LOCKOUT_THRESHOLD, LOCKOUT_WINDOW_SECONDS, clearFailedLogins, isLocked, recordFailedLogin } from "./lockout";
import { burnPasswordCheck, verifyPassword } from "./password";
import { AUTH_RATE_LIMITS, checkRateLimit, rateLimitKey } from "./rate-limit";
import type { AdminRole } from "./sessions";

export type LoginFailureReason = "invalid_credentials" | "locked" | "rate_limited";

export type LoginResult =
  | { ok: true; userId: string; adminRole: AdminRole | null; mfa: "ok" | "setup" | "verify" }
  /** retryAt only for rate limits (per connection or email); a lock's end would reveal that the account exists. */
  | { ok: false; reason: LoginFailureReason; retryAt?: Date };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function authenticate(input: { email: string; password: string; ip?: string | null }): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  const ip = input.ip ?? null;

  const perIp = await checkRateLimit(rateLimitKey("login:ip", ip ?? "unknown"), AUTH_RATE_LIMITS.loginPerIp.limit, AUTH_RATE_LIMITS.loginPerIp.windowSeconds);
  if (!perIp.allowed) return { ok: false, reason: "rate_limited", retryAt: perIp.resetAt };
  if (!EMAIL.test(email) || !input.password) {
    await burnPasswordCheck(input.password || "x");
    return { ok: false, reason: "invalid_credentials" };
  }
  const perEmail = await checkRateLimit(rateLimitKey("login:email", email), AUTH_RATE_LIMITS.loginPerEmail.limit, AUTH_RATE_LIMITS.loginPerEmail.windowSeconds);
  if (!perEmail.allowed) return { ok: false, reason: "rate_limited", retryAt: perEmail.resetAt };

  const found = await getPool().query<{
    id: string;
    password_hash: string | null;
    locked_until: Date | null;
    mfa_enabled_at: Date | null;
    admin_role: AdminRole | null;
  }>(
    `select u.id, u.password_hash, u.locked_until, u.mfa_enabled_at, a.admin_role
     from users u left join admin_users a on a.user_id = u.id where u.email = $1`,
    [email],
  );
  const user = found.rows[0];

  if (!user) {
    await burnPasswordCheck(input.password);
    const unknown = await checkRateLimit(rateLimitKey("login:unknown", email), LOCKOUT_THRESHOLD, LOCKOUT_WINDOW_SECONDS);
    return { ok: false, reason: unknown.count >= LOCKOUT_THRESHOLD ? "locked" : "invalid_credentials" };
  }

  if (isLocked({ lockedUntil: user.locked_until })) {
    // Same cost as the unknown-email path, so timing doesn't reveal that the account exists.
    await burnPasswordCheck(input.password);
    return { ok: false, reason: "locked" };
  }

  if (!(await verifyPassword(input.password, user.password_hash))) {
    const outcome = await recordFailedLogin(user.id, ip);
    return outcome.locked ? { ok: false, reason: "locked" } : { ok: false, reason: "invalid_credentials" };
  }

  await tx(async (client) => {
    await clearFailedLogins(user.id, client);
    await audit({ actorType: user.admin_role ? "admin" : "user", actorId: user.id, action: "auth.login", entity: "user", entityId: user.id, ip }, client);
  });

  const mfa = user.admin_role && !user.mfa_enabled_at ? "setup" : user.mfa_enabled_at ? "verify" : "ok";
  return { ok: true, userId: user.id, adminRole: user.admin_role, mfa };
}
