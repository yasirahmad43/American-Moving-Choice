import type { Metadata } from "next";
import { connection } from "next/server";
import { loadPage, pageOrNotFound, stateSlugOrRedirect, trailFor } from "@/components/seo/load";
import { seoMetadata } from "@/components/seo/seo-metadata";
import { SeoPageView } from "@/components/seo/seo-page";

type Params = Promise<{ state: string }>;

/**
 * State hub (/movers/{state}/, site architecture §1.2, VD §13.2): served only when seo_pages
 * holds a published row for the URL; otherwise 404, never a thin page. Two-letter codes and
 * uppercase slugs 301 to the canonical slug.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const slug = stateSlugOrRedirect((await params).state);
  const page = await loadPage(`/movers/${slug}/`);
  return page ? seoMetadata(page) : { title: "Page not found", robots: { index: false, follow: false } };
}

export default async function StateHubPage({ params }: { params: Params }) {
  await connection();
  const slug = stateSlugOrRedirect((await params).state);
  const page = await pageOrNotFound(`/movers/${slug}/`);
  const crumbs = await trailFor(page, [], { label: "Movers", href: "/movers/" });
  return <SeoPageView page={page} crumbs={crumbs} />;
}
