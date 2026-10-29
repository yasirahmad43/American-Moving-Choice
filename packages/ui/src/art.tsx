/**
 * Inline brand art (VD §8, §10.1): abstract route maps and box textures only. No people, no
 * landmarks, no seals. These render anywhere (auth panels, empty states) without an asset file
 * and scale to any box. Everything is decorative (aria-hidden).
 */
import { cx } from "./cx";

/** An abstract route map: contour lines, a dashed route and the origin ring + destination dot. */
export function RouteMapArt({ className, tone = "navy", gradientId = "rm-glow" }: { className?: string; tone?: "navy" | "light"; gradientId?: string }) {
  const line = tone === "navy" ? "rgba(255,255,255,0.14)" : "rgba(6,49,103,0.12)";
  const route = tone === "navy" ? "rgba(220,230,244,0.85)" : "rgba(6,49,103,0.8)";
  const ring = tone === "navy" ? "#dce6f4" : "#063167";
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={cx("block h-full w-full", className)}>
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="20%" r="70%">
          <stop offset="0" stopColor={tone === "navy" ? "#9dc4ff" : "#063167"} stopOpacity={tone === "navy" ? 0.35 : 0.08} />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#${gradientId})`} />
      <g fill="none" stroke={line} strokeWidth="1.25">
        <path d="M-40 420 C120 380 180 300 300 330 S520 440 640 380 S780 280 860 320" />
        <path d="M-40 470 C110 430 190 350 310 380 S520 500 650 430 S780 330 860 370" />
        <path d="M-40 520 C100 480 200 400 320 430 S520 560 660 480 S790 380 860 420" />
        <path d="M-40 120 C120 90 190 160 320 130 S520 60 650 120 S770 200 860 150" />
        <path d="M-40 70 C110 40 200 110 330 80 S520 10 660 70 S770 150 860 100" />
        <path d="M-40 180 C130 150 200 220 330 190 S530 120 660 180 S770 260 860 210" />
        <path d="M-40 240 C130 210 210 280 340 250 S530 180 670 240 S770 320 860 270" />
      </g>
      <path d="M140 400 C260 300 360 320 440 250 S600 160 680 190" fill="none" stroke={route} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 12" />
      <circle cx="140" cy="400" r="12" fill="none" stroke={ring} strokeWidth="5" />
      <circle cx="680" cy="190" r="13" fill="#e0141c" />
      <circle cx="680" cy="190" r="26" fill="#e0141c" fillOpacity="0.18" />
    </svg>
  );
}

/** A quiet grid of "boxes" for empty states and card backdrops. */
export function BoxesArt({ className }: { className?: string }) {
  const cells: { x: number; y: number; o: number }[] = [];
  let seed = 7;
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      seed = (seed * 48271) % 2147483647;
      cells.push({ x, y, o: 0.08 + (seed % 100) / 400 });
    }
  }
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className={cx("block h-full w-full", className)}>
      {cells.map((cell, index) => (
        <rect key={index} x={cell.x * 50 + 6} y={cell.y * 50 + 6} width="38" height="38" rx="6" fill="#063167" fillOpacity={cell.o} />
      ))}
    </svg>
  );
}
