import { requireMembership } from "@amc/server/auth";
import { STEP_TITLES, canManageCompany, getDashboard, type DashboardData } from "@amc/server/companies";
import { AbsoluteDate, Alert, COMPANY_STATUS_LABELS, Card, CompanyStatusPill, LinkButton, Money, PageHeader } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Dashboard" };

function NextStep({ data }: { data: DashboardData }) {
  const manager = canManageCompany(data.role);
  const { status } = data.company;
  const ask = (text: string) => (manager ? text : `${text} Ask an owner or manager on your team.`);
  let title: string;
  let body: ReactNode;
  let action: ReactNode = null;
  switch (status) {
    case "applied":
      title = data.application.completed === 0 ? "Start your application" : "Finish your application";
      body = (
        <p>
          {ask(
            `${data.application.completed} of ${data.application.total} steps saved. Next: ${STEP_TITLES[data.application.nextStep].toLowerCase()}. Your progress is kept between visits.`,
          )}
        </p>
      );
      if (manager) action = <LinkButton href="/portal/application">{data.application.completed === 0 ? "Start the application" : "Continue the application"}</LinkButton>;
      break;
    case "verifying":
      title = "We're checking your numbers";
      body = <p>We're looking up your USDOT and MC numbers in FMCSA's records. This usually takes a moment.</p>;
      if (manager) action = <LinkButton href="/portal/verification" variant="secondary">See the checks</LinkButton>;
      break;
    case "in_review":
      title = "A reviewer is looking at your application";
      body = (
        <p>
          The automated checks have run. A reviewer now confirms the results, calls the phone number on your FMCSA record and checks your insurance and state
          credentials. We'll email the owner when there's a decision.
        </p>
      );
      if (manager) action = <LinkButton href="/portal/verification" variant="secondary">See the checks</LinkButton>;
      break;
    case "rejected":
      title = "Your application wasn't accepted";
      body = <p>{data.history.at(-1)?.reason ?? "A reviewer couldn't accept the application."} {ask("You can fix the problem and submit again.")}</p>;
      if (manager) action = <LinkButton href="/portal/application?step=review" variant="secondary">Review and resubmit</LinkButton>;
      break;
    case "suspended":
      title = "New purchases are paused";
      body = (
        <p>
          {data.history.at(-1)?.reason ?? "Your company is suspended."} Your purchased requests, CRM history and invoices stay available. Contact us to resolve it.
        </p>
      );
      break;
    default:
      title = data.canPurchase ? "You're approved and can buy requests" : "You're approved, but purchases are paused";
      body = data.canPurchase ? (
        <p>Requests that match your coverage appear in the marketplace. Keep your coverage and credentials current.</p>
      ) : (
        <p>Something blocks purchases right now, such as an expired credential or a billing problem. Check your verification and billing pages.</p>
      );
      if (data.role !== "billing") action = <LinkButton href="/portal/marketplace">Open the marketplace</LinkButton>;
  }
  return (
    <Card title="Next step" titleAs="h2">
      <p className="type-h4 text-text">{title}</p>
      <div className="mt-2 text-text-2">{body}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

function Stat({ label, value, href, linkLabel }: { label: string; value: ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="rounded-control border border-border bg-surface p-4">
      <dt className="type-small font-semibold text-text-2">{label}</dt>
      <dd className="mt-1 type-h3 tabular text-text">{value}</dd>
      {href ? (
        <dd className="mt-1">
          <Link href={href} className="link type-small inline-flex min-h-11 items-center">
            {linkLabel}
          </Link>
        </dd>
      ) : null}
    </div>
  );
}

/** Portal dashboard: status timeline and next step; after approval, the key numbers. */
export default async function PortalDashboard({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { user, membership } = await requireMembership();
  const data = await getDashboard({ userId: user.id, companyId: membership.companyId });
  const { submitted } = await searchParams;
  const firstName = user.fullName?.split(" ")[0];
  const sales = data.role !== "billing";

  return (
    <div className="grid gap-6">
      <PageHeader
        size="portal"
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {data.company.legalName} <CompanyStatusPill status={data.company.status} />
            {data.company.usdot ? <span className="tabular text-text-3">USDOT {data.company.usdot}</span> : null}
          </span>
        }
      />

      {submitted === "in_review" ? (
        <Alert tone="success" title="Application submitted">
          We ran the automated FMCSA checks and your application is now with a reviewer. We've emailed the owner a confirmation.
        </Alert>
      ) : submitted === "rejected" ? (
        <Alert tone="error" title="Application not accepted">
          The automated checks found a problem that rules the application out. The reason is below, and we've emailed the owner.
        </Alert>
      ) : null}

      <NextStep data={data} />

      {data.stats ? (
        <section aria-labelledby="numbers-heading" className="grid gap-3">
          <h2 id="numbers-heading" className="type-h3 text-text">
            This month
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Requests available to you" value={data.stats.availableRequests} href={sales ? "/portal/marketplace" : undefined} linkLabel="Open the marketplace" />
            <Stat label="Requests bought this month" value={data.stats.purchasesThisMonth} href={sales ? "/portal/leads" : undefined} linkLabel="See purchased requests" />
            <Stat label="Spent this month" value={<Money cents={data.stats.spentThisMonthCents} />} />
            <Stat label="Credit balance" value={<Money cents={data.stats.creditBalanceCents} />} href={data.role !== "agent" ? "/portal/billing" : undefined} linkLabel="Billing and credits" />
          </dl>
        </section>
      ) : null}

      {data.expiringCredentials.length ? (
        <Alert tone="warning" role="none" title="Credentials expiring soon">
          <ul className="mt-1 grid gap-1">
            {data.expiringCredentials.map((c) => (
              <li key={c.id}>
                {c.label}: {c.expired ? "expired" : "expires"} <AbsoluteDate value={c.expiresOn} />
              </li>
            ))}
          </ul>
          <p className="mt-2">
            An expired credential pauses new purchases.{" "}
            {canManageCompany(data.role) ? (
              <Link href="/portal/verification" className="link">
                See your credentials
              </Link>
            ) : null}
          </p>
        </Alert>
      ) : null}

      <Card title="Status history" titleAs="h2" description="Every change to your company's status, oldest first.">
        {data.history.length ? (
          <ol className="grid gap-0">
            {data.history.map((event, n) => (
              <li key={n} className="relative grid gap-1 border-l-2 border-border pb-5 pl-5 last:pb-0">
                <span aria-hidden="true" className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-primary" />
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-text">{COMPANY_STATUS_LABELS[event.toStatus]}</span>
                  <span className="type-small text-text-3">
                    <AbsoluteDate value={event.at} withTime />
                  </span>
                </p>
                {event.reason ? <p className="type-small text-text-2">{event.reason}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-text-2">No status changes yet.</p>
        )}
      </Card>
    </div>
  );
}
