import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/site/content-page";
import { contentPageByUrl, isReservedUrl, servedContentPages } from "@/lib/content/pages";

/**
 * Every content draft in content/pages, served at its front-matter url (build plan §8). Pages are
 * generated at build time; any other path is a 404 (dynamicParams false). URLs other slices own
 * (the survey, calculator, directory, profiles, geo pages, verify-a-mover) are never served here.
 */
export const dynamicParams = false;

type Params = { slug: string[] };

export function generateStaticParams(): Params[] {
  return servedContentPages().map((page) => ({ slug: page.meta.url.split("/").filter(Boolean) }));
}

function pageFor(slug: string[]) {
  const url = `/${slug.map((part) => decodeURIComponent(part)).join("/")}/`;
  if (isReservedUrl(url)) return null;
  return contentPageByUrl(url);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = pageFor((await params).slug);
  if (!page) return {};
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.meta.url },
    openGraph: { title: page.title, description: page.description, url: page.meta.url, type: "website", siteName: "American Moving Choice" },
  };
}

export default async function ContentRoute({ params }: { params: Promise<Params> }) {
  const page = pageFor((await params).slug);
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
