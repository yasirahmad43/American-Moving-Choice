/**
 * Applies pending migrations from db/migrations to DATABASE_URL in filename order, each in its own
 * transaction, and records them in schema_migrations (name, sha256, applied_at).
 *
 * Usage: DATABASE_URL=postgres://… pnpm db:migrate   (defaults to the local amc_dev database)
 *
 * Against Supabase, connect as amc_app (whose search_path starts with amc) through the session
 * pooler or a direct connection; the Supabase bundle records its migrations in the same table.
 */
import { pathToFileURL } from "node:url";
import pg from "pg";
import { DEFAULT_DATABASE_URL, SCHEMA_MIGRATIONS_DDL, clientConfig, listMigrations, redactUrl } from "./lib";

/** Returns the names of the migrations it applied. */
export async function migrate(databaseUrl: string, log: (line: string) => void = console.log): Promise<string[]> {
  const client = new pg.Client(clientConfig(databaseUrl));
  await client.connect();
  const applied: string[] = [];
  try {
    await client.query(SCHEMA_MIGRATIONS_DDL);
    for (const m of listMigrations()) {
      await client.query("begin");
      try {
        // Transaction-scoped lock, so concurrent migrators queue here (and it works through poolers).
        await client.query("select pg_advisory_xact_lock(hashtext('amc:migrate'))");
        const done = await client.query<{ sha256: string }>("select sha256 from schema_migrations where name = $1", [m.name]);
        const previous = done.rows[0];
        if (previous) {
          await client.query("commit");
          if (previous.sha256 !== m.sha256) log(`warning: ${m.name} changed after it was applied; recreate local databases with pnpm db:reset`);
          continue;
        }
        await client.query(m.sql);
        await client.query("insert into schema_migrations (name, sha256) values ($1, $2)", [m.name, m.sha256]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw new Error(`${m.name} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      log(`applied ${m.name}`);
      applied.push(m.name);
    }
    return applied;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  console.log(`Migrating ${redactUrl(url)}`);
  const applied = await migrate(url);
  console.log(applied.length ? `${applied.length} migration(s) applied` : "Already up to date");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
