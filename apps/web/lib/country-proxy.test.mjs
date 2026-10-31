import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
const access = vi.hoisted(() => ({ response: vi.fn() }));
vi.mock("@amc/server/access", () => ({ countryAccessResponse: access.response }));
vi.mock("@amc/server/session-cookie", () => ({ SESSION_COOKIE: "amc_session", sessionCookieOptions: () => ({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2592000 }) }));
import { proxy as webProxy, config as webConfig } from "../proxy.ts";
import { proxy as appProxy, config as appConfig } from "../../app/proxy.ts";

beforeEach(() => { access.response.mockReset(); access.response.mockReturnValue(null); });
describe("proxy country checks precede page/cache and private-app auth", () => {
  it("matches pages, APIs and cached/static paths while leaving only the exact platform namespace alone", () => {
    for (const config of [webConfig, appConfig]) {
      for (const path of ["/", "/movers/texas/", "/_next/static/chunks/main.js", "/_next/image?url=%2Fmedia%2Ftruck.webp", "/api/health", "/my-request/private-token/", "/.well-known/unrelated", "/.well-known/vercel/security-other/"]) expect(unstable_doesMiddlewareMatch({ config, url: `https://www.example.com${path}` }), path).toBe(true);
      for (const path of ["/.well-known/vercel/security", "/.well-known/vercel/security/request-challenge"]) expect(unstable_doesMiddlewareMatch({ config, url: `https://www.example.com${path}` }), path).toBe(false);
    }
    const reserved = "/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3";
    for (const suffix of ["", "/a-4-a/c.js"]) expect(unstable_doesMiddlewareMatch({ config: webConfig, url: `https://www.example.com${reserved}${suffix}` })).toBe(false);
    for (const path of [`${reserved}-other/a-4-a/c.js`, "/149e9513-01fa-4fb0-aad4-566afd725d1b/other-service/c.js", "/other-uuid/2d206a39-8ed7-437e-a3be-862e0f06eea3/c.js"]) expect(unstable_doesMiddlewareMatch({ config: webConfig, url: `https://www.example.com${path}` })).toBe(true);
  });
  it("returns country denial before web pass-through, even on a static resource", () => {
    const denied = new Response("Denied", { status: 403, headers: { "cache-control": "private, no-store" } }); access.response.mockReturnValue(denied);
    expect(webProxy(new NextRequest("https://www.americanmovingchoice.com/media/images/truck.webp"))).toBe(denied);
    expect(access.response).toHaveBeenCalledWith(expect.any(NextRequest), { publicWeb: true });
  });
  it("preserves private-app login redirect when country access passes", () => {
    const response = appProxy(new NextRequest("https://admin.example.com/admin/leads?status=new"));
    expect(response.status).toBe(307);
    const target = new URL(response.headers.get("location")); expect(target.pathname).toBe("/login"); expect(target.searchParams.get("next")).toBe("/admin/leads?status=new");
  });
  it("preserves pathname propagation and session rolling, while denying first before any cookie change", () => {
    const request = new NextRequest("https://admin.example.com/admin", { headers: { cookie: "amc_session=opaque-test-session" } });
    const response = appProxy(request);
    expect(response.status).toBe(200); expect(response.headers.get("x-middleware-request-x-amc-pathname")).toBe("/admin"); expect(response.headers.get("set-cookie")).toContain("amc_session=opaque-test-session");
    const denied = new Response("Denied", { status: 403 }); access.response.mockReturnValue(denied);
    expect(appProxy(request)).toBe(denied); expect(denied.headers.get("set-cookie")).toBeNull();
  });
  it("country-checks APIs while preserving their previous lack of session redirects/cookie rolling", () => {
    const request = new NextRequest("https://admin.example.com/api/health", { headers: { cookie: "amc_session=opaque-test-session" } });
    const response = appProxy(request);
    expect(access.response).toHaveBeenCalledWith(request, { publicWeb: false }); expect(response.status).toBe(200); expect(response.headers.get("set-cookie")).toBeNull(); expect(response.headers.get("x-middleware-request-x-amc-pathname")).toBeNull();
  });
});
