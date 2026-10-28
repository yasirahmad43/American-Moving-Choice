/**
 * Database-backed fixed-window rate limiter (rate_limits table; build plan §6: login, signup,
 * survey submission, password reset and review submission). Works across serverless instances
 * because the counter lives in Postgres.
 */
import { getPool, type Queryable } from "../db/pool";
import { hmacSecret } from "../env/env";
import { hmacHex } from "./tokens";

export interface RateLimitResult {
  allowed: boolean;
  /** Attempts counted in the current window, including this one. */
  count: number;
  limit: number;
  remaining: number;
  /** When the current window ends. */
  resetAt: Date;
}

/**
 * Counts one attempt against `key` and says whether it is within `limit` per `windowSeconds`.
 * Every call counts, including refused ones. Keys must not contain raw personal data: build them
 * with rateLimitKey().
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  db: Queryable = getPool(),
): Promise<RateLimitResult> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("rate limit must be a positive integer");
  if (!Number.isInteger(windowSeconds) || windowSeconds < 1) throw new Error("rate limit window must be a positive number of seconds");
  const result = await db.query<{ count: number; window_start: Date }>(
    `insert into rate_limits (key, window_start, count)
     values ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
     on conflict (key, window_start) do update set count = rate_limits.count + 1
     returning count, window_start`,
    [key, windowSeconds],
  );
  const row = result.rows[0]!;
  // Occasionally clear old windows so the table stays small (the jobs slice may also run this).
  if (Math.random() < 0.01) await pruneRateLimits(undefined, db).catch(() => undefined);
  return {
    allowed: row.count <= limit,
    count: row.count,
    limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: new Date(row.window_start.getTime() + windowSeconds * 1000),
  };
}

/**
 * A rate-limit key whose identifying parts are HMAC'd with HMAC_SECRET (available to both apps,
 * so the public site's survey and review limits use it too), so the table holds no emails or IP
 * addresses: rateLimitKey("login:email", email) → "login:email:3f9a…".
 */
export function rateLimitKey(scope: string, ...parts: string[]): string {
  if (!/^[a-z][a-z0-9_:-]*$/.test(scope)) throw new Error("rate limit scope must be a lowercase identifier");
  if (parts.length === 0) return scope;
  return `${scope}:${hmacHex(hmacSecret(), `rate-limit\u0000${parts.join("\u0000")}`).slice(0, 32)}`;
}

/** Deletes windows that started more than `olderThanSeconds` ago (default one day). */
export async function pruneRateLimits(olderThanSeconds = 86_400, db: Queryable = getPool()): Promise<number> {
  const result = await db.query("delete from rate_limits where window_start < now() - make_interval(secs => $1)", [olderThanSeconds]);
  return result.rowCount ?? 0;
}

/** Limits used by the auth flows (attempts per window). Survey and review limits live in their slices. */
export const AUTH_RATE_LIMITS = {
  loginPerIp: { limit: 20, windowSeconds: 15 * 60 },
  loginPerEmail: { limit: 10, windowSeconds: 15 * 60 },
  signupPerIp: { limit: 5, windowSeconds: 60 * 60 },
  passwordResetPerIp: { limit: 5, windowSeconds: 60 * 60 },
  passwordResetPerEmail: { limit: 3, windowSeconds: 60 * 60 },
  /** Submitting a new password with a reset link. */
  passwordResetSubmitPerIp: { limit: 10, windowSeconds: 60 * 60 },
  mfaPerUser: { limit: 10, windowSeconds: 15 * 60 },
  /** Failed codes that lock the account (sliding window, like login lockout). */
  mfaFailuresPerUser: { limit: 5, windowSeconds: 15 * 60 },
  invitationAcceptPerIp: { limit: 10, windowSeconds: 60 * 60 },
} as const;
