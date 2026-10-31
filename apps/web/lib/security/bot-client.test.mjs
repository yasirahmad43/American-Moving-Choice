import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock("botid/client/core", () => ({ initBotId: sdk.init }));

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubGlobal("__dirname", fileURLToPath(new URL("../../", import.meta.url)));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("narrow browser bot protection and its single build flag", () => {
  it("does not install a fetch/challenge interceptor while the public build flag is off", async () => {
    for (const flag of ["", "false", "0"]) {
      vi.resetModules(); vi.stubEnv("NEXT_PUBLIC_BOT_PROTECTION_ENABLED", flag);
      await import("../../instrumentation-client.ts");
    }
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it("protects only the quote and concern POST routes, excluding SDK and private traffic", async () => {
    vi.stubEnv("NEXT_PUBLIC_BOT_PROTECTION_ENABLED", "true");
    await import("../../instrumentation-client.ts");
    expect(sdk.init).toHaveBeenCalledTimes(1);
    const { protect } = sdk.init.mock.calls[0][0];
    expect(protect).toEqual(["/get-quotes", "/get-quotes/", "/report-a-concern", "/report-a-concern/"].map(path => ({ path, method: "POST", advancedOptions: { checkLevel: "basic" } })));
    const matches = (path, method) => protect.some(route => route.path === path && route.method === method);
    for (const path of ["/get-quotes", "/get-quotes/", "/report-a-concern", "/report-a-concern/"]) {
      expect(matches(path, "POST"), path).toBe(true);
      expect(matches(path, "GET"), path).toBe(false);
    }
    for (const path of ["/", "/movers/texas/austin/", "/planning/packing/", "/admin/leads/", "/portal/", "/api/health", "/my-request/private-token/", "/get-quotes/confirmation/", "/.well-known/vercel/security/request-challenge", "/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/a-4-a/c.js", "/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js"]) expect(matches(path, "POST"), path).toBe(false);
  });

  it("derives the browser build flag only from BOT_PROTECTION_ENABLED without relaxing framing headers", async () => {
    // A separately supplied public variable cannot silently keep interception enabled.
    vi.stubEnv("NEXT_PUBLIC_BOT_PROTECTION_ENABLED", "true");
    for (const [source, expected] of [["false", "false"], ["", "false"], ["true", "true"], ["YES", "true"]]) {
      vi.resetModules(); vi.stubEnv("BOT_PROTECTION_ENABLED", source);
      const { default: config } = await import("../../next.config.ts");
      expect(config.env.NEXT_PUBLIC_BOT_PROTECTION_ENABLED).toBe(expected);
      const rules = await config.headers();
      expect(rules.find(rule => rule.source === "/:path*").headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
    }
  });
});
