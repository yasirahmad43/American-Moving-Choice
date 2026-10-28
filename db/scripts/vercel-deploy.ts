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

async function main(): Promise<void> {
  let url = process.env.DATABASE_URL;
  const host = process.env.DATABASE_HOST?.trim();
  if (url && host) {
    // Same override as @amc/server's databaseUrl(): the host can change without re-entering the secret URL.
    const parsed = new URL(url);
    parsed.hostname = host;
    url = parsed.toString();
  }
  if (process.env.VERCEL_ENV !== "production" || !url) {
    console.log("vercel-deploy: not a production build with DATABASE_URL; skipping migrations and seed");
    return;
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
      return;
    }
    if (!process.env.SEED_ADMIN_EMAIL) {
      console.log("vercel-deploy: no SEED_* variables; leaving the database unseeded");
      return;
    }
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
