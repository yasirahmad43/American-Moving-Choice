import { defineConfig } from "vitest/config";

// These integration contracts are pure/mocked and intentionally need no database or live provider.
export default defineConfig({ test: { include: ["src/reporting/*.test.ts"], testTimeout: 10_000 } });
