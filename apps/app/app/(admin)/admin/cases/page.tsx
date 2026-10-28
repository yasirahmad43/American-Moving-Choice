import { listCompanies } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { CASE_STATUSES, CASE_STATUS_LABELS, CASE_TYPES, CASE_TYPE_LABELS, caseAssignees, listCases } from "@amc/server/cases";
import { Card, Field, Input, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { FilterBar, FilterSelect, Mono, Status, When, humanize, param } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { createCaseAction } from "./actions";

const item = adminNavItem("/admin/cases");

export const metadata: Metadata = { title: `${item.label} · Admin` };

export default async function CasesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const filters = { status: param(sp.status), type: param(sp.type), assignee: param(sp.assignee) };
  const [cases, assignees, companies] = await Promise.all([
    listCases({ status: filters.status || null, type: filters.type || null, assignee: filters.assignee || null, open: !filters.status }),
    caseAssignees(),
    listCompanies({ limit: 500 }),
  ]);
  const now = Date.now();
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description="Reports become cases with an SLA, an assignee and an outcome. Open cases are shown unless you filter by status." />
      <FilterBar resetHref="/admin/cases">
        <FilterSelect id="status" name="status" label="Status" value={filters.status} options={CASE_STATUSES.map((s) => ({ value: s, label: CASE_STATUS_LABELS[s] }))} />
        <FilterSelect id="type" name="type" label="Type" value={filters.type} options={CASE_TYPES.map((t) => ({ value: t, label: CASE_TYPE_LABELS[t] }))} />
        <FilterSelect id="assignee" name="assignee" label="Assignee" value={filters.assignee} options={assignees.map((a) => ({ value: a.user_id, label: a.email }))} />
      </FilterBar>
      <Table sortable
        caption={`Cases (${cases.length})`}
        compact
        rowKey={(r) => r.id}
        rows={cases}
        empty={<p className="text-text-2">No cases match these filters.</p>}
        columns={[
          {
            key: "type",
            header: "Case",
            cell: (r) => (
              <span className="grid">
                <Link className="font-semibold text-link underline" href={`/admin/cases/${r.id}`}>{CASE_TYPE_LABELS[r.case_type]}</Link>
                <Mono>{r.reference_code}</Mono>
              </span>
            ),
          },
          { key: "source", header: "Source", cell: (r) => humanize(r.source) },
          { key: "company", header: "Company", cell: (r) => r.company_name ?? (r.reported_company ? <span>Named: {r.reported_company}</span> : "Not linked") },
          { key: "status", header: "Status", cell: (r) => <Status value={r.status} label={CASE_STATUS_LABELS[r.status]} /> },
          { key: "assignee", header: "Assignee", cell: (r) => r.assignee_email ?? "Unassigned" },
          {
            key: "sla",
            header: "SLA due",
            cell: (r) => (
              <span className="grid">
                <When value={r.sla_due_at} />
                {r.sla_due_at && new Date(r.sla_due_at).getTime() < now && !["resolved", "closed"].includes(r.status) ? <Status value="failed" label="Overdue" /> : null}
              </span>
            ),
          },
          { key: "opened", header: "Opened", cell: (r) => <When value={r.created_at} /> },
        ]}
      />
      <Card title="Open a case" titleAs="h2" description="For reports received by phone or email. Reporter details are visible to admins only.">
        <ActionForm action={createCaseAction} submitLabel="Open case">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="case-type" label="Type" required>
              <Select name="caseType" required defaultValue="">
                <option value="" disabled>
                  Choose
                </option>
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CASE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="case-company" label="Company" optional>
              <Select name="companyId" defaultValue="">
                <option value="">Not linked</option>
                {companies.rows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.legal_name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field id="case-description" label="What was reported" required>
            <Textarea name="description" rows={4} required minLength={3} maxLength={5000} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="case-reporter-name" label="Reporter name" optional>
              <Input name="reporterName" maxLength={120} autoComplete="off" />
            </Field>
            <Field id="case-reporter-email" label="Reporter email" optional>
              <Input name="reporterEmail" type="email" maxLength={254} autoComplete="off" />
            </Field>
            <Field id="case-reporter-phone" label="Reporter phone" optional>
              <Input name="reporterPhone" type="tel" maxLength={40} autoComplete="off" />
            </Field>
          </div>
          <Field id="case-lead" label="Request ID" optional help="The request's ID from its admin page, if the report is about one.">
            <Input name="leadId" className="font-mono" maxLength={64} />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
