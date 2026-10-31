import "server-only";

/** Next 16 proxy runs on Node. These exact public CIDRs are compiled once, never fetched per request. */
import { BlockList, isIP } from "node:net";
import { timingSafeEqual } from "node:crypto";
import crawlerSnapshot from "../../data/access/crawler-ranges.json";
import { env } from "../env/env";

export interface CountryAccessConfig {
  enabled: boolean;
  onVercel: boolean;
  publicWeb: boolean;
  cronSecret?: string;
}
export interface CountryAccessInput {
  url: string;
  method: string;
  country: string | null;
  clientIp: string | null;
  userAgent: string | null;
  authorization: string | null;
}
export type CountryAccessDecision = { allowed: true; reason: "disabled" | "country" | "crawler" | "cron" | "stripe" | "ownership" } | { allowed: false; reason: "untrusted_platform" | "unknown_country" | "country_denied" };

const publicPath = new RegExp(crawlerSnapshot.publicPathPattern, "iu");
const unsafePath = new RegExp(crawlerSnapshot.unsafePathPattern, "u");
// Installed Next defaults; apps/web has no custom image width/quality configuration.
const imageWidths = new Set([32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);
const publicRaster = /^\/(?:media\/(?:images|videos)|brand|icons\/3d)\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|gif|jpe?g|png|webp)$/iu;
const requestPath = (value: string, parsed: URL): string => /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+([^?#]*)/iu.exec(value)?.[1] ?? parsed.pathname;

/** This does not admit arbitrary optimizer sources or query-bearing HTML/API requests. */
function isPublicImageOptimization(url: URL): boolean {
  if (url.pathname !== "/_next/image" || url.hash || url.search.length > 1_024) return false;
  const entries = [...url.searchParams.entries()];
  if (entries.length !== 3 || new Set(entries.map(([key]) => key)).size !== 3 || entries.some(([key]) => !["url", "w", "q"].includes(key))) return false;
  // Next's actual loader emits these exact names and decimal numbers; encoded names are unnecessary.
  const fields = url.search.slice(1).split("&");
  if (fields.some(field => !/^(?:url|w|q)=/u.test(field))) return false;
  const width = url.searchParams.get("w")!, quality = url.searchParams.get("q")!;
  if (!/^[1-9]\d{0,3}$/u.test(width) || !imageWidths.has(Number(width)) || quality !== "75") return false;
  if (!fields.includes(`w=${width}`) || !fields.includes(`q=${quality}`)) return false;
  const source = url.searchParams.get("url")!; // URLSearchParams decodes once, exactly as the optimizer does.
  if (source.length > 768 || unsafePath.test(source) || !publicRaster.test(source)) return false;
  const encoded = fields.find(field => field.startsWith("url="))!.slice(4);
  return encoded === encodeURIComponent(source); // No nested encoding, absolute URL, query, fragment or raw ambiguity.
}
const crawlerLists = crawlerSnapshot.bots.map(bot => {
  const blockList = new BlockList();
  for (const cidr of bot.prefixes) {
    const [address, mask] = cidr.split("/");
    const version = isIP(address!);
    if (!version || !mask || !/^\d+$/u.test(mask)) throw new Error("Invalid bundled crawler CIDR");
    blockList.addSubnet(address!, Number(mask), version === 4 ? "ipv4" : "ipv6");
  }
  return { blockList, userAgent: new RegExp(bot.uaPattern, "iu") };
});

/** Keep this set aligned with the actual registered schedules, checked in access.test.ts. */
export const REGISTERED_CRON_PATHS = new Set([
  "/api/cron/expire-lead-groups", "/api/cron/release-expired-attempts", "/api/cron/recheck-credentials",
  "/api/cron/credential-expiry-alerts", "/api/cron/suspend-on-failed-recheck", "/api/cron/reconcile-payments",
  "/api/cron/prune-rate-limits", "/api/cron/schedule-review-invitations", "/api/cron/send-due-invitations",
  "/api/cron/deliver-outbox", "/api/cron/review-invitation-audit",
]);

const realBearer = (authorization: string | null, secret: string | undefined): boolean => {
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7), "utf8"), expected = Buffer.from(secret, "utf8");
  return supplied.byteLength === expected.byteLength && timingSafeEqual(supplied, expected);
};

export function isOfficialPublicCrawler(input: CountryAccessInput): boolean {
  if (!["GET", "HEAD"].includes(input.method) || !input.clientIp || !input.userAgent || input.userAgent.length > 2_048) return false;
  const url = new URL(input.url);
  const rawPath = requestPath(input.url, url);
  // The only allowed query is a tightly validated request for a public raster image.
  if (input.url.includes("#") || unsafePath.test(rawPath) || unsafePath.test(url.pathname)) return false;
  if (input.url.includes("?") ? !isPublicImageOptimization(url) : !publicPath.test(url.pathname)) return false;
  const version = isIP(input.clientIp);
  if (!version) return false;
  return crawlerLists.some(bot => bot.userAgent.test(input.userAgent!) && bot.blockList.check(input.clientIp!, version === 4 ? "ipv4" : "ipv6"));
}

export function evaluateCountryAccess(input: CountryAccessInput, config: CountryAccessConfig): CountryAccessDecision {
  if (!config.enabled) return { allowed: true, reason: "disabled" };
  // A request header cannot make a self-hosted process a trusted Vercel deployment.
  if (!config.onVercel) return { allowed: false, reason: "untrusted_platform" };
  const url = new URL(input.url);
  // Intentionally public proof only: no HTML, consumer record or API is exposed globally.
  if (config.publicWeb && ["GET", "HEAD"].includes(input.method) && url.pathname === "/indexnow-key.txt" && requestPath(input.url, url) === url.pathname && !/[?#]/u.test(input.url)) return { allowed: true, reason: "ownership" };
  if (!config.publicWeb && !url.search && !url.hash && !unsafePath.test(url.pathname)) {
    if (input.method === "GET" && REGISTERED_CRON_PATHS.has(url.pathname) && realBearer(input.authorization, config.cronSecret)) return { allowed: true, reason: "cron" };
    // This only reaches the existing raw-body Stripe signature verifier; it grants no page/data access.
    if (input.method === "POST" && url.pathname === "/api/webhooks/stripe") return { allowed: true, reason: "stripe" };
  }
  const country = input.country?.trim().toUpperCase();
  if (country === "US" || country === "PK") return { allowed: true, reason: "country" };
  if (config.publicWeb && isOfficialPublicCrawler(input)) return { allowed: true, reason: "crawler" };
  return { allowed: false, reason: country && /^[A-Z]{2}$/u.test(country) ? "country_denied" : "unknown_country" };
}

/** Check before rendering/cached content; only platform IP/country metadata is used. */
export function countryAccessResponse(request: Request, options: { publicWeb: boolean; config?: CountryAccessConfig }): Response | null {
  const configuration = options.config ?? (() => {
    const e = env();
    return { enabled: e.COUNTRY_ACCESS_ENABLED, onVercel: process.env.VERCEL === "1", publicWeb: options.publicWeb, cronSecret: e.CRON_SECRET };
  })();
  // Require Vercel's dedicated header for crawler identity; missing metadata never falls back
  // to a client-supplied forwarding header. Country access itself remains platform-derived.
  const address = request.headers.get("x-vercel-forwarded-for");
  const decision = evaluateCountryAccess({
    url: request.url, method: request.method,
    country: request.headers.get("x-vercel-ip-country"), clientIp: address?.trim() ?? null,
    userAgent: request.headers.get("user-agent"), authorization: request.headers.get("authorization"),
  }, configuration);
  if (decision.allowed) return null;
  return new Response(request.method === "HEAD" ? null : "Access is unavailable from this location.", { status: 403, headers: {
    "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store, max-age=0",
    "cdn-cache-control": "no-store", "vercel-cdn-cache-control": "no-store", "x-robots-tag": "noindex, nofollow",
    vary: "X-Vercel-IP-Country",
  } });
}
