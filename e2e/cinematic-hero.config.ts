import { defineConfig, devices } from "@playwright/test";

/** Hero/starter checks use local browser state only; no quote request is sent. */
export default defineConfig({
  testDir: "./hero", workers: 1, retries: 0, timeout: 60_000,
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure", screenshot: "only-on-failure" },
});
