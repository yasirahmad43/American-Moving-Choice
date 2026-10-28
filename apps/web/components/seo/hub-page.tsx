import "server-only";

/**
 * Hub pages for the generated families (/routes/, /services/, /questions/, /planning/): a list
 * of published pages only, grouped where that helps (routes by origin state). Indexable; each
 * entry links to a page that exists, so no hub ever links to a 404. Skinned with the premium
 * system: editorial header, a claimed family still, link cards and expandable state groups.
 */
import { env } from "@amc/server/env";
import { publishedPages, publishedPagesPage, type PageSummary, type SeoFamily } from "@amc/server/seo";
import { stateByCode } from "@amc/server/geo";
import { ArrowRightIcon, Breadcrumbs, Container, EmptyState, ExpandableCard, LinkButton, Reveal, StatTile } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { JsonLd, breadcrumbListLd, webPageLd } from "@/components/site/json-ld";
import { optionalMedia } from "@/lib/media";

export interface HubSpec {
  url: string;
  family: SeoFamily;
  title: string;
  h1: string;
  description: string;
  lede: string;
  groupByState?: boolean;
  /** Paginate the list at this many pages per hub page (/{hub}/page/{n}/); unset lists everything. */
  perPage?: number;
}

export const hubPageUrl = (spec: HubSpec, page: number): string => (page <= 1 ? spec.url : `${spec.url}page/${page}/`);

export function hubMetadata(spec: HubSpec, page = 1): Metadata {
  const { WEB_URL, SITE_INDEXABLE } = env();
  const url = hubPageUrl(spec, page);
  const title = page > 1 ? spec.title.replace(/ \| American Moving Choice$/, "").concat(` (page ${page}) | American Moving Choice`) : spec.title;
  const description = page > 1 ? `${spec.description} Page ${page}.` : spec.description;
  return {
    title: { absolute: title },
    description,
    ...(SITE_INDEXABLE ? { alternates: { canonical: `${WEB_URL}${url}` } } : {}),
    openGraph: { title, description, url: `${WEB_URL}${url}`, type: "website", siteName: "American Moving Choice" },
  };
}

function PageNav({ spec, page, total }: { spec: HubSpec; page: number; total: number }) {
  const count = Math.max(1, Math.ceil(total / (spec.perPage ?? (total || 1))));
  if (count <= 1) return null;
  const numbers = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <nav aria-label={`${spec.h1} pages`} className="grid gap-3 border-t border-border pt-6">
      <p className="type-small text-text-2">
        Page {page} of {count}: {total.toLocaleString("en-US")} published pages, {spec.perPage} per page, in URL order.
      </p>
      <ul className="flex flex-wrap gap-2">
        {page > 1 ? (
          <li>
            <Link href={hubPageUrl(spec, page - 1)} rel="prev" className="link inline-flex min-h-11 items-center px-2">
              Previous
            </Link>
          </li>
        ) : null}
        {numbers.map((i) => (
          <li key={i}>
            {i === page ? (
              <span aria-current="page" className="inline-flex min-h-11 items-center rounded-pill bg-surface-3 px-3 font-semibold text-text tabular">
                {i}
              </span>
            ) : (
              <Link href={hubPageUrl(spec, i)} className="link inline-flex min-h-11 items-center px-2 tabular">
                {i}
              </Link>
            )}
          </li>
        ))}
        {page < count ? (
          <li>
            <Link href={hubPageUrl(spec, page + 1)} rel="next" className="link inline-flex min-h-11 items-center px-2">
              Next
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
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

/** The manifest family tag that illustrates each hub. */
const FAMILY_TAG: Partial<Record<SeoFamily, string>> = { route: "route", service: "services", question: "questions", planning: "planning", cost: "costs" };

function LinkCards({ pages }: { pages: PageSummary[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pages.map((p) => (
        <li key={p.url} className="min-w-0">
          <Link
            href={p.url}
            className="lift group flex h-full items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3.5 font-semibold text-text no-underline shadow-e1"
          >
            <span className="min-w-0">{p.h1}</span>
            <span className="inline-grid size-8 shrink-0 place-items-center rounded-pill bg-surface-3 text-text-2 transition-transform duration-[var(--d2)] ease-out group-hover:translate-x-0.5">
              <ArrowRightIcon size={16} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function HubPage({ spec, page = 1 }: { spec: HubSpec; page?: number }) {
  const { WEB_URL } = env();
  const listed = spec.perPage ? await publishedPagesPage(spec.family, page, spec.perPage) : { pages: await publishedPages(spec.family), total: 0 };
  const pages = listed.pages;
  const total = spec.perPage ? listed.total : pages.length;
  const url = hubPageUrl(spec, page);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: spec.h1, href: spec.url },
    ...(page > 1 ? [{ label: `Page ${page}`, href: url }] : []),
  ];
  const tag = FAMILY_TAG[spec.family];
  const still = tag ? optionalMedia(spec.url, [tag, "landscape"]) : null;
  const grouped = groups(pages, spec.groupByState ?? false);
  return (
    <>
      <JsonLd data={breadcrumbListLd(WEB_URL, crumbs)} />
      <JsonLd data={webPageLd(WEB_URL, { url, name: page > 1 ? `${spec.h1} (page ${page})` : spec.h1, description: spec.description })} />
      <div className="mesh-light border-b border-border">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
          <div className="grid gap-5">
            <Breadcrumbs items={page > 1 ? [{ label: "Home", href: "/" }, { label: spec.h1, href: spec.url }, { label: `Page ${page}` }] : [{ label: "Home", href: "/" }, { label: spec.h1 }]} />
            <h1 className="type-display-xl max-w-[18ch] text-text">{page > 1 ? `${spec.h1} (page ${page})` : spec.h1}</h1>
            <p className="type-lede max-w-[60ch] text-text-2">{spec.lede}</p>
            <div className="flex flex-wrap items-end gap-6 pt-2">
              <StatTile tone="plain" value={total} label={total === 1 ? "published page" : "published pages"} note="Each one passed its data and checks" className="min-w-[11rem]" />
              <LinkButton href="/get-quotes/" variant="cta">
                Get quotes
              </LinkButton>
            </div>
          </div>
          {still ? (
            <div className="zoom-media relative aspect-[16/10] overflow-hidden rounded-card ring-1 ring-border">
              <MediaFrame asset={still} priority sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          ) : null}
        </Container>
      </div>
      <Container className="grid gap-10 section-pad">
        {pages.length ? (
          grouped.length > 1 ? (
            <div className="grid gap-3">
              {grouped.map((group, index) => (
                <Reveal key={group.heading ?? "all"} delay={Math.min(index, 4) * 30}>
                  <ExpandableCard
                    title={group.heading ?? spec.h1}
                    titleAs="h2"
                    summary={`${group.pages.length} ${group.pages.length === 1 ? "page" : "pages"}`}
                    defaultOpen={index < 2}
                  >
                    <LinkCards pages={group.pages} />
                  </ExpandableCard>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal as="section" aria-label={spec.h1}>
              <LinkCards pages={pages} />
            </Reveal>
          )
        ) : (
          <EmptyState showMark title="No pages in this family are published yet" description="Each one is published only after its data and checks pass. The quote survey shows coverage for your move right now." action={<LinkButton href="/get-quotes/">Start a quote request</LinkButton>} />
        )}
        {spec.perPage ? <PageNav spec={spec} page={page} total={total} /> : null}
      </Container>
    </>
  );
}
