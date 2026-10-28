/**
 * Honest empty states (VD §3 principle 5, §9.9): a heading, one sentence on how to change it and
 * one action. "No customer reviews yet" and "We don't have movers on this route yet" are designed
 * states, never gaps to hide or fill with invented data.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";
import { BoxesArt } from "../art";
import { RouteMark } from "../icons";

export interface EmptyStateProps {
  title: ReactNode;
  titleAs?: "h2" | "h3" | "p";
  description?: ReactNode;
  action?: ReactNode;
  /** Shows the route mark above the heading. */
  showMark?: boolean;
  className?: string;
}

export function EmptyState({ title, titleAs: Heading = "h2", description, action, showMark = false, className }: EmptyStateProps) {
  return (
    <div className={cx("relative isolate grid justify-items-start gap-2 overflow-hidden rounded-card border-[1.5px] border-dashed border-border-strong bg-surface-2 p-6 sm:p-8", className)}>
      <div className="pointer-events-none absolute -right-6 -top-6 -z-10 h-40 w-64 opacity-70 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden="true">
        <BoxesArt />
      </div>
      {showMark ? <RouteMark size={16} className="mb-1" /> : null}
      <Heading className="type-h3 text-text">{title}</Heading>
      {description ? <p className="max-w-[60ch] text-text-2">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
