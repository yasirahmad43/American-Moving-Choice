import "server-only";

/**
 * Loading a programmatic page for a route: the published record, its breadcrumb trail (skipping
 * ancestors that aren't published, site architecture §2.3) and the 301 for a retired URL.
 */
import { publishedAmong, publishedPage, redirectFor, type SeoPageRecord } from "@amc/server/seo";
import { stateByCode, stateBySlug } from "@amc/server/geo";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import type { Crumb } from "./seo-metadata";

export const loadPage = cache(async (url: string): Promise<SeoPageRecord | null> => publishedPage(url));

/** 404 for unknown or unpublished URLs; 301 when a redirect is recorded for the URL. */
export async function pageOrNotFound(url: string): Promise<SeoPageRecord> {
  const page = await loadPage(url);
  if (page) return page;
  const target = await redirectFor(url);
  if (target) permanentRedirect(target);
  notFound();
}

/** Lowercase, hyphenated slugs only; anything else is a 404 (or a 301 to the lowercase form). */
export function normalizeSegment(segment: string, pathFor: (normalized: string) => string): string {
  const decoded = decodeURIComponent(segment);
  const lower = decoded.toLowerCase();
  if (lower !== decoded && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(lower)) permanentRedirect(pathFor(lower));
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lower)) notFound();
  return lower;
}

/** Full state slug for a segment; a two-letter code 301s to the full slug (site architecture §2.2). */
export function stateSlugOrRedirect(segment: string, rest: string[] = []): string {
  const tail = rest.length ? `${rest.join("/")}/` : "";
  const normalized = normalizeSegment(segment, (s) => `/movers/${s}/${tail}`);
  if (/^[a-z]{2}$/.test(normalized) && !stateBySlug(normalized)) {
    const state = stateByCode(normalized);
    if (state) permanentRedirect(`/movers/${state.slug}/${tail}`);
  }
  return normalized;
}

/** The breadcrumb trail for a page, keeping only published ancestors. */
export async function trailFor(page: SeoPageRecord, ancestors: Crumb[], hub: Crumb): Promise<Crumb[]> {
  const live = await publishedAmong(ancestors.map((a) => a.href));
  return [hub, ...ancestors.filter((a) => live.has(a.href)), { label: page.h1.length > 60 ? page.h1.slice(0, 57) + "…" : page.h1, href: page.url }];
}
