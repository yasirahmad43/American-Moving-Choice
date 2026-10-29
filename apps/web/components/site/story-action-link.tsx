"use client";

import Link, { useLinkStatus } from "next/link";
import { useState } from "react";

function ActionContents({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return <>
    <span aria-hidden="true" style={{ display: "grid", minWidth: 0 }}>
      <span style={{ gridArea: "1 / 1", visibility: pending ? "hidden" : "visible" }}>{label}</span>
      <span style={{ gridArea: "1 / 1", visibility: pending ? "visible" : "hidden" }}>Opening page…</span>
    </span>
    <span aria-hidden="true" style={{ flex: "0 0 1.1em", textAlign: "right" }}>{pending ? "…" : "→"}</span>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{pending ? `${label}. Opening page.` : ""}</span>
  </>;
}

/** Only the small next-step set prefetches on pointer/keyboard intent, never entire guide catalogs. */
export function StoryActionLink({ href, label }: { href: string; label: string }) {
  const [intent, setIntent] = useState(false);
  return <Link href={href} aria-label={label} prefetch={intent ? true : false}
    onMouseEnter={() => setIntent(true)} onFocus={() => setIntent(true)}>
    <ActionContents label={label} />
  </Link>;
}
