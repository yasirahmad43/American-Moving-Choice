import type { Metadata } from "next";
import { connection } from "next/server";
import { loadPage, normalizeSegment, pageOrNotFound, trailFor } from "@/components/seo/load";
import { seoMetadata } from "@/components/seo/seo-metadata";
import { SeoPageView } from "@/components/seo/seo-page";

type Params = Promise<{ slug: string }>;

/** Route pages: /routes/{origin}-to-{destination}/ (city→city with state suffixes, or state→state). */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const slug = normalizeSegment((await params).slug, (s) => `/routes/${s}/`);
  const page = await loadPage(`/routes/${slug}/`);
  return page ? seoMetadata(page) : { title: "Page not found", robots: { index: false, follow: false } };
}

export default async function RoutePage({ params }: { params: Params }) {
  await connection();
  const slug = normalizeSegment((await params).slug, (s) => `/routes/${s}/`);
  const page = await pageOrNotFound(`/routes/${slug}/`);
  const crumbs = await trailFor(page, [], { label: "Moving routes", href: "/routes/" });
  return <SeoPageView page={page} crumbs={crumbs} />;
}
