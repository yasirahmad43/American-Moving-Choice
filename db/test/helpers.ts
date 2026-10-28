import type pg from "pg";
import { assertDisposableDatabase, listMigrations } from "../scripts/lib";

/**
 * The tests drop and recreate the public schema here, so it must be a throwaway local database:
 * the name must end in _test or _e2e (checked before anything runs).
 */
export const databaseUrl = process.env.DATABASE_URL ?? "postgres://amc:amc@localhost:5432/amc_test";
assertDisposableDatabase(databaseUrl, ["_test", "_e2e"], "run the database tests against");

const migrations = listMigrations();

/** Recreates the public schema and applies every migration in db/migrations in filename order. */
export async function resetDatabase(pool: pg.Pool): Promise<void> {
  await pool.query("drop schema public cascade; create schema public;");
  for (const m of migrations) await pool.query(m.sql);
}

/** Applies every migration on one client (for example after `set local role`). */
export async function applyMigrations(client: pg.PoolClient | pg.Pool): Promise<void> {
  for (const m of migrations) await client.query(m.sql);
}
