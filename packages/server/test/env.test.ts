import { afterEach, describe, expect, it } from "vitest";
import { connectionStringFor, poolConfig } from "../src/db/pool";
import { hmacSecret, resetEnvCache } from "../src/env/env";
import { EnvError, FLAG_TRUE, decodeKey, describeEnv, integrationModes, parseEnv } from "../src/env/schema";
import { cookieSecure } from "../src/session-cookie";

describe("environment", () => {
  it("applies demo defaults when optional keys are absent", () => {
    const env = parseEnv({});
    expect(env).toMatchObject({
      NODE_ENV: "development",
      DATABASE_SSL: "disable",
      DATABASE_POOL_MAX: 3,
      WEB_URL: "http://localhost:3000",
      APP_URL: "http://localhost:3001",
      DEMO_MODE: true,
      SITE_INDEXABLE: false,
    });
    expect(integrationModes(env)).toEqual({ payments: "demo", email: "demo", sms: "demo", fmcsa: "demo", botDefense: "demo" });
  });

  it("parses booleans and treats blank values as unset", () => {
    const env = parseEnv({ DEMO_MODE: "false", SITE_INDEXABLE: "1", POSTMARK_SERVER_TOKEN: "  ", APP_URL: "https://app.example.com/" });
    expect(env.DEMO_MODE).toBe(false);
    expect(env.SITE_INDEXABLE).toBe(true);
    expect(env.POSTMARK_SERVER_TOKEN).toBeUndefined();
    expect(env.APP_URL).toBe("https://app.example.com");
    expect(integrationModes(parseEnv({ POSTMARK_SERVER_TOKEN: "pm", FMCSA_WEBKEY: "key" }))).toMatchObject({ email: "live", fmcsa: "live" });
  });

  it("reports invalid variables by name without echoing their values", () => {
    const secret = "postgres-but-not://user:hunter2@db";
    let error: unknown;
    try {
      parseEnv({ DATABASE_URL: secret, DATABASE_SSL: "sometimes", SESSION_SECRET: "too-short-secret-value" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(EnvError);
    const message = (error as EnvError).message;
    expect(message).toContain("DATABASE_URL");
    expect(message).toContain("DATABASE_SSL");
    expect(message).toContain("SESSION_SECRET");
    expect(message).not.toContain("hunter2");
    expect(message).not.toContain("too-short-secret-value");
  });

  it("decodes 32-byte keys from hex or base64", () => {
    expect(decodeKey("ab".repeat(32))?.length).toBe(32);
    expect(decodeKey(Buffer.alloc(32, 7).toString("base64"))?.length).toBe(32);
    expect(decodeKey(Buffer.alloc(32, 7).toString("base64url"))?.length).toBe(32);
    expect(decodeKey("ab".repeat(16))).toBeNull();
    expect(() => parseEnv({ APP_ENCRYPTION_KEY: "short" })).toThrow(EnvError);
  });

  it("summarizes the environment without secrets", () => {
    const summary = describeEnv(parseEnv({ DATABASE_URL: "postgres://u:secret-pass@h/db", SESSION_SECRET: "x".repeat(40), POSTMARK_SERVER_TOKEN: "pm-secret" }));
    expect(JSON.stringify(summary)).not.toMatch(/secret|pm-secret|postgres/);
  });

  it("keeps the Claude pilot disabled by default and caps its private budget", () => {
    expect(parseEnv({})).toMatchObject({ AI_CONTENT_ENABLED: false, AI_CONTENT_BUDGET_USD: 0 });
    const configured = parseEnv({ ANTHROPIC_API_KEY: "private-provider-credential", ANTHROPIC_WORKSPACE_ID: "private-workspace", AI_CONTENT_BUDGET_USD: "50" });
    expect(configured.AI_CONTENT_BUDGET_USD).toBe(50);
    expect(JSON.stringify(describeEnv(configured))).not.toMatch(/private-provider|private-workspace|ANTHROPIC/);
    for (const budget of ["51", "-1", "Infinity", "not-money"]) expect(() => parseEnv({ AI_CONTENT_BUDGET_USD: budget })).toThrow(EnvError);
  });

  it("strips SSL parameters from connection strings when DATABASE_SSL decides", () => {
    const url = "postgres://u:p@host:6543/postgres?sslmode=require&application_name=x";
    expect(connectionStringFor(url, "require")).toBe("postgres://u:p@host:6543/postgres?application_name=x");
    expect(connectionStringFor(url, "disable")).toBe(url);
  });

  it("marks the session cookie Secure in production except on an http://localhost APP_URL", () => {
    expect(cookieSecure({ NODE_ENV: "development" })).toBe(false);
    expect(cookieSecure({ NODE_ENV: "production" })).toBe(true);
    expect(cookieSecure({ NODE_ENV: "production", APP_URL: "https://app.example.com" })).toBe(true);
    expect(cookieSecure({ NODE_ENV: "production", APP_URL: "http://localhost:3001" })).toBe(false);
    expect(cookieSecure({ NODE_ENV: "production", APP_URL: "http://app.example.com" })).toBe(true);
  });

  it("reads SITE_INDEXABLE the same way as next.config's FLAG_TRUE pattern", () => {
    for (const value of ["1", "true", "YES", "on", "y", "Enabled"]) {
      expect(parseEnv({ SITE_INDEXABLE: value }).SITE_INDEXABLE, value).toBe(true);
      expect(FLAG_TRUE.test(value), value).toBe(true);
    }
    for (const value of ["0", "false", "no", "off", "n", "disabled"]) {
      expect(parseEnv({ SITE_INDEXABLE: value }).SITE_INDEXABLE, value).toBe(false);
      expect(FLAG_TRUE.test(value), value).toBe(false);
    }
  });
});

describe("production requirements", () => {
  const saved = { ...process.env };
  afterEach(() => {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
    resetEnvCache();
  });
  const production = (vars: Record<string, string>) => {
    Object.assign(process.env, { NODE_ENV: "production", ...vars });
    resetEnvCache();
  };

  it("requires HMAC_SECRET (both apps) in production", () => {
    delete process.env.HMAC_SECRET;
    production({});
    expect(() => hmacSecret()).toThrow(/HMAC_SECRET: is required in production/);
    production({ HMAC_SECRET: "h".repeat(40) });
    expect(hmacSecret()).toBe("h".repeat(40));
  });

  it("refuses a plaintext connection to a remote database in production, and verifies with DATABASE_SSL_CA", () => {
    production({ DATABASE_URL: "postgres://u:p@db.example.com:6543/postgres", DATABASE_SSL: "disable" });
    expect(() => poolConfig()).toThrow(/DATABASE_SSL/);
    production({ DATABASE_URL: "postgres://u:p@localhost:5432/amc_dev", DATABASE_SSL: "disable" });
    expect(poolConfig().ssl).toBeUndefined();
    const ca = "-----BEGIN CERTIFICATE-----\\nMIIB\\n-----END CERTIFICATE-----";
    production({ DATABASE_URL: "postgres://u:p@db.example.com:6543/postgres?sslmode=require", DATABASE_SSL: "verify", DATABASE_SSL_CA: ca });
    const config = poolConfig();
    expect(config.ssl).toEqual({ ca: "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----", rejectUnauthorized: true });
    expect(config.connectionString).not.toContain("sslmode");
  });
});
