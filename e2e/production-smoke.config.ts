import { defineConfig, devices } from "@playwright/test";

/** Post-release demo checks: no database credentials, account resets, or private logins. */
export default defineConfig({
  testDir: "./smoke", testMatch: "production.spec.ts", fullyParallel: false, workers: 1, retries: 0, timeout: 90_000,
  reporter: [["list"]],
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
