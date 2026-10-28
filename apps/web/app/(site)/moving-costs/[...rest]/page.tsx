import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CatalogPage, catalogMetadata } from "@/components/seo/catalog-route";
import { ContentPageView } from "@/components/site/content-page";
import { contentPageByUrl } from "@/lib/content/pages";

type Params = Promise<{ rest: string[] }>;

/**
 * /moving-costs/{slug}/: a generated cost page (by state, or the local and long-distance
 * spokes) where rate-card data supports one, otherwise the editorial content page with that URL
 * (content/pages/costs/*.md), otherwise 404.
 */
function contentFor(rest: string[]) {
  const url = `/moving-costs/${rest.map((s) => decodeURIComponent(s)).join("/")}/`;
  return /^\/([a-z0-9-]+\/)+$/.test(url) ? contentPageByUrl(url) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { rest } = await params;
  const content = contentFor(rest);
  if (content) return { title: { absolute: content.title }, description: content.description, alternates: { canonical: content.meta.url } };
  if (rest.length !== 1) return { title: "Page not found", robots: { index: false, follow: false } };
  return catalogMetadata("/moving-costs/", rest[0]!);
}

export default async function MovingCostsPage({ params }: { params: Params }) {
  await connection();
  const { rest } = await params;
  const content = contentFor(rest);
  if (content) return <ContentPageView page={content} />;
  if (rest.length !== 1) notFound();
  return <CatalogPage prefix="/moving-costs/" segment={rest[0]!} hub={{ label: "Moving costs", href: "/moving-costs/" }} />;
}
