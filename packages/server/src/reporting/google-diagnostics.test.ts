import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGoogleReporters } from "./google";
import { ReportingFailure } from "./http";
import type { ReportingConfiguration } from "./types";

const NOW = Date.parse("2026-10-31T12:00:00Z"), PRIVATE = "SYNTHETIC_PRIVATE_ERROR_TOKEN";
const SUBJECT = Buffer.from('{"alg":"RS256","kid":"test"}').toString("base64url") + "." + Buffer.from('{"sub":"synthetic"}').toString("base64url") + "." + "S".repeat(43);
const CONFIG: ReportingConfiguration = {
  WEB_URL: "https://www.americanmovingchoice.com", GOOGLE_REPORTING_CLIENT_EMAIL: "reporter@test-project.iam.gserviceaccount.com",
  GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE: "//iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/amc-production-reporting/providers/vercel",
};
const totals = () => ({ metricHeaders: [{ name: "activeUsers" }, { name: "screenPageViews" }], rows: [{ metricValues: [{ value: "3" }, { value: "8" }] }] });
const events = () => ({ metricHeaders: [{ name: "eventCount" }], rows: [{ dimensionValues: [{ value: "page_view" }], metricValues: [{ value: "8" }] }] });
let warning: ReturnType<typeof vi.spyOn>;
beforeEach(() => { warning = vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

function reporter(options: {
  totals?: unknown; events?: unknown; failVariant?: "totals" | "events"; httpStatus?: number;
  throwError?: unknown; config?: ReportingConfiguration;
} = {}) {
  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === "https://sts.googleapis.com/v1/token") return Response.json({ access_token: "synthetic-sts-access-token", token_type: "Bearer", issued_token_type: "urn:ietf:params:oauth:token-type:access_token", expires_in: 3600 });
    if (url.startsWith("https://iamcredentials.googleapis.com/")) return Response.json({ accessToken: "synthetic-final-access-token", expireTime: new Date(NOW + 3_600_000).toISOString() });
    if (!url.startsWith("https://analyticsdata.googleapis.com/")) throw new Error("Unexpected test endpoint");
    const body = JSON.parse(String(init?.body));
    const variant = body.dimensions ? "events" : "totals";
    if (variant === options.failVariant) {
      if (options.throwError !== undefined) throw options.throwError;
      return Response.json({ error: { message: PRIVATE, url: "https://private.invalid/" + PRIVATE, token: PRIVATE } }, { status: options.httpStatus ?? 400 });
    }
    return Response.json(variant === "totals" ? options.totals ?? totals() : options.events ?? events());
  });
  const reports = createGoogleReporters(options.config ?? CONFIG, { fetch: fetcher, now: () => NOW, subjectTokenSupplier: async () => SUBJECT });
  return { load: reports.ga4, fetcher };
}
function safeWarning(expected: { variant: string; phase: string; status: string; httpStatus?: number }) {
  expect(warning).toHaveBeenCalledTimes(1);
  expect(warning).toHaveBeenCalledWith("reporting_ga4_failure", expected);
  const encoded = JSON.stringify(warning.mock.calls);
  for (const value of [PRIVATE, SUBJECT, "synthetic-sts-access-token", "synthetic-final-access-token", CONFIG.GOOGLE_REPORTING_CLIENT_EMAIL!, CONFIG.GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE!, "https://", '"message":', '"headers":', '"payload":']) expect(encoded).not.toContain(value);
  expect(Object.keys(warning.mock.calls[0]![1] as object).sort()).toEqual(Object.keys(expected).sort());
}

describe("safe GA4 failure-only diagnostics", () => {
  it("keeps successful data and requests unchanged without logging", async () => {
    const { load, fetcher } = reporter();
    const result = await load();
    expect(result).toEqual({ reportedThrough: null, data: { windowMinutes: 30, activeUsers: 3, screenPageViews: 8, events: { page_view: 8, survey_start: 0, survey_step: 0, generate_lead: 0 } } });
    expect(warning).not.toHaveBeenCalled();
    const bodies = fetcher.mock.calls.filter(([url]) => String(url).startsWith("https://analyticsdata.googleapis.com/")).map(([, init]) => JSON.parse(String(init?.body)));
    expect(bodies).toEqual([
      { metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }], returnPropertyQuota: true },
      { dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["page_view", "survey_start", "survey_step", "generate_lead"], caseSensitive: true } } }, limit: "4", returnPropertyQuota: true },
    ]);
  });
  it("treats valid empty realtime responses as connected zeros without warnings", async () => {
    const { load } = reporter({ totals: { metricHeaders: totals().metricHeaders }, events: { metricHeaders: events().metricHeaders } });
    expect((await load()).data).toEqual({ windowMinutes: 30, activeUsers: 0, screenPageViews: 0, events: { page_view: 0, survey_start: 0, survey_step: 0, generate_lead: 0 } });
    expect(warning).not.toHaveBeenCalled();
  });
  it.each([["totals", 400, "unavailable"], ["events", 403, "access_denied"], ["events", 429, "unavailable"]] as const)("identifies %s HTTP%s without raw provider errors", async (variant, httpStatus, status) => {
    await expect(reporter({ failVariant: variant, httpStatus }).load()).rejects.toBeInstanceOf(ReportingFailure);
    safeWarning({ variant, phase: "request", status, httpStatus });
  });
  it.each([
    ["totals", "metric_headers", { metricHeaders: [{ name: PRIVATE }], rows: [] }],
    ["events", "metric_headers", { metricHeaders: [{ name: PRIVATE }], rows: [] }],
    ["totals", "rows", { metricHeaders: totals().metricHeaders, rows: [totals().rows[0], totals().rows[0]] }],
    ["events", "rows", { metricHeaders: events().metricHeaders, rows: PRIVATE }],
    ["totals", "metric_values", { metricHeaders: totals().metricHeaders, rows: [{ metricValues: [{ value: PRIVATE }, { value: "0" }] }] }],
    ["events", "metric_values", { metricHeaders: events().metricHeaders, rows: [{ dimensionValues: [{ value: "page_view" }], metricValues: [{ value: PRIVATE }] }] }],
    ["events", "dimension_values", { metricHeaders: events().metricHeaders, rows: [{ dimensionValues: [], metricValues: [{ value: "1" }] }] }],
    ["events", "dimension_values", { metricHeaders: events().metricHeaders, rows: [{ dimensionValues: [{ value: PRIVATE }], metricValues: [{ value: "1" }] }] }],
  ] as const)("identifies %s parser phase %s without header/event/metric values", async (variant, phase, value) => {
    const config = variant === "totals" ? { totals: value } : { events: value };
    await expect(reporter(config).load()).rejects.toBeInstanceOf(ReportingFailure);
    safeWarning({ variant, phase, status: "unavailable" });
  });
  it("does not copy arbitrary error fields or messages from transport failures", async () => {
    const error = Object.assign(new Error(PRIVATE), { status: PRIVATE, httpStatus: 401, headers: { Authorization: PRIVATE }, payload: PRIVATE });
    await expect(reporter({ failVariant: "totals", throwError: error }).load()).rejects.toBeInstanceOf(ReportingFailure);
    safeWarning({ variant: "totals", phase: "request", status: "unavailable" });
  });
  it("accepts only a bounded integer HTTP code and known ReportingFailure status enum", async () => {
    const error = new ReportingFailure("unavailable", undefined, 9999);
    Object.assign(error, { status: PRIVATE, token: PRIVATE });
    await expect(reporter({ failVariant: "events", throwError: error }).load()).rejects.toBeInstanceOf(ReportingFailure);
    safeWarning({ variant: "events", phase: "request", status: "unavailable" });
  });
  it("identifies configuration failure without exposing a configured property or requesting credentials", async () => {
    const { load, fetcher } = reporter({ config: { ...CONFIG, GOOGLE_REPORTING_PROPERTY_ID: PRIVATE } });
    await expect(load()).rejects.toBeInstanceOf(ReportingFailure);
    safeWarning({ variant: "totals", phase: "configuration", status: "unavailable" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
