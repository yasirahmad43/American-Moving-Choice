/** Provider transport stays server-side and never exposes provider payloads or errors. */
export class ReportingFailure extends Error {
  constructor(
    readonly status: "not_configured" | "access_denied" | "unavailable",
    readonly retryAfterMs?: number,
    readonly httpStatus?: number,
  ) {
    super("Reporting request failed");
    this.name = "ReportingFailure";
  }
}

const HOSTS = new Set([
  "oauth2.googleapis.com", "analyticsdata.googleapis.com", "www.googleapis.com",
  "tagmanager.googleapis.com", "www.bing.com",
  "sts.googleapis.com", "iamcredentials.googleapis.com",
]);
const MAX_BYTES = 262_144;
const TIMEOUT_MS = 5_000;

function retryDelay(value: string | null): number | undefined {
  if (!value) return undefined;
  const delay = /^\d{1,6}$/.test(value) ? Number(value) * 1000
    : /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value) ? Date.parse(value) - Date.now() : NaN;
  return Number.isFinite(delay) ? Math.min(21_600_000, Math.max(5_000, delay)) : undefined;
}

async function boundedJson(response: Response): Promise<unknown> {
  const length = Number(response.headers.get("content-length") ?? 0);
  if (!Number.isFinite(length) || length > MAX_BYTES) throw new ReportingFailure("unavailable");
  if (!response.body) throw new ReportingFailure("unavailable");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new ReportingFailure("unavailable");
      }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

/** GTM (and some Google APIs) use 403 for quota as well as permission errors. */
function isQuotaFailure(value: unknown): boolean {
  try {
    const error = record(record(value).error);
    if (error.status === "RESOURCE_EXHAUSTED") return true;
    const reasons = new Set(["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded", "dailyLimitExceeded", "RATE_LIMIT_EXCEEDED", "QUOTA_EXCEEDED"]);
    return [error.errors, error.details].some((entries) => Array.isArray(entries) && entries.some((entry) => reasons.has(String(record(entry).reason))));
  } catch { return false; }
}

export async function readReportingJson(
  fetcher: typeof globalThis.fetch,
  address: string,
  init: RequestInit = {},
): Promise<unknown> {
  const url = new URL(address);
  if (url.protocol !== "https:" || !HOSTS.has(url.hostname) || url.username || url.password || url.hash) {
    throw new ReportingFailure("unavailable");
  }
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ReportingFailure("unavailable"));
    }, TIMEOUT_MS);
    timer.unref?.();
  });
  const request = async (): Promise<unknown> => {
    const response = await fetcher(url.toString(), {
      ...init, signal: controller.signal, redirect: "error", cache: "no-store",
    });
    if (response.status === 401) {
      throw new ReportingFailure("access_denied", undefined, response.status);
    }
    if (response.status === 403) {
      let quota = false;
      try { quota = isQuotaFailure(await boundedJson(response)); } catch { /* Raw error bodies never leave the transport. */ }
      if (quota) throw new ReportingFailure("unavailable", retryDelay(response.headers.get("retry-after")) ?? 60_000, response.status);
      throw new ReportingFailure("access_denied", undefined, response.status);
    }
    if (!response.ok) {
      throw new ReportingFailure("unavailable", retryDelay(response.headers.get("retry-after")), response.status);
    }
    return boundedJson(response);
  };
  try {
    return await Promise.race([request(), timeout]);
  } catch (error) {
    if (error instanceof ReportingFailure) throw error;
    throw new ReportingFailure("unavailable");
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ReportingFailure("unavailable");
  return value as Record<string, unknown>;
}

export function count(value: unknown): number {
  const number = typeof value === "number" ? value : typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : NaN;
  if (!Number.isFinite(number) || number < 0 || number > Number.MAX_SAFE_INTEGER) throw new ReportingFailure("unavailable");
  return number;
}

/** Configured public site identifiers only; no credentials, queries or fragments can be returned. */
export function reportingSiteUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new ReportingFailure("unavailable");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}/`;
}

export function publicProviderUrl(value: unknown, site: string): string {
  if (typeof value !== "string" || value.length > 2048) throw new ReportingFailure("unavailable");
  const url = new URL(value);
  const canonical = new URL(site);
  if (url.protocol !== "https:" || url.origin !== canonical.origin || url.username || url.password || url.search || url.hash) {
    throw new ReportingFailure("unavailable");
  }
  return url.toString();
}

export function dateTime(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new ReportingFailure("unavailable");
  const calendar = value.slice(0, 10);
  const calendarDate = new Date(`${calendar}T00:00:00Z`);
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== calendar) throw new ReportingFailure("unavailable");
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new ReportingFailure("unavailable");
  return new Date(milliseconds).toISOString();
}
