/**
 * Lead quality checks (lead lifecycle §4) that need no database: the survey ticket that proves a
 * signed elapsed time, the risk score, source attribution and the validation-result rows.
 * Pure, so tests import it directly.
 */
import { hmacHex, newToken, safeEqual } from "../auth/tokens";

// ------------------------------------------------------------------ survey ticket (minimum completion time)

/**
 * Issued with the coverage result at What we found and returned with the submission. Signed with
 * HMAC_SECRET, so the start time can't be forged. Legacy checkbox forms enforce the minimum
 * elapsed time; compact submit-button requests use it as a quality signal instead of a rejection.
 */
export const MIN_COMPLETION_SECONDS = 8;
/** A ticket older than this is refused; the visitor checks coverage again (fresh movers too). */
export const TICKET_MAX_AGE_SECONDS = 6 * 60 * 60;

export function issueSurveyTicket(secret: string, now: number = Date.now()): string {
  const issued = String(Math.floor(now));
  // Different visitors starting in the same millisecond must not share a replay counter.
  const payload = `${issued}.${newToken()}`;
  return `${payload}.${hmacHex(secret, `survey-ticket\u0000${payload}`).slice(0, 32)}`;
}

export type TicketCheck = { ok: true; elapsedSeconds: number } | { ok: false; reason: "invalid" | "too_fast" | "expired" };

export function checkSurveyTicket(secret: string, ticket: string, now: number = Date.now(), minimumSeconds: 0 | typeof MIN_COMPLETION_SECONDS = MIN_COMPLETION_SECONDS): TicketCheck {
  // Accept still-valid tickets from an older deployment during the six-hour transition.
  const match = /^(\d{13})(?:\.([A-Za-z0-9_-]{43}))?\.([0-9a-f]{32})$/.exec(ticket);
  if (!match) return { ok: false, reason: "invalid" };
  const [, issued, nonce, mac] = match;
  const payload = nonce ? `${issued}.${nonce}` : issued!;
  if (!safeEqual(mac!, hmacHex(secret, `survey-ticket\u0000${payload}`).slice(0, 32))) return { ok: false, reason: "invalid" };
  const elapsedSeconds = (now - Number(issued)) / 1000;
  if (elapsedSeconds < 0) return { ok: false, reason: "invalid" };
  if (elapsedSeconds < minimumSeconds) return { ok: false, reason: "too_fast" };
  if (elapsedSeconds > TICKET_MAX_AGE_SECONDS) return { ok: false, reason: "expired" };
  return { ok: true, elapsedSeconds };
}

// ------------------------------------------------------------------ risk score

/** Scores at or above this hold the request for admin review (lead lifecycle §1, needs_review). */
export const RISK_REVIEW_THRESHOLD = 50;

const TEST_NAME = /^(test|tester|testing|asdf|asd|qwerty|fake|none|null|n\/?a|abc|xxx+|aaa+|sample|foo|bar|john doe|jane doe)$/i;

export interface RiskInput {
  firstName: string;
  lastName: string;
  email: string;
  /** Seconds from the coverage check to submission. */
  elapsedSeconds: number;
  /** Consent records from the same IP address in the last 24 hours. */
  recentFromIp: number;
  originZip: string;
  destZip: string;
}

export interface RiskResult {
  score: number;
  reasons: string[];
}

/** A 0–100 score from simple signals; every point added says why (lead lifecycle §4, "stores its reasons"). */
export function riskScore(input: RiskInput): RiskResult {
  let score = 0;
  const reasons: string[] = [];
  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(`${reason} (+${points})`);
  };
  const full = `${input.firstName} ${input.lastName}`.trim();
  if (TEST_NAME.test(input.firstName) || TEST_NAME.test(input.lastName) || TEST_NAME.test(full)) add(35, "Test-like name");
  else if (input.firstName.toLowerCase() === input.lastName.toLowerCase()) add(15, "First and last name are the same");
  const local = input.email.split("@")[0] ?? "";
  if (TEST_NAME.test(local)) add(15, "Test-like email address");
  if (input.elapsedSeconds < 45) add(15, "Completed in under 45 seconds after the coverage check");
  if (input.recentFromIp >= 5) add(50, `${input.recentFromIp} requests from the same IP address in 24 hours`);
  else if (input.recentFromIp >= 2) add(25, `${input.recentFromIp} requests from the same IP address in 24 hours`);
  if (input.originZip === input.destZip) add(5, "Origin and destination ZIP codes are the same");
  return { score: Math.min(100, score), reasons };
}

// ------------------------------------------------------------------ source attribution

export type SourceCategory = "organic_search" | "paid_search" | "paid_social" | "referral" | "direct" | "other";

export type AttributionInput = import("@amc/core").AttributionTouch;

const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|search\.brave)\./i;
const SOCIAL_HOSTS = /(^|\.)(facebook|instagram|tiktok|pinterest|reddit|linkedin|x|twitter|snapchat|youtube)\.com$/i;

/** Source category for the marketplace preview (lead lifecycle §5): from UTM parameters, then the referrer. */
export function sourceCategory(input: AttributionInput, ownOrigins: readonly string[]): SourceCategory {
  const medium = (input.utmMedium ?? "").toLowerCase();
  const source = (input.utmSource ?? "").toLowerCase();
  if ((/^(paid_social|paidsocial|social_paid|cpm)$/u.test(medium) || /^(paid|cpc|ppc)$/u.test(medium) && /^(facebook|instagram|tiktok|pinterest|reddit|linkedin|x|twitter|snapchat|youtube)(?:\.com)?$/u.test(source))) return "paid_social";
  if (/^(cpc|ppc|paid_search|paidsearch|sem)$/.test(medium)) return "paid_search";
  if (input.clickIds?.gclid || input.clickIds?.gbraid || input.clickIds?.wbraid || input.clickIds?.msclkid) return "paid_search";
  if (/^(paid_social|paidsocial|social_paid|cpm)$/.test(medium) || (medium === "paid" && SOCIAL_HOSTS.test(`${source}.com`))) return "paid_social";
  if (medium === "referral" || medium === "affiliate") return "referral";
  let host = "";
  try {
    if (input.referrerOrigin) host = new URL(input.referrerOrigin).hostname;
  } catch {
    host = "";
  }
  if (!host || ownOrigins.some((origin) => safeHost(origin) === host)) return input.utmSource || input.utmMedium || input.utmCampaign || input.utmTerm || input.utmContent || input.clickIds?.fbclid ? "other" : "direct";
  if (SEARCH_HOSTS.test(`${host}.`)) return "organic_search";
  return "referral";
}

function safeHost(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return "";
  }
}

/** Keeps a UTM value short and free of anything but plain label characters. */
export function cleanUtm(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().slice(0, 100).replace(/[^A-Za-z0-9 ._~+-]/g, "");
  return cleaned || null;
}

// ------------------------------------------------------------------ validation results

export interface ValidationRow {
  check_type: string;
  result: "pass" | "fail" | "flag" | "skipped";
  reason: string;
}
