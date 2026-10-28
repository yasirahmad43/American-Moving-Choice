/**
 * Step timeline with the route motif: a navy origin ring, a dashed path that draws itself once
 * when the section enters the viewport (the one storytelling moment, VD §11), and a red
 * destination dot at the last stop. Horizontal from 1024px, vertical below.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface TimelineStep {
  title: ReactNode;
  body: ReactNode;
  /** Small meta line, e.g. the survey steps a stop groups. */
  meta?: ReactNode;
}

export interface TimelineProps {
  steps: TimelineStep[];
  tone?: "default" | "band";
  /** Hidden prefix for each step heading ("Step 1: "). */
  stepPrefix?: string;
  className?: string;
}

export function Timeline({ steps, tone = "default", stepPrefix = "Step", className }: TimelineProps) {
  const band = tone === "band";
  const n = steps.length;
  return (
    <div className={cx("relative", className)}>
      {/* Horizontal route line (desktop). */}
      <svg aria-hidden="true" className="absolute inset-x-0 top-[22px] hidden h-3 w-full lg:block" viewBox="0 0 1000 12" preserveAspectRatio="none" fill="none">
        <path
          d="M14 6 H986"
          pathLength={1}
          className="route-draw"
          stroke={band ? "var(--on-band-2)" : "var(--border-strong)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="0.012 0.014"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Vertical route line (mobile). */}
      <svg aria-hidden="true" className="absolute bottom-6 left-[22px] top-6 w-3 lg:hidden" viewBox="0 0 12 1000" preserveAspectRatio="none" fill="none">
        <path d="M6 0 V1000" pathLength={1} className="route-draw" stroke={band ? "var(--on-band-2)" : "var(--border-strong)"} strokeWidth="2" strokeLinecap="round" strokeDasharray="0.01 0.012" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className={cx("relative grid gap-8 lg:gap-6", n === 3 ? "lg:grid-cols-3" : n === 4 ? "lg:grid-cols-4" : n === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
        {steps.map((step, index) => {
          const last = index === n - 1;
          return (
            <li key={index} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 gap-y-3 lg:grid-cols-1">
              <span
                aria-hidden="true"
                className={cx(
                  "relative z-[1] inline-grid size-11 place-items-center rounded-pill font-display text-[1.0625rem] font-extrabold tabular ring-[3px]",
                  last
                    ? "bg-brand-red text-white ring-white [[data-band]_&]:ring-band"
                    : band
                      ? "bg-band text-on-band ring-on-band-2"
                      : "bg-surface text-brand-navy ring-brand-navy",
                )}
              >
                {index + 1}
              </span>
              <div className="grid content-start gap-1.5 lg:pr-4">
                <h3 className={cx("type-h4", band ? "text-on-band" : "text-text")}>
                  <span className="sr-only">
                    {stepPrefix} {index + 1}:{" "}
                  </span>
                  {step.title}
                </h3>
                <p className={band ? "text-on-band-2" : "text-text-2"}>{step.body}</p>
                {step.meta ? <p className={cx("type-small", band ? "text-on-band-2/80" : "text-text-3")}>{step.meta}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
