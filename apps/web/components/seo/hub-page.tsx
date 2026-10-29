import "server-only";

/**
 * Hub pages for the generated families (/routes/, /services/, /questions/, /planning/): a list
 * of published pages only, grouped where that helps (routes by origin state). Indexable; each
 * entry links to a page that exists, so no hub ever links to a 404. Skinned with the premium
 * system: cinematic survey hero, reusable editorial photography and visible image-led guides.
 */
import { env } from "@amc/server/env";
import { publishedPages, publishedPagesPage, type PageSummary, type SeoFamily } from "@amc/server/seo";
import { stateByCode } from "@amc/server/geo";
import { ArrowRightIcon, Container, EmptyState, Icon3D, LinkButton, Reveal, type Icon3DName } from "@amc/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { JsonLd, breadcrumbListLd, webPageLd } from "@/components/site/json-ld";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { pageCardImage, pageMediaPlan } from "@/lib/page-media";
import type { MediaAsset } from "@/lib/media";
import styles from "./seo-reader.module.css";

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

function LinkCards({ pages, grouped, cardImages }: { pages: PageSummary[]; grouped: boolean; cardImages: Map<string, MediaAsset> }) {
  const Heading = grouped ? "h3" : "h2";
  return (
    <ul className={styles.hubGrid}>
      {pages.map((p, index) => {
        const image = cardImages.get(p.url)!;
        return <Reveal as="li" key={p.url} delay={Math.min(index % 3, 2) * 45} className={styles.hubCard}>
          <Link href={p.url}>
            <figure className={styles.hubCardPhoto} data-editorial-image={image.id}><MediaFrame asset={image} alt="" sizes="(min-width: 1024px) 30vw, (min-width: 520px) 45vw, 100vw" /></figure>
            <div className={styles.hubCardCopy}><span className={styles.hubCardMeta}>Moving field guide <ArrowRightIcon size={17} /></span><Heading>{p.h1}</Heading><span className="type-small text-text-2">Explore the details →</span></div>
          </Link>
        </Reveal>;
      })}
    </ul>
  );
}

export async function HubPage({ spec, page = 1 }: { spec: HubSpec; page?: number }) {
  const { WEB_URL } = env();
  const listed = spec.perPage ? await publishedPagesPage(spec.family, page, spec.perPage) : { pages: await publishedPages(spec.family), total: 0 };
  const pages = listed.pages;
  const total = spec.perPage ? listed.total : pages.length;
  if (page > 1 && (!pages.length || !spec.perPage || page > Math.ceil(total / spec.perPage))) notFound();
  const url = hubPageUrl(spec, page);
  const crumbs = [{ label: "Home", href: "/" }, { label: spec.h1, href: spec.url }, ...(page > 1 ? [{ label: `Page ${page}`, href: url }] : [])];
  const { images } = pageMediaPlan(url, { family: spec.family, topic: spec.h1 });
  const familyIcon: Icon3DName = ({ route: "route", service: "box", cost: "calculator", question: "chat", planning: "calendar" } as Record<string, Icon3DName>)[spec.family] ?? "origin";
  const grouped = groups(pages, spec.groupByState ?? false);
  const usedCardImages = new Set<string>();
  const cardImages = new Map(pages.map((p) => [p.url, pageCardImage(p.url, { family: p.family, topic: p.h1, stateCode: p.stateCode ?? undefined }, usedCardImages)]));
  return (
    <>
      <JsonLd data={breadcrumbListLd(WEB_URL, crumbs)} />
      <JsonLd data={webPageLd(WEB_URL, { url, name: page > 1 ? `${spec.h1} (page ${page})` : spec.h1, description: spec.description })} />
      <VideoSurveyHero url={url} title={page > 1 ? `${spec.h1} (page ${page})` : spec.h1} description={spec.description} eyebrow="The moving field guide" breadcrumbs={crumbs.map((crumb, i) => i === crumbs.length - 1 ? { label: crumb.label } : crumb)}>
        <a href="#browse-guides" className="inline-flex min-h-11 w-fit items-center gap-3 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4">Browse {total.toLocaleString("en-US")} published {total === 1 ? "guide" : "guides"} <span aria-hidden="true">↓</span></a>
      </VideoSurveyHero>
      <Container>
        <Reveal as="section" aria-label="Find your guide" className={styles.hubLead}>
          <div className={styles.hubLeadCopy}><p className={styles.kicker}>More clarity. Less guesswork.</p><h2 className="type-display-l text-text">A useful detail can change the whole move.</h2><p className={styles.introText}>{spec.lede}</p><div className={styles.hubCount}><strong>{total.toLocaleString("en-US")}</strong><span>published {total === 1 ? "guide" : "guides"}<br />with checked facts and clear assumptions.</span></div></div>
          <div className={styles.photoComposition}><figure className={styles.photoMain} data-editorial-image={images[0]!.id}><MediaFrame asset={images[0]!} sizes="(min-width: 760px) 38vw, 100vw" /><figcaption className={styles.photoLabel}>Move with a clearer plan</figcaption><span className={styles.photoSymbol}><Icon3D name={familyIcon} size={58} float /></span></figure><div className={styles.photoStrip}>{images.slice(1, 4).map((image) => <figure key={image.id} className={styles.photoSmall} data-editorial-image={image.id}><MediaFrame asset={image} alt="" sizes="(min-width: 760px) 10vw, 24vw" /></figure>)}</div></div>
        </Reveal>
        <div className={styles.hubStory}>
          {[
            { title: "Follow the facts", text: "Place data, coverage counts and source links put the details within reach." },
            { title: "See the context", text: "Planning assumptions are labelled, so you know what a figure can tell you." },
            { title: "Keep the choice", text: "One request. Your contact limit. Movers introduce themselves when they contact you." },
          ].map((item, index) => <Reveal key={item.title} delay={index * 50} className={styles.hubStoryCard}><figure className={styles.hubStoryPhoto}><MediaFrame asset={images[index + 1]!} alt="" sizes="80px" /></figure><div><h3 className="type-small font-bold text-text">{item.title}</h3><p>{item.text}</p></div></Reveal>)}
        </div>
      </Container>
      <Container className="grid gap-10 pb-20">
        <section id="browse-guides" aria-label={spec.h1} className="grid min-w-0 gap-10 scroll-mt-24">
          {pages.length ? grouped.length > 1 ? grouped.map((group) => <section key={group.heading ?? "all"} className={styles.hubGroup} aria-label={group.heading ?? spec.h1}>
            <header className={styles.hubGroupHead}><h2 className="type-display-l text-text">{group.heading ?? spec.h1}</h2><p className="type-small text-text-2">{group.pages.length} {group.pages.length === 1 ? "guide" : "guides"}</p></header>
            <LinkCards pages={group.pages} grouped cardImages={cardImages} />
          </section>) : <LinkCards pages={pages} grouped={false} cardImages={cardImages} /> : <EmptyState showMark title="No pages in this family are published yet" description="Each one is published only after its data and checks pass. The quote survey shows coverage for your move right now." action={<LinkButton href="/get-quotes/">Start a quote request</LinkButton>} />}
        </section>
        {spec.perPage ? <PageNav spec={spec} page={page} total={total} /> : null}
        <Reveal as="section" aria-labelledby="hub-next-step" className={styles.quoteBand}><figure className={styles.quotePhoto} data-editorial-image={images[4]!.id}><MediaFrame asset={images[4]!} sizes="(min-width: 760px) 35vw, 100vw" /></figure><div className={styles.quoteCopy}><p className="type-overline">Your move, your terms</p><h2 id="hub-next-step">Turn a little research into a real next step.</h2><p>Check your route, tell us what you need, and choose the maximum number of screened movers who may contact you.</p><div><LinkButton href="/get-quotes/" variant="cta">Start my moving request</LinkButton></div></div></Reveal>
        <p className="type-legal text-text-3">Photography and video are commissioned editorial illustrations. They illustrate moving situations and do not identify a particular customer or moving company.</p>
      </Container>
    </>
  );
}
