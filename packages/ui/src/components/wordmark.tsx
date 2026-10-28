/**
 * Type-only lockup standing in for the official artwork (VD §4): a tracked "American" over a
 * heavy condensed "Moving Choice", with "Choice" in brand red (display red on dark and navy).
 * The production logo replaces it once a vector master exists.
 */
import Link from "next/link";
import { cx } from "../cx";

export interface WordmarkProps {
  /** Wraps the lockup in a link (usually "/") named "American Moving Choice home". */
  href?: string;
  /** "reversed" for navy bands: white with "Choice" in display red (6.13:1). */
  tone?: "default" | "reversed";
  size?: "md" | "lg";
  className?: string;
}

export function Wordmark({ href, tone = "default", size = "md", className }: WordmarkProps) {
  const lockup = (
    <span
      className={cx(
        "inline-flex flex-col font-display leading-[0.92]",
        tone === "reversed" ? "text-on-band" : "text-wordmark",
        className,
      )}
    >
      <span className={cx("font-extrabold uppercase [font-stretch:100%]", size === "lg" ? "text-xs tracking-[0.44em]" : "text-[0.625rem] tracking-[0.44em]")}>
        American
      </span>
      <span className={cx("font-black uppercase [font-stretch:70%]", size === "lg" ? "text-[1.875rem]" : "text-[1.375rem]")}>
        Moving <span className={tone === "reversed" ? "text-[#ff5a5f]" : "text-display-red"}>Choice</span>
      </span>
    </span>
  );
  if (!href) return lockup;
  return (
    <Link href={href} aria-label="American Moving Choice home" className="inline-flex min-h-11 items-center no-underline">
      {lockup}
    </Link>
  );
}
