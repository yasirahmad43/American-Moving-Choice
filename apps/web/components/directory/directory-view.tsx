import { Button, Container, EmptyState, LinkButton, PageHeader, Pagination } from "@amc/ui";
import { DIRECTORY_PAGE_SIZE, type DirectoryPage, type DirectorySort } from "@amc/server/profiles";
import Link from "next/link";
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
  const directoryName = token("directory.name") ?? "Mover directory (name pending)";
  const first = (page - 1) * DIRECTORY_PAGE_SIZE + 1;
  const last = first + listings.length - 1;
  return (
    <Container className="grid gap-8 section-pad">
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
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Mover directory", href: page > 1 ? DIRECTORY_PATH : undefined }, ...(page > 1 ? [{ label: `Page ${page}` }] : [])]}
        overline={directoryName}
        title={page > 1 ? `Moving companies in our network, page ${page}` : "Moving companies in our network"}
        description={
          <>
            Every company listed here is a moving carrier that passed our screening. Each card shows what we checked and when, and the
            company's customer reviews, kept separate from the badge.
          </>
        }
      />

      <aside aria-label="Movers only" className="max-w-[75ch] rounded-card border border-border bg-surface-2 p-5 text-text">
        <StoredText id="ST-2" links={{ "How we verify movers": { href: "/how-we-verify-movers/" } }} />
      </aside>

      <section aria-labelledby="directory-list-heading" className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-1">
            <h2 id="directory-list-heading" className="type-h3 text-text">
              Movers in our network
            </h2>
            <p className="type-small text-text-2" aria-live="polite">
              {total ? (
                <>
                  Showing <span className="tabular">{first}</span> to <span className="tabular">{last}</span> of{" "}
                  <span className="tabular">{total}</span> · Sorted by {SORT_LABELS[sort].toLowerCase()}
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
        <p className="max-w-[75ch] border-l-4 border-border-strong pl-4 type-small text-text-2">
          <StoredText id="ST-3" links={{ "How this list is ordered": { href: "#how-this-list-is-ordered" } }} />
        </p>

        {listings.length ? (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <CompanyCard key={listing.companyId} listing={listing} />
            ))}
          </ul>
        ) : (
          <EmptyState
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

      <section aria-labelledby="how-this-list-is-ordered" className="grid max-w-[75ch] gap-3">
        <h2 id="how-this-list-is-ordered" className="type-h3 text-text">
          How this list is ordered
        </h2>
        <p className="text-text">
          By default, movers are listed alphabetically by name. You can sort by either customer rating instead. A rating sort puts first
          the movers with at least <span className="tabular">{rankMinReviews}</span> eligible reviews of that experience, highest average
          first (ties by name); every other mover follows alphabetically. Until a mover has{" "}
          <span className="tabular">{rankMinReviews}</span> eligible reviews of an experience, sorting by that rating gives it no priority.
        </p>
        <p className="text-text">
          We never sort by review count, and no money input exists to sort by: purchases, balances, budgets and plans play no part in whether
          or where a mover appears. There are no sponsored places in this list.{" "}
          <Link href="/review-methodology/#minimum-sample" className="link">
            Minimum sample before any ranking
          </Link>
        </p>
      </section>

      <section aria-labelledby="badge-heading" className="grid max-w-[75ch] gap-3">
        <h2 id="badge-heading" className="type-h3 text-text">
          About the badge
        </h2>
        <p className="text-text">
          <strong>{badgeName()}</strong> is a screening status that every approved mover gets. It is never sold, and buying more requests
          never earns or keeps it. Each card's "What this badge means" panel gives that mover's screening date.{" "}
          <Link href="/how-we-verify-movers/#badge" className="link">
            What the badge means
          </Link>
        </p>
      </section>
    </Container>
  );
}
