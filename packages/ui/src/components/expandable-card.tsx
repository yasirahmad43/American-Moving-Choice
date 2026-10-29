/**
 * Expandable card on the native <details> element: works without JavaScript, the summary is a
 * 44px target, the chevron turns and the body fades in (theme.css details.expandable).
 */
import type { ReactNode } from "react";
import { cx } from "../cx";
import { ChevronDownIcon } from "../icons";

export interface ExpandableCardProps {
  title: ReactNode;
  titleAs?: "h2" | "h3" | "h4";
  /** One line under the title, visible while collapsed. */
  summary?: ReactNode;
  /** Small leading glyph or number. */
  leading?: ReactNode;
  defaultOpen?: boolean;
  name?: string;
  className?: string;
  /** Public inset applies to each text region, leaving the outer disclosure unpadded. */
  contentInset?: "card" | "compact";
  children: ReactNode;
}

export function ExpandableCard({ title, titleAs: Heading = "h3", summary, leading, defaultOpen, name, className, contentInset, children }: ExpandableCardProps) {
  return (
    <details
      className={cx("expandable group min-w-0 rounded-card border border-border bg-surface shadow-e1 transition-shadow duration-[var(--d2)] open:shadow-e2", className)}
      open={defaultOpen}
      name={name}
    >
      <summary data-content-inset={contentInset} className="flex cursor-pointer list-none items-start gap-4 p-5 [&::-webkit-details-marker]:hidden sm:p-6">
        {leading ? <span className="shrink-0 pt-0.5">{leading}</span> : null}
        <span className="grid min-w-0 flex-1 gap-1">
          <Heading className="type-h4 text-text">{title}</Heading>
          {summary ? <span className="text-text-2">{summary}</span> : null}
        </span>
        <span
          aria-hidden="true"
          className="expandable-chevron inline-grid size-9 shrink-0 place-items-center rounded-pill border-[1.5px] border-border-strong text-text-2 group-hover:bg-surface-2"
        >
          <ChevronDownIcon size={18} />
        </span>
      </summary>
      <div data-content-inset={contentInset} className="expandable-body border-t border-border px-5 pb-5 pt-4 text-text-2 sm:px-6 sm:pb-6">{children}</div>
    </details>
  );
}
