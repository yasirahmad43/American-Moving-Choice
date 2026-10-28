import type { CSSProperties } from "react";

/**
 * Scroll progress line (pass 2): a 3px navy-to-red line across the top of the page. The
 * MotionProvider scrubs its --progress custom property with ScrollTrigger; without it the line
 * stays at zero width and costs nothing.
 */
export function ScrollProgress() {
  return <div className="scroll-progress" data-scroll-progress="" aria-hidden="true" />;
}

/**
 * A count that the MotionProvider animates from zero when it scrolls into view. Server-rendered
 * with its final value, so the number is correct without JavaScript. Never use it for money
 * (VD §6: money is never animated); it is for counts such as pages, ZIP codes and movers.
 */
export function Counter({ value, className, suffix = "" }: { value: number; className?: string; suffix?: string }) {
  return (
    <span className={className}>
      <span data-counter={value} data-counter-suffix={suffix || undefined} aria-hidden="true">{value.toLocaleString("en-US")}{suffix}</span>
      <span className="sr-only">{value.toLocaleString("en-US")}{suffix}</span>
    </span>
  );
}

/**
 * Splits a heading into lines the hero reveals one by one (depth.css .split-line). Line breaks
 * come from "\n" in the string; each line is a block, so a very narrow viewport may still wrap
 * within a line. Screen readers read the heading as one string.
 */
export function SplitLines({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <>
      {lines.map((line, index) => (
        <span key={index} className={className ? `split-line ${className}` : "split-line"} style={{ "--i": index } as CSSProperties}>
          <span>{line} </span>
        </span>
      ))}
    </>
  );
}
