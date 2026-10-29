"use client";

/**
 * Tilt card (pass 2): a perspective tilt that follows the pointer, a specular glare at the pointer
 * position and depth-layered children (.tilt-layer / .tilt-layer-2 translate on the Z axis).
 * Pointer math writes CSS custom properties only (no React re-render per move) and the CSS in
 * depth.css applies them with transform/opacity. Coarse pointers and prefers-reduced-motion get
 * the static card with its shadow.
 */
import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cx } from "../cx";

export interface TiltCardProps {
  as?: "div" | "li" | "article" | "section";
  /** Maximum rotation in degrees. */
  max?: number;
  /** Z offset of .tilt-layer children, in pixels. */
  depth?: number;
  /** "glass" adds the translucent bezel; "navy" the mesh band; "surface" the white card. */
  tone?: "surface" | "glass" | "navy" | "none";
  padding?: "none" | "md" | "lg";
  className?: string;
  bodyClassName?: string;
  /** Public text inset, applied to the inner painted body rather than the outer tilt frame. */
  contentInset?: "card" | "compact";
  style?: CSSProperties;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}

export function TiltCard({ as: Tag = "div", max = 9, depth = 24, tone = "surface", padding = "md", className, bodyClassName, contentInset, style, children, ...aria }: TiltCardProps) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<number>(0);
  const enabled = useRef(false);

  useEffect(() => {
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      enabled.current = pointer.matches && !reducedMotion.matches;
      if (!enabled.current) {
        cancelAnimationFrame(frame.current);
        ref.current?.style.setProperty("--rx", "0deg");
        ref.current?.style.setProperty("--ry", "0deg");
        ref.current?.style.setProperty("--gl", "0");
      }
    };
    update();
    pointer.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame.current);
      pointer.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  const onMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled.current || event.pointerType !== "mouse") return;
      const node = ref.current;
      if (!node) return;
      const clientX = event.clientX;
      const clientY = event.clientY;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        const rotation = Math.max(0, Math.min(12, max));
        node.style.setProperty("--ry", `${((px - 0.5) * 2 * rotation).toFixed(2)}deg`);
        node.style.setProperty("--rx", `${((0.5 - py) * 2 * rotation).toFixed(2)}deg`);
        node.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        node.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
        node.style.setProperty("--gl", "1");
        node.dataset.tilting = "true";
      });
    },
    [max],
  );

  const onLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    cancelAnimationFrame(frame.current);
    node.style.setProperty("--rx", "0deg");
    node.style.setProperty("--ry", "0deg");
    node.style.setProperty("--gl", "0");
    node.dataset.tilting = "false";
  }, []);

  const pad = padding === "none" ? "" : padding === "lg" ? "p-6 sm:p-8" : "p-5 sm:p-6";
  const Component = Tag as "div";
  return (
    <Component
      ref={ref as never}
      className={cx("tilt min-w-0", className)}
      style={{ ...(style ?? {}), "--depth": `${depth}px` } as CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
      {...aria}
    >
      <div
        data-content-inset={contentInset}
        className={cx(
          "tilt-body h-full min-w-0 rounded-card",
          tone === "surface" && "border border-border bg-surface depth-2",
          tone === "glass" && "glass",
          tone === "navy" && "mesh-navy text-on-band depth-2",
          pad,
          bodyClassName,
        )}
        {...(tone === "navy" ? { "data-band": "" } : {})}
      >
        {children}
        <span className="tilt-glare" aria-hidden="true" />
      </div>
    </Component>
  );
}
