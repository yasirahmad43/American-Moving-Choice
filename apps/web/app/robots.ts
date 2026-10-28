import { env } from "@amc/server/env";
import type { MetadataRoute } from "next";

/**
 * robots.txt. The preview disallows everything (build plan §8). Once SITE_INDEXABLE=true, every
 * agent may fetch everything except /api/ and the utility pages that are noindex anyway, and is
 * pointed at the sitemap index (site architecture §8.3, §8.4). Search and answer agents are
 * allowed; training crawlers are allowed at launch per the §7.6 recommendation (a business
 * decision recorded there), so no per-agent block is written here.
 */
export default function robots(): MetadataRoute.Robots {
  const { SITE_INDEXABLE, WEB_URL } = env();
  if (!SITE_INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/get-quotes/confirmation/", "/my-request/", "/search/"] },
    sitemap: `${WEB_URL}/sitemap.xml`,
  };
}
