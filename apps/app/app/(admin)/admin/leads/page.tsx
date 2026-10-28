import { GROUP_STATUSES, LEAD_STATUSES, listLeads } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { runDueJobs } from "@amc/server/jobs";
import { PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { FilterBar, LinkTabs, FilterInput, FilterSelect, Mono, Pager, Status, When, humanize, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/leads");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const PER_PAGE = 50;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const filters = {
    status: param(sp.status),
    group: param(sp.group),
    q: param(sp.q).slice(0, 40),
    from: DATE.test(param(sp.from)) ? param(sp.from) : "",
    to: DATE.test(param(sp.to)) ? param(sp.to) : "",
  };
  const page = pageNumber(sp.page);
  const held = (await listLeads({ status: "needs_review", limit: 1 })).total;
  const { rows, total } = await listLeads({ status: filters.status || null, groupStatus: filters.group || null, q: filters.q || null, from: filters.from || null, to: filters.to || null, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  after(async () => {
    try {
      await runDueJobs(["expire_lead_groups", "release_expired_attempts"], 30, "lazy:leads");
    } catch {
      console.error("[jobs] lazy leads run failed");
    }
  });
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description="Consumer requests. The list shows no contact details; opening a request records the view in the audit log." />
      <LinkTabs
        label="Request views"
        current={filters.status === "needs_review" ? "review" : "all"}
        items={[
          { id: "all", label: "All requests", href: "/admin/leads" },
          { id: "review", label: `Waiting for review (${held})`, href: "/admin/leads?status=needs_review" },
        ]}
      />
      {filters.status === "needs_review" ? (
        <p className="type-small text-text-2">
          Requests held for review can't be bought. Open one to qualify it (eligible companies are then told it's available) or reject it.
        </p>
      ) : null}
      <FilterBar resetHref="/admin/leads">
        <FilterInput id="q" name="q" label="Reference code" value={filters.q} placeholder="AMC-" />
        <FilterSelect id="status" name="status" label="Request status" value={filters.status} options={LEAD_STATUSES.map((s) => ({ value: s, label: humanize(s) }))} />
        <FilterSelect id="group" name="group" label="Sale status" value={filters.group} options={GROUP_STATUSES.map((s) => ({ value: s, label: humanize(s) }))} />
        <FilterInput id="from" name="from" label="From" type="date" value={filters.from} />
        <FilterInput id="to" name="to" label="To" type="date" value={filters.to} />
      </FilterBar>
      <Table sortable
        caption={`Requests (${total})`}
        compact
        rowKey={(r) => r.id}
        rows={rows}
        empty={<p className="text-text-2">No requests match these filters.</p>}
        columns={[
          {
            key: "ref",
            header: "Reference",
            cell: (r) => (
              <Link href={`/admin/leads/${r.id}`} className="font-semibold text-link underline">
                <Mono>{r.reference_code}</Mono>
              </Link>
            ),
          },
          { key: "created", header: "Submitted", cell: (r) => <When value={r.created_at} /> },
          { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
          { key: "sale", header: "Sale", cell: (r) => <Status value={r.group_status} /> },
          { key: "route", header: "Route", cell: (r) => `${r.origin_city ?? "?"}, ${r.origin_state ?? "?"} → ${r.dest_city ?? "?"}, ${r.dest_state ?? "?"}` },
          { key: "type", header: "Move", cell: (r) => [r.move_type ? humanize(r.move_type) : null, r.move_size].filter(Boolean).join(", ") },
          { key: "buyers", header: "Buyers", numeric: true, cell: (r) => `${r.buyers} of ${r.sharing_limit}` },
          { key: "risk", header: "Risk", numeric: true, cell: (r) => r.risk_score ?? "None" },
          { key: "dup", header: "Duplicate", cell: (r) => (r.is_primary ? "No" : "Yes") },
        ]}
      />
      <Pager page={page} total={total} perPage={PER_PAGE} hrefFor={(p) => `/admin/leads${qs({ ...filters, page: p })}`} />
    </div>
  );
}
