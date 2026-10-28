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
  style?: CSSProperties;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}

export function TiltCard({ as: Tag = "div", max = 9, depth = 24, tone = "surface", padding = "md", className, bodyClassName, style, children, ...aria }: TiltCardProps) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<number>(0);
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled.current) return;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        node.style.setProperty("--ry", `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        node.style.setProperty("--rx", `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
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
