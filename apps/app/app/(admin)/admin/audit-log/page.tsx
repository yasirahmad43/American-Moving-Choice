import { listAuditLog } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterInput, JsonDetails, Mono, Pager, When, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/audit-log");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const PER_PAGE = 100;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const filters = {
    action: param(sp.action).slice(0, 80),
    entity: param(sp.entity).slice(0, 60),
    actor: param(sp.actor).slice(0, 254),
    from: DATE.test(param(sp.from)) ? param(sp.from) : "",
    to: DATE.test(param(sp.to)) ? param(sp.to) : "",
  };
  const page = pageNumber(sp.page);
  const { rows, total } = await listAuditLog({
    action: filters.action || null,
    entity: filters.entity || null,
    actor: filters.actor || null,
    from: filters.from || null,
    to: filters.to || null,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description="Append-only: every admin decision, settings change and security event. Entries can't be edited or deleted." />
      <FilterBar resetHref="/admin/audit-log">
        <FilterInput id="action" name="action" label="Action contains" value={filters.action} placeholder="company." />
        <FilterInput id="entity" name="entity" label="Entity" value={filters.entity} placeholder="company" />
        <FilterInput id="actor" name="actor" label="Actor email or ID" value={filters.actor} />
        <FilterInput id="from" name="from" label="From" type="date" value={filters.from} />
        <FilterInput id="to" name="to" label="To" type="date" value={filters.to} />
      </FilterBar>
      <Table sortable
        caption={`Audit entries (${total})`}
        compact
        rowKey={(r) => r.id}
        rows={rows}
        empty={<p className="text-text-2">No entries match these filters.</p>}
        columns={[
          { key: "at", header: "When", cell: (r) => <When value={r.created_at} /> },
          { key: "action", header: "Action", cell: (r) => <Mono>{r.action}</Mono> },
          { key: "actor", header: "Actor", cell: (r) => r.actor_email ?? `${r.actor_type}${r.actor_id ? `: ${r.actor_id}` : ""}` },
          { key: "entity", header: "Entity", cell: (r) => <span><Mono>{r.entity}</Mono>{r.entity_id ? <> <Mono>{r.entity_id.slice(0, 36)}</Mono></> : null}</span> },
          { key: "company", header: "Company", cell: (r) => (r.company_id ? <Link className="text-link underline" href={`/admin/companies/${r.company_id}?tab=audit`}>{r.company_name}</Link> : null) },
          { key: "ip", header: "IP", cell: (r) => (r.ip ? <Mono>{r.ip}</Mono> : null) },
          { key: "change", header: "Change", cell: (r) => <JsonDetails value={r.before || r.after ? { before: r.before, after: r.after } : null} summary="Show change" /> },
        ]}
      />
      <Pager page={page} total={total} perPage={PER_PAGE} hrefFor={(p) => `/admin/audit-log${qs({ ...filters, page: p })}`} />
    </div>
  );
}
