import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ check: vi.fn(), enabled: false }));
vi.mock("server-only", () => ({}));
vi.mock("botid/server", () => ({ checkBotId: mocks.check }));
vi.mock("@amc/server/env", () => ({ env: () => ({ BOT_PROTECTION_ENABLED: mocks.enabled }) }));
import { publicSubmissionAllowed } from "./bot-check.ts";

beforeEach(() => {
  vi.clearAllMocks(); mocks.enabled = true;
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("VERCEL", "1");
});
afterEach(() => vi.unstubAllEnvs());

describe("invisible public submission checks", () => {
  it("requires a human challenge and explicitly selects free Basic analysis", async () => {
    mocks.check.mockResolvedValue({ isBot: false, isHuman: true, bypassed: false });
    expect(await publicSubmissionAllowed()).toBe(true);
    expect(mocks.check).toHaveBeenCalledWith({ advancedOptions: { checkLevel: "basic" } });
  });
  it("rejects automated, incomplete and read-only verified-bot results", async () => {
    for (const result of [{ isBot: true }, {}, { isBot: false, isHuman: false, isVerifiedBot: true }]) {
      mocks.check.mockResolvedValue(result);
      expect(await publicSubmissionAllowed()).toBe(false);
    }
  });
  it("honors an explicit platform bypass without inventing a client bypass", async () => {
    mocks.check.mockResolvedValue({ isBot: false, isHuman: false, bypassed: true });
    expect(await publicSubmissionAllowed()).toBe(true);
  });
  it("fails closed on an outage without logging provider payloads", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      mocks.check.mockRejectedValue(new Error("private challenge details"));
      expect(await publicSubmissionAllowed()).toBe(false);
      expect(JSON.stringify(log.mock.calls)).not.toContain("private challenge");
    } finally { log.mockRestore(); }
  });
  it("does not silently bypass an enabled production check off Vercel", async () => {
    vi.stubEnv("VERCEL", "");
    expect(await publicSubmissionAllowed()).toBe(false);
    expect(mocks.check).not.toHaveBeenCalled();
    vi.stubEnv("NODE_ENV", "development");
    expect(await publicSubmissionAllowed()).toBe(true);
  });
  it("leaves local tests and an explicit emergency disable usable", async () => {
    mocks.enabled = false;
    expect(await publicSubmissionAllowed()).toBe(true);
    expect(mocks.check).not.toHaveBeenCalled();
  });
});
