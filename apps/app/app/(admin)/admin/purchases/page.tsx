import { chargeReconciliation, listCompanies, listPurchases, orphanAttempts, reconciliation } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { listReconciliationReports } from "@amc/server/jobs";
import { Alert, Money, PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, Scroll, FilterInput, FilterSelect, JsonDetails, LinkTabs, Mono, Pager, Status, When, humanize, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../_lib/roles";

const item = adminNavItem("/admin/purchases");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const PER_PAGE = 50;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const tab = param(sp.tab) === "reconciliation" ? "reconciliation" : "purchases";
  const filters = { company: param(sp.company), from: DATE.test(param(sp.from)) ? param(sp.from) : "", to: DATE.test(param(sp.to)) ? param(sp.to) : "" };
  const canRefund = hasAdminRole(adminRole, ROLES.finance);
  const companies = (await listCompanies({ limit: 500 })).rows.map((c) => ({ value: c.id, label: c.legal_name }));
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description={item.description} />
      <LinkTabs
        label="Purchase views"
        current={tab}
        items={[
          { id: "purchases", label: "Purchases", href: "/admin/purchases" },
          { id: "reconciliation", label: "Reconciliation", href: "/admin/purchases?tab=reconciliation" },
        ]}
      />
      <FilterBar resetHref={`/admin/purchases${tab === "reconciliation" ? "?tab=reconciliation" : ""}`}>
        {tab === "reconciliation" ? <input type="hidden" name="tab" value="reconciliation" /> : <FilterSelect id="company" name="company" label="Company" value={filters.company} options={companies} />}
        <FilterInput id="from" name="from" label="From" type="date" value={filters.from} />
        <FilterInput id="to" name="to" label="To" type="date" value={filters.to} />
      </FilterBar>
      {tab === "purchases" ? <PurchaseList sp={sp} filters={filters} canRefund={canRefund} /> : <Reconciliation filters={filters} />}
    </div>
  );
}

async function PurchaseList({ sp, filters, canRefund }: { sp: Record<string, string | string[] | undefined>; filters: { company: string; from: string; to: string }; canRefund: boolean }) {
  const page = pageNumber(sp.page);
  const { rows, total } = await listPurchases({ companyId: filters.company || null, from: filters.from || null, to: filters.to || null, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  return (
    <>
      <Scroll label="Purchases table">
      <Table
        caption={`Purchases (${total})`}
        compact
        rowKey={(r) => r.id}
        rows={rows}
        empty={<p className="text-text-2">No purchases match these filters.</p>}
        columns={[
          { key: "at", header: "Bought", cell: (r) => <When value={r.created_at} /> },
          { key: "company", header: "Buyer", cell: (r) => <Link className="text-link underline" href={`/admin/companies/${r.company_id}?tab=purchases`}>{r.legal_name}</Link> },
          { key: "lead", header: "Request", cell: (r) => (r.lead_id ? <Link className="text-link underline" href={`/admin/leads/${r.lead_id}`}><Mono>{r.reference_code}</Mono></Link> : "Unknown") },
          { key: "type", header: "Type", cell: (r) => `${humanize(r.lead_type)} #${r.position}` },
          { key: "charged", header: "Charged", numeric: true, cell: (r) => <Money cents={r.charged_cents} /> },
          { key: "credit", header: "From credit", numeric: true, cell: (r) => <Money cents={r.credit_applied_cents} /> },
          { key: "card", header: "Card", numeric: true, cell: (r) => <Money cents={r.card_amount_cents} /> },
          { key: "shared", header: "Sharing credits", numeric: true, cell: (r) => <Money cents={r.sharing_credits} /> },
          { key: "ref", header: "Payment ref", cell: (r) => (r.payment_ref ? <Mono>{r.payment_ref}</Mono> : "None") },
          { key: "disclosed", header: "Disclosed", cell: (r) => (r.disclosed_at ? <When value={r.disclosed_at} /> : <Status value="failed" label="No" />) },
          {
            key: "refund",
            header: "Refund",
            cell: (r) => (r.refunded_at ? <When value={r.refunded_at} /> : canRefund ? <Link className="text-link underline" href={`/admin/billing?tab=refunds&purchase=${r.id}`}>Refund</Link> : "No"),
          },
        ]}
      />
      </Scroll>
      <Pager page={page} total={total} perPage={PER_PAGE} hrefFor={(p) => `/admin/purchases${qs({ ...filters, page: p })}`} />
    </>
  );
}

async function Reconciliation({ filters }: { filters: { from: string; to: string } }) {
  const [rows, orphans, charges, reports] = await Promise.all([
    reconciliation({ from: filters.from || null, to: filters.to || null }),
    orphanAttempts(),
    chargeReconciliation({ onlyIssues: true }),
    listReconciliationReports(10),
  ]);
  const issues = rows.filter((r) => r.issues.length);
  const latest = reports[0];
  return (
    <div className="grid gap-6">
      {issues.length ? <Alert tone="warning">{issues.length} purchase{issues.length === 1 ? "" : "s"} need attention.</Alert> : <Alert tone="success">Every purchase matches its payment reference, ledger entries and disclosure.</Alert>}
      <Table
        caption="Daily reconciliation reports (reconcile-payments job)"
        compact
        rowKey={(r) => r.id}
        rows={reports}
        empty={<p className="text-text-2">No daily report yet. The reconcile-payments job runs every morning and can be run from the Jobs page.</p>}
        columns={[
          { key: "at", header: "Run", cell: (r) => <When value={r.created_at} /> },
          { key: "issues", header: "Issues", numeric: true, cell: (r) => (r.issues_count ? <Status value="needs_review" label={String(r.issues_count)} /> : <Status value="pass" label="0" />) },
          { key: "ledger", header: "Ledger", numeric: true, cell: (r) => String(r.summary.ledger_issues ?? 0) },
          { key: "charges", header: "Charges", numeric: true, cell: (r) => String(r.summary.charge_issues ?? 0) },
          { key: "orphans", header: "Orphan attempts", numeric: true, cell: (r) => String(r.summary.orphan_attempts ?? 0) },
          { key: "refunds", header: "Unsettled refunds", numeric: true, cell: (r) => String(r.summary.unsettled_refunds ?? 0) },
          { key: "detail", header: "Detail", cell: (r) => (r.id === latest?.id ? <JsonDetails value={r.summary} summary="Latest report" /> : null) },
        ]}
      />
      {charges.length ? (
        <Scroll label="Provider charge issues">
          <Table
            caption="Provider charges that need attention"
            compact
            rowKey={(r) => r.attempt_id}
            rows={charges}
            columns={[
              { key: "at", header: "Attempted", cell: (r) => <When value={r.created_at} /> },
              { key: "company", header: "Company", cell: (r) => r.legal_name },
              { key: "card", header: "Card amount", numeric: true, cell: (r) => <Money cents={r.card_amount_cents} /> },
              { key: "charge", header: "Charge", cell: (r) => (r.charge_status ? <span><Status value={r.charge_status} /> {r.charge_provider_ref ? <Mono>{r.charge_provider_ref}</Mono> : null}</span> : "None") },
              { key: "refund", header: "Refund", cell: (r) => <Status value={r.refund_status} /> },
              { key: "issues", header: "Issues", cell: (r) => r.issues.join("; ") },
            ]}
          />
        </Scroll>
      ) : (
        <p className="type-small text-text-2">Every provider charge matches its purchase attempt. Retry failed provider refunds on <Link className="text-link underline" href="/admin/billing?tab=provider-refunds">Billing</Link>.</p>
      )}
      {orphans.length ? (
        <Table
          caption="Payments without a purchase (each needs a refund)"
          compact
          rowKey={(r) => r.id}
          rows={orphans}
          columns={[
            { key: "at", header: "Attempted", cell: (r) => <When value={r.created_at} /> },
            { key: "company", header: "Company", cell: (r) => r.legal_name },
            { key: "amount", header: "Card amount", numeric: true, cell: (r) => <Money cents={r.card_amount_cents} /> },
            { key: "ref", header: "Payment ref", cell: (r) => <Mono>{r.payment_ref}</Mono> },
            { key: "status", header: "Attempt", cell: (r) => <Status value={r.status} /> },
          ]}
        />
      ) : null}
      <Scroll label="Reconciliation table">
      <Table
        caption={`Purchases and payment references (${rows.length})`}
        compact
        rowKey={(r) => r.purchase_id}
        rows={rows}
        empty={<p className="text-text-2">No purchases in this period.</p>}
        columns={[
          { key: "at", header: "Bought", cell: (r) => <When value={r.created_at} /> },
          { key: "company", header: "Buyer", cell: (r) => r.legal_name },
          { key: "ref", header: "Request", cell: (r) => <Mono>{r.reference_code ?? "unknown"}</Mono> },
          { key: "charged", header: "Charged", numeric: true, cell: (r) => <Money cents={r.charged_cents} /> },
          { key: "ledger", header: "Charge entry", numeric: true, cell: (r) => <Money cents={r.charge_ledger_cents} /> },
          { key: "credit", header: "Credit applied", numeric: true, cell: (r) => <Money cents={r.credit_applied_cents} /> },
          { key: "spend", header: "Spend entry", numeric: true, cell: (r) => <Money cents={r.spend_ledger_cents} /> },
          { key: "card", header: "Card", numeric: true, cell: (r) => <Money cents={r.card_amount_cents} /> },
          { key: "payref", header: "Payment ref", cell: (r) => (r.payment_ref ? <Mono>{r.payment_ref}</Mono> : "None") },
          { key: "refund", header: "Refund entry", numeric: true, cell: (r) => <Money cents={r.refund_ledger_cents} /> },
          { key: "issues", header: "Issues", cell: (r) => (r.issues.length ? r.issues.join("; ") : <Status value="pass" label="Matches" />) },
        ]}
      />
      </Scroll>
    </div>
  );
}
