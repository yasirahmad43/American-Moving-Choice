import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every database test file recreates the same schema, so files must not run in parallel.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
