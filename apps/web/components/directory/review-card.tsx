import { AbsoluteDate } from "@amc/ui";
import { REVIEW_TYPE_LABELS, type PublicReview } from "@amc/server/profiles";
import { stateByCode } from "@amc/server/geo";
import { EvidenceLabel, Stars } from "./ratings";

const stateName = (code: string | null) => (code ? (stateByCode(code)?.name ?? code) : null);

/** One published review: experience, stars, evidence label, full date and any company response. */
export function ReviewCard({ review, companyName, headingLevel = "h3" }: { review: PublicReview; companyName: string; headingLevel?: "h3" | "h4" }) {
  const Heading = headingLevel;
  const from = stateName(review.originState);
  const to = stateName(review.destState);
  return (
    <article className="grid gap-3 rounded-card border border-border bg-surface p-5" aria-labelledby={`review-${review.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-overline text-text-2">{REVIEW_TYPE_LABELS[review.reviewType]}</p>
        <p className="type-small text-text-2">
          Published <AbsoluteDate value={review.publishedAt} month="long" />
        </p>
      </div>
      <Heading id={`review-${review.id}`} className="type-h4 text-text">
        {review.title ?? `${review.rating}-star review`}
      </Heading>
      <p className="flex items-center gap-2">
        <Stars value={review.rating} />
        <span className="tabular font-semibold text-text">{review.rating} of 5 stars</span>
      </p>
      {review.body ? <p className="max-w-[70ch] whitespace-pre-line text-text">{review.body}</p> : null}
      <p className="type-small text-text-2">
        {review.reviewerName}
        {from && to ? (from === to ? ` · Move within ${from}` : ` · Move from ${from} to ${to}`) : null}
      </p>
      <EvidenceLabel level={review.evidenceLevel} />
      {review.incentiveDisclosure ? <p className="type-small text-text-2">Incentive: {review.incentiveDisclosure}</p> : null}
      {review.response ? (
        <div className="grid gap-1 border-l-4 border-border-strong bg-surface-2 px-4 py-3">
          <p className="type-small font-semibold text-text">
            Response from {companyName} · <AbsoluteDate value={review.response.postedAt} month="long" />
          </p>
          <p className="max-w-[70ch] whitespace-pre-line text-text">{review.response.body}</p>
        </div>
      ) : null}
    </article>
  );
}
