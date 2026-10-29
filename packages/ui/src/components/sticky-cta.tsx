"use client";

/**
 * Mobile sticky CTA bar (VD §9.10): appears below 1024px once the element with id `watch` has
 * scrolled out of view, hides during form interaction or while the closing survey is visible,
 * respects the safe area and adds
 * scroll-padding so focused elements are never hidden behind it (WCAG 2.4.11).
 */
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "../cx";
import { ArrowRightIcon } from "../icons";

export interface StickyCtaProps {
  href: string;
  label: ReactNode;
  /** The id of the inline form or hero the bar replaces once it leaves the viewport. */
  watch: string;
  note?: ReactNode;
  /** Written to sessionStorage on click (e.g. the profile a quote request starts from). */
  storage?: { key: string; value: string };
  className?: string;
}

export function StickyCta({ href, label, watch, note, storage, className }: StickyCtaProps) {
  const [visible, setVisible] = useState(false);
  const [formActive, setFormActive] = useState(false);
  const [closingVisible, setClosingVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watch);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry ? !entry.isIntersecting && entry.boundingClientRect.top < 0 : false), { threshold: 0 });
    observer.observe(target);
    const updateFocus = () => {
      const el = document.activeElement;
      setFormActive(Boolean(el instanceof HTMLElement && (el.closest("form") || el.matches("input, textarea, select") || el.isContentEditable)));
    };
    // Focusout runs before the next control receives focus; evaluate the settled target.
    const onFocus = () => queueMicrotask(updateFocus);
    const closing = document.querySelector("[data-closing-survey]");
    const closingObserver = closing ? new IntersectionObserver(([entry]) => setClosingVisible(Boolean(entry?.isIntersecting)), { threshold: 0 }) : null;
    if (closing) closingObserver?.observe(closing);
    updateFocus();
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    return () => {
      observer.disconnect();
      closingObserver?.disconnect();
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
    };
  }, [watch]);

  const shown = visible && !formActive && !closingVisible;
  useEffect(() => {
    if (shown) document.documentElement.setAttribute("data-sticky-cta", "");
    else document.documentElement.removeAttribute("data-sticky-cta");
    return () => document.documentElement.removeAttribute("data-sticky-cta");
  }, [shown]);

  return (
    <div className={cx("sticky-cta lg:hidden", className)} data-visible={shown ? "true" : "false"} aria-hidden={!shown || undefined}>
      <div className="surface-glass mx-auto flex max-w-content items-center gap-3 rounded-card p-2 shadow-e3 ring-1 ring-border">
        {note ? <p className="min-w-0 flex-1 truncate pl-2 type-small text-text-2">{note}</p> : null}
        <Link
          href={href}
          tabIndex={shown ? 0 : -1}
          onClick={() => {
            if (!storage) return;
            try {
              window.sessionStorage.setItem(storage.key, storage.value);
            } catch {
              // Storage can be unavailable; the destination still works without it.
            }
          }}
          className="group inline-flex min-h-12 flex-1 items-center justify-between gap-3 rounded-control bg-cta pl-5 pr-2 font-semibold text-on-cta no-underline hover:bg-cta-hover"
        >
          {label}
          <span className="inline-grid size-[30px] place-items-center rounded-pill bg-white/20 transition-transform duration-[var(--d2)] ease-out group-hover:translate-x-0.5">
            <ArrowRightIcon size={18} />
          </span>
        </Link>
      </div>
    </div>
  );
}
