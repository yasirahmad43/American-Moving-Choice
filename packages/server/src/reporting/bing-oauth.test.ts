import { describe, expect, it, vi } from "vitest";
import { parseBingTokenGrant } from "./bing-oauth";
import { invalidateBingReportingCache } from "./cache";
import { ReportingFailure } from "./http";
import { createReportingService } from "./service";

vi.mock("server-only", () => ({}));

const NOW = Date.parse("2026-10-31T12:00:00Z");
const SITE = "https://www.americanmovingchoice.com/";
const token = { access_token: "stored-access-token-safe", refresh_token: "initial-refresh-fixture", token_type: "bearer", expires_in: 3599 };
const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 });

describe("stored Bing reporting credentials", () => {
  it("validates only read scope and retains or replaces refresh tokens according to the actual response", () => {
    expect(parseBingTokenGrant(token, NOW)).toEqual({ accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: new Date(NOW + 3599_000) });
    const { refresh_token: _removed, ...withoutRefresh } = token;
    expect(parseBingTokenGrant(withoutRefresh, NOW, "old-refresh").refreshToken).toBe("old-refresh");
    expect(parseBingTokenGrant({ ...token, refresh_token: "rotated-refresh", scope: "Webmaster.read" }, NOW, "old-refresh").refreshToken).toBe("rotated-refresh");
    for (const scope of ["webmaster.manage", "webmaster.read webmaster.manage", "offline_access", 123]) {
      expect(() => parseBingTokenGrant({ ...token, scope }, NOW)).toThrow(ReportingFailure);
    }
    expect(() => parseBingTokenGrant(withoutRefresh, NOW)).toThrow(ReportingFailure);
    expect(() => parseBingTokenGrant({ ...token, access_token: "token\nsecret" }, NOW)).toThrow(ReportingFailure);
  });

  it("rechecks an absent stored grant after fifteen seconds without rebuilding the reporting service", async () => {
    let now = NOW;
    let connected = false;
    const accessToken = vi.fn(async () => {
      if (!connected) throw new ReportingFailure("not_configured");
      return token.access_token;
    });
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe("GET");
      expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${token.access_token}`);
      if (String(input).includes("GetRankAndTrafficStats")) return json({ d: [{ Date: `/Date(${NOW - 86_400_000})/`, Clicks: 2, Impressions: 8 }] });
      if (String(input).includes("GetFeeds")) return json({ d: [] });
      throw new Error("Unexpected mocked request");
    });
    const snapshot = createReportingService({ WEB_URL: SITE, BING_REPORTING_CLIENT_ID: "client", BING_REPORTING_CLIENT_SECRET: "client-secret-fixture" }, {
      fetch: fetcher, now: () => now, bingAccessToken: accessToken,
    });
    expect((await snapshot()).bing).toMatchObject({ status: "not_configured", data: null });
    expect(fetcher).not.toHaveBeenCalled();
    connected = true;
    now += 14_999;
    expect((await snapshot()).bing.status).toBe("not_configured");
    expect(accessToken).toHaveBeenCalledTimes(1);
    now += 2;
    const result = await snapshot();
    expect(result.bing).toMatchObject({ status: "connected", reportedThrough: "2026-10-30", data: { siteUrl: SITE, traffic: [{ date: "2026-10-30", clicks: 2, impressions: 8 }], feeds: [] } });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(accessToken).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(result)).not.toContain(token.access_token);
    expect(JSON.stringify(result)).not.toContain("client-secret-fixture");
  });

  it("invalidates local cached connection failures immediately when an owner completes consent", async () => {
    let connected = false;
    const accessToken = vi.fn(async () => {
      if (!connected) throw new ReportingFailure("not_configured");
      return token.access_token;
    });
    const fetcher = vi.fn(async () => json({ d: [] }));
    const snapshot = createReportingService({ WEB_URL: SITE, BING_REPORTING_CLIENT_ID: "client", BING_REPORTING_CLIENT_SECRET: "secret" }, { fetch: fetcher, now: () => NOW, bingAccessToken: accessToken });
    expect((await snapshot()).bing.status).toBe("not_configured");
    connected = true;
    invalidateBingReportingCache();
    expect((await snapshot()).bing.status).toBe("connected");
    expect(accessToken).toHaveBeenCalledTimes(2);
  });
});
