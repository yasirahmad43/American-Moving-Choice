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
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
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
