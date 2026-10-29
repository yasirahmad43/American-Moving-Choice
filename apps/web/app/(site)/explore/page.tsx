import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, Container } from "@amc/ui";
import { env } from "@amc/server/env";
import { STATES } from "@amc/server/geo";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { MediaFrame } from "@/components/media/media-frame";
import { CategoryIcon } from "@/components/navigation/category-icon";
import { socialMetadata } from "@/components/site/social-metadata";
import { mediaById } from "@/lib/media";
import { pageCardImage, pageMediaPlan } from "@/lib/page-media";
import { GUIDE_FAMILIES, PUBLIC_NAV_GROUPS } from "@/lib/site";
import { catalogFilters, catalogUrl, CATALOG_PAGE_SIZE, navigationOverview, publicCatalog, standaloneCatalog } from "@/lib/public-discovery";
import "./explore.css";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const DESCRIPTION = "Find every American Moving Choice guide and public page. Browse moving advice by state, city, route, service, cost or checklist, or search for what you need.";
const PAGE_GROUP_ICON: Record<string, string> = { move: "service", cost: "cost", trust: "question", help: "state", business: "city", legal: "page" };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { WEB_URL, SITE_INDEXABLE } = env();
  const filters = catalogFilters(await searchParams);
  const filtered = filters.query || filters.state || filters.type !== "all" || filters.page > 1;
  return { title: "All Moving Guides & Pages", description: DESCRIPTION,
    ...(filtered ? { robots: { index: false, follow: true } } : SITE_INDEXABLE ? { alternates: { canonical: `${WEB_URL}/explore/` } } : {}),
    ...socialMetadata(catalogUrl(filters), "All Moving Guides & Pages | American Moving Choice", DESCRIPTION, { family: filters.type === "all" ? undefined : filters.type, stateCode: filters.state || undefined }) };
}

export default async function ExplorePage({ searchParams }: Props) {
  await connection();
  const filters = catalogFilters(await searchParams);
  const [overview, result] = await Promise.all([navigationOverview(), publicCatalog(filters)]);
  const pageCount = Math.max(1, Math.ceil(result.total / CATALOG_PAGE_SIZE));
  if (filters.page > pageCount) notFound();
  const media = pageMediaPlan("/explore/", { family: "planning", topic: "moving guides" });
  const featured = [
    { id: "state", imageId: "svc-local-moving-truck-turning-onto-a" },
    { id: "route", imageId: "svc-long-distance-semi-trailer-moving-van-on" },
    { id: "service", imageId: "svc-packing-mover-wrapping-dining-chair" },
    { id: "cost", imageId: "costs-coins-and-bills-in-a" },
    { id: "planning", imageId: "planning-checklist-table-tape-notebook" },
  ];
  // One render owns this variety set; catalog imagery makes no exclusive media claims.
  const usedCardImages = new Set([...media.images.map((image) => image.id), ...featured.map((entry) => entry.imageId)]);
  const cardImages = new Map(result.pages.map((page) => [page.url, pageCardImage(page.url, {
    family: page.family,
    topic: page.title,
    stateCode: STATES.find((entry) => entry.code === page.stateCode)?.code,
  }, usedCardImages)]));
  const numbers = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => filters.page - 2 + i).filter((page) => page >= 1 && page <= pageCount), pageCount])].sort((a, b) => a - b);
  const state = STATES.find((entry) => entry.code === filters.state);
  const category = GUIDE_FAMILIES.find((entry) => entry.id === filters.type);
  const control = "min-h-12 w-full min-w-0 rounded-control border border-border-strong bg-white px-3 text-base text-text";
  const guideSearch = (
    <form id="guide-search" action="/explore/#browse-guides" method="get" role="search" aria-label="Search all guides and public pages" className="mt-5 grid gap-3 rounded-xl border border-white/25 bg-brand-navy/60 p-4 text-white" data-content-inset="card">
      <label htmlFor="catalog-query" className="text-sm font-bold text-white">Search moving guides</label>
      <div className="catalog-query-fields grid gap-2">
        <input id="catalog-query" name="q" type="search" defaultValue={filters.query} maxLength={80} placeholder="City, route or topic" className={control} />
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand-red px-4 text-sm font-bold text-white hover:brightness-90">Find guides <ArrowRightIcon size={17} /></button>
      </div>
      <details open={filters.type !== "all" || Boolean(filters.state)} className="border-t border-white/20 pt-1">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-white">Refine by category or state</summary>
        <div className="catalog-refine-fields grid gap-3 pb-1">
          <div className="grid min-w-0 gap-2"><label htmlFor="catalog-type" className="text-xs font-bold text-white">Guide category</label><select id="catalog-type" name="type" defaultValue={filters.type} className={control}><option value="all">All guides & pages</option>{GUIDE_FAMILIES.filter((entry) => entry.id !== "zip" || (overview?.families.zip ?? 0) > 0).map((entry) => <option key={entry.id} value={entry.id}>{entry.label}{overview ? ` (${overview.families[entry.id] ?? 0})` : ""}</option>)}<option value="page">Tools, about & policies ({standaloneCatalog().length})</option></select></div>
          <div className="grid min-w-0 gap-2"><label htmlFor="catalog-state" className="text-xs font-bold text-white">State</label><select id="catalog-state" name="state" defaultValue={filters.state} className={control}><option value="">All states</option>{STATES.filter((entry) => !overview || overview.states.some((item) => item.code === entry.code)).map((entry) => <option key={entry.code} value={entry.code}>{entry.name}</option>)}</select></div>
        </div>
      </details>
    </form>
  );
  return <>
    <VideoSurveyHero url="/explore/" eyebrow="Your moving library" title={<>A little knowledge.<br />A better move.</>} description={<><p>Find your place, plan your route and get ready for what comes next.</p>{guideSearch}</>} breadcrumbs={[{ label: "Home", href: "/" }, { label: "All moving guides" }]}>
      <a href="#browse-guides" className="inline-flex min-h-12 items-center gap-3 font-bold text-white underline underline-offset-4">{overview ? `Explore ${overview.total.toLocaleString("en-US")} moving guides` : "Explore the moving library"}<ArrowRightIcon size={19} /></a>
    </VideoSurveyHero>

    <Container className="catalog-feature-section">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="type-overline text-text-3">Make a little room for possibility.</p><h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text sm:text-4xl">Every move starts somewhere.</h2></div><a href="#browse-guides" className="inline-flex min-h-11 items-center gap-2 font-bold text-link underline underline-offset-4">Find your next step <ArrowRightIcon size={17} /></a></div>
      <ul aria-label="Moving guide topics" className="catalog-topics">{featured.map(({ id, imageId }, index) => {
        const family = GUIDE_FAMILIES.find((entry) => entry.id === id)!;
        const image = mediaById(imageId) ?? media.images[index];
        return <li key={id} className="catalog-topic-item"><Link href={catalogUrl({ type: id })} className="catalog-topic group/card"><div className="catalog-topic-photo">{image ? <MediaFrame asset={image} sizes="(min-width: 1024px) 20vw, 50vw" className="transition-transform duration-500 motion-reduce:transition-none group-hover/card:scale-105" /> : null}<span className="absolute bottom-3 left-3 rounded-pill bg-white px-3 py-1 text-sm font-bold tabular text-brand-navy">{overview ? `${(overview.families[family.id] ?? 0).toLocaleString("en-US")} guides` : family.short}</span></div><div className="catalog-topic-copy" data-content-inset="card"><span className="catalog-topic-title"><span className="flex items-center gap-2"><CategoryIcon family={family.id} className="shrink-0 text-brand-red" />{family.label}</span><ArrowRightIcon size={17} className="shrink-0 text-brand-red" /></span><p className="text-sm leading-relaxed text-text-2">{family.description}</p></div></Link></li>;
      })}</ul>
    </Container>

    <section id="browse-guides" aria-labelledby="browse-heading" className="scroll-mt-6 border-y border-border bg-surface-2">
      <Container className="catalog-browser-section">
        <div className="mb-7 grid gap-3"><p className="type-overline text-text-3">All the details. A little less guesswork.</p><h2 id="browse-heading" className="font-display text-3xl font-extrabold tracking-tight text-text sm:text-4xl">What can we help you plan?</h2><p className="max-w-[68ch] text-text-2">Search every published guide, or choose a topic and a state. Advice, tools, information about American Moving Choice and policies are all here.</p></div>


        <div className="catalog-layout">
          <div className="catalog-controls">
            <nav aria-label="Browse guide categories" className="catalog-category-nav"><h3 className="type-overline text-text-3">Choose your chapter</h3><ul className="catalog-categories mt-3 grid gap-1"><li><Link href={catalogUrl({ query: filters.query, state: filters.state })} aria-current={filters.type === "all" ? "page" : undefined} className="flex min-h-11 items-center justify-between rounded-control px-3 font-semibold text-text-2 no-underline hover:bg-surface aria-[current=page]:bg-brand-navy aria-[current=page]:text-white">All guides & pages</Link></li>{GUIDE_FAMILIES.filter((entry) => entry.id !== "zip" || (overview?.families.zip ?? 0) > 0).map((entry) => <li key={entry.id}><Link href={catalogUrl({ type: entry.id, query: filters.query, state: filters.state })} aria-current={filters.type === entry.id ? "page" : undefined} className="flex min-h-11 items-center justify-between gap-3 rounded-control px-3 font-semibold text-text-2 no-underline hover:bg-surface aria-[current=page]:bg-brand-navy aria-[current=page]:text-white"><span>{entry.label}</span><span className="text-sm tabular">{overview ? overview.families[entry.id] ?? 0 : ""}</span></Link></li>)}<li><Link href={catalogUrl({ type: "page", query: filters.query })} aria-current={filters.type === "page" ? "page" : undefined} className="flex min-h-11 items-center justify-between gap-3 rounded-control px-3 font-semibold text-text-2 no-underline hover:bg-surface aria-[current=page]:bg-brand-navy aria-[current=page]:text-white">Tools, about & policies</Link></li></ul></nav>
            <details className="catalog-states rounded-card border border-border bg-surface p-4" data-content-inset="card"><summary className="min-h-11 cursor-pointer py-2 font-bold text-text">Browse all states A–Z</summary><ul className="mt-3 grid gap-0.5">{STATES.filter((entry) => !overview || overview.states.some((item) => item.code === entry.code)).map((entry) => <li key={entry.code}><Link href={catalogUrl({ type: filters.type === "page" ? "all" : filters.type, state: entry.code })} className="flex min-h-11 items-center justify-between gap-2 text-sm font-medium text-text-2 underline-offset-4 hover:text-link hover:underline" data-content-inset="compact">{entry.name}<span className="tabular text-text-3">{overview ? `${overview.states.find((item) => item.code === entry.code)?.cities ?? 0} cities` : ""}</span></Link></li>)}</ul></details>
          </div>
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-xl font-extrabold text-text">{filters.query ? `Results for “${filters.query}”` : category?.label ?? (filters.type === "page" ? "Tools, about & policies" : "Every guide & public page")}{state ? ` in ${state.name}` : ""}</h3><p className="mt-1 type-small tabular text-text-2">{result.total ? `${((filters.page - 1) * CATALOG_PAGE_SIZE + 1).toLocaleString("en-US")}–${Math.min(filters.page * CATALOG_PAGE_SIZE, result.total).toLocaleString("en-US")} of ${result.total.toLocaleString("en-US")} pages` : "No matching pages"}</p></div>{filters.query || filters.state || filters.type !== "all" ? <Link href="/explore/" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">Clear filters</Link> : null}</div>
            {result.pages.length ? <ul aria-label="Guide search results" className="catalog-results">{result.pages.map((page) => {
              const family = GUIDE_FAMILIES.find((entry) => entry.id === page.family);
              const group = PUBLIC_NAV_GROUPS.find((entry) => entry.links.some((link) => link.href === page.url));
              const image = cardImages.get(page.url)!;
              return <li key={page.url} className="min-w-0"><Link href={page.url} aria-label={page.title} className="catalog-result group/result">
                <span className="catalog-result-photo" data-catalog-image={image.id} aria-hidden="true"><MediaFrame asset={image} alt="" sizes="(min-width: 1200px) 24vw, (min-width: 620px) 31vw, 46vw" /></span>
                <span className="catalog-result-copy" data-content-inset="card"><span className="catalog-result-category type-overline text-text-3"><CategoryIcon family={page.family === "page" ? (PAGE_GROUP_ICON[group?.id ?? ""] ?? "page") : page.family} className="shrink-0 text-brand-red" /><span>{family?.label ?? group?.label ?? "American Moving Choice"}{page.stateCode ? ` · ${page.stateCode}` : ""}</span></span><span className="catalog-result-title"><span>{page.title}</span><ArrowRightIcon size={18} className="shrink-0 text-brand-red" /></span></span>
              </Link></li>;
            })}</ul> : <div className="grid gap-4 rounded-card border border-dashed border-border-strong bg-surface p-8" data-content-inset="card"><h4 className="font-display text-2xl font-bold text-text">Let’s try a different direction.</h4><p className="max-w-[50ch] text-text-2">Try a nearby city, a broader topic or another state. Only published guides appear here. You can still check your exact move in the quote survey.</p><Link href="/get-quotes/" className="inline-flex min-h-12 w-fit items-center gap-3 font-bold text-link underline underline-offset-4">Check your move <ArrowRightIcon size={17} /></Link></div>}
            {pageCount > 1 ? <nav aria-label="Catalog result pages" className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"><p className="type-small tabular text-text-2">Page {filters.page} of {pageCount}</p><ul className="flex flex-wrap items-center gap-1">{filters.page > 1 ? <li><Link href={catalogUrl({ ...filters, page: filters.page - 1 })} rel="prev" className="inline-flex min-h-11 items-center px-3 font-semibold text-link">Previous</Link></li> : null}{numbers.map((number, index) => <li key={number} className="flex items-center">{index > 0 && number > numbers[index - 1]! + 1 ? <span className="px-2 text-text-3" aria-hidden="true">…</span> : null}{number === filters.page ? <span aria-current="page" className="inline-grid size-11 place-items-center rounded-control bg-brand-navy font-bold tabular text-white">{number}</span> : <Link href={catalogUrl({ ...filters, page: number })} className="inline-grid size-11 place-items-center rounded-control font-semibold tabular text-link hover:bg-surface">{number}</Link>}</li>)}{filters.page < pageCount ? <li><Link href={catalogUrl({ ...filters, page: filters.page + 1 })} rel="next" className="inline-flex min-h-11 items-center px-3 font-semibold text-link">Next</Link></li> : null}</ul></nav> : null}
          </div>
        </div>
      </Container>
    </section>
  </>;
}
