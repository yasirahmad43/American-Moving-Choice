"use client";

/**
 * Flip card: a front face and a back face on a 3D turn. Fine pointers flip on hover; everyone
 * can flip with the "More" toggle (tap or keyboard). Both faces stay in the DOM and the hidden
 * face is aria-hidden, so screen readers read one face at a time. Under prefers-reduced-motion
 * the faces crossfade instead of rotating (theme.css .flip).
 */
import { useId, useState, type ReactNode } from "react";
import { cx } from "../cx";
import { ArrowRightIcon } from "../icons";

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Accessible name of the toggle, e.g. "More about long-distance pricing". */
  toggleLabel: string;
  /** Visible toggle text on the front face. */
  toggleText?: string;
  backToggleText?: string;
  tone?: "surface" | "navy";
  className?: string;
  minHeight?: string;
}

export function FlipCard({ front, back, toggleLabel, toggleText = "Details", backToggleText = "Back", tone = "surface", className, minHeight = "15rem" }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const backId = useId();
  const faceBase = "flip-face grid content-between gap-4 rounded-card p-6";
  return (
    <div className={cx("flip min-w-0", className)} data-flipped={flipped ? "true" : undefined} style={{ minHeight }}>
      <div className="flip-inner h-full" style={{ minHeight }}>
        <div className={cx(faceBase, "flip-front border border-border bg-surface shadow-e1")} aria-hidden={flipped || undefined} inert={flipped || undefined}>
          <div className="min-w-0">{front}</div>
          <button
            type="button"
            onClick={() => setFlipped(true)}
            aria-expanded={flipped}
            aria-controls={backId}
            aria-label={toggleLabel}
            tabIndex={flipped ? -1 : 0}
            className="group inline-flex min-h-11 w-max items-center gap-2 rounded-pill border-[1.5px] border-border-strong pl-4 pr-1.5 font-semibold text-text transition-colors duration-[var(--d1)] hover:bg-surface-2"
          >
            {toggleText}
            <span className="inline-grid size-8 place-items-center rounded-pill bg-surface-3 transition-transform duration-[var(--d2)] ease-out group-hover:translate-x-0.5">
              <ArrowRightIcon size={16} />
            </span>
          </button>
        </div>
        <div
          id={backId}
          className={cx(faceBase, "flip-back", tone === "navy" ? "mesh-navy text-on-band" : "bg-surface-2 shadow-e2 ring-1 ring-border")}
          aria-hidden={!flipped || undefined}
          inert={!flipped || undefined}
          data-band={tone === "navy" ? "" : undefined}
        >
          <div className="min-w-0">{back}</div>
          <button
            type="button"
            onClick={() => setFlipped(false)}
            tabIndex={flipped ? 0 : -1}
            className={cx(
              "inline-flex min-h-11 w-max items-center rounded-pill px-4 font-semibold transition-colors duration-[var(--d1)]",
              tone === "navy" ? "bg-white text-brand-navy hover:bg-on-band-2" : "border-[1.5px] border-border-strong text-text hover:bg-surface",
            )}
          >
            {backToggleText}
          </button>
        </div>
      </div>
    </div>
  );
}
