import { sitemapSegmentXml } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

/** One sitemap segment: /sitemaps/{core|states|cities-N|zips|routes-N|services|costs|questions|planning}.xml */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }): Promise<Response> {
  const { name } = await params;
  if (!name.endsWith(".xml")) return new Response("Not found", { status: 404 });
  const xml = await sitemapSegmentXml(name.slice(0, -4));
  if (!xml) return new Response("Not found", { status: 404 });
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
