import "server-only";

import { env } from "@amc/server/env";
import type { Metadata } from "next";

/** Absolute URL on the public site for a path such as "/directory/". */
export function absoluteUrl(path: string): string {
  return new URL(path, env().WEB_URL).toString();
}

/**
 * A self-referencing canonical, only where the page may be indexed. Site architecture §2.4 rule 3:
 * canonical and noindex are never combined, so a preview build (noindex everywhere unless
 * SITE_INDEXABLE=true) and noindex pages carry no canonical.
 */
export function canonical(path: string, { noindex = false }: { noindex?: boolean } = {}): Pick<Metadata, "alternates"> {
  if (noindex || !env().SITE_INDEXABLE) return {};
  return { alternates: { canonical: absoluteUrl(path) } };
}

/** noindex, nofollow for pages that must exist for users but never enter the index. */
export const NOINDEX: Metadata["robots"] = { index: false, follow: false, googleBot: { index: false, follow: false } };

/** Server-rendered JSON-LD. "<" is escaped so the payload can't close the script element. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** BreadcrumbList mirroring a visible trail (site architecture §8.5). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}
