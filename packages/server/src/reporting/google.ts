import { createPrivateKey, sign, type KeyObject } from "node:crypto";
import type { ReportResult } from "./cache";
import { count, dateTime, publicProviderUrl, readReportingJson, record, reportingSiteUrl, ReportingFailure } from "./http";
import { REPORTING_EVENTS, type Ga4ReportingData, type ReportingConfiguration, type ReportingEvent, type SearchConsoleReportingData, type TagManagerReportingData } from "./types";
import { exchangeGoogleFederation, GOOGLE_REPORTING_SCOPES, normalizeGoogleFederationAudience, type GoogleSubjectTokenSupplier } from "./google-federation";
export { GOOGLE_REPORTING_SCOPES } from "./google-federation";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const isNumericId = (value: string): boolean => /^\d{1,20}$/.test(value);
const wholeCount = (value: unknown): number => {
  const result = count(value);
  if (!Number.isInteger(result)) throw new ReportingFailure("unavailable");
  return result;
};

export function hasGoogleCredentials(config: ReportingConfiguration): boolean {
  return Boolean(config.GOOGLE_REPORTING_CLIENT_EMAIL?.trim() &&
    (config.GOOGLE_REPORTING_PRIVATE_KEY?.trim() || normalizeGoogleFederationAudience(config.GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE)));
}

class GoogleReadClient {
  private token: { value: string; expiresAt: number } | undefined;
  private pending: Promise<string> | undefined;
  private key: KeyObject | undefined;

  constructor(
    private readonly config: ReportingConfiguration,
    private readonly fetcher: typeof globalThis.fetch,
    private readonly now: () => number,
    private readonly subjectTokenSupplier?: GoogleSubjectTokenSupplier,
  ) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.now() < this.token.expiresAt) return this.token.value;
    this.pending ??= this.exchange().finally(() => { this.pending = undefined; });
    return this.pending;
  }

  private async exchange(): Promise<string> {
    try {
      // Configured federation is authoritative. A failure must never fall back to a private key.
      if (this.config.GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE?.trim()) {
        this.token = await exchangeGoogleFederation(this.config, { fetch: this.fetcher, now: this.now, subjectTokenSupplier: this.subjectTokenSupplier });
        return this.token.value;
      }
      const email = this.config.GOOGLE_REPORTING_CLIENT_EMAIL ?? "";
      if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.iam\.gserviceaccount\.com$/.test(email)) throw new ReportingFailure("access_denied");
      this.key ??= createPrivateKey((this.config.GOOGLE_REPORTING_PRIVATE_KEY ?? "").replaceAll("\\n", "\n"));
      if (this.key.asymmetricKeyType !== "rsa" || (this.key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) {
        throw new ReportingFailure("access_denied");
      }
      const seconds = Math.floor(this.now() / 1000);
      const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({
        iss: email, scope: GOOGLE_REPORTING_SCOPES.join(" "), aud: TOKEN_URL, iat: seconds, exp: seconds + 3600,
      })).toString("base64url");
      const unsigned = `${header}.${payload}`;
      const assertion = `${unsigned}.${sign("RSA-SHA256", Buffer.from(unsigned), this.key).toString("base64url")}`;
      const token = record(await readReportingJson(this.fetcher, TOKEN_URL, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString(),
      }));
      const value = token.access_token;
      const expires = count(token.expires_in);
      if (typeof value !== "string" || value.length < 16 || value.length > 4096 || !/^[A-Za-z0-9._~+/-]+=*$/.test(value) ||
          token.token_type !== "Bearer" || expires < 60 || expires > 7200) throw new ReportingFailure("access_denied");
      this.token = { value, expiresAt: this.now() + Math.min(expires, 3600) * 1000 - 60_000 };
      return value;
    } catch (error) {
      this.token = undefined;
      if (error instanceof ReportingFailure && error.httpStatus !== 400) throw error;
      throw new ReportingFailure("access_denied");
    }
  }

  async read(url: string, body?: unknown): Promise<Record<string, unknown>> {
    const token = await this.accessToken();
    try {
      return record(await readReportingJson(this.fetcher, url, {
        method: body === undefined ? "GET" : "POST",
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }));
    } catch (error) {
      if (error instanceof ReportingFailure && error.status === "access_denied") this.token = undefined;
      throw error;
    }
  }
}

function rows(value: unknown, maximum: number): Record<string, unknown>[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maximum) throw new ReportingFailure("unavailable");
  return value.map(record);
}

/** Require the exact unique metric set, then read values by their response-column indexes. */
function metricHeaderIndexes(response: Record<string, unknown>, names: readonly string[]): number[] {
  if (!Array.isArray(response.metricHeaders) || response.metricHeaders.length !== names.length) throw new ReportingFailure("unavailable");
  const indexes = new Map<string, number>();
  response.metricHeaders.forEach((header, index) => {
    const name = record(header).name;
    if (typeof name !== "string" || !names.includes(name) || indexes.has(name)) throw new ReportingFailure("unavailable");
    indexes.set(name, index);
  });
  return names.map(name => {
    const index = indexes.get(name);
    if (index === undefined) throw new ReportingFailure("unavailable");
    return index;
  });
}

function metricValues(row: Record<string, unknown>, indexes: readonly number[]): number[] {
  if (!Array.isArray(row.metricValues) || row.metricValues.length !== indexes.length) throw new ReportingFailure("unavailable");
  const values = row.metricValues.map(value => wholeCount(record(value).value));
  return indexes.map(index => values[index]!);
}

type Ga4Variant = "totals" | "events";
type Ga4Phase = "configuration" | "request" | "metric_headers" | "rows" | "dimension_values" | "metric_values";
interface Ga4HeaderShape {
  metricHeadersShape: "missing" | "array" | "other";
  metricHeaderCount: number;
  metricHeaderNames: ("activeUsers" | "screenPageViews" | "eventCount" | "other")[];
  rowCountType: "missing" | "number" | "string" | "boolean" | "null" | "array" | "object" | "other";
}
function ga4HeaderShape(response: Record<string, unknown>): Ga4HeaderShape {
  const headers = response.metricHeaders;
  const kind = !Object.hasOwn(response, "metricHeaders") ? "missing" : Array.isArray(headers) ? "array" : "other";
  const rowCount = response.rowCount;
  const rowCountType = !Object.hasOwn(response, "rowCount") ? "missing" : rowCount === null ? "null" : Array.isArray(rowCount) ? "array"
    : typeof rowCount === "number" || typeof rowCount === "string" || typeof rowCount === "boolean" || typeof rowCount === "object" ? typeof rowCount : "other";
  return {
    metricHeadersShape: kind, metricHeaderCount: Array.isArray(headers) ? Math.min(headers.length, 10) : 0,
    metricHeaderNames: Array.isArray(headers) ? headers.slice(0, 10).map(header => {
      const name = header !== null && typeof header === "object" && !Array.isArray(header) ? (header as Record<string, unknown>).name : undefined;
      return name === "activeUsers" || name === "screenPageViews" || name === "eventCount" ? name : "other";
    }) : [],
    rowCountType: rowCountType as Ga4HeaderShape["rowCountType"],
  };
}
function ga4Failure(variant: Ga4Variant, phase: Ga4Phase, error: unknown, headerShape?: Ga4HeaderShape): void {
  const diagnostic: { variant: Ga4Variant; phase: Ga4Phase; status: ReportingFailure["status"]; httpStatus?: number } & Partial<Ga4HeaderShape> = { variant, phase, status: "unavailable", ...headerShape };
  if (error instanceof ReportingFailure) {
    if (["not_configured", "access_denied", "unavailable"].includes(error.status)) diagnostic.status = error.status;
    const http = error.httpStatus;
    if (typeof http === "number" && Number.isInteger(http) && http >= 100 && http <= 599) diagnostic.httpStatus = http;
  }
  // Fixed enums, bounded integers/recognized column names only; never errors, rows or values.
  console.warn("reporting_ga4_failure", diagnostic);
}
function ga4Parse<T>(variant: Ga4Variant, phase: Ga4Phase, parse: () => T, headerResponse?: Record<string, unknown>): T {
  try { return parse(); }
  catch (error) { ga4Failure(variant, phase, error, phase === "metric_headers" && headerResponse ? ga4HeaderShape(headerResponse) : undefined); throw error; }
}

function pacificDate(milliseconds: number): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(milliseconds);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
}

function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export function createGoogleReporters(
  config: ReportingConfiguration,
  dependencies: { fetch: typeof globalThis.fetch; now: () => number; subjectTokenSupplier?: GoogleSubjectTokenSupplier },
): {
  ga4: () => Promise<ReportResult<Ga4ReportingData>>;
  searchConsole: () => Promise<ReportResult<SearchConsoleReportingData>>;
  tagManager: () => Promise<ReportResult<TagManagerReportingData>>;
} {
  const client = new GoogleReadClient(config, dependencies.fetch, dependencies.now, dependencies.subjectTokenSupplier);
  const site = (): string => reportingSiteUrl(config.WEB_URL);
  const searchSite = (): string => {
    const configured = config.GOOGLE_REPORTING_SITE_URL;
    if (!configured) return site();
    if (configured.startsWith("sc-domain:")) {
      const domain = configured.slice("sc-domain:".length);
      const hostname = new URL(site()).hostname;
      if (!/^[A-Za-z0-9.-]+$/.test(domain) || !(hostname === domain || hostname.endsWith(`.${domain}`))) throw new ReportingFailure("unavailable");
      return configured;
    }
    const parsed = reportingSiteUrl(configured);
    if (new URL(parsed).origin !== new URL(site()).origin) throw new ReportingFailure("unavailable");
    return parsed;
  };

  return {
    ga4: async () => {
      const property = config.GOOGLE_REPORTING_PROPERTY_ID ?? "561692313";
      ga4Parse("totals", "configuration", () => {
        if (!isNumericId(property)) throw new ReportingFailure("unavailable");
      });
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runRealtimeReport`;
      const read = async (variant: Ga4Variant, body: unknown) => {
        try { return await client.read(url, body); }
        catch (error) { ga4Failure(variant, "request", error); throw error; }
      };
      // Unique active users must come from an ungrouped report, never a sum of per-event users.
      const [totals, byEvent] = await Promise.all([
        read("totals", { metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }], returnPropertyQuota: true }),
        read("events", {
          dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }],
          dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: [...REPORTING_EVENTS], caseSensitive: true } } },
          limit: "4", returnPropertyQuota: true,
        }),
      ]);
      const totalIndexes = ga4Parse("totals", "metric_headers", () => metricHeaderIndexes(totals, ["activeUsers", "screenPageViews"]), totals);
      const eventIndexes = ga4Parse("events", "metric_headers", () => metricHeaderIndexes(byEvent, ["eventCount"]), byEvent);
      const totalRows = ga4Parse("totals", "rows", () => rows(totals.rows, 1));
      const values = ga4Parse("totals", "metric_values", () => totalRows.length ? metricValues(totalRows[0]!, totalIndexes) : [0, 0]);
      const events = Object.fromEntries(REPORTING_EVENTS.map((name) => [name, 0])) as Record<ReportingEvent, number>;
      const seen = new Set<string>();
      for (const row of ga4Parse("events", "rows", () => rows(byEvent.rows, 4))) {
        const event = ga4Parse("events", "dimension_values", () => {
          if (!Array.isArray(row.dimensionValues) || row.dimensionValues.length !== 1) throw new ReportingFailure("unavailable");
          const value = record(row.dimensionValues[0]).value;
          if (typeof value !== "string" || !REPORTING_EVENTS.includes(value as ReportingEvent) || seen.has(value)) throw new ReportingFailure("unavailable");
          return value;
        });
        seen.add(event);
        events[event as ReportingEvent] = ga4Parse("events", "metric_values", () => metricValues(row, eventIndexes)[0]!);
      }
      return { data: { windowMinutes: 30, activeUsers: values[0]!, screenPageViews: values[1]!, events }, reportedThrough: null };
    },

    searchConsole: async () => {
      const property = searchSite();
      const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}`;
      const today = pacificDate(dependencies.now());
      // Discover the latest date actually returned as final rather than labeling yesterday complete.
      const recent = await client.read(`${base}/searchAnalytics/query`, {
        startDate: shiftDate(today, -10), endDate: shiftDate(today, -1), dimensions: ["date"],
        dataState: "final", type: "web", rowLimit: 10,
      });
      const available = rows(recent.rows, 10).map((row) => {
        if (!Array.isArray(row.keys) || row.keys.length !== 1 || typeof row.keys[0] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.keys[0])) throw new ReportingFailure("unavailable");
        const date = row.keys[0];
        const timestamp = Date.parse(`${date}T00:00:00Z`);
        if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date ||
            date < shiftDate(today, -10) || date > shiftDate(today, -1)) throw new ReportingFailure("unavailable");
        return date;
      }).sort();
      const latest = available.at(-1) ?? null;
      const endDate = latest ?? shiftDate(today, -3);
      const startDate = shiftDate(endDate, -27);
      const [performance, maps] = await Promise.all([
        client.read(`${base}/searchAnalytics/query`, { startDate, endDate, dataState: "final", type: "web", rowLimit: 1 }),
        client.read(`${base}/sitemaps`),
      ]);
      const aggregate = rows(performance.rows, 1)[0];
      const clicks = aggregate ? count(aggregate.clicks) : 0;
      const impressions = aggregate ? count(aggregate.impressions) : 0;
      const ctr = aggregate && impressions > 0 ? count(aggregate.ctr) : null;
      const position = aggregate && impressions > 0 ? count(aggregate.position) : null;
      if (ctr !== null && ctr > 1) throw new ReportingFailure("unavailable");
      const sitemaps = rows(maps.sitemap, 200).map((entry) => {
        const contents = rows(entry.contents, 20);
        const path = publicProviderUrl(entry.path, site());
        if (!/^\/(?:sitemap\.xml|sitemaps\/(?:core|states|cities(?:-[1-9]\d*)?|zips|routes(?:-[1-9]\d*)?|services|costs|questions|planning)\.xml)$/.test(new URL(path).pathname)) {
          throw new ReportingFailure("unavailable");
        }
        return {
          path,
          lastSubmitted: dateTime(entry.lastSubmitted), lastDownloaded: dateTime(entry.lastDownloaded),
          isPending: entry.isPending === true,
          errors: wholeCount(entry.errors ?? 0), warnings: wholeCount(entry.warnings ?? 0),
          submittedUrls: wholeCount(contents.filter((content) => content.type === "web").reduce((sum, content) => sum + wholeCount(content.submitted), 0)),
        };
      });
      return { data: { siteUrl: property, startDate, endDate, clicks, impressions, ctr, position, sitemaps }, reportedThrough: latest };
    },

    tagManager: async () => {
      const account = config.GOOGLE_REPORTING_GTM_ACCOUNT_ID ?? "6401413548";
      const container = config.GOOGLE_REPORTING_GTM_CONTAINER_ID ?? "284497986";
      if (!isNumericId(account) || !isNumericId(container)) throw new ReportingFailure("unavailable");
      const response = await client.read(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${account}/containers/${container}/versions:live`);
      if (typeof response.containerVersionId !== "string" || !isNumericId(response.containerVersionId)) throw new ReportingFailure("unavailable");
      const tags = rows(response.tag, 1000);
      return { data: { versionId: response.containerVersionId, tagCount: tags.length }, reportedThrough: null };
    },
  };
}
