import "server-only";

/**
 * Segmented sitemaps (site architecture §8.4): /sitemap.xml is an index pointing at
 * /sitemaps/core.xml (static and content pages), states.xml, cities-N.xml, zips.xml,
 * routes-N.xml, services.xml, costs.xml, questions-N.xml and planning-N.xml. Only published,
 * indexable pages appear; lastmod is seo_pages.updated_at (the last substantive change, never the
 * render time). Core pages carry no lastmod because drafts have none yet.
 */
import { env } from "@amc/server/env";
import { indexableCounts, sitemapEntries, SEO_SITEMAP_CHUNK, SEO_SITEMAP_SEGMENTS } from "@amc/server/seo";
import { servedContentPages } from "./content/pages";
import { ROUTES_HUB } from "../components/seo/routes-hub-spec";
import { QUESTIONS_HUB, PLANNING_HUB } from "../components/seo/editorial-hub-specs";
import { hubPagePath } from "../components/seo/hub-pagination";
import { PUBLIC_STATIC_LINKS } from "./site";

export const SITEMAP_CHUNK = SEO_SITEMAP_CHUNK;

const STATIC_PAGES = PUBLIC_STATIC_LINKS.map((link) => link.href);

const SEGMENTS = SEO_SITEMAP_SEGMENTS;

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function sitemapIndex(files: { loc: string; lastmod?: Date }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files
    .map((f) => `  <sitemap><loc>${escape(f.loc)}</loc>${f.lastmod ? `<lastmod>${f.lastmod.toISOString()}</lastmod>` : ""}</sitemap>`)
    .join("\n")}\n</sitemapindex>\n`;
}

export async function sitemapIndexXml(): Promise<string> {
  const { WEB_URL } = env();
  const counts = await indexableCounts();
  const files: { loc: string; lastmod?: Date }[] = [{ loc: `${WEB_URL}/sitemaps/core.xml` }];
  for (const seg of SEGMENTS) {
    const entry = counts.get(seg.family);
    if (!entry || entry.count === 0) continue;
    if (!seg.chunked) files.push({ loc: `${WEB_URL}/sitemaps/${seg.name}.xml`, lastmod: entry.lastmod });
    else for (let i = 1; i <= Math.ceil(entry.count / SITEMAP_CHUNK); i++) files.push({ loc: `${WEB_URL}/sitemaps/${seg.name}-${i}.xml`, lastmod: entry.lastmod });
  }
  return sitemapIndex(files);
}

function urlset(entries: { url: string; lastmod?: Date }[]): string {
  const { WEB_URL } = env();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${escape(`${WEB_URL}${e.url}`)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
}

/** The XML for one segment file name ("core", "states", "cities-2"), or null for an unknown name. */
export async function sitemapSegmentXml(name: string): Promise<string | null> {
  if (name === "core") {
    const urls = [...new Set([...STATIC_PAGES, ...servedContentPages().map((p) => p.meta.url)])].filter((url) => url !== "/advertising-disclosure/");
    const counts = await indexableCounts();
    for (const hub of [ROUTES_HUB, QUESTIONS_HUB, PLANNING_HUB]) {
      const total = counts.get(hub.family)?.count ?? 0;
      for (let page = 2; page <= Math.ceil(total / hub.perPage!); page++) urls.push(hubPagePath(hub.url, page));
    }
    return urlset(urls.map((url) => ({ url })));
  }
  const match = /^([a-z]+)(?:-([1-9][0-9]{0,5}))?$/.exec(name);
  if (!match) return null;
  const seg = SEGMENTS.find((s) => s.name === match[1]);
  if (!seg) return null;
  const page = match[2] ? Number(match[2]) : null;
  // Preserve old endpoints as complete indexes, without returning an unbounded family or
  // silently truncating it. The canonical root index references numbered files directly.
  if (page === null && (seg.family === "question" || seg.family === "planning")) {
    const { WEB_URL } = env();
    const entry = (await indexableCounts()).get(seg.family);
    if (!entry?.count) return urlset([]);
    return sitemapIndex(Array.from({ length: Math.ceil(entry.count / SITEMAP_CHUNK) }, (_, i) => ({ loc: `${WEB_URL}/sitemaps/${seg.name}-${i + 1}.xml`, lastmod: entry.lastmod })));
  }
  if (seg.chunked ? page === null || page < 1 : page !== null) return null;
  const entries = seg.chunked
    ? await sitemapEntries(seg.family, { limit: SITEMAP_CHUNK, offset: (page! - 1) * SITEMAP_CHUNK })
    : await sitemapEntries(seg.family);
  if (seg.chunked && !entries.length) return null;
  return urlset(entries);
}
