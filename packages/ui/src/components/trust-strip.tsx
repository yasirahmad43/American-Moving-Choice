/**
 * Trust strip: a row of factual statements with a glyph, two up on phones and four up on
 * desktop (VD §13.1). It carries no invented testimonials, counters or ratings (VD §3).
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface TrustItem {
  icon?: ReactNode;
  title: ReactNode;
  body: ReactNode;
}

export function TrustStrip({ items, tone = "default", className }: { items: TrustItem[]; tone?: "default" | "band"; className?: string }) {
  const band = tone === "band";
  return (
    <ul className={cx("grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4", className)}>
      {items.map((item, index) => (
        <li key={index} className={cx("grid min-w-0 content-start gap-2 border-t-2 pt-4", band ? "border-on-band-2/40" : "border-border-strong")}>
          {item.icon ? <span className={cx("inline-flex", band ? "text-on-band-2" : "text-brand-navy")}>{item.icon}</span> : null}
          <p className={cx("type-h4", band ? "text-on-band" : "text-text")}>{item.title}</p>
          <p className={cx("type-small sm:text-base", band ? "text-on-band-2" : "text-text-2")}>{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * A quoted statement card for policy excerpts and, once real ones exist, customer quotes with
 * their evidence label. Nothing here invents a source: `attribution` is required.
 */
export function QuoteCard({ quote, attribution, label, className }: { quote: ReactNode; attribution: ReactNode; label?: ReactNode; className?: string }) {
  return (
    <figure className={cx("grid content-between gap-4 rounded-card border border-border bg-surface p-6 shadow-e1", className)}>
      <blockquote className="text-[1.125rem] leading-relaxed text-text">
        <span aria-hidden="true" className="mr-1 font-display text-[2rem] leading-none font-black text-brand-red">
          &ldquo;
        </span>
        {quote}
      </blockquote>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 type-small text-text-2">
        <span>{attribution}</span>
        {label ? <span className="rounded-tag bg-surface-3 px-2 py-0.5 font-bold uppercase tracking-[0.08em]">{label}</span> : null}
      </figcaption>
    </figure>
  );
}
