import "server-only";

/**
 * Metadata and JSON-LD for programmatic pages (site architecture §2.4, §8.2, §8.5). A page that
 * is published but not indexable carries noindex and no canonical (the two are never combined);
 * an indexable page carries its self-referencing canonical once SITE_INDEXABLE is on.
 */
import { env } from "@amc/server/env";
import type { SeoPageRecord } from "@amc/server/seo";
import type { Metadata } from "next";
import { organizationId } from "@/components/site/json-ld";
import { stripLinks } from "./inline-text";

export const NOINDEX: Metadata["robots"] = { index: false, follow: true, googleBot: { index: false, follow: true } };

export function seoMetadata(page: SeoPageRecord): Metadata {
  const { WEB_URL, SITE_INDEXABLE } = env();
  const indexable = page.indexable && SITE_INDEXABLE;
  return {
    title: { absolute: page.title },
    description: page.metaDescription,
    ...(indexable ? { alternates: { canonical: `${WEB_URL}${page.canonicalUrl}` } } : {}),
    ...(page.indexable ? {} : { robots: NOINDEX }),
    openGraph: { title: page.title, description: page.metaDescription, url: `${WEB_URL}${page.url}`, type: page.content.schemaType === "Article" ? "article" : "website", siteName: "American Moving Choice" },
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

export function pageLd(webUrl: string, page: SeoPageRecord) {
  const url = `${webUrl}${page.url}`;
  const base = {
    "@context": "https://schema.org",
    "@id": `${url}#page`,
    url,
    name: page.h1,
    description: page.metaDescription,
    inLanguage: "en-US",
    isPartOf: { "@id": `${webUrl}/#website` },
    publisher: { "@id": organizationId(webUrl) },
    ...(page.publishedAt ? { datePublished: page.publishedAt.toISOString() } : {}),
    dateModified: page.updatedAt.toISOString(),
  };
  if (page.content.schemaType === "Article") {
    return { ...base, "@type": "Article", headline: page.h1, mainEntityOfPage: url, author: { "@id": organizationId(webUrl) } };
  }
  return { ...base, "@type": page.content.schemaType };
}

/** FAQPage for the visible FAQ (no rich result since 2026-05-07; kept for answer engines, per the brief). */
export function faqLd(page: SeoPageRecord) {
  if (!page.content.faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.content.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: stripLinks(item.answer) } })),
  };
}

/** ItemList of the movers shown on the page, each referencing its profile entity (no ratings on lists). */
export function moverListLd(webUrl: string, movers: { slug: string; name: string }[]) {
  if (!movers.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: movers.map((m, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "MovingCompany", "@id": `${webUrl}/companies/${m.slug}/#company`, name: m.name, url: `${webUrl}/companies/${m.slug}/` } })),
  };
}
