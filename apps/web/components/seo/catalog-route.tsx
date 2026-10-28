import "server-only";

/**
 * Shared route implementation for the single-segment families (/services/, /questions/,
 * /planning/, /moving-costs/{slug}/): metadata and page for a published seo_pages row.
 */
import type { Metadata } from "next";
import { loadPage, normalizeSegment, pageOrNotFound, trailFor } from "./load";
import { seoMetadata, type Crumb } from "./seo-metadata";
import { SeoPageView } from "./seo-page";

export async function catalogMetadata(prefix: string, segment: string): Promise<Metadata> {
  const slug = normalizeSegment(segment, (s) => `${prefix}${s}/`);
  const page = await loadPage(`${prefix}${slug}/`);
  return page ? seoMetadata(page) : { title: "Page not found", robots: { index: false, follow: false } };
}

export async function CatalogPage({ prefix, segment, hub }: { prefix: string; segment: string; hub: Crumb }) {
  const slug = normalizeSegment(segment, (s) => `${prefix}${s}/`);
  const page = await pageOrNotFound(`${prefix}${slug}/`);
  const crumbs = await trailFor(page, [], hub);
  return <SeoPageView page={page} crumbs={crumbs} />;
}
