import "server-only";

import { count, publicProviderUrl, readReportingJson, record, ReportingFailure, reportingSiteUrl } from "./http";
import type { BingReportingData, ReportingConfiguration } from "./types";

const TOKEN_URL = "https://www.bing.com/webmasters/oauth/token";
const API_URL = "https://www.bing.com/webmaster/api.svc/json/";
const PUBLIC_FEED_PATH = /^\/(?:sitemap\.xml|sitemaps\/[a-z]+(?:-[1-9][0-9]*)?\.xml)$/u;
const invalid = (): never => { throw new ReportingFailure("unavailable"); };

function credential(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 16_384 && !/[\x00-\x1f\x7f]/u.test(value);
}

export function hasBingCredentials(config: ReportingConfiguration): boolean {
  return [config.BING_REPORTING_CLIENT_ID, config.BING_REPORTING_CLIENT_SECRET, config.BING_REPORTING_REFRESH_TOKEN].every(credential);
}

export function hasBingAppCredentials(config: ReportingConfiguration): boolean {
  return [config.BING_REPORTING_CLIENT_ID, config.BING_REPORTING_CLIENT_SECRET].every(credential);
}

function siteUrl(value: string): string {
  try {
    // Even empty query/fragment delimiters, whitespace and URL-normalized traversal are unnecessary.
    if (value.length > 2_048 || /[?#%\\\s]/u.test(value)) return invalid();
    const site = reportingSiteUrl(value);
    if (value !== site && `${value}/` !== site) return invalid();
    return site;
  } catch { return invalid(); }
}

function rows(value: unknown, maximum: number): unknown[] {
  const result = record(value).d;
  if (!Array.isArray(result) || result.length > maximum) return invalid();
  return result;
}

function integer(value: unknown): number {
  const result = count(value);
  if (!Number.isSafeInteger(result)) return invalid();
  return result;
}

/** Bing's JSON interface documents .NET /Date(milliseconds-offset)/ values, not Unix seconds. */
function providerDate(value: unknown, now: number, optional = false): string | null {
  if (optional && (value === null || value === undefined || value === "")) return null;
  if (typeof value !== "string" || value.length > 64) return invalid();
  const legacy = /^\/Date\((-?\d{1,16})(?:([+-])(\d{2})(\d{2}))?\)\/$/u.exec(value);
  let milliseconds: number;
  if (legacy) {
    if (legacy[2] && (Number(legacy[3]) > 14 || Number(legacy[4]) > 59 || (Number(legacy[3]) === 14 && Number(legacy[4]) !== 0))) return invalid();
    milliseconds = Number(legacy[1]);
    // .NET's uninitialized DateTime.MinValue is not a crawl that actually happened.
    if (optional && milliseconds === -62_135_596_800_000) return null;
  } else {
    const iso = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/u.exec(value);
    if (!iso) return invalid();
    const year = Number(iso[1]), month = Number(iso[2]), day = Number(iso[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return invalid();
    milliseconds = Date.parse(value);
  }
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 0 || milliseconds > now + 86_400_000) return invalid();
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) return invalid();
  return date.toISOString();
}

function feedUrl(value: unknown, site: string): string {
  try {
    if (typeof value !== "string" || /[?#%\\\s]/u.test(value)) return invalid();
    const publicUrl = publicProviderUrl(value, site);
    if (value !== publicUrl || !PUBLIC_FEED_PATH.test(new URL(publicUrl).pathname)) return invalid();
    return publicUrl;
  } catch { return invalid(); }
}

function feedStatus(value: unknown): string {
  // Never reflect arbitrary provider text, email addresses, URLs or error payloads.
  if (typeof value !== "string" || !/^[A-Za-z][A-Za-z0-9 _-]{0,63}$/u.test(value)) return invalid();
  return value;
}

/** Two fixed read methods only. This adapter has no submission, mutation or API-key fallback. */
export function createBingReporter(
  config: ReportingConfiguration,
  deps: { fetch: typeof globalThis.fetch; now: () => number; accessToken?: () => Promise<string>; invalidateAccessToken?: () => Promise<void> },
): () => Promise<{ data: BingReportingData; reportedThrough: string | null }> {
  let token: { value: string; expiresAt: number } | undefined;
  let pendingToken: Promise<string> | undefined;
  let reconnectRequired = false;

  const refresh = async (): Promise<string> => {
    if (!hasBingCredentials(config) || reconnectRequired) throw new ReportingFailure("access_denied");
    if (token && deps.now() < token.expiresAt) return token.value;
    pendingToken ??= (async () => {
      const body = new URLSearchParams({
        client_id: config.BING_REPORTING_CLIENT_ID!, client_secret: config.BING_REPORTING_CLIENT_SECRET!,
        refresh_token: config.BING_REPORTING_REFRESH_TOKEN!, grant_type: "refresh_token",
      });
      let response: Record<string, unknown>;
      try {
        response = record(await readReportingJson(deps.fetch, TOKEN_URL, {
          method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body,
        }));
      } catch (error) {
        if (error instanceof ReportingFailure && [400, 401, 403].includes(error.httpStatus ?? 0)) throw new ReportingFailure("access_denied");
        throw error;
      }
      if (response.error !== undefined) throw new ReportingFailure("access_denied");
      // No durable credential writer is available here. A rotated token requires a secure reconnect;
      // it must never be silently discarded or returned in a reporting DTO/log.
      if (response.refresh_token !== undefined && response.refresh_token !== config.BING_REPORTING_REFRESH_TOKEN) {
        reconnectRequired = true;
        throw new ReportingFailure("access_denied");
      }
      if (response.scope !== undefined && (typeof response.scope !== "string" || response.scope.trim().toLowerCase() !== "webmaster.read")) throw new ReportingFailure("access_denied");
      const value = response.access_token, lifetime = response.expires_in;
      if (typeof value !== "string" || value.length > 16_384 || !/^[A-Za-z0-9._~+/-]+=*$/u.test(value)
        || typeof response.token_type !== "string" || response.token_type.toLowerCase() !== "bearer"
        || typeof lifetime !== "number" || !Number.isSafeInteger(lifetime) || lifetime < 1 || lifetime > 86_400) return invalid();
      // Cache at most one hour, refreshing slightly early even if the provider grants a longer life.
      const cacheMs = Math.min(lifetime, 3_600) * 1_000;
      token = { value, expiresAt: deps.now() + cacheMs - Math.min(30_000, cacheMs / 10) };
      return value;
    })().finally(() => { pendingToken = undefined; });
    return pendingToken;
  };

  return async () => {
    try {
      // Validate before transmitting credentials or making any provider request.
      const site = siteUrl(config.BING_REPORTING_SITE_URL ?? config.WEB_URL);
      const bearer = deps.accessToken ? await deps.accessToken() : await refresh();
      const read = (method: "GetRankAndTrafficStats" | "GetFeeds") => readReportingJson(deps.fetch,
        `${API_URL}${method}?${new URLSearchParams({ siteUrl: site })}`, {
          method: "GET", headers: { authorization: `Bearer ${bearer}`, accept: "application/json" },
        });
      const [trafficResult, feedResult] = await Promise.all([read("GetRankAndTrafficStats"), read("GetFeeds")]);
      const now = deps.now();
      const seenDates = new Set<string>();
      const traffic = rows(trafficResult, 4_000).map(value => {
        const row = record(value), date = providerDate(row.Date, now)!.slice(0, 10);
        if (seenDates.has(date)) return invalid();
        seenDates.add(date);
        return { date, clicks: integer(row.Clicks), impressions: integer(row.Impressions) };
      }).sort((a, b) => a.date.localeCompare(b.date));
      const seenFeeds = new Set<string>();
      const feeds = rows(feedResult, 1_000).map(value => {
        const row = record(value), url = feedUrl(row.Url, site);
        if (seenFeeds.has(url)) return invalid();
        seenFeeds.add(url);
        return {
          url, status: feedStatus(row.Status), lastCrawled: providerDate(row.LastCrawled, now, true),
          submitted: providerDate(row.Submitted, now, true), urlCount: integer(row.UrlCount),
        };
      }).sort((a, b) => a.url.localeCompare(b.url));
      return { data: { siteUrl: site, traffic, feeds }, reportedThrough: traffic.at(-1)?.date ?? null };
    } catch (error) {
      if (error instanceof ReportingFailure) {
        if (error.status === "access_denied") {
          token = undefined;
          // Do not retain a rejected stored access token across serverless instances.
          if (deps.invalidateAccessToken) await deps.invalidateAccessToken();
        }
        throw error;
      }
      throw new ReportingFailure("unavailable");
    }
  };
}
