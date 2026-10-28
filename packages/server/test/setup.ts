/**
 * Runs in every test worker before the test file: point the server modules at the dedicated
 * test database and clear integration keys so every adapter runs in demo mode unless a test
 * opts in.
 */
import { baseDatabaseUrl, serverTestDatabaseUrl } from "./database";

const base = baseDatabaseUrl();
process.env.AMC_TEST_BASE_DATABASE_URL = base;
process.env.DATABASE_URL = serverTestDatabaseUrl(base);
process.env.DATABASE_SSL = "disable";
Object.assign(process.env, { NODE_ENV: "test" });
for (const key of [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_MEDIA_BUCKET",
  "POSTMARK_SERVER_TOKEN",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
  "FMCSA_WEBKEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
]) {
  delete process.env[key];
}
