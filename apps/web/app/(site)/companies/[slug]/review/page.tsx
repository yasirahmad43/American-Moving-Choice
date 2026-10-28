import { Alert, Chip, Container } from "@amc/ui";
import { getInvitation } from "@amc/server/reviews-public";
import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX } from "@/components/directory/seo";
import { ReviewForm } from "./review-form";

/** Token-gated review form (site architecture §1.2 Utility row): noindex, never linked publicly. */
export const metadata: Metadata = { title: "Review a mover", robots: NOINDEX, referrer: "no-referrer" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const NOTICES = {
  invalid: {
    title: "This review link isn't valid",
    body: "Reviews can only be written from the single-use link in an invitation we sent you. Check that you opened the whole link from the email.",
  },
  used: { title: "This review link has already been used", body: "Each invitation link works once, so the review it was for has already been sent." },
  expired: { title: "This review link has expired", body: "Invitation links work for a limited time. If you think this is a mistake, contact us through Report a concern." },
} as const;

export default async function ReviewPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const lookup = await getInvitation(token, { markOpened: true });
  // A link only works on the profile of the company it was issued for.
  const status = lookup.status === "valid" && lookup.invitation.slug !== slug ? "invalid" : lookup.status;

  return (
    <Container size="reading" className="grid gap-6 section-pad">
      {status === "valid" && lookup.status === "valid" ? (
        <>
          <div className="grid gap-3">
            <p className="type-overline text-text-2">{lookup.invitation.reviewType === "move_experience" ? "Moving experience" : "Quote and sales experience"}</p>
            <h1 className="type-display-l text-text">Review {lookup.invitation.companyName}</h1>
            {lookup.invitation.isDemo ? (
              <div>
                <Chip tone="demo">Demo company: fictional</Chip>
              </div>
            ) : null}
            <p className="type-lede text-text-2">
              {lookup.invitation.reviewType === "move_experience"
                ? "Tell other people how the move itself went with this mover."
                : "Tell other people how this mover dealt with you before the move, from its first contact and estimate to the point you hired it, if you did. Please review it whether or not you hired it."}
            </p>
          </div>
          <ReviewForm token={token} reviewType={lookup.invitation.reviewType} companyName={lookup.invitation.companyName} slug={lookup.invitation.slug} />
        </>
      ) : (
        <>
          <h1 className="type-display-l text-text">{NOTICES[status as keyof typeof NOTICES].title}</h1>
          <Alert tone="info" role="none">
            {NOTICES[status as keyof typeof NOTICES].body}
          </Alert>
          <p className="flex flex-wrap gap-x-4">
            <Link href="/review-methodology/" className="link inline-flex min-h-11 items-center">
              How reviews work
            </Link>
            <Link href="/report-a-concern/" className="link inline-flex min-h-11 items-center">
              Report a concern
            </Link>
          </p>
        </>
      )}
    </Container>
  );
}
