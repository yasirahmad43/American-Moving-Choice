/**
 * Runs before `next build` on the amc-app Vercel project (production only): applies pending
 * migrations to DATABASE_URL, then loads the demo seed once, built in memory from the SEED_*
 * environment variables (deploy runbook §1). Neither the seed SQL nor any password is written to
 * the repository or the build log.
 *
 * It does nothing unless VERCEL_ENV is "production" and DATABASE_URL is set, so preview builds
 * and local builds never touch a database. The seed loads only while amc.admin_users is empty.
 */
import { pathToFileURL } from "node:url";
import pg from "pg";
import { KNOWN_PASSWORDS, buildSeedSql, seedOptionsFromEnv } from "../seed/build";
import { clientConfig, redactUrl } from "./lib";
import { migrate } from "./migrate";
import { bootstrapSeo } from "../../packages/server/src/seo/bootstrap";
import { bootstrapRoutes } from "../../packages/server/src/seo/route-bootstrap";
import { bootstrapEditorialBatch } from "../../packages/server/src/seo/editorial-bootstrap";
import { bootstrapClaudePilot } from "../../packages/server/src/seo/claude-pilot-release";
import { verifyMediaStorage } from "../../packages/server/src/media/storage-probe";

async function main(): Promise<void> {
  let url = process.env.DATABASE_URL;
  const host = process.env.DATABASE_HOST?.trim();
  const port = process.env.DATABASE_PORT?.trim();
  const user = process.env.DATABASE_USER?.trim();
  if (url && (host || port || user)) {
    // Same overrides as @amc/server's databaseUrl(): they change without re-entering the secret URL.
    const parsed = new URL(url);
    if (host) parsed.hostname = host;
    if (port) parsed.port = port;
    if (user) parsed.username = user;
    url = parsed.toString();
  }
  if (process.env.VERCEL_ENV !== "production" || !url) {
    console.log("vercel-deploy: not a production build with DATABASE_URL; skipping migrations and seed");
    return;
  }
  // Observe a fresh app-role backend before migration, without changing any settings or data.
  // Transaction-pooler backends can differ: read-only observations are evidence, not a veto.
  const preflight = new pg.Client(clientConfig(url));
  try {
    await preflight.connect();
    const result = await preflight.query<{
      transaction_read_only: "on" | "off";
      default_transaction_read_only: "on" | "off";
      database_bytes: string;
      legacy_shingles_bytes: string;
      compact_shingles_bytes: string;
    }>(`select current_setting('transaction_read_only') as transaction_read_only,
               current_setting('default_transaction_read_only') as default_transaction_read_only,
               pg_database_size(current_database())::text as database_bytes,
               coalesce(pg_total_relation_size(to_regclass('seo_shingles')), 0)::text as legacy_shingles_bytes,
               coalesce(pg_total_relation_size(to_regclass('seo_page_shingles')), 0)::text as compact_shingles_bytes`);
    const state = result.rows[0];
    if (!state) throw new Error("Database preflight returned no metadata");
    console.log(`vercel-deploy: preflight transaction_read_only=${state.transaction_read_only} default_transaction_read_only=${state.default_transaction_read_only} database_bytes=${state.database_bytes} legacy_shingles_bytes=${state.legacy_shingles_bytes} compact_shingles_bytes=${state.compact_shingles_bytes}`);
  } finally {
    await preflight.end();
  }
  console.log(`vercel-deploy: migrating ${redactUrl(url)}`);
  const applied = await migrate(url);
  console.log(applied.length ? `vercel-deploy: ${applied.length} migration(s) applied` : "vercel-deploy: migrations up to date");

  const client = new pg.Client(clientConfig(url));
  await client.connect();
  try {
    const admins = await client.query<{ n: number }>("select count(*)::int as n from admin_users");
    if (admins.rows[0]!.n > 0) {
      console.log("vercel-deploy: seed already loaded");
    } else if (!process.env.SEED_ADMIN_EMAIL) {
      console.log("vercel-deploy: no SEED_* variables; leaving the database unseeded");
    } else {
      const options = seedOptionsFromEnv();
      const problems: string[] = [];
      if (!options.adminTotpSecret || !options.encryptionKey) problems.push("SEED_ADMIN_TOTP_SECRET and APP_ENCRYPTION_KEY are required");
      if (!options.hmacSecret) problems.push("HMAC_SECRET is required");
      if (!options.webUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(options.webUrl)) problems.push("WEB_URL must be the public site");
      if (KNOWN_PASSWORDS.includes(options.adminPassword) || KNOWN_PASSWORDS.includes(options.moverPassword)) {
        problems.push("a SEED_* password is one written in the repository");
      }
      if (problems.length) throw new Error(`refusing to seed: ${problems.join("; ")}`);
      const out = await buildSeedSql(options);
      await client.query(out.sql); // the seed runs in one transaction
      console.log("vercel-deploy: demo seed loaded");
    }
    const seoStarted = Date.now();
    await bootstrapSeo(client, { maxRunMs: 25 * 60_000 });
    await bootstrapRoutes(client, { maxRunMs: Math.max(1, 25 * 60_000 - (Date.now() - seoStarted)) });
    await bootstrapEditorialBatch(client, { maxRunMs: Math.max(1, Math.min(5 * 60_000, 25 * 60_000 - (Date.now() - seoStarted))) });
    await bootstrapClaudePilot(client, { maxRunMs: Math.max(1, Math.min(5 * 60_000, 25 * 60_000 - (Date.now() - seoStarted))) });
    await verifyMediaStorage();
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(`vercel-deploy: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
