/**
 * Drops and recreates a local database, applies every migration, then loads
 * db/seed/out/demo-seed.sql if it exists (build it with pnpm db:seed:build).
 *
 * Usage: pnpm db:reset   (recreates amc_dev)
 *        DATABASE_URL=postgres://amc_app:amc_app@localhost:5432/amc_e2e pnpm db:reset
 *
 * The database is owned by a non-superuser role, and migrations and the seed run as that role,
 * exactly as on Supabase (amc_app owns schema amc): a superuser bypasses even forced row-level
 * security, so local runs as one would hide RLS mistakes. The owner role is DATABASE_URL's user
 * (default amc_app / amc_app). Creating the role and the database needs a superuser connection,
 * DATABASE_ADMIN_URL (default postgres://amc:amc@localhost:5432/postgres). For compatibility, a
 * DATABASE_URL whose user is a superuser is used as the admin connection and amc_app as the owner.
 *
 * Only throwaway local databases can be reset: the name must end in _dev, _test or _e2e.
 */
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import pg from "pg";
import {
  DEFAULT_ADMIN_DATABASE_URL,
  DEFAULT_DATABASE_URL,
  LOCAL_APP_ROLE,
  assertDisposableDatabase,
  clientConfig,
  redactUrl,
  seedFile,
} from "./lib";
import { migrate } from "./migrate";

export const RESETTABLE_SUFFIXES = ["_dev", "_test", "_e2e"] as const;

export function assertResettable(databaseUrl: string): string {
  return assertDisposableDatabase(databaseUrl, RESETTABLE_SUFFIXES, "reset");
}

const ROLE_NAME = /^[a-z_][a-z0-9_]*$/;
const quoteLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

async function isSuperuser(client: pg.Client, role: string): Promise<boolean | null> {
  const found = await client.query<{ rolsuper: boolean }>("select rolsuper from pg_roles where rolname = $1", [role]);
  return found.rows[0]?.rolsuper ?? null;
}

/** The admin (superuser) and app (owner) connection URLs for a reset. */
export async function resetTargets(databaseUrl: string, adminUrl: string = process.env.DATABASE_ADMIN_URL ?? DEFAULT_ADMIN_DATABASE_URL): Promise<{
  adminUrl: string;
  appUrl: string;
}> {
  const app = new URL(databaseUrl);
  const admin = new URL(adminUrl);
  admin.pathname = "/postgres";
  // A superuser DATABASE_URL (the old local default) becomes the admin connection.
  const probe = new pg.Client(clientConfig(admin.toString()));
  await probe.connect();
  try {
    const appUser = decodeURIComponent(app.username);
    if (appUser && (await isSuperuser(probe, appUser))) {
      const asAdmin = new URL(databaseUrl);
      asAdmin.pathname = "/postgres";
      app.username = LOCAL_APP_ROLE.user;
      app.password = LOCAL_APP_ROLE.password;
      return { adminUrl: asAdmin.toString(), appUrl: app.toString() };
    }
  } finally {
    await probe.end();
  }
  return { adminUrl: admin.toString(), appUrl: app.toString() };
}

export async function resetDatabase(
  databaseUrl: string,
  log: (line: string) => void = console.log,
  options: { adminUrl?: string } = {},
): Promise<{ migrations: string[]; seeded: boolean; appUrl: string }> {
  const name = assertResettable(databaseUrl);
  const { adminUrl, appUrl } = await resetTargets(databaseUrl, options.adminUrl);
  const owner = new URL(appUrl);
  const role = decodeURIComponent(owner.username);
  const password = decodeURIComponent(owner.password);
  if (!ROLE_NAME.test(role)) throw new Error(`Refusing to use "${role}" as the owner role: use lowercase letters, digits and underscores`);

  const admin = new pg.Client(clientConfig(adminUrl));
  await admin.connect();
  try {
    if ((await isSuperuser(admin, decodeURIComponent(new URL(adminUrl).username))) !== true) {
      throw new Error("DATABASE_ADMIN_URL must connect as a superuser (it creates the owner role and the database)");
    }
    const existing = await isSuperuser(admin, role);
    if (existing === true) throw new Error(`The owner role "${role}" is a superuser; the app must connect as a non-superuser`);
    // The names passed the pattern checks above, so quoting them as identifiers is safe.
    const attributes = `login nosuperuser nocreatedb nocreaterole noinherit password ${quoteLiteral(password)}`;
    await admin.query(existing === null ? `create role "${role}" ${attributes}` : `alter role "${role}" ${attributes}`);
    await admin.query(`drop database if exists "${name}" with (force)`);
    await admin.query(`create database "${name}" owner "${role}"`);
  } finally {
    await admin.end();
  }
  log(`recreated ${name}, owned by ${role}`);

  const migrations = await migrate(appUrl, log);

  if (!existsSync(seedFile)) {
    log(`no seed at ${seedFile}; run pnpm db:seed:build to create one`);
    return { migrations, seeded: false, appUrl };
  }
  const client = new pg.Client(clientConfig(appUrl));
  await client.connect();
  try {
    await client.query(readFileSync(seedFile, "utf8")); // the file runs in one transaction
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw new Error(`seed failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await client.end();
  }
  log(`loaded ${seedFile}`);
  return { migrations, seeded: true, appUrl };
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  console.log(`Resetting ${redactUrl(url)}`);
  const { migrations, seeded, appUrl } = await resetDatabase(url);
  console.log(`Done: ${migrations.length} migration(s) applied, ${seeded ? "demo seed loaded" : "no seed loaded"}`);
  console.log(`Connect the apps as ${redactUrl(appUrl)} (non-superuser owner, so row-level security applies)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
