/**
 * Reads for the public templates and sitemaps: a published page by URL, the published URLs a
 * page may link to, redirects, children and sitemap entries. Only published rows are served;
 * everything else is a 404 (site architecture §4.2).
 */
import type { Queryable } from "../db/pool";
import { getPool } from "../db/pool";
import { HUB_URLS, STATIC_LINK_PREFIXES, isSeoUrl } from "./publish";
import type { SeoFamily, SeoStatus } from "./slugs";
import type { RelatedGroup, SeoContent, SeoPageRecord, SourceRef } from "./types";

interface Row {
  id: string;
  url: string;
  slug: string;
  family: SeoFamily;
  state_code: string | null;
  city_id: number | null;
  zip: string | null;
  route_id: number | null;
  primary_keyword: string;
  intent: string;
  supporting_keywords: string[];
  parent_url: string | null;
  title: string;
  meta_description: string;
  h1: string;
  status: SeoStatus;
  indexable: boolean;
  content: SeoContent;
  content_hash: string;
  unique_share: number | null;
  evidence_count: number;
  sources: SourceRef[];
  media_ids: string[];
  blocked_reason: string | null;
  gate_results: Record<string, { passed: boolean; detail: string }>;
  reviewed_by: string | null;
  last_reviewed_at: Date | null;
  published_at: Date | null;
  updated_at: Date;
  canonical_url: string;
}

const COLUMNS = "id, url, slug, family, state_code, city_id, zip, route_id, primary_keyword, intent, supporting_keywords, parent_url, title, meta_description, h1, status, indexable, content, content_hash, unique_share, evidence_count, sources, media_ids, blocked_reason, gate_results, reviewed_by, last_reviewed_at, published_at, updated_at, canonical_url";

const toRecord = (r: Row): SeoPageRecord => ({
  id: r.id,
  url: r.url,
  slug: r.slug,
  family: r.family,
  stateCode: r.state_code,
  cityId: r.city_id,
  zip: r.zip,
  routeId: r.route_id,
  primaryKeyword: r.primary_keyword,
  intent: r.intent,
  supportingKeywords: r.supporting_keywords,
  parentUrl: r.parent_url,
  title: r.title,
  metaDescription: r.meta_description,
  h1: r.h1,
  status: r.status,
  indexable: r.indexable,
  content: r.content,
  contentHash: r.content_hash,
  uniqueShare: r.unique_share,
  evidenceCount: r.evidence_count,
  sources: r.sources,
  mediaIds: r.media_ids,
  blockedReason: r.blocked_reason,
  gateResults: r.gate_results,
  reviewedBy: r.reviewed_by,
  lastReviewedAt: r.last_reviewed_at,
  publishedAt: r.published_at,
  updatedAt: r.updated_at,
  canonicalUrl: r.canonical_url,
});

/** A published page, or null (unpublished and unknown URLs look the same: 404). */
export async function publishedPage(url: string, db: Queryable = getPool()): Promise<SeoPageRecord | null> {
  const result = await db.query<Row>(`select ${COLUMNS} from seo_pages where url = $1 and status = 'published'`, [url]);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

/** The related groups of a page with every link to an unpublished SEO page removed (no 404s, site architecture §3.3). */
export async function publishedRelated(page: SeoPageRecord, db: Queryable = getPool()): Promise<RelatedGroup[]> {
  const candidates = [...new Set(page.content.related.flatMap((g) => g.links.map((l) => l.href)).filter(isSeoUrl))];
  const live = new Set(candidates.length ? (await db.query<{ url: string }>("select url from seo_pages where url = any($1::text[]) and status = 'published'", [candidates])).rows.map((r) => r.url) : []);
  return page.content.related
    .map((group) => ({ heading: group.heading, links: group.links.filter((l) => (isSeoUrl(l.href) ? live.has(l.href) : HUB_URLS.has(l.href) || STATIC_LINK_PREFIXES.some((p) => l.href.startsWith(p)))) }))
    .filter((group) => group.links.length);
}

/** Published URLs among a list (for inline links and breadcrumbs). */
export async function publishedAmong(urls: string[], db: Queryable = getPool()): Promise<Set<string>> {
  const seo = urls.filter(isSeoUrl);
  if (!seo.length) return new Set(urls.filter((u) => !isSeoUrl(u)));
  const result = await db.query<{ url: string }>("select url from seo_pages where url = any($1::text[]) and status = 'published'", [seo]);
  return new Set([...urls.filter((u) => !isSeoUrl(u)), ...result.rows.map((r) => r.url)]);
}

export interface PageSummary {
  url: string;
  title: string;
  h1: string;
  family: SeoFamily;
  stateCode: string | null;
  updatedAt: Date;
  indexable: boolean;
}

/** Published pages of a family (hubs and sitemaps), oldest URL order for stable output. */
export async function publishedPages(family: SeoFamily, db: Queryable = getPool(), options: { parentUrl?: string; stateCode?: string; limit?: number } = {}): Promise<PageSummary[]> {
  const result = await db.query<{ url: string; title: string; h1: string; family: SeoFamily; state_code: string | null; updated_at: Date; indexable: boolean }>(
    `select url, title, h1, family, state_code, updated_at, indexable from seo_pages
      where family = $1 and status = 'published' and ($2::text is null or parent_url = $2) and ($3::text is null or state_code = $3)
      order by url limit $4`,
    [family, options.parentUrl ?? null, options.stateCode ?? null, options.limit ?? 100_000],
  );
  return result.rows.map((r) => ({ url: r.url, title: r.title, h1: r.h1, family: r.family, stateCode: r.state_code, updatedAt: r.updated_at, indexable: r.indexable }));
}

/** Published, indexable pages for a sitemap segment (never noindex or draft pages). */
export async function sitemapEntries(family: SeoFamily, db: Queryable = getPool()): Promise<{ url: string; lastmod: Date }[]> {
  const result = await db.query<{ url: string; updated_at: Date }>("select url, updated_at from seo_pages where family = $1 and status = 'published' and indexable order by url", [family]);
  return result.rows.map((r) => ({ url: r.url, lastmod: r.updated_at }));
}

/** Count of indexable pages per family, for the sitemap index. */
export async function indexableCounts(db: Queryable = getPool()): Promise<Map<SeoFamily, { count: number; lastmod: Date }>> {
  const result = await db.query<{ family: SeoFamily; n: number; lastmod: Date }>("select family, count(*)::int as n, max(updated_at) as lastmod from seo_pages where status = 'published' and indexable group by family");
  return new Map(result.rows.map((r) => [r.family, { count: r.n, lastmod: r.lastmod }]));
}

/** The 301 target for a retired URL, if one is recorded. */
export async function redirectFor(url: string, db: Queryable = getPool()): Promise<string | null> {
  const result = await db.query<{ target_url: string }>("select target_url from seo_redirects where source_url = $1", [url]);
  return result.rows[0]?.target_url ?? null;
}

/** Inbound links to a URL (for the crawl report and the orphan check). */
export async function inboundLinkCount(url: string, db: Queryable = getPool()): Promise<number> {
  const result = await db.query<{ n: number }>("select count(*)::int as n from seo_links where to_url = $1", [url]);
  return result.rows[0]?.n ?? 0;
}

/** The state hubs the /movers/ index lists: published state pages. */
export async function publishedStateUrls(db: Queryable = getPool()): Promise<{ url: string; stateCode: string; h1: string }[]> {
  const result = await db.query<{ url: string; state_code: string; h1: string }>("select url, state_code, h1 from seo_pages where family = 'state' and status = 'published' order by h1");
  return result.rows.map((r) => ({ url: r.url, stateCode: r.state_code, h1: r.h1 }));
}

/** One page of a family's published pages (hub pagination), with the total so the hub can number its pages. */
export async function publishedPagesPage(family: SeoFamily, page: number, perPage: number, db: Queryable = getPool()): Promise<{ pages: PageSummary[]; total: number }> {
  const total = (await db.query<{ n: number }>("select count(*)::int as n from seo_pages where family = $1 and status = 'published'", [family])).rows[0]!.n;
  const result = await db.query<{ url: string; title: string; h1: string; family: SeoFamily; state_code: string | null; updated_at: Date; indexable: boolean }>(
    "select url, title, h1, family, state_code, updated_at, indexable from seo_pages where family = $1 and status = 'published' order by url limit $2 offset $3",
    [family, perPage, Math.max(0, page - 1) * perPage],
  );
  return { pages: result.rows.map((r) => ({ url: r.url, title: r.title, h1: r.h1, family: r.family, stateCode: r.state_code, updatedAt: r.updated_at, indexable: r.indexable })), total };
}
