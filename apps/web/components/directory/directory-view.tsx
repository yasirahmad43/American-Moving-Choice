import { Breadcrumbs, Button, Container, EmptyState, ExpandableCard, IdCardIcon, LinkButton, PageHero, Pagination, Reveal, StatTile, StickyCta } from "@amc/ui";
import { DIRECTORY_PAGE_SIZE, type DirectoryPage, type DirectorySort } from "@amc/server/profiles";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { mediaFor } from "@/lib/media";
import { CompanyCard } from "./company-card";
import { StoredText, badgeName, token } from "./content";
import { JsonLd, absoluteUrl, breadcrumbJsonLd } from "./seo";

export const DIRECTORY_PATH = "/directory/";

const SORT_LABELS: Record<DirectorySort, string> = {
  name: "Name (A to Z)",
  quote_rating: "Quote and sales rating",
  move_rating: "Moving-experience rating",
};

/** The page URL for a directory page and sort; page 1 is the base URL. */
export function directoryHref(page: number, sort: DirectorySort): string {
  const path = page <= 1 ? DIRECTORY_PATH : `${DIRECTORY_PATH}page/${page}/`;
  return sort === "name" ? path : `${path}?sort=${sort}`;
}

export function directoryTitle(page: number): string {
  const name = "Mover directory";
  return page > 1 ? `${name}, page ${page}` : name;
}

/** Directory list page (VD §13.5; site architecture §1.2 directory row). */
export function DirectoryView({ data }: { data: DirectoryPage }) {
  const { listings, page, totalPages, total, sort, rankMinReviews } = data;
  const directoryName = token("directory.name") ?? "Mover directory";
  const first = (page - 1) * DIRECTORY_PAGE_SIZE + 1;
  const last = first + listings.length - 1;
  const art = mediaFor(DIRECTORY_PATH, "hero");
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Mover directory", path: DIRECTORY_PATH },
            ...(page > 1 ? [{ name: `Page ${page}`, path: directoryHref(page, "name") }] : []),
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: directoryTitle(page),
            url: absoluteUrl(directoryHref(page, "name")),
            mainEntity: {
              "@type": "ItemList",
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              numberOfItems: listings.length,
              itemListElement: listings.map((l, index) => ({
                "@type": "ListItem",
                position: first + index,
                item: { "@type": "MovingCompany", "@id": `${absoluteUrl(`/companies/${l.slug}/`)}#company`, name: l.displayName, url: absoluteUrl(`/companies/${l.slug}/`) },
              })),
            },
          },
        ]}
      />

      <PageHero
        media={<MediaFrame asset={art} priority sizes="(min-width: 1024px) 50vw, 100vw" />}
        breadcrumbs={<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mover directory", href: page > 1 ? DIRECTORY_PATH : undefined }, ...(page > 1 ? [{ label: `Page ${page}` }] : [])]} />}
        overline={directoryName}
        title={page > 1 ? `Moving companies in our network, page ${page}` : "Moving companies in our network"}
        lede="Every company listed here is a moving carrier that passed our screening. Each card shows what we checked and when, and the company's customer reviews, kept separate from the badge."
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatTile tone="navy" value={total.toLocaleString("en-US")} label={total === 1 ? "mover listed" : "movers listed"} note="Screened carriers, no brokers" />
            <StatTile tone="navy" value="Weekly" label="federal rechecks" note="Dated on every card" />
          </div>
        }
      />

      <Container className="grid gap-10 section-pad lg:grid-cols-[minmax(0,1fr)_minmax(16rem,19rem)] lg:gap-12">
        <section aria-labelledby="directory-list-heading" className="grid min-w-0 gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-e1 sm:p-5">
            <div className="grid gap-1">
              <h2 id="directory-list-heading" className="type-h3 text-text">
                Movers in our network
              </h2>
              <p className="type-small text-text-2" aria-live="polite">
                {total ? (
                  <>
                    Showing <span className="tabular">{first}</span> to <span className="tabular">{last}</span> of <span className="tabular">{total}</span> · Sorted by{" "}
                    {SORT_LABELS[sort].toLowerCase()}
                  </>
                ) : (
                  "No movers are listed right now."
                )}
              </p>
            </div>
            <form method="get" action={DIRECTORY_PATH} className="flex flex-wrap items-end gap-2">
              <div className="grid gap-1.5">
                <label htmlFor="directory-sort" className="text-[0.9375rem] font-semibold text-text">
                  Sort by
                </label>
                <select
                  id="directory-sort"
                  name="sort"
                  defaultValue={sort}
                  className="block min-h-12 rounded-control border-[1.5px] border-border-strong bg-surface px-3.5 py-2.5 text-[1.0625rem] text-text"
                >
                  {(Object.keys(SORT_LABELS) as DirectorySort[]).map((value) => (
                    <option key={value} value={value}>
                      {SORT_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="secondary">
                Sort
              </Button>
            </form>
          </div>

          {/* ST-3 sits inside the list block, so a quoted list keeps it (implications §3.4). */}
          <p className="max-w-[75ch] border-l-4 border-brand-red pl-4 type-small text-text-2">
            <StoredText id="ST-3" links={{ "How this list is ordered": { href: "#how-this-list-is-ordered" } }} />
          </p>

          {listings.length ? (
            <ul className="grid gap-5 md:grid-cols-2">
              {listings.map((listing) => (
                <CompanyCard key={listing.companyId} listing={listing} />
              ))}
            </ul>
          ) : (
            <EmptyState
              showMark
              title="No movers are listed right now"
              description="You can still send a quote request: we'll tell you before you share any contact details whether any mover in our network covers your move."
              action={
                <LinkButton href="/get-quotes/" variant="cta">
                  Start a quote request
                </LinkButton>
              }
            />
          )}

          <Pagination page={page} totalPages={totalPages} hrefForPage={(p) => directoryHref(p, sort)} label="Directory pages" />
        </section>

        <aside aria-label="About this directory" className="grid content-start gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-card border border-border bg-surface-2 p-5">
            <p className="flex items-center gap-2 type-overline text-text-2">
              <IdCardIcon size={16} /> Movers only
            </p>
            <p className="mt-3 text-text">
              <StoredText id="ST-2" links={{ "How we verify movers": { href: "/how-we-verify-movers/" } }} />
            </p>
          </div>
          <ExpandableCard title={`What ${badgeName()} means`} titleAs="h2" name="directory-aside">
            <p>
              <strong>{badgeName()}</strong> is a screening status that every approved mover gets. It is never sold, and buying more requests never earns
              or keeps it. Each card&apos;s &ldquo;What this badge means&rdquo; panel gives that mover&apos;s screening date.{" "}
              <Link href="/how-we-verify-movers/#badge" className="link">
                What the badge means
              </Link>
            </p>
          </ExpandableCard>
          <ExpandableCard title="How this list is ordered" titleAs="h2" name="directory-aside">
            <div id="how-this-list-is-ordered" className="grid gap-3">
              <p>
                By default, movers are listed alphabetically by name. You can sort by either customer rating instead. A rating sort puts first the
                movers with at least <span className="tabular">{rankMinReviews}</span> eligible reviews of that experience, highest average first (ties
                by name); every other mover follows alphabetically. Until a mover has <span className="tabular">{rankMinReviews}</span> eligible reviews
                of an experience, sorting by that rating gives it no priority.
              </p>
              <p>
                We never sort by review count, and no money input exists to sort by: purchases, balances, budgets and plans play no part in whether or
                where a mover appears. There are no sponsored places in this list.{" "}
                <Link href="/review-methodology/#minimum-sample" className="link">
                  Minimum sample before any ranking
                </Link>
              </p>
            </div>
          </ExpandableCard>
          <div className="rounded-card mesh-navy p-5 text-on-band" data-band="">
            <p className="type-h4">Not sure who covers your route?</p>
            <p className="mt-1 text-on-band-2">Start a request and we show you which movers serve it before you share any contact details.</p>
            <Link href="/get-quotes/" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-white px-4 font-semibold text-brand-navy no-underline hover:bg-on-band-2">
              See which movers cover your move
            </Link>
          </div>
        </aside>
      </Container>
      <StickyCta href="/get-quotes/" label="Get quotes" watch="directory-list-heading" note="See who covers your route" />
    </>
  );
}
