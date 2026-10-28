/**
 * Full-bleed media hero (Editorial Split, VD §13.1): the media layer fills the band, a navy wash
 * keeps white text at AAA, the message sits left and an overlay panel (the quote form) right.
 * Pass 2: the title reveals line by line (CSS .split-line, no JavaScript on the LCP path), the
 * lede and actions rise after it, the media and the panel scroll at different speeds
 * (data-parallax, driven by the MotionProvider) and a film grain sits over the wash.
 * The media element is passed in by the app (next/image or a lazy video), so the hero itself has
 * no opinion about where assets come from.
 */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { SplitLines } from "./scroll-progress";

export interface MediaHeroProps {
  /** The background media: an image or video element sized to cover. */
  media: ReactNode;
  overline?: ReactNode;
  /** A string reveals line by line; "\n" marks the line breaks. */
  title: ReactNode;
  titleAs?: "h1" | "h2";
  lede?: ReactNode;
  /** Buttons or links under the lede. */
  actions?: ReactNode;
  /** The floating panel, e.g. the quote form. */
  panel?: ReactNode;
  /** Anchors the panel for the sticky CTA observer. */
  panelId?: string;
  /** Short, factual line under the panel or the title. */
  footnote?: ReactNode;
  /** "split" keeps message left and panel right; "stack" centers the message with the panel below. */
  layout?: "split" | "stack";
  /** Minimum height on desktop. */
  minHeight?: string;
  className?: string;
}

const rise = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

export function MediaHero({ media, overline, title, titleAs: Heading = "h1", lede, actions, panel, panelId, footnote, layout = "split", minHeight = "min(42rem, 82dvh)", className }: MediaHeroProps) {
  return (
    <section data-band="" className={cx("relative isolate overflow-hidden bg-band text-on-band grain", className)} aria-label={typeof title === "string" ? title.replace(/\n/g, " ") : undefined}>
      <div className="absolute inset-0 z-0 [&_[data-video-control]]:bottom-5 [&_[data-video-control]]:left-5 [&_[data-video-control]]:right-auto [&_[data-video-control]]:top-auto sm:[&_[data-video-control]]:left-6 lg:[&_[data-video-control]]:left-8">
        <div className="absolute inset-0">
          {media}
        </div>
        {/* Navy wash: left to right so the message column stays readable over any photo. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(4,37,79,0.9)_0%,rgba(6,49,103,0.62)_45%,rgba(6,49,103,0.26)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(4,37,79,0.8),transparent)]" />
      </div>
      <div
        className={cx(
          "pointer-events-none relative z-10 mx-auto grid w-full max-w-content gap-10 gutter pb-24 pt-14 sm:pt-20 lg:gap-14 lg:py-24",
          layout === "split" ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-center" : "justify-items-center text-center",
        )}
        style={{ minHeight }}
      >
        <div className={cx("pointer-events-auto grid max-w-[42rem] gap-6", layout === "stack" && "justify-items-center")}>
          {overline ? (
            <p className="hero-rise flex items-center gap-3 type-overline text-on-band-2" style={rise(60)}>
              <span aria-hidden="true" className="h-px w-8 bg-[#ff5a5f]" />
              {overline}
            </p>
          ) : null}
          <Heading className="type-display-xl text-on-band [text-shadow:0_2px_24px_rgba(4,37,79,0.5)]">{typeof title === "string" ? <SplitLines text={title} /> : title}</Heading>
          {lede ? (
            <p className="hero-rise type-lede max-w-[54ch] text-on-band-2" style={rise(520)}>
              {lede}
            </p>
          ) : null}
          {actions ? (
            <div className="hero-rise flex flex-wrap items-center gap-3 pt-1" style={rise(680)}>
              {actions}
            </div>
          ) : null}
          {footnote && !panel ? <p className="type-small text-on-band-2">{footnote}</p> : null}
        </div>
        {panel ? (
          <div id={panelId} className="hero-rise pointer-events-auto w-full lg:justify-self-end" style={rise(360)}>
            <div className="bezel depth-3">
              <div className="bezel-inner p-5 text-text sm:p-7">{panel}</div>
            </div>
            {footnote ? <p className="mt-4 type-small text-on-band-2">{footnote}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Inner-page hero: a navy band with ambient media on the right, breadcrumbs, an overline, the H1
 * and a lede. Keeps the page's one H1 inside the band. Pass 2: drifting mesh orbs and grain.
 */
export function PageHero({
  media,
  breadcrumbs,
  overline,
  title,
  lede,
  actions,
  aside,
  className,
}: {
  media?: ReactNode;
  breadcrumbs?: ReactNode;
  overline?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section data-band="" className={cx("relative isolate overflow-hidden mesh-navy mesh-drift text-on-band grain", className)}>
      {media ? (
        <div className="absolute inset-0 z-0 [&_[data-video-control]]:bottom-5 [&_[data-video-control]]:left-5 [&_[data-video-control]]:right-auto [&_[data-video-control]]:top-auto sm:[&_[data-video-control]]:left-6 lg:[&_[data-video-control]]:left-8">
          <div className="absolute inset-0">
            {media}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,37,79,0.96)_0%,rgba(6,49,103,0.85)_45%,rgba(6,49,103,0.5)_100%)]" />
        </div>
      ) : null}
      <div className={cx("pointer-events-none relative z-10 mx-auto grid w-full max-w-content gap-8 gutter pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:pt-20", media ? "pb-24" : "pb-12 sm:pb-16 lg:pb-20")}>
        <div className="pointer-events-auto grid max-w-[44rem] gap-4">
          {breadcrumbs ? <div className="[&_a]:text-on-band-2 [&_ol]:text-on-band-2 [&_span[aria-current]]:text-on-band">{breadcrumbs}</div> : null}
          {overline ? (
            <p className="hero-rise flex items-center gap-3 type-overline text-on-band-2" style={rise(60)}>
              <span aria-hidden="true" className="h-px w-8 bg-[#ff5a5f]" />
              {overline}
            </p>
          ) : null}
          <h1 className="type-display-xl text-on-band">{typeof title === "string" ? <SplitLines text={title} /> : title}</h1>
          {lede ? (
            <p className="hero-rise type-lede max-w-[56ch] text-on-band-2" style={rise(480)}>
              {lede}
            </p>
          ) : null}
          {actions ? (
            <div className="hero-rise flex flex-wrap items-center gap-3 pt-2" style={rise(620)}>
              {actions}
            </div>
          ) : null}
        </div>
        {aside ? (
          <div className="hero-rise pointer-events-auto min-w-0 lg:justify-self-end" style={rise(420)}>
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
