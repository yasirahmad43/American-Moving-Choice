import { env } from "@amc/server/env";
import type { MetadataRoute } from "next";

/**
 * robots.txt. The preview disallows everything (build plan §8). Once SITE_INDEXABLE=true, crawlers
 * may fetch everything except /api/ and are pointed at the sitemap (site architecture §8.3); the
 * per-agent rules in site architecture §7.6 belong to the SEO slice.
 */
export default function robots(): MetadataRoute.Robots {
  const { SITE_INDEXABLE, WEB_URL } = env();
  if (!SITE_INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${WEB_URL}/sitemap.xml` };
}
