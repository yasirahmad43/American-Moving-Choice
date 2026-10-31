import type pg from "pg";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBingConnectionManager, BingConnectionError } from "./bing-connection";
import type { ReportingConfiguration } from "./types";

vi.mock("server-only", () => ({}));

const PRIVATE = "SYNTHETIC_PRIVATE_ERROR_TOKEN";
const IDENTITY = { userId: "12345678-1234-4234-8234-123456789abc", sessionId: "b".repeat(64) };
const INPUT = { ...IDENTITY, state: "A".repeat(43), code: "SYNTHETIC_PRIVATE_AUTH_CODE" };
const CONFIG: ReportingConfiguration = {
  WEB_URL: "https://www.americanmovingchoice.com", APP_URL: "https://app.americanmovingchoice.com",
  BING_REPORTING_CLIENT_ID: "synthetic-private-client-id", BING_REPORTING_CLIENT_SECRET: "synthetic-private-client-secret",
};
const GRANT = { access_token: "synthetic-private-access-token", refresh_token: "synthetic-private-refresh-token", expires_in: 3599, token_type: "Bearer" };
let warning: ReturnType<typeof vi.spyOn>;
beforeEach(() => { warning = vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

function manager(options: {
  config?: ReportingConfiguration; owner?: boolean; claim?: boolean; grant?: unknown; status?: number;
  failSql?: string; sqlState?: string; failKey?: boolean;
} = {}) {
  const query = vi.fn(async (sql: string) => {
    if (options.failSql && sql.includes(options.failSql)) throw Object.assign(new Error(PRIVATE), { code: options.sqlState, detail: PRIVATE, where: PRIVATE });
    if (sql.includes("from sessions s")) return { rowCount: options.owner === false ? 0 : 1, rows: [{ id: IDENTITY.sessionId }] };
    if (sql.includes("update reporting_oauth_states")) return { rowCount: options.claim === false ? 0 : 1, rows: [] };
    return { rowCount: 1, rows: [] };
  });
  const release = vi.fn();
  const pool = { connect: vi.fn(async () => ({ query, release })) } as unknown as pg.Pool;
  const fetcher = vi.fn(async () => Response.json(options.grant ?? GRANT, { status: options.status ?? 200 }));
  const instance = createBingConnectionManager(options.config ?? CONFIG, {
    pool, fetch: fetcher, now: () => Date.parse("2026-10-31T12:00:00Z"),
    encryptionKey: () => { if (options.failKey) throw new Error(PRIVATE); return Buffer.alloc(32, 7); },
  });
  return { instance, query, fetcher };
}

function safeWarning(expected: Record<string, string | number>) {
  expect(warning).toHaveBeenCalledTimes(1);
  expect(warning).toHaveBeenCalledWith("reporting_bing_connection_failure", expected);
  const encoded = JSON.stringify(warning.mock.calls);
  for (const value of [PRIVATE, INPUT.state, INPUT.code, IDENTITY.userId, IDENTITY.sessionId,
    CONFIG.WEB_URL, CONFIG.APP_URL!, CONFIG.BING_REPORTING_CLIENT_ID!, CONFIG.BING_REPORTING_CLIENT_SECRET!,
    GRANT.access_token, GRANT.refresh_token, "https://", '"message":', '"error":', '"detail":', '"where":', '"scope":']) {
    expect(encoded).not.toContain(value);
  }
  expect(Object.keys(warning.mock.calls[0]![1] as object).sort()).toEqual(Object.keys(expected).sort());
}

describe("safe Bing connection failure diagnostics", () => {
  it("leaves successful authorization and token persistence unchanged and silent", async () => {
    const { instance, fetcher, query } = manager();
    const start = await instance.begin(IDENTITY);
    expect(new URL(start.authorizeUrl).searchParams.get("scope")).toBe("webmaster.read");
    await instance.complete(INPUT);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(query.mock.calls.some(([sql]) => sql.includes("insert into reporting_oauth_connections"))).toBe(true);
    expect(warning).not.toHaveBeenCalled();
  });

  it("identifies missing configuration without reflecting configuration values", async () => {
    await expect(manager({ config: { ...CONFIG, BING_REPORTING_CLIENT_SECRET: undefined } }).instance.begin(IDENTITY)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage: "begin_config", reason: "not_configured" });
  });

  it("identifies owner rejection without logging the user or session", async () => {
    const { instance, fetcher } = manager({ owner: false });
    await expect(instance.begin(IDENTITY)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage: "begin_owner", reason: "access_denied" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([["42P01", "42P01"], ["42501", "42501"], [PRIVATE, undefined], ["23505", undefined]])("logs only whitelisted SQLSTATE at state insertion: %s", async (sqlState, expected) => {
    await expect(manager({ failSql: "insert into reporting_oauth_states", sqlState }).instance.begin(IDENTITY)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage: "begin_state", reason: "unavailable", ...(expected ? { sqlState: expected } : {}) });
  });

  it("distinguishes failed state claims from token exchange without changing state checks", async () => {
    const { instance, fetcher } = manager({ claim: false });
    await expect(instance.complete(INPUT)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage: "complete_state_claim", reason: "invalid_state" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 429])("preserves a bounded HTTP%s code without provider errors", async httpStatus => {
    const { instance } = manager({ status: httpStatus, grant: { error: PRIVATE, error_description: PRIVATE, refresh_token: PRIVATE } });
    await expect(instance.complete(INPUT)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage: "complete_token_exchange", reason: httpStatus === 429 ? "unavailable" : "access_denied", httpStatus });
  });

  it.each([["Read", "read"], ["Manage", "manage"], ["Webmaster.manage", "webmaster_manage"], [PRIVATE, "other"], [123, "other"]])("classifies rejected token scope without logging its value: %s", async (scope, scopeCategory) => {
    const { instance } = manager({ grant: { ...GRANT, scope } });
    await expect(instance.complete(INPUT)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage: "complete_token_parse", reason: "scope_rejected", scopeCategory: scopeCategory as string });
  });

  it.each([[undefined, "missing"], ["webmaster.read", "webmaster_read"]])("keeps allowed/omitted scope separate from malformed token fields", async (scope, scopeCategory) => {
    const { instance } = manager({ grant: { ...GRANT, scope, access_token: PRIVATE + "\n" } });
    await expect(instance.complete(INPUT)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage: "complete_token_parse", reason: "access_denied", scopeCategory });
  });

  it.each([
    ["key", "complete_encrypt", undefined],
    ["insert into reporting_oauth_connections", "complete_store", "42501"],
    ["insert into audit_log", "complete_audit", "42P01"],
  ])("distinguishes %s failures without credentials or raw database errors", async (failure, stage, sqlState) => {
    await expect(manager({ failKey: failure === "key", failSql: failure === "key" ? undefined : failure, sqlState }).instance.complete(INPUT)).rejects.toBeInstanceOf(BingConnectionError);
    safeWarning({ stage, reason: "unavailable", ...(sqlState ? { sqlState } : {}) });
  });
});
