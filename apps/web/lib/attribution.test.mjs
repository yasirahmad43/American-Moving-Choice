import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const consent = vi.hoisted(() => ({ choice: "granted" }));
vi.mock("./analytics/consent", () => ({ readAnalyticsConsent: () => consent.choice }));
import { ATTRIBUTION_COOKIE, ATTRIBUTION_STORAGE_KEY, attributionCookieDomain, captureCampaignAttribution, clearCampaignAttribution, configureAttributionOrigins } from "./attribution.ts";

const own = ["https://www.americanmovingchoice.com", "https://app.americanmovingchoice.com"];
let storage, cookies, writes, win, doc;
function browser() {
  storage = new Map(); cookies = new Map(); writes = [];
  win = { location: { origin: own[0], hostname: "www.americanmovingchoice.com", protocol: "https:", pathname: "/planning/", search: "?utm_source=google&utm_medium=cpc&utm_campaign=summer&utm_term=moving+quotes&utm_content=hero-A&gclid=GoogleAdClick_A12345&email=person@example.com&originZip=75201" }, innerWidth: 390,
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }, fetch: vi.fn() };
  doc = { referrer: "https://www.google.com/search?q=private" };
  Object.defineProperty(doc, "cookie", { configurable: true, get: () => [...cookies].map(([key, value]) => `${key}=${value}`).join("; "), set: value => { writes.push(value); const [pair] = value.split(";"); const index = pair.indexOf("="); const key = pair.slice(0, index), content = pair.slice(index + 1); if (/Max-Age=0(?:;|$)/u.test(value)) cookies.delete(key); else cookies.set(key, content); } });
  vi.stubGlobal("window", win); vi.stubGlobal("document", doc);
}
beforeEach(() => { consent.choice = "granted"; browser(); clearCampaignAttribution(); configureAttributionOrigins(own); });
afterEach(() => { clearCampaignAttribution(); vi.unstubAllGlobals(); });

describe("consented first-party campaign continuity", () => {
  it("does not capture before opt-in and clears stored attribution when permission is withdrawn", () => {
    consent.choice = null;
    expect(captureCampaignAttribution()).toEqual({}); expect(storage.size).toBe(0); expect(cookies.size).toBe(0);
    consent.choice = "granted"; expect(captureCampaignAttribution().first.utmCampaign).toBe("summer");
    consent.choice = "denied"; expect(captureCampaignAttribution()).toEqual({}); expect(storage.size).toBe(0); expect(cookies.size).toBe(0);
  });
  it("captures only the allowed campaign fields, with no analytics, network, form or raw-query data", () => {
    const value = captureCampaignAttribution();
    expect(value.first).toMatchObject({ landingPath: "/planning/", referrerOrigin: "https://www.google.com", utmTerm: "moving quotes", utmContent: "hero-A", clickIds: { gclid: "GoogleAdClick_A12345" }, device: "mobile" });
    expect(JSON.stringify(value)).not.toMatch(/person@|75201|search\?|email=/u);
    expect(storage.has(ATTRIBUTION_STORAGE_KEY)).toBe(true); expect(cookies.has(ATTRIBUTION_COOKIE)).toBe(true);
    expect(writes.some(value => /Max-Age=2592000; Path=\/; SameSite=Lax; Secure; Domain=americanmovingchoice\.com$/u.test(value))).toBe(true);
    expect(win.fetch).not.toHaveBeenCalled(); expect(win.dataLayer).toBeUndefined(); expect(win.gtag).toBeUndefined();
  });
  it("preserves the original landing and referrer during repeated capture and hero-to-survey navigation", () => {
    const initial = captureCampaignAttribution();
    expect(captureCampaignAttribution()).toEqual(initial);
    win.location.pathname = "/get-quotes/"; win.location.search = "";
    expect(captureCampaignAttribution()).toEqual(initial);
  });
  it("restores first and last touches after a full-page survey navigation", async () => {
    const initial = captureCampaignAttribution();
    win.location.pathname = "/get-quotes/"; win.location.search = ""; doc.referrer = own[0] + "/planning/";
    vi.resetModules();
    const fresh = await import("./attribution.ts"); fresh.configureAttributionOrigins(own);
    expect(fresh.captureCampaignAttribution()).toEqual(initial);
    fresh.clearCampaignAttribution();
  });
  it("uses the consented owned-domain cookie when session storage is unavailable", async () => {
    const initial = captureCampaignAttribution();
    Object.defineProperty(win, "sessionStorage", { configurable: true, get: () => { throw new Error("blocked session storage"); } });
    win.location.pathname = "/get-quotes/"; win.location.search = ""; doc.referrer = own[1] + "/login";
    vi.resetModules();
    const fresh = await import("./attribution.ts"); fresh.configureAttributionOrigins(own);
    expect(fresh.captureCampaignAttribution()).toEqual(initial);
    fresh.clearCampaignAttribution();
  });
  it("never records private request links or their query parameters", () => {
    const initial = captureCampaignAttribution();
    win.location.pathname = "/my-request/private-token/"; win.location.search = "?email=person@example.com&gclid=PrivateClick_A12345";
    expect(captureCampaignAttribution()).toEqual(initial);
    expect(storage.get(ATTRIBUTION_STORAGE_KEY)).not.toMatch(/private-token|person@|PrivateClick/u);
  });
  it("keeps optional storage errors from interrupting capture or request submission", () => {
    Object.defineProperty(win, "sessionStorage", { configurable: true, get: () => { throw new Error("blocked session storage"); } });
    Object.defineProperty(doc, "cookie", { configurable: true, get: () => { throw new Error("blocked cookie reads"); }, set: () => { throw new Error("blocked cookie writes"); } });
    expect(captureCampaignAttribution().first.utmCampaign).toBe("summer");
    win.location.pathname = "/get-quotes/"; win.location.search = "";
    expect(captureCampaignAttribution().first.utmCampaign).toBe("summer");
    consent.choice = "denied";
    expect(captureCampaignAttribution()).toEqual({});
  });
  it("upgrades an early starter capture to the owned-domain cookie without a shadow host cookie", () => {
    configureAttributionOrigins([own[0]]);
    const initial = captureCampaignAttribution();
    expect(writes.at(-1)).not.toMatch(/Domain=/u);
    configureAttributionOrigins(own);
    expect(writes.at(-2)).toMatch(/Max-Age=0/u); expect(writes.at(-2)).not.toMatch(/Domain=/u);
    expect(writes.at(-1)).toMatch(/Domain=americanmovingchoice\.com$/u);
    expect(captureCampaignAttribution()).toEqual(initial);
  });
  it("never scopes cookies to a shared hosting platform or public suffix", () => {
    expect(attributionCookieDomain("www.americanmovingchoice.com", own)).toBe("americanmovingchoice.com");
    expect(attributionCookieDomain("amc-web-three.vercel.app", ["https://amc-web-three.vercel.app", "https://amc-app-sable.vercel.app"])).toBeNull();
    expect(attributionCookieDomain("one.co.uk", ["https://one.co.uk", "https://two.co.uk"])).toBeNull();
    expect(attributionCookieDomain("unknown.example.com", own)).toBeNull();
  });
});
