/**
 * A Markdown content page (build plan §8): editorial header, an "On this page" rail built from
 * the rendered headings, the sanitized body and its JSON-LD. Reviewer-only pieces (draft banner,
 * legend, notes) appear only in review builds with ?review=1 (lib/review-mode.ts).
 */
import { env } from "@amc/server/env";
import { Container, LinkButton } from "@amc/ui";
import type { NoteKind } from "@/lib/content/markdown";
import type { ContentPage } from "@/lib/content/pages";
import { MediaFrame } from "@/components/media/media-frame";
import { optionalMedia } from "@/lib/media";
import { DraftBanner } from "./draft-banner";
import { JsonLd, breadcrumbListLd, webPageLd } from "./json-ld";
import { EditorialHeader } from "./page-frame";
import { ReviewLegend } from "./review-notes";

/** The page's level-2 headings (id and text) for the "On this page" rail. */
export function headingsOf(html: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const match of html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
    const text = match[2]!
      .replace(/<a class="heading-anchor"[\s\S]*?<\/a>/, "")
      .replace(/<mark[\s\S]*?<\/mark>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
    if (text) out.push({ id: match[1]!, text });
  }
  return out;
}

function formatUpdated(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function ContentPageView({ page }: { page: ContentPage }) {
  const { WEB_URL } = env();
  const schema = page.meta.schema;
  const kinds = (Object.entries(page.stats.notes) as [NoteKind, number][]).filter(([, count]) => count > 0).map(([kind]) => kind);
  const hasData = page.meta.data_owner !== null && page.meta.data_owner !== "n/a";
  const headings = headingsOf(page.html);
  const updated = formatUpdated(page.meta.last_updated);
  // A 4:3 still from the page's family (trust, costs), claimed once per page; none if the family has no spare.
  const family = page.meta.family.toLowerCase().includes("cost") ? "costs" : "trust";
  const still = optionalMedia(page.meta.url, [family, "standard"]);
  return (
    <>
      {schema.includes("BreadcrumbList") ? <JsonLd data={breadcrumbListLd(WEB_URL, page.breadcrumbs)} /> : null}
      {schema.includes("Article") ? <JsonLd data={webPageLd(WEB_URL, { url: page.meta.url, name: page.h1, description: page.description, type: "Article" })} /> : null}
      {schema.includes("WebPage") ? <JsonLd data={webPageLd(WEB_URL, { url: page.meta.url, name: page.h1, description: page.description })} /> : null}
      <EditorialHeader breadcrumbs={page.breadcrumbs} overline={page.meta.family} title={page.h1} lede={page.description} meta={updated ? <>Updated {updated}</> : null} />
      <Container className="grid gap-12 pb-20 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] lg:gap-16">
        <div className="grid min-w-0 gap-6">
          <div className="grid max-w-[72ch] gap-3 empty:hidden">
            <DraftBanner
              status={page.meta.status}
              author={page.author}
              reviewer={page.reviewer}
              dataOwner={page.dataOwner}
              showDataOwner={hasData}
              aiDrafted={page.meta.ai_assisted && page.meta.ai_role !== "none"}
            />
            {kinds.length ? <ReviewLegend kinds={kinds} /> : null}
          </div>
          <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
        </div>
        <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
          {still ? (
            <figure className="zoom-media relative aspect-[4/3] overflow-hidden rounded-card ring-1 ring-border">
              <MediaFrame asset={still} sizes="(min-width: 1024px) 18rem, 100vw" />
            </figure>
          ) : null}
          {headings.length ? (
            <nav aria-label="On this page" className="rounded-card border border-border bg-surface p-5 shadow-e1">
              <p className="type-overline text-text-3">On this page</p>
              <ul className="mt-3 grid gap-0.5 border-l border-border">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 type-small font-semibold text-text-2 no-underline transition-colors duration-[var(--d1)] hover:border-brand-navy hover:text-text"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <div className="rounded-card mesh-navy p-5 text-on-band" data-band="">
            <p className="type-h4">Ready to compare movers?</p>
            <p className="mt-1 text-on-band-2">Check coverage for your route, then choose how many movers may contact you.</p>
            <LinkButton href="/get-quotes/" variant="primary" size="sm" className="mt-4 !bg-white !text-brand-navy hover:!bg-on-band-2">
              Start a quote request
            </LinkButton>
          </div>
        </aside>
      </Container>
    </>
  );
}
