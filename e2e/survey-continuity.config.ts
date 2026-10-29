import { defineConfig, devices } from "@playwright/test";

/** No real requests are sent. Coverage/review tests require an isolated local server. */
export default defineConfig({
  testDir: "./survey", workers: 1, retries: 0, timeout: 90_000,
  use: { ...devices["Desktop Chrome"], launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars", "--disable-back-forward-cache"] }, trace: "retain-on-failure", screenshot: "only-on-failure" },
});
