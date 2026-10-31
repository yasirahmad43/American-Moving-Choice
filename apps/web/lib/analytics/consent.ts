export type AnalyticsConsent = "granted" | "denied";
export const ANALYTICS_CONSENT_KEY = "amc.analytics.consent.v1";
export const ANALYTICS_CONSENT_EVENT = "amc:analytics-consent";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
let temporaryChoice: AnalyticsConsent | null = null;

export function decodeAnalyticsConsent(raw: string | null, now = Date.now()): AnalyticsConsent | null {
  try {
    const record: unknown = raw ? JSON.parse(raw) : null;
    if (!record || typeof record !== "object") return null;
    const { version, choice, savedAt } = record as Record<string, unknown>;
    return version === 1 && (choice === "granted" || choice === "denied") && typeof savedAt === "number" && savedAt <= now && now - savedAt <= CONSENT_MAX_AGE_MS ? choice : null;
  } catch { return null; }
}
export function browserPrivacyOptOut(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true || navigator.doNotTrack === "1";
}
export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  if (browserPrivacyOptOut()) return "denied";
  if (temporaryChoice) return temporaryChoice;
  try { return decodeAnalyticsConsent(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)); } catch { return null; }
}
export function setAnalyticsConsent(choice: AnalyticsConsent): AnalyticsConsent {
  const effective = browserPrivacyOptOut() ? "denied" : choice;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify({ version: 1, choice: effective, savedAt: Date.now() }));
    temporaryChoice = null;
  } catch {
    // Optional analytics stays off if a preference cannot be saved. Essential forms still work.
    temporaryChoice = "denied";
    try { window.localStorage.removeItem(ANALYTICS_CONSENT_KEY); } catch { /* storage blocked */ }
  }
  const actual = temporaryChoice ?? effective;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: actual }));
  return actual;
}
