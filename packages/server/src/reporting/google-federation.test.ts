import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ token: vi.fn() }));
vi.mock("@vercel/oidc", () => ({ getVercelOidcToken: sdk.token }));

import { createGoogleReporters, GOOGLE_REPORTING_SCOPES, hasGoogleCredentials } from "./google";
import { exchangeGoogleFederation, normalizeGoogleFederationAudience } from "./google-federation";
import { ReportingFailure } from "./http";
import type { ReportingConfiguration } from "./types";

const NOW = Date.parse("2026-10-31T12:00:00Z");
const AUDIENCE = "//iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/amc-production-reporting/providers/vercel";
const EMAIL = "reporter@amc-test.iam.gserviceaccount.com";
const CONFIG: ReportingConfiguration = { WEB_URL: "https://www.americanmovingchoice.com", GOOGLE_REPORTING_CLIENT_EMAIL: EMAIL, GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE: AUDIENCE };
const ACCESS_TYPE = "urn:ietf:params:oauth:token-type:access_token";
const CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const STS_TOKEN = "synthetic-intermediate-sts-token";
const FINAL_TOKEN = "synthetic-final-reporting-token";
const jwt = (name: string) => [
  Buffer.from(JSON.stringify({ alg: "RS256", kid: "synthetic-test-key" })).toString("base64url"),
  Buffer.from(JSON.stringify({ iss: "https://oidc.vercel.com/test-team", aud: "https://vercel.com/test-team", sub: name, exp: 9999999999 })).toString("base64url"),
  "S".repeat(43),
].join(".");
const SUBJECT = jwt("synthetic-first-subject"), NEXT_SUBJECT = jwt("synthetic-next-subject");
const json = (body: unknown, status = 200, headers?: Record<string, string>) => Response.json(body, { status, headers });

function mockNetwork(now: () => number = () => NOW, overrides: { sts?: Record<string, unknown>; iam?: Record<string, unknown>; stsStatus?: number; iamStatus?: number } = {}) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === "https://sts.googleapis.com/v1/token") return json({
      access_token: STS_TOKEN, token_type: "Bearer", issued_token_type: ACCESS_TYPE, expires_in: 3600, scope: CLOUD_SCOPE,
      raw_private_field: "UNTRUSTED_PROVIDER_DETAIL", ...overrides.sts,
    }, overrides.stsStatus ?? 200);
    if (url.startsWith("https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/")) return json({
      accessToken: FINAL_TOKEN, expireTime: new Date(now() + 3_600_000).toISOString(), raw_private_field: "UNTRUSTED_PROVIDER_DETAIL", ...overrides.iam,
    }, overrides.iamStatus ?? 200);
    if (url.includes("analyticsdata.googleapis.com")) {
      const body = JSON.parse(String(init?.body));
      return body.dimensions
        ? json({ metricHeaders: [{ name: "eventCount" }], rows: [{ dimensionValues: [{ value: "page_view" }], metricValues: [{ value: "8" }] }] })
        : json({ metricHeaders: [{ name: "activeUsers" }, { name: "screenPageViews" }], rows: [{ metricValues: [{ value: "3" }, { value: "8" }] }] });
    }
    if (url.startsWith("https://tagmanager.googleapis.com/")) return json({ containerVersionId: "3", tag: [{ raw_private_field: "UNTRUSTED_PROVIDER_DETAIL" }] });
    throw new Error("Unexpected mock request");
  });
}
const atUrl = (fetcher: ReturnType<typeof mockNetwork>, fragment: string) => fetcher.mock.calls.filter(([url]) => String(url).includes(fragment));
beforeEach(() => { vi.clearAllMocks(); sdk.token.mockResolvedValue(SUBJECT); });
afterEach(() => vi.restoreAllMocks());

describe("keyless Google reporting federation", () => {
  it("accepts only a bounded exact provider audience and normalizes the official HTTPS form", () => {
    expect(normalizeGoogleFederationAudience(AUDIENCE)).toBe(AUDIENCE);
    expect(normalizeGoogleFederationAudience("https:" + AUDIENCE)).toBe(AUDIENCE);
    expect(normalizeGoogleFederationAudience("  " + AUDIENCE + "  ")).toBe(AUDIENCE);
    for (const value of [undefined, "", "https://external.invalid/provider", AUDIENCE + "/", AUDIENCE + "?token=private", AUDIENCE + "#private", AUDIENCE.replace("123456789012", "project-id"), AUDIENCE.replace("global", "us-east1"), AUDIENCE.replace("/providers/", "/../providers/"), AUDIENCE.replace("/vercel", "/%76ercel"), AUDIENCE.replace("iam.googleapis.com", "iam.googleapis.com:443"), "https://user:password@" + AUDIENCE.slice(2)]) {
      expect(normalizeGoogleFederationAudience(value)).toBeNull();
    }
  });

  it("recognizes keyless readiness without reading request tokens or requiring a private key", () => {
    expect(hasGoogleCredentials(CONFIG)).toBe(true);
    expect(hasGoogleCredentials({ WEB_URL: CONFIG.WEB_URL })).toBe(false);
    expect(hasGoogleCredentials({ ...CONFIG, GOOGLE_REPORTING_CLIENT_EMAIL: undefined })).toBe(false);
    expect(hasGoogleCredentials({ ...CONFIG, GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE: undefined })).toBe(false);
    expect(hasGoogleCredentials({ ...CONFIG, GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE: "invalid" })).toBe(false);
    expect(hasGoogleCredentials({ ...CONFIG, GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE: undefined, GOOGLE_REPORTING_PRIVATE_KEY: "legacy-test-key" })).toBe(true);
    expect(sdk.token).not.toHaveBeenCalled();
  });

  it("exchanges request identity through fixed STS then impersonates with only the three read scopes", async () => {
    const fetcher = mockNetwork(), supplier = vi.fn().mockResolvedValue(SUBJECT);
    const result = await exchangeGoogleFederation(CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: supplier });
    expect(result).toEqual({ value: FINAL_TOKEN, expiresAt: NOW + 3_540_000 });
    expect(supplier).toHaveBeenCalledTimes(1); expect(sdk.token).not.toHaveBeenCalled();
    const sts = atUrl(fetcher, "sts.googleapis.com")[0]!;
    expect(sts[0]).toBe("https://sts.googleapis.com/v1/token");
    expect(new Headers(sts[1]?.headers).has("authorization")).toBe(false);
    expect(JSON.parse(String(sts[1]?.body))).toEqual({
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange", audience: AUDIENCE, scope: CLOUD_SCOPE,
      requestedTokenType: ACCESS_TYPE, subjectToken: SUBJECT, subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
    });
    const iam = atUrl(fetcher, "iamcredentials.googleapis.com")[0]!;
    expect(iam[0]).toBe("https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/reporter%40amc-test.iam.gserviceaccount.com:generateAccessToken");
    expect(new Headers(iam[1]?.headers).get("authorization")).toBe("Bearer " + STS_TOKEN);
    expect(JSON.parse(String(iam[1]?.body))).toEqual({ scope: [...GOOGLE_REPORTING_SCOPES], lifetime: "3600s" });
    expect(GOOGLE_REPORTING_SCOPES).not.toContain(CLOUD_SCOPE);
    for (const [, init] of fetcher.mock.calls) {
      expect(init?.method).toBe("POST"); expect(init?.redirect).toBe("error"); expect(init?.cache).toBe("no-store"); expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("uses the SDK lazily inside exchange and does not cache the rotating subject token", async () => {
    let now = NOW;
    sdk.token.mockResolvedValueOnce(SUBJECT).mockResolvedValueOnce(NEXT_SUBJECT);
    const fetcher = mockNetwork(() => now), reporters = createGoogleReporters(CONFIG, { fetch: fetcher, now: () => now });
    expect(sdk.token).not.toHaveBeenCalled();
    await Promise.all([reporters.ga4(), reporters.tagManager()]);
    expect(sdk.token).toHaveBeenCalledTimes(1); expect(sdk.token).toHaveBeenCalledWith();
    expect(atUrl(fetcher, "sts.googleapis.com")).toHaveLength(1); expect(atUrl(fetcher, "iamcredentials.googleapis.com")).toHaveLength(1);
    await reporters.tagManager(); expect(sdk.token).toHaveBeenCalledTimes(1);
    now += 3_550_000;
    await reporters.tagManager(); expect(sdk.token).toHaveBeenCalledTimes(2);
    const exchanges = atUrl(fetcher, "sts.googleapis.com").map(([, init]) => JSON.parse(String(init?.body)).subjectToken);
    expect(exchanges).toEqual([SUBJECT, NEXT_SUBJECT]);
  });

  it("emits the existing aggregate DTO and uses only final read-scoped credentials on reporting requests", async () => {
    const fetcher = mockNetwork(), reporters = createGoogleReporters({ ...CONFIG, GOOGLE_REPORTING_PRIVATE_KEY: "MUST_NOT_USE_PRIVATE_KEY" }, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => SUBJECT });
    const data = await Promise.all([reporters.ga4(), reporters.tagManager()]);
    expect(data[0]?.data).toMatchObject({ activeUsers: 3, screenPageViews: 8, events: { page_view: 8 } });
    expect(data[1]?.data).toEqual({ versionId: "3", tagCount: 1 });
    const exposed = JSON.stringify(data);
    for (const secret of [SUBJECT, STS_TOKEN, FINAL_TOKEN, "UNTRUSTED_PROVIDER_DETAIL", "MUST_NOT_USE_PRIVATE_KEY", EMAIL, AUDIENCE]) expect(exposed).not.toContain(secret);
    expect(atUrl(fetcher, "oauth2.googleapis.com")).toHaveLength(0);
    for (const [url, init] of fetcher.mock.calls) if (String(url).includes("analyticsdata.googleapis.com") || String(url).includes("tagmanager.googleapis.com")) {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer " + FINAL_TOKEN);
    }
  });

  it("never falls back to private-key auth after a configured federation failure", async () => {
    const fetcher = mockNetwork(), supplier = vi.fn().mockRejectedValue(new Error(SUBJECT + "UNTRUSTED_PROVIDER_DETAIL"));
    const reporters = createGoogleReporters({ ...CONFIG, GOOGLE_REPORTING_PRIVATE_KEY: "MUST_NOT_USE_PRIVATE_KEY" }, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: supplier });
    const error = await reporters.ga4().catch(value => value);
    expect(error).toBeInstanceOf(ReportingFailure); expect(error.status).toBe("access_denied");
    expect(String(error) + JSON.stringify(error)).not.toMatch(/UNTRUSTED_PROVIDER_DETAIL|MUST_NOT_USE_PRIVATE_KEY/u);
    expect(String(error) + JSON.stringify(error)).not.toContain(SUBJECT); expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects malformed configured federation or service identity before obtaining a subject token", async () => {
    for (const changed of [
      { GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE: "https://external.invalid/" },
      { GOOGLE_REPORTING_CLIENT_EMAIL: "reporter@external.invalid" },
    ]) {
      const fetcher = mockNetwork(), supplier = vi.fn();
      await expect(exchangeGoogleFederation({ ...CONFIG, ...changed }, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: supplier })).rejects.toBeInstanceOf(ReportingFailure);
      expect(fetcher).not.toHaveBeenCalled(); expect(supplier).not.toHaveBeenCalled();
    }
  });

  it.each(["", "not-a-jwt", "header.payload.signature\n", "A".repeat(16_385)])("rejects malformed runtime tokens before provider exchange", async subject => {
    const fetcher = mockNetwork();
    await expect(exchangeGoogleFederation(CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => subject })).rejects.toBeInstanceOf(ReportingFailure);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    { token_type: "MAC" }, { issued_token_type: "urn:invalid" }, { access_token: "contains invalid spaces" },
    { expires_in: 0 }, { expires_in: 3601 }, { expires_in: 3599.5 }, { scope: CLOUD_SCOPE + " https://www.googleapis.com/auth/iam" },
  ])("refuses malformed or broader STS credentials before IAM impersonation", async sts => {
    const fetcher = mockNetwork(() => NOW, { sts });
    await expect(exchangeGoogleFederation(CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => SUBJECT })).rejects.toBeInstanceOf(ReportingFailure);
    expect(atUrl(fetcher, "iamcredentials.googleapis.com")).toHaveLength(0);
  });
  it.each([5000, 12_288])("supports a valid %s-byte federated STS token within Google's documented 12 KiB limit", async length => {
    const value = "X".repeat(length), fetcher = mockNetwork(() => NOW, { sts: { access_token: value } });
    await expect(exchangeGoogleFederation(CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => SUBJECT })).resolves.toMatchObject({ value: FINAL_TOKEN });
    const request = atUrl(fetcher, "iamcredentials.googleapis.com")[0]!;
    expect(new Headers(request[1]?.headers).get("authorization")?.length).toBe(length + 7);
  });
  it("rejects an oversized federated STS token before IAM without extending the final-token bound", async () => {
    const fetcher = mockNetwork(() => NOW, { sts: { access_token: "X".repeat(12_289) } });
    await expect(exchangeGoogleFederation(CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => SUBJECT })).rejects.toBeInstanceOf(ReportingFailure);
    expect(atUrl(fetcher, "iamcredentials.googleapis.com")).toHaveLength(0);
    const longFinal = mockNetwork(() => NOW, { iam: { accessToken: "X".repeat(4097) } });
    await expect(exchangeGoogleFederation(CONFIG, { fetch: longFinal, now: () => NOW, subjectTokenSupplier: async () => SUBJECT })).rejects.toBeInstanceOf(ReportingFailure);
  });

  it.each([
    { accessToken: "bad token" }, { expireTime: "not-a-time" }, { expireTime: null },
    { expireTime: new Date(NOW - 1000).toISOString() }, { expireTime: new Date(NOW + 60_000).toISOString() },
    { expireTime: new Date(NOW + 7_200_000).toISOString() },
  ])("refuses invalid final bearer credentials or expired/extended lifetimes", async iam => {
    const fetcher = mockNetwork(() => NOW, { iam });
    await expect(exchangeGoogleFederation(CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => SUBJECT })).rejects.toBeInstanceOf(ReportingFailure);
  });

  it("keeps provider permission/rate errors generic and preserves backoff metadata", async () => {
    const fetcher = vi.fn(async () => json({ error: "UNTRUSTED_PROVIDER_DETAIL" }, 429, { "Retry-After": "60" }));
    const error = await exchangeGoogleFederation(CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => SUBJECT }).catch(value => value);
    expect(error).toMatchObject({ status: "unavailable", retryAfterMs: 60_000, httpStatus: 429 });
    expect(String(error) + JSON.stringify(error)).not.toContain("UNTRUSTED_PROVIDER_DETAIL");
  });
});
