import { COST_MODEL_V1 } from "@amc/core";
import { requireMembership } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { statesList } from "@amc/server/geo";
import { getActiveRateCard, listRateCards, rateCardToFormValues } from "@amc/server/rates";
import { AbsoluteDate, Alert, Card, PageHeader, StatusPill, Table } from "@amc/ui";
import type { Metadata } from "next";
import { portalNavItem } from "@/lib/nav/portal";
import { RateCardForm } from "./rate-card-form";
import { RATE_CARD_ROLES } from "./shared";

const item = portalNavItem("/portal/rates");

export const metadata: Metadata = { title: item.label };

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - months);
  return date;
}

/** /portal/rates: the company's rate card, which feeds the public cost calculator (build plan §7.3). */
export default async function RateCardPage() {
  const { membership } = await requireMembership({ roles: RATE_CARD_ROLES });
  const [active, history] = await Promise.all([getActiveRateCard(membership.companyId), listRateCards(membership.companyId, 10)]);
  const stale = active ? active.createdAt < monthsAgo(COST_MODEL_V1.maxDataAgeMonths) : false;
  const methodUrl = `${env().WEB_URL}/moving-cost-calculator/method/`;

  return (
    <div className="grid gap-8">
      <PageHeader title={item.label} description={item.description} size="portal" />

      <Card title="How your rate card is used" titleAs="h2">
        <div className="grid gap-3 text-text">
          <p>
            The public moving cost calculator shows a planning range, never one figure, where at least {COST_MODEL_V1.minMovers} movers&apos; rate cards cover a
            move. It applies each mover&apos;s own rates to the same typical job (the medians of what movers state for that home size) and shows the{" "}
            {COST_MODEL_V1.percentileLow}th to {COST_MODEL_V1.percentileHigh}th percentile of the results. No single card is shown or named.
          </p>
          <p>
            Your card counts only while your company is approved, for moves that start in a state it covers, and for {COST_MODEL_V1.maxDataAgeMonths} months
            from the day you save it. For a picked service, it counts only if it prices that service.
          </p>
          <p>
            <strong>Your card never affects placement.</strong> It doesn&apos;t change where your company appears in our directory, on our location pages or in
            the list of movers a consumer sees before sending a request, and it doesn&apos;t change what you pay for requests.
          </p>
          <p>
            <a href={methodUrl} className="link">
              How the calculator works
            </a>{" "}
            has the formulas and thresholds.
          </p>
        </div>
      </Card>

      <section aria-labelledby="active-card" className="grid gap-3">
        <h2 id="active-card" className="type-h4 text-text">
          Your active card
        </h2>
        {active ? (
          <div className="grid gap-3">
            <p className="flex flex-wrap items-center gap-3 text-text" data-testid="active-card">
              <StatusPill tone={stale ? "warning" : "success"}>{stale ? "Too old to count" : "Active"}</StatusPill>
              <span>
                Saved on <AbsoluteDate value={active.createdAt} month="long" />
                {active.submittedByName ? ` by ${active.submittedByName}` : ""}. Covers {active.states.join(", ")}.
              </span>
            </p>
            {stale ? (
              <Alert tone="warning" title="Your card is more than 12 months old">
                It no longer counts toward any range. Check your rates and save the card again to bring it back.
              </Alert>
            ) : null}
          </div>
        ) : (
          <Alert tone="info" title="No rate card yet">
            Fill in the form below. Your rates count toward planning ranges once you save the card.
          </Alert>
        )}
        {membership.companyStatus !== "approved" ? (
          <Alert tone="info" role="none">
            Your company isn&apos;t approved yet, so your card doesn&apos;t count toward ranges until it is. You can still prepare it now.
          </Alert>
        ) : null}
      </section>

      <section aria-labelledby="edit-card" className="grid gap-4">
        <h2 id="edit-card" className="type-h4 text-text">
          {active ? "Update your rate card" : "Create your rate card"}
        </h2>
        <RateCardForm defaults={rateCardToFormValues(active)} states={statesList().map((s) => ({ code: s.code, name: s.name }))} />
      </section>

      <section aria-labelledby="card-history" className="grid gap-3">
        <h2 id="card-history" className="type-h4 text-text">
          History
        </h2>
        <Table sortable
          caption="Your rate cards, newest first"
          hideCaption
          rows={history}
          rowKey={(card) => card.id}
          empty="No rate cards yet."
          columns={[
            { key: "date", header: "Saved", cell: (card) => <AbsoluteDate value={card.createdAt} withTime /> },
            { key: "by", header: "Saved by", cell: (card) => card.submittedByName ?? "Not recorded" },
            { key: "states", header: "States", cell: (card) => card.states.join(", ") },
            {
              key: "status",
              header: "Status",
              cell: (card) => <StatusPill tone={card.status === "active" ? "success" : "neutral"}>{card.status === "active" ? "Active" : "Replaced"}</StatusPill>,
            },
          ]}
        />
      </section>
    </div>
  );
}
