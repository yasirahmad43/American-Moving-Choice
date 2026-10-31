import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), limit: vi.fn(), snapshot: vi.fn(), providers: vi.fn() }));
vi.mock("@amc/server/auth", () => ({
  getCurrentUser: mocks.user,
  hasAdminRole: (role, roles) => role === "super_admin" || roles.includes(role),
  checkRateLimit: mocks.limit,
  rateLimitKey: (scope, id) => `${scope}:${id}`,
}));
vi.mock("@amc/server/admin", () => ({ growthSnapshot: mocks.snapshot }));
vi.mock("@amc/server/reporting", () => ({ reportingSnapshot: mocks.providers }));

import { GET as requests } from "../../app/api/admin/growth/route.ts";
import { GET as providers } from "../../app/api/admin/growth/providers/route.ts";

const req = (suffix = "", headers) => new Request(`https://app.americanmovingchoice.com/api/admin/growth${suffix}`, { headers });
const user = (adminRole = "ops", mfa = "ok") => ({ id: "admin-id", adminRole, mfa });
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue(user()); mocks.limit.mockResolvedValue({ allowed: true }); mocks.snapshot.mockResolvedValue({ generatedAt: "2026-10-31T12:00:00Z", requests: {} }); mocks.providers.mockResolvedValue({ generatedAt: "2026-10-31T12:00:00Z", ga4: { status: "not_configured", data: null } }); });

describe.each([["requests", requests], ["providers", providers]])("%s reporting authorization", (_name, handler) => {
  it.each([null, user("super_admin", "verify"), user("super_admin", "setup")])("requires a completed session before reading data", async entry => {
    mocks.user.mockResolvedValue(entry);
    const result = await handler(req());
    expect(result.status).toBe(401);
    expect(result.headers.get("cache-control")).toContain("private, no-store");
    expect(mocks.snapshot).not.toHaveBeenCalled(); expect(mocks.providers).not.toHaveBeenCalled(); expect(mocks.limit).not.toHaveBeenCalled();
  });
  it.each([null, "finance", "support", "content_editor", "verification", "moderator"])("denies role %s", async role => {
    mocks.user.mockResolvedValue(user(role));
    expect((await handler(req())).status).toBe(403);
    expect(mocks.snapshot).not.toHaveBeenCalled(); expect(mocks.providers).not.toHaveBeenCalled(); expect(mocks.limit).not.toHaveBeenCalled();
  });
  it.each(["ops", "super_admin"])("allows %s with private responses", async role => {
    mocks.user.mockResolvedValue(user(role));
    const result = await handler(req());
    expect(result.status).toBe(200); expect(result.headers.get("vary")).toBe("Cookie");
  });
  it("rejects cross-site reads before reporting queries", async () => {
    expect((await handler(req("", { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect(mocks.snapshot).not.toHaveBeenCalled(); expect(mocks.providers).not.toHaveBeenCalled();
  });
  it("bounds repeated reads without returning provider or database errors", async () => {
    mocks.limit.mockResolvedValue({ allowed: false });
    const result = await handler(req());
    expect(result.status).toBe(429); expect(result.headers.get("retry-after")).toBe("60");
    expect(mocks.snapshot).not.toHaveBeenCalled(); expect(mocks.providers).not.toHaveBeenCalled();
  });
  it("does not leak credentials or private errors on failure", async () => {
    mocks.user.mockRejectedValue(new Error("private-database-password"));
    const result = await handler(req());
    expect(result.status).toBe(503); expect(await result.text()).not.toContain("private-database-password");
    expect(result.headers.get("cache-control")).toContain("no-store");
  });
});
it.each(["both", "FIRST", "last,first", "first%27%3Bselect"])("rejects invalid attribution touch %s", async touch => {
  const result = await requests(req(`?touch=${touch}`));
  expect(result.status).toBe(400); expect(mocks.snapshot).not.toHaveBeenCalled();
});
it.each(["first", "last"])("passes exactly one validated %s touch", async touch => {
  await requests(req(`?touch=${touch}`)); expect(mocks.snapshot).toHaveBeenCalledWith({ touch });
});
