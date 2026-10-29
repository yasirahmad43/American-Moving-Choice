/**
 * Renders a published programmatic page from its stored content (@amc/server/seo): breadcrumbs,
 * H1, the first-screen answer with its dated data points, the sections, the quote entry, FAQ,
 * related links (published targets only), sources, credits and JSON-LD. Historical company
 * listings and identity-first copy are removed before any content is rendered or passed to
 * client components. This file skins the remaining content with the Route Ledger premium
 * system: cinematic survey hero, reusable editorial illustrations, a visual reading map,
 * complete sourced facts/tables, expandable FAQs, image-led related cards and a mobile CTA.
 */
import { env } from "@amc/server/env";
import { publishedAmong, publishedRelated, type ContentBlock, type SeoPageRecord } from "@amc/server/seo";
import { Container, ExpandableCard, Icon3D, IdCardIcon, LedgerStrip, LineIcon, Reveal, RouteMark, SectionHeader, StickyCta, Table, type Icon3DName, type LineIconName } from "@amc/ui";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { JsonLd } from "@/components/site/json-ld";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { creditLine, mediaForSeoPage } from "@/lib/media";
import { pageCardImage, pageMediaPlan } from "@/lib/page-media";
import { InlineText as StoredInlineText } from "./inline-text";
import { PREFILL_STORAGE_KEY, QuoteEntryButton } from "./quote-entry";
import { breadcrumbLd, pageLd, seoPageHeading, type Crumb } from "./seo-metadata";
import { GuideContents } from "./guide-contents";
import { seoHeroCopy } from "./hero-copy";
import { publicSeoPage } from "./public-content";
import styles from "./seo-reader.module.css";

/** Presentation copy only: retain stored facts, assumptions and link destinations exactly. */
function consumerText(text: string): string {
  return text.split(/(\]\([^)]+\)|https?:\/\/[^\s<>]+)/g).map((part) => {
    if (part.startsWith("](") || /^https?:\/\//.test(part)) return part;
    return part
      .replaceAll("@amc/core classifyMove", "distance classification")
      .replaceAll("transit-model-v1 planning assumptions", "planning assumptions")
      .replaceAll("transit-model-v1 planning assumption", "planning assumption")
      .replaceAll("transit-model-v1", "route planning model")
      .replaceAll("through rules that don't name it", "under their current service areas");
  }).join("");
}

function InlineText(props: Parameters<typeof StoredInlineText>[0]) {
  return <StoredInlineText {...props} text={consumerText(props.text)} />;
}

const NUMERIC_CELL = /^\s*[-$]?\d[\d,.]*\s*(%|mi|miles|lb|lbs|hours?|min|km|ft|sq ?ft)?\s*$/i;

function topicIcon(text: string): LineIconName {
  if (/population|density|number|figure/i.test(text)) return "chart";
  if (/housing|home/i.test(text)) return "home";
  if (/price|cost|rate|estimate/i.test(text)) return "money";
  if (/route|mile|distance|driving/i.test(text)) return "route";
  if (/date|day|week|month|timeline/i.test(text)) return "calendar";
  if (/zip|count|city|state|nearby|coverage/i.test(text)) return "map-pin";
  if (/privacy|permission|contact limit/i.test(text)) return "lock";
  if (/service|pack|belonging/i.test(text)) return "box";
  if (/rule|law|regulat|licen|source/i.test(text)) return "ledger";
  return "clipboard";
}

function mediaFamily(href: string): string | undefined {
  const parts = href.split("/").filter(Boolean);
  if (parts[0] === "movers") return parts.length > 2 ? "city" : "state";
  return ({ routes: "route", services: "service", "moving-costs": "cost", questions: "question", planning: "planning" } as Record<string, string>)[parts[0] ?? ""];
}

/** A stored content table as the data table: sortable headers, numeric columns right-aligned. */
function ContentTable({ id, caption, accessibleCaption, columns, rows, allow }: { id: string; caption?: string; accessibleCaption: string; columns: string[]; rows: string[][]; allow: (href: string) => boolean }) {
  const numeric = columns.map((_, j) => rows.length > 0 && rows.every((r) => !r[j] || NUMERIC_CELL.test(r[j]!)));
  const parse = (cell: string | undefined) => {
    if (!cell) return null;
    const n = Number(cell.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const max = columns.map((_, j) => (numeric[j] ? Math.max(1, ...rows.map((r) => parse(r[j]) ?? 0)) : 1));
  const barColumn = columns.findIndex((c, j) => numeric[j] && /distance|miles|population|movers|zip (?:codes|count)|number of zips/i.test(c));
  return (
    <div className="not-prose grid min-w-0 gap-2">
      {rows.length > 5 ? <p className="type-legal text-text-2">All {rows.length.toLocaleString("en-US")} records are included.{columns.length > 4 ? " Open a record for its complete details." : ""}</p> : null}
      <Table<{ id: string; cells: string[] }>
        id={id}
        caption={caption || accessibleCaption}
        hideCaption={!caption}
        compact
        layout="adaptive"
        densityToggle={rows.length > 8}
        rowKey={(r) => r.id}
        rows={rows.map((cells, i) => ({ id: String(i), cells }))}
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

function Block({ id, block, tableLabel, allow }: { id: string; block: ContentBlock; tableLabel: string; allow: (href: string) => boolean }) {
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
        <Tag className={`${styles.visualList} ${block.items.every(item => item.length <= 160) ? styles.visualListCompact : ""}`}>
          {block.items.map((item, i) => (
            <li key={i}>
              <span className={`${styles.listPhoto} ${styles.utilityGlyph}`} aria-hidden="true"><LineIcon name={topicIcon(item)} size={25} /></span>
              <span className={styles.listBody}>{block.ordered ? <strong className="mr-1 tabular text-brand-red">{i + 1}.</strong> : null}<InlineText text={item} allow={allow} /></span>
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return <ContentTable id={id} caption={block.caption} accessibleCaption={tableLabel} columns={block.columns} rows={block.rows} allow={allow} />;
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
                id={`${id}-cost`}
                caption={`Planning ranges: ${c.scope}`}
                hideCaption
                compact
                layout="adaptive"
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

export async function SeoPageView({ page: storedPage, crumbs }: { page: SeoPageRecord; crumbs: Crumb[] }) {
  const page = publicSeoPage(storedPage);
  const tablePrefix = `seo-${page.url.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const { WEB_URL } = env();
  const related = await publishedRelated(page);
  const inlineHrefs = [...new Set((JSON.stringify(page.content).match(/\]\((\/[^)\s]*)\)/g) ?? []).map((m) => m.slice(2, -1)))];
  const live = await publishedAmong(inlineHrefs);
  const allow = (href: string) => live.has(href);
  const media = (await mediaForSeoPage(page.url, page.mediaIds)).find((asset) => asset.kind === "image") ?? null;
  const { images } = pageMediaPlan(page.url, { family: page.family, topic: page.primaryKeyword, stateCode: page.stateCode ?? undefined });
  const usedPhotos = new Set(images.map((image) => image.id));
  const chapterImages = page.content.sections.map((section, index) => {
    if (index % 3 !== 0) return null;
    if (index === 0 && media && !usedPhotos.has(media.id)) { usedPhotos.add(media.id); return media; }
    return pageCardImage(`${page.url}#${section.id}`, { family: page.family, topic: section.heading, stateCode: page.stateCode ?? undefined }, usedPhotos);
  });
  const faqImage = page.content.faq.length ? pageCardImage("/questions/", { family: "question", topic: `${page.primaryKeyword} questions` }, usedPhotos) : null;
  const relatedImages = new Map(related.map((group) => {
    const href = group.links[0]?.href ?? page.url;
    return [group.heading, pageCardImage(href, { family: mediaFamily(href), topic: group.heading }, usedPhotos)];
  }));
  const trail = [{ label: "Home", href: "/" }, ...crumbs];
  const route = routeEnds(page);
  const quote = page.content.quote;
  const displayHeading = seoPageHeading(page);
  const facts = page.content.intro.dataPoints;
  const countyFact = facts.find((fact) => /^county$/i.test(fact.label));
  const populationFact = facts.find((fact) => /population/i.test(fact.label));
  const zipFact = facts.find((fact) => /zip codes/i.test(fact.label));
  const populationVintage = populationFact?.basis.match(/\b20\d{2} ACS 5-year/i)?.[0];
  const cityContext = [countyFact?.value, populationFact ? `${populationFact.value} residents${populationVintage ? ` (${populationVintage})` : ""}` : zipFact ? `${zipFact.value} ZIP codes` : undefined].filter(Boolean).join(" · ");
  const heroFacts = facts.filter((fact) => !/naming|named|classified as/i.test(fact.label)).slice(0, 4);
  const familyLabel = ({ city: "Local moving guide", state: "State moving guide", route: "Route field guide", zip: "Your neighbourhood", service: "Moving services", cost: "Moving cost guide", question: "A clearer answer", planning: "Your moving playbook" } as Record<string, string>)[page.family] ?? "Moving field guide";
  const familyIcon: Icon3DName = ({ city: "pin", state: "origin", route: "route", zip: "destination", service: "box", cost: "calculator", question: "chat", planning: "calendar" } as Record<string, Icon3DName>)[page.family] ?? "box";
  const introHeading = page.family === "city" ? `Your ${displayHeading.replace(/^Movers in /i, "")} move, in focus.`
    : route ? `From ${route.from} to ${route.to}, with a clearer plan.`
      : page.family === "state" ? `${displayHeading.replace(/^Movers in /i, "").split(":")[0]}: the details behind your move.`
        : page.family === "cost" ? "Make room in your budget for the details."
          : page.family === "question" ? "A useful answer. A better next step." : page.family === "planning" ? "Your next step, thoughtfully planned." : "A clearer picture before you move.";
  const heroDescription = consumerText(seoHeroCopy(page));
  const prefill = JSON.stringify({ entry: quote.entry, ...(quote.originZip ? { originZip: quote.originZip } : {}), ...(quote.destZip ? { destZip: quote.destZip } : {}) });
  return (
    <>
      <JsonLd data={breadcrumbLd(WEB_URL, trail)} />
      <JsonLd data={pageLd(WEB_URL, page, images[0])} />
      <VideoSurveyHero url={page.url} title={displayHeading} description={heroDescription} eyebrow={familyLabel} originExample={quote.originZip} destinationExample={quote.destZip} contextLabel={page.family === "city" || page.family === "state" || page.family === "zip" ? displayHeading.replace(/^Movers in /i, "").split(":")[0] : route ? `${route.from} to ${route.to}` : undefined} breadcrumbs={trail.map((crumb, i) => i === trail.length - 1 ? { label: displayHeading } : crumb)}>
        {route ? <p className="flex flex-wrap items-center gap-3 type-small font-semibold"><span>{route.from}</span><RouteMark size={15} /><span>{route.to}</span></p> : <p className="type-small">{page.family === "city" && cityContext ? cityContext : "Sourced guidance. A move planned on your terms."}</p>}
      </VideoSurveyHero>

      <Container className={styles.reader}>
        <Reveal as="section" aria-label="Your moving guide at a glance" className={styles.lede}>
          <div className={styles.photoComposition}>
            <figure className={styles.photoMain} data-editorial-image={images[0]!.id}>
              <MediaFrame asset={images[0]!} sizes="(min-width: 1024px) 40vw, 100vw" />
              <figcaption className={styles.photoLabel}>Your next chapter</figcaption>
              <span className={styles.photoSymbol}><Icon3D name={familyIcon} size={58} float /></span>
            </figure>
            <div className={styles.photoStrip} aria-label="Moving in focus">
              {images.slice(1, 4).map((image) => <figure key={image.id} className={styles.photoSmall} data-editorial-image={image.id}><MediaFrame asset={image} sizes="(min-width: 1024px) 11vw, 25vw" /></figure>)}
            </div>
          </div>
          <div className={styles.ledeCopy}>
            <p className={styles.kicker}>The details that make a difference</p>
            <h2 className="type-display-l text-text">{introHeading}</h2>
            <p className={styles.introText}><InlineText text={page.content.intro.answer} allow={allow} /></p>
            {heroFacts.length ? <dl className={styles.introFacts}>{heroFacts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}
            {facts.length ? <a href="#facts-and-sources" className="link w-fit type-small">Explore every fact and source →</a> : null}
          </div>
        </Reveal>

        {page.content.sections.length ? <nav aria-label="Guide highlights" className={styles.readingMap}>
          <div className={styles.mapIntro}><p className={styles.kicker}>Make it your move</p><p className="type-h3 text-text">Start with what matters to you.</p></div>
          {page.content.sections.slice(0, 3).map((section, index) => <a href={`#${section.id}`} key={section.id} className={styles.mapCard}>
            <span className={styles.mapGlyph} aria-hidden="true"><LineIcon name={topicIcon(section.heading)} size={34} /></span>
            <span className={styles.mapTitle}><span className={styles.mapNumber}>{String(index + 1).padStart(2, "0")}</span>{section.heading}</span>
          </a>)}
        </nav> : null}

        <GuideContents sections={page.content.sections} hasFacts={facts.length > 0} hasFaq={page.content.faq.length > 0} className={styles.guideContents} />
        <p className={styles.readingMeta}><span><strong className="tabular">{page.evidenceCount}</strong> sourced data points</span><span>Data as of {page.content.dataAsOf}</span></p>

        <div className={styles.bodyGrid}>
          <div className={styles.main}>
            {page.content.sections.map((section, index) => {
              const image = chapterImages[index];
              return <Reveal as="section" key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} delay={(index % 3) * 35} className={`${styles.section} ${index % 3 === 0 ? styles.sectionFeature : ""}`}>
                <header className={styles.sectionHead}>
                  {image ? <figure className={styles.sectionPhoto} data-editorial-image={image.id}><MediaFrame asset={image} sizes="(min-width: 1100px) 55vw, 100vw" /></figure> : <span className={`${styles.sectionPhoto} ${styles.utilityGlyph}`} aria-hidden="true"><LineIcon name={topicIcon(section.heading)} size={38} /></span>}
                  <div className={styles.sectionTitle}><span className={styles.sectionNo}>Field notes / {String(index + 1).padStart(2, "0")}</span><h2 id={`${section.id}-h`}>{section.heading}</h2></div>
                </header>
                <div className={`prose max-w-none ${styles.sectionBody} ${section.blocks.every(block => block.type === "paragraph") && section.blocks.reduce((length, block) => length + (block.type === "paragraph" ? block.text.length : 0), 0) > 220 ? styles.narrativeColumns : ""}`}>
                  {section.blocks.map((block, i) => <Block key={i} id={`${tablePrefix}-s${index + 1}-b${i + 1}`} tableLabel={`${consumerText(section.heading)}: table ${index + 1}.${i + 1}`} block={block} allow={allow} />)}
                </div>
              </Reveal>;
            })}

            {facts.length ? <Reveal as="section" id="facts-and-sources" aria-labelledby="facts-and-sources-heading" className={styles.factSection}>
              <div className="grid gap-2"><p className={styles.kicker}>The whole picture</p><h2 id="facts-and-sources-heading" className="type-display-l text-text">Facts and sources</h2><p className="type-small text-text-2">The complete figures and their sources, as of {page.content.dataAsOf}. Planning assumptions are identified below.</p></div>
              <dl className={styles.factGrid}>{facts.map((fact, i) => <div key={`${fact.label}-${i}`} className={styles.factCard}>
                <dt>{fact.label}</dt><dd><span className={`${styles.factThumb} ${styles.utilityGlyph}`} aria-hidden="true"><LineIcon name={topicIcon(fact.label)} size={27} /></span><span className={styles.factValue}>{fact.value}</span><span className={styles.factBasis}><InlineText text={fact.basis} allow={allow} /></span></dd>
              </div>)}</dl>
            </Reveal> : null}

            {page.content.faq.length ? <Reveal as="section" id="faq" aria-labelledby="faq-h" className="grid min-w-0 gap-6 scroll-mt-24">
              <SectionHeader id="faq-h" overline="Good questions. Clear answers." title="Questions about this page" />
              <div className={styles.faqLayout}>
                <figure className={styles.faqVisual} data-editorial-image={faqImage!.id}><MediaFrame asset={faqImage!} sizes="(min-width: 1024px) 20vw, 100vw" /><figcaption className={styles.faqCaption}>A little clarity goes a long way.</figcaption></figure>
                <div className={`${styles.faqCards} ${page.content.faq.every(item => item.question.length <= 88) ? styles.faqCardsCompact : ""}`}>{page.content.faq.map((item) => <ExpandableCard key={item.question} title={item.question} name="seo-faq"><p><InlineText text={item.answer} allow={allow} /></p></ExpandableCard>)}</div>
              </div>
            </Reveal> : null}

            <Reveal as="section" aria-labelledby="quote-heading" className={styles.quoteBand}>
              <figure className={styles.quotePhoto} data-editorial-image={images[4]!.id}><MediaFrame asset={images[4]!} sizes="(min-width: 1024px) 30vw, 100vw" /></figure>
              <div className={styles.quoteCopy}><p className="type-overline">The next step is yours</p><h2 id="quote-heading">{quote.heading}</h2><p>{quote.text}</p><div><QuoteEntryButton originZip={quote.originZip} destZip={quote.destZip} label={quote.cta} /></div><p className="flex items-start gap-2"><IdCardIcon size={18} />Movers only. You choose how many can contact you. Companies introduce themselves when they contact you.</p></div>
            </Reveal>

            <footer id="sources-and-methodology" className={styles.sources}>
              <h2 className="type-h3 text-text">Sources and editorial notes</h2>
              <p className={styles.kicker}>Made to be checked</p>
              <p>Data as of {page.content.dataAsOf}. Last updated {page.updatedAt.toISOString().slice(0, 10)}.{page.reviewedBy && page.lastReviewedAt ? ` Reviewed by ${page.reviewedBy} on ${page.lastReviewedAt.toISOString().slice(0, 10)}.` : ""}</p>
              {page.sources.length ? <ul className={styles.sourceList}>{page.sources.map((source, i) => <li key={`${source.url}-${i}`}><a href={source.url} className="link" rel="noopener">{source.label}</a><span>Read {source.accessedOn}</span></li>)}</ul> : null}
              {page.content.credits.map((credit) => <p key={credit}>{credit}</p>)}
              <p>Images and video are AI-generated editorial illustrations. They illustrate moving situations and do not identify a specific city, customer or moving company.</p>
              {media && creditLine(media) ? <p>{creditLine(media)}</p> : null}
            </footer>
          </div>

        </div>
      </Container>

      {related.length ? <section aria-label="Related pages" className={styles.relatedBand}><Container className="grid gap-8 section-pad">
        <Reveal><SectionHeader overline="There is more to your move" title="Keep the plan moving." /></Reveal>
        <nav aria-label="Related pages" className={styles.relatedGrid}>{related.map((group, index) => <Reveal key={group.heading} delay={index * 40} className={styles.relatedCard}>
          <figure className={styles.relatedPhoto} data-editorial-image={relatedImages.get(group.heading)!.id}><MediaFrame asset={relatedImages.get(group.heading)!} alt="" sizes="(min-width: 1024px) 22vw, (min-width: 520px) 45vw, 100vw" /></figure>
          <div className={styles.relatedCopy}><h2 className="type-overline text-text-2">{group.heading}</h2><ul>{group.links.slice(0, 3).map((link) => <li key={`${link.href}-${link.relation}`}><Link href={link.href} className="link">{link.label}</Link></li>)}</ul>
            {group.links.length > 3 ? <details className={styles.relatedMore}><summary>View all {group.links.length} pages</summary><ul>{group.links.slice(3).map((link) => <li key={`${link.href}-${link.relation}`}><Link href={link.href} className="link">{link.label}</Link></li>)}</ul></details> : null}
          </div>
        </Reveal>)}</nav>
      </Container></section> : null}
      <StickyCta href="/get-quotes/" label={quote.cta} watch="hero-survey" note="Movers only · No brokers" storage={{ key: PREFILL_STORAGE_KEY, value: prefill }} />
    </>
  );
}
