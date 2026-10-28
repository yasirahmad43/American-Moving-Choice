/**
 * One credential in a ledger (implications §4.2; VD §9.4): label, number in tabular figures,
 * status in words, the absolute check date and a link to the official record. A verified
 * credential without a check date or source link renders nothing: no claim without evidence.
 * Place rows inside a <dl>.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";
import { ExternalLinkIcon, IdCardIcon } from "../icons";
import { AbsoluteDate } from "./money";

export type CredentialStatus = "verified" | "rechecking" | "pending" | "lapsed";

const statusText: Record<CredentialStatus, string> = {
  verified: "Active",
  rechecking: "Re-check in progress",
  pending: "Not yet checked",
  lapsed: "Lapsed",
};

export interface CredentialRowProps {
  label: ReactNode;
  value: ReactNode;
  status: CredentialStatus;
  checkedAt?: Date | string | null;
  sourceUrl?: string | null;
  sourceLabel?: string;
  className?: string;
}

export function CredentialRow({ label, value, status, checkedAt, sourceUrl, sourceLabel = "Official FMCSA record", className }: CredentialRowProps) {
  if (status === "verified" && (!checkedAt || !sourceUrl)) return null;
  const external = sourceUrl ? /^https?:\/\//.test(sourceUrl) : false;
  return (
    <div className={cx("grid gap-1 border-b border-border py-3 sm:grid-cols-[minmax(8rem,12rem)_1fr] sm:gap-4", className)}>
      <dt className="type-small text-text-3">{label}</dt>
      <dd className="m-0 grid gap-1">
        <span className="tabular font-semibold text-text">{value}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 type-small text-text-2">
          <span className="inline-flex items-center gap-1.5">
            <IdCardIcon size={16} />
            {statusText[status]}
          </span>
          {checkedAt ? (
            <span>
              Last checked <AbsoluteDate value={checkedAt} />
            </span>
          ) : null}
          {sourceUrl && external ? (
            <a href={sourceUrl} className="link inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">
              {sourceLabel}
              <ExternalLinkIcon size={14} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </span>
      </dd>
    </div>
  );
}
