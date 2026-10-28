/**
 * Login lockout (build plan §6): 5 failed logins in 15 minutes lock the account for 15 minutes.
 *
 * Failures are counted in one-minute buckets in rate_limits (key "login-failures:<user id>"), which
 * gives a sliding 15-minute window to the minute. Reaching the threshold sets users.locked_until and
 * clears the buckets, so the account gets a fresh window once the lock ends. users.failed_logins
 * counts consecutive failures for display and resets on a successful login.
 */
import { tx, type Queryable } from "../db/pool";
import { audit } from "../audit/audit";

export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_WINDOW_SECONDS = 15 * 60;
export const LOCKOUT_DURATION_SECONDS = 15 * 60;

const failureKey = (userId: string) => `login-failures:${userId}`;

export function isLocked(user: { lockedUntil: Date | null }, now: Date = new Date()): boolean {
  return user.lockedUntil !== null && user.lockedUntil.getTime() > now.getTime();
}

export interface FailureOutcome {
  /** Failures inside the current window, including this one. */
  failures: number;
  locked: boolean;
  lockedUntil: Date | null;
}

/**
 * Counts one event under `key` in a one-minute bucket and returns the events in the last
 * `windowSeconds` (a sliding window to the minute). Used for password and TOTP failures.
 */
export async function countInSlidingWindow(client: Queryable, key: string, windowSeconds: number): Promise<number> {
  await client.query(
    `insert into rate_limits (key, window_start, count) values ($1, date_trunc('minute', now()), 1)
     on conflict (key, window_start) do update set count = rate_limits.count + 1`,
    [key],
  );
  const counted = await client.query<{ n: number }>(
    `select coalesce(sum(count), 0)::int as n from rate_limits
     where key = $1 and window_start >= date_trunc('minute', now() - make_interval(secs => $2))`,
    [key, windowSeconds],
  );
  return counted.rows[0]?.n ?? 0;
}

async function recordFailure(client: Queryable, userId: string, ip: string | null): Promise<FailureOutcome> {
  const key = failureKey(userId);
  const failures = await countInSlidingWindow(client, key, LOCKOUT_WINDOW_SECONDS);
  const lock = failures >= LOCKOUT_THRESHOLD;
  const updated = await client.query<{ locked_until: Date | null }>(
    `update users set failed_logins = failed_logins + 1,
       locked_until = case when $2 then now() + make_interval(secs => $3) else locked_until end
     where id = $1 returning locked_until`,
    [userId, lock, LOCKOUT_DURATION_SECONDS],
  );
  if (lock) {
    await client.query("delete from rate_limits where key = $1", [key]);
    await audit(
      { actorType: "system", action: "auth.locked", entity: "user", entityId: userId, after: { failures, minutes: LOCKOUT_DURATION_SECONDS / 60 }, ip },
      client,
    );
  }
  const lockedUntil = updated.rows[0]?.locked_until ?? null;
  return { failures, locked: lock, lockedUntil };
}

/** Records a failed password for an existing user; locks the account at the threshold. */
export async function recordFailedLogin(userId: string, ip: string | null = null): Promise<FailureOutcome> {
  return tx((client) => recordFailure(client, userId, ip));
}

/** Clears failure counters after a successful login. */
export async function clearFailedLogins(userId: string, db: Queryable): Promise<void> {
  await db.query("delete from rate_limits where key = $1", [failureKey(userId)]);
  await db.query("update users set failed_logins = 0, locked_until = null, last_login_at = now() where id = $1", [userId]);
}
