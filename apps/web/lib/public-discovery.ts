import "server-only";

import { publicDiscoveryOverview, publicDiscoveryPages, type DiscoveryOverview, type DiscoveryPage } from "@amc/server/seo";
import { STATES } from "@amc/server/geo";
import { cache } from "react";
import { connection } from "next/server";
import { GUIDE_FAMILIES, PUBLIC_NAV_GROUPS, PUBLIC_STATIC_LINKS } from "./site";

export const CATALOG_PAGE_SIZE = 60;
export type CatalogFilters = { query: string; type: string; state: string; page: number };
export type CatalogEntry = Omit<DiscoveryPage, "family"> & { family: string };

/** Header and footer share one small, current aggregate query per server render. */
export const navigationOverview = cache(async (): Promise<DiscoveryOverview | null> => {
  await connection();
  try { return await publicDiscoveryOverview(); }
  catch { console.error("[public discovery] Guide counts are temporarily unavailable."); return null; }
});

export function catalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  const first = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const type = first("type");
  const rawPage = first("page");
  return {
    query: first("q").trim().replace(/\s+/g, " ").slice(0, 80),
    type: type === "page" || GUIDE_FAMILIES.some((family) => family.id === type) ? type : "all",
    state: STATES.some((state) => state.code === first("state")) ? first("state") : "",
    page: /^[1-9][0-9]{0,4}$/.test(rawPage) ? Number(rawPage) : 1,
  };
}

export function catalogUrl(filters: Partial<CatalogFilters> = {}): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.state) params.set("state", filters.state);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return `/explore/${params.size ? `?${params}` : ""}`;
}

export function standaloneCatalog(): CatalogEntry[] {
  const entries = new Map(PUBLIC_STATIC_LINKS.map((link) => [link.href, { url: link.href, title: link.label, family: "page", stateCode: null }]));
  return [...entries.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/** Static routes and published guides share one correctly paginated catalog, without SEO bodies. */
export async function publicCatalog(filters: CatalogFilters): Promise<{ pages: CatalogEntry[]; total: number }> {
  const query = filters.query.toLowerCase();
  const staticMatches = filters.state || !["all", "page"].includes(filters.type) ? [] : standaloneCatalog().filter((entry) => `${entry.title} ${entry.url}`.toLowerCase().includes(query));
  const offset = (filters.page - 1) * CATALOG_PAGE_SIZE;
  const staticPage = staticMatches.slice(offset, offset + CATALOG_PAGE_SIZE);
  if (filters.type === "page") return { pages: staticPage, total: staticMatches.length };
  const result = await publicDiscoveryPages({ query: filters.query, family: filters.type, state: filters.state || undefined, offset: Math.max(0, offset - staticMatches.length), limit: Math.max(1, CATALOG_PAGE_SIZE - staticPage.length) });
  return { pages: [...staticPage, ...result.pages].slice(0, CATALOG_PAGE_SIZE), total: staticMatches.length + result.total };
}

export const publicGroup = (id: string) => PUBLIC_NAV_GROUPS.find((group) => group.id === id)!;
