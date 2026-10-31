import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  user: vi.fn(), requireAdmin: vi.fn(), begin: vi.fn(), complete: vi.fn(), available: vi.fn(),
  config: { APP_URL: "https://app.americanmovingchoice.com" },
}));
vi.mock("@amc/server/auth", () => ({ getCurrentUser: mocked.user, requireAdmin: mocked.requireAdmin }));
vi.mock("@amc/server/env", () => ({ env: () => mocked.config }));
vi.mock("@amc/server/reporting", () => ({ beginBingConnection: mocked.begin, completeBingConnection: mocked.complete, bingConnectionAvailable: mocked.available }));
vi.mock("@amc/ui", () => ({ PageHeader: () => null }));
vi.mock("@/components/admin/growth/growth-dashboard", () => ({ GrowthDashboard: () => null }));

import { GET as connectGet, POST as connect } from "../../app/api/admin/growth/bing/connect/route.ts";
import { GET as callback } from "../../app/api/admin/growth/bing/callback/route.ts";
import GrowthPage from "../../app/(admin)/admin/growth/page.tsx";

const APP = "https://app.americanmovingchoice.com", STATE = "A".repeat(43), CODE = "SYNTHETIC_TEST_CODE";
let diagnostic;
const owner = (adminRole = "super_admin", mfa = "ok") => ({ id: "owner-user", adminRole, mfa, session: { id: "owner-session" } });
function authorize() {
  const url = new URL("https://www.bing.com/webmasters/oauth/authorize");
  for (const [key, value] of Object.entries({ client_id: "public-test-client", response_type: "code", redirect_uri: APP + "/api/admin/growth/bing/callback", scope: "webmaster.read", state: STATE })) url.searchParams.set(key, value);
  return url.toString();
}
const start = (headers = { origin: APP, "sec-fetch-site": "same-origin" }, origin = APP) => new Request(origin + "/api/admin/growth/bing/connect?returnTo=https://external.invalid/", { method: "POST", headers });
function returned(parameters = { state: STATE, code: CODE }, origin = APP) {
  const url = new URL(origin + "/api/admin/growth/bing/callback");
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  return new Request(url);
}
function privateHeaders(response) {
  expect(response.headers.get("cache-control")).toContain("private, no-store");
  expect(response.headers.get("vary")).toBe("Cookie");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
}
async function noPrivateEcho(response, additional = []) {
  const output = JSON.stringify([...response.headers]) + await response.text();
  for (const value of [STATE, CODE, "untrusted-provider-private-detail", "external.invalid", ...additional]) expect(output).not.toContain(value);
  privateHeaders(response);
}
beforeEach(() => {
  diagnostic = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.clearAllMocks(); mocked.config.APP_URL = APP;
  mocked.user.mockResolvedValue(owner()); mocked.requireAdmin.mockResolvedValue({ adminRole: "super_admin" });
  mocked.available.mockReturnValue(true); mocked.begin.mockResolvedValue({ authorizeUrl: authorize() }); mocked.complete.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("Bing native owner connect", () => {
  it.each([null, owner("super_admin", "verify"), owner("super_admin", "setup")])("requires a completed session before creating state", async user => {
    mocked.user.mockResolvedValue(user);
    const response = await connect(start());
    expect(response.status).toBe(401); privateHeaders(response);
    expect(mocked.begin).not.toHaveBeenCalled(); expect(mocked.available).not.toHaveBeenCalled();
  });
  it.each(["ops", "support", "finance", "content_editor", null])("denies role %s even if the UI is bypassed", async role => {
    mocked.user.mockResolvedValue(owner(role));
    const response = await connect(start());
    expect(response.status).toBe(403); privateHeaders(response); expect(mocked.begin).not.toHaveBeenCalled();
  });
  it.each([
    {}, { origin: APP }, { origin: APP, "sec-fetch-site": "cross-site" }, { origin: APP, "sec-fetch-site": "same-site" },
    { origin: "https://www.americanmovingchoice.com", "sec-fetch-site": "same-site" },
    { origin: "null", "sec-fetch-site": "same-origin" },
    { origin: APP + ".external.invalid", "sec-fetch-site": "same-origin" },
  ])("rejects missing/foreign origin or unsafe fetch provenance", async headers => {
    const response = await connect(start(headers));
    expect(response.status).toBe(403); expect(mocked.begin).not.toHaveBeenCalled(); privateHeaders(response);
  });
  it("rejects a different request host even with a forged expected Origin", async () => {
    expect((await connect(start(undefined, "https://external.invalid"))).status).toBe(403);
    expect(mocked.begin).not.toHaveBeenCalled();
  });
  it("starts only the fixed read-only flow using the current owner and session", async () => {
    const response = await connect(start());
    expect(response.status).toBe(303); expect(response.headers.get("location")).toBe(authorize()); privateHeaders(response);
    expect(mocked.begin).toHaveBeenCalledTimes(1);
    expect(mocked.begin).toHaveBeenCalledWith({ userId: "owner-user", sessionId: "owner-session" });
    expect(mocked.complete).not.toHaveBeenCalled();
  });
  it.each([
    "https://external.invalid/authorize",
    "https://www.bing.com:8443/webmasters/oauth/authorize",
    "https://www.bing.com/webmasters/oauth/authorize#private",
    "https://www.bing.com/other",
    "https://user:password@www.bing.com/webmasters/oauth/authorize",
  ])("refuses an unsafe backend authorization target", async authorizeUrl => {
    mocked.begin.mockResolvedValue({ authorizeUrl });
    const response = await connect(start());
    expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed");
    await noPrivateEcho(response, ["password"]);
  });
  it.each(["scope", "redirect_uri", "state", "client_secret"])("rejects expanded scopes, redirects, malformed state or unexpected secret parameters: %s", async key => {
    const url = new URL(authorize()); url.searchParams.set(key, key === "state" ? "short" : key === "scope" ? "webmaster.manage" : key === "redirect_uri" ? "https://external.invalid/" : "synthetic-secret");
    mocked.begin.mockResolvedValue({ authorizeUrl: url.toString() });
    const response = await connect(start());
    expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed"); await noPrivateEcho(response, ["synthetic-secret"]);
  });
  it("has no state-creating GET and handles unavailable configuration/errors without detail", async () => {
    const get = await connectGet(); expect(get.status).toBe(405); privateHeaders(get); expect(mocked.begin).not.toHaveBeenCalled();
    mocked.available.mockReturnValue(false);
    const unavailable = await connect(start()); expect(unavailable.status).toBe(303); expect(mocked.begin).not.toHaveBeenCalled();
    mocked.available.mockReturnValue(true); mocked.begin.mockRejectedValue(new Error("untrusted-provider-private-detail"));
    const failed = await connect(start()); expect(failed.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed"); await noPrivateEcho(failed);
  });
});

describe("Bing callback privacy and owner binding", () => {
  it.each([null, owner("super_admin", "verify"), owner("super_admin", "setup")])("strips callback data when sign-in is missing or unfinished", async user => {
    mocked.user.mockResolvedValue(user);
    const response = await callback(returned({ state: STATE, code: CODE, next: "https://external.invalid/" }));
    expect(response.status).toBe(303); expect(response.headers.get("location")).toBe(APP + "/login?next=%2Fadmin%2Fgrowth");
    expect(mocked.complete).not.toHaveBeenCalled(); await noPrivateEcho(response);
  });
  it("denies an ops session without exchanging, reflecting or redirecting callback secrets", async () => {
    mocked.user.mockResolvedValue(owner("ops"));
    const response = await callback(returned()); expect(response.status).toBe(403);
    expect(mocked.complete).not.toHaveBeenCalled(); await noPrivateEcho(response);
  });
  it("passes a bounded code/state and current owner session only, then immediately redirects cleanly", async () => {
    const response = await callback(returned({ state: STATE, code: CODE, returnTo: "https://external.invalid/" }));
    expect(response.status).toBe(303); expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_connected");
    expect(mocked.complete).toHaveBeenCalledTimes(1);
    expect(mocked.complete).toHaveBeenCalledWith({ userId: "owner-user", sessionId: "owner-session", state: STATE, code: CODE });
    await noPrivateEcho(response);
  });
  it("treats expired/replayed/session-mismatched core failures as a generic clean failure", async () => {
    mocked.complete.mockRejectedValue(new Error("untrusted-provider-private-detail"));
    const response = await callback(returned());
    expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed"); await noPrivateEcho(response);
  });
  it("cleans callback navigation even during an auth/configuration outage", async () => {
    mocked.user.mockRejectedValue(new Error("untrusted-provider-private-detail"));
    const authFailed = await callback(returned());
    expect(authFailed.status).toBe(303); expect(authFailed.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed");
    await noPrivateEcho(authFailed); expect(mocked.complete).not.toHaveBeenCalled();
    mocked.config.APP_URL = "not-a-public-origin";
    const configFailed = await callback(returned());
    expect(configFailed.status).toBe(303); expect(configFailed.headers.get("location")).toBe("/admin/growth?connection=bing_failed");
    await noPrivateEcho(configFailed);
  });
  it("accepts the specified maximum visible-ASCII code without exposing it", async () => {
    const code = "#".repeat(8192);
    const response = await callback(returned({ state: STATE, code }));
    expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_connected");
    expect(mocked.complete).toHaveBeenCalledWith({ userId: "owner-user", sessionId: "owner-session", state: STATE, code });
    await noPrivateEcho(response, [code]);
  });
  it.each([
    {}, { state: STATE }, { code: CODE }, { state: "A".repeat(42), code: CODE },
    { state: STATE + "\n", code: CODE }, { state: STATE, code: "" }, { state: STATE, code: "contains space" },
    { state: STATE, code: "\u0000" }, { state: STATE, code: "é" }, { state: STATE, code: "A".repeat(8193) },
  ])("refuses missing or malformed callback values without invoking core", async parameters => {
    const response = await callback(returned(parameters));
    expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed");
    expect(mocked.complete).not.toHaveBeenCalled(); await noPrivateEcho(response);
  });
  it("rejects duplicate code/state parameters rather than choosing one", async () => {
    for (const duplicate of ["code", "state"]) {
      const url = new URL(returned().url); url.searchParams.append(duplicate, duplicate === "state" ? STATE : CODE);
      const response = await callback(new Request(url)); expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed"); await noPrivateEcho(response);
    }
    expect(mocked.complete).not.toHaveBeenCalled();
  });
  it.each(["access_denied", "server_error", "untrusted-provider-private-detail"])("handles provider error %s with allowlisted status and no exchange", async error => {
    const response = await callback(returned({ state: STATE, error, error_description: "untrusted-provider-private-detail", error_uri: "https://external.invalid/" }));
    expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=" + (error === "access_denied" ? "bing_cancelled" : "bing_failed"));
    expect(mocked.complete).not.toHaveBeenCalled(); await noPrivateEcho(response);
  });
  it("rejects conflicting error+code and callbacks on another host", async () => {
    for (const request of [returned({ state: STATE, code: CODE, error: "access_denied" }), returned(undefined, "https://external.invalid")]) {
      const response = await callback(request); expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed"); await noPrivateEcho(response);
    }
    expect(mocked.complete).not.toHaveBeenCalled();
  });
});

describe("growth page configuration boundary", () => {
  it.each([["super_admin", true, true], ["super_admin", false, false], ["ops", true, false]])("owner/config readiness controls Connect Bing: %s/%s", async (adminRole, available, expected) => {
    mocked.requireAdmin.mockResolvedValue({ adminRole }); mocked.available.mockReturnValue(available);
    const page = await GrowthPage({ searchParams: Promise.resolve({}) });
    expect(page.props.children[1].props.canConnectBing).toBe(expected);
    if (adminRole !== "super_admin") expect(mocked.available).not.toHaveBeenCalled();
  });
  it.each(["bing_connected", "bing_cancelled", "bing_failed"])("passes only an approved connection notice %s", async connection => {
    const page = await GrowthPage({ searchParams: Promise.resolve({ connection }) });
    expect(page.props.children[1].props.connectionNotice).toBe(connection);
  });
  it.each(["untrusted-provider-private-detail", "__proto__", ["bing_connected", "bing_failed"]])("never forwards arbitrary callback text/ambiguous notices", async connection => {
    const page = await GrowthPage({ searchParams: Promise.resolve({ connection, code: CODE, state: STATE }) });
    expect(page.props.children[1].props.connectionNotice).toBeUndefined();
    expect(JSON.stringify(page.props.children[1].props)).not.toMatch(/SYNTHETIC_TEST_CODE|AAAAA|untrusted-provider-private-detail/u);
  });
});

describe("Bing callback failure-only diagnostics", () => {
  it.each([
    ["missing_state", { code: CODE }],
    ["malformed_state", { state: "private-malformed-state", code: CODE }],
    ["missing_code", { state: STATE }],
    ["malformed_code", { state: STATE, code: "private malformed code" }],
    ["provider_error", { state: STATE, error: "private-provider-error", error_description: "private-provider-description" }],
  ])("records only category %s after owner authorization", async (reason, parameters) => {
    const response = await callback(returned(parameters));
    expect(response.headers.get("location")).toBe(APP + "/admin/growth?connection=bing_failed");
    expect(diagnostic).toHaveBeenCalledTimes(1);
    expect(diagnostic).toHaveBeenCalledWith("reporting_bing_callback_failure", { stage: "callback_input", reason });
    expect(mocked.complete).not.toHaveBeenCalled();
    const encoded = JSON.stringify(diagnostic.mock.calls);
    for (const value of [STATE, CODE, "private-malformed-state", "private malformed code", "private-provider-error", "private-provider-description", APP, "owner-user", "owner-session"]) expect(encoded).not.toContain(value);
    await noPrivateEcho(response);
  });

  it.each(["state", "code"])("distinguishes duplicate %s without copying either value", async key => {
    const url = new URL(returned().url); url.searchParams.append(key, "private-duplicate-value");
    await callback(new Request(url));
    expect(diagnostic).toHaveBeenCalledWith("reporting_bing_callback_failure", { stage: "callback_input", reason: "duplicate_" + key });
    expect(JSON.stringify(diagnostic.mock.calls)).not.toMatch(/private-duplicate-value|SYNTHETIC_TEST_CODE|AAAAA|owner-user|owner-session/);
  });

  it.each([null, owner("ops"), owner("super_admin", "verify")])("does not inspect/log callback input for an unauthorized session", async user => {
    mocked.user.mockResolvedValue(user);
    await callback(returned({ code: CODE }));
    expect(diagnostic).not.toHaveBeenCalled();
    expect(mocked.complete).not.toHaveBeenCalled();
  });

  it("keeps normal success/cancellation silent and service outages generic", async () => {
    await callback(returned());
    await callback(returned({ state: STATE, error: "access_denied" }));
    expect(diagnostic).not.toHaveBeenCalled();
    mocked.user.mockRejectedValue(new Error("private-auth-error"));
    await callback(returned());
    expect(diagnostic).toHaveBeenCalledWith("reporting_bing_callback_failure", { stage: "callback_auth", reason: "unavailable" });
    expect(JSON.stringify(diagnostic.mock.calls)).not.toContain("private-auth-error");
  });
});
