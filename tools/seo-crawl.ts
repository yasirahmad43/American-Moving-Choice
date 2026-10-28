/**
 * Small site crawler for the SEO checks (site architecture §3.3, §8; seo-technical skill).
 *
 *   pnpm seo:crawl [--base http://localhost:3500] [--out docs/seo/crawl-report.md] [--max 5000] [--concurrency 6]
 *
 * Starts from / and the sitemap index, follows every same-origin <a href>, and reports: broken
 * links (non-200), redirect chains, duplicate titles and descriptions, missing or multiple H1s,
 * canonical mismatches (canonical ≠ final URL on indexable pages), noindex counts, orphans
 * (indexable pages with no inbound link from another crawled page), pages deeper than 3 clicks,
 * sitemap URLs that don't return 200, and sitemap/noindex contradictions. Plain fetch, no
 * browser: everything checked must be in the server-rendered HTML.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface PageInfo {
  url: string;
  status: number;
  finalUrl: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  h1s: string[];
  jsonLdTypes: string[];
  depth: number;
  links: string[];
  inbound: Set<string>;
  bytes: number;
  faqVisible: boolean;
  faqSchema: boolean;
  xRobots: string | null;
}

const args = process.argv.slice(2);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const BASE = opt("base", "http://localhost:3500").replace(/\/$/, "");
// pnpm runs the script inside packages/server; the report path is relative to where the command was typed.
const OUT = resolve(process.env.INIT_CWD ?? process.cwd(), opt("out", "docs/seo/crawl-report.md"));
const MAX = Number(opt("max", "5000"));
const CONCURRENCY = Math.max(1, Number(opt("concurrency", "6")));

const attr = (tag: string, name: string): string | null => {
  const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? (m[2] ?? m[3] ?? "") : null;
};

function parse(html: string) {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? null;
  let description: string | null = null;
  let canonical: string | null = null;
  let robots: string | null = null;
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = (attr(tag, "name") ?? "").toLowerCase();
    if (name === "description") description = attr(tag, "content");
    if (name === "robots") robots = attr(tag, "content");
  }
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if ((attr(tag, "rel") ?? "").toLowerCase() === "canonical") canonical = attr(tag, "href");
  }
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1]!.replace(/<[^>]+>/g, "").trim());
  const jsonLdTypes: string[] = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]!) as { "@type"?: string } | { "@type"?: string }[];
      for (const item of Array.isArray(data) ? data : [data]) if (item["@type"]) jsonLdTypes.push(item["@type"]);
    } catch {
      jsonLdTypes.push("INVALID_JSON_LD");
    }
  }
  const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')/gi)].map((m) => m[2] ?? m[3] ?? "");
  const faqVisible = /id="faq-h"/.test(html);
  return { title, description, canonical, robots, h1s, jsonLdTypes, links, faqVisible, faqSchema: jsonLdTypes.includes("FAQPage") };
}

function normalize(href: string, from: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return null;
  let url: URL;
  try {
    url = new URL(href, from);
  } catch {
    return null;
  }
  if (url.origin !== BASE) return null;
  url.hash = "";
  return url.toString();
}

async function fetchPage(url: string): Promise<{ status: number; finalUrl: string; html: string; hops: number; xRobots: string | null }> {
  let current = url;
  let hops = 0;
  for (;;) {
    const res = await fetch(current, { redirect: "manual", headers: { "user-agent": "amc-seo-crawl/1" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      hops++;
      current = new URL(res.headers.get("location")!, current).toString();
      if (hops > 5) return { status: 599, finalUrl: current, html: "", hops, xRobots: null };
      continue;
    }
    const html = res.headers.get("content-type")?.includes("text/html") ? await res.text() : "";
    return { status: res.status, finalUrl: current, html, hops, xRobots: res.headers.get("x-robots-tag") };
  }
}

async function sitemapUrls(): Promise<{ files: string[]; urls: Map<string, string | null> }> {
  const files: string[] = [];
  const urls = new Map<string, string | null>();
  const index = await fetch(`${BASE}/sitemap.xml`);
  if (!index.ok) return { files, urls };
  const indexXml = await index.text();
  for (const m of indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)) files.push(m[1]!);
  for (const file of files) {
    const res = await fetch(file);
    if (!res.ok) continue;
    const xml = await res.text();
    for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)) urls.set(m[1]!, m[2] ?? null);
  }
  return { files, urls };
}

async function main(): Promise<void> {
  const pages = new Map<string, PageInfo>();
  const queue: { url: string; depth: number; from: string | null }[] = [{ url: `${BASE}/`, depth: 0, from: null }];
  const redirects: { from: string; to: string; hops: number }[] = [];
  const sitemap = await sitemapUrls();
  for (const url of sitemap.urls.keys()) queue.push({ url, depth: 99, from: "sitemap" });
  const seen = new Set<string>();
  // Workers share one queue (index pointer, never shift() on a long array); links found by one
  // worker are queued for any worker. Inbound/depth bookkeeping is on the single thread.
  let head = 0;
  const started = Date.now();
  let fetched = 0;
  const work = async (): Promise<void> => {
    for (;;) {
      if (pages.size >= MAX) return;
      while (head < queue.length && seen.has(queue[head]!.url)) {
        const next = queue[head++]!;
        const page = pages.get(next.url);
        if (page) {
          if (next.from && next.from !== "sitemap") page.inbound.add(next.from);
          if (next.depth < page.depth) page.depth = next.depth;
        }
      }
      if (head >= queue.length) return;
      const next = queue[head++]!;
      seen.add(next.url);
      const { status, finalUrl, html, hops, xRobots } = await fetchPage(next.url);
      if (hops) redirects.push({ from: next.url, to: finalUrl, hops });
      const parsed = parse(html);
      const info: PageInfo = {
        url: next.url,
        status,
        finalUrl,
        ...parsed,
        depth: next.depth,
        inbound: new Set(next.from && next.from !== "sitemap" ? [next.from] : []),
        bytes: Buffer.byteLength(html),
        xRobots,
      };
      pages.set(next.url, info);
      if (++fetched % 500 === 0) console.log(`crawled ${fetched} pages, ${queue.length - head} queued (${Math.round((Date.now() - started) / 1000)}s)`);
      if (status === 200 && html) {
        for (const href of parsed.links) {
          const target = normalize(href, finalUrl);
          if (!target) continue;
          if (seen.has(target)) {
            const t = pages.get(target);
            if (t) {
              t.inbound.add(next.url);
              if (next.depth + 1 < t.depth) t.depth = next.depth + 1;
            }
          } else queue.push({ url: target, depth: next.depth + 1, from: next.url });
        }
      }
    }
  };
  // Drain with a pool; a worker that finds the queue empty retires, and the pool is restarted while
  // other workers may still add links.
  for (;;) {
    await Promise.all(Array.from({ length: CONCURRENCY }, () => work()));
    if (head >= queue.length || pages.size >= MAX) break;
  }
  // Second pass: depth via BFS from home over the crawled graph (sitemap entries started at 99).
  const depth = new Map<string, number>([[`${BASE}/`, 0]]);
  const bfs = [`${BASE}/`];
  while (bfs.length) {
    const u = bfs.shift()!;
    const p = pages.get(u);
    if (!p) continue;
    for (const href of p.links) {
      const t = normalize(href, p.finalUrl);
      if (t && !depth.has(t)) {
        depth.set(t, depth.get(u)! + 1);
        bfs.push(t);
      }
    }
  }

  const all = [...pages.values()];
  const ok = all.filter((p) => p.status === 200 && p.title !== null);
  const isNoindex = (p: PageInfo) => /noindex/i.test(p.robots ?? "") || /noindex/i.test(p.xRobots ?? "");
  const indexable = ok.filter((p) => !isNoindex(p));
  const broken = all.filter((p) => p.status !== 200);
  const brokenWithSources = broken.map((p) => ({ url: p.url, status: p.status, from: [...p.inbound].slice(0, 3) }));
  const dupTitles = groupDup(indexable, (p) => p.title ?? "");
  const dupDesc = groupDup(indexable, (p) => p.description ?? "");
  const noDesc = indexable.filter((p) => !p.description);
  const h1Issues = ok.filter((p) => p.h1s.length !== 1);
  const canonicalMismatch = indexable.filter((p) => !p.canonical || p.canonical !== p.finalUrl);
  const orphans = indexable.filter((p) => p.inbound.size === 0 && p.url !== `${BASE}/`);
  const deep = indexable.filter((p) => (depth.get(p.url) ?? 99) > 3);
  const noindexCount = ok.filter(isNoindex).length;
  const sitemapMissing = [...sitemap.urls.keys()].filter((u) => pages.get(u)?.status !== 200);
  const sitemapNoindex = [...sitemap.urls.keys()].filter((u) => {
    const p = pages.get(u);
    return p && isNoindex(p);
  });
  const indexableNotInSitemap = indexable.filter((p) => !sitemap.urls.has(p.url) && !p.url.includes("?"));
  const chains = redirects.filter((r) => r.hops > 1);
  const invalidLd = ok.filter((p) => p.jsonLdTypes.includes("INVALID_JSON_LD"));
  const faqMismatch = ok.filter((p) => p.faqSchema !== p.faqVisible && p.jsonLdTypes.length > 0);
  const big = ok.filter((p) => p.bytes > 2_000_000);
  const byFamily = new Map<string, number>();
  for (const p of indexable) {
    const seg = new URL(p.url).pathname.split("/")[1] || "home";
    byFamily.set(seg, (byFamily.get(seg) ?? 0) + 1);
  }

  const list = (items: string[], max = 25) => (items.length ? items.slice(0, max).map((i) => `- ${i}`).join("\n") + (items.length > max ? `\n- … and ${items.length - max} more` : "") : "- none");
  const report = `# Crawl report: ${BASE}

Generated ${new Date().toISOString()} by \`pnpm seo:crawl\` (tools/seo-crawl.ts). Plain HTTP fetch of the server-rendered HTML, starting from the home page and the sitemap index, following every same-origin link.

## Summary

| Check | Result |
|---|---|
| URLs fetched | ${all.length} |
| 200 HTML pages | ${ok.length} |
| Indexable pages (no noindex) | ${indexable.length} |
| noindex pages | ${noindexCount} |
| Broken links (non-200 targets) | ${broken.length} |
| Redirects followed | ${redirects.length} (chains > 1 hop: ${chains.length}) |
| Duplicate titles (groups) | ${dupTitles.length} |
| Duplicate descriptions (groups) | ${dupDesc.length} |
| Indexable pages without a description | ${noDesc.length} |
| Pages without exactly one H1 | ${h1Issues.length} |
| Canonical mismatches (indexable pages) | ${canonicalMismatch.length} |
| Orphans (indexable, no inbound link) | ${orphans.length} |
| Indexable pages deeper than 3 clicks from home | ${deep.length} |
| Sitemap files | ${sitemap.files.length} |
| Sitemap URLs | ${sitemap.urls.size} (non-200: ${sitemapMissing.length}; noindex: ${sitemapNoindex.length}) |
| Indexable pages missing from the sitemap | ${indexableNotInSitemap.length} |
| Invalid JSON-LD blocks | ${invalidLd.length} |
| FAQ schema without visible FAQ (or vice versa) | ${faqMismatch.length} |
| Pages over 2 MB of HTML | ${big.length} |

### Indexable pages by first path segment

${[...byFamily.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `- /${k === "home" ? "" : k + "/"}: ${v}`).join("\n")}

## Broken links

${list(brokenWithSources.map((b) => `${b.status} ${b.url}${b.from.length ? ` (linked from ${b.from.join(", ")})` : ""}`))}

## Redirect chains

${list(chains.map((r) => `${r.from} → ${r.to} (${r.hops} hops)`))}

## Duplicate titles

${list(dupTitles.map((g) => `"${g.key}": ${g.urls.join(", ")}`))}

## Duplicate descriptions

${list(dupDesc.map((g) => `"${g.key.slice(0, 80)}…": ${g.urls.join(", ")}`))}

## Pages without exactly one H1

${list(h1Issues.map((p) => `${p.url} (${p.h1s.length} H1s)`))}

## Canonical mismatches

${list(canonicalMismatch.map((p) => `${p.url}: canonical ${p.canonical ?? "missing"}`))}

## Orphans

${list(orphans.map((p) => p.url))}

## Deeper than 3 clicks

${list(deep.map((p) => `${p.url} (depth ${depth.get(p.url) ?? "unreachable from home"})`))}

## Sitemap issues

${list([...sitemapMissing.map((u) => `non-200: ${u}`), ...sitemapNoindex.map((u) => `noindex in sitemap: ${u}`), ...indexableNotInSitemap.map((p) => `indexable but not in sitemap: ${p.url}`)])}

## Structured data

${list([...invalidLd.map((p) => `invalid JSON-LD: ${p.url}`), ...faqMismatch.map((p) => `FAQ schema/visibility mismatch: ${p.url}`)])}

## noindex pages

${list(ok.filter(isNoindex).map((p) => `${p.url} (${p.robots ?? p.xRobots})`))}
`;
  writeFileSync(OUT, report);
  console.log(report.split("\n").slice(0, 30).join("\n"));
  console.log(`\nWrote ${OUT}`);
}

function groupDup(pages: PageInfo[], key: (p: PageInfo) => string): { key: string; urls: string[] }[] {
  const map = new Map<string, string[]>();
  for (const p of pages) {
    const k = key(p);
    if (!k) continue;
    map.set(k, [...(map.get(k) ?? []), p.url]);
  }
  return [...map.entries()].filter(([, urls]) => urls.length > 1).map(([k, urls]) => ({ key: k, urls }));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
