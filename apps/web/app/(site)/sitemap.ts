import { env } from "@amc/server/env";
import type { MetadataRoute } from "next";
import { servedContentPages } from "@/lib/content/pages";

/**
 * /sitemap.xml: the static public pages and every content page this site serves (site
 * architecture §8.4). No lastmod: it must be the last substantive change, never the render time,
 * and drafts have none yet. While SITE_INDEXABLE is not true, robots.txt disallows everything and
 * every page is noindex, so this list only shows what would be submitted.
 *
 * Pages other slices own (the survey landing page, calculator, directory, verify-a-mover) are left
 * to their slices; utility pages (confirmation, my-request, the apply redirect) never appear.
 */
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  const { WEB_URL } = env();
  const urls = [...STATIC_PAGES, ...servedContentPages().map((page) => page.meta.url)];
  return [...new Set(urls)].map((url) => ({ url: `${WEB_URL}${url}` }));
}
