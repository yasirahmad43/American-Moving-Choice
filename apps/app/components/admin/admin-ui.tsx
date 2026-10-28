/**
 * Small server components shared by the admin pages: link tabs, filter bars (GET forms),
 * definition lists, status pills and JSON disclosure. Dense by design (VD §13.11): hairline
 * dividers, tabular figures, monospace IDs.
 */
import { AbsoluteDate, StatusPill, cx, type StatusTone } from "@amc/ui";
import Link from "next/link";
import type { ReactNode } from "react";

/** Navigation between views of one page, as links (?tab=...). The current one has aria-current. */
export function LinkTabs({ items, current, label }: { items: { id: string; label: ReactNode; href: string }[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="border-b border-border">
      <ul className="-mb-px flex flex-wrap gap-1">
        {items.map((item) => {
          const active = item.id === current;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex min-h-11 items-center border-b-[3px] px-3 font-semibold no-underline",
                  active ? "border-primary text-text" : "border-transparent text-text-2 hover:text-text",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** A GET form for list filters; every control needs a label. */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4" role="search" aria-label="Filters">
      {children}
      <div className="flex gap-2">
        <button type="submit" className="inline-flex min-h-12 items-center rounded-control bg-primary px-4 font-semibold text-on-primary">
          Apply filters
        </button>
        <Link href={resetHref} className="inline-flex min-h-12 items-center px-3 font-semibold text-link underline">
          Clear
        </Link>
      </div>
    </form>
  );
}

export function FilterSelect({ id, name, label, value, options }: { id: string; name: string; label: string; value: string; options: { value: string; label: string }[] }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-text">
        {label}
      </label>
      <select id={id} name={name} defaultValue={value} className="min-h-12 rounded-control border-[1.5px] border-border-strong bg-surface px-3 text-[1.0625rem] text-text">
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterInput({ id, name, label, value, type = "text", placeholder }: { id: string; name: string; label: string; value: string; type?: string; placeholder?: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-text">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="min-h-12 rounded-control border-[1.5px] border-border-strong bg-surface px-3 text-[1.0625rem] text-text"
      />
    </div>
  );
}

/** Label and value pairs. */
export function Facts({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cx("grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(10rem,max-content)_1fr]", className)}>
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="type-small font-semibold text-text-2">{item.label}</dt>
          <dd className="min-w-0 break-words text-text">{item.value ?? <span className="text-text-3">None</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.875rem] break-all">{children}</span>;
}

/** A short ID (first 8 characters) with the full ID as its title. */
export function ShortId({ id }: { id: string }) {
  return (
    <span className="font-mono text-[0.875rem]" title={id}>
      {id.slice(0, 8)}
    </span>
  );
}

export function When({ value, date }: { value: Date | string | null | undefined; date?: boolean }) {
  if (!value) return <span className="text-text-3">None</span>;
  return <AbsoluteDate value={value} withTime={!date} />;
}

const TONES: Record<string, StatusTone> = {
  pass: "success",
  fail: "error",
  needs_review: "warning",
  approved: "success",
  published: "success",
  succeeded: "success",
  sent: "success",
  qualified: "success",
  live: "success",
  good: "success",
  won: "success",
  resolved: "success",
  upheld: "warning",
  demo: "info",
  available: "info",
  open: "info",
  in_progress: "info",
  in_review: "info",
  verifying: "info",
  running: "info",
  queued: "info",
  sending: "info",
  pending: "warning",
  waiting: "warning",
  evidence_submitted: "warning",
  under_review: "warning",
  past_due: "warning",
  submitted: "neutral",
  draft: "neutral",
  hidden: "neutral",
  closed: "neutral",
  dismissed: "neutral",
  sold_out: "neutral",
  expired: "neutral",
  retired: "neutral",
  applied: "neutral",
  unmatched: "neutral",
  failed: "error",
  rejected: "error",
  removed: "error",
  suspended: "error",
  withdrawn: "error",
  lost: "error",
};

export const humanize = (value: string) => {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Any status value as a pill; the label is the value in words. */
export function Status({ value, label }: { value: string | null | undefined; label?: string }) {
  if (!value) return <span className="text-text-3">None</span>;
  return <StatusPill tone={TONES[value] ?? "neutral"}>{label ?? humanize(value)}</StatusPill>;
}

/** Raw JSON (payload snapshots, audit before and after) behind a disclosure. */
export function JsonDetails({ value, summary = "Show data" }: { value: unknown; summary?: string }) {
  if (value === null || value === undefined) return null;
  return (
    <details className="mt-1">
      <summary className="min-h-11 cursor-pointer py-2 type-small font-semibold text-link">{summary}</summary>
      <pre className="max-h-80 overflow-auto rounded-control bg-surface-2 p-3 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

/** A count tile for the dashboard. */
export function StatTile({ label, value, href, note }: { label: string; value: ReactNode; href?: string; note?: ReactNode }) {
  const body = (
    <>
      <p className="type-small font-semibold text-text-2">{label}</p>
      <p className="mt-1 text-[1.75rem] leading-tight font-semibold tabular text-text">{value}</p>
      {note ? <p className="mt-1 type-small text-text-3">{note}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-card border border-border bg-surface p-4 no-underline shadow-e1 hover:shadow-e2">
      {body}
    </Link>
  ) : (
    <div className="rounded-card border border-border bg-surface p-4 shadow-e1">{body}</div>
  );
}

/** A section heading inside a page (h2). */
export function SectionTitle({ children, description, id }: { children: ReactNode; description?: ReactNode; id?: string }) {
  return (
    <div className="mb-3">
      <h2 id={id} className="type-h3 text-text">
        {children}
      </h2>
      {description ? <p className="mt-1 type-small text-text-2">{description}</p> : null}
    </div>
  );
}

/** Page number links for list pages. */
export function Pager({ page, total, perPage, hrefFor }: { page: number; total: number; perPage: number; hrefFor: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return <p className="type-small text-text-3 tabular">{total} in total</p>;
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center gap-3 type-small">
      <span className="tabular text-text-2">
        Page {page} of {pages} ({total} in total)
      </span>
      {page > 1 ? (
        <Link className="inline-flex min-h-11 items-center font-semibold text-link underline" href={hrefFor(page - 1)}>
          Previous page
        </Link>
      ) : null}
      {page < pages ? (
        <Link className="inline-flex min-h-11 items-center font-semibold text-link underline" href={hrefFor(page + 1)}>
          Next page
        </Link>
      ) : null}
    </nav>
  );
}

/** First value of a search param. */
export const param = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim();

export const pageNumber = (value: string | string[] | undefined): number => {
  const n = Number.parseInt(param(value), 10);
  return Number.isFinite(n) && n > 0 && n < 10_000 ? n : 1;
};

/** Builds a query string from the non-empty entries. */
export function qs(values: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** A keyboard-scrollable region for tables too wide for the content column. */
export function Scroll({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="min-w-0 overflow-x-auto focus-visible:outline-3 focus-visible:outline-focus">
      {children}
    </div>
  );
}
