/**
 * Bento grid: a 12-column, dense-packed grid for editorial feature blocks. Cells declare their
 * desktop span; below 768px every cell is full width. Callers must make the spans add up (no
 * empty cells): 8+4, then 4+4+4, and so on.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export function Bento({ children, className, as: Tag = "div", ...rest }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol"; [key: `data-${string}`]: string | undefined }) {
  return (
    <Tag className={cx("grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-12 md:gap-5", className)} {...rest}>
      {children}
    </Tag>
  );
}

export type BentoSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

const spans: Record<BentoSpan, string> = {
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  12: "md:col-span-12",
};

export interface BentoCellProps {
  span?: BentoSpan;
  rows?: 1 | 2;
  tone?: "surface" | "alt" | "navy" | "outline";
  as?: "div" | "li" | "article" | "section";
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
}

export function BentoCell({ span = 4, rows = 1, tone = "surface", as: Tag = "div", className, children, ...aria }: BentoCellProps) {
  return (
    <Tag
      {...(tone === "navy" ? { "data-band": "" } : {})}
      className={cx(
        "relative min-w-0 overflow-hidden rounded-card p-6 sm:p-7",
        spans[span],
        rows === 2 && "md:row-span-2",
        tone === "surface" && "border border-border bg-surface shadow-e1",
        tone === "alt" && "bg-surface-2 ring-1 ring-border",
        tone === "navy" && "mesh-navy text-on-band",
        tone === "outline" && "border-[1.5px] border-dashed border-border-strong bg-surface",
        className,
      )}
      {...aria}
    >
      {children}
    </Tag>
  );
}
