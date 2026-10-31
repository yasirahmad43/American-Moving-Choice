import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  countryAccessResponse, evaluateCountryAccess, isOfficialPublicCrawler, REGISTERED_CRON_PATHS,
  type CountryAccessConfig, type CountryAccessInput,
} from "../src/access";
import snapshot from "../data/access/crawler-ranges.json";

const config: CountryAccessConfig = { enabled: true, onVercel: true, publicWeb: true };
const input = (changes: Partial<CountryAccessInput> = {}): CountryAccessInput => ({
  url: "https://www.americanmovingchoice.com/movers/texas/austin/", method: "GET", country: "FR", clientIp: "198.51.100.7", userAgent: "A regular browser", authorization: null, ...changes,
});
const botAgents: Record<string, string> = {
  "google-common": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "google-verification": "Mozilla/5.0 (compatible; Google-Site-Verification/1.0)",
  bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  "openai-search": "Mozilla/5.0; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot",
  "chatgpt-user": "Mozilla/5.0; compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  "perplexity-bot": "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  "perplexity-user": "Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
};
const googleIp = snapshot.bots.find(bot => bot.id === "google-common")!.prefixes.find(prefix => !prefix.includes(":"))!.split("/")[0]!;
const google = (changes: Partial<CountryAccessInput> = {}) => input({ clientIp: googleIp, userAgent: botAgents["google-common"], ...changes });

describe("country access and authenticated public crawler reads", () => {
  it("allows US/Pakistan visitors and denies unknown/other-country visitors across all aliases", () => {
    for (const country of ["US", "PK", " us "]) expect(evaluateCountryAccess(input({ country }), config)).toEqual({ allowed: true, reason: "country" });
    for (const country of [null, "", "unknown", "FR", "CA", "ZZ"]) expect(evaluateCountryAccess(input({ country }), config).allowed).toBe(false);
    expect(evaluateCountryAccess(input({ country: "CA", url: "https://amc-web-three.vercel.app/" }), config).allowed).toBe(false);
  });
  it("is off locally by default, and never trusts headers as proof of a Vercel deployment", () => {
    expect(evaluateCountryAccess(input(), { ...config, enabled: false, onVercel: false })).toEqual({ allowed: true, reason: "disabled" });
    expect(evaluateCountryAccess(input({ country: "US" }), { ...config, onVercel: false })).toEqual({ allowed: false, reason: "untrusted_platform" });
  });
  it("pairs each requested bot's own official IP list with its correct user agent", () => {
    for (const bot of snapshot.bots) {
      expect(bot.sourceUrl).toMatch(/^https:\/\//);
      expect(bot.fetchedAt).toBeTruthy(); expect(bot.sourceCreationTime).toBeTruthy();
      expect(bot.prefixes.length).toBe(bot.count);
      const address = bot.prefixes[0]!.split("/")[0]!;
      expect(evaluateCountryAccess(input({ clientIp: address, userAgent: botAgents[bot.id] }), config)).toEqual({ allowed: true, reason: "crawler" });
      expect(evaluateCountryAccess(input({ clientIp: "198.51.100.7", userAgent: botAgents[bot.id] }), config).allowed).toBe(false);
      expect(evaluateCountryAccess(input({ clientIp: address, userAgent: "A regular browser" }), config).allowed).toBe(false);
    }
    const ipv6 = snapshot.bots.find(bot => bot.id === "google-common")!.prefixes.find(prefix => prefix.includes(":"))!.split("/")[0]!;
    expect(isOfficialPublicCrawler(google({ clientIp: ipv6 }))).toBe(true);
    expect(isOfficialPublicCrawler(google({ clientIp: "not-an-ip" }))).toBe(false);
    expect(isOfficialPublicCrawler(google({ userAgent: "bingbot/2.0" }))).toBe(false);
    expect(isOfficialPublicCrawler(google({ userAgent: "ImpersonatingGooglebot/2.1" }))).toBe(false);
  });
  it("never grants crawler POSTs, private/API/auth/token paths or encoded-path bypasses", () => {
    expect(isOfficialPublicCrawler(google({ method: "HEAD" }))).toBe(true);
    for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) expect(isOfficialPublicCrawler(google({ method }))).toBe(false);
    for (const path of ["/admin/", "/portal/", "/api/health", "/api/cron/deliver-outbox", "/auth/", "/login", "/account/", "/settings/", "/my-request/private-token/", "/get-quotes/confirmation/", "/companies/name/review/?token=secret", "/report-a-concern/?case=private", "/verify-a-mover/?token=secret", "/movers/texas/?token=secret", "/movers/%74exas/", "/movers/texas%2f..%2fadmin/", "/movers/texas/%252e%252e/admin/", "/movers/texas/../austin/", "/movers/texas/%2e%2e/austin/", "/.well-known/vercel/security/"]) {
      expect(isOfficialPublicCrawler(google({ url: `https://www.americanmovingchoice.com${path}` })), path).toBe(false);
    }
    for (const path of ["/", "/robots.txt", "/sitemap.xml", "/sitemaps/cities-1.xml", "/indexnow-key.txt", "/about/", "/complaints/", "/report-a-concern/", "/verify-a-mover/", "/routes/texas-to-florida/", "/questions/packing-a-truck/", "/media/images/packing-800.webp", "/_next/static/chunks/main-123.js"]) expect(isOfficialPublicCrawler(google({ url: `https://www.americanmovingchoice.com${path}` })), path).toBe(true);
  });
  it("grants no crawler exception on the private app", () => {
    expect(evaluateCountryAccess(google(), { ...config, publicWeb: false }).allowed).toBe(false);
    expect(evaluateCountryAccess(google({ country: null }), { ...config, publicWeb: false }).allowed).toBe(false);
  });
  it("only exempts exact registered cron GETs with the actual secret, and exact Stripe POST", () => {
    const app = { ...config, publicWeb: false, cronSecret: "test-real-cron-secret" };
    for (const path of REGISTERED_CRON_PATHS) expect(evaluateCountryAccess(input({ url: `https://admin.example.com${path}`, authorization: "Bearer test-real-cron-secret" }), app)).toEqual({ allowed: true, reason: "cron" });
    for (const changes of [{ authorization: null }, { authorization: "Bearer wrong" }, { method: "POST", authorization: "Bearer test-real-cron-secret" }, { url: "https://admin.example.com/api/cron/all", authorization: "Bearer test-real-cron-secret" }, { url: "https://admin.example.com/api/cron/deliver-outbox?token=value", authorization: "Bearer test-real-cron-secret" }]) expect(evaluateCountryAccess(input({ url: "https://admin.example.com/api/cron/deliver-outbox", ...changes }), app).allowed).toBe(false);
    expect(evaluateCountryAccess(input({ url: "https://admin.example.com/api/webhooks/stripe", method: "POST" }), app)).toEqual({ allowed: true, reason: "stripe" });
    for (const path of ["/api/webhooks/stripe/", "/api/webhooks/stripe-data", "/api/webhooks/stripe?token=anything"]) expect(evaluateCountryAccess(input({ url: `https://admin.example.com${path}`, method: "POST" }), app).allowed).toBe(false);
    expect(evaluateCountryAccess(input({ url: "https://admin.example.com/api/webhooks/stripe" }), app).allowed).toBe(false);
    expect(evaluateCountryAccess(input({ url: "https://www.americanmovingchoice.com/api/cron/deliver-outbox", authorization: "Bearer test-real-cron-secret" }), { ...app, publicWeb: true }).allowed).toBe(false);
    const appCron = JSON.parse(readFileSync(new URL("../../../apps/app/vercel.json", import.meta.url), "utf8"));
    expect([...REGISTERED_CRON_PATHS].sort()).toEqual(appCron.crons.map((cron: { path: string }) => cron.path).sort());
  });
});

describe("country gate request boundary and caching", () => {
  it("does not accept spoofed alternate IP/country headers or query fields", () => {
    const request = new Request("https://www.americanmovingchoice.com/movers/texas/?country=US", { headers: { "x-vercel-ip-country": "FR", "x-vercel-forwarded-for": "198.51.100.7", "x-forwarded-for": googleIp, "x-real-ip": googleIp, "cf-ipcountry": "US", "x-country": "US", "user-agent": botAgents["google-common"]! } });
    expect(countryAccessResponse(request, { publicWeb: true, config })?.status).toBe(403);
    const forwarded = new Request("https://www.americanmovingchoice.com/movers/texas/", { headers: { "x-vercel-ip-country": "FR", "x-vercel-forwarded-for": `198.51.100.7, ${googleIp}`, "user-agent": botAgents["google-common"]! } });
    expect(countryAccessResponse(forwarded, { publicWeb: true, config })?.status).toBe(403);
    // A missing/empty protected header cannot turn a forged fallback IP into crawler identity.
    for (const protectedIp of [null, "", "198.51.100.7"]) {
      const headers = new Headers({ "x-vercel-ip-country": "FR", "x-forwarded-for": googleIp, "x-real-ip": googleIp, "user-agent": botAgents["google-common"]! });
      if (protectedIp !== null) headers.set("x-vercel-forwarded-for", protectedIp);
      expect(countryAccessResponse(new Request("https://www.americanmovingchoice.com/movers/texas/", { headers }), { publicWeb: true, config })?.status).toBe(403);
    }
  });
  it("makes all denials non-cacheable, generic and independent from a later allowed request", async () => {
    const denied = countryAccessResponse(new Request("https://www.americanmovingchoice.com/", { headers: { "x-vercel-ip-country": "FR" } }), { publicWeb: true, config })!;
    expect(denied.status).toBe(403);
    expect(denied.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(denied.headers.get("cdn-cache-control")).toBe("no-store"); expect(denied.headers.get("vercel-cdn-cache-control")).toBe("no-store");
    expect(denied.headers.get("x-robots-tag")).toBe("noindex, nofollow"); expect(denied.headers.get("set-cookie")).toBeNull();
    expect(await denied.text()).toBe("Access is unavailable from this location.");
    expect(countryAccessResponse(new Request("https://www.americanmovingchoice.com/", { headers: { "x-vercel-ip-country": "US" } }), { publicWeb: true, config })).toBeNull();
    const head = countryAccessResponse(new Request("https://www.americanmovingchoice.com/", { method: "HEAD" }), { publicWeb: true, config })!;
    expect(await head.text()).toBe("");
  });
  it("performs no remote calls while making access decisions", () => {
    const remote = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No request-time fetch allowed"));
    try { expect(evaluateCountryAccess(google(), config).allowed).toBe(true); expect(remote).not.toHaveBeenCalled(); } finally { remote.mockRestore(); }
  });
});
