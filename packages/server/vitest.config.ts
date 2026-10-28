import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The database test files share one database (DATABASE_URL's name + "_server"), so they run
    // one after another. The database itself is separate from the one db/test uses, so
    // `pnpm -r test` can run both packages at the same time.
    fileParallelism: false,
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
