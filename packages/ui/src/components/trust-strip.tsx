/**
 * Trust strip: a row of factual statements, each with a 3D icon that wakes in sequence as the
 * strip scrolls into view (depth.css .trust-item), two up on phones and four up on desktop
 * (VD §13.1). No marquee, no counters, no invented testimonials or ratings (VD §3).
 */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { Icon3D, type Icon3DName } from "./icon-3d";

export interface TrustItem {
  icon?: ReactNode;
  /** A 3D icon name; takes precedence over `icon`. */
  icon3d?: Icon3DName;
  title: ReactNode;
  body: ReactNode;
}

export function TrustStrip({ items, tone = "default", className }: { items: TrustItem[]; tone?: "default" | "band"; className?: string }) {
  const band = tone === "band";
  return (
    <ul className={cx("grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4 lg:gap-x-8", className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cx("trust-item icon3d-hover group relative grid min-w-0 content-start gap-3 border-t-2 pt-5", band ? "border-on-band-2/40" : "border-border-strong")}
          style={{ "--i": index } as CSSProperties}
        >
          <span
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute right-0 top-0 h-0.5 w-0 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full",
              band ? "bg-[#ff5a5f]" : "bg-brand-red",
            )}
          />
          {item.icon3d ? (
            <Icon3D name={item.icon3d} size={56} float delay={index * 0.9} />
          ) : item.icon ? (
            <span className={cx("inline-flex", band ? "text-on-band-2" : "text-brand-navy")}>{item.icon}</span>
          ) : null}
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
    <figure className={cx("grid content-between gap-4 rounded-card border border-border bg-surface p-6 depth-1", className)}>
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
