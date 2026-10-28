import { AbsoluteDate, CheckIcon, Chip, cx } from "@amc/ui";
import { EVIDENCE_LABELS, REVIEW_TYPE_LABELS, REVIEW_TYPES, formatMean, type EvidenceLevel, type RatingSummary, type ReviewType } from "@amc/server/profiles";
import Link from "next/link";

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** Five small stars for a 1–5 value, hidden from screen readers (the text carries the value). */
export function Stars({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span aria-hidden="true" className={cx("inline-flex gap-0.5 text-primary", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill={i <= full ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />
        </svg>
      ))}
    </span>
  );
}

/** One line per experience for cards: "Moving experience 4.0 of 5 · 1 review", or the empty state. */
export function CompactRatings({ ratings }: { ratings: Record<ReviewType, RatingSummary> }) {
  const any = REVIEW_TYPES.some((t) => ratings[t].count > 0);
  if (!any) {
    return <p className="rounded-control border-[1.5px] border-dashed border-border-strong px-3 py-2 type-small text-text-2">No customer reviews yet</p>;
  }
  return (
    <ul className="grid gap-1 type-small">
      {REVIEW_TYPES.map((type) => {
        const r = ratings[type];
        return (
          <li key={type} className="flex flex-wrap items-center gap-x-2">
            <span className="text-text-2">{REVIEW_TYPE_LABELS[type]}:</span>
            {r.mean !== null ? (
              <>
                <Stars value={r.mean} />
                <span className="tabular font-semibold text-text">{formatMean(r.mean)} of 5</span>
                <span className="tabular text-text-2">· {plural(r.count, "review", "reviews")}</span>
              </>
            ) : (
              <span className="text-text-2">No reviews yet</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A full rating block for one experience (review methodology, "How are ratings calculated?"):
 * mean, count, distribution, latest date and the 12-month count. Without an eligible review it
 * shows no stars and no 0.0.
 */
export function RatingBlock({ summary, headingId }: { summary: RatingSummary; headingId: string }) {
  const label = REVIEW_TYPE_LABELS[summary.reviewType];
  return (
    <section aria-labelledby={headingId} className="grid content-start gap-3 rounded-card border border-border bg-surface p-5">
      <h3 id={headingId} className="type-h4 text-text">
        {label}
      </h3>
      {summary.mean === null ? (
        <p className="rounded-control border-[1.5px] border-dashed border-border-strong px-3 py-3 text-text-2">
          {summary.reviewType === "move_experience"
            ? "No reviews of the move itself yet. Only reviews with checked evidence of a completed move count here."
            : "No reviews of the quote and sales experience yet."}
        </p>
      ) : (
        <>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="tabular text-[2rem] leading-none font-bold text-text">{formatMean(summary.mean)}</span>
            <span className="grid gap-0.5">
              <Stars value={summary.mean} />
              <span className="type-small text-text-2">
                out of 5, from <span className="tabular">{plural(summary.count, "eligible review", "eligible reviews")}</span>
              </span>
            </span>
          </p>
          <table className="w-full type-small">
            <caption className="sr-only">How the {plural(summary.count, "review", "reviews")} spread across 1 to 5 stars</caption>
            <tbody>
              {[5, 4, 3, 2, 1].map((stars) => {
                const n = summary.distribution[stars - 1]!;
                const share = summary.count ? Math.round((n / summary.count) * 100) : 0;
                return (
                  <tr key={stars}>
                    <th scope="row" className="w-16 py-0.5 pr-2 text-left font-normal text-text-2 whitespace-nowrap">
                      {stars} {stars === 1 ? "star" : "stars"}
                    </th>
                    <td className="py-0.5">
                      <span aria-hidden="true" className="block h-2 rounded-pill bg-surface-3">
                        <span className="block h-2 rounded-pill bg-primary" style={{ width: `${share}%` }} />
                      </span>
                    </td>
                    <td className="w-10 py-0.5 pl-2 text-right tabular text-text">{n}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="type-small text-text-2">
            Latest review {summary.latestAt ? <AbsoluteDate value={summary.latestAt} month="long" /> : null} ·{" "}
            <span className="tabular">{plural(summary.last12Months, "review", "reviews")}</span> in the last 12 months
          </p>
        </>
      )}
    </section>
  );
}

const labelTone: Record<EvidenceLevel, "neutral" | "info" | "success"> = {
  platform_inquiry: "neutral",
  verified_customer: "info",
  completed_move: "success",
};

/** Review evidence label with its definition and a link to the methodology (VD §9.4). */
export function EvidenceLabel({ level }: { level: EvidenceLevel }) {
  const { label, definition } = EVIDENCE_LABELS[level];
  return (
    <span className="grid gap-1">
      <span>
        <Chip tone={labelTone[level]} icon={level === "completed_move" ? <CheckIcon size={14} /> : undefined}>
          {label}
        </Chip>
      </span>
      <span className="type-small text-text-2">
        {definition}{" "}
        <Link href="/review-methodology/" className="link">
          How reviews are checked
        </Link>
      </span>
    </span>
  );
}
