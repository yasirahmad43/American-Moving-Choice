import { listCompanies } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { COMPANY_STATUS_LABELS, CompanyStatusPill, DemoChip, Money, PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterInput, FilterSelect, Pager, Status, When, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/companies");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const PER_PAGE = 50;

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const status = param(sp.status);
  const q = param(sp.q).slice(0, 100);
  const page = pageNumber(sp.page);
  const { rows, total } = await listCompanies({ status: status in COMPANY_STATUS_LABELS ? status : null, q: q || null, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description={item.description} />
      <FilterBar resetHref="/admin/companies">
        <FilterInput id="q" name="q" label="Name, USDOT or MC" value={q} />
        <FilterSelect id="status" name="status" label="Status" value={status} options={Object.entries(COMPANY_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      <Table
        caption={`Companies (${total})`}
        rowKey={(r) => r.id}
        rows={rows}
        compact
        empty={<p className="text-text-2">No companies match these filters.</p>}
        columns={[
          {
            key: "name",
            header: "Company",
            cell: (r) => (
              <span className="grid gap-1">
                <Link href={`/admin/companies/${r.id}`} className="font-semibold text-link underline">
                  {r.legal_name}
                </Link>
                {r.is_demo ? <DemoChip /> : null}
              </span>
            ),
          },
          { key: "status", header: "Status", cell: (r) => <CompanyStatusPill status={r.status} /> },
          { key: "usdot", header: "USDOT", numeric: true, cell: (r) => r.usdot_number ?? "None" },
          { key: "mc", header: "MC", cell: (r) => r.mc_number ?? "None" },
          { key: "profile", header: "Profile", cell: (r) => <Status value={r.public_status} /> },
          { key: "billing", header: "Billing", cell: (r) => <Status value={r.billing_status} /> },
          { key: "balance", header: "Credit", numeric: true, cell: (r) => <Money cents={r.balance_cents} /> },
          { key: "updated", header: "Updated", cell: (r) => <When value={r.updated_at} date /> },
        ]}
      />
      <Pager page={page} total={total} perPage={PER_PAGE} hrefFor={(p) => `/admin/companies${qs({ q, status, page: p })}`} />
    </div>
  );
}
