import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { decrypt, encrypt, openSealed, seal } from "../src/auth/crypto";
import { acceptInvitation, createInvitation, getInvitation } from "../src/auth/invitations";
import { authenticate } from "../src/auth/login";
import { LOCKOUT_THRESHOLD } from "../src/auth/lockout";
import { confirmMfaSetup, createMfaSetup, resetUserMfa, verifyMfaCode } from "../src/auth/mfa";
import { safeNextPath } from "../src/auth/redirects";
import { BCRYPT_COST, hashPassword, passwordProblem, verifyPassword } from "../src/auth/password";
import { checkRateLimit, rateLimitKey } from "../src/auth/rate-limit";
import { findPasswordResetToken, requestPasswordReset, resetPassword } from "../src/auth/reset";
import { createSession, mfaRequirement, readSession, revokeSession, revokeUserSessions } from "../src/auth/sessions";
import { SignupError, normalizeMcNumber, normalizeUsdot, signupCompany } from "../src/auth/signup";
import { isTokenShaped, sha256Hex } from "../src/auth/tokens";
import { currentTotp, generateTotpSecret, normalizeTotpCode, totpQrDataUrl, totpUri, verifyTotp } from "../src/auth/totp";
import { closePool, getPool } from "../src/db/pool";
import { encryptionKey } from "../src/env/env";
import { createUser, resetDatabase, tokenFromMessage } from "./helpers";

const pool = () => getPool();

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

describe("passwords", () => {
  it("hashes with bcrypt at cost 12 and verifies", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(BCRYPT_COST).toBe(12);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse battery!", hash)).toBe(false);
    expect(await verifyPassword("anything at all", null)).toBe(false);
  });

  it("enforces the length policy, including bcrypt's 72-byte limit", async () => {
    expect(passwordProblem("short")).toMatch(/at least 12/);
    expect(passwordProblem("a".repeat(72))).toBeNull();
    expect(passwordProblem("é".repeat(40))).toMatch(/at most 72 bytes/); // 80 bytes in UTF-8
    await expect(hashPassword("short")).rejects.toThrow(/Password rejected/);
  });
});

describe("sessions", () => {
  it("stores only the sha256 of the token and reads the session back with its user", async () => {
    const userId = await createUser({ email: "session-user@example.com", password: "session-password-1" });
    const { token, session } = await createSession(userId, { ip: "203.0.113.5", userAgent: "vitest" });
    expect(isTokenShaped(token)).toBe(true);
    expect(session.id).toBe(sha256Hex(token));

    const stored = await pool().query("select * from sessions where user_id = $1", [userId]);
    expect(stored.rowCount).toBe(1);
    expect(JSON.stringify(stored.rows[0])).not.toContain(token);

    const read = await readSession(token);
    expect(read?.user.id).toBe(userId);
    expect(read?.user.email).toBe("session-user@example.com");
    const days = (read!.session.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
  });

  it("rejects malformed, unknown, expired and revoked tokens", async () => {
    const userId = await createUser({ email: "session-revoke@example.com", password: "session-password-2" });
    expect(await readSession("not-a-token")).toBeNull();
    expect(await readSession(null)).toBeNull();
    expect(await readSession("A".repeat(43))).toBeNull();

    const expired = await createSession(userId);
    await pool().query("update sessions set expires_at = now() - interval '1 second' where id = $1", [expired.session.id]);
    expect(await readSession(expired.token)).toBeNull();

    const live = await createSession(userId);
    expect(await readSession(live.token)).not.toBeNull();
    await revokeSession(live.token);
    expect(await readSession(live.token)).toBeNull();
  });

  it("rolls the expiry forward on activity (30-day rolling sessions)", async () => {
    const userId = await createUser({ email: "session-rolling@example.com", password: "session-password-3" });
    const { token, session } = await createSession(userId);
    await pool().query(
      "update sessions set last_seen_at = now() - interval '2 hours', expires_at = now() + interval '3 days' where id = $1",
      [session.id],
    );
    const read = await readSession(token);
    const days = (read!.session.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
  });

  it("revokes all sessions of a user except an optional one", async () => {
    const userId = await createUser({ email: "session-all@example.com", password: "session-password-4" });
    const a = await createSession(userId);
    const b = await createSession(userId);
    expect(await revokeUserSessions(userId, a.session.id)).toBe(1);
    expect(await readSession(a.token)).not.toBeNull();
    expect(await readSession(b.token)).toBeNull();
  });

  it("requires TOTP enrollment for admins and a code for enrolled users", async () => {
    const adminId = await createUser({ email: "admin-mfa-state@example.com", password: "admin-password-123", admin: "ops" });
    const { token } = await createSession(adminId);
    const entry = await readSession(token);
    expect(entry?.user.adminRole).toBe("ops");
    expect(mfaRequirement(entry!)).toBe("setup");

    await pool().query("update users set mfa_enabled_at = now(), mfa_secret_enc = 'x' where id = $1", [adminId]);
    const enrolled = await readSession(token);
    expect(mfaRequirement(enrolled!)).toBe("verify");
    await pool().query("update sessions set mfa_passed_at = now() where id = $1", [enrolled!.session.id]);
    expect(mfaRequirement((await readSession(token))!)).toBe("ok");
  });
});

describe("login and lockout", () => {
  it("logs in with the right password and records the login", async () => {
    const userId = await createUser({ email: "login-ok@example.com", password: "login-password-123" });
    const result = await authenticate({ email: "  Login-OK@Example.com ", password: "login-password-123", ip: "198.51.100.1" });
    expect(result).toEqual({ ok: true, userId, adminRole: null, mfa: "ok" });
    const audited = await pool().query("select 1 from audit_log where action = 'auth.login' and entity_id = $1", [userId]);
    expect(audited.rowCount).toBe(1);
  });

  it("locks the account after 5 failures in 15 minutes, then unlocks when the lock ends", async () => {
    const userId = await createUser({ email: "lockout@example.com", password: "lockout-password-1" });
    const ip = "198.51.100.2";
    for (let i = 1; i < LOCKOUT_THRESHOLD; i++) {
      expect(await authenticate({ email: "lockout@example.com", password: `wrong-password-${i}`, ip })).toEqual({ ok: false, reason: "invalid_credentials" });
    }
    const fifth = await authenticate({ email: "lockout@example.com", password: "wrong-password-5", ip });
    expect(fifth.ok).toBe(false);
    if (fifth.ok) throw new Error("unreachable");
    expect(fifth.reason).toBe("locked");
    // The lock's end is not returned: it would reveal that the account exists.
    expect(fifth.retryAt).toBeUndefined();
    const locked = await pool().query<{ minutes: number }>("select extract(epoch from locked_until - now()) / 60 as minutes from users where id = $1", [userId]);
    expect(Number(locked.rows[0]!.minutes)).toBeGreaterThan(14);
    expect(Number(locked.rows[0]!.minutes)).toBeLessThanOrEqual(15);

    // Even the right password is refused while locked, after the same bcrypt work as any attempt.
    const started = performance.now();
    const whileLocked = await authenticate({ email: "lockout@example.com", password: "lockout-password-1", ip });
    expect(whileLocked).toEqual({ ok: false, reason: "locked" });
    expect(performance.now() - started).toBeGreaterThan(50);

    const user = await pool().query<{ failed_logins: number }>("select failed_logins from users where id = $1", [userId]);
    expect(user.rows[0]!.failed_logins).toBe(LOCKOUT_THRESHOLD);
    const audited = await pool().query("select 1 from audit_log where action = 'auth.locked' and entity_id = $1", [userId]);
    expect(audited.rowCount).toBe(1);

    // When the lock ends the right password works and the counters reset.
    await pool().query("update users set locked_until = now() - interval '1 second' where id = $1", [userId]);
    const after = await authenticate({ email: "lockout@example.com", password: "lockout-password-1", ip });
    expect(after).toMatchObject({ ok: true, userId });
    const reset = await pool().query<{ failed_logins: number; locked_until: Date | null }>("select failed_logins, locked_until from users where id = $1", [userId]);
    expect(reset.rows[0]).toEqual({ failed_logins: 0, locked_until: null });
  });

  it("gives unknown emails the same answers, including the lock", async () => {
    const ip = "198.51.100.3";
    for (let i = 1; i < LOCKOUT_THRESHOLD; i++) {
      expect(await authenticate({ email: "nobody@example.com", password: "some-password-123", ip })).toEqual({ ok: false, reason: "invalid_credentials" });
    }
    expect(await authenticate({ email: "nobody@example.com", password: "some-password-123", ip })).toMatchObject({ ok: false, reason: "locked" });
  });

  it("reports admins who still need TOTP enrollment", async () => {
    await createUser({ email: "login-admin@example.com", password: "admin-password-456", admin: "super_admin" });
    const result = await authenticate({ email: "login-admin@example.com", password: "admin-password-456", ip: "198.51.100.4" });
    expect(result).toMatchObject({ ok: true, adminRole: "super_admin", mfa: "setup" });
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window and counts keys separately", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await checkRateLimit("test:limiter-a", 3, 60));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[0]!.resetAt.getTime()).toBeGreaterThan(Date.now());
    expect((await checkRateLimit("test:limiter-b", 3, 60)).allowed).toBe(true);
  });

  it("keys identifiers by HMAC so no email or IP is stored", async () => {
    const key = rateLimitKey("login:email", "Person@Example.com");
    expect(key).toMatch(/^login:email:[0-9a-f]{32}$/);
    expect(key).not.toContain("example");
    expect(rateLimitKey("login:email", "Person@Example.com")).toBe(key);
    expect(rateLimitKey("login:email", "other@example.com")).not.toBe(key);
  });
});

describe("TOTP", () => {
  it("generates secrets, URIs and QR codes, and verifies current codes", async () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    const uri = totpUri(secret, "admin@example.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("issuer=American%20Moving%20Choice");
    expect(await totpQrDataUrl(uri)).toMatch(/^data:image\/png;base64,/);

    const code = currentTotp(secret);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, `${code.slice(0, 3)} ${code.slice(3)}`)).toBe(true);
    expect(verifyTotp(secret, code === "000000" ? "111111" : "000000")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(normalizeTotpCode("12 34 56")).toBe("123456");
  });

  it("encrypts with AES-256-GCM bound to its purpose", () => {
    const key = encryptionKey();
    const sealed = encrypt("JBSWY3DPEHPK3PXP", key, "users.mfa_secret_enc:user-a");
    expect(sealed).toMatch(/^v1\./);
    expect(sealed).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decrypt(sealed, key, "users.mfa_secret_enc:user-a")).toBe("JBSWY3DPEHPK3PXP");
    expect(() => decrypt(sealed, key, "users.mfa_secret_enc:user-b")).toThrow();
    const parts = sealed.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decrypt(parts.join("."), key, "users.mfa_secret_enc:user-a")).toThrow();

    const token = seal({ a: 1 }, key, "purpose-a");
    expect(openSealed(token, key, "purpose-a", 60_000)).toEqual({ a: 1 });
    expect(openSealed(token, key, "purpose-b", 60_000)).toBeNull();
    expect(openSealed(token, key, "purpose-a", -1)).toBeNull();
  });

  it("enrolls with a valid code, then verifies codes for new sessions", async () => {
    const userId = await createUser({ email: "mfa-enroll@example.com", password: "mfa-password-123", admin: "verification" });
    const { session } = await createSession(userId);
    const setup = await createMfaSetup({ id: userId, email: "mfa-enroll@example.com" });

    expect(await confirmMfaSetup({ userId, sessionId: session.id, setupToken: setup.setupToken, code: "000000" === currentTotp(setup.secret) ? "111111" : "000000" })).toEqual({ ok: false, reason: "invalid_code" });
    const otherUser = await createUser({ email: "mfa-other@example.com", password: "mfa-password-456" });
    expect(await confirmMfaSetup({ userId: otherUser, sessionId: session.id, setupToken: setup.setupToken, code: currentTotp(setup.secret) })).toEqual({ ok: false, reason: "expired_setup" });

    expect(await confirmMfaSetup({ userId, sessionId: session.id, setupToken: setup.setupToken, code: currentTotp(setup.secret) })).toEqual({ ok: true });
    const user = await pool().query<{ mfa_secret_enc: string; mfa_enabled_at: Date | null }>("select mfa_secret_enc, mfa_enabled_at from users where id = $1", [userId]);
    expect(user.rows[0]!.mfa_enabled_at).not.toBeNull();
    expect(user.rows[0]!.mfa_secret_enc).not.toContain(setup.secret);
    const passed = await pool().query<{ mfa_passed_at: Date | null }>("select mfa_passed_at from sessions where id = $1", [session.id]);
    expect(passed.rows[0]!.mfa_passed_at).not.toBeNull();

    // A second enrollment cannot replace the first.
    const again = await createMfaSetup({ id: userId, email: "mfa-enroll@example.com" });
    expect(await confirmMfaSetup({ userId, sessionId: session.id, setupToken: again.setupToken, code: currentTotp(again.secret) })).toEqual({ ok: false, reason: "already_enrolled" });

    // A new session starts without MFA. The enrollment code can't be used again (RFC 6238 §5.2);
    // the next period's code passes.
    const enrollmentCode = currentTotp(setup.secret);
    const next = await createSession(userId);
    expect(mfaRequirement((await readSession(next.token))!)).toBe("verify");
    expect(await verifyMfaCode({ userId, sessionId: next.session.id, code: enrollmentCode })).toEqual({ ok: false, reason: "invalid_code" });
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + 30_000 });
    const nextCode = currentTotp(setup.secret);
    expect(await verifyMfaCode({ userId, sessionId: next.session.id, code: nextCode })).toEqual({ ok: true });
    expect(mfaRequirement((await readSession(next.token))!)).toBe("ok");
    expect(await verifyMfaCode({ userId: otherUser, sessionId: next.session.id, code: "123456" })).toEqual({ ok: false, reason: "not_enrolled" });

    // The same code on a third session is refused: a code works once.
    const third = await createSession(userId);
    expect(await verifyMfaCode({ userId, sessionId: third.session.id, code: nextCode })).toEqual({ ok: false, reason: "invalid_code" });
    expect(mfaRequirement((await readSession(third.token))!)).toBe("verify");
  });

  it("locks the account and signs the session out after 5 wrong codes, with audit entries", async () => {
    const userId = await createUser({ email: "mfa-guess@example.com", password: "mfa-password-789", admin: "ops" });
    const enroll = await createSession(userId);
    const setup = await createMfaSetup({ id: userId, email: "mfa-guess@example.com" });
    expect(await confirmMfaSetup({ userId, sessionId: enroll.session.id, setupToken: setup.setupToken, code: currentTotp(setup.secret) })).toEqual({ ok: true });
    const attacker = await createSession(userId);
    const wrong = (n: number) => String((Number(currentTotp(setup.secret)) + 1 + n) % 1_000_000).padStart(6, "0");
    for (let i = 0; i < 4; i++) {
      expect(await verifyMfaCode({ userId, sessionId: attacker.session.id, code: wrong(i) })).toEqual({ ok: false, reason: "invalid_code" });
    }
    expect(await verifyMfaCode({ userId, sessionId: attacker.session.id, code: wrong(4) })).toEqual({ ok: false, reason: "locked" });
    expect(await readSession(attacker.token)).toBeNull();
    const user = await pool().query<{ locked: boolean }>("select locked_until > now() as locked from users where id = $1", [userId]);
    expect(user.rows[0]!.locked).toBe(true);
    const audits = await pool().query<{ action: string }>("select action from audit_log where entity_id = $1 and action like 'auth.mfa_%' order by id", [userId]);
    expect(audits.rows.map((r) => r.action)).toEqual(["auth.mfa_enrolled", "auth.mfa_failed", "auth.mfa_failed", "auth.mfa_failed", "auth.mfa_failed", "auth.mfa_failed", "auth.mfa_locked"]);
    // The password no longer works either until the lock ends.
    expect(await authenticate({ email: "mfa-guess@example.com", password: "mfa-password-789", ip: "198.51.100.40" })).toEqual({ ok: false, reason: "locked" });
  });

  it("reports an unreadable secret instead of looping, and a super admin can reset enrollment", async () => {
    const userId = await createUser({ email: "mfa-lost@example.com", password: "mfa-password-321", admin: "finance" });
    const enroll = await createSession(userId);
    const setup = await createMfaSetup({ id: userId, email: "mfa-lost@example.com" });
    expect(await confirmMfaSetup({ userId, sessionId: enroll.session.id, setupToken: setup.setupToken, code: currentTotp(setup.secret) })).toEqual({ ok: true });
    // As if APP_ENCRYPTION_KEY had changed: the stored value no longer decrypts.
    await pool().query("update users set mfa_secret_enc = $2 where id = $1", [userId, encrypt("JBSWY3DPEHPK3PXP", Buffer.alloc(32, 7), `users.mfa_secret_enc:${userId}`)]);
    const later = await createSession(userId);
    expect(await verifyMfaCode({ userId, sessionId: later.session.id, code: "123456" })).toEqual({ ok: false, reason: "secret_unreadable" });

    await expect(resetUserMfa({ userId, actorId: "admin-1", reason: " " })).rejects.toThrow(/reason/);
    expect(await resetUserMfa({ userId, actorId: "admin-1", reason: "Lost phone; identity confirmed by call" })).toBe(true);
    expect(await readSession(later.token)).toBeNull();
    const user = await pool().query("select mfa_secret_enc, mfa_enabled_at, mfa_last_step from users where id = $1", [userId]);
    expect(user.rows[0]).toEqual({ mfa_secret_enc: null, mfa_enabled_at: null, mfa_last_step: null });
    expect(await resetUserMfa({ userId, actorId: "admin-1", reason: "again" })).toBe(false);
  });

  it("refuses truncated GCM authentication tags", () => {
    const key = encryptionKey();
    const sealed = encrypt("JBSWY3DPEHPK3PXP", key, "aad");
    const parts = sealed.split(".");
    for (const bytes of [8, 4]) {
      const truncated = [...parts];
      truncated[2] = Buffer.from(parts[2]!, "base64url").subarray(0, bytes).toString("base64url");
      expect(() => decrypt(truncated.join("."), key, "aad")).toThrow();
    }
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("after-sign-in redirects", () => {
  it("keeps same-site paths and normalizes them", () => {
    expect(safeNextPath("/portal/marketplace?tab=open#top", "/x")).toBe("/portal/marketplace?tab=open#top");
    expect(safeNextPath("/portal/../admin", "/x")).toBe("/admin");
    expect(safeNextPath("/portal/café", "/x")).toBe("/portal/caf%C3%A9");
  });

  it("refuses anything that a browser could resolve off-site, and the auth pages", () => {
    const vectors = [
      "/x/../\\evil.example",
      "/portal/../\\evil.example/steal",
      "//evil.example",
      "/\\evil.example",
      "/%2F%2Fevil.example",
      "/%5Cevil.example",
      "https://evil.example/",
      "evil.example",
      "/portal\u0000",
      "/portal\n",
      "/login",
      "/login/",
      "/mfa/setup?next=/admin",
      "/portal/../login",
      `/${"a".repeat(600)}`,
      "",
    ];
    for (const value of vectors) expect(safeNextPath(value, "/fallback"), JSON.stringify(value)).toBe("/fallback");
    expect(safeNextPath(null, "/fallback")).toBe("/fallback");
  });
});

describe("password reset tokens", () => {
  it("emails a single-use link that signs the user out everywhere", async () => {
    const userId = await createUser({ email: "reset-me@example.com", password: "old-password-1234" });
    const session = await createSession(userId);
    expect(await requestPasswordReset({ email: "Reset-Me@example.com", ip: "192.0.2.10" })).toEqual({ queued: true });
    expect(await requestPasswordReset({ email: "nobody-here@example.com", ip: "192.0.2.10" })).toEqual({ queued: false });

    const message = await pool().query<{ body_text: string; to_address: string; status: string; provider: string }>(
      "select body_text, to_address, status, provider from messages where template = 'password_reset' and related_id = $1",
      [userId],
    );
    // No provider key: stored as a demo message right away, with the link redacted in body_text.
    expect(message.rows[0]).toMatchObject({ to_address: "reset-me@example.com", status: "demo", provider: "demo" });
    expect(message.rows[0]!.body_text).toContain("[link hidden");
    const token = await tokenFromMessage("template = 'password_reset' and related_id = $1", [userId], "/reset-password");
    expect(JSON.stringify((await pool().query("select * from messages where related_id = $1", [userId])).rows)).not.toContain(token);
    const stored = await pool().query("select token_hash from auth_tokens where user_id = $1", [userId]);
    expect(stored.rows[0]!.token_hash).toBe(sha256Hex(token));

    expect(await findPasswordResetToken(token)).toMatchObject({ userId });
    expect(await resetPassword({ token, password: "short" })).toMatchObject({ ok: false, reason: "weak_password" });
    expect(await resetPassword({ token, password: "new-password-5678", ip: "192.0.2.10" })).toEqual({ ok: true, userId });
    expect(await resetPassword({ token, password: "another-password-9" })).toEqual({ ok: false, reason: "invalid_token" });
    expect(await findPasswordResetToken(token)).toBeNull();
    expect(await readSession(session.token)).toBeNull();

    expect(await authenticate({ email: "reset-me@example.com", password: "old-password-1234", ip: "192.0.2.11" })).toMatchObject({ ok: false });
    expect(await authenticate({ email: "reset-me@example.com", password: "new-password-5678", ip: "192.0.2.11" })).toMatchObject({ ok: true, userId });
  });

  it("refuses expired tokens", async () => {
    const userId = await createUser({ email: "reset-expired@example.com", password: "old-password-4321" });
    const token = "E".repeat(43);
    await pool().query(
      "insert into auth_tokens (user_id, purpose, token_hash, expires_at) values ($1, 'password_reset', $2, now() - interval '1 minute')",
      [userId, sha256Hex(token)],
    );
    expect(await findPasswordResetToken(token)).toBeNull();
    expect(await resetPassword({ token, password: "new-password-0000" })).toEqual({ ok: false, reason: "invalid_token" });
  });

  it("answers made-up tokens without hashing a password, and limits submissions per connection", async () => {
    const started = performance.now();
    for (let i = 0; i < 4; i++) {
      expect(await resetPassword({ token: "A".repeat(43), password: "new-password-0000", ip: "192.0.2.50" })).toEqual({ ok: false, reason: "invalid_token" });
    }
    // Four cost-12 hashes would take well over a second.
    expect(performance.now() - started).toBeLessThan(800);
    for (let i = 4; i < 10; i++) await resetPassword({ token: "A".repeat(43), password: "new-password-0000", ip: "192.0.2.50" });
    expect(await resetPassword({ token: "A".repeat(43), password: "new-password-0000", ip: "192.0.2.50" })).toEqual({ ok: false, reason: "rate_limited" });
  });
});

describe("company signup and invitations", () => {
  const application = {
    fullName: "Pat Owner",
    email: "Pat.Owner@Example.com",
    password: "owner-password-123",
    legalName: "Test Moving Company LLC",
    usdot: "USDOT 9000042",
    mc: "mc 9000042",
    phone: "(512) 555-0199",
  };

  it("normalizes USDOT and MC numbers", () => {
    expect(normalizeUsdot("USDOT 1234567")).toBe("1234567");
    expect(normalizeUsdot("DOT# 0012345")).toBe("12345");
    expect(normalizeUsdot("12a45")).toBeNull();
    expect(normalizeMcNumber("MC-123456")).toBe("MC-123456");
    expect(normalizeMcNumber("mc 0123456")).toBe("MC-123456");
    expect(normalizeMcNumber("FF123")).toBeNull();
  });

  it("creates the user, company, owner membership, history and audit entry together", async () => {
    const { userId, companyId } = await signupCompany(application, { ip: "192.0.2.20" });
    const company = await pool().query("select legal_name, status, usdot_number, mc_number, phone from companies where id = $1", [companyId]);
    expect(company.rows[0]).toEqual({ legal_name: "Test Moving Company LLC", status: "applied", usdot_number: "9000042", mc_number: "MC-9000042", phone: "+15125550199" });
    const user = await pool().query<{ email: string; password_hash: string }>("select email, password_hash from users where id = $1", [userId]);
    expect(user.rows[0]!.email).toBe("pat.owner@example.com");
    expect(user.rows[0]!.password_hash).toMatch(/^\$2[aby]\$12\$/);
    const membership = await pool().query("select role, status, can_purchase from company_memberships where company_id = $1 and user_id = $2", [companyId, userId]);
    expect(membership.rows[0]).toEqual({ role: "owner", status: "active", can_purchase: true });
    const history = await pool().query("select from_status, to_status from company_status_history where company_id = $1", [companyId]);
    expect(history.rows).toEqual([{ from_status: null, to_status: "applied" }]);
    const audited = await pool().query<{ after: Record<string, unknown> }>("select after from audit_log where action = 'company.signup' and entity_id = $1", [companyId]);
    expect(audited.rows[0]!.after).toMatchObject({ status: "applied", usdot_number: "9000042" });
    expect(JSON.stringify(audited.rows[0]!.after)).not.toContain("example.com");
  });

  it("refuses a duplicate email and invalid fields", async () => {
    await expect(signupCompany(application)).rejects.toMatchObject({ code: "email_taken" });
    const bad = signupCompany({ ...application, email: "second@example.com", usdot: "12-ab", phone: "123", mc: "" });
    await expect(bad).rejects.toBeInstanceOf(SignupError);
    await expect(bad).rejects.toMatchObject({ code: "invalid" });
    const error = (await bad.catch((e: unknown) => e)) as SignupError;
    expect(Object.keys(error.fieldErrors).sort()).toEqual(["mc", "phone", "usdot"]);
    // Nothing was written for the failed attempts.
    const users = await pool().query("select 1 from users where email = 'second@example.com'");
    expect(users.rowCount).toBe(0);
  });

  it("accepts an MC-less application when the setting allows it", async () => {
    await pool().query("update platform_settings set value = 'false' where key = 'require_mc_number'");
    try {
      const { companyId } = await signupCompany({ ...application, email: "no-mc@example.com", mc: "" });
      const company = await pool().query("select mc_number from companies where id = $1", [companyId]);
      expect(company.rows[0]!.mc_number).toBeNull();
    } finally {
      await pool().query("update platform_settings set value = 'true' where key = 'require_mc_number'");
    }
  });

  it("invites by single-use emailed link", async () => {
    const owner = await signupCompany({ ...application, email: "inviter@example.com" });
    const { invitationId, token } = await createInvitation({ companyId: owner.companyId, email: "New.Agent@Example.com", role: "agent", invitedBy: owner.userId });
    const message = await pool().query<{ body_text: string; to_address: string; status: string }>("select body_text, to_address, status from messages where related_id = $1", [invitationId]);
    expect(message.rows[0]).toMatchObject({ to_address: "new.agent@example.com", status: "demo" });
    expect(message.rows[0]!.body_text).not.toContain(token);
    expect(await tokenFromMessage("related_id = $1", [invitationId], "/invite")).toBe(token);

    expect(await getInvitation(token)).toMatchObject({ state: "valid", role: "agent", email: "new.agent@example.com", hasAccount: false });
    expect(await acceptInvitation(token, { kind: "new", fullName: "New Agent", password: "short" })).toMatchObject({ ok: false, reason: "weak_password" });
    const accepted = await acceptInvitation(token, { kind: "new", fullName: "New Agent", password: "agent-password-123" });
    expect(accepted).toMatchObject({ ok: true, companyId: owner.companyId, createdUser: true });
    if (!accepted.ok) throw new Error("unreachable");
    const membership = await pool().query("select role, can_purchase from company_memberships where user_id = $1", [accepted.userId]);
    expect(membership.rows[0]).toEqual({ role: "agent", can_purchase: false });

    expect(await acceptInvitation(token, { kind: "new", fullName: "Someone Else", password: "agent-password-456" })).toEqual({ ok: false, reason: "already_used" });
    expect(await getInvitation(token)).toMatchObject({ state: "accepted" });
  });

  it("refuses expired invitations and the wrong signed-in user", async () => {
    const owner = await signupCompany({ ...application, email: "inviter2@example.com" });
    const stranger = await createUser({ email: "stranger@example.com", password: "stranger-password-1" });
    const { token, invitationId } = await createInvitation({ companyId: owner.companyId, email: "manager@example.com", role: "manager", invitedBy: owner.userId });
    expect(await acceptInvitation(token, { kind: "existing", userId: stranger })).toEqual({ ok: false, reason: "wrong_user" });
    await pool().query("update invitations set expires_at = now() - interval '1 minute' where id = $1", [invitationId]);
    expect(await acceptInvitation(token, { kind: "new", fullName: "Late Manager", password: "manager-password-1" })).toEqual({ ok: false, reason: "expired" });
    expect(await getInvitation(token)).toMatchObject({ state: "expired" });
  });

  it("answers made-up invitation tokens without hashing a password, and limits attempts per connection", async () => {
    const started = performance.now();
    for (let i = 0; i < 4; i++) {
      expect(await acceptInvitation("B".repeat(43), { kind: "new", fullName: "Guess Er", password: "guess-password-1" }, "192.0.2.60")).toEqual({ ok: false, reason: "invalid_token" });
    }
    expect(performance.now() - started).toBeLessThan(800);
    for (let i = 4; i < 10; i++) await acceptInvitation("B".repeat(43), { kind: "new", fullName: "Guess Er", password: "guess-password-1" }, "192.0.2.60");
    expect(await acceptInvitation("B".repeat(43), { kind: "new", fullName: "Guess Er", password: "guess-password-1" }, "192.0.2.60")).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("flags a second application with the same USDOT number", async () => {
    const first = await signupCompany({ ...application, email: "usdot-first@example.com", usdot: "9000043", mc: "MC-9000043" });
    const second = await signupCompany({ ...application, email: "usdot-second@example.com", usdot: "9000043", mc: "MC-9000043" });
    const rows = await pool().query<{ id: string; status_reason: string | null }>("select id, status_reason from companies where id = any($1::uuid[])", [[first.companyId, second.companyId]]);
    const reasons = Object.fromEntries(rows.rows.map((r) => [r.id, r.status_reason]));
    expect(reasons[first.companyId]).toBeNull();
    expect(reasons[second.companyId]).toBe("duplicate_usdot");
  });
});
