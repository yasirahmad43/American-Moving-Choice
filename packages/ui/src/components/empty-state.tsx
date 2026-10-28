/**
 * Honest empty states (VD §3 principle 5, §9.9): a heading, one sentence on how to change it and
 * one action. "No customer reviews yet" and "We don't have movers on this route yet" are designed
 * states, never gaps to hide or fill with invented data. Pass 2: a floating 3D icon on a soft
 * plate instead of a generic circle.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";
import { BoxesArt } from "../art";
import { RouteMark } from "../icons";
import { Icon3D, type Icon3DName } from "./icon-3d";

export interface EmptyStateProps {
  title: ReactNode;
  titleAs?: "h2" | "h3" | "p";
  description?: ReactNode;
  action?: ReactNode;
  /** Shows the route mark above the heading. */
  showMark?: boolean;
  /** A 3D icon beside the text (default: the open box). */
  icon?: Icon3DName | null;
  className?: string;
}

export function EmptyState({ title, titleAs: Heading = "h2", description, action, showMark = false, icon = "box", className }: EmptyStateProps) {
  return (
    <div className={cx("relative isolate grid gap-5 overflow-hidden rounded-card border-[1.5px] border-dashed border-border-strong bg-surface-2 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-8", className)}>
      <div className="pointer-events-none absolute -right-6 -top-6 -z-10 h-40 w-64 opacity-60 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden="true">
        <BoxesArt />
      </div>
      {icon ? (
        <span className="inline-grid size-24 place-items-center rounded-[1.5rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(6,49,103,0.1),transparent)] ring-1 ring-border">
          <Icon3D name={icon} size={72} float />
        </span>
      ) : null}
      <div className="grid justify-items-start gap-2">
        {showMark ? <RouteMark size={16} className="mb-1" /> : null}
        <Heading className="type-h3 text-text">{title}</Heading>
        {description ? <p className="max-w-[60ch] text-text-2">{description}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}
