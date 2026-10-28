/**
 * Frame for public pages written in TSX (about, legal, help and B2B pages): breadcrumbs, H1, lede,
 * the draft banner, the review-note legend and JSON-LD for the breadcrumb trail and the page.
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
  children: ReactNode;
}

export function PageFrame({ url, h1, description, trail, lede, overline, legend = true, waitingOn, children }: PageFrameProps) {
  const { WEB_URL } = env();
  const crumbs = [{ label: "Home", href: "/" }, ...trail];
  return (
    <>
      <JsonLd data={breadcrumbListLd(WEB_URL, crumbs)} />
      <JsonLd data={webPageLd(WEB_URL, { url, name: h1, description })} />
      <Container className="grid gap-6 pb-16 pt-8 sm:pt-10">
        <Breadcrumbs items={crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { label: crumb.label } : crumb))} />
        <header className="grid max-w-[68ch] gap-3">
          {overline ? <p className="type-overline text-text-2">{overline}</p> : null}
          <h1 className="type-display-l text-text">{h1}</h1>
          {lede ? <div className="type-lede text-text-2">{lede}</div> : null}
        </header>
        <div className="grid max-w-[72ch] gap-3">
          <DraftBanner status="draft-v0" author={null} reviewer={null} waitingOn={waitingOn} />
          {legend ? <ReviewLegend /> : null}
        </div>
        <div className="prose">{children}</div>
      </Container>
    </>
  );
}
