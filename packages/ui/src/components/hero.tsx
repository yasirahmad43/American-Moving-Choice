/**
 * Full-bleed media hero (Editorial Split, VD §13.1): the media layer fills the band, a navy wash
 * keeps white text at AAA, the message sits left and an overlay panel (the quote form) right.
 * The media element is passed in by the app (next/image or a lazy video), so the hero itself has
 * no opinion about where assets come from.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface MediaHeroProps {
  /** The background media: an image or video element sized to cover. */
  media: ReactNode;
  overline?: ReactNode;
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

export function MediaHero({ media, overline, title, titleAs: Heading = "h1", lede, actions, panel, panelId, footnote, layout = "split", minHeight = "min(42rem, 82dvh)", className }: MediaHeroProps) {
  return (
    <section data-band="" className={cx("relative isolate overflow-hidden bg-band text-on-band", className)} aria-label={typeof title === "string" ? title : undefined}>
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {media}
        {/* Navy wash: left to right so the message column stays readable over any photo. */}
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(4,37,79,0.88)_0%,rgba(6,49,103,0.62)_45%,rgba(6,49,103,0.28)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_top,rgba(4,37,79,0.7),transparent)]" />
      </div>
      <div
        className={cx(
          "mx-auto grid w-full max-w-content gap-10 gutter py-14 sm:py-20 lg:gap-14 lg:py-24",
          layout === "split" ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-center" : "justify-items-center text-center",
        )}
        style={{ minHeight }}
      >
        <div className={cx("grid max-w-[40rem] gap-6", layout === "stack" && "justify-items-center")}>
          {overline ? (
            <p className="flex items-center gap-3 type-overline text-on-band-2">
              <span aria-hidden="true" className="h-px w-8 bg-[#ff5a5f]" />
              {overline}
            </p>
          ) : null}
          <Heading className="type-display-xl text-on-band [text-shadow:0_2px_24px_rgba(4,37,79,0.5)]">{title}</Heading>
          {lede ? <p className="type-lede max-w-[54ch] text-on-band-2">{lede}</p> : null}
          {actions ? <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div> : null}
          {footnote && !panel ? <p className="type-small text-on-band-2">{footnote}</p> : null}
        </div>
        {panel ? (
          <div id={panelId} className="w-full lg:justify-self-end">
            <div className="bezel">
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
 * and a lede. Keeps the page's one H1 inside the band.
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
    <section data-band="" className={cx("relative isolate overflow-hidden mesh-navy text-on-band", className)}>
      {media ? (
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[46%] lg:block" aria-hidden="true">
          {media}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--band)_0%,rgba(6,49,103,0.55)_40%,rgba(6,49,103,0.25)_100%)]" />
        </div>
      ) : null}
      <div className="mx-auto grid w-full max-w-content gap-8 gutter py-12 sm:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:py-20">
        <div className="grid max-w-[44rem] gap-4">
          {breadcrumbs ? <div className="[&_a]:text-on-band-2 [&_ol]:text-on-band-2 [&_span[aria-current]]:text-on-band">{breadcrumbs}</div> : null}
          {overline ? (
            <p className="flex items-center gap-3 type-overline text-on-band-2">
              <span aria-hidden="true" className="h-px w-8 bg-[#ff5a5f]" />
              {overline}
            </p>
          ) : null}
          <h1 className="type-display-xl text-on-band">{title}</h1>
          {lede ? <p className="type-lede max-w-[56ch] text-on-band-2">{lede}</p> : null}
          {actions ? <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div> : null}
        </div>
        {aside ? <div className="min-w-0 lg:justify-self-end">{aside}</div> : null}
      </div>
    </section>
  );
}
