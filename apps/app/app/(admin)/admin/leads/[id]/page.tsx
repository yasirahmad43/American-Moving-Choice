import { getLeadDetail } from "@amc/server/admin";
import { hasAdminRole, requestMeta, requireAdmin } from "@amc/server/auth";
import { isUuid } from "@amc/server/db";
import { Alert, Card, Field, Money, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { Facts, Mono, ShortId, Status, When, humanize } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../../_lib/roles";
import { leadDecisionAction } from "../actions";

const item = adminNavItem("/admin/leads");

export const metadata: Metadata = { title: "Request · Admin", referrer: "no-referrer" };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, adminRole } = await requireAdmin({ roles: item.roles });
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { ip } = await requestMeta();
  const detail = await getLeadDetail({ userId: user.id, ip }, id);
  if (!detail) notFound();
  const { lead, group, consent } = detail;
  const canDecide = hasAdminRole(adminRole, ROLES.leads);
  const decisions = [
    lead.status === "needs_review" ? { value: "approve", label: "Approve: qualify the request" } : null,
    ["needs_review", "submitted", "qualified"].includes(lead.status) && detail.purchases.length === 0 ? { value: "reject", label: "Reject the request" } : null,
    group && group.status !== "withdrawn" ? { value: "withdraw", label: "Withdraw: the consumer withdrew consent" } : null,
    group?.status === "available" ? { value: "expire", label: "Expire: close the sale window now" } : null,
  ].filter((d): d is { value: string; label: string } => d !== null);
  return (
    <div className="grid gap-6">
      <PageHeader
        size="portal"
        breadcrumbs={[{ label: "Requests", href: "/admin/leads" }, { label: lead.reference_code }]}
        title={`Request ${lead.reference_code}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Status value={lead.status} />
            {group ? <Status value={group.status} /> : null}
            <span>Submitted <When value={lead.created_at} /></span>
          </span>
        }
      />
      <Alert tone="info">This page shows the consumer&apos;s contact details. Your view was recorded in the audit log. Never copy them outside the admin portal.</Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Request" titleAs="h2">
          <Facts
            items={[
              { label: "Name", value: `${lead.first_name} ${lead.last_name}` },
              { label: "Email", value: lead.email },
              { label: "Phone", value: <span className="tabular">{lead.phone_e164}</span> },
              { label: "Channels", value: lead.channel_scope.join(", ") || null },
              { label: "From", value: `${lead.origin_city ?? ""}, ${lead.origin_state ?? ""} ${lead.origin_zip} (county ${lead.origin_county_fips ?? "unknown"})` },
              { label: "To", value: `${lead.dest_city ?? ""}, ${lead.dest_state ?? ""} ${lead.dest_zip} (county ${lead.dest_county_fips ?? "unknown"})` },
              { label: "Distance", value: lead.distance_miles !== null ? <span className="tabular">{lead.distance_miles} miles</span> : null },
              { label: "Move", value: [lead.move_type ? humanize(lead.move_type) : null, lead.move_size].filter(Boolean).join(", ") || null },
              { label: "Services", value: lead.services.map(humanize).join(", ") || null },
              { label: "Move date", value: lead.move_date ? <span><When value={lead.move_date} date />{lead.move_date_flexible ? " (flexible)" : ""}</span> : null },
              { label: "Movers allowed", value: <span className="tabular">{lead.selected_limit}</span> },
              { label: "Risk score", value: lead.risk_score },
              { label: "Source", value: humanize(lead.source_category) },
              { label: "Started from a profile", value: lead.profile_company_id ? <Link className="text-link underline" href={`/admin/companies/${lead.profile_company_id}`}>Company</Link> : "No" },
              { label: "Withdrawn", value: lead.withdrawn_at ? <When value={lead.withdrawn_at} /> : "No" },
            ]}
          />
        </Card>
        <Card title="Sale" titleAs="h2">
          {group ? (
            <Facts
              items={[
                { label: "Group", value: <ShortId id={group.id} /> },
                { label: "Sharing limit", value: <span className="tabular">{group.sharing_limit}</span> },
                { label: "Lead type", value: group.sharing_limit === 1 ? "Exclusive" : "Shared" },
                { label: "Policy", value: <Mono>{group.policy_version}</Mono> },
                { label: "Sale status", value: <Status value={group.status} /> },
                { label: "Sale window ends", value: <When value={group.expires_at} /> },
                { label: "Duplicate submissions", value: detail.siblings.length ? detail.siblings.map((s) => s.reference_code).join(", ") : "None" },
              ]}
            />
          ) : null}
          {canDecide && decisions.length ? (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="mb-3 type-h4">Decision</h3>
              <ActionForm action={leadDecisionAction} submitLabel="Record decision" confirm={{ title: "Record this decision?", description: "Withdrawals and expiries can't be undone.", confirmLabel: "Record" }}>
                <input type="hidden" name="leadId" value={lead.id} />
                <Field id="lead-decision" label="Decision" required>
                  <Select name="decision" required defaultValue="">
                    <option value="" disabled>
                      Choose
                    </option>
                    {decisions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="lead-reason" label="Reason" required>
                  <Textarea name="reason" rows={2} required minLength={3} maxLength={1000} />
                </Field>
              </ActionForm>
            </div>
          ) : null}
        </Card>
      </div>

      <Table
        caption="Validation results"
        compact
        rowKey={(r) => r.id}
        rows={detail.validation}
        empty={<p className="text-text-2">No validation results.</p>}
        columns={[
          { key: "check", header: "Check", cell: (r) => humanize(r.check_type) },
          { key: "result", header: "Result", cell: (r) => <Status value={r.result === "flag" ? "needs_review" : r.result === "skipped" ? "hidden" : r.result} label={humanize(r.result)} /> },
          { key: "reason", header: "Reason", cell: (r) => r.reason },
          { key: "at", header: "When", cell: (r) => <When value={r.created_at} /> },
        ]}
      />

      <Card title="Consent record" titleAs="h2" description="Exactly what the consumer saw and agreed to. Append-only.">
        {consent ? (
          <div className="grid gap-4">
            <pre className="rounded-control bg-surface-2 p-4 font-sans whitespace-pre-wrap text-text">{consent.rendered_text}</pre>
            <Facts
              items={[
                { label: "Text version", value: <Mono>{consent.consent_text_version_id}</Mono> },
                { label: "Rendered text sha256", value: <Mono>{consent.rendered_text_sha256}</Mono> },
                { label: "Form state sha256", value: <Mono>{consent.form_state_sha256}</Mono> },
                { label: "Selected limit", value: <span className="tabular">{consent.selected_limit}</span> },
                { label: "Channels", value: consent.channel_scope.join(", ") },
                { label: "Contact consent box", value: consent.checkbox_state ? "Ticked" : "Not ticked" },
                { label: "Terms", value: `${consent.terms_version} (${consent.terms_accepted ? "accepted" : "not accepted"})` },
                { label: "Privacy", value: `${consent.privacy_version} (${consent.privacy_acknowledged ? "acknowledged" : "not acknowledged"})` },
                { label: "Page and form", value: `${consent.page_url} · ${consent.form_version} · variant ${consent.ab_variant}` },
                { label: "Tag manifest", value: consent.tag_manifest_version },
                { label: "IP and device", value: `${consent.ip ?? "unknown"} · ${consent.user_agent ?? "unknown"}` },
                { label: "Submitted", value: <When value={consent.submitted_at} /> },
              ]}
            />
            <Table
              caption="Movers in the consent text"
              compact
              rowKey={(r) => r.id}
              rows={detail.consentCompanies}
              columns={[
                { key: "name", header: "Mover", cell: (r) => <Link className="text-link underline" href={`/admin/companies/${r.id}`}>{r.name}</Link> },
                { key: "usdot", header: "USDOT", numeric: true, cell: (r) => r.usdot ?? "None" },
                { key: "named", header: "In consent", cell: (r) => (r.named ? <Status value="pass" label="Named" /> : <Status value="removed" label="Removed by consumer" />) },
              ]}
            />
          </div>
        ) : (
          <p className="text-text-2">No consent record. A request without one can never be sold.</p>
        )}
      </Card>

      <Table
        caption="Eligibility snapshot"
        compact
        rowKey={(r) => r.company_id}
        rows={detail.eligibility}
        empty={<p className="text-text-2">No eligible movers were matched.</p>}
        columns={[
          { key: "company", header: "Mover", cell: (r) => <Link className="text-link underline" href={`/admin/companies/${r.company_id}`}>{r.legal_name}</Link> },
          { key: "named", header: "Named in consent", cell: (r) => (r.named_in_consent ? "Yes" : "No") },
          { key: "rule", header: "Matched rule", cell: (r) => (r.matched_rule_id ? <ShortId id={r.matched_rule_id} /> : "None") },
          { key: "version", header: "Coverage version", numeric: true, cell: (r) => (r.coverage_version === r.current_coverage_version ? r.coverage_version : `${r.coverage_version} (now ${r.current_coverage_version})`) },
          { key: "at", header: "Matched", cell: (r) => <When value={r.matched_at} /> },
        ]}
      />

      <Table
        caption="Purchases and buyers"
        compact
        rowKey={(r) => r.id}
        rows={detail.purchases}
        empty={<p className="text-text-2">No purchases.</p>}
        columns={[
          { key: "pos", header: "Position", numeric: true, cell: (r) => r.position },
          { key: "company", header: "Buyer", cell: (r) => <Link className="text-link underline" href={`/admin/companies/${r.company_id}?tab=purchases`}>{r.legal_name}</Link> },
          { key: "type", header: "Type", cell: (r) => humanize(r.lead_type) },
          { key: "charged", header: "Charged", numeric: true, cell: (r) => <Money cents={r.charged_cents} /> },
          { key: "ref", header: "Payment ref", cell: (r) => (r.payment_ref ? <Mono>{r.payment_ref}</Mono> : "Credit only") },
          { key: "at", header: "Bought", cell: (r) => <When value={r.created_at} /> },
          { key: "refunded", header: "Refunded", cell: (r) => (r.refunded_at ? <When value={r.refunded_at} /> : "No") },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Table
          caption="Messages"
          compact
          rowKey={(r) => r.id}
          rows={detail.messages}
          empty={<p className="text-text-2">No messages.</p>}
          columns={[
            { key: "subject", header: "Subject", cell: (r) => r.subject ?? humanize(r.template) },
            { key: "channel", header: "Channel", cell: (r) => humanize(r.channel) },
            { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
            { key: "at", header: "Queued", cell: (r) => <When value={r.created_at} /> },
          ]}
        />
        <Table
          caption="Quality claims"
          compact
          rowKey={(r) => r.id}
          rows={detail.claims}
          empty={<p className="text-text-2">No claims.</p>}
          columns={[
            { key: "reason", header: "Reason", cell: (r) => humanize(r.reason) },
            { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
            { key: "at", header: "Filed", cell: (r) => <When value={r.created_at} /> },
          ]}
        />
      </div>
    </div>
  );
}
