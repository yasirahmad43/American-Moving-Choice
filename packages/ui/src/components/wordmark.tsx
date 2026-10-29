/** The owner's supplied national-map/truck logo, unchanged in both applications' public assets. */
import Image from "next/image";
import Link from "next/link";
import { cx } from "../cx";

export interface WordmarkProps {
  /** Wraps the lockup in a link (usually "/") named "American Moving Choice home". */
  href?: string;
  /** Dark surroundings use the same original artwork on its white brand tile. */
  tone?: "default" | "reversed";
  size?: "md" | "lg";
  className?: string;
}

export function Wordmark({ href, tone = "default", size = "md", className }: WordmarkProps) {
  const lockup = (
    <span
      className={cx(
        "relative inline-block shrink-0 overflow-hidden bg-white align-middle",
        size === "lg" ? "h-[5.75rem] w-[17.5rem] rounded-lg" : "h-[4.625rem] w-56 rounded-md",
        tone === "reversed" && "ring-1 ring-white/20",
        className,
      )}
    >
      <Image src="/brand/american-moving-choice-logo.png" alt="American Moving Choice"
        width={1774} height={887} sizes={size === "lg" ? "280px" : "224px"}
        className="absolute left-0 top-1/2 h-auto w-full -translate-y-1/2 object-contain" />
    </span>
  );
  if (!href) return lockup;
  return (
    <Link href={href} aria-label="American Moving Choice home" className="inline-flex min-h-11 items-center no-underline">
      {lockup}
    </Link>
  );
}
