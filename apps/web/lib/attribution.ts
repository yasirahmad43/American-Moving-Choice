"use client";

import { ATTRIBUTION_CLICK_KEYS, cleanAttributionPath, cleanAttributionTouch, readAttributionHistory, updateAttributionHistory, type AttributionHistory, type AttributionPayload } from "@amc/core";
import { readAnalyticsConsent } from "./analytics/consent";

export const ATTRIBUTION_STORAGE_KEY = "amc:campaign-attribution:v1";
export const ATTRIBUTION_COOKIE = "amc_campaign_attribution";
let ownOrigins: string[] = [];
let history: AttributionHistory | null = null;
let documentReferrerRead = false;
let lastCaptureSignature = "";
const AGE_SECONDS = 30 * 24 * 60 * 60;

/** Share only between explicitly configured owned hosts, never hosted-platform tenants. */
export function attributionCookieDomain(hostname: string, origins: readonly string[]): string | null {
  const hosts = [...new Set(origins.flatMap(value => { try { return [new URL(value).hostname]; } catch { return []; } }))];
  if (hosts.length < 2 || !hosts.includes(hostname)) return null;
  const reversed = hosts.map(host => host.split(".").reverse());
  const common: string[] = [];
  for (let i = 0; i < (reversed[0]?.length ?? 0); i++) { const part = reversed[0]?.[i]; if (!part || !reversed.every(host => host[i] === part)) break; common.push(part); }
  const domain = common.reverse().join(".");
  if (common.length < 2 || /^(?:vercel\.app|netlify\.app|pages\.dev|github\.io|herokuapp\.com)$/u.test(domain) || /^(?:co|com|org|net|gov|ac)\.[a-z]{2}$/u.test(domain)) return null;
  return domain;
}
export function configureAttributionOrigins(origins: readonly string[]): void {
  const before = ownOrigins.join("\n");
  ownOrigins = [...new Set([...origins, ...(typeof window === "undefined" ? [] : [window.location.origin])])];
  // A starter can capture before the page observer supplies the portal origin.
  // Upgrade its host cookie once the full owned-domain configuration is known.
  if (history && before !== ownOrigins.join("\n") && readAnalyticsConsent() === "granted") {
    const safe = readAttributionHistory(history, ownOrigins);
    if (safe) persistHistory(safe);
  }
}
function cookieSuffix(shared: boolean): string {
  const domain = shared ? attributionCookieDomain(window.location.hostname, ownOrigins) : null;
  return `; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}${domain ? `; Domain=${domain}` : ""}`;
}
function readCookie(): string { try { return document.cookie; } catch { return ""; } }
function writeCookie(value: string): void { try { document.cookie = value; } catch { /* Optional storage cannot interrupt a request. */ } }
export function clearCampaignAttribution(): void {
  history = null; documentReferrerRead = false; lastCaptureSignature = "";
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
  for (const shared of [false, true]) writeCookie(`${ATTRIBUTION_COOKIE}=; Max-Age=0${cookieSuffix(shared)}`);
}
function storedHistory(now: number): AttributionHistory | null {
  if (history) return readAttributionHistory(history, ownOrigins, now);
  const candidates: string[] = [];
  try { const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY); if (stored) candidates.push(stored); } catch { /* Cookie or in-memory fallback remains usable. */ }
  for (const pair of readCookie().split(";")) {
    const [name, ...value] = pair.trim().split("=");
    if (name === ATTRIBUTION_COOKIE) { try { candidates.push(decodeURIComponent(value.join("="))); } catch { /* Ignore malformed cookies. */ } }
  }
  for (const candidate of candidates) {
    try { const parsed = readAttributionHistory(JSON.parse(candidate), ownOrigins, now); if (parsed) return parsed; } catch { /* Never trust a browser-storage shape. */ }
  }
  return null;
}
function persistHistory(value: AttributionHistory): void {
  history = value;
  const json = JSON.stringify(value);
  try { window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, json); } catch { /* The current page still retains its capture in memory. */ }
  const encoded = encodeURIComponent(json);
  // Never truncate click IDs or exceed the browser's cookie/header budget.
  if (encoded.length <= 3500) {
    if (attributionCookieDomain(window.location.hostname, ownOrigins)) writeCookie(`${ATTRIBUTION_COOKIE}=; Max-Age=0${cookieSuffix(false)}`);
    writeCookie(`${ATTRIBUTION_COOKIE}=${encoded}; Max-Age=${AGE_SECONDS}${cookieSuffix(true)}`);
  } else for (const shared of [false, true]) writeCookie(`${ATTRIBUTION_COOKIE}=; Max-Age=0${cookieSuffix(shared)}`);
}

/** Read only a campaign allowlist after opt-in; never retain a raw query, form value or token URL. */
export function captureCampaignAttribution(): AttributionPayload {
  if (typeof window === "undefined") return {};
  if (!ownOrigins.length) configureAttributionOrigins([window.location.origin]);
  if (readAnalyticsConsent() !== "granted") { clearCampaignAttribution(); return {}; }
  const path = cleanAttributionPath(window.location.pathname, ownOrigins);
  const now = Date.now();
  const previous = storedHistory(now);
  if (!path) return previous ? { first: previous.first, last: previous.last } : {};
  const params = new URLSearchParams(window.location.search);
  const clickIds = Object.fromEntries(ATTRIBUTION_CLICK_KEYS.flatMap(key => { const value = params.get(key); return value ? [[key, value]] : []; }));
  const touch = cleanAttributionTouch({
    landingPath: path, referrerOrigin: documentReferrerRead ? null : document.referrer,
    utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"), utmCampaign: params.get("utm_campaign"), utmTerm: params.get("utm_term"), utmContent: params.get("utm_content"), clickIds,
    device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
  }, ownOrigins);
  const { referrerOrigin: _referrer, device: _device, ...identity } = touch;
  const signature = JSON.stringify(identity);
  if (previous && signature === lastCaptureSignature) return { first: previous.first, last: previous.last };
  lastCaptureSignature = signature;
  documentReferrerRead = true;
  const next = updateAttributionHistory(previous, touch, ownOrigins, now);
  persistHistory(next);
  return { first: next.first, last: next.last };
}
