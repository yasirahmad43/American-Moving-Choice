import { requireMembership } from "@amc/server/auth";
import { CLAIM_REASONS, affectsBalance, getBillingOverview, type ClaimRow, type LedgerRow, type ReceiptRow, type RefundRow } from "@amc/server/billing";
import { formatAuthorizationTime, getAuthorizationText, listPaymentMethods, renderAuthorization, stripePublishableKey } from "@amc/server/payments";
import { AbsoluteDate, Alert, Card, Checkbox, Chip, Money, PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/portal/marketplace/action-form";
import { CLAIM_STATUS_LABELS, LEDGER_KIND_LABELS, label, ordinal } from "@/components/portal/marketplace/labels";
import { StripeCardForm } from "@/components/portal/marketplace/stripe-card-form";
import { portalNavItem } from "@/lib/nav/portal";
import { removePaymentMethodAction, saveDemoCardAction } from "./actions";

const item = portalNavItem("/portal/billing");

export const metadata: Metadata = { title: item.label };

export default async function BillingPage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const actor = { userId: user.id, companyId: membership.companyId };
  const canManage = membership.role === "owner" || membership.role === "billing";
  const [overview, methods, authorization] = await Promise.all([getBillingOverview(actor), listPaymentMethods(membership.companyId), getAuthorizationText()]);
  const publishableKey = stripePublishableKey();
  const now = new Date();
  const authorizationShown = renderAuthorization(authorization.body, {
    userName: user.fullName?.trim() || user.email,
    companyLegalName: membership.companyName,
    timestamp: formatAuthorizationTime(now),
  });
  const available = overview.balanceCents - overview.heldCents;
  const hasDemoCard = methods.some((m) => m.provider === "demo");

  return (
    <div className="grid gap-6">
      <PageHeader title={item.label} description="Your payment method, account credit, charges, receipts and quality claims." size="portal" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Payment method" titleAs="h2">
          <div className="grid gap-4">
            {methods.length ? (
              <ul className="grid gap-3">
                {methods.map((m) => (
                  <li key={m.id} className="grid gap-2 rounded-control border border-border p-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular">
                        {m.brand ?? "Card"} •••• {m.last4 ?? "----"}
                      </span>
                      {m.expMonth && m.expYear ? <span className="type-small tabular text-text-2">Expires {String(m.expMonth).padStart(2, "0")}/{m.expYear}</span> : null}
                      {m.isDefault ? <Chip tone="info">Default</Chip> : null}
                      {m.provider === "demo" ? <Chip tone="demo">Demo card: no money moves</Chip> : null}
                    </p>
                    <p className="type-small text-text-2">
                      Authorized by {m.authorizedByName ?? "a team member"} on <AbsoluteDate value={m.authorizedAt} withTime /> (text version{" "}
                      <span className="font-mono">{m.authorizationTextVersion}</span>).
                    </p>
                    {m.authorizationRenderedText ? (
                      <details>
                        <summary className="cursor-pointer type-small font-semibold">Authorization text</summary>
                        <p className="mt-2 type-small text-text-2">{m.authorizationRenderedText}</p>
                      </details>
                    ) : null}
                    {canManage ? (
                      <ActionForm action={removePaymentMethodAction} hidden={{ paymentMethodId: m.id }} submitLabel="Remove" submitVariant="ghost" className="grid gap-2">
                        <p className="type-small text-text-3">Removing stops future charges; purchases already made stand.</p>
                      </ActionForm>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-2">No payment method saved. Account credit is used first; anything left is charged to this method.</p>
            )}

            {canManage && publishableKey ? (
              <StripeCardForm publishableKey={publishableKey} authorizationText={authorizationShown} shownAt={now.toISOString()} />
            ) : null}
            {canManage && !publishableKey && !hasDemoCard ? (
              <ActionForm action={saveDemoCardAction} hidden={{ shownAt: now.toISOString() }} submitLabel="Save demo card" submitVariant="primary">
                <Alert tone="info" role="none">
                  Preview build: card payments run in demo mode. The demo card is fictional and moves no money.
                </Alert>
                <Checkbox id="authorized" name="authorized" label={authorizationShown} />
                <p className="type-small text-text-3">
                  Draft authorization text for counsel and Stripe review (consent draft §9, version <span className="font-mono">{authorization.versionId}</span>).
                </p>
              </ActionForm>
            ) : null}
            {!canManage ? <p className="type-small text-text-3">Only the owner or a billing member can add or remove payment methods.</p> : null}
          </div>
        </Card>

        <Card title="Account credit" titleAs="h2">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="type-small text-text-3">Balance</dt>
              <dd className="type-h3 tabular">
                <Money cents={overview.balanceCents} />
              </dd>
            </div>
            <div>
              <dt className="type-small text-text-3">Available now</dt>
              <dd className="type-h3 tabular">
                <Money cents={available} />
              </dd>
              {overview.heldCents > 0 ? (
                <p className="type-small text-text-2">
                  <Money cents={overview.heldCents} /> is held by a purchase in progress.
                </p>
              ) : null}
            </div>
          </dl>
          <p className="mt-3 type-small text-text-2">
            Credit is spent automatically on your next purchases before your card is charged. It comes from shared-request credits, approved quality claims and adjustments.
            Proposed policy, pending owner approval: credits don&apos;t expire.
          </p>
        </Card>
      </div>

      <Table<LedgerRow> sortable
        caption="Ledger"
        rows={overview.ledger}
        rowKey={(r) => r.id}
        empty={<p className="text-text-2">No ledger entries yet.</p>}
        columns={[
          { key: "date", header: "Date", cell: (r) => <AbsoluteDate value={r.createdAt} withTime /> },
          { key: "kind", header: "Entry", cell: (r) => label(LEDGER_KIND_LABELS, r.kind) },
          { key: "route", header: "Request", cell: (r) => (r.purchaseId ? <Link className="link" href={`/portal/leads/${r.purchaseId}`}>{r.route ?? "Open"}</Link> : (r.note ?? "—")) },
          { key: "amount", header: "Amount", numeric: true, cell: (r) => <Money cents={r.amountCents} /> },
          { key: "effect", header: "Credit balance", cell: (r) => (affectsBalance(r.kind) ? (r.amountCents >= 0 ? "Adds credit" : "Uses credit") : "No effect (record of the price)") },
        ]}
      />

      <Table<ReceiptRow> sortable
        caption="Receipts"
        rows={overview.receipts}
        rowKey={(r) => r.purchaseId}
        empty={<p className="text-text-2">No purchases yet.</p>}
        columns={[
          { key: "date", header: "Date", cell: (r) => <AbsoluteDate value={r.purchasedAt} withTime /> },
          { key: "ref", header: "Request", cell: (r) => <Link className="link whitespace-nowrap" href={`/portal/leads/${r.purchaseId}`}>{r.referenceCode ?? r.route}</Link> },
          { key: "route", header: "Route", cell: (r) => r.route },
          { key: "type", header: "Type", cell: (r) => (r.leadType === "exclusive" ? "Exclusive" : `Shared, ${ordinal(r.position)} buyer`) },
          { key: "list", header: "Your price", numeric: true, cell: (r) => <Money cents={r.listPriceCents} /> },
          { key: "charged", header: "Charged", numeric: true, cell: (r) => <Money cents={r.chargedCents} /> },
          { key: "credit", header: "From credit", numeric: true, cell: (r) => <Money cents={r.creditAppliedCents} /> },
          { key: "card", header: "To card", numeric: true, cell: (r) => <Money cents={r.cardAmountCents} /> },
          { key: "payment", header: "Payment", cell: (r) => r.paymentRef ?? "—" },
          { key: "refund", header: "Refunded", cell: (r) => (r.refundedAt ? <AbsoluteDate value={r.refundedAt} /> : "No") },
        ]}
      />

      <Table<ClaimRow> sortable
        caption="Quality claims"
        rows={overview.claims}
        rowKey={(r) => r.id}
        empty={
          <p className="text-text-2">
            No claims. To file one, open the purchased request within {overview.claimWindowHours} hours of buying it. Valid reasons:{" "}
            {CLAIM_REASONS.filter((r) => r.qualifies).map((r) => r.label.toLowerCase()).join("; ")}.
          </p>
        }
        columns={[
          { key: "date", header: "Filed", cell: (r) => <AbsoluteDate value={r.createdAt} /> },
          { key: "route", header: "Request", cell: (r) => <Link className="link" href={`/portal/leads/${r.purchaseId}`}>{r.route}</Link> },
          { key: "reason", header: "Reason", cell: (r) => CLAIM_REASONS.find((c) => c.code === r.reason)?.label ?? r.reason },
          { key: "status", header: "Status", cell: (r) => label(CLAIM_STATUS_LABELS, r.status) },
          { key: "decision", header: "Decision", cell: (r) => r.decision ?? "—" },
          { key: "refund", header: "Refund", numeric: true, cell: (r) => (r.refundAmountCents === null ? "—" : <Money cents={r.refundAmountCents} />) },
        ]}
      />

      {overview.refunds.length ? (
        <Table<RefundRow> sortable
          caption="Automatic refunds"
          rows={overview.refunds}
          rowKey={(r) => r.attemptId}
          columns={[
            { key: "date", header: "Date", cell: (r) => <AbsoluteDate value={r.createdAt} withTime /> },
            { key: "why", header: "Why", cell: () => "Your payment succeeded but the request was no longer available, so nothing was shared." },
            { key: "amount", header: "Amount", numeric: true, cell: (r) => <Money cents={r.amountCents} /> },
            { key: "status", header: "Status", cell: (r) => (r.status === "succeeded" ? "Refunded" : r.status === "failed" ? "Being retried" : "In progress") },
          ]}
        />
      ) : null}
    </div>
  );
}
