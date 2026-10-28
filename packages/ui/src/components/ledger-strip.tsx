/**
 * Route "ledger" strip: evidence rows with tabular figures and absolute dates, the visual spine
 * of the brand (VD §1). Each row names what was checked, the source and when. Rows carry no
 * invented data: callers pass real checks or rows labeled as a sample.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";
import { CheckCircleIcon, InfoIcon, RouteMark, WarningIcon } from "../icons";

export interface LedgerRow {
  label: ReactNode;
  value: ReactNode;
  /** Source or official record. */
  source?: ReactNode;
  /** Absolute date, already formatted ("Oct 27, 2026"). */
  when?: ReactNode;
  status?: "pass" | "info" | "warn";
}

export interface LedgerStripProps {
  title?: ReactNode;
  /** "Sample" label shown when the rows illustrate the format rather than a real company. */
  sampleLabel?: ReactNode;
  rows: LedgerRow[];
  /** Origin → destination shown in the strip's header. */
  route?: { from: ReactNode; to: ReactNode };
  className?: string;
}

const statusIcon = {
  pass: <CheckCircleIcon size={18} className="text-icon-success" />,
  info: <InfoIcon size={18} className="text-info-text" />,
  warn: <WarningIcon size={18} className="text-icon-warning" />,
};

export function LedgerStrip({ title, sampleLabel, rows, route, className }: LedgerStripProps) {
  return (
    <div className={cx("min-w-0 overflow-hidden rounded-card border border-border bg-surface shadow-e1", className)}>
      {(title || route || sampleLabel) && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border bg-surface-2 px-5 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {route ? (
              <p className="flex items-center gap-2 font-semibold text-text">
                <span>{route.from}</span>
                <RouteMark size={14} />
                <span>{route.to}</span>
              </p>
            ) : null}
            {title ? <p className="type-overline text-text-2">{title}</p> : null}
          </div>
          {sampleLabel ? <span className="rounded-tag bg-surface-3 px-2 py-0.5 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-text-2">{sampleLabel}</span> : null}
        </div>
      )}
      <dl className="grid">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-border px-5 py-3.5 first:border-t-0 sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center">
            <span className="pt-0.5 sm:pt-0" aria-hidden="true">
              {statusIcon[row.status ?? "pass"]}
            </span>
            <dt className="font-semibold text-text">{row.label}</dt>
            <dd className="col-start-2 m-0 text-text-2 sm:col-start-auto">
              {row.value}
              {row.source ? <span className="block type-small text-text-3">{row.source}</span> : null}
            </dd>
            {row.when ? <dd className="col-start-2 m-0 type-small tabular text-text-3 sm:col-start-auto sm:text-right">{row.when}</dd> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
