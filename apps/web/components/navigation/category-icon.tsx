import type { ReactNode, SVGProps } from "react";

/** A distinct, lightweight visual cue for each chapter of the public moving library. */
export function CategoryIcon({ family, ...props }: { family: string } & SVGProps<SVGSVGElement>) {
  const drawing: Record<string, ReactNode> = {
    state: <><path d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2V5Z" /><path d="M9 3v16M15 5v16" /></>,
    city: <><path d="M3 21h18M5 21V9h6v12M11 21V3h8v18M7 12h1M7 16h1M14 7h2M14 11h2M14 15h2" /></>,
    route: <><circle cx="5" cy="18" r="2" /><circle cx="19" cy="5" r="2" /><path d="M5 16V9a4 4 0 0 1 4-4h8M13 11l3 3-3 3M8 14h8" /></>,
    service: <><path d="m3 7 9-4 9 4-9 4-9-4ZM3 7v10l9 4 9-4V7M12 11v10M7 5l10 4" /></>,
    cost: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 7h8M8 11h1M15 11h1M8 15h1M15 15h1M8 18h1M15 18h1" /></>,
    question: <><path d="M7 19 3 21l1-5a9 9 0 1 1 3 3Z" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 16h.01" /></>,
    planning: <><rect x="5" y="4" width="15" height="17" rx="2" /><path d="M9 4V2M16 4V2M8 10l1 1 2-2M13 10h4M8 16l1 1 2-2M13 16h4" /></>,
    zip: <><path d="M5 4h14l2 4v12H3V8l2-4ZM3 8h18M9 8v5l3-2 3 2V8" /></>,
    page: <><path d="M6 3h9l4 4v14H6V3ZM15 3v5h4M9 12h7M9 16h7" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{drawing[family] ?? drawing.page}</svg>;
}
