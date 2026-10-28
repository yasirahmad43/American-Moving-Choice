import { redirectFor } from "@amc/server/seo";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";

type Params = Promise<{ slug: string }>;

/**
 * /moving-routes/{slug}/ was the route URL in site architecture §2.1; the family lives at
 * /routes/{slug}/. A seo_redirects row (written by seo:publish for every published route) sends
 * the old URL there with a 301; anything else is a 404.
 */
export default async function MovingRoutesRedirect({ params }: { params: Params }) {
  await connection();
  const slug = decodeURIComponent((await params).slug).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) notFound();
  const target = await redirectFor(`/moving-routes/${slug}/`);
  if (target) permanentRedirect(target);
  notFound();
}
