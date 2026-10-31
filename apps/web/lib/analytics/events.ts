export const ANALYTICS_STEPS = ["move_type", "route", "date", "services", "contact", "review"] as const;
export type AnalyticsStep = typeof ANALYTICS_STEPS[number];
export type AnalyticsPlacement = "starter" | "hero_zip" | "survey";
export type AnalyticsEventName = "page_view" | "survey_start" | "survey_step" | "generate_lead";
const STATIC_PATHS = new Set(["/", "/about/", "/contact/", "/privacy/", "/terms/", "/get-quotes/", "/moving-costs/", "/moving-cost-calculator/", "/moving-cost-calculator/method/", "/how-it-works/", "/how-we-verify-movers/", "/verify-a-mover/", "/review-methodology/", "/editorial-policy/", "/which-companies-receive-my-request/", "/movers-vs-brokers/", "/services/", "/movers/", "/routes/", "/questions/", "/planning/", "/explore/"]);
const PRIVATE = /^\/(?:my-request|admin|api|login|auth|account|report-a-concern|complaints|companies|directory|for-movers|mover-terms)(?:\/|$)|^\/get-quotes\/confirmation(?:\/|$)/iu;
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
const GUIDE = new RegExp(`^/(?:movers/${SLUG}(?:/${SLUG})?|routes/${SLUG}|moving-routes/${SLUG}|questions/${SLUG}|planning/${SLUG}|services/${SLUG}|moving-costs/${SLUG})/$`, "u");

/** Only public canonical paths; never query strings, fragments, tokens or postal identifiers. */
export function publicAnalyticsPath(value: string): string | null {
  if (!value.startsWith("/") || /[?#%@\\]|\d{5,}|\b\d{4}-\d{2}-\d{2}\b|[a-z0-9]{24,}/iu.test(value) || PRIVATE.test(value)) return null;
  const path = value === "/" ? "/" : `${value.replace(/\/+$/u, "")}/`;
  if (STATIC_PATHS.has(path) || GUIDE.test(path) || /^\/(?:routes|questions|planning)\/page\/[1-9]\d{0,3}\/$/u.test(path)) return path;
  return null;
}
export function safeReferrerOrigin(value: string, ownOrigin: string): string {
  try { const url = new URL(value); return /^https?:$/u.test(url.protocol) && url.origin !== ownOrigin ? url.origin : ""; } catch { return ""; }
}
export function analyticsPayload(name: AnalyticsEventName, path: string, origin: string, referrer: string, details: { step?: unknown; placement?: unknown } = {}): Record<string, string> | null {
  const safePath = publicAnalyticsPath(path);
  if (!safePath || !["page_view", "survey_start", "survey_step", "generate_lead"].includes(name)) return null;
  let url: URL;
  try { url = new URL(origin); if (!/^https?:$/u.test(url.protocol) || url.username || url.password) return null; } catch { return null; }
  if (name === "generate_lead" && safePath !== "/get-quotes/") return null;
  if (name === "survey_step" && !ANALYTICS_STEPS.includes(details.step as AnalyticsStep)) return null;
  const payload: Record<string, string> = { event: name, page_location: `${url.origin}${safePath}`, page_path: safePath, page_referrer: safeReferrerOrigin(referrer, url.origin), page_title: safePath === "/get-quotes/" ? "American Moving Choice | Quote request" : "American Moving Choice" };
  if (name === "survey_step") payload.step_name = details.step as AnalyticsStep;
  if ((name === "survey_start" || name === "survey_step") && ["starter", "hero_zip", "survey"].includes(details.placement as string)) payload.form_placement = details.placement as string;
  return payload;
}
