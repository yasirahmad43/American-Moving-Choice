import { listCompanies } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { CASE_STATUSES, CASE_STATUS_LABELS, CASE_TYPE_LABELS, caseAssignees, getCase } from "@amc/server/cases";
import { Card, CompanyStatusPill, Field, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { Facts, JsonDetails, Mono, Status, When, humanize } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../../_lib/roles";
import { caseReverifyAction, caseSuspendAction, updateCaseAction } from "../actions";

const item = adminNavItem("/admin/cases");

export const metadata: Metadata = { title: "Case · Admin" };

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const { id } = await params;
  const found = await getCase(id);
  if (!found) notFound();
  const k = found.case;
  const [assignees, companies] = await Promise.all([caseAssignees(), listCompanies({ limit: 500 })]);
  const canEnforce = hasAdminRole(adminRole, ROLES.caseEnforcement);
  return (
    <div className="grid gap-6">
      <PageHeader
        size="portal"
        breadcrumbs={[{ label: "Cases", href: "/admin/cases" }, { label: CASE_TYPE_LABELS[k.case_type] }]}
        title={`${CASE_TYPE_LABELS[k.case_type]} case ${k.reference_code}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Status value={k.status} label={CASE_STATUS_LABELS[k.status]} /> Opened <When value={k.created_at} /> · SLA due <When value={k.sla_due_at} />
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Report" titleAs="h2">
          <div className="grid gap-4">
            <p className="whitespace-pre-line">{k.description}</p>
            <Facts
              items={[
                { label: "Reference", value: <Mono>{k.reference_code}</Mono> },
                { label: "Source", value: humanize(k.source) },
                { label: "Company named by the reporter", value: k.reported_company },
                { label: "Reporter", value: k.reporter_name },
                { label: "Reporter email", value: k.reporter_email },
                { label: "Reporter phone", value: k.reporter_phone },
                {
                  label: "Company",
                  value: k.company_id ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <Link className="text-link underline" href={`/admin/companies/${k.company_id}`}>{k.company_name}</Link>
                      {k.company_status ? <CompanyStatusPill status={k.company_status as "approved"} /> : null}
                    </span>
                  ) : null,
                },
                { label: "Request", value: k.lead_id ? <Link className="text-link underline" href={`/admin/leads/${k.lead_id}`}>Open the request</Link> : null },
                { label: "Review", value: k.review_id ? <Mono>{k.review_id}</Mono> : null },
                { label: "Outcome", value: k.outcome },
                { label: "Resolved", value: k.resolved_at ? <When value={k.resolved_at} /> : null },
              ]}
            />
          </div>
        </Card>
        <Card title="Update" titleAs="h2">
          <ActionForm action={updateCaseAction} submitLabel="Save case" resetOnSuccess={false}>
            <input type="hidden" name="caseId" value={k.id} />
            <Field id="case-status" label="Status" required>
              <Select name="status" defaultValue={k.status}>
                {CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CASE_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="case-assignee" label="Assignee">
              <Select name="assignee" defaultValue={k.assignee ?? ""}>
                <option value="">Unassigned</option>
                {assignees.map((a) => (
                  <option key={a.user_id} value={a.user_id}>
                    {a.email}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="case-company" label="Linked company">
              <Select name="companyId" defaultValue={k.company_id ?? ""}>
                <option value="">Not linked</option>
                {companies.rows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.legal_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="case-outcome" label="Outcome" help="Required to resolve or close.">
              <Textarea name="outcome" rows={3} maxLength={5000} defaultValue={k.outcome ?? ""} />
            </Field>
          </ActionForm>
        </Card>
        {canEnforce && k.company_id ? (
          <Card title="Act on the company" titleAs="h2" description="Re-verification re-runs the automated checks; suspension stops purchases and revokes the badge.">
            <div className="grid gap-6">
              <ActionForm action={caseReverifyAction} submitLabel="Re-run the company's checks" submitVariant="secondary">
                <input type="hidden" name="caseId" value={k.id} />
              </ActionForm>
              {k.company_status === "approved" ? (
                <ActionForm
                  action={caseSuspendAction}
                  submitLabel="Suspend the company"
                  submitVariant="danger"
                  confirm={{ title: `Suspend ${k.company_name}?`, description: "Purchases stop, the badge is revoked and the owner is emailed the reason.", confirmLabel: "Suspend" }}
                >
                  <input type="hidden" name="caseId" value={k.id} />
                  <Field id="case-suspend-reason" label="Reason (sent to the owner)" required>
                    <Textarea name="reason" rows={2} required minLength={3} maxLength={1000} />
                  </Field>
                </ActionForm>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
      <Table sortable
        caption="Case history"
        compact
        rowKey={(r) => r.id}
        rows={found.history}
        columns={[
          { key: "at", header: "When", cell: (r) => <When value={r.created_at} /> },
          { key: "action", header: "Action", cell: (r) => <Mono>{r.action}</Mono> },
          { key: "who", header: "By", cell: (r) => r.actor_email ?? r.actor_type },
          { key: "change", header: "Change", cell: (r) => <JsonDetails value={{ before: r.before, after: r.after }} summary="Show change" /> },
        ]}
      />
    </div>
  );
}
