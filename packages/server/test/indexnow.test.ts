import { describe, expect, it, vi } from "vitest";
import {
  canonicalIndexingSite, collectPublishedInventory, INDEXNOW_ENDPOINT, indexNowSha256,
  newIndexNowLedger, parseIndexNowLedger, parsePublishedSitemap, planIndexNow, submitIndexNow,
  type PublishedInventory,
} from "../src/indexing/indexnow";

const SITE = "https://www.example.com", KEY = "public-key-1234567890";
const urlset = (entries: { url: string; lastmod?: string }[]) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(entry => `<url><loc>${entry.url}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`).join("")}</urlset>`;
const index = (urls: string[]) => `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<sitemap><loc>${url}</loc></sitemap>`).join("")}</sitemapindex>`;
const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /my-request/\nSitemap: ${SITE}/sitemap.xml\n`;
const inventory = (count = 3): PublishedInventory => {
  const urls = Array.from({ length: count }, (_, n) => ({ url: `${SITE}/questions/guide-${String(n).padStart(6, "0")}/`, lastmod: "2026-10-31T00:00:00.000Z" }));
  return { site: SITE, fetchedAt: "2026-10-31T01:00:00.000Z", urls, sitemaps: [], sha256: indexNowSha256(JSON.stringify(urls)) };
};
const documentFetcher = (overrides: Record<string, string> = {}) => {
  const docs: Record<string, string> = {
    [`${SITE}/robots.txt`]: robots,
    [`${SITE}/sitemap.xml`]: index([`${SITE}/sitemaps/core.xml`, `${SITE}/sitemaps/questions-1.xml`]),
    [`${SITE}/sitemaps/core.xml`]: urlset([{ url: `${SITE}/` }, { url: `${SITE}/about/` }]),
    [`${SITE}/sitemaps/questions-1.xml`]: urlset([{ url: `${SITE}/questions/packing-a-truck/`, lastmod: "2026-10-30T20:00:00.000Z" }]),
    ...overrides,
  };
  return vi.fn(async (input: string | URL | Request) => {
    const value = String(input); if (!(value in docs)) throw new Error("Unexpected mock URL");
    return new Response(docs[value], { status: 200 });
  }) as unknown as typeof fetch;
};

describe("published IndexNow inventory", () => {
  it("reads only robots and bounded published sitemap segments, deduplicating canonical URLs", async () => {
    const fetcher = documentFetcher({ [`${SITE}/sitemaps/questions-1.xml`]: urlset([{ url: `${SITE}/about/` }, { url: `${SITE}/questions/packing-a-truck/`, lastmod: "2026-10-30T20:00:00.000Z" }]) });
    const result = await collectPublishedInventory(SITE, fetcher);
    expect(result.urls).toEqual([{ url: `${SITE}/`, lastmod: null }, { url: `${SITE}/about/`, lastmod: null }, { url: `${SITE}/questions/packing-a-truck/`, lastmod: "2026-10-30T20:00:00.000Z" }]);
    expect(result.sitemaps).toHaveLength(3);
    expect(result.sha256).toBe(indexNowSha256(JSON.stringify(result.urls)));
    expect(fetcher).toHaveBeenCalledTimes(4);
    for (const call of vi.mocked(fetcher).mock.calls) expect(call[1]).toMatchObject({ redirect: "error", cache: "no-store" });
  });
  it("refuses a closed preview or a different advertised canonical host", async () => {
    await expect(collectPublishedInventory(SITE, documentFetcher({ [`${SITE}/robots.txt`]: `User-agent: *\nDisallow: /\nSitemap: ${SITE}/sitemap.xml` }))).rejects.toThrow(/not open for indexing/);
    await expect(collectPublishedInventory(SITE, documentFetcher({ [`${SITE}/robots.txt`]: "User-agent: *\nAllow: /\nSitemap: https://other.example.com/sitemap.xml" }))).rejects.toThrow(/canonical sitemap/);
  });
  it("refuses off-site sitemap files, arbitrary nested endpoints and private or filtered URLs", async () => {
    for (const target of ["https://other.example.com/sitemaps/core.xml", `${SITE}/api/data.xml`, `${SITE}/sitemaps/../api/data.xml`]) {
      await expect(collectPublishedInventory(SITE, documentFetcher({ [`${SITE}/sitemap.xml`]: index([target]) }))).rejects.toThrow(/off-site file/);
    }
    for (const target of [`${SITE}/my-request/private-token/`, `${SITE}/companies/name/`, `${SITE}/explore/?type=city`, `${SITE}/about/#part`, `${SITE}/about`, "https://other.example.com/about/"]) {
      await expect(collectPublishedInventory(SITE, documentFetcher({ [`${SITE}/sitemaps/core.xml`]: urlset([{ url: target }]) }))).rejects.toThrow(/non-canonical, private, filtered, or off-site/);
    }
  });
  it("refuses sitemap/robots disagreement and oversized or malformed XML", async () => {
    await expect(collectPublishedInventory(SITE, documentFetcher({ [`${SITE}/robots.txt`]: `${robots}\nDisallow: /about/` }))).rejects.toThrow(/robots-blocked/);
    await expect(collectPublishedInventory(SITE, documentFetcher({ [`${SITE}/sitemap.xml`]: "x".repeat(2_000_001) }))).rejects.toThrow(/byte limit/);
    for (const xml of ["<html>not a sitemap</html>", '<!DOCTYPE urlset [<!ENTITY injected "bad">]><urlset/>', "<urlset><url><loc>https://www.example.com/&unknown;</loc></url></urlset>", "<urlset><url><loc>https://www.example.com/</loc><lastmod>tomorrow</lastmod></url></urlset>", "<urlset><url><loc>https://www.example.com/</loc></url><garbage/></urlset>"]) expect(() => parsePublishedSitemap(xml)).toThrow();
  });
  it("permits no insecure origin, user credentials, IP/private host or Vercel preview", () => {
    expect(canonicalIndexingSite(`${SITE}/`)).toBe(SITE);
    for (const value of ["http://www.example.com", "https://user:pass@www.example.com", "https://127.0.0.1", "https://service.internal", "https://preview.vercel.app", `${SITE}/nested/`, `${SITE}/?secret=value`]) expect(() => canonicalIndexingSite(value)).toThrow();
  });
});

describe("bounded IndexNow plans and delivery evidence", () => {
  it("caps every run at 10,000 URLs and 10 batches, and scopes its ledger to host/key/endpoint", () => {
    const source = inventory(10_005), ledger = newIndexNowLedger(SITE, KEY);
    const plan = planIndexNow(source, ledger, { key: KEY });
    expect(plan.chunks).toHaveLength(10); expect(plan.chunks.flat()).toHaveLength(10_000); expect(plan.remaining).toBe(5);
    const small = planIndexNow(source, ledger, { key: KEY, batchSize: 1 });
    expect(small.chunks).toHaveLength(10); expect(small.remaining).toBe(9_995);
    for (const changed of [{ ...ledger, site: "https://other.example.com" }, { ...ledger, keySha256: "a".repeat(64) }, { ...ledger, endpoint: "https://other.example.com/post" }]) expect(() => parseIndexNowLedger(changed, SITE, KEY)).toThrow(/does not match/);
    for (const options of [{ batchSize: 0 }, { limit: 10_001 }, { revision: "bad revision" }]) expect(() => planIndexNow(source, ledger, { ...options, key: KEY })).toThrow(/bounded/);
  });
  it("records attempts before POST, distinguishes 200/202 and skips received versions on rerun", async () => {
    const source = inventory(), ledger = newIndexNowLedger(SITE, KEY), persisted: typeof ledger[] = [];
    let posts = 0;
    const fetcher = vi.fn(async (input, init) => {
      if (String(input) === `${SITE}/indexnow-key.txt`) return new Response(`${KEY}\n`);
      expect(String(input)).toBe(INDEXNOW_ENDPOINT); expect(init).toMatchObject({ method: "POST", redirect: "error" });
      const payload = JSON.parse(init!.body as string);
      expect(payload).toMatchObject({ host: "www.example.com", key: KEY, keyLocation: `${SITE}/indexnow-key.txt` });
      expect(payload.urlList.length).toBeLessThanOrEqual(2);
      expect(persisted.at(-1)!.receipts.filter(row => row.state === "attempting").map(row => row.url)).toEqual(payload.urlList);
      return new Response(null, { status: ++posts === 1 ? 200 : 202 });
    }) as typeof fetch;
    const result = await submitIndexNow(source, ledger, { key: KEY, batchSize: 2, fetcher, persist: async updated => { persisted.push(structuredClone(updated)); } });
    expect(result).toMatchObject({ outcome: "received", submittedUrls: 3, batches: [{ count: 2, state: "received", httpStatus: 200 }, { count: 1, state: "pending_key", httpStatus: 202 }] });
    expect(ledger.receipts.map(row => row.state)).toEqual(["received", "received", "pending_key"]);
    expect(planIndexNow(source, ledger, { key: KEY })).toMatchObject({ chunks: [], skippedReceived: 3 });
    const noMoreFetches = vi.fn();
    expect(await submitIndexNow(source, ledger, { key: KEY, fetcher: noMoreFetches, persist: async () => {} })).toMatchObject({ outcome: "nothing_to_send" });
    expect(noMoreFetches).not.toHaveBeenCalled();
    const changed = structuredClone(source); changed.urls[0]!.lastmod = "2026-11-01T00:00:00.000Z";
    expect(planIndexNow(changed, ledger, { key: KEY }).chunks.flat().map(row => row.url)).toEqual([source.urls[0]!.url]);
  });
  it("never POSTs before the live ownership key matches", async () => {
    const ledger = newIndexNowLedger(SITE, KEY), persist = vi.fn();
    const fetcher = vi.fn(async () => new Response("a-different-public-key"));
    await expect(submitIndexNow(inventory(), ledger, { key: KEY, fetcher, persist })).rejects.toThrow(/does not match/);
    expect(fetcher).toHaveBeenCalledTimes(1); expect(persist).not.toHaveBeenCalled(); expect(ledger.receipts).toEqual([]);
  });
  it("stops on an HTTP refusal and never labels rejected URLs received", async () => {
    const ledger = newIndexNowLedger(SITE, KEY);
    const fetcher = vi.fn(async (input) => String(input).endsWith("/indexnow-key.txt") ? new Response(KEY) : new Response(null, { status: 403 }));
    const result = await submitIndexNow(inventory(), ledger, { key: KEY, batchSize: 1, fetcher, persist: async () => {} });
    expect(result).toMatchObject({ outcome: "partial", submittedUrls: 0, batches: [{ state: "failed", count: 1, httpStatus: 403 }] });
    expect(fetcher).toHaveBeenCalledTimes(2); expect(ledger.receipts).toHaveLength(1);
    expect(planIndexNow(inventory(), ledger, { key: KEY }).chunks.flat()).toHaveLength(3);
  });
  it("holds uncertain/crashed attempts instead of silently repeating them", async () => {
    const ledger = newIndexNowLedger(SITE, KEY);
    const fetcher = vi.fn(async (input) => { if (String(input).endsWith("/indexnow-key.txt")) return new Response(KEY); throw new TypeError("Transport interrupted"); });
    expect(await submitIndexNow(inventory(), ledger, { key: KEY, fetcher, persist: async () => {} })).toMatchObject({ outcome: "partial", submittedUrls: 0, batches: [{ state: "uncertain" }] });
    expect(planIndexNow(inventory(), ledger, { key: KEY })).toMatchObject({ chunks: [], heldUncertain: 3 });
    expect(planIndexNow(inventory(), ledger, { key: KEY, retryUncertain: true }).chunks.flat()).toHaveLength(3);
    ledger.receipts[0]!.state = "attempting";
    expect(planIndexNow(inventory(), ledger, { key: KEY }).heldUncertain).toBe(3);
  });
  it("honors 429 Retry-After and stops before sending another batch", async () => {
    const ledger = newIndexNowLedger(SITE, KEY);
    const fetcher = vi.fn(async (input) => String(input).endsWith("/indexnow-key.txt") ? new Response(KEY) : new Response(null, { status: 429, headers: { "retry-after": "7200" } }));
    const result = await submitIndexNow(inventory(), ledger, { key: KEY, batchSize: 1, fetcher, persist: async () => {} });
    expect(result).toMatchObject({ outcome: "partial", batches: [{ httpStatus: 429 }] });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(planIndexNow(inventory(), ledger, { key: KEY })).toMatchObject({ chunks: [], heldRateLimited: 3 });
    expect(planIndexNow(inventory(), ledger, { key: KEY, now: new Date(Date.now() + 3 * 3_600_000) }).heldRateLimited).toBe(0);
  });
  it("does not send anything if recording the preflight attempt fails", async () => {
    const fetcher = vi.fn(async () => new Response(KEY));
    await expect(submitIndexNow(inventory(), newIndexNowLedger(SITE, KEY), { key: KEY, fetcher, persist: async () => { throw new Error("Disk unavailable"); } })).rejects.toThrow(/Disk unavailable/);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
