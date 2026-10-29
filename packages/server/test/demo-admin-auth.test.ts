import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getCurrentUser, getSessionUserUnverified } from "../src/auth/context";
import { authenticate } from "../src/auth/login";
import { createMfaSetup, confirmMfaSetup } from "../src/auth/mfa";
import { createSession, readSession } from "../src/auth/sessions";
import { currentTotp } from "../src/auth/totp";
import { closePool, getPool } from "../src/db/pool";
import { resetEnvCache } from "../src/env/env";
import { SESSION_COOKIE } from "../src/session-cookie";
import { createUser, resetDatabase } from "./helpers";

// Only the request cookie boundary is mocked. Passwords, enrollment, session reads and the
// authorization decision use the actual server implementations against the disposable DB.
const request = vi.hoisted(() => ({ cookies: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => {
    const value = request.cookies.get(name);
    return value === undefined ? undefined : { value };
  } }),
}));

const password = "local-auth-regression-password";
let fixtureNumber = 0;

function policy(demo: boolean, passwordOnly?: boolean) {
  vi.stubEnv("DEMO_MODE", String(demo));
  vi.stubEnv("DEMO_ADMIN_PASSWORD_ONLY", passwordOnly === undefined ? undefined : String(passwordOnly));
  resetEnvCache();
}

async function pendingSession({ enrolled, admin = true }: { enrolled: boolean; admin?: boolean }) {
  const email = `demo-auth-${++fixtureNumber}@example.test`;
  const id = await createUser({ email, password, ...(admin ? { admin: "ops" } : {}) });
  if (enrolled) {
    // Establish real enrollment on a separate session, rather than pretending this pending
    // session completed a factor. The login session must retain a null MFA timestamp.
    const setupSession = await createSession(id);
    const setup = await createMfaSetup({ id, email });
    expect(await confirmMfaSetup({ userId: id, sessionId: setupSession.session.id,
      setupToken: setup.setupToken, code: currentTotp(setup.secret) })).toEqual({ ok: true });
  }
  const pending = await createSession(id);
  request.cookies.set(SESSION_COOKIE, pending.token);
  return { id, email, ...pending };
}

beforeAll(async () => { await resetDatabase(); });
afterEach(() => {
  request.cookies.clear();
  vi.unstubAllEnvs();
  resetEnvCache();
});
afterAll(async () => { await closePool(); });

describe("explicit demo admin password-only sign-in", () => {
  it("still requires the real account password and does not sign in missing or unknown credentials", async () => {
    policy(true, true);
    const email = `demo-password-${++fixtureNumber}@example.test`;
    const id = await createUser({ email, password, admin: "super_admin" });
    for (const invalid of ["", "incorrect-local-password"]) {
      expect(await authenticate({ email, password: invalid, ip: "192.0.2.190" }))
        .toEqual({ ok: false, reason: "invalid_credentials" });
    }
    expect(await authenticate({ email: "absent-demo-admin@example.test", password, ip: "192.0.2.191" }))
      .toEqual({ ok: false, reason: "invalid_credentials" });
    const passwordless = await createUser({ email: "passwordless-demo-admin@example.test", admin: "ops" });
    expect(await authenticate({ email: "passwordless-demo-admin@example.test", password, ip: "192.0.2.192" }))
      .toEqual({ ok: false, reason: "invalid_credentials" });
    expect((await getPool().query("select id from sessions where user_id = any($1::uuid[])", [[id, passwordless]])).rowCount).toBe(0);
    expect(await authenticate({ email, password, ip: "192.0.2.193" }))
      .toMatchObject({ ok: true, userId: id, adminRole: "super_admin", mfa: "ok" });
  });

  it.each([false, true])("allows an enrolled=%s admin login and pending cookie only after explicit demo opt-in", async (enrolled) => {
    policy(true, false);
    const pending = await pendingSession({ enrolled });
    expect(await getCurrentUser()).toBeNull();
    expect((await getSessionUserUnverified())?.mfa).toBe(enrolled ? "verify" : "setup");

    policy(true, true);
    expect(await authenticate({ email: pending.email, password, ip: "192.0.2.194" }))
      .toMatchObject({ ok: true, userId: pending.id, adminRole: "ops", mfa: "ok" });
    expect(await getCurrentUser()).toMatchObject({ id: pending.id, mfa: "ok", session: { mfaPassedAt: null } });
    expect((await readSession(pending.token))?.session.mfaPassedAt).toBeNull();
  });

  for (const passwordOnly of [undefined, false]) {
    it.each([false, true])(`keeps MFA required for enrolled=%s admins when the opt-in is ${passwordOnly === undefined ? "unset" : "false"}`, async (enrolled) => {
      policy(true, passwordOnly);
      const pending = await pendingSession({ enrolled });
      const mfa = enrolled ? "verify" : "setup";
      expect(await authenticate({ email: pending.email, password, ip: "192.0.2.195" }))
        .toMatchObject({ ok: true, userId: pending.id, mfa });
      expect((await getSessionUserUnverified())?.mfa).toBe(mfa);
      expect(await getCurrentUser()).toBeNull();
    });
  }

  it("preserves company-user MFA policy when demo admin password-only mode is enabled", async () => {
    policy(true, true);
    const plain = await pendingSession({ enrolled: false, admin: false });
    expect(await authenticate({ email: plain.email, password, ip: "192.0.2.196" }))
      .toMatchObject({ ok: true, adminRole: null, mfa: "ok" });
    expect(await getCurrentUser()).toMatchObject({ id: plain.id, adminRole: null });

    const enrolled = await pendingSession({ enrolled: true, admin: false });
    expect(await authenticate({ email: enrolled.email, password, ip: "192.0.2.197" }))
      .toMatchObject({ ok: true, adminRole: null, mfa: "verify" });
    expect((await getSessionUserUnverified())?.mfa).toBe("verify");
    expect(await getCurrentUser()).toBeNull();
  });

  it.each([false, true])("reinstates required MFA for enrolled=%s admins without reusing a synthetic pass when demo mode ends", async (enrolled) => {
    policy(true, true);
    const pending = await pendingSession({ enrolled });
    expect(await getCurrentUser()).toMatchObject({ id: pending.id, mfa: "ok" });
    expect((await readSession(pending.token))?.session.mfaPassedAt).toBeNull();

    // Reuse the exact same pending cookie, with the opt-in still configured. A live-mode
    // request must require MFA immediately because no artificial pass was persisted.
    policy(false, true);
    const mfa = enrolled ? "verify" : "setup";
    expect(await authenticate({ email: pending.email, password, ip: "192.0.2.198" }))
      .toMatchObject({ ok: true, userId: pending.id, mfa });
    expect((await getSessionUserUnverified())?.mfa).toBe(mfa);
    expect(await getCurrentUser()).toBeNull();
    expect((await readSession(pending.token))?.session.mfaPassedAt).toBeNull();
  });
});
