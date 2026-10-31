/**
 * Server-rendered JSON-LD (site architecture §8.5). Only what the page shows. FAQPage is
 * generated from the same visible h3/p answer array; never invent business ratings or credentials.
 */

/** Escapes "<" so a value can never close the script element. */
export function jsonLdString(data: unknown): string {
  // JSON allows U+2028 and U+2029 raw; escape them with "<" so nothing can break out of the script.
  return JSON.stringify(data).replace(/[<\u2028\u2029]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}

/** The one Organization @id (site architecture §7.1). */
export const organizationId = (webUrl: string) => `${webUrl}/#organization`;

/** Only an image actually rendered in the page; callers supply the selected asset. */
export interface VisiblePageImage {
  src: string;
  width: number;
  height: number;
}

export function pageImageLd(webUrl: string, image: VisiblePageImage) {
  return { "@type": "ImageObject", url: new URL(image.src, webUrl).href, width: image.width, height: image.height };
}

export function breadcrumbListLd(webUrl: string, items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${webUrl}${item.href}`,
    })),
  };
}

export function webPageLd(webUrl: string, page: { url: string; name: string; description: string; type?: "WebPage" | "Article"; image?: VisiblePageImage }) {
  const base = {
    "@context": "https://schema.org",
    url: `${webUrl}${page.url}`,
    description: page.description,
    publisher: { "@id": organizationId(webUrl) },
    inLanguage: "en-US",
    ...(page.image ? { image: pageImageLd(webUrl, page.image) } : {}),
  };
  return page.type === "Article"
    ? { ...base, "@type": "Article", headline: page.name, mainEntityOfPage: `${webUrl}${page.url}` }
    : { ...base, "@type": "WebPage", name: page.name, isPartOf: { "@id": `${webUrl}/#website` } };
}
