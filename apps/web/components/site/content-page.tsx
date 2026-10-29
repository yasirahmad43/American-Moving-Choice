/**
 * A Markdown content page (build plan §8): editorial header, an "On this page" rail built from
 * the rendered headings, the sanitized body and its JSON-LD. Reviewer-only pieces (draft banner,
 * legend, notes) appear only in review builds with ?review=1 (lib/review-mode.ts).
 */
import { env } from "@amc/server/env";
import { Container, LinkButton } from "@amc/ui";
import type { NoteKind } from "@/lib/content/markdown";
import type { ContentPage } from "@/lib/content/pages";
import { mediaManifest } from "@/lib/media";
import { guideOverview, storyMediaPlan } from "@/lib/content/story-plan";
import { DraftBanner } from "./draft-banner";
import { JsonLd, breadcrumbListLd, webPageLd } from "./json-ld";
import { EditorialHeader } from "./page-frame";
import { ReviewLegend } from "./review-notes";
import { htmlChapters, separateEditorialNotes, StoryNextSteps, StorySections } from "./story-sections";

/** The page's level-2 headings (id and text) for the "On this page" rail. */
export function headingsOf(html: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const match of html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
    const text = match[2]!
      .replace(/<a\b[^>]*class="[^"]*heading-anchor[^"]*"[\s\S]*?<\/a>/gi, "")
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
  const modified = page.meta.last_updated && !Number.isNaN(Date.parse(page.meta.last_updated)) ? new Date(page.meta.last_updated).toISOString() : undefined;
  const editorial = separateEditorialNotes(page.html);
  const overview = guideOverview(editorial.body);
  const chapters = htmlChapters(overview.body);
  const media = storyMediaPlan(mediaManifest(), page.meta.url, chapters, page.h1);
  const articleImage = media.chapterImages.find((image) => image !== null) ?? media.steps[0]?.image;
  return (
    <>
      {schema.includes("BreadcrumbList") ? <JsonLd data={breadcrumbListLd(WEB_URL, page.breadcrumbs)} /> : null}
      {schema.includes("Article") ? <JsonLd data={{ ...webPageLd(WEB_URL, { url: page.meta.url, name: page.h1, description: page.description, type: "Article", image: articleImage }), ...(modified ? { dateModified: modified } : {}) }} /> : null}
      {schema.includes("WebPage") ? <JsonLd data={{ ...webPageLd(WEB_URL, { url: page.meta.url, name: page.h1, description: page.description }), ...(modified ? { dateModified: modified } : {}) }} /> : null}
      <EditorialHeader breadcrumbs={page.breadcrumbs} overline={page.meta.family} title={page.h1} lede={page.description} meta={updated ? <>Updated {updated}</> : null} />
      <Container className="pb-20">
          {overview.answer ? <section className="story-answer" aria-labelledby="guide-answer-title">
            <div className="story-answer-main"><p className="type-overline">A clearer starting point</p><h2 id="guide-answer-title">The short answer.</h2><div className="story-answer-text" dangerouslySetInnerHTML={{ __html: overview.answer }} /><a className="story-answer-jump" href="#guide-contents">Read the full guide <span aria-hidden="true">↓</span></a></div>
            {overview.actions ? <div className="story-answer-actions prose" dangerouslySetInnerHTML={{ __html: overview.actions }} /> : null}
          </section> : null}
          <details className="story-guide-notes">
            <summary>About this guide <span>Editorial details &amp; review notes</span></summary>
            <div className="grid max-w-[72ch] gap-3 pt-3">
            {page.author ? <p>Written by {page.author}.</p> : null}
            {page.reviewer ? <p>Reviewed by {page.reviewer}.</p> : null}
            <p>Data sources, assumptions and availability are explained alongside the guidance. Examples are planning information, not a mover's quote.</p>
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
          </details>
          {headings.length ? (
            <nav id="guide-contents" aria-label="On this page" className="story-index" data-motion="rise">
              <div><p className="type-overline text-brand-red">Your reading route</p><h2>Inside this guide</h2></div>
              <ul>
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className="story-index-link"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <article><StorySections chapters={chapters} images={media.chapterImages} planned url={page.meta.url} topic={page.h1} /></article>
          <StoryNextSteps items={media.steps} />
          <aside className="story-reader-cta" data-motion="rise" data-band="">
            <div><p className="type-overline">Your move. Your choice.</p><h2>Ready to compare movers?</h2>
            <p>Check coverage for your route, then choose how many movers may contact you.</p></div>
            <LinkButton href="/get-quotes/" variant="primary" size="sm" className="mt-4 !bg-white !text-brand-navy hover:!bg-on-band-2">
              Start a quote request
            </LinkButton>
          </aside>
      </Container>
    </>
  );
}
