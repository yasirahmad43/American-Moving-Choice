import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/site/content-page";
import { isReservedUrl, servedContentPages } from "@/lib/content/pages";
import { socialMetadata } from "@/components/site/social-metadata";

/**
 * Every content draft in content/pages, served at its front-matter url (build plan §8). Pages are
 * generated at build time; unknown paths pass the same guarded resolver and return a rendered
 * 404. URLs other slices own
 * (the survey, calculator, directory, profiles, geo pages, verify-a-mover) are never served here.
 */
// Let notFound() render the normal recovery page instead of an early empty error document.
export const dynamicParams = true;

type Params = { slug: string[] };

export function generateStaticParams(): Params[] {
  return servedContentPages().map((page) => ({ slug: page.meta.url.split("/").filter(Boolean) }));
}

function pageFor(slug: string[]) {
  const url = `/${slug.map((part) => decodeURIComponent(part)).join("/")}/`;
  if (isReservedUrl(url)) return null;
  return servedContentPages().find((page) => page.meta.url === url) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = pageFor((await params).slug);
  if (!page) return {};
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.meta.url },
    ...socialMetadata(page.meta.url, page.title, page.description, { family: page.meta.family, type: page.meta.schema.includes("Article") ? "article" : "website" }),
  };
}

export default async function ContentRoute({ params }: { params: Promise<Params> }) {
  const page = pageFor((await params).slug);
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
