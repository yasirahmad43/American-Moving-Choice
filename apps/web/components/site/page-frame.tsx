/**
 * Frame for public pages written in TSX (about, legal, help and B2B pages): a light editorial
 * header with breadcrumbs, overline, H1 and lede, then the reading column. Reviewer-only pieces
 * (draft banner, legend) render only in review builds (lib/review-mode.ts).
 */
import { env } from "@amc/server/env";
import { Container } from "@amc/ui";
import type { ReactNode } from "react";
import { mediaManifest } from "@/lib/media";
import { storyMediaPlan } from "@/lib/content/story-plan";
import { VideoSurveyHero } from "./video-survey-hero";
import { CarrierEligibilityStart } from "./carrier-eligibility-start";
import { reactChapters, StoryNextSteps, StorySections } from "./story-sections";
import { DraftBanner } from "./draft-banner";
import { JsonLd, breadcrumbListLd, webPageLd } from "./json-ld";
import { ReviewLegend } from "./review-notes";

export interface PageFrameProps {
  url: string;
  h1: string;
  /** Plain-text description for JSON-LD (the same as the meta description). */
  description: string;
  /** Trail after Home, ending with the page itself. */
  trail: { label: string; href: string }[];
  lede?: ReactNode;
  overline?: string;
  /** Set false on pages without review notes. */
  legend?: boolean;
  waitingOn?: string;
  /** Optional right rail (related links, a call to action). */
  aside?: ReactNode;
  children: ReactNode;
}

export function PageFrame({ url, h1, description, trail, lede, overline, legend = true, waitingOn, aside, children }: PageFrameProps) {
  const { WEB_URL } = env();
  const crumbs = [{ label: "Home", href: "/" }, ...trail];
  const chapters = reactChapters(children);
  const media = storyMediaPlan(mediaManifest(), url, chapters, h1);
  return (
    <>
      <JsonLd data={breadcrumbListLd(WEB_URL, crumbs)} />
      <JsonLd data={webPageLd(WEB_URL, { url, name: h1, description })} />
      <EditorialHeader breadcrumbs={crumbs} overline={overline} title={h1} lede={lede} />
      <Container className="pb-16">
        <div className="grid min-w-0 gap-6">
          <div className="grid max-w-[72ch] gap-3 empty:hidden">
            <DraftBanner status="draft-v0" author={null} reviewer={null} waitingOn={waitingOn} />
            {legend ? <ReviewLegend /> : null}
          </div>
          {aside ? <aside className="grid gap-4 rounded-2xl border border-border bg-surface-2 p-5 lg:grid-cols-2">{aside}</aside> : null}
          <StorySections chapters={chapters} images={media.chapterImages} planned />
          <StoryNextSteps items={media.steps} />
        </div>
      </Container>
    </>
  );
}

/** The light editorial page header shared by TSX and Markdown content pages. */
export function EditorialHeader({
  breadcrumbs,
  overline,
  title,
  lede,
  meta,
}: {
  breadcrumbs: { label: string; href: string }[];
  overline?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  meta?: ReactNode;
}) {
  const url = breadcrumbs[breadcrumbs.length - 1]?.href ?? "/";
  const carrier = url.startsWith("/for-movers/") || url === "/mover-terms/";
  return <VideoSurveyHero url={url} title={title} description={lede} eyebrow={overline} breadcrumbs={breadcrumbs}
    survey={carrier ? <CarrierEligibilityStart appUrl={env().APP_URL} /> : undefined}
    surveyLabel={carrier ? "Check carrier eligibility" : undefined} mobileActionLabel={carrier ? "Check eligibility" : undefined}>{meta}</VideoSurveyHero>;
}
