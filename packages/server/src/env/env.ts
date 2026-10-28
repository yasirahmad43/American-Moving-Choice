/**
 * Cached access to the validated environment. Parsing happens on first use, not at import, so a
 * build that never touches the database or secrets does not need them.
 */
import { DEV_DATABASE_URL, EnvError, decodeKey, parseEnv, type Env } from "./schema";

let cached: Env | undefined;

export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Forget the cached environment (tests change process.env between cases). */
export function resetEnvCache(): void {
  cached = undefined;
}

export const isProduction = (): boolean => env().NODE_ENV === "production";

function required(name: string): never {
  throw new EnvError([`${name}: is required in production`]);
}

/** DATABASE_URL (with DATABASE_HOST applied), or the local development database outside production. */
export function databaseUrl(): string {
  const e = env();
  if (e.DATABASE_URL) return withHost(e.DATABASE_URL, e.DATABASE_HOST);
  if (e.NODE_ENV === "production") required("DATABASE_URL");
  return DEV_DATABASE_URL;
}

function withHost(url: string, host: string | undefined): string {
  if (!host) return url;
  const parsed = new URL(url);
  parsed.hostname = host;
  return parsed.toString();
}

// Fixed values for development and tests only. They are public, so production refuses them.
const DEV_SESSION_SECRET = "amc-development-session-secret-not-for-production-use";
const DEV_ENCRYPTION_KEY_HEX = "6d0a5c1b3e2f4a7c9b8d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d";

/** SESSION_SECRET (company app only). Reserved for signing app-only values; not used for HMAC keys. */
export function sessionSecret(): string {
  const e = env();
  if (e.SESSION_SECRET) return e.SESSION_SECRET;
  if (e.NODE_ENV === "production") required("SESSION_SECRET");
  return DEV_SESSION_SECRET;
}

/**
 * Same public value as db/seed/build.ts's DEV_HMAC_SECRET, so a local seed's contact hashes
 * match. Production refuses it.
 */
export const DEV_HMAC_SECRET = "amc-development-hmac-secret-not-for-production-use";

/** HMAC_SECRET (both apps): rate-limit keys and contact hashes. */
export function hmacSecret(): string {
  const e = env();
  if (e.HMAC_SECRET) return e.HMAC_SECRET;
  if (e.NODE_ENV === "production") required("HMAC_SECRET");
  return DEV_HMAC_SECRET;
}

/** APP_ENCRYPTION_KEY as 32 raw bytes: AES-256-GCM for TOTP secrets and sealed setup tokens. */
export function encryptionKey(): Buffer {
  const e = env();
  if (e.APP_ENCRYPTION_KEY) {
    const key = decodeKey(e.APP_ENCRYPTION_KEY);
    if (key) return key;
  }
  if (e.NODE_ENV === "production") required("APP_ENCRYPTION_KEY");
  return Buffer.from(DEV_ENCRYPTION_KEY_HEX, "hex");
}
