import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rate: vi.fn(), concern: vi.fn(), lookup: vi.fn(), meta: vi.fn(), submit: vi.fn(), coverage: vi.fn(), cookie: vi.fn(), security: vi.fn(),
}));
vi.mock("@amc/server/public-forms", () => ({ publicFormRateLimit: mocks.rate, publicRequestMeta: mocks.meta }));
vi.mock("@amc/server/geo", () => ({ lookupZip: mocks.lookup }));
vi.mock("@amc/server/concerns", async () => ({
  ...await import("../../../packages/server/src/concerns/schema.ts"),
  concernRateLimit: mocks.rate, createConcernCase: mocks.concern,
}));
vi.mock("@amc/server/leads", () => ({ submitRequest: mocks.submit, surveyCoverage: mocks.coverage }));
vi.mock("@amc/server/env", () => ({ env: () => ({ WEB_URL: "https://www.americanmovingchoice.com" }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.cookie }) }));
vi.mock("@/lib/security/bot-check", () => ({ publicSubmissionAllowed: mocks.security, SECURITY_CHECK_MESSAGE: "Security verification is temporarily unavailable. Please try again." }));
vi.mock("@/components/survey/cookie", () => ({ CONFIRMATION_COOKIE: "request", CONFIRMATION_COOKIE_MAX_AGE: 1800, CONFIRMATION_PATH: "/get-quotes/confirmation/", confirmationCookieSecure: () => true }));

import { lookupZipAction } from "../app/(site)/get-quotes/zip-action.ts";
import { submitConcern } from "../app/(site)/report-a-concern/actions.ts";
import { checkCoverageAction, submitRequestAction } from "../app/(site)/get-quotes/actions.ts";

function concern(values = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ caseType: "privacy", company: "", description: "Please help me check how my request details were used.", name: "", email: "", phone: "", leave_this_blank: "", ...values })) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.meta.mockResolvedValue({ ip: null, userAgent: "Test browser" });
  mocks.rate.mockResolvedValue({ allowed: true });
  mocks.security.mockResolvedValue(true);
  mocks.submit.mockResolvedValue({ ok: true, manageToken: "private-manage-token", confirmation: { movers: [] } });
  mocks.concern.mockResolvedValue({ reference: "CASE-TEST-1234" });
  mocks.lookup.mockReturnValue({ city: "Dallas", state: "TX", privateField: "never returned" });
});

describe("anonymous public form boundaries", () => {
  it("rate limits postal helpers, validates input server-side and returns only a place label", async () => {
    expect(await lookupZipAction("75201")).toEqual({ city: "Dallas", state: "TX" });
    expect(mocks.rate).toHaveBeenCalledWith("survey:zip:ip", null, 120, 600);
    expect(await lookupZipAction("75201?email=private@example.com")).toBeNull();
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
    mocks.rate.mockResolvedValue({ allowed: false });
    expect(await lookupZipAction("75201")).toBeNull();
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
  });
  it("keeps an optional postal helper outage from interrupting a survey", async () => {
    mocks.rate.mockRejectedValue(new Error("private SQL parameter payload"));
    expect(await lookupZipAction("75201")).toBeNull();
  });
  it("accepts a genuine anonymous concern without asking for contact information", async () => {
    expect(await submitConcern({ status: "idle" }, concern())).toEqual({ status: "sent", reference: "CASE-TEST-1234" });
    expect(mocks.concern).toHaveBeenCalledWith(expect.objectContaining({ name: null, email: null, phone: null }), { ip: null });
  });
  it("counts invalid concern attempts and never reflects an oversized submitted value", async () => {
    const result = await submitConcern({ status: "idle" }, concern({ description: "x".repeat(100000), email: "y".repeat(10000) }));
    expect(mocks.rate).toHaveBeenCalledWith(null);
    expect(result.status).toBe("invalid");
    expect(result.values.description).toHaveLength(4000); expect(result.values.email).toHaveLength(254);
    expect(mocks.concern).not.toHaveBeenCalled();
  });
  it("rejects non-text form fields and checks every honeypot value without creating a case", async () => {
    const uploaded = concern(); uploaded.set("name", new Blob(["unexpected upload"], { type: "text/plain" }), "private.txt");
    const result = await submitConcern({ status: "idle" }, uploaded);
    expect(result.status).toBe("invalid"); expect(result.fieldErrors.name).toContain("file uploads");
    const duplicateTrap = concern(); duplicateTrap.append("leave_this_blank", "https://spam.invalid/");
    expect(await submitConcern({ status: "idle" }, duplicateTrap)).toEqual({ status: "sent", reference: null });
    expect(mocks.concern).not.toHaveBeenCalled();
  });
  it("does not create a report after its connection limit has been reached", async () => {
    mocks.rate.mockResolvedValue({ allowed: false });
    expect((await submitConcern({ status: "idle" }, concern())).status).toBe("failed");
    expect(mocks.concern).not.toHaveBeenCalled();
  });
  it("does not expose quote database errors containing contact details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      mocks.submit.mockRejectedValue(new Error("failing row: private@example.com 2145550199"));
      const result = await submitRequestAction({ email: "private@example.com" });
      expect(result).toMatchObject({ ok: false, kind: "invalid" });
      expect(JSON.stringify([result, log.mock.calls])).not.toMatch(/private@|2145550199|failing row/u);
      expect(mocks.cookie).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });
  it("does not save a quote or issue a confirmation cookie when the server security check refuses it", async () => {
    mocks.security.mockResolvedValue(false);
    expect(await submitRequestAction({ email: "private@example.com" })).toMatchObject({ ok: false, kind: "invalid", errors: { form: expect.stringContaining("Security verification") } });
    expect(mocks.submit).not.toHaveBeenCalled(); expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("does not prepare coverage or issue any ticket/cookie when the security check refuses it", async () => {
    mocks.security.mockResolvedValue(false);
    const result = await checkCoverageAction({ originZip: "75201", destZip: "77002" });
    expect(result).toMatchObject({ ok: false, kind: "invalid", errors: { form: expect.stringContaining("Security verification") } });
    expect(result).not.toHaveProperty("ticket");
    expect(mocks.coverage).not.toHaveBeenCalled(); expect(mocks.submit).not.toHaveBeenCalled(); expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("does not create a concern case when the server security check refuses it", async () => {
    mocks.security.mockResolvedValue(false);
    expect(await submitConcern({ status: "idle" }, concern())).toMatchObject({ status: "failed", message: expect.stringContaining("Security verification") });
    expect(mocks.concern).not.toHaveBeenCalled(); expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("preserves normal quote acceptance and a private confirmation cookie when security allows it", async () => {
    expect(await submitRequestAction({ email: "private@example.com" })).toMatchObject({ ok: true, confirmation: { movers: [] } });
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.cookie).toHaveBeenCalledWith("request", "private-manage-token", expect.objectContaining({ httpOnly: true, secure: true, sameSite: "strict" }));
  });
});
