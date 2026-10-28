/**
 * Review notes for pages written in TSX (legal, help and B2B pages), matching the notes the
 * Markdown renderer makes from [Counsel: …] markers (content/README.md §3).
 *
 * Public visitors never see them: production builds render nothing, development builds render
 * them hidden until the URL carries ?review=1 (lib/review-mode.ts).
 */
import type { ReactNode } from "react";
import { NOTE_KINDS, type NoteKind } from "@/lib/content/markdown";
import { token as resolveToken } from "@/lib/content/pages";
import { REVIEW_NOTES_IN_HTML } from "@/lib/review-mode";

const LABELS: Record<NoteKind, string> = { counsel: "Counsel", owner: "Owner", data: "Data", verify: "Verify", build: "Build" };

/** An inline review note: <Note kind="counsel">counsel writes this section</Note>. */
export function Note({ kind, label, children }: { kind: NoteKind; label?: string; children: ReactNode }) {
  if (!REVIEW_NOTES_IN_HTML) return null;
  return (
    <mark className={`review-note review-note--${kind}`}>
      <span className="review-note__label">{label ?? LABELS[kind]}:</span> {children}
    </mark>
  );
}

/** A registry value (content/tokens.json), or its public-safe fallback while pending. */
export function Token({ k }: { k: string }) {
  const value = resolveToken(k);
  if (value.kind === "value") return <>{value.text}</>;
  if (REVIEW_NOTES_IN_HTML) return <span className="token-pending">{value.text}</span>;
  return <span className="token-public">{publicFallback(k)}</span>;
}

/** What a pending token says to the public: never "pending", never a placeholder box. */
export function publicFallback(key: string): string {
  if (key.startsWith("page.")) return "the American Moving Choice team";
  if (key.startsWith("org.")) return "to be announced";
  if (/^(cost\.(hub|result|dataset)\.|company\.)/.test(key)) return "not yet available";
  return "to be announced";
}

/** The legend for review notes, shown once per page that has any. */
export function ReviewLegend({ kinds }: { kinds?: NoteKind[] }) {
  if (!REVIEW_NOTES_IN_HTML) return null;
  const shown = kinds ? NOTE_KINDS.filter((item) => kinds.includes(item.kind)) : NOTE_KINDS;
  if (!shown.length) return null;
  return (
    <section aria-label="Review notes legend" className="review-only rounded-control border border-border bg-surface px-4 py-3 type-small">
      <p className="font-semibold text-text">Review notes on this page are for reviewers and never ship:</p>
      <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-[auto_1fr]">
        {shown.map((item) => (
          <div key={item.kind} className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 sm:contents">
            <dt>
              <mark className={`review-note review-note--${item.kind}`}>
                <span className="review-note__label">{item.label}</span>
              </mark>
            </dt>
            <dd className="text-text-2">{item.meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
