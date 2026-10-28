/** Cards (VD §7, §9.5): 16px radius, decorative hairline edge, navy-tinted e1 shadow at rest. */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface CardProps {
  title?: ReactNode;
  /** Heading level for the title; pick the one that fits the page outline. */
  titleAs?: "h2" | "h3" | "h4";
  description?: ReactNode;
  /** Top-right actions next to the title. */
  actions?: ReactNode;
  footer?: ReactNode;
  as?: "div" | "section" | "article" | "li";
  /** Interactive cards get a strong edge (they are controls) and the e2 shadow on hover. */
  interactive?: boolean;
  padding?: "md" | "lg" | "none";
  className?: string;
  children?: ReactNode;
  "aria-labelledby"?: string;
}

export function Card({
  title,
  titleAs: Heading = "h2",
  description,
  actions,
  footer,
  as: Tag = "div",
  interactive,
  padding = "md",
  className,
  children,
  ...aria
}: CardProps) {
  const pad = padding === "none" ? "" : padding === "lg" ? "p-6 sm:p-8" : "p-5 sm:p-6";
  return (
    <Tag
      className={cx(
        "min-w-0 rounded-card bg-surface shadow-e1",
        interactive ? "border-[1.5px] border-border-strong transition-shadow duration-[var(--d1)] hover:shadow-e2" : "border border-border",
        pad,
        className,
      )}
      {...aria}
    >
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <Heading className="type-h3 text-text">{title}</Heading> : null}
            {description ? <p className="mt-1 type-small text-text-2">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
      {footer ? <div className="mt-5 border-t border-border pt-4">{footer}</div> : null}
    </Tag>
  );
}
