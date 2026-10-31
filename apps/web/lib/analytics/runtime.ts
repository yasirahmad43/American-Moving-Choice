import { readAnalyticsConsent } from "./consent";
import { analyticsPayload, publicAnalyticsPath, type AnalyticsPlacement, type AnalyticsStep } from "./events";

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } }
const START_KEY = "amc.analytics.survey-started";
const DENIED = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
let context: { id: string; origin: string; lastPage: string | null; lastStep: string | null; leadSent: boolean; navigationScheduled: boolean } | null = null;
let started = false;
export const ANALYTICS_SCRIPT_ID = "amc-google-tag-manager";

const currentPath = () => typeof window === "undefined" ? null : publicAnalyticsPath(window.location.pathname);
export function analyticsLoaded(): boolean { return Boolean(context); }
function push(payload: Record<string, unknown>): boolean {
  if (!context || typeof window === "undefined" || readAnalyticsConsent() !== "granted" || !currentPath()) return false;
  window.dataLayer?.push(payload); return true;
}
export function initializeAnalytics(id: string, origin: string): boolean {
  if (context) return true;
  if (typeof window === "undefined" || !/^GTM-[A-Z0-9]{4,16}$/u.test(id) || readAnalyticsConsent() !== "granted" || !currentPath()) return false;
  const base = analyticsPayload("page_view", window.location.pathname, origin, document.referrer);
  if (!base) return false;
  context = { id, origin: new URL(origin).origin, lastPage: null, lastStep: null, leadSent: false, navigationScheduled: false };
  window.dataLayer ??= [];
  window.gtag ??= function (..._args: unknown[]) { window.dataLayer!.push(arguments); };
  window.gtag("consent", "default", DENIED);
  window.gtag("set", { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  window.gtag("consent", "update", { ...DENIED, analytics_storage: "granted" });
  const { event: _event, ...page } = base;
  // The GTM Consent Initialization template reads this literal before measurement can start.
  window.dataLayer.push({ amc_analytics_consent: "granted" }, page, { "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = ANALYTICS_SCRIPT_ID; script.async = true; script.referrerPolicy = "origin";
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  document.head.appendChild(script);
  return true;
}
export function trackPageView(): boolean {
  if (!context || typeof window === "undefined") return false;
  const path = currentPath(); if (!path || context.lastPage === path) return false;
  const payload = analyticsPayload("page_view", path, context.origin, document.referrer);
  if (!payload || !push(payload)) return false;
  const { event: _event, ...fields } = payload;
  window.gtag?.("set", fields);
  context.lastPage = path; return true;
}
export function trackSurveyStart(placement: AnalyticsPlacement): boolean {
  if (!context || typeof window === "undefined") return false;
  try { if (window.sessionStorage.getItem(START_KEY) === "1") started = true; } catch { /* memory fallback */ }
  if (started) return false;
  const payload = analyticsPayload("survey_start", window.location.pathname, context.origin, document.referrer, { placement });
  if (!payload || !push(payload)) return false;
  started = true; try { window.sessionStorage.setItem(START_KEY, "1"); } catch { /* optional metrics */ }
  return true;
}
export function trackSurveyStep(step: AnalyticsStep, placement: AnalyticsPlacement): boolean {
  if (!context || typeof window === "undefined" || context.lastStep === `${placement}:${step}`) return false;
  const payload = analyticsPayload("survey_step", window.location.pathname, context.origin, document.referrer, { step, placement });
  if (!payload || !push(payload)) return false;
  context.lastStep = `${placement}:${step}`; return true;
}
/** Call only from the server-success branch. No request identifier or answer is accepted. */
export function completeLeadAnalytics(accepted: boolean, navigate: () => void): boolean {
  if (accepted !== true || !context || typeof window === "undefined") return false;
  if (context.navigationScheduled) return true;
  context.navigationScheduled = true;
  let completed = false;
  const finish = () => { if (!completed) { completed = true; navigate(); } };
  if (!context.leadSent) {
    const payload = analyticsPayload("generate_lead", window.location.pathname, context.origin, document.referrer);
    if (payload && push({ ...payload, eventCallback: finish, eventTimeout: 400 })) context.leadSent = true;
  }
  started = false; try { window.sessionStorage.removeItem(START_KEY); } catch { /* optional metrics */ }
  // A fresh private document contains no GTM runtime; the success cookie already exists.
  window.setTimeout(finish, 400);
  return true;
}
export function revokeAnalytics(): void {
  if (typeof window === "undefined") return;
  const loaded = Boolean(context);
  if (loaded) {
    // Internal consent control only; no GA4 measurement trigger listens to this event.
    window.dataLayer?.push({ event: "amc_analytics_consent_update", amc_analytics_consent: "denied" });
    window.gtag?.("consent", "update", DENIED);
  }
  started = false;
  try { window.sessionStorage.removeItem(START_KEY); } catch { /* optional metrics */ }
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0] ?? "";
    if (!/^_ga(?:_|$)|^_gid$|^_gat/iu.test(name)) continue;
    const domains = ["", window.location.hostname, `.${window.location.hostname}`, `.${window.location.hostname.split(".").slice(-2).join(".")}`];
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
  }
  if (loaded) window.location.reload();
}
