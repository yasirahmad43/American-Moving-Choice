import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type pg from "pg";
import { audit } from "../audit/audit";
import { decrypt, encrypt } from "../auth/crypto";
import { getPool, isUuid, tx, type Queryable } from "../db/pool";
import { encryptionKey as applicationEncryptionKey, env } from "../env";
import { hasBingAppCredentials } from "./bing";
import { BING_READ_SCOPE, BING_TOKEN_URL, parseBingTokenGrant } from "./bing-oauth";
import { invalidateBingReportingCache } from "./cache";
import { readReportingJson, reportingSiteUrl, ReportingFailure } from "./http";
import type { ReportingConfiguration } from "./types";

const AUTHORIZE_URL = "https://www.bing.com/webmasters/oauth/authorize";
const STATE = /^[A-Za-z0-9_-]{43}$/;
const SESSION = /^[0-9a-f]{64}$/;
const CODE = /^[\x21-\x7e]{1,8192}$/;

export interface BingConnectionIdentity { userId: string; sessionId: string }
export interface BingConnectionStatus {
  available: boolean;
  /** A stored non-revoked grant, not proof that the latest reporting API read succeeded. */
  connected: boolean;
  siteUrl: string;
  scope: typeof BING_READ_SCOPE | null;
  connectedAt: string | null;
  updatedAt: string | null;
}

export class BingConnectionError extends Error {
  constructor(readonly reason: "not_configured" | "invalid_state" | "access_denied" | "unavailable") {
    super("Bing reporting connection could not be completed.");
    this.name = "BingConnectionError";
  }
}

/** Purpose, site, client and token kind are authenticated; copied ciphertext cannot be reused. */
export function bingCredentialAad(siteUrl: string, clientId: string, kind: "access" | "refresh"): string {
  return JSON.stringify(["reporting_oauth_connections:v1", "bing", siteUrl, clientId, kind]);
}

interface ConnectionRow extends pg.QueryResultRow {
  scope: string;
  refresh_token_enc: string;
  access_token_enc: string;
  access_expires_at: Date;
  credential_version: string;
  reauthorization_required: boolean;
  connected_at: Date;
  updated_at: Date;
}

export interface BingConnectionDependencies {
  pool?: pg.Pool;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
  encryptionKey?: () => Buffer;
}

function connectionError(error: unknown): BingConnectionError {
  if (error instanceof BingConnectionError) return error;
  if (error instanceof ReportingFailure && (error.status === "not_configured" || error.status === "access_denied")) return new BingConnectionError(error.status);
  return new BingConnectionError("unavailable");
}

async function requireOwner(db: Queryable, identity: BingConnectionIdentity): Promise<void> {
  if (!isUuid(identity.userId) || !SESSION.test(identity.sessionId)) throw new BingConnectionError("access_denied");
  // Caller still uses the normal completed-session guard; this does not change MFA policy.
  const result = await db.query(
    `select s.id from sessions s join users u on u.id = s.user_id join admin_users a on a.user_id = u.id
     where s.id = $2 and s.user_id = $1 and a.admin_role = 'super_admin'
       and s.revoked_at is null and s.expires_at > now()
       and (u.locked_until is null or u.locked_until <= now())
     for share of s, u, a`, [identity.userId, identity.sessionId],
  );
  if (!result.rowCount) throw new BingConnectionError("access_denied");
}

/** Internal factory makes all provider calls injectable; production uses the shared encrypted store. */
export function createBingConnectionManager(config: ReportingConfiguration, dependencies: BingConnectionDependencies = {}) {
  const pool = (): pg.Pool => dependencies.pool ?? getPool();
  const fetcher = dependencies.fetch ?? globalThis.fetch.bind(globalThis);
  const now = dependencies.now ?? Date.now;
  const key = dependencies.encryptionKey ?? applicationEncryptionKey;
  const available = (): boolean => hasBingAppCredentials(config);
  const site = (): string => reportingSiteUrl(config.BING_REPORTING_SITE_URL ?? config.WEB_URL);
  const binding = () => {
    if (!available()) throw new BingConnectionError("not_configured");
    const app = new URL(config.APP_URL ?? "");
    if (app.protocol !== "https:" || app.username || app.password || app.search || app.hash || app.pathname !== "/") throw new BingConnectionError("unavailable");
    return { siteUrl: site(), clientId: config.BING_REPORTING_CLIENT_ID!, redirectUri: `${app.origin}/api/admin/growth/bing/callback` };
  };
  const where = (bound: { siteUrl: string; clientId: string }): unknown[] => [bound.siteUrl, bound.clientId];
  const metadata = (action: string, actorId: string, siteUrl: string, client: Queryable, system = false) => audit({
    actorType: system ? "system" : "admin", actorId, action, entity: "reporting_oauth_connection", entityId: "bing",
    after: { provider: "bing", siteUrl, scope: BING_READ_SCOPE },
  }, client);

  const exchange = async (body: URLSearchParams): Promise<unknown> => {
    try {
      return await readReportingJson(fetcher, BING_TOKEN_URL, {
        method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body,
      });
    } catch (error) {
      if (error instanceof ReportingFailure && [400, 401, 403].includes(error.httpStatus ?? 0) && error.status !== "unavailable") throw new ReportingFailure("access_denied");
      if (error instanceof ReportingFailure && error.httpStatus === 400) throw new ReportingFailure("access_denied");
      throw error;
    }
  };

  return {
    available,

    async begin(identity: BingConnectionIdentity): Promise<{ authorizeUrl: string }> {
      try {
        const bound = binding();
        const state = randomBytes(32).toString("base64url");
        const stateHash = createHash("sha256").update(state).digest("hex");
        await tx(async (client) => {
          await requireOwner(client, identity);
          await client.query("delete from reporting_oauth_states where expires_at < now() - interval '1 day'");
          await client.query(
            `insert into reporting_oauth_states (state_hash, provider, site_url, client_id, redirect_uri, user_id, session_id, expires_at)
             values ($1, 'bing', $2, $3, $4, $5, $6, now() + interval '10 minutes')`,
            [stateHash, bound.siteUrl, bound.clientId, bound.redirectUri, identity.userId, identity.sessionId],
          );
          await metadata("reporting.bing.begin", identity.userId, bound.siteUrl, client);
        }, pool());
        const url = new URL(AUTHORIZE_URL);
        url.search = new URLSearchParams({ client_id: bound.clientId, response_type: "code", redirect_uri: bound.redirectUri, scope: BING_READ_SCOPE, state }).toString();
        return { authorizeUrl: url.toString() };
      } catch (error) { throw connectionError(error); }
    },

    async complete(input: BingConnectionIdentity & { state: string; code: string }): Promise<void> {
      try {
        const bound = binding();
        if (!STATE.test(input.state) || !CODE.test(input.code)) throw new BingConnectionError("invalid_state");
        const stateHash = createHash("sha256").update(input.state).digest("hex");
        // Commit consumption before contacting Bing. A failed exchange cannot resurrect this state.
        await tx(async (client) => {
          await requireOwner(client, input);
          const claimed = await client.query(
            `update reporting_oauth_states set used_at = now()
             where state_hash = $1 and provider = 'bing' and site_url = $2 and client_id = $3 and redirect_uri = $4
               and user_id = $5 and session_id = $6 and used_at is null and expires_at > now()
             returning state_hash`,
            [stateHash, bound.siteUrl, bound.clientId, bound.redirectUri, input.userId, input.sessionId],
          );
          if (!claimed.rowCount) throw new BingConnectionError("invalid_state");
        }, pool());
        const grant = parseBingTokenGrant(await exchange(new URLSearchParams({
          client_id: bound.clientId, client_secret: config.BING_REPORTING_CLIENT_SECRET!, code: input.code,
          grant_type: "authorization_code", redirect_uri: bound.redirectUri,
        })), now());
        const refresh = encrypt(grant.refreshToken, key(), bingCredentialAad(bound.siteUrl, bound.clientId, "refresh"));
        const access = encrypt(grant.accessToken, key(), bingCredentialAad(bound.siteUrl, bound.clientId, "access"));
        await tx(async (client) => {
          await requireOwner(client, input);
          await client.query(
            `insert into reporting_oauth_connections
             (provider, site_url, client_id, scope, refresh_token_enc, access_token_enc, access_expires_at, connected_by)
             values ('bing', $1, $2, $3, $4, $5, $6, $7)
             on conflict (provider, site_url, client_id) do update set
               scope = excluded.scope, refresh_token_enc = excluded.refresh_token_enc, access_token_enc = excluded.access_token_enc,
               access_expires_at = excluded.access_expires_at, connected_by = excluded.connected_by,
               credential_version = reporting_oauth_connections.credential_version + 1,
               reauthorization_required = false, connected_at = now(), updated_at = now()`,
            [bound.siteUrl, bound.clientId, BING_READ_SCOPE, refresh, access, grant.expiresAt, input.userId],
          );
          await metadata("reporting.bing.connected", input.userId, bound.siteUrl, client);
        }, pool());
        invalidateBingReportingCache();
      } catch (error) { throw connectionError(error); }
    },

    async status(): Promise<BingConnectionStatus> {
      try {
        const publicSite = (() => { try { return site(); } catch { return ""; } })();
        const empty: BingConnectionStatus = { available: available(), connected: false, siteUrl: publicSite, scope: null, connectedAt: null, updatedAt: null };
        if (!available()) return empty;
        const bound = binding();
        const result = await pool().query<Pick<ConnectionRow, "scope" | "reauthorization_required" | "connected_at" | "updated_at">>(
          `select scope, reauthorization_required, connected_at, updated_at from reporting_oauth_connections
           where provider = 'bing' and site_url = $1 and client_id = $2`, where(bound),
        );
        const row = result.rows[0];
        if (!row || row.reauthorization_required || row.scope !== BING_READ_SCOPE) return empty;
        return { ...empty, connected: true, scope: BING_READ_SCOPE, connectedAt: row.connected_at.toISOString(), updatedAt: row.updated_at.toISOString() };
      } catch (error) { throw connectionError(error); }
    },

    async accessToken(): Promise<string> {
      try {
        const bound = binding();
        const result = await tx(async (client) => {
          await client.query("set local lock_timeout = '5s'");
          const found = await client.query<ConnectionRow>(
            `select scope, refresh_token_enc, access_token_enc, access_expires_at, credential_version,
                    reauthorization_required, connected_at, updated_at
             from reporting_oauth_connections where provider = 'bing' and site_url = $1 and client_id = $2 for update`, where(bound),
          );
          const row = found.rows[0];
          if (!row) return { kind: "missing" as const };
          if (row.reauthorization_required || row.scope !== BING_READ_SCOPE) return { kind: "denied" as const };
          const accessAad = bingCredentialAad(bound.siteUrl, bound.clientId, "access");
          const refreshAad = bingCredentialAad(bound.siteUrl, bound.clientId, "refresh");
          if (row.access_expires_at.getTime() > now() + 30_000) {
            return { kind: "token" as const, value: decrypt(row.access_token_enc, key(), accessAad) };
          }
          try {
            const oldRefresh = decrypt(row.refresh_token_enc, key(), refreshAad);
            const grant = parseBingTokenGrant(await exchange(new URLSearchParams({
              client_id: bound.clientId, client_secret: config.BING_REPORTING_CLIENT_SECRET!,
              refresh_token: oldRefresh, grant_type: "refresh_token",
            })), now(), oldRefresh);
            await client.query(
              `update reporting_oauth_connections set refresh_token_enc = $3, access_token_enc = $4,
                 access_expires_at = $5, credential_version = credential_version + 1, updated_at = now()
               where provider = 'bing' and site_url = $1 and client_id = $2`,
              [...where(bound), encrypt(grant.refreshToken, key(), refreshAad), encrypt(grant.accessToken, key(), accessAad), grant.expiresAt],
            );
            await metadata("reporting.bing.refreshed", "bing_reporting", bound.siteUrl, client, true);
            return { kind: "token" as const, value: grant.accessToken };
          } catch (error) {
            if (!(error instanceof ReportingFailure) || error.status !== "access_denied") throw error;
            await client.query(
              `update reporting_oauth_connections set reauthorization_required = true,
                 access_expires_at = least(access_expires_at, now()), updated_at = now()
               where provider = 'bing' and site_url = $1 and client_id = $2`, where(bound),
            );
            await metadata("reporting.bing.access_denied", "bing_reporting", bound.siteUrl, client, true);
            return { kind: "denied" as const };
          }
        }, pool());
        // tx commits rotated credentials before the token can reach a reporting request.
        if (result.kind === "missing") throw new ReportingFailure("not_configured");
        if (result.kind === "denied") throw new ReportingFailure("access_denied");
        return result.value;
      } catch (error) {
        if (error instanceof ReportingFailure) throw error;
        if (error instanceof BingConnectionError && error.reason === "not_configured") throw new ReportingFailure("not_configured");
        throw new ReportingFailure("unavailable");
      }
    },

    async invalidateAccessToken(): Promise<void> {
      try {
        const bound = binding();
        await pool().query(
          `update reporting_oauth_connections set access_expires_at = least(access_expires_at, now()), updated_at = now()
           where provider = 'bing' and site_url = $1 and client_id = $2`, where(bound),
        );
      } catch { throw new ReportingFailure("unavailable"); }
    },
  };
}

let defaultManager: ReturnType<typeof createBingConnectionManager> | undefined;
export function bingConnectionManager(): ReturnType<typeof createBingConnectionManager> {
  return defaultManager ??= createBingConnectionManager(env());
}
export const beginBingConnection = (identity: BingConnectionIdentity): Promise<{ authorizeUrl: string }> => bingConnectionManager().begin(identity);
export const completeBingConnection = (input: BingConnectionIdentity & { state: string; code: string }): Promise<void> => bingConnectionManager().complete(input);
export const bingConnectionAvailable = (): boolean => hasBingAppCredentials(env());
export const getBingConnectionStatus = (): Promise<BingConnectionStatus> => bingConnectionManager().status();
