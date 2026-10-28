/**
 * Editorial section header: a tracked overline, a display heading kept to two or three lines by a
 * wide measure, an optional lede and an optional action aligned to the right on desktop.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface SectionHeaderProps {
  id?: string;
  overline?: ReactNode;
  title: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
  lede?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "band";
  size?: "xl" | "l";
  className?: string;
}

export function SectionHeader({ id, overline, title, titleAs: Heading = "h2", lede, action, align = "left", tone = "default", size = "l", className }: SectionHeaderProps) {
  const band = tone === "band";
  return (
    <div className={cx("grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end", align === "center" && "justify-items-center text-center md:grid-cols-1", className)}>
      <div className={cx("grid gap-3", align === "center" ? "max-w-[46rem]" : "max-w-[52rem]")}>
        {overline ? (
          <p className={cx("flex items-center gap-3 type-overline", band ? "text-on-band-2" : "text-text-2", align === "center" && "justify-center")}>
            <span aria-hidden="true" className={cx("h-px w-8", band ? "bg-on-band-2" : "bg-brand-red")} />
            {overline}
          </p>
        ) : null}
        <Heading id={id} className={cx(size === "xl" ? "type-display-xl" : "type-display-l", band ? "text-on-band" : "text-text")}>
          {title}
        </Heading>
        {lede ? <p className={cx("type-lede max-w-[58ch]", band ? "text-on-band-2" : "text-text-2", align === "center" && "mx-auto")}>{lede}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-3 md:justify-end">{action}</div> : null}
    </div>
  );
}
