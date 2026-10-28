"use client";

/**
 * Scroll-triggered reveal (VD §11): a one-time 14px rise and fade when the element enters the
 * viewport. Uses IntersectionObserver, never a scroll listener. The CSS lives in theme.css
 * ([data-reveal]); without JavaScript, or under prefers-reduced-motion, content is simply visible.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "../cx";

export interface RevealProps {
  as?: "div" | "section" | "li" | "ul" | "ol" | "article" | "figure" | "header" | "aside";
  /** Stagger, in milliseconds, for items that enter together. */
  delay?: number;
  /** Fraction of the element that must be visible before it reveals. */
  threshold?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}

export function Reveal({ as: Tag = "div", delay = 0, threshold = 0.15, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.reveal = "in";
      return;
    }
    // Already on screen (above the fold): show at once, no observer dance.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      node.dataset.reveal = "in";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.dataset.reveal = "in";
            observer.disconnect();
          }
        }
      },
      { threshold: Math.min(0.15, Math.max(0, threshold)), rootMargin: "0px 0px -4% 0px" },
    );
    observer.observe(node);
    // Only hide content after the observer is attached. A failed hydration never hides SSR text.
    node.dataset.reveal = "pending";
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const show = () => {
      if (preference.matches || node.contains(document.activeElement)) {
        node.dataset.reveal = "in";
        observer.disconnect();
      }
    };
    preference.addEventListener("change", show);
    node.addEventListener("focusin", show);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", show);
      node.removeEventListener("focusin", show);
      node.dataset.reveal = "in";
    };
  }, [threshold]);
  const Component = Tag as "div";
  return (
    <Component
      ref={ref as never}
      data-reveal=""
      className={cx(className)}
      style={delay ? ({ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties) : style}
      {...rest}
    >
      {children}
    </Component>
  );
}

/** Marks <html data-js> so reveal styles only hide content when JavaScript will reveal it. */
export function JsFlag() {
  return <script dangerouslySetInnerHTML={{ __html: "document.documentElement.setAttribute('data-js','1')" }} />;
}
