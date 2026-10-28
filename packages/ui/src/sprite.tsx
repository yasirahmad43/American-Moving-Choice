/**
 * 2D line icon sprite (pass 2): a matching set of thin-line glyphs for small UI (table actions,
 * chips, nav, meta lines), authored to the same 24px grid and 1.75px round strokes as icons.tsx.
 * Render <IconSprite /> once per page (the app shells do) and draw with <LineIcon name="..." />,
 * which references a symbol by id, so each glyph's path is in the HTML exactly once.
 */
import type { SVGProps } from "react";

export const LINE_ICON_NAMES = [
  "truck",
  "box",
  "map-pin",
  "route",
  "calendar",
  "home",
  "phone",
  "mail",
  "money",
  "ledger",
  "star",
  "clipboard",
  "storage",
  "piano",
  "dispatch",
  "search",
  "filter",
  "sort",
  "download",
  "edit",
  "eye",
  "trash",
  "check",
  "warning",
  "info",
  "lock",
  "unlock",
  "clock",
  "chart",
  "users",
  "settings",
  "external",
  "arrow-right",
  "chevron-down",
  "grid",
  "list",
  "sparkle",
  "shield-off",
] as const;

export type LineIconName = (typeof LINE_ICON_NAMES)[number];

const PATHS: Record<LineIconName, string> = {
  truck: "M3 7h10v9H3zM13 10h4l3 3v3h-7zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  box: "M3.5 8 12 4l8.5 4v8L12 20l-8.5-4zM3.5 8 12 12l8.5-4M12 12v8",
  "map-pin": "M12 21s-6-5.2-6-10.5a6 6 0 0 1 12 0C18 15.8 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  route: "M5 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 15h4a3 3 0 0 0 3-3V9h3",
  calendar: "M3.5 5h17v15h-17zM3.5 9.5h17M8 3v4M16 3v4",
  home: "M4 11 12 4l8 7v9h-5v-5h-6v5H4z",
  phone: "M5 4h4l1.5 4-2 1.5a11 11 0 0 0 6 6L16 13.5l4 1.5v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z",
  mail: "M3.5 6h17v12h-17zM3.5 7l8.5 6 8.5-6",
  money: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10h.01M18 14h.01",
  ledger: "M5 3h14v18H5zM8 8h8M8 12h8M8 16h5",
  star: "m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z",
  clipboard: "M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12l2 2 4-4",
  storage: "M4 5h16v6H4zM4 13h16v6H4zM8 8h.01M8 16h.01",
  piano: "M3 7h18v10H3zM7 7v6M10 7v6M14 7v6M17 7v6",
  dispatch: "M4 12h8M4 7h12M4 17h6M14 15l3 3 4-6",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8",
  filter: "M4 6h16l-6 7v5l-4 2v-7z",
  sort: "M8 4v16M8 4 5 7M8 4l3 3M16 20V4M16 20l3-3M16 20l-3-3",
  download: "M12 4v11M12 15l-4-4M12 15l4-4M4 19h16",
  edit: "M4 20h4l11-11-4-4L4 16zM13 7l4 4",
  eye: "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  warning: "M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0ZM12 9.5v4M12 17h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.5h.01",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3M12 15v2",
  unlock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 7.5-2M12 15v2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  chart: "M4 20V9M10 20V4M16 20v-8M22 20H2",
  users: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-4-5.7",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  external: "M14 4h6v6M20 4 11 13M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "chevron-down": "m6 9 6 6 6-6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2",
  "shield-off": "M4 4l16 16M12 3 5 6v6c0 2.2 1 4.2 2.6 5.8M19 6v6c0 3.5-2.6 6.5-7 8.5",
};

/** Place once per page, before any LineIcon. Hidden, zero-size. */
export function IconSprite() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        {LINE_ICON_NAMES.map((name) => (
          <symbol key={name} id={`amc-${name}`} viewBox="0 0 24 24">
            <path d={PATHS[name]} />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

export type LineIconProps = SVGProps<SVGSVGElement> & { name: LineIconName; size?: number };

/** A line glyph from the sprite. Decorative (aria-hidden); pair it with text. */
export function LineIcon({ name, size = 18, ...rest }: LineIconProps) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      <use href={`#amc-${name}`} />
    </svg>
  );
}
