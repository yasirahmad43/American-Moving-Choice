/**
 * How it works (pass 2): the pinned, scrubbed sequence. On desktop the section pins for about
 * three viewports while the route line draws from the origin ring to the red destination dot and
 * the four stops rise one after another; a counter reads the current stop. Phones get the
 * vertical route with staggered entrances. The MotionProvider reads the data-pin-* attributes;
 * without JavaScript everything is visible and static.
 */
import { Container, Icon3D, LinkButton, SectionHeader, TiltCard, type Icon3DName } from "@amc/ui";
import type { ReactNode } from "react";

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
  tone = "alt",
}: {
  id: string;
  overline: string;
  title: string;
  lede?: ReactNode;
  stops: Stop[];
  action?: ReactNode;
  tone?: "alt" | "default";
}) {
  const n = stops.length;
  // Stop positions along the 1000-unit route, matched to the card columns.
  const xs = stops.map((_, i) => 12 + ((1000 - 24) / n) * (i + 0.5));
  return (
    <section data-pin-sequence="" aria-labelledby={id} className={tone === "alt" ? "bg-surface-2" : undefined}>
      <div data-pin-target="" className="grid min-h-[min(100dvh,56rem)] content-center section-pad lg:py-0">
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
            {/* Mobile route line. */}
            <svg aria-hidden="true" className="absolute bottom-10 left-[1.65rem] top-8 w-3 lg:hidden" viewBox="0 0 12 1000" preserveAspectRatio="none" fill="none">
              <path d="M6 0 V1000" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 8" vectorEffect="non-scaling-stroke" />
            </svg>

            <ol className="relative grid gap-6 lg:grid-cols-4 lg:gap-5">
              {stops.map((stop, index) => {
                const last = index === n - 1;
                return (
                  <li key={index} className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-4 lg:grid-cols-1 lg:gap-y-6">
                    <span className="relative z-[1] flex justify-center lg:justify-start lg:pl-[calc(50%-1.375rem)]">
                      <span
                        data-pin-dot=""
                        aria-hidden="true"
                        className={
                          last
                            ? "inline-grid size-11 place-items-center rounded-pill bg-brand-red font-display text-[1.0625rem] font-extrabold tabular text-white ring-[6px] ring-surface-2 [font-stretch:85%]"
                            : "inline-grid size-11 place-items-center rounded-pill bg-surface font-display text-[1.0625rem] font-extrabold tabular text-brand-navy ring-[3px] ring-brand-navy [font-stretch:85%] shadow-[0_0_0_6px_var(--surface-2)]"
                        }
                      >
                        {index + 1}
                      </span>
                    </span>
                    <div data-pin-step="">
                      <TiltCard max={7} depth={18} padding="md" className="h-full" bodyClassName="grid h-full content-start gap-4">
                        <Icon3D name={stop.icon} size={64} className="tilt-layer-2" />
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
