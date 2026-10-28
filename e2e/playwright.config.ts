/**
 * End-to-end scenarios across the public site and the company/admin app (build plan §13).
 *
 * The apps must already be running against a migrated and seeded database:
 *   E2E_WEB_URL   public site (default http://localhost:3000)
 *   E2E_APP_URL   company portal and admin (default http://localhost:3001)
 *   DATABASE_URL  the same database, so scenarios can reset what they change (optional; only a
 *                 local database named *_e2e or *_test, or any local one with E2E_ALLOW_DB_WRITES=1;
 *                 leave it unset for a post-deploy smoke test)
 *   APP_ENCRYPTION_KEY  the running app's key, to read reset links from the demo mailbox (optional)
 *   CRON_SECRET   the running app's secret, to check the detailed health response (optional)
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, SEED_MOVER_EMAIL / SEED_MOVER_PASSWORD  the seed's logins
 *                 (required for the sign-in scenarios; there are no defaults)
 *   SEED_ADMIN_TOTP_SECRET  when the seed enrolled the admin's TOTP
 *
 * Run: pnpm e2e
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // Scenarios share one seeded database, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
