/** Server/CLI only. Public sitemap inventory and IndexNow receipts; no database credentials. */
import { createHash } from "node:crypto";
import { isIP } from "node:net";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";
export const MAX_RUN_URLS = 10_000;
export const MAX_RUN_BATCHES = 10;
const MAX_INVENTORY_URLS = 200_000;
const MAX_SITEMAPS = 512;
const MAX_XML_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 15_000;
export const indexNowSha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export interface PublishedUrl { url: string; lastmod: string | null }
export interface SitemapEvidence { url: string; sha256: string; bytes: number; entries: number; kind: "index" | "urls" }
export interface PublishedInventory { site: string; fetchedAt: string; urls: PublishedUrl[]; sitemaps: SitemapEvidence[]; sha256: string }
export interface IndexNowReceipt {
  url: string; version: string; state: "attempting" | "received" | "pending_key" | "failed" | "uncertain";
  at: string; httpStatus?: number; retryAfter?: string;
}
export interface IndexNowLedger { version: 1; site: string; keySha256: string; endpoint: string; receipts: IndexNowReceipt[] }
export interface IndexNowPlan {
  site: string; keySha256: string; revision: string; inventorySha256: string;
  chunks: { url: string; version: string }[][]; skippedReceived: number; heldUncertain: number; heldRateLimited: number; remaining: number;
}

export function canonicalIndexingSite(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/" || url.port || isIP(url.hostname) || !url.hostname.includes(".") || /(?:^localhost$|\.(?:local|internal|vercel\.app)$)/iu.test(url.hostname)) throw new Error("Indexing requires a canonical public HTTPS origin, not a preview or private host");
  return url.origin;
}

const PRIVATE_PATH = /^\/(?:api|admin|my-request|search|directory|companies|for-movers|mover-terms|advertising-disclosure|how-we-make-money)(?:\/|$)|^\/get-quotes\/confirmation(?:\/|$)/iu;
function publicUrl(value: string, site: string): string {
  const url = new URL(value);
  if (url.origin !== site || url.username || url.password || url.search || url.hash || /[%\\\u0000-\u0020]/u.test(url.pathname) || PRIVATE_PATH.test(url.pathname) || !/^\/(?:[a-z0-9-]+\/)*$/u.test(url.pathname)) throw new Error("Sitemap contains a non-canonical, private, filtered, or off-site URL");
  return url.href;
}

async function boundedText(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (declared > maxBytes) throw new Error("Indexing response exceeds its byte limit");
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const item = await reader.read(); if (item.done) break;
    size += item.value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new Error("Indexing response exceeds its byte limit"); }
    chunks.push(item.value);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
}

async function getText(url: string, maxBytes: number, fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { "user-agent": "AmericanMovingChoice-Indexing/1.0", "cache-control": "no-cache" } });
  if (response.status !== 200 || response.redirected) throw new Error(`Indexing preflight failed with HTTP ${response.status}`);
  return boundedText(response, maxBytes);
}

function xmlText(value: string): string {
  if (/<|&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/iu.test(value)) throw new Error("Malformed sitemap text");
  return value.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/giu, (_, entity: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    return named[entity] ?? String.fromCodePoint(Number.parseInt(entity.startsWith("#x") ? entity.slice(2) : entity.slice(1), entity.startsWith("#x") ? 16 : 10));
  }).trim();
}

/** Parse only the bounded standard sitemap grammar emitted by our own public routes. */
export function parsePublishedSitemap(xml: string): { kind: "index" | "urls"; entries: PublishedUrl[] } {
  if (/<!DOCTYPE|<!ENTITY|<!\[CDATA\[/iu.test(xml)) throw new Error("Unsupported sitemap declaration");
  const document = xml.replace(/^\uFEFF/u, "").replace(/^\s*<\?xml[^?]*\?>/u, "").trim();
  const root = /^<(urlset|sitemapindex)(?:\s+[^<>]*)?>([\s\S]*)<\/\1>$/u.exec(document);
  if (!root) throw new Error("Expected a complete sitemap index or URL set");
  const kind = root[1] === "sitemapindex" ? "index" : "urls";
  const tag = kind === "index" ? "sitemap" : "url";
  const entryPattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gu");
  const entries: PublishedUrl[] = []; let cursor = 0;
  for (const match of root[2]!.matchAll(entryPattern)) {
    if (root[2]!.slice(cursor, match.index).trim()) throw new Error("Unexpected sitemap markup");
    const body = /^\s*<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?\s*$/u.exec(match[1]!);
    if (!body) throw new Error("Malformed sitemap entry");
    const lastmod = body[2] ? xmlText(body[2]) : null;
    if (lastmod && (!/^\d{4}-\d{2}-\d{2}(?:T[0-9:.+-]+Z?)?$/u.test(lastmod) || !Number.isFinite(Date.parse(lastmod)))) throw new Error("Malformed sitemap modification date");
    entries.push({ url: xmlText(body[1]!), lastmod }); cursor = match.index! + match[0].length;
  }
  if (root[2]!.slice(cursor).trim()) throw new Error("Unexpected sitemap markup");
  return { kind, entries };
}

interface RobotsRule { allow: boolean; value: string }
function relevantRobotsRules(text: string): RobotsRule[] {
  const groups: { agents: string[]; rules: RobotsRule[] }[] = []; let current = { agents: [] as string[], rules: [] as RobotsRule[] };
  for (const original of text.split(/\r?\n/u)) {
    const line = original.replace(/#.*$/u, "").trim(); if (!line) continue;
    const match = /^([a-z-]+)\s*:\s*(.*)$/iu.exec(line); if (!match) continue;
    const key = match[1]!.toLowerCase(), value = match[2]!.trim();
    if (key === "user-agent") {
      if (current.rules.length) { groups.push(current); current = { agents: [], rules: [] }; }
      current.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && value && current.agents.length) current.rules.push({ allow: key === "allow", value });
  }
  groups.push(current);
  return groups.filter(group => group.agents.some(agent => ["*", "bingbot", "indexnow"].includes(agent))).flatMap(group => group.rules);
}
function robotsAllow(path: string, rules: RobotsRule[]): boolean {
  const matches = rules.filter(rule => new RegExp(`^${rule.value.split("*").map(part => part.replace(/[.+?^{}()|[\]\\]/gu, "\\$&")).join(".*")}`).test(path));
  if (!matches.length) return true;
  const longest = Math.max(...matches.map(rule => rule.value.replaceAll("*", "").length));
  return matches.some(rule => rule.allow && rule.value.replaceAll("*", "").length === longest);
}

/** All submitted URLs must come from the current, public, same-origin published sitemap. */
export async function collectPublishedInventory(siteValue: string, fetcher: typeof fetch = fetch): Promise<PublishedInventory> {
  const site = canonicalIndexingSite(siteValue);
  const robots = await getText(`${site}/robots.txt`, 128_000, fetcher);
  if (!new RegExp(`^Sitemap:\\s*${site.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\/sitemap\\.xml\\s*$`, "imu").test(robots)) throw new Error("robots.txt does not advertise the canonical sitemap");
  const rules = relevantRobotsRules(robots);
  if (!robotsAllow("/", rules)) throw new Error("The site is not open for indexing");
  const pending = [{ url: `${site}/sitemap.xml`, depth: 0 }]; const visited = new Set<string>();
  const urls = new Map<string, PublishedUrl>(); const sitemaps: SitemapEvidence[] = [];
  while (pending.length) {
    const item = pending.shift()!; if (visited.has(item.url)) continue;
    if (visited.size >= MAX_SITEMAPS || item.depth > 3) throw new Error("Sitemap inventory exceeds its bounded crawl limit");
    visited.add(item.url);
    const xml = await getText(item.url, MAX_XML_BYTES, fetcher); const parsed = parsePublishedSitemap(xml);
    sitemaps.push({ url: item.url, sha256: indexNowSha256(xml), bytes: Buffer.byteLength(xml), entries: parsed.entries.length, kind: parsed.kind });
    for (const entry of parsed.entries) {
      if (parsed.kind === "index") {
        const target = new URL(entry.url);
        if (target.origin !== site || target.username || target.password || target.search || target.hash || !/^\/(?:sitemap\.xml|sitemaps\/[a-z]+(?:-[1-9]\d*)?\.xml)$/u.test(target.pathname)) throw new Error("Sitemap index references a non-canonical or off-site file");
        pending.push({ url: target.href, depth: item.depth + 1 });
      } else {
        const url = publicUrl(entry.url, site);
        if (!robotsAllow(new URL(url).pathname, rules)) throw new Error("Sitemap includes a robots-blocked URL");
        const existing = urls.get(url);
        if (existing && existing.lastmod !== entry.lastmod) throw new Error("Sitemap duplicates disagree about modification dates");
        urls.set(url, { ...entry, url });
        if (urls.size > MAX_INVENTORY_URLS) throw new Error("Published inventory exceeds its URL limit");
      }
    }
  }
  if (!urls.size) throw new Error("Published sitemap inventory is empty");
  const entries = [...urls.values()].sort((a, b) => a.url.localeCompare(b.url));
  return { site, fetchedAt: new Date().toISOString(), urls: entries, sitemaps, sha256: indexNowSha256(JSON.stringify(entries)) };
}

export function validateIndexNowKey(key: string): string {
  if (!/^[A-Za-z0-9-]{8,128}$/u.test(key)) throw new Error("INDEXNOW_KEY must contain 8–128 letters, digits, or hyphens");
  return key;
}
export function newIndexNowLedger(site: string, key: string): IndexNowLedger {
  return { version: 1, site: canonicalIndexingSite(site), keySha256: indexNowSha256(validateIndexNowKey(key)), endpoint: INDEXNOW_ENDPOINT, receipts: [] };
}
export function parseIndexNowLedger(value: unknown, site: string, key: string): IndexNowLedger {
  const expected = newIndexNowLedger(site, key); const ledger = value as IndexNowLedger;
  if (!ledger || ledger.version !== 1 || ledger.site !== expected.site || ledger.keySha256 !== expected.keySha256 || ledger.endpoint !== INDEXNOW_ENDPOINT || !Array.isArray(ledger.receipts) || ledger.receipts.length > MAX_INVENTORY_URLS) throw new Error("IndexNow ledger does not match this host, key, or endpoint");
  const seen = new Set<string>();
  for (const receipt of ledger.receipts) {
    if (publicUrl(receipt.url, expected.site) !== receipt.url || !/^[a-f0-9]{64}$/u.test(receipt.version) || !["attempting", "received", "pending_key", "failed", "uncertain"].includes(receipt.state) || !Number.isFinite(Date.parse(receipt.at)) || (receipt.httpStatus !== undefined && (!Number.isInteger(receipt.httpStatus) || receipt.httpStatus < 100 || receipt.httpStatus > 599)) || (receipt.retryAfter !== undefined && !Number.isFinite(Date.parse(receipt.retryAfter))) || seen.has(receipt.version)) throw new Error("Malformed IndexNow ledger receipt");
    if ((receipt.state === "received" && receipt.httpStatus !== 200) || (receipt.state === "pending_key" && receipt.httpStatus !== 202) || (receipt.state === "failed" && (receipt.httpStatus === undefined || receipt.httpStatus === 200 || receipt.httpStatus === 202))) throw new Error("IndexNow receipt state does not match its HTTP evidence");
    seen.add(receipt.version);
  }
  return { ...expected, receipts: ledger.receipts.map(receipt => ({ url: receipt.url, version: receipt.version, state: receipt.state, at: receipt.at, ...(receipt.httpStatus !== undefined ? { httpStatus: receipt.httpStatus } : {}), ...(receipt.retryAfter ? { retryAfter: receipt.retryAfter } : {}) })) };
}

export function planIndexNow(inventory: PublishedInventory, ledger: IndexNowLedger, options: { key: string; batchSize?: number; limit?: number; revision?: string; retryUncertain?: boolean; now?: Date }): IndexNowPlan {
  const verified = parseIndexNowLedger(ledger, inventory.site, options.key);
  const batchSize = options.batchSize ?? 1_000, limit = options.limit ?? MAX_RUN_URLS, revision = options.revision ?? "initial";
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_RUN_URLS || !Number.isInteger(limit) || limit < 1 || limit > MAX_RUN_URLS || !/^[A-Za-z0-9._-]{1,128}$/u.test(revision)) throw new Error("Invalid bounded IndexNow plan options");
  const byVersion = new Map(verified.receipts.map(receipt => [receipt.version, receipt])); const candidates: { url: string; version: string }[] = [];
  // A 429 applies to this host's submission traffic, including URLs not attempted yet.
  const rateLimited = verified.receipts.some(receipt => receipt.retryAfter && Date.parse(receipt.retryAfter) > (options.now ?? new Date()).getTime());
  let skippedReceived = 0, heldUncertain = 0, heldRateLimited = 0;
  for (const entry of inventory.urls) {
    const url = publicUrl(entry.url, verified.site); const version = indexNowSha256(JSON.stringify({ url, lastmod: entry.lastmod, revision })); const previous = byVersion.get(version);
    if (previous && ["received", "pending_key"].includes(previous.state)) { skippedReceived++; continue; }
    if (previous && ["uncertain", "attempting"].includes(previous.state) && !options.retryUncertain) { heldUncertain++; continue; }
    if (rateLimited) { heldRateLimited++; continue; }
    candidates.push({ url, version });
  }
  const selected = candidates.slice(0, Math.min(limit, batchSize * MAX_RUN_BATCHES)), chunks: IndexNowPlan["chunks"] = [];
  for (let i = 0; i < selected.length; i += batchSize) chunks.push(selected.slice(i, i + batchSize));
  return { site: verified.site, keySha256: verified.keySha256, revision, inventorySha256: inventory.sha256, chunks, skippedReceived, heldUncertain, heldRateLimited, remaining: Math.max(0, candidates.length - selected.length) };
}

export interface IndexNowRunResult { outcome: "received" | "partial" | "nothing_to_send"; submittedUrls: number; batches: { count: number; at: string; state: IndexNowReceipt["state"]; httpStatus?: number }[] }

/** Sequential bounded delivery. A transport-uncertain attempt is held instead of blindly retried. */
export async function submitIndexNow(inventory: PublishedInventory, ledger: IndexNowLedger, options: { key: string; batchSize?: number; limit?: number; revision?: string; retryUncertain?: boolean; fetcher?: typeof fetch; persist: (ledger: IndexNowLedger) => Promise<void> }): Promise<IndexNowRunResult> {
  const plan = planIndexNow(inventory, ledger, options); const fetcher = options.fetcher ?? fetch;
  if (!plan.chunks.length) return { outcome: "nothing_to_send", submittedUrls: 0, batches: [] };
  const liveKey = await getText(`${plan.site}${INDEXNOW_KEY_PATH}`, 1_024, fetcher);
  if (liveKey.trim() !== options.key) throw new Error("The public IndexNow key file does not match INDEXNOW_KEY");
  const result: IndexNowRunResult = { outcome: "received", submittedUrls: 0, batches: [] };
  const record = (chunk: IndexNowPlan["chunks"][number], state: IndexNowReceipt["state"], at: string, httpStatus?: number, retryAfter?: string) => {
    const versions = new Set(chunk.map(entry => entry.version));
    ledger.receipts = ledger.receipts.filter(receipt => !versions.has(receipt.version));
    ledger.receipts.push(...chunk.map(entry => ({ ...entry, state, at, ...(httpStatus !== undefined ? { httpStatus } : {}), ...(retryAfter ? { retryAfter } : {}) })));
  };
  for (const chunk of plan.chunks) {
    const at = new Date().toISOString(); record(chunk, "attempting", at); await options.persist(ledger);
    let state: IndexNowReceipt["state"] = "uncertain", httpStatus: number | undefined, retryAfter: string | undefined;
    try {
      const response = await fetcher(INDEXNOW_ENDPOINT, { method: "POST", redirect: "error", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { "content-type": "application/json; charset=utf-8", "user-agent": "AmericanMovingChoice-Indexing/1.0" }, body: JSON.stringify({ host: new URL(plan.site).hostname, key: options.key, keyLocation: `${plan.site}${INDEXNOW_KEY_PATH}`, urlList: chunk.map(entry => entry.url) }) });
      httpStatus = response.status;
      state = httpStatus === 200 ? "received" : httpStatus === 202 ? "pending_key" : "failed";
      if (response.redirected) state = "uncertain";
      if (httpStatus === 429) {
        const header = response.headers.get("retry-after"); const seconds = header && /^\d+$/u.test(header) ? Number(header) : null;
        const retryAt = seconds !== null ? Date.now() + Math.min(seconds, 86_400) * 1_000 : header && Number.isFinite(Date.parse(header)) ? Date.parse(header) : Date.now() + 3_600_000;
        retryAfter = new Date(Math.max(Date.now() + 60_000, retryAt)).toISOString();
      }
      await response.body?.cancel();
    } catch { state = "uncertain"; }
    record(chunk, state, at, httpStatus, retryAfter); await options.persist(ledger);
    result.batches.push({ count: chunk.length, at, state, ...(httpStatus !== undefined ? { httpStatus } : {}) });
    if (state !== "received" && state !== "pending_key") { result.outcome = "partial"; break; }
    result.submittedUrls += chunk.length;
  }
  return result;
}
