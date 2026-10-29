/** Bounded, read-only public discovery. No content, companies or customer records cross here. */
import type { Queryable } from "../db/pool";
import { getPool } from "../db/pool";
import type { SeoFamily } from "./slugs";

const FAMILIES = new Set(["state", "city", "zip", "route", "service", "cost", "question", "planning"]);
const PUBLIC_PATH = "^/(movers|routes|services|moving-costs|questions|planning)/[a-z0-9/-]+/$";
const PUBLIC_WHERE = "status = 'published' and family in ('state','city','zip','route','service','cost','question','planning') and url ~ $1";

export interface DiscoveryPage {
  url: string;
  title: string;
  family: SeoFamily;
  stateCode: string | null;
}
export interface DiscoveryOverview {
  total: number;
  families: Partial<Record<SeoFamily, number>>;
  states: { code: string; total: number; cities: number }[];
}
export interface DiscoveryInput { query?: string; family?: string; state?: string; offset?: number; limit?: number }

export function normalizeDiscovery(input: DiscoveryInput) {
  const query = (input.query ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  return {
    query,
    family: input.family && FAMILIES.has(input.family) ? input.family as SeoFamily : null,
    state: /^[A-Z]{2}$/.test(input.state ?? "") ? input.state! : null,
    offset: Number.isSafeInteger(input.offset) ? Math.max(0, Math.min(input.offset!, 1_000_000)) : 0,
    limit: Number.isSafeInteger(input.limit) ? Math.max(1, Math.min(input.limit!, 60)) : 60,
  };
}

export async function publicDiscoveryOverview(db: Queryable = getPool()): Promise<DiscoveryOverview> {
  const result = await db.query<{ family: SeoFamily; state_code: string | null; n: number }>(
    `select family, state_code, count(*)::int n from seo_pages where ${PUBLIC_WHERE} group by family, state_code`, [PUBLIC_PATH],
  );
  const overview: DiscoveryOverview = { total: 0, families: {}, states: [] };
  const states = new Map<string, { code: string; total: number; cities: number }>();
  for (const row of result.rows) {
    overview.total += row.n;
    overview.families[row.family] = (overview.families[row.family] ?? 0) + row.n;
    if (!row.state_code) continue;
    const state = states.get(row.state_code) ?? { code: row.state_code, total: 0, cities: 0 };
    state.total += row.n;
    if (row.family === "city") state.cities += row.n;
    states.set(row.state_code, state);
  }
  overview.states = [...states.values()].sort((a, b) => a.code.localeCompare(b.code));
  return overview;
}

/** Literal substring search; '%' and '_' never become wildcard instructions. */
export async function publicDiscoveryPages(input: DiscoveryInput = {}, db: Queryable = getPool()): Promise<{ pages: DiscoveryPage[]; total: number }> {
  const options = normalizeDiscovery(input);
  const literal = options.query.toLowerCase().replace(/[\\%_]/g, "\\$&");
  const result = await db.query<{ total: number; pages: DiscoveryPage[] }>(
    `with matched as (
       select url, h1 as title, family, state_code as "stateCode" from seo_pages
       where ${PUBLIC_WHERE} and ($2::text is null or family=$2) and ($3::text is null or state_code=$3)
         and ($4='' or lower(h1 || ' ' || title || ' ' || url || ' ' || coalesce(state_code,'')) like '%' || $4 || '%' escape '\\')
     ), listed as (select * from matched order by url limit $5 offset $6)
     select (select count(*)::int from matched) as total,
       coalesce((select jsonb_agg(to_jsonb(listed) order by url) from listed),'[]'::jsonb) as pages`,
    [PUBLIC_PATH, options.family, options.state, literal, options.limit, options.offset],
  );
  return result.rows[0] ?? { pages: [], total: 0 };
}
