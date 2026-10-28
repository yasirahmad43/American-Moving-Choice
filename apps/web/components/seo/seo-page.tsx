/**
 * Renders a published programmatic page from its stored content (@amc/server/seo): breadcrumbs,
 * H1, the first-screen answer with its dated data points, the sections, the quote entry, FAQ,
 * related links (published targets only), sources, credits and JSON-LD. Plain but structured:
 * the design pass skins it. Existing components only (packages/ui, components/site).
 */
import { env } from "@amc/server/env";
import { publishedAmong, publishedRelated, type ContentBlock, type SeoPageRecord } from "@amc/server/seo";
import { Breadcrumbs, Container } from "@amc/ui";
import Link from "next/link";
import { JsonLd } from "@/components/site/json-ld";
import { storedTextParts } from "@/lib/stored-texts";
import { mediaById } from "@/lib/media";
import { InlineText } from "./inline-text";
import { QuoteEntryButton } from "./quote-entry";
import { breadcrumbLd, faqLd, moverListLd, pageLd, type Crumb } from "./seo-metadata";

function PaidLine() {
  // ST-3: the paid-relationship line sits inside the list block (site architecture §7.4).
  return (
    <p className="type-small text-text-2">
      {storedTextParts("ST-3").map((part, index) =>
        part.kind === "text" ? (
          <span key={index}>{part.text}</span>
        ) : (
          <Link key={index} href="/directory/" className="link">
            {part.label}
          </Link>
        ),
      )}
    </p>
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
        <p className="rounded-control border border-border bg-surface-2 px-4 py-3 type-small text-text-2">
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
      return (
        <div className="table-wrap" tabIndex={0}>
          <table>
            {block.caption ? <caption className="px-3.5 py-2 text-left type-small text-text-2">{block.caption}</caption> : null}
            <thead>
              <tr>
                {block.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      <InlineText text={cell} allow={allow} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "facts":
      return (
        <ul className="grid gap-3">
          {block.items.map((item, i) => (
            <li key={i} className="rounded-control border border-border bg-surface p-4">
              <p>
                <InlineText text={item.claim} allow={allow} />
              </p>
              <p className="mt-1 type-small text-text-2">
                Source:{" "}
                <a href={item.source.url} className="link" rel="noopener">
                  {item.source.label}
                </a>
                , read {item.source.accessedOn}.
              </p>
            </li>
          ))}
        </ul>
      );
    case "cost": {
      const c = block.block;
      return (
        <section aria-label={`Cost range: ${c.scope}`} className="rounded-card border border-border bg-surface p-4 sm:p-5">
          <h3 className="type-h4 text-text">{c.scope}</h3>
          {c.rows.length ? (
            <>
              <div className="table-wrap mt-3" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Home size</th>
                      <th scope="col">Typical range</th>
                      <th scope="col">Movers' cards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.rows.map((r) => (
                      <tr key={r.homeSize}>
                        <td>{r.homeSize}</td>
                        <td className="tabular">
                          {r.low} to {r.high}
                        </td>
                        <td className="tabular">{r.movers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 type-small text-text-2">
                25th to 75th percentile, {c.modelVersion}, rate cards as of {c.asOf}. A planning range from movers' rate cards, not a quote or estimate: movers set their own prices.
              </p>
            </>
          ) : (
            <p className="mt-2 type-small text-text-2">{c.noData}</p>
          )}
        </section>
      );
    }
    case "movers":
      return (
        <div className="grid gap-3">
          {block.heading ? <h3 className="type-h4 text-text">{block.heading}</h3> : null}
          <ul className="grid gap-2 sm:grid-cols-2">
            {block.items.map((m) => (
              <li key={m.slug} className="rounded-control border border-border bg-surface px-4 py-3">
                <Link href={`/companies/${m.slug}/`} className="link font-semibold">
                  {m.name}
                </Link>
                <p className="type-small text-text-2">
                  {m.basedIn ? `Based in ${m.basedIn}. ` : ""}
                  {m.coverageNote}
                </p>
              </li>
            ))}
          </ul>
          {block.paidLine ? <PaidLine /> : null}
        </div>
      );
  }
}

export async function SeoPageView({ page, crumbs }: { page: SeoPageRecord; crumbs: Crumb[] }) {
  const { WEB_URL } = env();
  const related = await publishedRelated(page);
  // Inline links to unpublished SEO pages render as plain text (no 404s, site architecture §3.3).
  const inlineHrefs = [...new Set((JSON.stringify(page.content).match(/\]\((\/[^)\s]*)\)/g) ?? []).map((m) => m.slice(2, -1)))];
  const live = await publishedAmong(inlineHrefs);
  const allow = (href: string) => live.has(href);
  const movers = page.content.sections.flatMap((s) => s.blocks).flatMap((b) => (b.type === "movers" ? b.items : []));
  const media = page.mediaIds.map(mediaById).find((m) => m && m.kind === "image");
  const faq = faqLd(page);
  const moverList = moverListLd(WEB_URL, movers);
  const trail = [{ label: "Home", href: "/" }, ...crumbs];
  return (
    <>
      <JsonLd data={breadcrumbLd(WEB_URL, trail)} />
      <JsonLd data={pageLd(WEB_URL, page)} />
      {faq ? <JsonLd data={faq} /> : null}
      {moverList ? <JsonLd data={moverList} /> : null}
      <Container className="grid gap-8 pb-16 pt-8 sm:pt-10">
        <div className="grid gap-4">
          <Breadcrumbs items={trail.map((c, i) => (i === trail.length - 1 ? { label: c.label } : c))} />
          <h1 className="type-display-l text-text">{page.h1}</h1>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
            <div className="grid max-w-[68ch] gap-4">
              <p className="type-lede text-text-2">
                <InlineText text={page.content.intro.answer} allow={allow} />
              </p>
              {page.content.intro.dataPoints.length ? (
                <dl className="grid gap-2 sm:grid-cols-2">
                  {page.content.intro.dataPoints.map((d) => (
                    <div key={d.label} className="rounded-control border border-border bg-surface px-4 py-3">
                      <dt className="type-small text-text-2">{d.label}</dt>
                      <dd className="m-0 font-semibold text-text tabular">{d.value}</dd>
                      <dd className="m-0 type-small text-text-3">{d.basis}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
            <aside aria-labelledby="quote-heading" className="grid content-start gap-3 rounded-card border border-border bg-surface p-5 shadow-e1">
              <h2 id="quote-heading" className="type-h4 text-text">
                {page.content.quote.heading}
              </h2>
              <p className="type-small text-text-2">{page.content.quote.text}</p>
              <QuoteEntryButton originZip={page.content.quote.originZip} destZip={page.content.quote.destZip} label={page.content.quote.cta} />
            </aside>
          </div>
          {media ? (
            <figure className="grid gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.src} alt={media.alt} className="w-full rounded-card" loading="eager" fetchPriority="high" />
              {media.credit ? <figcaption className="type-small text-text-3">{media.credit}</figcaption> : null}
            </figure>
          ) : null}
        </div>

        <div className="prose">
          {page.content.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`}>
              <h2 id={`${section.id}-h`}>{section.heading}</h2>
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} allow={allow} />
              ))}
            </section>
          ))}

          {page.content.faq.length ? (
            <section id="faq" aria-labelledby="faq-h">
              <h2 id="faq-h">Questions about this page</h2>
              {page.content.faq.map((item) => (
                <div key={item.question}>
                  <h3>{item.question}</h3>
                  <p>
                    <InlineText text={item.answer} allow={allow} />
                  </p>
                </div>
              ))}
            </section>
          ) : null}
        </div>

        {related.length ? (
          <nav aria-label="Related pages" className="grid gap-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((group) => (
              <div key={group.heading}>
                <h2 className="type-overline text-text-2">{group.heading}</h2>
                <ul className="mt-3 grid gap-1">
                  {group.links.map((link) => (
                    <li key={`${link.href}-${link.relation}`}>
                      <Link href={link.href} className="link inline-flex min-h-11 items-center">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
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
      </Container>
    </>
  );
}
