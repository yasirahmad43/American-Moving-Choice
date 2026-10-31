import { describe, expect, it } from "vitest";
import { ATTRIBUTION_MAX_AGE_MS, cleanAttributionPath, cleanAttributionTouch, cleanCampaignLabel, cleanReferrerOrigin, normalizeAttributionPayload, readAttributionHistory, updateAttributionHistory } from "../src/attribution";

const own = ["https://www.americanmovingchoice.com", "https://app.americanmovingchoice.com"];
const now = 1_800_000_000_000;
describe("private campaign attribution", () => {
  it("retains all five campaign labels and only recognized opaque click IDs", () => {
    const result = cleanAttributionTouch({ landingPath: "/moving-costs/?email=person@example.com&originZip=75201", referrerOrigin: "https://www.google.com/search?q=private", utmSource: "google", utmMedium: "cpc", utmCampaign: "moving-2026", utmTerm: "moving+quotes", utmContent: "hero-A", clickIds: { gclid: "GoogleAdClick_A12345", msclkid: "1234567890abcdef1234567890abcdef", unrecognized: "private-value" }, device: "mobile", email: "person@example.com", phone: "2145550199", originZip: "75201" }, own);
    expect(result).toEqual({ landingPath: "/moving-costs/", referrerOrigin: "https://www.google.com", utmSource: "google", utmMedium: "cpc", utmCampaign: "moving-2026", utmTerm: "moving+quotes", utmContent: "hero-A", clickIds: { gclid: "GoogleAdClick_A12345", msclkid: "1234567890abcdef1234567890abcdef" }, device: "mobile" });
    expect(JSON.stringify(result)).not.toMatch(/person@|2145550199|75201|private-value|search\?/u);
  });
  it("drops private/token routes, foreign origins and every URL query/hash", () => {
    for (const path of ["/my-request/private-token/", "/get-quotes/confirmation/", "/companies/mover/review/?token=private", "/admin/leads/private/", "//evil.invalid/", "https://evil.invalid/get-quotes/", "/unknown/75201/"]) expect(cleanAttributionPath(path, own)).toBeNull();
    expect(cleanAttributionPath("https://americanmovingchoice.com/questions/what-is-a-binding-estimate/?phone=2145550199#details", own)).toBe("/questions/what-is-a-binding-estimate/");
    expect(cleanAttributionPath("/get-quotes/?originZip=75201&destZip=77002", own)).toBe("/get-quotes/");
  });
  it("ignores apex, www and configured portal referrers without losing external origin evidence", () => {
    for (const referrer of ["https://americanmovingchoice.com/", ...own]) expect(cleanReferrerOrigin(referrer, own)).toBeNull();
    expect(cleanReferrerOrigin("https://www.bing.com/search?q=private", own)).toBe("https://www.bing.com");
    expect(cleanReferrerOrigin("https://name:password@example.invalid/", own)).toBeNull();
  });
  it("rejects obvious personal details, credentials and malformed ad IDs", () => {
    expect(cleanCampaignLabel("123456789012")).toBe("123456789012"); // Numeric campaign IDs are legitimate labels.
    for (const label of ["person@example.com", "+1 (214) 555-0199", "https://example.com/private", "sk-ant-redacted-example", "email=person", "x".repeat(101), "<script>"]) expect(cleanCampaignLabel(label)).toBeNull();
    const result = cleanAttributionTouch({ clickIds: { gclid: "2145550199", fbclid: "sk-ant-redacted-example", msclkid: "not-a-microsoft-id", wbraid: "too-short", gbraid: "A".repeat(513) } }, own);
    expect(result.clickIds).toBeUndefined();
  });
  it("keeps the first landing and last non-direct campaign across hero and internal navigation", () => {
    const first = updateAttributionHistory(null, { landingPath: "/planning/", utmSource: "google", utmMedium: "cpc", utmCampaign: "first" }, own, now);
    const internal = updateAttributionHistory(first, { landingPath: "/get-quotes/", referrerOrigin: own[1] }, own, now + 10);
    expect(internal.first).toEqual(first.first); expect(internal.last).toEqual(first.last);
    const last = updateAttributionHistory(internal, { landingPath: "/services/local/", utmSource: "bing", utmMedium: "cpc", utmCampaign: "second" }, own, now + 20);
    expect(last.first.utmCampaign).toBe("first"); expect(last.last.utmCampaign).toBe("second");
    const direct = updateAttributionHistory(last, { landingPath: "/get-quotes/" }, own, now + 30);
    expect(direct.last).toEqual(last.last);
  });
  it("expires stale history and refuses future or malformed browser state", () => {
    const history = updateAttributionHistory(null, { landingPath: "/", utmSource: "google" }, own, now);
    expect(readAttributionHistory(history, own, now + ATTRIBUTION_MAX_AGE_MS + 1)).toBeNull();
    expect(readAttributionHistory({ ...history, startedAt: now + 60001 }, own, now)).toBeNull();
    expect(readAttributionHistory({ version: 1 }, own, now)).toBeNull();
    expect(updateAttributionHistory(history, { landingPath: "/contact/" }, own, now + ATTRIBUTION_MAX_AGE_MS + 1).first.landingPath).toBe("/contact/");
  });
  it("normalizes historical deployed clients into both existing touch rows", () => {
    const legacy = normalizeAttributionPayload({ referrerOrigin: "https://www.google.com/search?q=private", utmSource: "google", utmMedium: "cpc", utmCampaign: "legacy" }, own, "https://www.americanmovingchoice.com/get-quotes/?email=private");
    expect(legacy.first).toEqual(legacy.last);
    expect(legacy.first).toMatchObject({ landingPath: "/get-quotes/", referrerOrigin: "https://www.google.com", utmCampaign: "legacy" });
    expect(JSON.stringify(legacy)).not.toContain("private");
  });
});
