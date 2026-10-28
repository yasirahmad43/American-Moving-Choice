/**
 * Frame for public pages written in TSX (about, legal, help and B2B pages): a light editorial
 * header with breadcrumbs, overline, H1 and lede, then the reading column. Reviewer-only pieces
 * (draft banner, legend) render only in review builds (lib/review-mode.ts).
 */
import { env } from "@amc/server/env";
import { Breadcrumbs, Container } from "@amc/ui";
import type { ReactNode } from "react";
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
  return (
    <>
      <JsonLd data={breadcrumbListLd(WEB_URL, crumbs)} />
      <JsonLd data={webPageLd(WEB_URL, { url, name: h1, description })} />
      <EditorialHeader breadcrumbs={crumbs} overline={overline} title={h1} lede={lede} />
      <Container className={aside ? "grid gap-12 pb-20 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,19rem)] lg:gap-16" : "grid gap-6 pb-20 pt-10"}>
        <div className="grid min-w-0 gap-6">
          <div className="grid max-w-[72ch] gap-3 empty:hidden">
            <DraftBanner status="draft-v0" author={null} reviewer={null} waitingOn={waitingOn} />
            {legend ? <ReviewLegend /> : null}
          </div>
          <div className="prose">{children}</div>
        </div>
        {aside ? <aside className="grid content-start gap-4 lg:sticky lg:top-6 lg:self-start">{aside}</aside> : null}
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
  return (
    <div className="mesh-light border-b border-border">
      <Container className="grid gap-5 py-10 sm:py-14">
        <Breadcrumbs items={breadcrumbs.map((crumb, index) => (index === breadcrumbs.length - 1 ? { label: crumb.label } : crumb))} />
        <header className="grid max-w-[56rem] gap-4">
          {overline ? (
            <p className="flex items-center gap-3 type-overline text-text-2">
              <span aria-hidden="true" className="h-px w-8 bg-brand-red" />
              {overline}
            </p>
          ) : null}
          <h1 className="type-display-xl text-text">{title}</h1>
          {lede ? <div className="type-lede max-w-[60ch] text-text-2">{lede}</div> : null}
          {meta ? <div className="type-small text-text-3">{meta}</div> : null}
        </header>
      </Container>
    </div>
  );
}
