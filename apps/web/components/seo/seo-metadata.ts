import "server-only";

/**
 * Metadata and JSON-LD for programmatic pages (site architecture §2.4, §8.2, §8.5). A page that
 * is published but not indexable carries noindex and no canonical (the two are never combined);
 * an indexable page carries its self-referencing canonical once SITE_INDEXABLE is on.
 */
import { env } from "@amc/server/env";
import type { SeoPageRecord } from "@amc/server/seo";
import type { Metadata } from "next";
import { organizationId, pageImageLd, type VisiblePageImage } from "@/components/site/json-ld";
import { publicSeoPage } from "./public-content";
import { socialMetadata } from "@/components/site/social-metadata";

export const NOINDEX: Metadata["robots"] = { index: false, follow: true, googleBot: { index: false, follow: true } };
const DEMO_NOINDEX: Metadata["robots"] = { index: false, follow: false, googleBot: { index: false, follow: false } };

export function seoMetadata(storedPage: SeoPageRecord): Metadata {
  const page = publicSeoPage(storedPage);
  const { WEB_URL, SITE_INDEXABLE } = env();
  const indexable = page.indexable && SITE_INDEXABLE;
  return {
    title: { absolute: page.title },
    description: page.metaDescription,
    ...(indexable ? { alternates: { canonical: `${WEB_URL}${page.canonicalUrl}` } } : {}),
    // Next replaces the inherited robots object. Preserve the stricter demo policy even
    // when a record's own noindex policy would normally allow following its links.
    ...(!SITE_INDEXABLE ? { robots: DEMO_NOINDEX } : page.indexable ? {} : { robots: NOINDEX }),
    ...socialMetadata(page.url, page.title, page.metaDescription, { family: page.family, stateCode: page.stateCode ?? undefined, type: page.content.schemaType === "Article" ? "article" : "website" }),
  };
}

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbLd(webUrl: string, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${webUrl}${c.href}` })),
  };
}

/** The same headline is used by the visible hero and the page's structured data. */
export function seoPageHeading(page: Pick<SeoPageRecord, "family" | "h1">) {
  return page.family === "city" ? page.h1.replace(/: compare screened moving companies$/i, "") : page.h1;
}

export function pageLd(webUrl: string, page: SeoPageRecord, visibleImage?: VisiblePageImage) {
  const url = `${webUrl}${page.url}`;
  const heading = seoPageHeading(page);
  const base = {
    "@context": "https://schema.org",
    "@id": `${url}#page`,
    url,
    name: heading,
    description: page.metaDescription,
    inLanguage: "en-US",
    isPartOf: { "@id": `${webUrl}/#website` },
    publisher: { "@id": organizationId(webUrl) },
    ...(visibleImage ? { image: pageImageLd(webUrl, visibleImage) } : {}),
    ...(page.publishedAt ? { datePublished: page.publishedAt.toISOString() } : {}),
    dateModified: page.updatedAt.toISOString(),
  };
  if (page.content.schemaType === "Article") {
    return { ...base, "@type": "Article", headline: heading, mainEntityOfPage: url };
  }
  return { ...base, "@type": page.content.schemaType };
}
