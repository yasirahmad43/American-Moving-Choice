/**
 * Renders a published programmatic page from its stored content (@amc/server/seo): breadcrumbs,
 * H1, the first-screen answer with its dated data points, the sections, the quote entry, FAQ,
 * related links (published targets only), sources, credits and JSON-LD. Historical company
 * listings and identity-first copy are removed before any content is rendered or passed to
 * client components. This file skins the remaining content with the Route Ledger premium
 * system (packages/ui): editorial header, claimed media, stat tiles, ledger strips for sourced
 * facts, flip cards for cost factors, expandable FAQ cards, a related-links grid and the sticky
 * quote CTA on phones.
 */
import { env } from "@amc/server/env";
import { publishedAmong, publishedRelated, type ContentBlock, type SeoPageRecord } from "@amc/server/seo";
import { Breadcrumbs, Container, Counter, ExpandableCard, FlipCard, Icon3D, IdCardIcon, LedgerStrip, Reveal, RouteMark, SectionHeader, StatTile, StickyCta, Table, TiltCard, type Icon3DName } from "@amc/ui";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { JsonLd } from "@/components/site/json-ld";
import { creditLine, mediaForSeoPage } from "@/lib/media";
import { InlineText, stripLinks } from "./inline-text";
import { PREFILL_STORAGE_KEY, QuoteEntryButton } from "./quote-entry";
import { breadcrumbLd, pageLd, type Crumb } from "./seo-metadata";
import { publicSeoPage } from "./public-content";

/** A 3D icon for a data-point label (origin pin for places, route for distances, and so on). */
function iconForLabel(label: string): Icon3DName {
  const l = label.toLowerCase();
  if (/zip/.test(l)) return "pin";
  if (/mover|carrier|compan/.test(l)) return "verified";
  if (/population|people|resident/.test(l)) return "chart";
  if (/county|counties/.test(l)) return "origin";
  if (/distance|mile|route|drive/.test(l)) return "route";
  if (/cost|price|range|\$/.test(l)) return "price";
  if (/date|updated|as of|year/.test(l)) return "calendar";
  if (/city|cities|metro|town/.test(l)) return "destination";
  if (/service|packing|storage/.test(l)) return "box";
  return "ledger";
}

/** The integer in a plain count such as "95" or "3,884,307"; null for anything else (never money). */
function numericValue(value: string): number | null {
  const m = /^\s*(\d{1,3}(?:,\d{3})+|\d+)\s*([a-z%]*)\s*$/i.exec(value);
  if (!m) return null;
  const n = Number(m[1]!.replace(/,/g, ""));
  return Number.isFinite(n) && n < 1e9 ? n : null;
}
function suffixOf(value: string): string {
  const m = /^\s*(?:\d{1,3}(?:,\d{3})+|\d+)\s*([a-z%]*)\s*$/i.exec(value);
  return m?.[1] ? ` ${m[1]}` : "";
}

const NUMERIC_CELL = /^\s*[-$]?\d[\d,.]*\s*(%|mi|miles|lb|lbs|hours?|min|km|ft|sq ?ft)?\s*$/i;

/** A stored content table as the data table: sortable headers, numeric columns right-aligned. */
function ContentTable({ caption, columns, rows, allow }: { caption?: string; columns: string[]; rows: string[][]; allow: (href: string) => boolean }) {
  const numeric = columns.map((_, j) => rows.length > 0 && rows.every((r) => !r[j] || NUMERIC_CELL.test(r[j]!)));
  const parse = (cell: string | undefined) => {
    if (!cell) return null;
    const n = Number(cell.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const max = columns.map((_, j) => (numeric[j] ? Math.max(1, ...rows.map((r) => parse(r[j]) ?? 0)) : 1));
  const barColumn = columns.findIndex((c, j) => numeric[j] && /distance|miles|population|movers|zip/i.test(c));
  return (
    <div className="not-prose">
      <Table<{ id: string; cells: string[] }>
        caption={caption ?? "Table"}
        hideCaption={!caption}
        compact
        densityToggle={rows.length > 8}
        rowKey={(r) => r.id}
        rows={rows.map((cells, i) => ({ id: String(i), cells }))}
        maxHeight={rows.length > 14 ? "34rem" : undefined}
        columns={columns.map((header, j) => ({
          key: `c${j}`,
          header,
          primary: j === 0,
          numeric: numeric[j],
          sortable: rows.length > 2,
          sortValue: (r) => (numeric[j] ? parse(r.cells[j]) ?? "" : r.cells[j] ?? ""),
          bar: j === barColumn ? (r) => (parse(r.cells[j]) ?? 0) / max[j]! : undefined,
          cell: (r) => <InlineText text={r.cells[j] ?? ""} allow={allow} />,
        }))}
      />
    </div>
  );
}

function Block({ block, allow }: { block: ContentBlock; allow: (href: string) => boolean }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <InlineText text={block.text} allow={allow} />
        </p>
      );
    case "note":
      return (
        <p className="not-prose flex gap-3 rounded-control border border-border border-l-4 border-l-brand-navy bg-surface-2 px-4 py-3 type-small text-text-2">
          <span className="sr-only">Note: </span>
          <InlineText text={block.text} allow={allow} />
        </p>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText text={item} allow={allow} />
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return <ContentTable caption={block.caption} columns={block.columns} rows={block.rows} allow={allow} />;
    case "facts":
      // Sourced facts as a ledger strip: the claim, its source and the date it was read.
      return (
        <div className="not-prose">
          <LedgerStrip
            title="Checked facts"
            rows={block.items.map((item) => ({
              label: <InlineText text={item.claim} allow={allow} />,
              value: (
                <>
                  Source:{" "}
                  <a href={item.source.url} className="link" rel="noopener">
                    {item.source.label}
                  </a>
                </>
              ),
              when: `Read ${item.source.accessedOn}`,
              status: "info" as const,
            }))}
          />
        </div>
      );
    case "cost": {
      const c = block.block;
      return (
        <section aria-label={`Cost range: ${c.scope}`} className="not-prose grid gap-4 rounded-card border border-border bg-surface p-5 shadow-e1 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="type-h3 text-text">{c.scope}</h3>
            <span className="rounded-tag bg-surface-3 px-2 py-0.5 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-text-2">Planning range, not a quote</span>
          </div>
          {c.rows.length ? (
            <>
              <Table
                caption={`Planning ranges: ${c.scope}`}
                hideCaption
                compact
                densityToggle={false}
                rowKey={(r) => r.homeSize}
                rows={c.rows}
                columns={[
                  { key: "size", header: "Home size", primary: true, cell: (r) => <span className="font-semibold">{r.homeSize}</span> },
                  { key: "range", header: "Typical range", numeric: true, nowrap: true, cell: (r) => `${r.low} to ${r.high}` },
                  { key: "typical", header: "Typical job", cell: (r) => r.typical },
                  { key: "movers", header: "Movers' cards", numeric: true, cell: (r) => r.movers, bar: (r) => r.movers / Math.max(1, ...c.rows.map((x) => x.movers)) },
                ]}
              />
              <p className="type-small text-text-2">
                25th to 75th percentile, {c.modelVersion}, rate cards as of {c.asOf}. A planning range from movers&apos; rate cards, not a quote or estimate: movers set their own prices.
              </p>
            </>
          ) : (
            <p className="type-small text-text-2">{c.noData}</p>
          )}
        </section>
      );
    }
    case "movers":
      // Defense in depth: even a caller that skips publicSeoPage cannot render a company list.
      return null;
  }
}

/** "Moving from A to B" style headings give the route strip its two ends. */
function routeEnds(page: SeoPageRecord): { from: string; to: string } | null {
  if (page.family !== "route") return null;
  const match = /from\s+(.+?)\s+to\s+(.+?)(?:[:,.]|$)/i.exec(page.h1);
  return match ? { from: match[1]!, to: match[2]! } : null;
}

/** Sections whose heading names cost factors get flip cards; everything else stays prose. */
const FLIP_SECTION = /cost factor|what (drives|affects) the (price|cost)|price factor/i;

export async function SeoPageView({ page: storedPage, crumbs }: { page: SeoPageRecord; crumbs: Crumb[] }) {
  const page = publicSeoPage(storedPage);
  const { WEB_URL } = env();
  const related = await publishedRelated(page);
  // Inline links to unpublished SEO pages render as plain text (no 404s, site architecture §3.3).
  const inlineHrefs = [...new Set((JSON.stringify(page.content).match(/\]\((\/[^)\s]*)\)/g) ?? []).map((m) => m.slice(2, -1)))];
  const live = await publishedAmong(inlineHrefs);
  const allow = (href: string) => live.has(href);
  const media = mediaForSeoPage(page.url, page.mediaIds).find((m) => m.kind === "image") ?? null;
  const trail = [{ label: "Home", href: "/" }, ...crumbs];
  const route = routeEnds(page);
  const quote = page.content.quote;
  const prefill = JSON.stringify({ entry: quote.entry, ...(quote.originZip ? { originZip: quote.originZip } : {}), ...(quote.destZip ? { destZip: quote.destZip } : {}) });
  return (
    <>
      <JsonLd data={breadcrumbLd(WEB_URL, trail)} />
      <JsonLd data={pageLd(WEB_URL, page)} />

      {/* Editorial header: breadcrumbs, H1, the first-screen answer, data points and the quote entry. */}
      <div className="mesh-light border-b border-border">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,22rem)] lg:gap-12">
          <div className="grid content-start gap-5">
            <Breadcrumbs items={trail.map((c, i) => (i === trail.length - 1 ? { label: c.label } : c))} />
            {route ? (
              <p className="flex items-center gap-3 type-overline text-text-2">
                <span>{route.from}</span>
                <RouteMark size={14} />
                <span>{route.to}</span>
              </p>
            ) : null}
            <h1 className="type-display-xl max-w-[18ch] text-text">{page.h1}</h1>
            <p className="type-lede max-w-[60ch] text-text-2">
              <InlineText text={page.content.intro.answer} allow={allow} />
            </p>
            {page.content.intro.dataPoints.length ? (
              <dl className="grid grid-cols-2 gap-3 pt-2 lg:grid-cols-4" data-motion="stagger">
                {page.content.intro.dataPoints.map((d, i) => (
                  <TiltCard as="div" key={d.label} max={8} depth={16} padding="none" bodyClassName="grid h-full content-start gap-1 p-4">
                    <Icon3D name={iconForLabel(d.label)} size={44} float delay={i * 0.7} className="tilt-layer-2 mb-1" />
                    <dt className="type-small font-semibold text-text-2 tilt-layer">{d.label}</dt>
                    <dd className="m-0 font-display text-[1.75rem] leading-none font-extrabold tabular text-text tilt-layer [font-stretch:85%]">{numericValue(d.value) !== null ? <Counter value={numericValue(d.value)!} suffix={suffixOf(d.value)} /> : d.value}</dd>
                    <dd className="m-0 type-small text-text-3 tilt-layer">{d.basis}</dd>
                  </TiltCard>
                ))}
              </dl>
            ) : null}
          </div>
          <aside aria-labelledby="quote-heading" className="lg:self-end">
            <div className="bezel">
              <div className="bezel-inner grid content-start gap-3 p-5 sm:p-6">
                <h2 id="quote-heading" className="type-h3 text-text">
                  {quote.heading}
                </h2>
                <p className="text-text-2">{quote.text}</p>
                <QuoteEntryButton originZip={quote.originZip} destZip={quote.destZip} label={quote.cta} />
                <p className="flex items-center gap-2 type-small text-text-3">
                  <IdCardIcon size={16} /> Movers only. You choose how many can contact you.
                </p>
              </div>
            </div>
          </aside>
        </Container>
      </div>

      <Container className="grid gap-12 pb-20 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] lg:gap-16">
        <div className="grid min-w-0 gap-12">
          {media ? (
            <Reveal as="figure" className="grid gap-2">
              <div className="zoom-media relative aspect-[21/9] overflow-hidden rounded-card ring-1 ring-border">
                <MediaFrame asset={media} priority sizes="(min-width: 1280px) 52rem, 100vw" />
              </div>
              <figcaption className="type-small text-text-3">
                {media.alt}
                {creditLine(media) ? ` · ${creditLine(media)}` : ""}
              </figcaption>
            </Reveal>
          ) : null}

          {page.content.sections.map((section, index) => {
            const flip = FLIP_SECTION.test(section.heading) && section.blocks.every((b) => b.type === "list") && section.blocks.some((b) => b.type === "list" && b.items.length >= 3);
            return (
              <Reveal as="section" key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} delay={Math.min(index, 3) * 40} className="scroll-mt-6">
                <h2 id={`${section.id}-h`} className="type-display-l text-text">
                  {section.heading}
                </h2>
                {flip ? (
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.blocks
                      .flatMap((b) => (b.type === "list" ? b.items : []))
                      .map((item, i) => {
                        const plain = stripLinks(item);
                        const colon = plain.indexOf(":");
                        const title = colon > 0 && colon < 60 ? plain.slice(0, colon) : plain.split(/[.!?]/)[0]!.slice(0, 60);
                        return (
                          <li key={i} className="min-w-0">
                            <FlipCard
                              toggleLabel={`More about ${title.toLowerCase()}`}
                              minHeight="13rem"
                              front={
                                <h3 className="type-h4 text-text">
                                  <span className="mr-2 font-display text-[1.5rem] font-black tabular text-brand-red [font-stretch:80%]">{String(i + 1).padStart(2, "0")}</span>
                                  {title}
                                </h3>
                              }
                              back={
                                <p className="text-text-2">
                                  <InlineText text={item} allow={allow} />
                                </p>
                              }
                            />
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <div className="prose mt-5 max-w-none">
                    {section.blocks.map((block, i) => (
                      <Block key={i} block={block} allow={allow} />
                    ))}
                  </div>
                )}
              </Reveal>
            );
          })}

          {page.content.faq.length ? (
            <Reveal as="section" id="faq" aria-labelledby="faq-h" className="grid gap-6 scroll-mt-6">
              <SectionHeader id="faq-h" overline="Questions" title="Questions about this page" />
              <div className="grid gap-3">
                {page.content.faq.map((item) => (
                  <ExpandableCard key={item.question} title={item.question} name="seo-faq">
                    <p>
                      <InlineText text={item.answer} allow={allow} />
                    </p>
                  </ExpandableCard>
                ))}
              </div>
            </Reveal>
          ) : null}

          <footer className="grid gap-2 border-t border-border pt-6 type-small text-text-2">
            <p>
              Data as of {page.content.dataAsOf}. Last updated {page.updatedAt.toISOString().slice(0, 10)}.
              {page.reviewedBy && page.lastReviewedAt ? ` Reviewed by ${page.reviewedBy} on ${page.lastReviewedAt.toISOString().slice(0, 10)}.` : ""}
            </p>
            {page.sources.length ? (
              <p>
                Sources:{" "}
                {page.sources.map((s, i) => (
                  <span key={`${s.url}-${i}`}>
                    <a href={s.url} className="link" rel="noopener">
                      {s.label}
                    </a>{" "}
                    (read {s.accessedOn}){i < page.sources.length - 1 ? "; " : "."}
                  </span>
                ))}
              </p>
            ) : null}
            {page.content.credits.map((credit) => (
              <p key={credit}>{credit}</p>
            ))}
          </footer>
        </div>

        <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
          {page.content.sections.length > 1 ? (
            <nav aria-label="On this page" className="rounded-card border border-border bg-surface p-5 shadow-e1">
              <p className="type-overline text-text-3">On this page</p>
              <ul className="mt-3 grid gap-0.5 border-l border-border">
                {page.content.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 type-small font-semibold text-text-2 no-underline transition-colors duration-[var(--d1)] hover:border-brand-navy hover:text-text"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
                {page.content.faq.length ? (
                  <li>
                    <a href="#faq" className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 type-small font-semibold text-text-2 no-underline hover:border-brand-navy hover:text-text">
                      Questions
                    </a>
                  </li>
                ) : null}
              </ul>
            </nav>
          ) : null}
          <StatTile tone="plain" value={page.evidenceCount} label={page.evidenceCount === 1 ? "sourced data point" : "sourced data points"} note={`Data as of ${page.content.dataAsOf}`} />
        </aside>
      </Container>

      {related.length ? (
        <section aria-label="Related pages" className="border-t border-border bg-surface-2">
          <Container className="grid gap-8 section-pad">
            <Reveal>
              <SectionHeader overline="Keep reading" title="Related pages" />
            </Reveal>
            <nav aria-label="Related pages" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((group, index) => (
                <Reveal key={group.heading} delay={index * 50} className="rounded-card border border-border bg-surface p-5 depth-1">
                  <h2 className="type-overline text-text-2">{group.heading}</h2>
                  <ul className="mt-3 grid gap-0.5">
                    {group.links.map((link) => (
                      <li key={`${link.href}-${link.relation}`}>
                        <Link href={link.href} className="link inline-flex min-h-11 items-center">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </nav>
          </Container>
        </section>
      ) : null}

      <StickyCta href="/get-quotes/" label={quote.cta} watch="quote-heading" note="Movers only · No brokers" storage={{ key: PREFILL_STORAGE_KEY, value: prefill }} />
    </>
  );
}
