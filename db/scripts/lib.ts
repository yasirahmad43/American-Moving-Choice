import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type pg from "pg";

export const migrationsDir = fileURLToPath(new URL("../migrations/", import.meta.url));
export const seedFile = fileURLToPath(new URL("../seed/out/demo-seed.sql", import.meta.url));

/**
 * Local default, matching build plan §10 (`pnpm db:reset` recreates amc_dev). The apps connect as
 * the non-superuser owner role amc_app; db:reset creates it with the local superuser amc.
 */
export const DEFAULT_DATABASE_URL = "postgres://amc_app:amc_app@localhost:5432/amc_dev";
export const DEFAULT_ADMIN_DATABASE_URL = "postgres://amc:amc@localhost:5432/postgres";

export interface Migration {
  name: string;
  sql: string;
  sha256: string;
}

export const sha256Hex = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * Every migration (NNN_name.sql) in filename order. Any other .sql file in the directory is an
 * error rather than being skipped silently.
 */
export function listMigrations(dir: string = migrationsDir): Migration[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
  const misnamed = files.filter((f) => !/^\d{3}_[^/]+\.sql$/.test(f));
  if (misnamed.length) throw new Error(`Migration files must be named NNN_name.sql: ${misnamed.join(", ")}`);
  return files.sort().map((name) => {
    const sql = readFileSync(join(dir, name), "utf8");
    return { name, sql, sha256: sha256Hex(sql) };
  });
}

/** Tracks applied migrations. Also created by the Supabase bundle so both stay in step. */
export const SCHEMA_MIGRATIONS_DDL = `create table if not exists schema_migrations (
  name text primary key,
  sha256 text not null,
  applied_at timestamptz not null default now()
)`;

/**
 * pg lets SSL parameters in the URL (sslmode=require …) override the config object, and treats
 * "require" as verify-full. Strip them whenever DATABASE_SSL decides, as the app pool does.
 */
export function stripSslParams(connectionString: string): string {
  const url = new URL(connectionString);
  for (const key of ["sslmode", "ssl", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) url.searchParams.delete(key);
  return url.toString();
}

/** PEM from DATABASE_SSL_CA; dashboards often store newlines as a literal "\n". */
export function sslCaFromEnv(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const ca = env.DATABASE_SSL_CA?.trim();
  return ca ? ca.replaceAll("\\n", "\n") : undefined;
}

/**
 * DATABASE_SSL=require encrypts without verifying the certificate; verify checks it against
 * DATABASE_SSL_CA (Supabase's CA, PEM) or Node's trust store.
 */
export function clientConfig(connectionString: string): pg.ClientConfig {
  const mode = process.env.DATABASE_SSL;
  if (mode === "require") return { connectionString: stripSslParams(connectionString), ssl: { rejectUnauthorized: false } };
  if (mode === "verify") {
    const ca = sslCaFromEnv();
    return { connectionString: stripSslParams(connectionString), ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true } };
  }
  return { connectionString };
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** True for a database on this machine. */
export function isLocalDatabase(connectionString: string): boolean {
  return LOCAL_HOSTS.has(new URL(connectionString).hostname);
}

/**
 * Guard for anything that drops data (db:reset, the database tests). The database must be on
 * this machine (unless ALLOW_REMOTE_DB_WRITES=1) and its name must end in one of `suffixes`,
 * so a dev, staging or production URL left in the environment is never wiped.
 */
export function assertDisposableDatabase(connectionString: string, suffixes: readonly string[], action: string): string {
  const name = databaseName(connectionString);
  if (!/^[a-z0-9_]+$/.test(name)) {
    throw new Error(`Refusing to ${action} "${name}": the name must use lowercase letters, digits and underscores only`);
  }
  if (!suffixes.some((suffix) => name.endsWith(suffix))) {
    throw new Error(`Refusing to ${action} "${name}": only database names ending in ${suffixes.join(", ")} are allowed`);
  }
  if (!isLocalDatabase(connectionString) && process.env.ALLOW_REMOTE_DB_WRITES !== "1") {
    throw new Error(`Refusing to ${action} "${name}" on a remote host; set ALLOW_REMOTE_DB_WRITES=1 if that is really intended`);
  }
  return name;
}

/**
 * The local non-superuser role that owns the schema and that the apps connect as, like amc_app
 * on Supabase. A superuser bypasses even forced row-level security, so running locally as one
 * would hide RLS mistakes (build plan §4).
 */
export const LOCAL_APP_ROLE = { user: "amc_app", password: "amc_app" } as const;

/** The database name in a connection URL, for messages and safety checks. */
export function databaseName(connectionString: string): string {
  return decodeURIComponent(new URL(connectionString).pathname.replace(/^\//, ""));
}

/** postgres://user:***@host:port/name, for logs. */
export function redactUrl(connectionString: string): string {
  const url = new URL(connectionString);
  if (url.password) url.password = "***";
  return url.toString();
}

/** Splits the generated seed file into its body, without the surrounding begin/commit. */
export function seedBody(seedSql: string): string {
  const lines = seedSql.split("\n");
  const begin = lines.findIndex((l) => l.trim() === "begin;");
  let commit = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]!.trim() === "commit;") {
      commit = i;
      break;
    }
  }
  if (begin < 0 || commit <= begin) throw new Error("Seed SQL must contain a 'begin;' line and a final 'commit;' line");
  return [...lines.slice(0, begin), ...lines.slice(begin + 1, commit), ...lines.slice(commit + 1)].join("\n");
}
