import { randomUUID } from "node:crypto";
import { DISPUTE_STATUSES, LEDGER_KINDS, LEDGER_KIND_LABELS, getRefundQuote, listClaims, listCompanies, listDisputes, listLedger, listProviderRefunds, isAdminError } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { isUuid } from "@amc/server/db";
import { Alert, Card, Field, Input, Money, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { FilterBar, FilterInput, FilterSelect, LinkTabs, Mono, Pager, SectionTitle, ShortId, Status, When, humanize, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { adjustCreditAction, claimDecisionAction, createDisputeAction, refundAction, retryProviderRefundAction, updateDisputeAction } from "./actions";

const item = adminNavItem("/admin/billing");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const TABS = [
  { id: "ledger", label: "Ledger" },
  { id: "adjust", label: "Credit adjustments" },
  { id: "refunds", label: "Refunds" },
  { id: "provider-refunds", label: "Provider refunds" },
  { id: "claims", label: "Quality claims" },
  { id: "disputes", label: "Disputes" },
] as const;
type Tab = (typeof TABS)[number]["id"];
type SP = Record<string, string | string[] | undefined>;

const PER_PAGE = 100;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function BillingPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const tab: Tab = (TABS.find((t) => t.id === param(sp.tab))?.id ?? "ledger") as Tab;
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description="Money moves only through the database functions: refunds never reopen a slot and are capped at the net paid; ledger entries are append-only." />
      <LinkTabs label="Billing sections" current={tab} items={TABS.map((t) => ({ id: t.id, label: t.label, href: `/admin/billing?tab=${t.id}` }))} />
      {tab === "ledger" ? <LedgerTab sp={sp} /> : null}
      {tab === "adjust" ? <AdjustTab /> : null}
      {tab === "refunds" ? <RefundsTab sp={sp} /> : null}
      {tab === "provider-refunds" ? <ProviderRefundsTab /> : null}
      {tab === "claims" ? <ClaimsTab sp={sp} /> : null}
      {tab === "disputes" ? <DisputesTab /> : null}
    </div>
  );
}

async function companyOptions() {
  const { rows } = await listCompanies({ limit: 500 });
  return rows.map((c) => ({ value: c.id, label: `${c.legal_name} (${c.status.replace("_", " ")})` }));
}

async function LedgerTab({ sp }: { sp: SP }) {
  const filters = { company: param(sp.company), kind: param(sp.kind), from: DATE.test(param(sp.from)) ? param(sp.from) : "", to: DATE.test(param(sp.to)) ? param(sp.to) : "" };
  const page = pageNumber(sp.page);
  const [ledger, companies] = await Promise.all([
    listLedger({ companyId: filters.company || null, kind: filters.kind || null, from: filters.from || null, to: filters.to || null, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    companyOptions(),
  ]);
  return (
    <div className="grid gap-4">
      <FilterBar resetHref="/admin/billing?tab=ledger">
        <input type="hidden" name="tab" value="ledger" />
        <FilterSelect id="company" name="company" label="Company" value={filters.company} options={companies} />
        <FilterSelect id="kind" name="kind" label="Kind" value={filters.kind} options={LEDGER_KINDS.map((k) => ({ value: k, label: LEDGER_KIND_LABELS[k] }))} />
        <FilterInput id="from" name="from" label="From" type="date" value={filters.from} />
        <FilterInput id="to" name="to" label="To" type="date" value={filters.to} />
      </FilterBar>
      <p className="type-small text-text-2">
        Sum of the filtered entries: <Money cents={ledger.sum} /> (credit-balance kinds and informational charges mixed unless you filter by kind).
      </p>
      <Table
        caption={`Ledger entries (${ledger.total})`}
        compact
        rowKey={(r) => r.id}
        rows={ledger.rows}
        empty={<p className="text-text-2">No entries match these filters.</p>}
        columns={[
          { key: "at", header: "When", cell: (r) => <When value={r.created_at} /> },
          { key: "company", header: "Company", cell: (r) => <Link className="text-link underline" href={`/admin/companies/${r.company_id}?tab=ledger`}>{r.legal_name}</Link> },
          { key: "kind", header: "Kind", cell: (r) => LEDGER_KIND_LABELS[r.kind] },
          { key: "amount", header: "Amount", numeric: true, cell: (r) => <Money cents={r.amount_cents} /> },
          { key: "purchase", header: "Purchase", cell: (r) => (r.purchase_id ? <ShortId id={r.purchase_id} /> : null) },
          { key: "note", header: "Note", cell: (r) => r.note },
          { key: "key", header: "Dedupe key", cell: (r) => <Mono>{r.dedupe_key}</Mono> },
        ]}
      />
      <Pager page={page} total={ledger.total} perPage={PER_PAGE} hrefFor={(p) => `/admin/billing${qs({ tab: "ledger", ...filters, page: p })}`} />
    </div>
  );
}

async function AdjustTab() {
  const companies = await companyOptions();
  return (
    <Card title="Credit adjustment" titleAs="h2" description="Goodwill, promotions and corrections. Positive adds account credit; negative (such as -25) removes it, never below the available balance.">
      <ActionForm
        action={adjustCreditAction}
        submitLabel="Record adjustment"
        confirm={{ title: "Record this adjustment?", description: "Ledger entries can't be edited or deleted. A mistake needs an opposite adjustment.", confirmLabel: "Record" }}
      >
        <input type="hidden" name="key" value={randomUUID()} />
        <Field id="adjust-company" label="Company" required>
          <Select name="companyId" required defaultValue="">
            <option value="" disabled>
              Choose a company
            </option>
            {companies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="adjust-amount" label="Amount ($)" required>
          <Input name="amount" inputMode="decimal" required />
        </Field>
        <Field id="adjust-note" label="Note" required>
          <Textarea name="note" rows={2} required minLength={3} maxLength={500} />
        </Field>
      </ActionForm>
    </Card>
  );
}

async function RefundsTab({ sp }: { sp: SP }) {
  const purchaseId = param(sp.purchase);
  let quote: Awaited<ReturnType<typeof getRefundQuote>> | null = null;
  let problem: string | null = null;
  if (purchaseId) {
    if (!isUuid(purchaseId)) problem = "That isn't a purchase ID.";
    else {
      try {
        quote = await getRefundQuote(purchaseId);
      } catch (error) {
        if (!isAdminError(error)) throw error;
        problem = error.message;
      }
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Find a purchase" titleAs="h2" description="Open Refund from a company's purchases tab or the purchases list, or paste a purchase ID.">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="tab" value="refunds" />
          <Field id="purchase" label="Purchase ID">
            <Input name="purchase" defaultValue={purchaseId} className="font-mono" />
          </Field>
          <button type="submit" className="inline-flex min-h-12 items-center rounded-control bg-primary px-4 font-semibold text-on-primary">
            Look up
          </button>
        </form>
        {problem ? <Alert tone="error" className="mt-4">{problem}</Alert> : null}
      </Card>
      {quote ? (
        <Card title="Refund" titleAs="h2">
          <div className="grid gap-4">
            <p>
              Request {quote.reference_code ?? <ShortId id={quote.group_id} />} ·{" "}
              <Link className="text-link underline" href={`/admin/companies/${quote.company_id}?tab=purchases`}>
                buyer
              </Link>
            </p>
            <dl className="grid grid-cols-2 gap-2 type-small">
              <dt className="font-semibold text-text-2">Charged</dt>
              <dd><Money cents={quote.charged_cents} /></dd>
              <dt className="font-semibold text-text-2">Sharing credits received</dt>
              <dd><Money cents={quote.sharing_credits} /></dd>
              <dt className="font-semibold text-text-2">Paid by card</dt>
              <dd><Money cents={quote.card_amount_cents} /> {quote.payment_ref ? <Mono>({quote.payment_ref})</Mono> : null}</dd>
              <dt className="font-semibold text-text-2">Most as credit</dt>
              <dd><Money cents={quote.creditCap} /></dd>
              <dt className="font-semibold text-text-2">Most as cash</dt>
              <dd><Money cents={quote.cashCap} /></dd>
            </dl>
            {quote.refunded_at ? (
              <Alert tone="info">Refunded on <When value={quote.refunded_at} />. A purchase is refunded once.</Alert>
            ) : (
              <ActionForm
                action={refundAction}
                submitLabel="Refund"
                submitVariant="danger"
                confirm={{ title: "Refund this purchase?", description: "Refunds can't be undone and never reopen the slot. Cash goes back to the original payment method.", confirmLabel: "Refund" }}
              >
                <input type="hidden" name="purchaseId" value={quote.id} />
                <Field id="refund-mode" label="Refund as" required>
                  <Select name="mode" required defaultValue="credit">
                    <option value="credit">Account credit (quality refund)</option>
                    <option value="cash">Cash to the original payment method</option>
                  </Select>
                </Field>
                <Field id="refund-amount" label="Amount ($)" optional help="Leave empty to refund the most allowed.">
                  <Input name="amount" inputMode="decimal" />
                </Field>
                <Field id="refund-note" label="Note" required>
                  <Textarea name="note" rows={2} required minLength={3} maxLength={500} />
                </Field>
              </ActionForm>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

async function ClaimsTab({ sp }: { sp: SP }) {
  const status = param(sp.status) || "open";
  const claims = await listClaims(["open", "approved", "rejected", "withdrawn"].includes(status) ? status : "open");
  return (
    <div className="grid gap-4">
      <LinkTabs
        label="Claim status"
        current={status}
        items={["open", "approved", "rejected"].map((s) => ({ id: s, label: humanize(s), href: `/admin/billing?tab=claims&status=${s}` }))}
      />
      {claims.length === 0 ? <p className="text-text-2">No {status} claims.</p> : null}
      <div className="grid gap-4">
        {claims.map((c) => (
          <Card key={c.id} as="article" title={`${humanize(c.reason)}: ${c.legal_name}`} titleAs="h2" description={<>Request {c.reference_code ?? "unknown"} · filed <When value={c.created_at} /></>}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <p className="type-small text-text-2">Evidence</p>
                <p className="whitespace-pre-line">{c.evidence ?? "None supplied."}</p>
                <p className="type-small">
                  Charged <Money cents={c.charged_cents} />, sharing credits <Money cents={c.sharing_credits} />, net paid <strong><Money cents={Math.max(0, c.charged_cents - c.sharing_credits)} /></strong>. Bought <When value={c.purchased_at} />.
                </p>
                {c.status !== "open" ? (
                  <p>
                    <Status value={c.status} /> {c.decision} {c.refund_amount_cents !== null ? <>Refunded <Money cents={c.refund_amount_cents} /> as {c.refund_mode}.</> : null}
                  </p>
                ) : null}
              </div>
              {c.status === "open" ? (
                <ActionForm
                  action={claimDecisionAction}
                  submitLabel="Record decision"
                  confirm={{ title: "Record this claim decision?", description: "Approving refunds the net paid as account credit; it can't be undone.", confirmLabel: "Record" }}
                >
                  <input type="hidden" name="claimId" value={c.id} />
                  <Field id={`claim-decision-${c.id}`} label="Decision" required>
                    <Select name="decision" required defaultValue="">
                      <option value="" disabled>
                        Choose
                      </option>
                      <option value="approve">Approve: refund the net paid as credit</option>
                      <option value="reject">Reject with a note</option>
                    </Select>
                  </Field>
                  <Field id={`claim-note-${c.id}`} label="Decision note" required>
                    <Textarea name="note" rows={2} required minLength={3} maxLength={1000} />
                  </Field>
                </ActionForm>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function DisputesTab() {
  const [disputes, companies] = await Promise.all([listDisputes(), companyOptions()]);
  return (
    <div className="grid gap-6">
      <SectionTitle description="Chargebacks and disputes recorded by hand (the payments provider's webhooks add them automatically once live).">Disputes</SectionTitle>
      {disputes.length === 0 ? <p className="text-text-2">No disputes.</p> : null}
      {disputes.map((d) => (
        <Card key={d.id} as="article" title={d.legal_name} titleAs="h3" description={<>Recorded <When value={d.created_at} /> · <Status value={d.status} /> · billing <Status value={d.billing_status} /></>}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-1 type-small">
              <p>Reason: {d.reason}</p>
              <p>Amount: {d.amount_cents !== null ? <Money cents={d.amount_cents} /> : "Not given"}</p>
              <p>Purchase: {d.purchase_id ? <ShortId id={d.purchase_id} /> : "Not linked"}</p>
              {d.stripe_dispute_id ? <p>Provider ID: <Mono>{d.stripe_dispute_id}</Mono></p> : null}
              {d.outcome ? <p>Outcome: {d.outcome}</p> : null}
            </div>
            <ActionForm action={updateDisputeAction} submitLabel="Update dispute" resetOnSuccess={false}>
              <input type="hidden" name="disputeId" value={d.id} />
              <Field id={`dispute-status-${d.id}`} label="Status" required>
                <Select name="status" defaultValue={d.status}>
                  {DISPUTE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {humanize(s)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id={`dispute-outcome-${d.id}`} label="Outcome" optional help="Required when won, lost or closed.">
                <Textarea name="outcome" rows={2} maxLength={1000} defaultValue={d.outcome ?? ""} />
              </Field>
              {d.billing_status === "suspended" ? (
                <label className="flex min-h-11 items-start gap-3 py-2">
                  <input type="checkbox" name="restorePurchases" className="mt-0.5 size-5 accent-primary" />
                  <span>Let the company buy requests again (billing back to good)</span>
                </label>
              ) : null}
            </ActionForm>
          </div>
        </Card>
      ))}
      <Card title="Record a dispute" titleAs="h2">
        <ActionForm action={createDisputeAction} submitLabel="Record dispute">
          <Field id="dispute-company" label="Company" required>
            <Select name="companyId" required defaultValue="">
              <option value="" disabled>
                Choose a company
              </option>
              {companies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="dispute-purchase" label="Purchase ID" optional>
            <Input name="purchaseId" className="font-mono" />
          </Field>
          <Field id="dispute-amount" label="Amount ($)" optional>
            <Input name="amount" inputMode="decimal" />
          </Field>
          <Field id="dispute-provider" label="Payments provider dispute ID" optional>
            <Input name="providerDisputeId" className="font-mono" />
          </Field>
          <Field id="dispute-reason" label="Reason" required>
            <Textarea name="reason" rows={2} required minLength={3} maxLength={500} />
          </Field>
          <label className="flex min-h-11 items-start gap-3 py-2">
            <input type="checkbox" name="pausePurchases" className="mt-0.5 size-5 accent-primary" />
            <span>Pause the company&apos;s new purchases while the dispute is open</span>
          </label>
        </ActionForm>
      </Card>
    </div>
  );
}

async function ProviderRefundsTab() {
  const refunds = await listProviderRefunds(["pending", "failed", "succeeded"]);
  return (
    <div className="grid gap-4">
      <SectionTitle description="Card payments that succeeded after their request could no longer be sold. No purchase exists, so these refunds are cash only and never touch the credit balance. Pending and failed ones need a retry.">
        Provider refunds
      </SectionTitle>
      <Table
        caption="Provider refunds"
        hideCaption
        compact
        rowKey={(r) => r.id}
        rows={refunds}
        empty={<p className="text-text-2">No provider refunds.</p>}
        columns={[
          { key: "at", header: "Created", cell: (r) => <When value={r.created_at} /> },
          { key: "company", header: "Company", cell: (r) => <Link className="text-link underline" href={`/admin/companies/${r.company_id}`}>{r.legal_name}</Link> },
          { key: "amount", header: "Amount", numeric: true, cell: (r) => <Money cents={r.amount_cents} /> },
          { key: "charge", header: "Charge", cell: (r) => <Mono>{r.provider_ref}</Mono> },
          { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
          { key: "error", header: "Error", cell: (r) => (r.error_code ? <Mono>{r.error_code}</Mono> : r.provider_refund_id ? <Mono>{r.provider_refund_id}</Mono> : null) },
          {
            key: "retry",
            header: "Retry",
            cell: (r) =>
              r.status === "succeeded" ? null : (
                <ActionForm action={retryProviderRefundAction} submitLabel="Retry refund" submitVariant="secondary" confirm={{ title: "Retry this refund?", description: "The payments provider is asked again with the same idempotency key, so it can't pay twice.", confirmLabel: "Retry" }}>
                  <input type="hidden" name="refundId" value={r.id} />
                </ActionForm>
              ),
          },
        ]}
      />
    </div>
  );
}
