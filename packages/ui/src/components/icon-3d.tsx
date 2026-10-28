/**
 * 3D icons (pass 2): rendered PNGs from the open-source 3dicons set (realvjy, CC0 1.0), trimmed
 * and converted to WebP at 128 and 256px (apps/web/content/media/icons.json records the licence
 * and sources). Served from each app's /public/icons/3d/. Decorative by default (alt ""): the
 * text next to the icon carries the meaning. `float` adds a slow drift; the parent class
 * `icon3d-hover` lifts the icon when the card is hovered. Both collapse under reduced motion.
 */
import Image from "next/image";
import type { CSSProperties } from "react";
import { cx } from "../cx";

export const ICON_3D_NAMES = [
  "verified",
  "credentials",
  "ledger",
  "locked",
  "key",
  "calendar",
  "origin",
  "destination",
  "route",
  "box",
  "travel",
  "calculator",
  "price",
  "credits",
  "wallet",
  "dollar",
  "card",
  "chart",
  "star",
  "thumb-up",
  "chat",
  "phone",
  "phone-in",
  "mobile",
  "mail",
  "bell",
  "megaphone",
  "target",
  "flag",
  "rocket",
  "tools",
  "puzzle",
  "clock",
  "search",
  "settings",
  "folder",
  "bulb",
  "storage",
  "pin",
  "link",
] as const;

export type Icon3DName = (typeof ICON_3D_NAMES)[number];

export interface Icon3DProps {
  name: Icon3DName;
  /** Rendered size in CSS pixels (the 256px file is used above 128). */
  size?: number;
  /** Slow vertical drift; give siblings different `delay`s so they never move in step. */
  float?: boolean;
  /** Delay of the float loop, in seconds. */
  delay?: number;
  /** Meaningful alt text only when the icon is the sole carrier of meaning. */
  alt?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function iconSrc(name: Icon3DName, size: number): string {
  return `/icons/3d/${name}-${size > 128 ? 256 : 128}.webp`;
}

export function Icon3D({ name, size = 64, float = false, delay = 0, alt = "", priority = false, className, style }: Icon3DProps) {
  const file = size > 128 ? 256 : 128;
  return (
    <Image
      src={`/icons/3d/${name}-${file}.webp`}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      draggable={false}
      aria-hidden={alt ? undefined : true}
      data-float={float ? "true" : undefined}
      className={cx("icon3d select-none", className)}
      style={{ width: size, height: size, ...(delay ? ({ "--float-delay": `${delay}s` } as CSSProperties) : {}), ...style }}
    />
  );
}

/** A soft navy-tinted plate behind an icon, for tiles and empty states. */
export function IconPlate({ name, size = 56, tone = "surface", float, delay, className }: Icon3DProps & { tone?: "surface" | "navy" | "none" }) {
  return (
    <span
      className={cx(
        "relative inline-grid shrink-0 place-items-center rounded-[1.25rem]",
        tone === "surface" && "bg-[radial-gradient(60%_60%_at_50%_30%,rgba(6,49,103,0.08),transparent)] ring-1 ring-border/60",
        tone === "navy" && "bg-white/8 ring-1 ring-white/15",
        className,
      )}
      style={{ width: size * 1.5, height: size * 1.5 }}
    >
      <Icon3D name={name} size={size} float={float} delay={delay} />
    </span>
  );
}
