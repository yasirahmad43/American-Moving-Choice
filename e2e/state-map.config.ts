import { defineConfig, devices } from "@playwright/test";

export default defineConfig({ testDir: "./map", workers: 1, retries: 0, timeout: 60_000,
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure", screenshot: "only-on-failure" } });
