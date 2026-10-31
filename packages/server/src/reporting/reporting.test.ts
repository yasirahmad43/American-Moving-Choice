import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { providerCache } from "./cache";
import { GOOGLE_REPORTING_SCOPES } from "./google";
import { readReportingJson, ReportingFailure } from "./http";
import { createReportingService } from "./service";
import type { ReportingConfiguration } from "./types";

vi.mock("server-only", () => ({}));

const NOW = Date.parse("2026-10-31T01:00:00.000Z");
const SITE = "https://www.americanmovingchoice.com";
const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const CONFIG: ReportingConfiguration = {
  WEB_URL: SITE,
  GOOGLE_REPORTING_CLIENT_EMAIL: "reporter@amc-test.iam.gserviceaccount.com",
  GOOGLE_REPORTING_PRIVATE_KEY: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
};
const TOKEN = "test-access-token-reporting-only";
const json = (value: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(value), { status, headers });

function googleMock(overrides: { denyGa4?: () => boolean; malformedGa4?: boolean; emptySearch?: boolean; tokenStatus?: number } = {}) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === "https://oauth2.googleapis.com/token") return json({ access_token: TOKEN, token_type: "Bearer", expires_in: 3600, error_description: "PROVIDER_SECRET" }, overrides.tokenStatus ?? 200);
    if (url.includes("analyticsdata.googleapis.com")) {
      if (overrides.denyGa4?.()) return json({ message: "PROVIDER_SECRET" }, 403);
      const body = JSON.parse(String(init?.body)) as { dimensions?: unknown };
      if (body.dimensions) return json({ metricHeaders: [{ name: "eventCount" }], rows: [
        { dimensionValues: [{ value: "page_view" }], metricValues: [{ value: "8" }], privateContact: "CONTACT_SECRET" },
        { dimensionValues: [{ value: "generate_lead" }], metricValues: [{ value: "2" }] },
      ] });
      return json({ metricHeaders: [{ name: "activeUsers" }, { name: "screenPageViews" }], rows: [
        { metricValues: [{ value: overrides.malformedGa4 ? "not-a-number" : "3" }, { value: "8" }] },
      ], privateContact: "CONTACT_SECRET" });
    }
    if (url.includes("/searchAnalytics/query")) {
      if (overrides.emptySearch) return json({});
      const body = JSON.parse(String(init?.body)) as { dimensions?: unknown };
      return body.dimensions ? json({ rows: [{ keys: ["2026-10-25"] }, { keys: ["2026-10-27"] }] })
        : json({ rows: [{ clicks: 15, impressions: 100, ctr: 0.15, position: 5.1, privateQuery: "QUERY_SECRET" }] });
    }
    if (url.endsWith("/sitemaps")) return json({ sitemap: [{
      path: `${SITE}/sitemap.xml`, lastSubmitted: "2026-10-28T10:00:00Z", lastDownloaded: "2026-10-29T10:00:00Z",
      isPending: false, errors: "0", warnings: "1", contents: [{ type: "web", submitted: "4806", indexed: "999999" }, { type: "image", submitted: "20000" }],
    }] });
    if (url.includes("tagmanager.googleapis.com")) return json({ containerVersionId: "3", tag: [{ html: "PRIVATE_TAG_CODE" }, { secret: "PRIVATE_TAG_CODE" }] });
    throw new Error("Unexpected mock request");
  });
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("read-only reporting integration", () => {
  it("makes no requests for absent or partial credentials and does not invent zero metrics", async () => {
    const fetcher = vi.fn();
    const snapshot = await createReportingService({ WEB_URL: SITE, GOOGLE_REPORTING_CLIENT_EMAIL: CONFIG.GOOGLE_REPORTING_CLIENT_EMAIL, BING_REPORTING_CLIENT_ID: "client-only" }, { fetch: fetcher, now: () => NOW })();
    for (const provider of [snapshot.ga4, snapshot.searchConsole, snapshot.tagManager, snapshot.bing]) {
      expect(provider).toEqual({ status: "not_configured", checkedAt: null, reportedThrough: null, data: null });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("signs a service-account JWT with only three fixed read scopes and emits aggregate DTOs", async () => {
    const fetcher = googleMock();
    const snapshot = await createReportingService(CONFIG, { fetch: fetcher, now: () => NOW })();
    const tokenCalls = fetcher.mock.calls.filter(([url]) => String(url) === "https://oauth2.googleapis.com/token");
    expect(tokenCalls).toHaveLength(1);
    const parameters = new URLSearchParams(String(tokenCalls[0]![1]?.body));
    expect(parameters.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    const assertion = parameters.get("assertion")!;
    const [header, payload, signature] = assertion.split(".");
    expect(JSON.parse(Buffer.from(header!, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    const claims = JSON.parse(Buffer.from(payload!, "base64url").toString()) as Record<string, unknown>;
    expect(claims).toEqual({ iss: CONFIG.GOOGLE_REPORTING_CLIENT_EMAIL, aud: "https://oauth2.googleapis.com/token", scope: GOOGLE_REPORTING_SCOPES.join(" "), iat: Math.floor(NOW / 1000), exp: Math.floor(NOW / 1000) + 3600 });
    expect(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), pair.publicKey, Buffer.from(signature!, "base64url"))).toBe(true);
    expect(snapshot.ga4).toMatchObject({ status: "connected", reportedThrough: null, data: { activeUsers: 3, screenPageViews: 8, windowMinutes: 30, events: { page_view: 8, survey_start: 0, survey_step: 0, generate_lead: 2 } } });
    expect(snapshot.tagManager.data).toEqual({ versionId: "3", tagCount: 2 });
    const exposed = JSON.stringify(snapshot);
    for (const forbidden of [TOKEN, "PRIVATE_TAG_CODE", "CONTACT_SECRET", "QUERY_SECRET", "PROVIDER_SECRET", "PRIVATE KEY", "999999", "access_token", "assertion"]) expect(exposed).not.toContain(forbidden);
    for (const [, init] of fetcher.mock.calls) {
      expect(init?.redirect).toBe("error");
      expect(init?.cache).toBe("no-store");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    const events = fetcher.mock.calls.filter(([url]) => String(url).includes("analyticsdata"))
      .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>);
    expect(events).toContainEqual({ metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }], returnPropertyQuota: true });
    expect(events.find((body) => body.dimensions)?.dimensionFilter).toEqual({ filter: { fieldName: "eventName", inListFilter: { values: ["page_view", "survey_start", "survey_step", "generate_lead"], caseSensitive: true } } });
  });

  it("uses the latest returned final Pacific date and never deprecated sitemap indexed counts", async () => {
    const fetcher = googleMock();
    const snapshot = await createReportingService({ ...CONFIG, GOOGLE_REPORTING_SITE_URL: "sc-domain:americanmovingchoice.com" }, { fetch: fetcher, now: () => NOW })();
    expect(snapshot.searchConsole).toMatchObject({ status: "connected", reportedThrough: "2026-10-27", data: { siteUrl: "sc-domain:americanmovingchoice.com", startDate: "2026-09-30", endDate: "2026-10-27", clicks: 15, impressions: 100, ctr: 0.15, position: 5.1, sitemaps: [{ path: `${SITE}/sitemap.xml`, submittedUrls: 4806, errors: 0, warnings: 1 }] } });
    const calls = fetcher.mock.calls.filter(([url]) => String(url).includes("/searchAnalytics/query"));
    expect(calls).toHaveLength(2);
    expect(JSON.parse(String(calls[0]![1]?.body))).toMatchObject({ startDate: "2026-10-20", endDate: "2026-10-29", dataState: "final", dimensions: ["date"] });
    expect(calls.every(([url]) => String(url).includes("sc-domain%3Aamericanmovingchoice.com"))).toBe(true);
  });

  it("distinguishes a successful empty search report from missing access and undefined rank", async () => {
    const snapshot = await createReportingService(CONFIG, { fetch: googleMock({ emptySearch: true }), now: () => NOW })();
    expect(snapshot.searchConsole).toMatchObject({ status: "connected", reportedThrough: null, data: { clicks: 0, impressions: 0, ctr: null, position: null, endDate: "2026-10-27" } });
  });

  it("does not reflect token paths or arbitrary URLs through provider sitemap fields", async () => {
    const valid = googleMock();
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => String(input).endsWith("/sitemaps")
      ? json({ sitemap: [{ path: `${SITE}/my-request/PRIVATE_TOKEN`, contents: [] }] }) : valid(input, init));
    const snapshot = await createReportingService(CONFIG, { fetch: fetcher, now: () => NOW })();
    expect(snapshot.searchConsole).toMatchObject({ status: "unavailable", data: null });
    expect(JSON.stringify(snapshot)).not.toContain("PRIVATE_TOKEN");
  });

  it("singleflights dashboard refreshes and respects separate provider TTLs", async () => {
    let now = NOW;
    const fetcher = googleMock();
    const snapshot = createReportingService(CONFIG, { fetch: fetcher, now: () => now });
    const results = await Promise.all([snapshot(), snapshot(), snapshot()]);
    expect(fetcher).toHaveBeenCalledTimes(7); // one token + two realtime + three Search Console + one GTM
    results[0]!.ga4.data!.events.page_view = 999;
    expect((await snapshot()).ga4.data!.events.page_view).toBe(8);
    now += 30_001;
    await snapshot();
    expect(fetcher).toHaveBeenCalledTimes(9);
    expect(fetcher.mock.calls.filter(([url]) => String(url).includes("tagmanager.googleapis"))).toHaveLength(1);
  });

  it("removes expired successful data and cached tokens after authorization is denied", async () => {
    let now = NOW;
    let deny = false;
    const fetcher = googleMock({ denyGa4: () => deny });
    const snapshot = createReportingService(CONFIG, { fetch: fetcher, now: () => now });
    expect((await snapshot()).ga4.status).toBe("connected");
    deny = true;
    now += 30_001;
    expect((await snapshot()).ga4).toMatchObject({ status: "access_denied", data: null, reportedThrough: null });
    deny = false;
    now += 30_001;
    expect((await snapshot()).ga4.status).toBe("connected");
    expect(fetcher.mock.calls.filter(([url]) => String(url) === "https://oauth2.googleapis.com/token")).toHaveLength(2);
  });

  it("maps invalid credentials and provider errors without leaking raw messages into diagnostics", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetcher = googleMock({ tokenStatus: 400 });
    const snapshot = await createReportingService(CONFIG, { fetch: fetcher, now: () => NOW })();
    expect(snapshot.ga4.status).toBe("access_denied");
    expect(snapshot.searchConsole.data).toBeNull();
    expect(snapshot.tagManager.data).toBeNull();
    expect(JSON.stringify(snapshot)).not.toContain("PROVIDER_SECRET");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls.every(([event, details]) => event === "reporting_ga4_failure" &&
      ["totals", "events"].includes(details.variant) && details.phase === "request" && details.status === "access_denied")).toBe(true);
    const unused = vi.fn();
    const invalid = await createReportingService({ ...CONFIG, GOOGLE_REPORTING_PRIVATE_KEY: "PRIVATE_KEY_BAD_SECRET" }, { fetch: unused, now: () => NOW })();
    expect(invalid.ga4.status).toBe("access_denied");
    expect(unused).not.toHaveBeenCalled();
    expect(JSON.stringify(invalid)).not.toContain("PRIVATE_KEY_BAD_SECRET");
    expect(JSON.stringify(warnSpy.mock.calls)).not.toMatch(/PROVIDER_SECRET|PRIVATE_KEY_BAD_SECRET|PRIVATE KEY|access_token|assertion|https:\/\//u);
  });

  it("refuses malformed aggregate values instead of displaying zero", async () => {
    const snapshot = await createReportingService(CONFIG, { fetch: googleMock({ malformedGa4: true }), now: () => NOW })();
    expect(snapshot.ga4).toMatchObject({ status: "unavailable", data: null });
    expect(snapshot.tagManager.status).toBe("connected");
  });

  it("bounds a stalled token request to five seconds for all waiting providers", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | null | undefined;
    const fetcher = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
      signal = init?.signal;
      return new Promise<Response>(() => {});
    });
    const pending = createReportingService(CONFIG, { fetch: fetcher, now: () => NOW })();
    await vi.advanceTimersByTimeAsync(5001);
    const snapshot = await pending;
    expect(snapshot.ga4.status).toBe("unavailable");
    expect(snapshot.searchConsole.status).toBe("unavailable");
    expect(snapshot.tagManager.status).toBe("unavailable");
    expect(signal?.aborted).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("report cache and transport guards", () => {
  it("distinguishes Google's 403 quota response from revoked API access", async () => {
    const quota = vi.fn(async () => json({ error: { errors: [{ reason: "rateLimitExceeded", message: "PROVIDER_SECRET" }] } }, 403));
    await expect(readReportingJson(quota, "https://tagmanager.googleapis.com/tagmanager/v2/accounts/1/containers/2/versions:live")).rejects.toMatchObject({ status: "unavailable", retryAfterMs: 60_000, httpStatus: 403 });
    const denied = vi.fn(async () => json({ error: { errors: [{ reason: "insufficientPermissions", message: "PROVIDER_SECRET" }] } }, 403));
    await expect(readReportingJson(denied, "https://tagmanager.googleapis.com/tagmanager/v2/accounts/1/containers/2/versions:live")).rejects.toMatchObject({ status: "access_denied", httpStatus: 403 });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const datedQuota = vi.fn(async () => json({}, 429, { "retry-after": new Date(NOW + 120_000).toUTCString() }));
    await expect(readReportingJson(datedQuota, "https://oauth2.googleapis.com/token")).rejects.toMatchObject({ status: "unavailable", retryAfterMs: 120_000 });
  });

  it("honors Retry-After and replaces expired success with null data on quota exhaustion", async () => {
    let now = NOW;
    let calls = 0;
    const read = providerCache(30_000, () => now, async () => {
      if (++calls === 1) return { data: { count: 2 }, reportedThrough: null };
      throw new ReportingFailure("unavailable", 120_000, 429);
    });
    expect((await read()).status).toBe("connected");
    now += 30_001;
    expect(await read()).toMatchObject({ status: "unavailable", data: null });
    now += 119_999;
    await read();
    expect(calls).toBe(2);
    now += 2;
    await read();
    expect(calls).toBe(3);
  });

  it("rejects redirects, oversized payloads and foreign endpoints without exposing bodies", async () => {
    const fetcher = vi.fn(async () => json({ private: "PAYLOAD_SECRET" }, 429, { "retry-after": "120" }));
    await expect(readReportingJson(fetcher, "https://oauth2.googleapis.com/token")).rejects.toMatchObject({ status: "unavailable", retryAfterMs: 120_000, message: "Reporting request failed" });
    const oversized = vi.fn(async () => json({ private: "PAYLOAD_SECRET" }, 200, { "content-length": "262145" }));
    await expect(readReportingJson(oversized, "https://oauth2.googleapis.com/token")).rejects.toMatchObject({ status: "unavailable" });
    const unannouncedOversize = vi.fn(async () => json({ private: "x".repeat(262_145) }));
    await expect(readReportingJson(unannouncedOversize, "https://oauth2.googleapis.com/token")).rejects.toMatchObject({ status: "unavailable" });
    const never = vi.fn();
    await expect(readReportingJson(never, "https://example.com/token")).rejects.toMatchObject({ status: "unavailable" });
    expect(never).not.toHaveBeenCalled();
  });
});
