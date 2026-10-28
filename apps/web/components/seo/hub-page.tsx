import "server-only";

/**
 * Hub pages for the generated families (/routes/, /services/, /questions/, /planning/): a list
 * of published pages only, grouped where that helps (routes by origin state). Indexable; each
 * entry links to a page that exists, so no hub ever links to a 404.
 */
import { env } from "@amc/server/env";
import { publishedPages, type PageSummary, type SeoFamily } from "@amc/server/seo";
import { stateByCode } from "@amc/server/geo";
import { Breadcrumbs, Container } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbListLd, webPageLd } from "@/components/site/json-ld";

export interface HubSpec {
  url: string;
  family: SeoFamily;
  title: string;
  h1: string;
  description: string;
  lede: string;
  groupByState?: boolean;
}

export function hubMetadata(spec: HubSpec): Metadata {
  const { WEB_URL, SITE_INDEXABLE } = env();
  return {
    title: { absolute: spec.title },
    description: spec.description,
    ...(SITE_INDEXABLE ? { alternates: { canonical: `${WEB_URL}${spec.url}` } } : {}),
    openGraph: { title: spec.title, description: spec.description, url: `${WEB_URL}${spec.url}`, type: "website", siteName: "American Moving Choice" },
  };
}

function groups(pages: PageSummary[], byState: boolean): { heading: string | null; pages: PageSummary[] }[] {
  if (!byState) return [{ heading: null, pages }];
  const map = new Map<string, PageSummary[]>();
  for (const p of pages) {
    const key = p.stateCode ? (stateByCode(p.stateCode)?.name ?? p.stateCode) : "Other";
    map.set(key, [...(map.get(key) ?? []), p]);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([heading, list]) => ({ heading, pages: list }));
}

export async function HubPage({ spec }: { spec: HubSpec }) {
  const { WEB_URL } = env();
  const pages = await publishedPages(spec.family);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: spec.h1, href: spec.url },
  ];
  return (
    <>
      <JsonLd data={breadcrumbListLd(WEB_URL, crumbs)} />
      <JsonLd data={webPageLd(WEB_URL, { url: spec.url, name: spec.h1, description: spec.description })} />
      <Container className="grid gap-8 section-pad">
        <div className="grid gap-4">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: spec.h1 }]} />
          <h1 className="type-display-l text-text">{spec.h1}</h1>
          <p className="type-lede max-w-[68ch] text-text-2">{spec.lede}</p>
        </div>
        {pages.length ? (
          groups(pages, spec.groupByState ?? false).map((group) => (
            <section key={group.heading ?? "all"} aria-label={group.heading ?? spec.h1} className="grid gap-3">
              {group.heading ? <h2 className="type-h3 text-text">{group.heading}</h2> : null}
              <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {group.pages.map((p) => (
                  <li key={p.url}>
                    <Link href={p.url} className="link inline-flex min-h-11 items-center">
                      {p.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="text-text">No pages in this family are published yet. Each one is published only after its data and checks pass.</p>
        )}
      </Container>
    </>
  );
}
