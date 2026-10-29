import { defineConfig, devices } from "@playwright/test";

/** Read-only public spacing checks against an already running site. */
export default defineConfig({
  testDir: "./layout", testMatch: "content-insets.spec.mjs", workers: 1, retries: 0, timeout: 120_000,
  use: { ...devices["Desktop Chrome"], reducedMotion: "reduce", launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] }, trace: "retain-on-failure", screenshot: "only-on-failure" },
});
