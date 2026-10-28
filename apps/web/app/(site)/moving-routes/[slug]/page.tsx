import { redirectFor } from "@amc/server/seo";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";

/** Compatibility route; only recorded redirects to published guides are served. */
export default async function MovingRoutesRedirect({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const slug = (await params).slug.toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) notFound();
  const target = await redirectFor(`/moving-routes/${slug}/`);
  if (target) permanentRedirect(target);
  notFound();
}
