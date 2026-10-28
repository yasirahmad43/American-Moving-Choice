import "server-only";

/**
 * Segmented sitemaps (site architecture §8.4): /sitemap.xml is an index pointing at
 * /sitemaps/core.xml (static and content pages), states.xml, cities-N.xml, zips.xml,
 * routes-N.xml, services.xml, costs.xml, questions.xml and planning.xml. Only published,
 * indexable pages appear; lastmod is seo_pages.updated_at (the last substantive change, never the
 * render time). Core pages carry no lastmod because drafts have none yet.
 */
import { env } from "@amc/server/env";
import { indexableCounts, sitemapEntries, type SeoFamily } from "@amc/server/seo";
import { servedContentPages } from "@/lib/content/pages";

export const SITEMAP_CHUNK = 1000;

const STATIC_PAGES = [
  "/",
  "/about/",
  "/contact/",
  "/complaints/",
  "/report-a-concern/",
  "/privacy/",
  "/terms/",
  "/mover-terms/",
  "/for-movers/",
  "/for-movers/eligibility/",
  "/for-movers/moving-leads/",
  "/for-movers/pricing/",
  "/for-movers/reviews-and-reputation/",
  "/get-quotes/",
  "/moving-cost-calculator/",
  "/verify-a-mover/",
  "/directory/",
  "/movers/",
  "/routes/",
  "/services/",
  "/questions/",
  "/planning/",
];

const SEGMENTS: { name: string; family: SeoFamily; chunked: boolean }[] = [
  { name: "states", family: "state", chunked: false },
  { name: "cities", family: "city", chunked: true },
  { name: "zips", family: "zip", chunked: false },
  { name: "routes", family: "route", chunked: true },
  { name: "services", family: "service", chunked: false },
  { name: "costs", family: "cost", chunked: false },
  { name: "questions", family: "question", chunked: false },
  { name: "planning", family: "planning", chunked: false },
];

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files
    .map((f) => `  <sitemap><loc>${escape(f.loc)}</loc>${f.lastmod ? `<lastmod>${f.lastmod.toISOString()}</lastmod>` : ""}</sitemap>`)
    .join("\n")}\n</sitemapindex>\n`;
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
    const urls = [...new Set([...STATIC_PAGES, ...servedContentPages().map((p) => p.meta.url)])];
    return urlset(urls.map((url) => ({ url })));
  }
  const match = /^([a-z]+)(?:-(\d+))?$/.exec(name);
  if (!match) return null;
  const seg = SEGMENTS.find((s) => s.name === match[1]);
  if (!seg) return null;
  const page = match[2] ? Number(match[2]) : null;
  if (seg.chunked ? page === null || page < 1 : page !== null) return null;
  const entries = await sitemapEntries(seg.family);
  const slice = seg.chunked ? entries.slice((page! - 1) * SITEMAP_CHUNK, page! * SITEMAP_CHUNK) : entries;
  if (seg.chunked && !slice.length) return null;
  return urlset(slice);
}
