/**
 * A Markdown content page (build plan §8): breadcrumbs, H1, draft banner with author and reviewer,
 * the review-note legend, the sanitized body and its JSON-LD.
 */
import { env } from "@amc/server/env";
import { Breadcrumbs, Container } from "@amc/ui";
import type { NoteKind } from "@/lib/content/markdown";
import type { ContentPage } from "@/lib/content/pages";
import { DraftBanner } from "./draft-banner";
import { JsonLd, breadcrumbListLd, webPageLd } from "./json-ld";
import { ReviewLegend } from "./review-notes";

export function ContentPageView({ page }: { page: ContentPage }) {
  const { WEB_URL } = env();
  const schema = page.meta.schema;
  const kinds = (Object.entries(page.stats.notes) as [NoteKind, number][]).filter(([, count]) => count > 0).map(([kind]) => kind);
  const hasData = page.meta.data_owner !== null && page.meta.data_owner !== "n/a";
  return (
    <>
      {schema.includes("BreadcrumbList") ? <JsonLd data={breadcrumbListLd(WEB_URL, page.breadcrumbs)} /> : null}
      {schema.includes("Article") ? <JsonLd data={webPageLd(WEB_URL, { url: page.meta.url, name: page.h1, description: page.description, type: "Article" })} /> : null}
      {schema.includes("WebPage") ? <JsonLd data={webPageLd(WEB_URL, { url: page.meta.url, name: page.h1, description: page.description })} /> : null}
      <Container className="grid gap-6 pb-16 pt-8 sm:pt-10">
        <Breadcrumbs items={page.breadcrumbs.map((crumb, index) => (index === page.breadcrumbs.length - 1 ? { label: crumb.label } : crumb))} />
        <header className="grid max-w-[68ch] gap-3">
          <p className="type-overline text-text-2">{page.meta.family}</p>
          <h1 className="type-display-l text-text">{page.h1}</h1>
        </header>
        <div className="grid max-w-[72ch] gap-3">
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
      </Container>
    </>
  );
}
