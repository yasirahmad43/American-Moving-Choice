/**
 * Test database for @amc/server: DATABASE_URL's database name plus "_server" (for example
 * amc_test → amc_test_server), so these tests never touch the database db/test resets.
 *
 * DATABASE_URL is a superuser connection used only to create the test database. The tests
 * themselves connect as the non-superuser owner role amc_app, as the apps do locally and on
 * Supabase, so forced row-level security applies to them.
 */
import { LOCAL_APP_ROLE, assertDisposableDatabase } from "@amc/db/scripts/lib";
import pg from "pg";

const DEFAULT_BASE = "postgres://amc:amc@localhost:5432/amc_test";

export function baseDatabaseUrl(): string {
  return process.env.AMC_TEST_BASE_DATABASE_URL ?? process.env.DATABASE_URL ?? DEFAULT_BASE;
}

/** The dedicated test database, as the owner role the tests connect with. */
export function serverTestDatabaseUrl(base: string = baseDatabaseUrl()): string {
  const name = assertDisposableDatabase(base, ["_test", "_e2e"], "derive a server test database from");
  const url = new URL(base);
  url.pathname = `/${name}_server`;
  url.username = LOCAL_APP_ROLE.user;
  url.password = LOCAL_APP_ROLE.password;
  return url.toString();
}

export function databaseNameOf(url: string): string {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
}

/**
 * Creates the owner role and the test database if needed, using the superuser base connection,
 * and hands the database and its public schema to the owner role.
 */
export async function ensureDatabase(base: string = baseDatabaseUrl()): Promise<void> {
  const target = serverTestDatabaseUrl(base);
  const name = databaseNameOf(target);
  const { user, password } = LOCAL_APP_ROLE;
  const maintenance = new URL(base);
  maintenance.pathname = "/postgres";
  const client = new pg.Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    const role = await client.query<{ rolsuper: boolean }>("select rolsuper from pg_roles where rolname = $1", [user]);
    if (role.rows[0]?.rolsuper) throw new Error(`${user} must not be a superuser`);
    const attributes = `login nosuperuser nocreatedb nocreaterole noinherit password '${password}'`;
    await client.query(role.rowCount ? `alter role ${user} ${attributes}` : `create role ${user} ${attributes}`);
    const exists = await client.query("select 1 from pg_database where datname = $1", [name]);
    // The name passed the pattern check in serverTestDatabaseUrl, so quoting it is safe.
    if (!exists.rowCount) await client.query(`create database "${name}" owner ${user}`);
    else await client.query(`alter database "${name}" owner to ${user}`);
  } finally {
    await client.end();
  }
  const asSuperuser = new URL(base);
  asSuperuser.pathname = `/${name}`;
  const db = new pg.Client({ connectionString: asSuperuser.toString() });
  await db.connect();
  try {
    await db.query(`alter schema public owner to ${user}`);
  } finally {
    await db.end();
  }
}
