/**
 * How it works (pass 2): the pinned, scrubbed sequence. On desktop the section pins for about
 * three viewports while the route line draws from the origin ring to the red destination dot and
 * the four stops rise one after another; a counter reads the current stop. Phones get the
 * vertical route with staggered entrances. The MotionProvider reads the data-pin-* attributes;
 * without JavaScript everything is visible and static.
 */
import { Container, Icon3D, LinkButton, SectionHeader, TiltCard, type Icon3DName } from "@amc/ui";
import type { CSSProperties, ReactNode } from "react";
import { MediaFrame } from "@/components/media/media-frame";
import type { MediaAsset } from "@/lib/media";
import "./how-it-works.css";

export interface Stop {
  title: ReactNode;
  body: ReactNode;
  meta?: ReactNode;
  icon: Icon3DName;
}

export function HowItWorks({
  id,
  overline,
  title,
  lede,
  stops,
  action,
  images,
  tone = "alt",
}: {
  id: string;
  overline: string;
  title: string;
  lede?: ReactNode;
  stops: Stop[];
  action?: ReactNode;
  images?: readonly MediaAsset[];
  tone?: "alt" | "default";
}) {
  const n = stops.length;
  if (n === 0) return null;
  // Stop positions along the 1000-unit route, matched to the card columns.
  const xs = stops.map((_, i) => 12 + ((1000 - 24) / n) * (i + 0.5));
  return (
    <section data-pin-sequence="" aria-labelledby={id} className={tone === "alt" ? "bg-surface-2" : undefined}>
      <div data-pin-target="" className="grid content-center section-pad lg:min-h-[min(44rem,calc(100dvh-7rem))] lg:py-10">
        <Container className="grid gap-10 lg:gap-14">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <SectionHeader id={id} overline={overline} title={title} lede={lede} action={action ?? <LinkButton href="/get-quotes/" variant="secondary">Start a quote request</LinkButton>} />
            <p className="hidden items-baseline gap-1 font-display text-text-3 lg:flex" aria-hidden="true">
              <span data-pin-counter="" className="text-[4.5rem] leading-none font-black tabular text-text [font-stretch:75%]">
                01
              </span>
              <span className="text-[1.5rem] font-bold tabular [font-stretch:85%]">/ {String(n).padStart(2, "0")}</span>
            </p>
          </div>

          <div className="relative">
            {/* Desktop route line: origin ring, dashed path that draws with scroll, red destination dot. */}
            <svg aria-hidden="true" className="absolute inset-x-0 top-7 hidden h-8 w-full lg:block" viewBox="0 0 1000 32" preserveAspectRatio="none" fill="none">
              <path d={`M${xs[0]} 16 H${xs[n - 1]}`} stroke="var(--border)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path
                d={`M${xs[0]} 16 H${xs[n - 1]}`}
                pathLength={1}
                data-pin-route=""
                stroke="var(--brand-navy)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="0.012 0.014"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <ol className="workflow-stops relative grid" style={{ "--step-count": n } as CSSProperties}>
              {stops.map((stop, index) => {
                const last = index === n - 1;
                return (
                  <li key={index} className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-4 lg:grid-cols-1 lg:gap-y-6">
                    <span className="workflow-step-marker relative z-[1] flex justify-center lg:justify-start lg:pl-[calc(50%-1.375rem)]">
                      {!last ? <span aria-hidden="true" className="workflow-step-connector" /> : null}
                      <span
                        data-pin-dot=""
                        aria-hidden="true"
                        className={
                          last
                            ? "inline-grid size-11 place-items-center rounded-pill bg-cta font-display text-[1.0625rem] font-extrabold tabular text-white ring-[6px] ring-surface-2 [font-stretch:85%]"
                            : "inline-grid size-11 place-items-center rounded-pill bg-surface font-display text-[1.0625rem] font-extrabold tabular text-brand-navy ring-[3px] ring-brand-navy [font-stretch:85%] shadow-[0_0_0_6px_var(--surface-2)]"
                        }
                      >
                        {index + 1}
                      </span>
                    </span>
                    <div data-pin-step="">
                      <TiltCard max={7} depth={18} padding="md" className="h-full" bodyClassName="grid h-full content-start gap-4">
                        {images?.[index] ? <div className="relative aspect-[16/10] overflow-hidden rounded-xl" data-page-photo={images[index]!.id}>
                          <MediaFrame asset={images[index]!} sizes="(min-width: 1024px) 23vw, 90vw" />
                          <span className="absolute bottom-2 right-2 rounded-xl bg-white/95 p-1"><Icon3D name={stop.icon} size={48} /></span>
                        </div> : <Icon3D name={stop.icon} size={64} className="tilt-layer-2" />}
                        <h3 className="type-h3 text-text tilt-layer">
                          <span className="sr-only">Step {index + 1}: </span>
                          {stop.title}
                        </h3>
                        <p className="text-text-2 tilt-layer">{stop.body}</p>
                        {stop.meta ? <p className="type-small text-text-3 tilt-layer">{stop.meta}</p> : null}
                      </TiltCard>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </Container>
      </div>
    </section>
  );
}
