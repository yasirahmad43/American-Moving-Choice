import { sitemapIndexXml } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

/** The sitemap index (site architecture §8.4). */
export async function GET(): Promise<Response> {
  return new Response(await sitemapIndexXml(), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
