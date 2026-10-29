/**
 * `pnpm seo:publish --status ready [--family x] [--limit n]`: publishes pages in the given status,
 * marks them indexable when nothing blocks them, then rebuilds the internal link graph
 * (seo_links) so every stored link points at a published page. Unpublishing (status back to
 * draft) drops a page's links and takes it out of the sitemaps the same run.
 */
import type { Queryable } from "../db/pool";
import { CITY_PAGE_MIN_POPULATION } from "./geo-import";
import type { SeoFamily } from "./slugs";
import type { SeoContent } from "./types";

/** Paths outside the SEO families that pages may always link to (owned by other slices). */
export const STATIC_LINK_PREFIXES = ["/get-quotes/", "/moving-cost-calculator/", "/moving-costs/", "/verify-a-mover/", "/directory/", "/companies/", "/how-we-verify-movers/", "/movers-vs-brokers/", "/which-companies-receive-my-request/", "/advertising-disclosure/", "/review-methodology/", "/editorial-policy/", "/report-a-concern/", "/movers/", "/routes/", "/services/", "/questions/", "/planning/", "/about/", "/contact/"];

export const SEO_PREFIXES = ["/movers/", "/routes/", "/services/", "/moving-costs/", "/questions/", "/planning/"];

/** Hub URLs rendered by the app itself (not seo_pages rows) that always exist. */
export const HUB_URLS = new Set(["/movers/", "/routes/", "/services/", "/moving-costs/", "/questions/", "/planning/", "/moving-costs/how-movers-charge/", "/moving-cost-calculator/method/"]);

/** Paginated hub pages (/routes/page/2/ …) are rendered by the app, not stored rows. */
const HUB_PAGE = /^\/(movers|routes|services|moving-costs|questions|planning)\/page\/[0-9]+\/$/;

export function isSeoUrl(url: string): boolean {
  return SEO_PREFIXES.some((p) => url.startsWith(p)) && !HUB_URLS.has(url) && !HUB_PAGE.test(url);
}

export interface PublishOptions {
  status?: "ready" | "review" | "draft";
  family?: SeoFamily;
  limit?: number;
  /** Explicit reviewed cohort; unrelated ready drafts must not be published by a batch job. */
  urls?: string[];
  log?: (line: string) => void;
}

export interface PublishSummary {
  published: number;
  indexable: number;
  links: number;
}

export async function publishPages(db: Queryable, options: PublishOptions = {}): Promise<PublishSummary> {
  const status = options.status ?? "ready";
  const log = options.log ?? (() => undefined);
  const result = await db.query<{ url: string; indexable: boolean }>(
    `with chosen as (
       select id from seo_pages where status = $1 and blocked_reason is null
         and not exists (select 1 from jsonb_each(gate_results) g where g.value->>'passed' = 'false')
         and ($2::text is null or family = $2) and ($4::text[] is null or url = any($4::text[])) order by family, url limit $3
     )
     update seo_pages p set status = 'published', published_at = coalesce(p.published_at, now()), indexable = (p.blocked_reason is null), canonical_url = p.url
       from chosen where chosen.id = p.id
     returning p.url, p.indexable`,
    [status, options.family ?? null, options.limit ?? 100_000, options.urls ?? null],
  );
  log(`published ${result.rows.length} pages (${result.rows.filter((r) => r.indexable).length} indexable)`);
  const redirects = await syncRouteRedirects(db);
  const links = await rebuildLinks(db, log);
  log(`links: ${links}; /moving-routes/ redirects: ${redirects}`);
  return { published: result.rows.length, indexable: result.rows.filter((r) => r.indexable).length, links };
}

/**
 * One seo_redirects row per published route so the planned /moving-routes/{slug}/ URL (site
 * architecture §2.1) 301s to the page at /routes/{slug}/; rows of unpublished routes are removed.
 */
export async function syncRouteRedirects(db: Queryable): Promise<number> {
  await db.query(
    `insert into seo_redirects (source_url, target_url, reason)
       select '/moving-routes/' || slug || '/', url, 'route family lives at /routes/ (site architecture §2.1 planned /moving-routes/)'
         from seo_pages where family = 'route' and status = 'published'
     on conflict (source_url) do update set target_url = excluded.target_url`,
  );
  await db.query(
    `delete from seo_redirects r where r.source_url like '/moving-routes/%'
       and not exists (select 1 from seo_pages p where p.url = r.target_url and p.status = 'published')`,
  );
  return (await db.query<{ n: number }>("select count(*)::int as n from seo_redirects where source_url like '/moving-routes/%'")).rows[0]!.n;
}

/** Unpublishes pages (back to draft, not indexable) and drops their links. */
export async function unpublishPages(db: Queryable, urls: string[]): Promise<number> {
  const result = await db.query("update seo_pages set status = 'draft', indexable = false where url = any($1::text[]) and status = 'published'", [urls]);
  await rebuildLinks(db);
  return result.rowCount ?? 0;
}

/**
 * Rebuilds seo_links from every published page's related modules and inline links, keeping only
 * published targets. Pages are read in batches (never every page's content at once) and the
 * rows written per batch, so tens of thousands of pages fit in a small heap.
 */
export async function rebuildLinks(db: Queryable, log: (line: string) => void = () => undefined): Promise<number> {
  const published = new Set((await db.query<{ url: string }>("select url from seo_pages where status = 'published'")).rows.map((r) => r.url));
  await db.query("delete from seo_links");
  let total = 0;
  let after = "";
  const batch = 500;
  for (;;) {
    const pages = await db.query<{ id: string; url: string; content: SeoContent; parent_url: string | null }>("select id, url, content, parent_url from seo_pages where status = 'published' and url > $1 order by url limit $2", [after, batch]);
    if (!pages.rows.length) break;
    after = pages.rows[pages.rows.length - 1]!.url;
    const rows: unknown[][] = [];
    for (const page of pages.rows) {
      const seen = new Set<string>();
      const add = (to: string, relation: string, anchor: string, position: number) => {
        if (to === page.url) return;
        if (isSeoUrl(to) ? !published.has(to) : !STATIC_LINK_PREFIXES.some((p) => to.startsWith(p)) && !HUB_URLS.has(to)) return;
        const key = `${to}|${relation}`;
        if (seen.has(key)) return;
        seen.add(key);
        rows.push([page.id, to, relation, anchor, position]);
      };
      if (page.parent_url) add(page.parent_url, "breadcrumb", "parent", 0);
      let position = 0;
      for (const group of page.content.related) for (const link of group.links) add(link.href, link.relation, link.label, position++);
      const inline = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;
      const text = JSON.stringify(page.content.sections) + JSON.stringify(page.content.intro) + JSON.stringify(page.content.faq);
      for (let m = inline.exec(text); m; m = inline.exec(text)) add(m[2]!, "inline", m[1]!, position++);
    }
    const chunk = 2000;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const values = slice.map((_, r) => `($${r * 5 + 1}, $${r * 5 + 2}, $${r * 5 + 3}, $${r * 5 + 4}, $${r * 5 + 5})`).join(", ");
      await db.query(`insert into seo_links (from_page_id, to_url, relation, anchor, position) values ${values} on conflict do nothing`, slice.flat());
    }
    total += rows.length;
    log(`links: ${total} rows after ${after}`);
  }
  return total;
}

export interface PipelineCounts {
  family: string;
  planned: number;
  researched: number;
  drafted: number;
  reviewed: number;
  ready: number;
  published: number;
  indexable: number;
  blocked: number;
  blockedReasons: Record<string, number>;
}

/** The counts the report asks for, per family. "Planned" is the candidate pool in the geo tables. */
export async function pipelineCounts(db: Queryable): Promise<PipelineCounts[]> {
  const pages = await db.query<{ family: string; status: string; indexable: boolean; blocked_reason: string | null; reviewed: boolean; researched: boolean }>(
    `select family, status, indexable, blocked_reason, last_reviewed_at is not null as reviewed, (gate_results->'keyword'->>'detail') not like 'hypothesis%' as researched from seo_pages`,
  );
  const planned: Record<string, number> = {
    state: 51,
    city: (await db.query<{ n: number }>("select count(*)::int as n from seo_cities where population >= $1 and cardinality(zips) > 0", [CITY_PAGE_MIN_POPULATION])).rows[0]!.n,
    zip: (await db.query<{ n: number }>("select count(*)::int as n from seo_zips")).rows[0]!.n,
    route: (await db.query<{ n: number }>("select count(*)::int as n from seo_routes")).rows[0]!.n,
    service: 6,
    cost: 2 + (await db.query<{ n: number }>("select count(*)::int as n from (select s from rate_cards rc join companies c on c.id = rc.company_id, unnest(rc.states) s where rc.status = 'active' and c.status = 'approved' group by s having count(distinct rc.company_id) >= 5) t")).rows[0]!.n,
    question: 0,
    planning: 0,
  };
  const { CATALOG } = await import("./catalog");
  planned.question = CATALOG.filter((e) => e.family === "question").length;
  planned.planning = CATALOG.filter((e) => e.family === "planning").length;
  const out: PipelineCounts[] = [];
  for (const family of ["state", "city", "zip", "route", "service", "cost", "question", "planning"]) {
    const rows = pages.rows.filter((p) => p.family === family);
    const reasons: Record<string, number> = {};
    for (const r of rows) if (r.blocked_reason) reasons[r.blocked_reason.split(" (")[0]!] = (reasons[r.blocked_reason.split(" (")[0]!] ?? 0) + 1;
    out.push({
      family,
      planned: planned[family] ?? 0,
      researched: rows.filter((r) => r.researched).length,
      drafted: rows.length,
      reviewed: rows.filter((r) => r.reviewed).length,
      ready: rows.filter((r) => r.status === "ready").length,
      published: rows.filter((r) => r.status === "published").length,
      indexable: rows.filter((r) => r.indexable).length,
      blocked: rows.filter((r) => r.blocked_reason).length,
      blockedReasons: reasons,
    });
  }
  return out;
}
