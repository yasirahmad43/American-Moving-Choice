/** First-party campaign metadata only. Never add contact fields or survey answers here. */
export const ATTRIBUTION_CLICK_KEYS = ["gclid", "gbraid", "wbraid", "msclkid", "fbclid"] as const;
export type AttributionClickKey = typeof ATTRIBUTION_CLICK_KEYS[number];
export interface AttributionTouch {
  landingPath?: string | null;
  referrerOrigin?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  clickIds?: Partial<Record<AttributionClickKey, string>>;
  device?: "mobile" | "tablet" | "desktop" | null;
}
/** Legacy top-level fields are accepted from older deployed survey clients. */
export interface AttributionPayload extends AttributionTouch { first?: AttributionTouch; last?: AttributionTouch }
export interface AttributionHistory { version: 1; startedAt: number; first: AttributionTouch; last: AttributionTouch }
export const ATTRIBUTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const UTM_FIELDS = ["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent"] as const;
const STATIC_PATHS = new Set(["/", "/about/", "/contact/", "/privacy/", "/terms/", "/complaints/", "/report-a-concern/", "/verify-a-mover/", "/get-quotes/", "/moving-cost-calculator/", "/moving-cost-calculator/method/", "/which-companies-receive-my-request/", "/how-we-verify-movers/", "/movers-vs-brokers/", "/review-methodology/", "/editorial-policy/", "/explore/"]);

const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
function origin(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try { const url = new URL(value); return /^https?:$/u.test(url.protocol) && !url.username && !url.password ? url.origin : null; } catch { return null; }
}
function ownOrigin(value: string, ownOrigins: readonly string[]): boolean {
  const url = new URL(value);
  return ownOrigins.some(own => { try { const trusted = new URL(own); return url.protocol === trusted.protocol && url.port === trusted.port && url.hostname.replace(/^www\./u, "") === trusted.hostname.replace(/^www\./u, ""); } catch { return false; } });
}
export function cleanReferrerOrigin(value: unknown, ownOrigins: readonly string[] = []): string | null {
  const parsed = origin(value);
  return parsed && !ownOrigin(parsed, ownOrigins) ? parsed : null;
}
/** URLs lose every query/hash; private/token routes and unknown paths are never retained. */
export function cleanAttributionPath(value: unknown, ownOrigins: readonly string[] = []): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  let path = value;
  if (/^https?:\/\//iu.test(path)) {
    const parsed = origin(path);
    if (!parsed || !ownOrigin(parsed, ownOrigins)) return null;
    try { path = new URL(path).pathname; } catch { return null; }
  } else path = path.split(/[?#]/u, 1)[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 300 || !/^\/[a-z0-9/-]*$/u.test(path)) return null;
  if (path !== "/" && !path.endsWith("/")) path += "/";
  if (STATIC_PATHS.has(path) || /^\/(?:movers|routes|services|planning|questions|moving-costs)\/(?:[a-z0-9-]+\/)*$/u.test(path)) return path;
  return null;
}
/** Keep bounded campaign labels, rejecting obvious contact data rather than transforming it. */
export function cleanCampaignLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const label = value.trim();
  if (!label || label.length > 100 || /@|https?:|www\.|[<>\\]|sk-ant-|sb_secret_|github_pat_|\b(?:email|phone|address|originZip|destZip)=/iu.test(label)) return null;
  if (!/^\d+$/u.test(label) && /(?:\+?1[ .()-]*)?(?:\(?\d{3}\)?[ .()-]*)\d{3}[ .()-]*\d{4}\b/u.test(label)) return null;
  return /^[A-Za-z0-9 ._~+\-]+$/u.test(label) ? label : null;
}
export function cleanAttributionTouch(value: unknown, ownOrigins: readonly string[] = []): AttributionTouch {
  const input = record(value), output: AttributionTouch = {
    landingPath: cleanAttributionPath(input.landingPath, ownOrigins), referrerOrigin: cleanReferrerOrigin(input.referrerOrigin, ownOrigins),
  };
  for (const field of UTM_FIELDS) output[field] = cleanCampaignLabel(input[field]);
  const clicks = record(input.clickIds), clickIds: NonNullable<AttributionTouch["clickIds"]> = {};
  for (const key of ATTRIBUTION_CLICK_KEYS) {
    const candidate = clicks[key];
    if (typeof candidate === "string" && candidate.length >= 10 && candidate.length <= 512 && /^[A-Za-z0-9_-]+$/u.test(candidate) && !/sk-ant-|sb_secret_|github_pat_/iu.test(candidate)
      && (key === "msclkid" ? /^[a-f0-9]{32}$/iu.test(candidate) : !/^\d+$/u.test(candidate))) clickIds[key] = candidate;
  }
  if (Object.keys(clickIds).length) output.clickIds = clickIds;
  if (["mobile", "tablet", "desktop"].includes(String(input.device))) output.device = input.device as AttributionTouch["device"];
  return output;
}
export function hasCampaign(touch: AttributionTouch): boolean { return UTM_FIELDS.some(key => Boolean(touch[key])) || Boolean(touch.clickIds && Object.keys(touch.clickIds).length); }
export function isAcquisitionTouch(touch: AttributionTouch): boolean { return hasCampaign(touch) || Boolean(touch.referrerOrigin); }
export function readAttributionHistory(value: unknown, ownOrigins: readonly string[], now = Date.now()): AttributionHistory | null {
  const input = record(value);
  if (input.version !== 1 || typeof input.startedAt !== "number" || !Number.isFinite(input.startedAt) || input.startedAt > now + 60000 || now - input.startedAt > ATTRIBUTION_MAX_AGE_MS || !input.first || !input.last) return null;
  return { version: 1, startedAt: input.startedAt, first: cleanAttributionTouch(input.first, ownOrigins), last: cleanAttributionTouch(input.last, ownOrigins) };
}
/** First touch stays fixed; direct/internal navigation never erases the latest acquisition. */
export function updateAttributionHistory(previous: unknown, touch: AttributionTouch, ownOrigins: readonly string[], now = Date.now()): AttributionHistory {
  const history = readAttributionHistory(previous, ownOrigins, now), current = cleanAttributionTouch(touch, ownOrigins);
  if (!history) return { version: 1, startedAt: now, first: current, last: current };
  return { ...history, last: isAcquisitionTouch(current) ? current : history.last };
}
/** Server boundary: normalize old and new clients into the existing two database touch rows. */
export function normalizeAttributionPayload(value: unknown, ownOrigins: readonly string[], fallbackPath = "/get-quotes/"): { first: AttributionTouch; last: AttributionTouch } {
  const input = record(value);
  const first = cleanAttributionTouch(input.first ?? input, ownOrigins), last = cleanAttributionTouch(input.last ?? input.first ?? input, ownOrigins);
  const fallback = cleanAttributionPath(fallbackPath, ownOrigins) ?? "/get-quotes/";
  return { first: { ...first, landingPath: first.landingPath ?? fallback }, last: { ...last, landingPath: last.landingPath ?? fallback } };
}
