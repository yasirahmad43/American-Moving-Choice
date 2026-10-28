import { requireMembership } from "@amc/server/auth";
import { listCompanyReviews, type CompanyReview } from "@amc/server/reviews-company";
import { AbsoluteDate, Alert, Card, Chip, EmptyState, Field, PageHeader, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import { ActionForm } from "@/components/portal/marketplace/action-form";
import { portalNavItem } from "@/lib/nav/portal";
import { reportAction, respondAction } from "./actions";

const item = portalNavItem("/portal/reviews");

export const metadata: Metadata = { title: item.label };

const TYPE_LABELS: Record<CompanyReview["reviewType"], string> = { quote_experience: "Quote experience", move_experience: "Move experience" };
const EVIDENCE_LABELS: Record<string, string> = {
  platform_inquiry: "Verified platform inquiry",
  verified_customer: "Verified customer",
  completed_move: "Verified completed move",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="text-[1.125rem] tracking-wider text-primary">
        {"★".repeat(rating)}
        <span className="text-border-strong">{"★".repeat(5 - rating)}</span>
      </span>
      <span className="tabular font-semibold">{rating} of 5</span>
    </span>
  );
}

function summary(reviews: CompanyReview[], type: CompanyReview["reviewType"]) {
  const published = reviews.filter((r) => r.status === "published" && r.reviewType === type);
  if (!published.length) return null;
  const mean = published.reduce((sum, r) => sum + r.rating, 0) / published.length;
  return { mean: mean.toFixed(1), count: published.length };
}

export default async function ReviewsPage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const reviews = await listCompanyReviews({ userId: user.id, companyId: membership.companyId });

  return (
    <div className="grid gap-6">
      <PageHeader
        title={item.label}
        description="Reviews of your company, with your public responses. You can't edit or delete reviews; you can respond, or report one that breaks the guidelines."
        size="portal"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {(["quote_experience", "move_experience"] as const).map((type) => {
          const s = summary(reviews, type);
          return (
            <Card key={type} title={TYPE_LABELS[type]} titleAs="h2">
              {s ? (
                <p>
                  <span className="type-h3 tabular">{s.mean}</span> <span className="text-text-2">average from</span>{" "}
                  <span className="tabular">{s.count}</span> <span className="text-text-2">published {s.count === 1 ? "review" : "reviews"}</span>
                </p>
              ) : (
                <p className="text-text-2">No published reviews yet.</p>
              )}
            </Card>
          );
        })}
      </div>
      <Alert tone="info" role="none">
        To collect move reviews, mark a purchased request Booked or Completed and choose “Ask for a move review” on its page. American Moving Choice sends every
        invitation, never the company.
      </Alert>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Customers whose requests you bought are invited to review their quote experience a few days after purchase." />
      ) : (
        <ul className="grid gap-4" aria-label="Reviews">
          {reviews.map((review) => (
            <li key={review.id}>
              <Card as="article" aria-labelledby={`review-${review.id}`}>
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="neutral">{TYPE_LABELS[review.reviewType]}</Chip>
                    <Chip tone="info">{EVIDENCE_LABELS[review.evidenceLevel] ?? review.evidenceLevel}</Chip>
                    {review.status === "pending" ? <Chip tone="warning">Waiting for moderation</Chip> : null}
                  </div>
                  <h2 id={`review-${review.id}`} className="type-h4">
                    {review.title ?? "Review"}
                  </h2>
                  <Stars rating={review.rating} />
                  {review.body ? <p className="whitespace-pre-line">{review.body}</p> : null}
                  <p className="type-small text-text-3">
                    {review.reviewerDisplayName}
                    {review.originState && review.destState ? ` · ${review.originState} to ${review.destState}` : ""} ·{" "}
                    {review.publishedAt ? (
                      <>
                        Published <AbsoluteDate value={review.publishedAt} />
                      </>
                    ) : (
                      <>
                        Submitted <AbsoluteDate value={review.createdAt} />
                      </>
                    )}
                  </p>

                  {review.response ? (
                    <div className="rounded-control border-l-4 border-l-primary bg-surface-2 px-4 py-3">
                      <p className="type-small font-semibold">Your response</p>
                      <p className="whitespace-pre-line">{review.response.body}</p>
                    </div>
                  ) : null}

                  {review.status === "published" ? (
                    <details>
                      <summary className="cursor-pointer font-semibold">{review.response ? "Edit your response" : "Respond publicly"}</summary>
                      <div className="mt-3">
                        <ActionForm action={respondAction} hidden={{ reviewId: review.id }} submitLabel="Publish response">
                          <Field
                            id={`response-${review.id}`}
                            label="Public response"
                            help="Everyone can read this. Don't include the customer's private details: no names beyond what the review shows, phone numbers, emails, addresses or job details."
                          >
                            <Textarea name="body" rows={4} maxLength={2000} defaultValue={review.response?.body ?? ""} />
                          </Field>
                        </ActionForm>
                      </div>
                    </details>
                  ) : null}

                  {review.openReport ? (
                    <p className="type-small text-text-2">
                      You reported this review on <AbsoluteDate value={review.openReport.createdAt} />. Moderation will tell you the outcome.
                    </p>
                  ) : (
                    <details>
                      <summary className="cursor-pointer font-semibold">Report this review</summary>
                      <div className="mt-3">
                        <ActionForm action={reportAction} hidden={{ reviewId: review.id }} submitLabel="Send report">
                          <Field id={`report-${review.id}`} label="What breaks the review guidelines?" help="Reviews are never removed for being negative.">
                            <Textarea name="reason" rows={3} maxLength={1000} />
                          </Field>
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
