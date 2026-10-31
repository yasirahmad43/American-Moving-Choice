import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { bingCredentialAad, createBingConnectionManager } from "../src/reporting/bing-connection";
import { decrypt } from "../src/auth/crypto";
import { createSession } from "../src/auth/sessions";
import { sha256Hex } from "../src/auth/tokens";
import { closePool, getPool } from "../src/db/pool";
import { createUser, resetDatabase } from "./helpers";

const SITE = "https://www.americanmovingchoice.com";
const APP = "https://app.americanmovingchoice.com";
const KEY = Buffer.alloc(32, 19);
const CLIENT = "bing-fixture-client";
const SECRET = "bing-fixture-client-secret";
const TOKEN_URL = "https://www.bing.com/webmasters/oauth/token";
const config = { WEB_URL: SITE, APP_URL: APP, BING_REPORTING_CLIENT_ID: CLIENT, BING_REPORTING_CLIENT_SECRET: SECRET };
const credentials = (overrides = {}) => ({
  token_type: "Bearer", access_token: "bing-fixture-access", refresh_token: "bing-fixture-refresh",
  expires_in: 3600, scope: "webmaster.read", ...overrides,
});
let sequence = 0, now: number;

async function actor(role = "super_admin") {
  const userId = await createUser({ email: `bing-connect-${++sequence}@example.test`, admin: role });
  const { session } = await createSession(userId, { mfaPassed: true });
  return { userId, sessionId: session.id };
}
function mockTokens(reply: (body: URLSearchParams) => unknown | Promise<unknown> = () => credentials()) {
  return vi.fn(async (input: string | URL | Request, options?: RequestInit) => {
    expect(String(input)).toBe(TOKEN_URL);
    expect(options).toMatchObject({ method: "POST", redirect: "error", cache: "no-store" });
    const body = new URLSearchParams(options?.body as URLSearchParams);
    expect(body.get("client_id")).toBe(CLIENT);
    expect(body.get("client_secret")).toBe(SECRET);
    const result = await reply(body);
    return result instanceof Response ? result : Response.json(result);
  });
}
const asFetch = (value: ReturnType<typeof mockTokens>) => value as unknown as typeof globalThis.fetch;
function manager(fetcher = mockTokens(), options = {}) {
  return createBingConnectionManager(config, { pool: getPool(), fetch: asFetch(fetcher), now: () => now, encryptionKey: () => KEY, ...options });
}
async function begin(connection: ReturnType<typeof manager>, who: Awaited<ReturnType<typeof actor>>) {
  const result = await connection.begin(who);
  const authorization = new URL(result.authorizeUrl);
  const state = authorization.searchParams.get("state");
  expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/u);
  return { state: state!, authorization };
}
async function connect(connection: ReturnType<typeof manager>, who: Awaited<ReturnType<typeof actor>>) {
  const { state } = await begin(connection, who);
  await connection.complete({ ...who, state, code: "bing-fixture-authorization-code" });
  return state;
}
async function stored() { return (await getPool().query("select * from reporting_oauth_connections")).rows; }
async function assertNoCredentialLeaks(extra: unknown = {}, additionalSecrets: string[] = []) {
  const states = (await getPool().query("select * from reporting_oauth_states")).rows;
  const audits = (await getPool().query("select * from audit_log")).rows;
  const serialized = JSON.stringify({ states, connections: await stored(), audits, extra });
  for (const value of [SECRET, "bing-fixture-authorization-code", "bing-fixture-access", "bing-fixture-refresh", "bing-fixture-access-rotated", "bing-fixture-refresh-rotated", "private-provider-error", ...additionalSecrets]) expect(serialized).not.toContain(value);
}

beforeAll(async () => { await resetDatabase(); });
beforeEach(async () => {
  now = Date.now();
  await getPool().query("truncate reporting_oauth_states, reporting_oauth_connections");
});
afterAll(async () => { await closePool(); });

describe("durable read-only Bing OAuth connection", () => {
  it("keeps both credential relations backend-only and outside realtime publication", async () => {
    const names = ["reporting_oauth_states", "reporting_oauth_connections"];
    const result = await getPool().query<{
      relname: string; relrowsecurity: boolean; relowner: number; grants: { role: string; grantee: number }[];
    }>(`select c.relname, c.relrowsecurity, c.relowner,
          coalesce((select jsonb_agg(jsonb_build_object('role', coalesce(r.rolname, 'PUBLIC'), 'grantee', a.grantee))
            from aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
            left join pg_roles r on r.oid = a.grantee), '[]'::jsonb) as grants
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = current_schema() and c.relname = any($1::text[])`, [names]);
    expect(result.rows).toHaveLength(2);
    for (const row of result.rows) {
      expect(row.relrowsecurity).toBe(true);
      for (const grant of row.grants) {
        expect(grant.grantee).not.toBe(0);
        expect(grant.grantee === row.relowner || grant.role === "amc_app").toBe(true);
      }
    }
    const publication = await getPool().query("select tablename from pg_publication_tables where schemaname=current_schema() and tablename=any($1::text[])", [names]);
    expect(publication.rowCount).toBe(0);
  });

  it("creates a read-only authorization URL and stores only a session-bound state hash", async () => {
    const who = await actor(), fetcher = mockTokens(), connection = manager(fetcher);
    const { state, authorization } = await begin(connection, who);
    expect(authorization.origin).toBe("https://www.bing.com");
    expect(authorization.pathname.toLowerCase()).toBe("/webmasters/oauth/authorize");
    expect(authorization.searchParams.get("client_id")).toBe(CLIENT);
    expect(authorization.searchParams.get("response_type")).toBe("code");
    expect(authorization.searchParams.get("scope")).toBe("webmaster.read");
    expect(new URL(authorization.searchParams.get("redirect_uri")!).origin).toBe(APP);
    const rows = (await getPool().query("select * from reporting_oauth_states")).rows;
    expect(rows).toHaveLength(1);
    const serialized = JSON.stringify(rows[0]);
    expect(serialized).toContain(sha256Hex(state)); expect(serialized).not.toContain(state);
    expect(serialized).toContain(who.userId); expect(serialized).toContain(who.sessionId); expect(serialized).toContain(CLIENT);
    expect(serialized).toContain(SITE);
    expect(new Date(rows[0].expires_at).getTime() - now).toBeGreaterThan(9 * 60_000);
    expect(new Date(rows[0].expires_at).getTime() - now).toBeLessThanOrEqual(10 * 60_000 + 1_000);
    expect(await connection.status()).toMatchObject({ available: true, connected: false, scope: null });
    expect(fetcher).not.toHaveBeenCalled();
    await assertNoCredentialLeaks({}, [state]);
  });

  it("commits state consumption before exchanging the code and encrypts credentials at rest", async () => {
    const who = await actor(); let state = "";
    const fetcher = mockTokens(async body => {
      expect(body.get("grant_type")).toBe("authorization_code");
      expect(body.get("code")).toBe("bing-fixture-authorization-code");
      expect(new URL(body.get("redirect_uri")!).origin).toBe(APP);
      // This separate pool query would see an unconsumed row if the implementation kept its
      // state update uncommitted while the remote exchange was in flight.
      const result = await getPool().query("select * from reporting_oauth_states");
      const row = result.rows.find(value => JSON.stringify(value).includes(sha256Hex(state)));
      expect(row).toBeDefined();
      expect(row.used_at).not.toBeNull();
      return credentials();
    });
    const connection = manager(fetcher); state = (await begin(connection, who)).state;
    await connection.complete({ ...who, state, code: "bing-fixture-authorization-code" });
    const rows = await stored(); expect(rows).toHaveLength(1);
    expect(rows[0].refresh_token_enc).toMatch(/^v1\./u);
    expect(rows[0].access_token_enc).toMatch(/^v1\./u);
    expect(decrypt(rows[0].refresh_token_enc, KEY, bingCredentialAad(rows[0].site_url, CLIENT, "refresh"))).toBe("bing-fixture-refresh");
    expect(decrypt(rows[0].access_token_enc, KEY, bingCredentialAad(rows[0].site_url, CLIENT, "access"))).toBe("bing-fixture-access");
    expect(() => decrypt(rows[0].access_token_enc, KEY, bingCredentialAad(rows[0].site_url, CLIENT, "refresh"))).toThrow();
    expect(() => decrypt(rows[0].refresh_token_enc, KEY, bingCredentialAad("https://another.example.com/", CLIENT, "refresh"))).toThrow();
    const metadata = await connection.status();
    expect(metadata).toMatchObject({ available: true, connected: true, scope: "webmaster.read" });
    expect(metadata.connectedAt).toBeTruthy(); expect(metadata.updatedAt).toBeTruthy();
    expect(Object.keys(metadata).sort()).toEqual(["available", "connected", "connectedAt", "scope", "siteUrl", "updatedAt"]);
    expect(await connection.accessToken()).toBe("bing-fixture-access");
    expect(fetcher).toHaveBeenCalledTimes(1);
    await assertNoCredentialLeaks(metadata, [state]);
  });

  it("rejects another owner, session, unknown state and an expired state without token exchange", async () => {
    const who = await actor(), other = await actor(), second = await createSession(who.userId, { mfaPassed: true });
    const fetcher = mockTokens(), connection = manager(fetcher), { state } = await begin(connection, who);
    for (const details of [other, { ...who, sessionId: second.session.id }, { ...who, sessionId: "0".repeat(64) }]) {
      await expect(connection.complete({ ...details, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    }
    await expect(connection.complete({ ...who, state: "A".repeat(43), code: "bing-fixture-authorization-code" })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    now += 10 * 60_000 + 1;
    await getPool().query("update reporting_oauth_states set expires_at=now()-interval '1 second'");
    await expect(connection.complete({ ...who, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled(); expect(await stored()).toHaveLength(0);
  });

  it("does not save a grant when the owner's session is revoked during the exchange", async () => {
    const who = await actor();
    const fetcher = mockTokens(async () => {
      await getPool().query("update sessions set revoked_at=now() where id=$1", [who.sessionId]);
      return credentials();
    });
    const connection = manager(fetcher), { state } = await begin(connection, who);
    await expect(connection.complete({ ...who, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1); expect(await stored()).toHaveLength(0);
    await assertNoCredentialLeaks();
  });

  it("never lets a bad callback consume the valid owner's still-live state", async () => {
    const who = await actor(), other = await actor(), fetcher = mockTokens(), connection = manager(fetcher);
    const { state } = await begin(connection, who);
    await expect(connection.complete({ ...other, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    await connection.complete({ ...who, state, code: "bing-fixture-authorization-code" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects replay and consumes failed exchanges so the same code cannot be retried", async () => {
    const who = await actor(), good = mockTokens(), connection = manager(good), state = await connect(connection, who);
    await expect(connection.complete({ ...who, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
    await getPool().query("truncate reporting_oauth_states, reporting_oauth_connections");
    const failed = mockTokens(() => new Response("private-provider-error", { status: 400 })), broken = manager(failed);
    const attempt = await begin(broken, who);
    for (let i = 0; i < 2; i++) {
      const error = await broken.complete({ ...who, state: attempt.state, code: "bing-fixture-authorization-code" }).then(() => null, value => value);
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).not.toMatch(/private-provider-error|bing-fixture-authorization-code/gu);
    }
    expect(failed).toHaveBeenCalledTimes(1); expect(await stored()).toHaveLength(0);
    await assertNoCredentialLeaks();
  });

  it("requires a live super-admin session at begin and callback time", async () => {
    const fetcher = mockTokens(), connection = manager(fetcher);
    for (const role of ["ops", "finance", "support", "content_editor", "verification", "moderator"]) {
      await expect(connection.begin(await actor(role))).rejects.toThrow();
    }
    const revoked = await actor();
    await getPool().query("update sessions set revoked_at=now() where id=$1", [revoked.sessionId]);
    await expect(connection.begin(revoked)).rejects.toThrow();
    const expired = await actor();
    await getPool().query("update sessions set expires_at=now()-interval '1 second' where id=$1", [expired.sessionId]);
    await expect(connection.begin(expired)).rejects.toThrow();
    const who = await actor(), { state } = await begin(connection, who);
    await getPool().query("update admin_users set admin_role='ops' where user_id=$1", [who.userId]);
    await expect(connection.complete({ ...who, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled(); expect(await stored()).toHaveLength(0);
  });

  it("binds authorization state to the configured client and site", async () => {
    const who = await actor(), fetcher = mockTokens(), connection = manager(fetcher), { state } = await begin(connection, who);
    for (const changed of [{ BING_REPORTING_CLIENT_ID: "another-client" }, { BING_REPORTING_SITE_URL: "https://another.example.com/" }]) {
      const other = createBingConnectionManager({ ...config, ...changed }, { pool: getPool(), fetch: asFetch(fetcher), now: () => now, encryptionKey: () => KEY });
      await expect(other.complete({ ...who, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    }
    expect(fetcher).not.toHaveBeenCalled();
    await connection.complete({ ...who, state, code: "bing-fixture-authorization-code" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("accepts only read-only authorization and never stores a broader scope", async () => {
    const who = await actor(), fetcher = mockTokens(() => credentials({ scope: "webmaster.manage" })), connection = manager(fetcher);
    const { state } = await begin(connection, who);
    await expect(connection.complete({ ...who, state, code: "bing-fixture-authorization-code" })).rejects.toThrow();
    expect(await stored()).toHaveLength(0); await assertNoCredentialLeaks();
  });

  it("exchanges a concurrently replayed callback only once across independent managers", async () => {
    const who = await actor(); let release: (() => void) | undefined;
    const held = new Promise<void>(resolve => { release = resolve; });
    const fetcher = mockTokens(async () => { await held; return credentials(); });
    const first = manager(fetcher), second = manager(fetcher), { state } = await begin(first, who);
    const callback = { ...who, state, code: "bing-fixture-authorization-code" };
    const pending = first.complete(callback);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    await expect(second.complete(callback)).rejects.toThrow();
    expect(await stored()).toHaveLength(0);
    release!(); await pending;
    expect(fetcher).toHaveBeenCalledTimes(1); expect(await stored()).toHaveLength(1);
  });

  it("serializes refresh across independent managers and commits rotation before releasing the access token", async () => {
    const who = await actor(), initial = manager(); await connect(initial, who);
    now += 3_600_001;
    let release: (() => void) | undefined, calls = 0;
    const held = new Promise<void>(resolve => { release = resolve; });
    const fetcher = mockTokens(async body => {
      calls++;
      expect(body.get("grant_type")).toBe("refresh_token"); expect(body.get("refresh_token")).toBe("bing-fixture-refresh");
      await held;
      return credentials({ access_token: "bing-fixture-access-rotated", refresh_token: "bing-fixture-refresh-rotated" });
    });
    const first = manager(fetcher), second = manager(fetcher);
    const a = first.accessToken(), b = second.accessToken();
    // Wait only for the mock token request to start, then allow a second manager to contend.
    await vi.waitFor(() => expect(calls).toBe(1));
    await new Promise(resolve => setTimeout(resolve, 30)); expect(calls).toBe(1);
    release!();
    expect(await a).toBe("bing-fixture-access-rotated");
    expect(await b).toBe("bing-fixture-access-rotated"); expect(calls).toBe(1);
    const rotated = (await stored())[0];
    expect(decrypt(rotated.refresh_token_enc, KEY, bingCredentialAad(rotated.site_url, CLIENT, "refresh"))).toBe("bing-fixture-refresh-rotated");
    await assertNoCredentialLeaks(await first.status());
    // A new manager must read the committed rotated secret, rather than a closure-only value.
    now += 3_600_001;
    const fresh = mockTokens(body => {
      expect(body.get("refresh_token")).toBe("bing-fixture-refresh-rotated");
      return credentials({ access_token: "next-fixture-access", refresh_token: "bing-fixture-refresh-rotated" });
    });
    expect(await manager(fresh).accessToken()).toBe("next-fixture-access"); expect(fresh).toHaveBeenCalledTimes(1);
  });
});
