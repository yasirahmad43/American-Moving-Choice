import { defineConfig, devices } from "@playwright/test";

/** Read-only UI regression against a populated SEO catalogue; no account or DB credentials. */
export default defineConfig({
  testDir: "./table", workers: 1, retries: 0, timeout: 60_000,
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure", screenshot: "only-on-failure" },
});
