/**
 * Stat tiles: a large tabular figure with its label and a one-line note. Values are never
 * animated (VD §11: no count-ups) and every figure must be real or labeled as a sample.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface StatTileProps {
  value: ReactNode;
  label: ReactNode;
  note?: ReactNode;
  tone?: "surface" | "navy" | "plain";
  className?: string;
}

export function StatTile({ value, label, note, tone = "surface", className }: StatTileProps) {
  return (
    <div
      className={cx(
        "grid min-w-0 content-start gap-1 rounded-card p-5",
        tone === "surface" && "border border-border bg-surface shadow-e1",
        tone === "navy" && "bg-white/8 ring-1 ring-white/15",
        tone === "plain" && "border-t-2 border-border-strong pt-4 px-0 rounded-none",
        className,
      )}
    >
      <p className={cx("font-display text-[2.25rem] leading-none font-extrabold tabular [font-stretch:85%]", tone === "navy" ? "text-on-band" : "text-text")}>{value}</p>
      <p className={cx("font-semibold", tone === "navy" ? "text-on-band" : "text-text")}>{label}</p>
      {note ? <p className={cx("type-small", tone === "navy" ? "text-on-band-2" : "text-text-2")}>{note}</p> : null}
    </div>
  );
}

/** A row of tiles, 2 up on phones and up to 4 up on desktop. */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", className)}>{children}</div>;
}
