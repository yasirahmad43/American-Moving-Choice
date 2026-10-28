/**
 * The draft banner on every content and policy page (build plan §8): the page's review status,
 * and the named author and reviewer, or a pending note while they aren't named (site
 * architecture §7.2; content/README.md §8 item 3).
 */
import { WarningIcon } from "@amc/ui";

const STATUS_LABELS: Record<string, string> = {
  "draft-v0": "Draft v0",
  draft: "Draft",
  approved: "Approved",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/[-_]/g, " ");
}

export interface DraftBannerProps {
  status: string;
  author: string | null;
  reviewer: string | null;
  /** Shown only for pages with data blocks. */
  dataOwner?: string | null;
  showDataOwner?: boolean;
  /** What the page waits on, in one line (for pages written in TSX). */
  waitingOn?: string;
  aiDrafted?: boolean;
}

function Person({ role, name }: { role: string; name: string | null }) {
  return (
    <span>
      {role}: {name ? <strong className="font-semibold">{name}</strong> : <span className="token-pending">pending: not yet named</span>}
    </span>
  );
}

export function DraftBanner({ status, author, reviewer, dataOwner = null, showDataOwner = false, waitingOn, aiDrafted }: DraftBannerProps) {
  const approved = status === "approved";
  return (
    <section
      aria-label="Page status"
      className="flex gap-3 rounded-control border border-border border-l-4 border-l-warning bg-warning-bg px-4 py-3 text-text"
    >
      <WarningIcon size={20} className="mt-0.5 shrink-0 text-warning" />
      <div className="grid min-w-0 gap-1 type-small">
        <p>
          <strong className="font-semibold">{statusLabel(status)}{approved ? "." : ": not approved for publication."}</strong>{" "}
          {approved ? null : (waitingOn ?? "This page waits on owner and counsel review; its review notes show what is still open.")}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-text-2">
          <Person role="Author" name={author} />
          <Person role="Reviewer" name={reviewer} />
          {showDataOwner ? <Person role="Data owner" name={dataOwner} /> : null}
          {aiDrafted ? <span>First drafted with AI</span> : null}
        </p>
      </div>
    </section>
  );
}
