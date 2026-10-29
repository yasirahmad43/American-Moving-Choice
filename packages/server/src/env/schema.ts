/**
 * Environment schema (build plan §10). Pure: parses an env-like record and never touches
 * process.env itself, so tests can feed it any input.
 *
 * Optional integration keys select demo modes when absent (build plan §9). Values are never
 * echoed in error messages: issues name the variable and the rule, not what was supplied.
 */
import { z } from "zod";

/** Empty strings (common in .env files and dashboards) count as "not set". */
const blankToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(blankToUndefined, z.string().trim().min(1).optional());
const flag = (fallback: boolean) => z.preprocess(blankToUndefined, z.stringbool().default(fallback));
const url = (fallback: string) =>
  z.preprocess(
    blankToUndefined,
    z
      .url({ protocol: /^https?$/ })
      .default(fallback)
      .transform((value) => value.replace(/\/+$/, "")),
  );

export const DEV_DATABASE_URL = "postgres://amc:amc@localhost:5432/amc_dev";

export const envSchema = z.object({
  NODE_ENV: z.preprocess(blankToUndefined, z.enum(["development", "test", "production"]).default("development")),

  // Database (both apps). DATABASE_URL is required in production; see databaseUrl() in env.ts.
  DATABASE_URL: z.preprocess(
    blankToUndefined,
    z.string().regex(/^postgres(ql)?:\/\//, "must be a postgres:// connection URL").optional(),
  ),
  /**
   * Replace the host, port and user in DATABASE_URL when set (for example to move from Supabase's
   * shared pooler to its dedicated pooler), so they can change without re-entering the secret
   * connection string.
   */
  DATABASE_HOST: z.preprocess(blankToUndefined, z.string().regex(/^[A-Za-z0-9.-]+$/, "must be a hostname").optional()),
  DATABASE_PORT: z.preprocess(blankToUndefined, z.string().regex(/^\d{2,5}$/, "must be a port number").optional()),
  DATABASE_USER: z.preprocess(blankToUndefined, z.string().regex(/^[A-Za-z0-9_.-]+$/, "must be a role name").optional()),
  /**
   * disable (local only: production refuses it for a remote host), require (encrypted, certificate
   * not verified) or verify (encrypted and verified against DATABASE_SSL_CA or Node's trust store).
   */
  DATABASE_SSL: z.preprocess(blankToUndefined, z.enum(["disable", "require", "verify"]).default("disable")),
  /** PEM certificate of the database's CA (Supabase's, from the project settings) for DATABASE_SSL=verify. */
  DATABASE_SSL_CA: z.preprocess(
    blankToUndefined,
    z
      .string()
      .transform((value) => value.replaceAll("\\n", "\n").trim())
      .refine((value) => value.includes("-----BEGIN CERTIFICATE-----"), "must be a PEM certificate")
      .optional(),
  ),
  /** Connections per server instance. Kept small: serverless instances multiply it. */
  DATABASE_POOL_MAX: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(20).default(3)),

  // 32-byte secrets (app only). Required in production when used; see sessionSecret() and
  // encryptionKey() in env.ts, which supply fixed development values elsewhere.
  SESSION_SECRET: z.preprocess(blankToUndefined, z.string().min(32, "must be at least 32 characters").optional()),
  /**
   * Both apps (required in production when used; see hmacSecret() in env.ts). Keys the HMACs that
   * keep IP addresses and emails out of rate-limit keys and the email and phone hashes used for
   * duplicate grouping. Rotating it breaks duplicate grouping with earlier requests.
   */
  HMAC_SECRET: z.preprocess(blankToUndefined, z.string().min(32, "must be at least 32 characters").optional()),
  APP_ENCRYPTION_KEY: z.preprocess(
    blankToUndefined,
    z
      .string()
      .refine((value) => decodeKey(value) !== null, "must be 32 bytes, as 64 hex characters or base64")
      .optional(),
  ),

  WEB_URL: url("http://localhost:3000"),
  APP_URL: url("http://localhost:3001"),
  CRON_SECRET: z.preprocess(blankToUndefined, z.string().min(16, "must be at least 16 characters").optional()),
  DEMO_MODE: flag(true),
  /** Explicit demo-owner preference; ignored whenever DEMO_MODE is false. */
  DEMO_ADMIN_PASSWORD_ONLY: flag(false),
  SITE_INDEXABLE: flag(false),

  /** Sender for transactional email when Postmark is configured. */
  EMAIL_FROM: z.preprocess(
    blankToUndefined,
    z.string().min(3).default("American Moving Choice <notifications@americanmovingchoice.invalid>"),
  ),

  // Optional integrations: absence selects the demo mode.
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  POSTMARK_SERVER_TOKEN: optionalString,
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_FROM_NUMBER: optionalString,
  FMCSA_WEBKEY: optionalString,
  TURNSTILE_SITE_KEY: optionalString,
  TURNSTILE_SECRET_KEY: optionalString,
});

export type Env = z.output<typeof envSchema>;

export class EnvError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "EnvError";
  }
}

/** Parses an env record. Throws EnvError listing variable names and rules (never values). */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => {
    const key = issue.path.join(".") || "(root)";
    return `${key}: ${issue.message}`;
  });
  throw new EnvError(problems);
}

/** Decodes a 32-byte key given as 64 hex characters or as base64/base64url. Null when invalid. */
export function decodeKey(value: string): Buffer | null {
  const trimmed = value.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, "hex");
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(trimmed)) {
    const bytes = Buffer.from(trimmed.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (bytes.length === 32) return bytes;
  }
  return null;
}

export type IntegrationMode = "live" | "demo";

export interface IntegrationModes {
  payments: IntegrationMode;
  email: IntegrationMode;
  sms: IntegrationMode;
  fmcsa: IntegrationMode;
  botDefense: IntegrationMode;
}

/** Which integrations run live: each needs its credentials (build plan §9). */
export function integrationModes(env: Env): IntegrationModes {
  const mode = (on: boolean): IntegrationMode => (on ? "live" : "demo");
  return {
    payments: mode(Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY && env.STRIPE_WEBHOOK_SECRET)),
    email: mode(Boolean(env.POSTMARK_SERVER_TOKEN)),
    sms: mode(Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER)),
    fmcsa: mode(Boolean(env.FMCSA_WEBKEY)),
    botDefense: mode(Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY)),
  };
}

/** A summary that is safe to log or return from a health check: no secrets, no URLs with credentials. */
/**
 * The truthy and falsy spellings z.stringbool() accepts, for code that reads a flag without the
 * schema (next.config.ts): keep the two in step.
 */
export const FLAG_TRUE = /^(1|true|yes|on|y|enabled)$/i;

export function describeEnv(env: Env): {
  nodeEnv: Env["NODE_ENV"];
  demoMode: boolean;
  siteIndexable: boolean;
  databaseSsl: Env["DATABASE_SSL"];
  integrations: IntegrationModes;
} {
  return {
    nodeEnv: env.NODE_ENV,
    demoMode: env.DEMO_MODE,
    siteIndexable: env.SITE_INDEXABLE,
    databaseSsl: env.DATABASE_SSL,
    integrations: integrationModes(env),
  };
}
