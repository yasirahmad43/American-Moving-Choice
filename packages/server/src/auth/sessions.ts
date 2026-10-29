/**
 * Database sessions (build plan §6). The cookie holds a random 32-byte token; the sessions row is
 * keyed by its sha256 hex. Sessions last 30 days and roll forward with activity; logout revokes.
 */
import { getPool, type Queryable } from "../db/pool";
import { SESSION_TTL_SECONDS } from "../session-cookie";
import { isTokenShaped, newToken, sha256Hex } from "./tokens";
import { demoAdminPasswordOnly } from "./mfa-policy";

export { SESSION_COOKIE, SESSION_TTL_SECONDS } from "../session-cookie";
/** How often activity moves expires_at forward; avoids a write on every request. */
export const SESSION_TOUCH_SECONDS = 15 * 60;

export interface SessionMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  mfaEnabled: boolean;
  lockedUntil: Date | null;
  adminRole: AdminRole | null;
}

export type AdminRole = "super_admin" | "ops" | "verification" | "finance" | "content_editor" | "moderator" | "support";

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  mfaPassedAt: Date | null;
}

export interface SessionWithUser {
  session: Session;
  user: SessionUser;
}

const sessionIdFor = (token: string) => sha256Hex(token);
const clip = (value: string | null | undefined, max: number) => (value ? value.slice(0, max) : null);

/** Starts a session and returns the raw token for the cookie (never stored). */
export async function createSession(
  userId: string,
  meta: SessionMeta & { mfaPassed?: boolean } = {},
  db: Queryable = getPool(),
): Promise<{ token: string; session: Session }> {
  const token = newToken();
  const result = await db.query<SessionRow>(
    `insert into sessions (id, user_id, expires_at, ip, user_agent, mfa_passed_at)
     values ($1, $2, now() + make_interval(secs => $3), $4, $5, case when $6 then now() end)
     returning id, user_id, created_at, expires_at, last_seen_at, mfa_passed_at`,
    [sessionIdFor(token), userId, SESSION_TTL_SECONDS, clip(meta.ip, 64), clip(meta.userAgent, 512), meta.mfaPassed ?? false],
  );
  return { token, session: toSession(result.rows[0]!) };
}

interface SessionRow {
  id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
  last_seen_at: Date;
  mfa_passed_at: Date | null;
}

const toSession = (row: SessionRow): Session => ({
  id: row.id,
  userId: row.user_id,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  lastSeenAt: row.last_seen_at,
  mfaPassedAt: row.mfa_passed_at,
});

/**
 * Looks up a live session (not revoked, not expired) with its user. Moves the expiry forward at
 * most every SESSION_TOUCH_SECONDS. Null for unknown, malformed, expired or revoked tokens.
 */
export async function readSession(token: string | null | undefined, db: Queryable = getPool()): Promise<SessionWithUser | null> {
  if (!isTokenShaped(token)) return null;
  const result = await db.query<
    SessionRow & { email: string; full_name: string | null; mfa_enabled_at: Date | null; locked_until: Date | null; admin_role: AdminRole | null }
  >(
    `select s.id, s.user_id, s.created_at, s.expires_at, s.last_seen_at, s.mfa_passed_at,
            u.email, u.full_name, u.mfa_enabled_at, u.locked_until, a.admin_role
     from sessions s
     join users u on u.id = s.user_id
     left join admin_users a on a.user_id = u.id
     where s.id = $1 and s.revoked_at is null and s.expires_at > now()`,
    [sessionIdFor(token)],
  );
  const row = result.rows[0];
  if (!row) return null;

  let session = toSession(row);
  if (Date.now() - row.last_seen_at.getTime() > SESSION_TOUCH_SECONDS * 1000) {
    const touched = await db.query<{ expires_at: Date; last_seen_at: Date }>(
      `update sessions set last_seen_at = now(), expires_at = now() + make_interval(secs => $2)
       where id = $1 and revoked_at is null returning expires_at, last_seen_at`,
      [row.id, SESSION_TTL_SECONDS],
    );
    if (touched.rows[0]) session = { ...session, expiresAt: touched.rows[0].expires_at, lastSeenAt: touched.rows[0].last_seen_at };
  }
  return {
    session,
    user: {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      mfaEnabled: row.mfa_enabled_at !== null,
      lockedUntil: row.locked_until,
      adminRole: row.admin_role,
    },
  };
}

/** Revokes the session behind a cookie token. */
export async function revokeSession(token: string | null | undefined, db: Queryable = getPool()): Promise<void> {
  if (!isTokenShaped(token)) return;
  await revokeSessionById(sessionIdFor(token), db);
}

export async function revokeSessionById(sessionId: string, db: Queryable = getPool()): Promise<void> {
  await db.query("update sessions set revoked_at = now() where id = $1 and revoked_at is null", [sessionId]);
}

/** Revokes every live session of a user (after a password reset), optionally keeping one. */
export async function revokeUserSessions(userId: string, exceptSessionId: string | null = null, db: Queryable = getPool()): Promise<number> {
  const result = await db.query(
    "update sessions set revoked_at = now() where user_id = $1 and revoked_at is null and ($2::text is null or id <> $2)",
    [userId, exceptSessionId],
  );
  return result.rowCount ?? 0;
}

/** Records that this session passed the second factor. */
export async function markSessionMfaPassed(sessionId: string, db: Queryable = getPool()): Promise<void> {
  await db.query("update sessions set mfa_passed_at = now() where id = $1 and revoked_at is null", [sessionId]);
}

/**
 * Whether the session still needs a second factor: admins must enroll ("setup") and pass TOTP on
 * every new session ("verify"); company users who enrolled must pass it too.
 */
export function mfaRequirement(entry: SessionWithUser): "ok" | "setup" | "verify" {
  const { user, session } = entry;
  if (demoAdminPasswordOnly(user.adminRole)) return "ok";
  if (user.adminRole && !user.mfaEnabled) return "setup";
  if (user.mfaEnabled && !session.mfaPassedAt) return "verify";
  return "ok";
}
