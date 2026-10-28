/** Crawlable pagination links (VD §13.5): previous, numbered pages with gaps, next. */
import Link from "next/link";
import { cx } from "../cx";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

export interface PaginationProps {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  label?: string;
  className?: string;
}

/** Page numbers to show: first, last, and the current page ±1, with null for a gap. */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push(null);
    result.push(p);
  });
  return result;
}

const itemClass = "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-control px-3 font-semibold no-underline";

export function Pagination({ page, totalPages, hrefForPage, label = "Pagination", className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(1, page), totalPages);
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap items-center gap-2">
        {current > 1 ? (
          <li>
            <Link href={hrefForPage(current - 1)} className={cx(itemClass, "text-link hover:bg-surface-2")} rel="prev">
              <ChevronLeftIcon size={18} />
              Previous
            </Link>
          </li>
        ) : null}
        {pageWindow(current, totalPages).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-text-3">
              …
            </li>
          ) : (
            <li key={p}>
              {p === current ? (
                <span aria-current="page" className={cx(itemClass, "tabular bg-primary text-on-primary")}>
                  <span className="sr-only">Page </span>
                  {p}
                </span>
              ) : (
                <Link href={hrefForPage(p)} className={cx(itemClass, "tabular text-link hover:bg-surface-2")}>
                  <span className="sr-only">Page </span>
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
        {current < totalPages ? (
          <li>
            <Link href={hrefForPage(current + 1)} className={cx(itemClass, "text-link hover:bg-surface-2")} rel="next">
              Next
              <ChevronRightIcon size={18} />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
