/**
 * Survey progress (VD §9.3): "Step 2 of 4" in text plus a 4px track. The track is aria-hidden
 * because the text carries the meaning; the fill moves with transform, not width.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface StepperProps {
  current: number;
  total: number;
  /** Name of the current step, e.g. "Where". */
  label?: ReactNode;
  className?: string;
}

export function Stepper({ current, total, label, className }: StepperProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(1, current), safeTotal);
  return (
    <div className={cx("grid gap-2", className)}>
      <p className="type-small font-semibold text-text-2">
        <span className="tabular">
          Step {safeCurrent} of {safeTotal}
        </span>
        {label ? <span className="text-text"> · {label}</span> : null}
      </p>
      <div className="h-1 overflow-hidden rounded-pill bg-surface-3" aria-hidden="true">
        <div
          className="h-full w-full origin-left rounded-pill bg-primary transition-transform duration-[var(--d3)] ease-std"
          style={{ transform: `scaleX(${safeCurrent / safeTotal})` }}
        />
      </div>
    </div>
  );
}
