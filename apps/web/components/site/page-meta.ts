import type { Metadata } from "next";

/** Metadata for a TSX page: absolute title, description and self-canonical URL (site architecture §2.4, §8.2). */
export function pageMetadata(url: string, title: string, description: string, options: { noindex?: boolean } = {}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "American Moving Choice" },
    ...(options.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
