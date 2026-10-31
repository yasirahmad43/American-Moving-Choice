import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { createBingReporter, hasBingCredentials } from "./bing";
import { ReportingFailure } from "./http";
import type { ReportingConfiguration } from "./types";

const SITE = "https://www.americanmovingchoice.com";
const NOW = Date.parse("2026-10-31T12:00:00.000Z");
const config: ReportingConfiguration = {
  WEB_URL: SITE, BING_REPORTING_CLIENT_ID: "test-client", BING_REPORTING_CLIENT_SECRET: "test-client-secret",
  BING_REPORTING_REFRESH_TOKEN: "test-refresh-token",
};
const dotnet = (day: string) => `/Date(${Date.parse(`${day}T00:00:00.000Z`)}+0000)/`;
const token = () => ({ access_token: "test-access-token", token_type: "Bearer", expires_in: 3_599 });
const traffic = () => ({ d: [
  { Date: dotnet("2026-10-30"), Clicks: 7, Impressions: 38, privateField: "private@example.com" },
  { Date: dotnet("2026-10-29"), Clicks: 2, Impressions: 17 },
] });
const feeds = () => ({ d: [{
  Url: `${SITE}/sitemap.xml`, Status: "Success", LastCrawled: dotnet("2026-10-30"),
  Submitted: dotnet("2026-10-29"), UrlCount: 4806, privateField: "private@example.com",
}] });

function source(options: {
  token?: () => unknown; traffic?: () => unknown; feeds?: () => unknown;
  request?: (url: URL, init: RequestInit) => Response | undefined;
} = {}) {
  const fetcher = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const supplied = options.request?.(url, init);
    if (supplied) return supplied;
    if (url.pathname === "/webmasters/oauth/token") return Response.json(options.token?.() ?? token());
    if (url.pathname.endsWith("/GetRankAndTrafficStats")) return Response.json(options.traffic?.() ?? traffic());
    if (url.pathname.endsWith("/GetFeeds")) return Response.json(options.feeds?.() ?? feeds());
    throw new Error("Unexpected provider method");
  });
  return { fetcher, fetch: fetcher as unknown as typeof globalThis.fetch };
}

describe("read-only delegated Bing reporting", () => {
  it("uses the documented refresh/Bearer protocol and returns only sorted aggregate fields", async () => {
    const mock = source();
    const result = await createBingReporter(config, { fetch: mock.fetch, now: () => NOW })();
    expect(result).toEqual({
      reportedThrough: "2026-10-30", data: { siteUrl: `${SITE}/`,
        traffic: [{ date: "2026-10-29", clicks: 2, impressions: 17 }, { date: "2026-10-30", clicks: 7, impressions: 38 }],
        feeds: [{ url: `${SITE}/sitemap.xml`, status: "Success", lastCrawled: "2026-10-30T00:00:00.000Z", submitted: "2026-10-29T00:00:00.000Z", urlCount: 4806 }],
      },
    });
    const [address, firstOptions] = mock.fetcher.mock.calls[0]!;
    const init = firstOptions!;
    expect(String(address)).toBe("https://www.bing.com/webmasters/oauth/token");
    expect(init.method).toBe("POST");
    expect(Object.fromEntries(new URLSearchParams(init.body as URLSearchParams))).toEqual({
      client_id: "test-client", client_secret: "test-client-secret", refresh_token: "test-refresh-token", grant_type: "refresh_token",
    });
    expect(mock.fetcher.mock.calls).toHaveLength(3);
    for (const [input, options] of mock.fetcher.mock.calls.slice(1)) {
      const url = new URL(String(input));
      expect(url.origin).toBe("https://www.bing.com");
      expect(["/webmaster/api.svc/json/GetRankAndTrafficStats", "/webmaster/api.svc/json/GetFeeds"]).toContain(url.pathname);
      expect([...url.searchParams]).toEqual([["siteUrl", `${SITE}/`]]);
      expect(options).toMatchObject({ method: "GET", headers: { authorization: "Bearer test-access-token" }, redirect: "error", cache: "no-store" });
    }
    expect(JSON.stringify(result)).not.toMatch(/test-access|test-refresh|private@|privateField|apiKey/iu);
  });

  it("makes no request when credentials are missing, partial or unsafe", async () => {
    for (const partial of [{}, { BING_REPORTING_CLIENT_ID: "test" }, { ...config, BING_REPORTING_REFRESH_TOKEN: "" }, { ...config, BING_REPORTING_CLIENT_SECRET: "bad\r\nheader" }]) {
      const settings = { WEB_URL: SITE, ...partial }, mock = source();
      expect(hasBingCredentials(settings)).toBe(false);
      const report = createBingReporter(settings, { fetch: mock.fetch, now: () => NOW });
      expect(mock.fetcher).not.toHaveBeenCalled();
      await expect(report()).rejects.toMatchObject({ status: "access_denied" });
      expect(mock.fetcher).not.toHaveBeenCalled();
    }
  });

  it("validates the canonical configured site before transmitting any credential", async () => {
    for (const site of ["http://www.example.com", `${SITE}/?`, `${SITE}/#`, `https://user:pass@www.americanmovingchoice.com`, `${SITE}/api/../`, `${SITE}/%2e%2e/`, `${SITE}\\private`, "not a URL"]) {
      const mock = source();
      await expect(createBingReporter({ ...config, BING_REPORTING_SITE_URL: site }, { fetch: mock.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "unavailable" });
      expect(mock.fetcher).not.toHaveBeenCalled();
    }
  });

  it("singleflights refreshes and refreshes early after the bounded token lifetime", async () => {
    let clock = NOW, tokens = 0;
    const mock = source({ token: () => ({ ...token(), access_token: `test-access-${++tokens}` }) });
    const report = createBingReporter(config, { fetch: mock.fetch, now: () => clock });
    await Promise.all([report(), report(), report()]);
    expect(tokens).toBe(1);
    clock += 3_600_000;
    await report();
    expect(tokens).toBe(2);
    const last = mock.fetcher.mock.calls.at(-1)!;
    expect(last[1]!.headers).toMatchObject({ authorization: "Bearer test-access-2" });
  });

  it("invalidates rejected access tokens without retrying a failed call inside the report", async () => {
    let expired = false, tokens = 0;
    const mock = source({
      token: () => ({ ...token(), access_token: `test-access-${++tokens}` }),
      request: url => expired && url.pathname.endsWith("/GetFeeds") ? new Response("private upstream payload", { status: 401 }) : undefined,
    });
    const report = createBingReporter(config, { fetch: mock.fetch, now: () => NOW });
    await report(); expired = true;
    await expect(report()).rejects.toMatchObject({ status: "access_denied" });
    expect(tokens).toBe(1); expired = false;
    await report(); expect(tokens).toBe(2);
  });

  it("fails closed on rotation and never stores a replacement refresh secret only in memory", async () => {
    const mock = source({ token: () => ({ ...token(), refresh_token: "new-private-rotation-value" }) });
    const report = createBingReporter(config, { fetch: mock.fetch, now: () => NOW });
    for (let i = 0; i < 2; i++) {
      try { await report(); throw new Error("Expected refusal"); } catch (error) {
        expect(error).toBeInstanceOf(ReportingFailure);
        expect(error).toMatchObject({ status: "access_denied", message: "Reporting request failed" });
        expect(JSON.stringify(error)).not.toContain("new-private");
      }
    }
    expect(mock.fetcher).toHaveBeenCalledTimes(1);
  });

  it("accepts an unchanged refresh token and a documented read-only scope", async () => {
    const mock = source({ token: () => ({ ...token(), refresh_token: config.BING_REPORTING_REFRESH_TOKEN, scope: "Webmaster.read" }) });
    await expect(createBingReporter(config, { fetch: mock.fetch, now: () => NOW })()).resolves.toHaveProperty("data");
    for (const scope of ["webmaster.manage", "webmaster.read webmaster.manage", 1]) {
      const denied = source({ token: () => ({ ...token(), scope }) });
      await expect(createBingReporter(config, { fetch: denied.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "access_denied" });
      expect(denied.fetcher).toHaveBeenCalledTimes(1);
    }
  });

  it("rejects malformed token shapes and safely classifies credential failures", async () => {
    for (const bad of [{ ...token(), access_token: "bad\r\nheader" }, { ...token(), token_type: "Basic" }, { ...token(), expires_in: -1 }, { ...token(), expires_in: "3599" }, { ...token(), expires_in: 86_401 }, { ...token(), access_token: "" }]) {
      const mock = source({ token: () => bad });
      await expect(createBingReporter(config, { fetch: mock.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "unavailable" });
      expect(mock.fetcher).toHaveBeenCalledTimes(1);
    }
    const denied = source({ request: () => new Response("sensitive credential failure", { status: 400 }) });
    await expect(createBingReporter(config, { fetch: denied.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "access_denied", message: "Reporting request failed" });
  });

  it("only returns canonical same-site public sitemap feed URLs", async () => {
    for (const url of ["https://other.example.com/sitemap.xml", `${SITE}/sitemap.xml?token=private`, `${SITE}/sitemap.xml?`, `${SITE}/sitemap.xml#`, `${SITE}/api/private.xml`, `${SITE}/my-request/private/`, `${SITE}/sitemaps/%2e%2e/sitemap.xml`, `${SITE}/api/../sitemap.xml`, `https://user:pass@www.americanmovingchoice.com/sitemap.xml`]) {
      const mock = source({ feeds: () => ({ d: [{ ...feeds().d[0], Url: url }] }) });
      await expect(createBingReporter(config, { fetch: mock.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "unavailable" });
    }
    const valid = source({ feeds: () => ({ d: [{ ...feeds().d[0], Url: `${SITE}/sitemaps/routes-2.xml` }] }) });
    expect((await createBingReporter(config, { fetch: valid.fetch, now: () => NOW })()).data.feeds[0]?.url).toBe(`${SITE}/sitemaps/routes-2.xml`);
  });

  it("rejects invalid counts, dates, duplicate periods and unbounded provider status text", async () => {
    const invalidRows = [
      { ...traffic().d[0], Clicks: -1 }, { ...traffic().d[0], Clicks: 1.5 }, { ...traffic().d[0], Clicks: "9007199254740992" },
      { ...traffic().d[0], Date: "/Date(123broken)/" }, { ...traffic().d[0], Date: "/Date(1793361600000+1460)/" },
      { ...traffic().d[0], Date: "2026-02-30T00:00:00Z" }, { ...traffic().d[0], Date: dotnet("2030-01-01") },
    ];
    for (const bad of invalidRows) {
      const mock = source({ traffic: () => ({ d: [bad] }) });
      await expect(createBingReporter(config, { fetch: mock.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "unavailable" });
    }
    for (const status of ["private@example.com", "x".repeat(1000), "<script>unsafe</script>"]) {
      const mock = source({ feeds: () => ({ d: [{ ...feeds().d[0], Status: status }] }) });
      await expect(createBingReporter(config, { fetch: mock.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "unavailable" });
    }
    const duplicate = source({ traffic: () => ({ d: [traffic().d[0], traffic().d[0]] }) });
    await expect(createBingReporter(config, { fetch: duplicate.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "unavailable" });
  });

  it("represents truly empty datasets and unfetched .NET dates without inventing freshness", async () => {
    const empty = source({ traffic: () => ({ d: [] }), feeds: () => ({ d: [] }) });
    await expect(createBingReporter(config, { fetch: empty.fetch, now: () => NOW })()).resolves.toEqual({ reportedThrough: null, data: { siteUrl: `${SITE}/`, traffic: [], feeds: [] } });
    const initial = source({ feeds: () => ({ d: [{ ...feeds().d[0], LastCrawled: "/Date(-62135596800000)/", Submitted: null }] }) });
    expect((await createBingReporter(config, { fetch: initial.fetch, now: () => NOW })()).data.feeds[0]).toMatchObject({ lastCrawled: null, submitted: null });
  });

  it("preserves provider throttle backoff and never reflects upstream errors", async () => {
    const mock = source({ request: () => new Response("private@example.com bearer-token", { status: 429, headers: { "retry-after": "120" } }) });
    await expect(createBingReporter(config, { fetch: mock.fetch, now: () => NOW })()).rejects.toMatchObject({ status: "unavailable", retryAfterMs: 120_000, message: "Reporting request failed" });
  });
});
