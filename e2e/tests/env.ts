/** Shared settings for the scenarios (see playwright.config.ts). */
import { createDecipheriv } from "node:crypto";
import pg from "pg";

export const WEB_URL = (process.env.E2E_WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");
export const APP_URL = (process.env.E2E_APP_URL ?? "http://localhost:3001").replace(/\/+$/, "");

export interface SeedLogin {
  email: string;
  password: string;
}

/**
 * The seed's logins come only from the environment (the same SEED_* values the seed was built
 * with). There are deliberately no defaults: a password written here would be a working password
 * for any deployment seeded with it.
 */
export function seedLogin(who: "admin" | "mover"): SeedLogin {
  const prefix = who === "admin" ? "SEED_ADMIN" : "SEED_MOVER";
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) throw new Error(`Set ${prefix}_EMAIL and ${prefix}_PASSWORD to the values the demo seed was built with`);
  return { email, password };
}

/** The admin's TOTP secret when the seed enrolled one (SEED_ADMIN_TOTP_SECRET). */
export const ADMIN_TOTP_SECRET = process.env.SEED_ADMIN_TOTP_SECRET?.replace(/\s+/g, "").toUpperCase() || null;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * DATABASE_URL when the scenarios may read and change it, else null. The scenarios rewrite
 * security state (rate-limit counters, the admin's TOTP enrollment), so they never touch a remote
 * database, and locally only one named *_e2e or *_test unless E2E_ALLOW_DB_WRITES=1. Run as a
 * post-deploy smoke test without DATABASE_URL.
 */
export function testDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const parsed = new URL(url);
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    console.warn(`[e2e] DATABASE_URL points at ${parsed.hostname}; database steps are skipped (never against a remote database)`);
    return null;
  }
  if (!/_(e2e|test)$/.test(name) && process.env.E2E_ALLOW_DB_WRITES !== "1") {
    console.warn(`[e2e] database "${name}" doesn't end in _e2e or _test; database steps are skipped (set E2E_ALLOW_DB_WRITES=1 to allow)`);
    return null;
  }
  return url;
}

export const hasDatabase = testDatabaseUrl() !== null;

/** Runs a query against the test database, or does nothing when database steps are not allowed. */
export async function withDatabase<T>(fn: (client: pg.Client) => Promise<T>): Promise<T | undefined> {
  const url = testDatabaseUrl();
  if (!url) return undefined;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

function decodeKey(value: string): Buffer | null {
  const trimmed = value.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, "hex");
  const bytes = Buffer.from(trimmed.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return bytes.length === 32 ? bytes : null;
}

/** APP_ENCRYPTION_KEY of the running app, needed to read a message's encrypted deliverable body. */
export const hasEncryptionKey = Boolean(process.env.APP_ENCRYPTION_KEY && decodeKey(process.env.APP_ENCRYPTION_KEY));

/**
 * The deliverable body of an outbox message that carries a secret link (messages.body_secret_enc,
 * AES-256-GCM bound to the message ID; see packages/server/src/outbox/outbox.ts).
 */
export function decryptMessageBody(messageId: string, sealed: string): string {
  const key = decodeKey(process.env.APP_ENCRYPTION_KEY ?? "");
  if (!key) throw new Error("APP_ENCRYPTION_KEY is not set");
  const [version, iv, tag, data] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("unexpected sealed format");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"), { authTagLength: 16 });
  decipher.setAAD(Buffer.from(`messages.body_secret_enc:${messageId}`, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
