import { CHANNEL_LABELS, MOVE_SIZE_LABELS } from "@amc/core/src/survey";
import { requestMeta } from "@amc/server/auth";
import { getRequestByToken, type ManagedRequest, type RequestStatus } from "@amc/server/leads";
import { Alert, Card, Container, EmptyState, LinkButton, StatusPill, formatAbsoluteDate, type StatusTone } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { WithdrawForm } from "@/components/survey/withdraw-form";
import { withdrawAction } from "./actions";

export const metadata: Metadata = {
  title: "Manage Your Request",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  // The token is in the path: never send it to another site in a Referer header.
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

const STATUS: Record<RequestStatus, { label: string; tone: StatusTone; explain: (r: ManagedRequest) => string }> = {
  received: {
    label: "Request received",
    tone: "info",
    explain: () => "Your move details and contact preferences are saved. You can review or withdraw your request here.",
  },
  open: {
    label: "Open",
    tone: "info",
    explain: (r) => `Participating companies can receive your request until ${formatAbsoluteDate(r.expiresAt, { withTime: true, month: "long" })}, up to ${r.limit === 1 ? "1 mover" : `${r.limit} movers`}.`,
  },
  in_review: {
    label: "Being checked",
    tone: "warning",
    explain: () => "We're checking your request before participating companies can receive it.",
  },
  sold_out: {
    label: "Complete",
    tone: "success",
    explain: (r) => `Your chosen limit of ${r.limit === 1 ? "1 mover" : `${r.limit} movers`} has been reached. No additional mover can receive your contact details through this request.`,
  },
  closed: {
    label: "Closed",
    tone: "neutral",
    explain: () => "The contact period for this request has ended. No additional movers can receive your contact details through it.",
  },
  withdrawn: {
    label: "Withdrawn",
    tone: "neutral",
    explain: (r) => `You withdrew this request${r.withdrawnAt ? ` on ${formatAbsoluteDate(r.withdrawnAt, { month: "long" })}` : ""}. No additional movers can receive your contact details through it.`,
  },
};

/** /my-request/[token]/ (build plan §7.2, §11 S2): status, contact preferences and withdrawal. Noindex. */
export default async function ManageRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { ip } = await requestMeta();
  const result = await getRequestByToken(token, { ip });

  if (!result.ok) {
    return (
      <Container size="reading" className="grid gap-6 py-8 sm:py-12">
        <h1 className="type-display-l text-text">Manage your request</h1>
        {result.reason === "rate_limited" ? (
          <Alert tone="error" title="Too many attempts">
            Too many requests came from your connection. Wait 15 minutes, then open the link from your email again.
          </Alert>
        ) : (
          <EmptyState
            title="We can't find this request"
            description="Check that you opened the full link from your confirmation email. Links can't be guessed or recovered from a reference number."
            action={
              <LinkButton href="/get-quotes/" variant="secondary">
                Start a quote request
              </LinkButton>
            }
          />
        )}
      </Container>
    );
  }

  const r = result.value;
  const status = STATUS[r.status];
  return (
    <Container size="reading" className="grid gap-8 py-8 sm:py-12">
      <header className="grid gap-3">
        <p className="type-overline text-text-2">Your request</p>
        <h1 className="type-display-l text-text">
          Request <span className="tabular">{r.referenceCode}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          <span className="type-small text-text-2 tabular">Sent {formatAbsoluteDate(r.submittedAt, { withTime: true, month: "long" })}</span>
        </div>
        <p className="text-text">{status.explain(r)}</p>
      </header>

      <Card contentInset="card" as="section" title="Your move" titleAs="h2">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-text">Route</dt>
          <dd className="text-text-2">
            {r.route.originCity}, {r.route.originState} to {r.route.destCity}, {r.route.destState}
          </dd>
          {r.moveDate ? (
            <>
              <dt className="font-semibold text-text">Date</dt>
              <dd className="tabular text-text-2">
                {r.moveDateFlexible ? "From " : ""}
                {formatAbsoluteDate(r.moveDate, { month: "long" })}
              </dd>
            </>
          ) : null}
          {r.moveSize ? (
            <>
              <dt className="font-semibold text-text">Size</dt>
              <dd className="text-text-2">{MOVE_SIZE_LABELS[r.moveSize]}</dd>
            </>
          ) : null}
          <dt className="font-semibold text-text">Your contact methods</dt>
          <dd className="text-text-2">{r.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}</dd>
          <dt className="font-semibold text-text">Maximum movers who may contact you</dt>
          <dd className="tabular text-text-2">{r.limit}</dd>
        </dl>
        {r.joined ? (
          <p className="mt-4 type-small text-text-2">
            You sent more than one request for this route, so they count as one. The lowest number you chose applies.
          </p>
        ) : null}
      </Card>

      <Card contentInset="card" as="section" title="What happens next" titleAs="h2">
        <p className="text-text-2">Up to {r.limit} participating moving {r.limit === 1 ? "company" : "companies"} may contact you using the methods you chose. Each company will identify itself when it contacts you.</p>
        {r.buyerCount > 0 ? <p className="mt-3 type-small text-text-2">{r.buyerCount} {r.buyerCount === 1 ? "company has" : "companies have"} received your request.</p> : null}
      </Card>

      {r.canWithdraw ? (
        <Card contentInset="card" as="section" title="Withdraw your request" titleAs="h2">
          <p className="mb-4 text-text">
            Withdrawing stops additional movers from receiving your contact details through this request. We tell movers that already received your details
            to stop contacting you. It can't take back details a mover already received.
          </p>
          <WithdrawForm action={withdrawAction.bind(null, token)} buyers={r.buyerCount} />
        </Card>
      ) : null}

      <p className="type-small text-text-2">
        Unexpected contact about your move?{" "}
        <Link href="/report-a-concern/" className="link">
          Report a concern
        </Link>
        . Keep this page's link private: anyone who has it can see and withdraw your request.
      </p>
    </Container>
  );
}
