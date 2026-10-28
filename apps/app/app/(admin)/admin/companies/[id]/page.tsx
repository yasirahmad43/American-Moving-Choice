import { randomUUID } from "node:crypto";
import { LEDGER_KIND_LABELS, getCompanyDetail, summarizePayload, type CheckRow } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { isUuid } from "@amc/server/db";
import { CHECK_LABELS, fmcsaSnapshotUrl } from "@amc/server/verification";
import { Alert, Card, CompanyStatusPill, DemoChip, Field, Input, Money, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { Facts, JsonDetails, LinkTabs, Mono, SectionTitle, ShortId, Status, When, humanize, param } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { adjustCreditAction, refundAction } from "../../billing/actions";
import { ROLES } from "../../_lib/roles";
import {
  approveAction,
  callbackAction,
  checkDecisionAction,
  descriptionAction,
  reinstateAction,
  rejectAction,
  rerunChecksAction,
  setPriceAction,
  suspendAction,
} from "../actions";

const item = adminNavItem("/admin/companies");

export const metadata: Metadata = { title: `Company · Admin` };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "verification", label: "Verification" },
  { id: "members", label: "Members" },
  { id: "coverage", label: "Coverage" },
  { id: "prices", label: "Prices" },
  { id: "rates", label: "Rate cards" },
  { id: "ledger", label: "Ledger" },
  { id: "purchases", label: "Purchases" },
  { id: "history", label: "History" },
  { id: "audit", label: "Audit" },
] as const;
type Tab = (typeof TABS)[number]["id"];

type Detail = NonNullable<Awaited<ReturnType<typeof getCompanyDetail>>>;

const dollars = (cents: number | undefined) => (cents === undefined ? "" : (cents / 100).toFixed(2));

export default async function CompanyDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const detail = await getCompanyDetail(id);
  if (!detail) notFound();
  const sp = await searchParams;
  const requested = param(sp.tab);
  const tab: Tab = (TABS.find((t) => t.id === requested)?.id ?? (["applied", "verifying", "in_review"].includes(detail.company.status) ? "verification" : "overview")) as Tab;
  const c = detail.company;
  const can = {
    verify: hasAdminRole(adminRole, ROLES.verification),
    price: hasAdminRole(adminRole, ROLES.pricing),
    profile: hasAdminRole(adminRole, ROLES.profiles),
    finance: hasAdminRole(adminRole, ROLES.finance),
  };
  return (
    <div className="grid gap-6">
      <PageHeader
        size="portal"
        breadcrumbs={[{ label: "Companies", href: "/admin/companies" }, { label: c.legal_name }]}
        title={c.legal_name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <CompanyStatusPill status={c.status} />
            {c.is_demo ? <DemoChip /> : null}
            <span className="tabular">USDOT {c.usdot_number ?? "none"}</span>
            <span>·</span>
            <span>{c.mc_number ?? "No MC number"}</span>
            {detail.eligibility.canPurchase ? <Status value="good" label="Can buy requests" /> : <Status value="suspended" label="Can't buy requests" />}
          </span>
        }
      />
      <LinkTabs label="Company sections" current={tab} items={TABS.map((t) => ({ id: t.id, label: t.label, href: `/admin/companies/${id}?tab=${t.id}` }))} />
      {tab === "overview" ? <Overview detail={detail} can={can} /> : null}
      {tab === "verification" ? <Verification detail={detail} canVerify={can.verify} /> : null}
      {tab === "members" ? <Members detail={detail} /> : null}
      {tab === "coverage" ? <Coverage detail={detail} /> : null}
      {tab === "prices" ? <Prices detail={detail} canPrice={can.price} /> : null}
      {tab === "rates" ? <Rates detail={detail} /> : null}
      {tab === "ledger" ? <Ledger detail={detail} canFinance={can.finance} /> : null}
      {tab === "purchases" ? <Purchases detail={detail} canFinance={can.finance} /> : null}
      {tab === "history" ? <History detail={detail} /> : null}
      {tab === "audit" ? <AuditTab detail={detail} /> : null}
    </div>
  );
}

function Hidden({ id }: { id: string }) {
  return <input type="hidden" name="companyId" value={id} />;
}

// ------------------------------------------------------------------ overview

function Overview({ detail, can }: { detail: Detail; can: { verify: boolean; profile: boolean } }) {
  const c = detail.company;
  const p = detail.profile;
  const address = [c.address_line1, c.address_line2, c.address_city, c.address_state, c.address_zip].filter(Boolean).join(", ");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Application data" titleAs="h2">
        <Facts
          items={[
            { label: "Legal name", value: c.legal_name },
            { label: "DBA", value: c.dba_name },
            { label: "Business address", value: address || null },
            { label: "Phone (supplied)", value: c.phone },
            { label: "Website", value: c.website },
            { label: "Applied", value: <When value={c.created_at} /> },
            { label: "Approved", value: c.approved_at ? <When value={c.approved_at} /> : null },
            { label: "Suspended", value: c.suspended_at ? <When value={c.suspended_at} /> : null },
            { label: "Status reason", value: c.status_reason },
            { label: "Billing status", value: <Status value={c.billing_status} /> },
            { label: "Credentials valid until", value: c.credentials_valid_until ? <When value={c.credentials_valid_until} date /> : null },
            { label: "Credit balance", value: <Money cents={c.balance_cents} /> },
            { label: "Coverage version", value: <span className="tabular">{c.coverage_version}</span> },
          ]}
        />
      </Card>
      <Card title="Public profile" titleAs="h2">
        {p ? (
          <div className="grid gap-4">
            <Facts
              items={[
                { label: "Display name", value: p.display_name },
                { label: "Slug", value: <Mono>/companies/{p.slug}/</Mono> },
                { label: "Public status", value: <Status value={p.public_status} /> },
                { label: "Joined the network", value: p.network_joined_at ? <When value={p.network_joined_at} date /> : null },
                { label: "Description", value: <Status value={p.description_status} /> },
                { label: "Badge", value: detail.badges.find((b) => !b.revoked_at) ? <Status value="approved" label="Preferred Mover: active" /> : <Status value="hidden" label="No active badge" /> },
              ]}
            />
            {p.description ? <blockquote className="border-l-4 border-border-strong pl-4 text-text-2 whitespace-pre-line">{p.description}</blockquote> : <p className="text-text-3">No description yet.</p>}
            {p.description_rejection_reason ? <Alert tone="warning">Last rejection: {p.description_rejection_reason}</Alert> : null}
            {can.profile && p.description && p.description_status !== "approved" ? (
              <ActionForm action={descriptionAction} submitLabel="Record decision">
                <Hidden id={c.id} />
                <Field id="decision" label="Description decision">
                  <Select name="decision" required defaultValue="">
                    <option value="" disabled>
                      Choose
                    </option>
                    <option value="approve">Approve the description</option>
                    <option value="reject">Reject with a reason</option>
                  </Select>
                </Field>
                <Field id="reason" label="Reason (for rejections)" optional>
                  <Textarea name="reason" rows={2} maxLength={1000} />
                </Field>
              </ActionForm>
            ) : null}
          </div>
        ) : (
          <p className="text-text-2">No profile yet. Approval creates one from the company name.</p>
        )}
      </Card>
      {can.verify ? <StatusDecisions detail={detail} /> : null}
      <Card title="Outbox messages to this company" titleAs="h2">
        <Table
          caption="Messages"
          hideCaption
          compact
          rowKey={(m) => m.id}
          rows={detail.messages}
          empty={<p className="text-text-2">None.</p>}
          columns={[
            { key: "subject", header: "Subject", cell: (m) => m.subject ?? humanize(m.template) },
            { key: "status", header: "Status", cell: (m) => <Status value={m.status} /> },
            { key: "at", header: "Queued", cell: (m) => <When value={m.created_at} /> },
          ]}
        />
        <p className="mt-3 type-small">
          <Link className="text-link underline" href="/admin/mailbox">
            Open the mailbox
          </Link>
        </p>
      </Card>
    </div>
  );
}

function StatusDecisions({ detail }: { detail: Detail }) {
  const c = detail.company;
  if (c.status === "approved") {
    return (
      <Card title="Suspend" titleAs="h2" description="Stops new purchases, revokes the badge and shows the profile as under review. Purchased requests and CRM history stay available.">
        <ActionForm
          action={suspendAction}
          submitLabel="Suspend company"
          submitVariant="danger"
          confirm={{ title: `Suspend ${c.legal_name}?`, description: "The owner is emailed the reason. Reinstating needs every check to pass again.", confirmLabel: "Suspend" }}
        >
          <Hidden id={c.id} />
          <Field id="suspend-reason" label="Reason (sent to the owner)" required>
            <Textarea name="reason" rows={3} required minLength={3} maxLength={1000} />
          </Field>
        </ActionForm>
      </Card>
    );
  }
  if (c.status === "suspended") {
    return (
      <Card title="Reinstate" titleAs="h2" description="Needs every check to pass (re-run the checks and record reviewer decisions first). Reissues the badge.">
        {detail.eligibility.approvable ? null : <Alert tone="warning">Not ready: {[...detail.eligibility.blockers, ...detail.eligibility.pending.map((t) => `${CHECK_LABELS[t]} pending`)].join(" ")}</Alert>}
        <ActionForm action={reinstateAction} submitLabel="Reinstate company" confirm={{ title: `Reinstate ${c.legal_name}?`, description: "Purchases resume and the badge is reissued.", confirmLabel: "Reinstate" }}>
          <Hidden id={c.id} />
          <Field id="reinstate-reason" label="Reason" required>
            <Textarea name="reason" rows={3} required minLength={3} maxLength={1000} />
          </Field>
        </ActionForm>
      </Card>
    );
  }
  return null;
}

// ------------------------------------------------------------------ verification

function CheckEvidence({ check }: { check: CheckRow }) {
  const lines = summarizePayload(check.payload_snapshot);
  return (
    <div className="grid gap-1 type-small">
      {check.decision_note ? <p className="text-text">{check.decision_note}</p> : null}
      {lines.length ? (
        <ul className="list-disc pl-5 text-text-2">
          {lines.map((line) => (
            <li key={line} className="break-words">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-text-3">
        Source {check.source}
        {check.source_url ? (
          <>
            {" · "}
            {check.source_url.startsWith("http") ? (
              <a className="text-link underline" href={check.source_url} rel="noreferrer" target="_blank">
                record
              </a>
            ) : (
              <Mono>{check.source_url}</Mono>
            )}
          </>
        ) : null}
        {check.payload_sha256 ? (
          <>
            {" · sha256 "}
            <Mono>{check.payload_sha256.slice(0, 12)}</Mono>
          </>
        ) : null}
      </p>
      <JsonDetails value={check.payload_snapshot} summary="Show the payload snapshot" />
    </div>
  );
}

function RecordDiff({ detail }: { detail: Detail }) {
  const identity = detail.checks.find((ch) => ch.check_type === "identity_match" && ch.source !== "manual");
  const payload = identity?.payload_snapshot as Record<string, unknown> | undefined;
  if (!payload || !("legal_name" in payload)) return <p className="text-text-2">No official record snapshot yet. Re-run the automated checks.</p>;
  const app = (payload.application ?? {}) as Record<string, unknown>;
  const addr = (a: unknown) => {
    if (!a || typeof a !== "object") return "None";
    const o = a as Record<string, unknown>;
    return [o.line1, o.city, o.state, o.zip].filter(Boolean).join(", ") || "None";
  };
  const dockets = Array.isArray(payload.authorities) ? (payload.authorities as Record<string, unknown>[]).map((a) => `${a.docket} (${a.type}, ${a.status})`).join("; ") : "None";
  const rows = [
    { field: "Legal name", application: String(app.legal_name ?? detail.company.legal_name), record: String(payload.legal_name ?? "None") },
    { field: "DBA", application: String(app.dba_name ?? "None"), record: String(payload.dba_name ?? "None") },
    { field: "Address", application: addr(app.address), record: addr(payload.physical_address) },
    { field: "MC number", application: String(app.mc_number ?? "None"), record: dockets },
    { field: "Phone", application: detail.company.phone ?? "None", record: String(payload.phone_on_record ?? "None") },
  ];
  return (
    <Table
      caption="Application compared with the official record"
      compact
      rowKey={(r) => r.field}
      rows={rows}
      columns={[
        { key: "field", header: "Field", cell: (r) => r.field },
        { key: "app", header: "Application", cell: (r) => r.application },
        { key: "record", header: "Official record", cell: (r) => r.record },
        { key: "match", header: "Same", cell: (r) => (r.application.toLowerCase() === r.record.toLowerCase() ? <Status value="pass" label="Same" /> : <Status value="needs_review" label="Differs" />) },
      ]}
    />
  );
}

function Verification({ detail, canVerify }: { detail: Detail; canVerify: boolean }) {
  const c = detail.company;
  const e = detail.eligibility;
  const latestRows = Object.entries(CHECK_LABELS).map(([type, label]) => ({ type, label, check: detail.checks.find((ch) => ch.check_type === type) ?? null }));
  const isApplication = ["applied", "verifying", "in_review"].includes(c.status);
  const current = detail.prices[0];
  return (
    <div className="grid gap-6">
      {e.blockers.length ? (
        <Alert tone="error" title="Blocks approval">
          <ul className="list-disc pl-5">
            {e.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Alert>
      ) : null}
      {e.pending.length ? <Alert tone="warning" title="Waiting for a decision">{e.pending.map((t) => CHECK_LABELS[t]).join(", ")}.</Alert> : null}
      {e.approvable ? <Alert tone="success">Every check has passed and nothing blocks approval.</Alert> : null}

      <div className="grid gap-6">
        <section aria-labelledby="checklist" className="min-w-0">
          <SectionTitle id="checklist" description="The newest evidence row of each check. A reviewer decision is a newer row; nothing is edited.">
            Evidence checklist
          </SectionTitle>
          <Table
            caption="Evidence checklist"
            hideCaption
            rowKey={(r) => r.type}
            rows={latestRows}
            columns={[
              { key: "check", header: "Check", cell: (r) => <span className="font-semibold">{r.label}</span> },
              { key: "result", header: "Result", cell: (r) => (r.check ? <Status value={r.check.result} /> : <Status value="pending" label="Not run" />) },
              { key: "when", header: "Retrieved", cell: (r) => (r.check ? <When value={r.check.retrieved_at} /> : null) },
              { key: "who", header: "Reviewer", cell: (r) => r.check?.reviewer_email ?? (r.check ? "Automated" : null) },
              { key: "evidence", header: "Evidence", cell: (r) => (r.check ? <CheckEvidence check={r.check} /> : null) },
            ]}
          />
          <p className="mt-3 type-small">
            {c.usdot_number ? (
              <a className="text-link underline" href={fmcsaSnapshotUrl(c.usdot_number)} target="_blank" rel="noreferrer">
                Open the FMCSA company snapshot for USDOT {c.usdot_number}
              </a>
            ) : null}
          </p>
        </section>
        <section aria-labelledby="diff" className="grid min-w-0 content-start gap-6 lg:grid-cols-2">
          <div className="min-w-0 lg:col-span-2">
            <SectionTitle id="diff">Submitted data and the official record</SectionTitle>
            <RecordDiff detail={detail} />
          </div>
          <div className="min-w-0">
            <h3 className="mb-2 type-h4 text-text">Credentials</h3>
            <Table
              caption="Credentials"
              hideCaption
              compact
              rowKey={(r) => r.id}
              rows={detail.credentials}
              empty={<p className="text-text-2">None on file.</p>}
              columns={[
                { key: "type", header: "Type", cell: (r) => humanize(r.credential_type) },
                { key: "number", header: "Number", cell: (r) => r.number ?? "None" },
                { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
                { key: "expires", header: "Expires", cell: (r) => (r.expires_on ? <When value={r.expires_on} date /> : "None") },
              ]}
            />
          </div>
          <div className="min-w-0">
            <h3 className="mb-2 type-h4 text-text">Authority on record</h3>
            <Table
              caption="Authority"
              hideCaption
              compact
              rowKey={(r) => `${r.docket_number}-${r.authority_type}`}
              rows={detail.authorities}
              empty={<p className="text-text-2">None recorded.</p>}
              columns={[
                { key: "docket", header: "Docket", cell: (r) => r.docket_number },
                { key: "type", header: "Type", cell: (r) => humanize(r.authority_type) },
                { key: "scope", header: "Scope", cell: (r) => humanize(r.scope) },
                { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
              ]}
            />
          </div>
        </section>
      </div>

      {canVerify ? (
        <section aria-labelledby="decisions" className="grid gap-6">
          <SectionTitle id="decisions">Decisions</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Re-run automated checks" titleAs="h3" description="Looks the USDOT number up again (fixture data in demo mode) and records a new row per check.">
              <ActionForm action={rerunChecksAction} submitLabel="Re-run checks" submitVariant="secondary">
                <Hidden id={c.id} />
              </ActionForm>
            </Card>
            <Card title="Callback verification" titleAs="h3" description="Call the phone number on the official record, not the one the company supplied.">
              {detail.officialPhone ? (
                <ActionForm action={callbackAction} submitLabel="Record callback">
                  <Hidden id={c.id} />
                  <p>
                    Number on the official record: <strong className="tabular">{detail.officialPhone}</strong>
                    {c.phone && c.phone !== detail.officialPhone ? <span className="text-text-2"> (the application gave {c.phone})</span> : null}
                  </p>
                  <Field id="callback-outcome" label="What the call confirmed" required>
                    <Select name="outcome" required defaultValue="">
                      <option value="" disabled>
                        Choose
                      </option>
                      <option value="confirmed">The company confirmed this application</option>
                      <option value="not_confirmed">The company did not confirm it</option>
                    </Select>
                  </Field>
                  <Field id="callback-note" label="Note (who you spoke to, when)" required>
                    <Textarea name="note" rows={3} required minLength={3} maxLength={2000} />
                  </Field>
                </ActionForm>
              ) : (
                <p className="text-text-2">No phone number from the official record yet. Re-run the automated checks first.</p>
              )}
            </Card>
            <Card title="Record a reviewer decision" titleAs="h3" description="For name or address mismatches, record changes, state credentials and insurance certificates.">
              <ActionForm action={checkDecisionAction} submitLabel="Record decision">
                <Hidden id={c.id} />
                <Field id="decision-check" label="Check" required>
                  <Select name="checkType" required defaultValue="">
                    <option value="" disabled>
                      Choose a check
                    </option>
                    {Object.entries(CHECK_LABELS)
                      .filter(([type]) => type !== "callback_verification")
                      .map(([type, label]) => (
                        <option key={type} value={type}>
                          {label}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field id="decision-result" label="Result" required>
                  <Select name="result" required defaultValue="">
                    <option value="" disabled>
                      Choose
                    </option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="needs_review">Still needs review</option>
                  </Select>
                </Field>
                <Field id="decision-note" label="Reviewer note (what you checked)" required>
                  <Textarea name="note" rows={3} required minLength={3} maxLength={2000} />
                </Field>
              </ActionForm>
            </Card>
            {isApplication ? (
              <Card title="Approve" titleAs="h3" description="Needs every check to pass. Sets the starting prices, issues the badge and puts the profile live.">
                <ActionForm
                  action={approveAction}
                  submitLabel="Approve company"
                  resetOnSuccess={false}
                  confirm={{ title: `Approve ${c.legal_name}?`, description: "The company can buy requests at these prices, gets the Preferred Mover badge and appears in the directory.", confirmLabel: "Approve" }}
                >
                  <Hidden id={c.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="approve-exclusive" label="Exclusive price ($)" required help="Price when the consumer chose 1 mover.">
                      <Input name="exclusive" inputMode="decimal" required defaultValue={dollars(current?.exclusive_cents)} />
                    </Field>
                    <Field id="approve-shared" label="Shared price ($)" required help="Before the sharing step-down.">
                      <Input name="shared" inputMode="decimal" required defaultValue={dollars(current?.shared_cents)} />
                    </Field>
                  </div>
                  {detail.profile?.description ? (
                    <div className="grid gap-2">
                      <p className="type-small font-semibold text-text-2">Profile description ({humanize(detail.profile.description_status)})</p>
                      <blockquote className="border-l-4 border-border-strong pl-4 type-small text-text-2 whitespace-pre-line">{detail.profile.description}</blockquote>
                      {detail.profile.description_status !== "approved" ? (
                        <label className="flex min-h-11 items-start gap-3 py-2">
                          <input type="checkbox" name="approveDescription" className="mt-0.5 size-5 accent-primary" />
                          <span>Approve this description too, so the profile goes live</span>
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                  <Field id="approve-note" label="Note" optional>
                    <Textarea name="note" rows={2} maxLength={1000} />
                  </Field>
                </ActionForm>
              </Card>
            ) : null}
            {isApplication ? (
              <Card title="Reject" titleAs="h3" description="The owner is emailed the reason and may apply again after fixing it.">
                <ActionForm
                  action={rejectAction}
                  submitLabel="Reject application"
                  submitVariant="danger"
                  confirm={{ title: `Reject ${c.legal_name}?`, description: "The owner receives the reason by email.", confirmLabel: "Reject" }}
                >
                  <Hidden id={c.id} />
                  <Field id="reject-reason" label="Reason (sent to the owner)" required>
                    <Textarea name="reason" rows={3} required minLength={3} maxLength={1000} />
                  </Field>
                </ActionForm>
              </Card>
            ) : null}
            <StatusDecisions detail={detail} />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all-checks">
        <SectionTitle id="all-checks">Verification history</SectionTitle>
        <Table
          caption="Every verification check"
          hideCaption
          compact
          rowKey={(r) => r.id}
          rows={detail.checks}
          empty={<p className="text-text-2">No checks yet.</p>}
          columns={[
            { key: "at", header: "Recorded", cell: (r) => <When value={r.created_at} /> },
            { key: "check", header: "Check", cell: (r) => CHECK_LABELS[r.check_type] },
            { key: "result", header: "Result", cell: (r) => <Status value={r.result} /> },
            { key: "source", header: "Source", cell: (r) => r.source },
            { key: "who", header: "Reviewer", cell: (r) => r.reviewer_email ?? "Automated" },
            { key: "note", header: "Note", cell: (r) => r.decision_note },
          ]}
        />
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ other tabs

function Members({ detail }: { detail: Detail }) {
  return (
    <div className="grid gap-6">
      <Table
        caption="Team members"
        rowKey={(r) => r.id}
        rows={detail.members}
        empty={<p className="text-text-2">No members.</p>}
        columns={[
          { key: "name", header: "Name", cell: (r) => r.full_name ?? "None" },
          { key: "email", header: "Email", cell: (r) => r.email },
          { key: "role", header: "Role", cell: (r) => humanize(r.role) },
          { key: "status", header: "Status", cell: (r) => <Status value={r.status === "active" ? "approved" : "hidden"} label={humanize(r.status)} /> },
          { key: "buy", header: "Can buy", cell: (r) => (r.can_purchase ? "Yes" : "No") },
          { key: "mfa", header: "Two-step", cell: (r) => (r.mfa_enabled_at ? "On" : "Off") },
          { key: "login", header: "Last sign-in", cell: (r) => <When value={r.last_login_at} /> },
        ]}
      />
      <Table
        caption="Invitations"
        rowKey={(r) => r.id}
        rows={detail.invitations}
        empty={<p className="text-text-2">No invitations.</p>}
        columns={[
          { key: "email", header: "Email", cell: (r) => r.email },
          { key: "role", header: "Role", cell: (r) => humanize(r.role) },
          { key: "state", header: "State", cell: (r) => (r.accepted_at ? "Accepted" : r.revoked_at ? "Revoked" : new Date(r.expires_at) < new Date() ? "Expired" : "Pending") },
          { key: "sent", header: "Sent", cell: (r) => <When value={r.created_at} /> },
        ]}
      />
    </div>
  );
}

function Coverage({ detail }: { detail: Detail }) {
  const cap = detail.capabilities;
  return (
    <div className="grid gap-6">
      <Card title="Verified capabilities" titleAs="h2" description="The ceiling coverage rules can't widen. Read-only here; companies edit coverage in the portal.">
        {cap ? (
          <Facts
            items={[
              { label: "Move types", value: cap.move_types.map(humanize).join(", ") || null },
              { label: "Home sizes", value: cap.move_sizes.join(", ") || null },
              { label: "Services", value: cap.services.map(humanize).join(", ") || null },
            ]}
          />
        ) : (
          <p className="text-text-2">None recorded.</p>
        )}
      </Card>
      <Table
        caption="Coverage rules"
        rowKey={(r) => r.id}
        rows={detail.coverage}
        empty={<p className="text-text-2">No coverage rules.</p>}
        columns={[
          { key: "label", header: "Rule", cell: (r) => r.label ?? <ShortId id={r.id} /> },
          { key: "kind", header: "Kind", cell: (r) => humanize(r.kind) },
          { key: "types", header: "Move types", cell: (r) => r.move_types.join(", ") || "Any" },
          { key: "origin", header: "Origin", cell: (r) => r.locations.filter((l) => l.side === "origin").map((l) => `${l.level} ${l.value}`).join(", ") || "Anywhere" },
          { key: "dest", header: "Destination", cell: (r) => r.locations.filter((l) => l.side === "destination").map((l) => `${l.level} ${l.value}`).join(", ") || "Anywhere" },
          { key: "paused", header: "Paused", cell: (r) => (r.paused ? "Yes" : "No") },
        ]}
      />
    </div>
  );
}

function Prices({ detail, canPrice }: { detail: Detail; canPrice: boolean }) {
  const current = detail.prices[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <Table
        caption="Price history (append-only)"
        rowKey={(r) => r.id}
        rows={detail.prices}
        empty={<p className="text-text-2">No prices yet. Prices are set at approval.</p>}
        columns={[
          { key: "from", header: "Effective from", cell: (r) => <When value={r.effective_from} /> },
          { key: "excl", header: "Exclusive", numeric: true, cell: (r) => <Money cents={r.exclusive_cents} /> },
          { key: "shared", header: "Shared", numeric: true, cell: (r) => <Money cents={r.shared_cents} /> },
          { key: "by", header: "Set by", cell: (r) => r.set_by_email ?? r.set_by },
        ]}
      />
      {canPrice ? (
        <Card title="Set new prices" titleAs="h2" description="Adds a row; earlier purchases keep the price they used.">
          <ActionForm action={setPriceAction} submitLabel="Add prices" resetOnSuccess={false}>
            <Hidden id={detail.company.id} />
            <Field id="price-exclusive" label="Exclusive price ($)" required>
              <Input name="exclusive" inputMode="decimal" required defaultValue={dollars(current?.exclusive_cents)} />
            </Field>
            <Field id="price-shared" label="Shared price ($)" required>
              <Input name="shared" inputMode="decimal" required defaultValue={dollars(current?.shared_cents)} />
            </Field>
            <Field id="price-note" label="Note" optional>
              <Input name="note" maxLength={500} />
            </Field>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}

function Rates({ detail }: { detail: Detail }) {
  return (
    <Table
      caption="Rate cards"
      rowKey={(r) => r.id}
      rows={detail.rateCards}
      empty={<p className="text-text-2">No rate cards.</p>}
      columns={[
        { key: "states", header: "States", cell: (r) => r.states.join(", ") },
        { key: "status", header: "Status", cell: (r) => <Status value={r.status === "active" ? "approved" : "hidden"} label={humanize(r.status)} /> },
        { key: "created", header: "Submitted", cell: (r) => <When value={r.created_at} date /> },
        { key: "data", header: "Rates", cell: (r) => <JsonDetails value={{ local: r.local, long_distance: r.long_distance }} summary="Show rates" /> },
      ]}
    />
  );
}

function Ledger({ detail, canFinance }: { detail: Detail; canFinance: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="grid gap-3">
        <p>
          Credit balance: <strong>
            <Money cents={detail.company.balance_cents} />
          </strong>
        </p>
        <Table
          caption="Ledger (latest 200)"
          compact
          rowKey={(r) => r.id}
          rows={detail.ledger}
          empty={<p className="text-text-2">No ledger entries.</p>}
          columns={[
            { key: "at", header: "When", cell: (r) => <When value={r.created_at} /> },
            { key: "kind", header: "Kind", cell: (r) => LEDGER_KIND_LABELS[r.kind as keyof typeof LEDGER_KIND_LABELS] ?? r.kind },
            { key: "amount", header: "Amount", numeric: true, cell: (r) => <Money cents={r.amount_cents} /> },
            { key: "purchase", header: "Purchase", cell: (r) => (r.purchase_id ? <ShortId id={r.purchase_id} /> : null) },
            { key: "note", header: "Note", cell: (r) => r.note },
          ]}
        />
      </div>
      {canFinance ? (
        <Card title="Credit adjustment" titleAs="h2" description="Positive adds account credit; negative (such as -25) removes it. Can't take the available balance below zero.">
          <ActionForm
            action={adjustCreditAction}
            submitLabel="Record adjustment"
            confirm={{ title: "Record this adjustment?", description: "Ledger entries can't be edited or deleted. A mistake needs an opposite adjustment.", confirmLabel: "Record" }}
          >
            <Hidden id={detail.company.id} />
            <input type="hidden" name="key" value={randomUUID()} />
            <Field id="adjust-amount" label="Amount ($)" required>
              <Input name="amount" inputMode="decimal" required />
            </Field>
            <Field id="adjust-note" label="Note" required>
              <Textarea name="note" rows={2} required minLength={3} maxLength={500} />
            </Field>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}

function Purchases({ detail, canFinance }: { detail: Detail; canFinance: boolean }) {
  return (
    <Table
      caption="Purchases (latest 200)"
      rowKey={(r) => r.id}
      rows={detail.purchases}
      empty={<p className="text-text-2">No purchases.</p>}
      columns={[
        { key: "at", header: "Bought", cell: (r) => <When value={r.created_at} /> },
        { key: "ref", header: "Request", cell: (r) => r.reference_code ?? <ShortId id={r.group_id} /> },
        { key: "type", header: "Type", cell: (r) => `${humanize(r.lead_type)} #${r.position}` },
        { key: "list", header: "List price", numeric: true, cell: (r) => <Money cents={r.list_price_cents} /> },
        { key: "charged", header: "Charged", numeric: true, cell: (r) => <Money cents={r.charged_cents} /> },
        { key: "payment", header: "Payment ref", cell: (r) => (r.payment_ref ? <Mono>{r.payment_ref}</Mono> : "Credit only") },
        { key: "refunded", header: "Refunded", cell: (r) => (r.refunded_at ? <When value={r.refunded_at} /> : canFinance ? <Link className="text-link underline" href={`/admin/billing?tab=refunds&purchase=${r.id}`}>Refund</Link> : "No") },
      ]}
    />
  );
}

function History({ detail }: { detail: Detail }) {
  return (
    <div className="grid gap-6">
      <Table
        caption="Status history"
        rowKey={(r) => r.id}
        rows={detail.history}
        columns={[
          { key: "at", header: "When", cell: (r) => <When value={r.created_at} /> },
          { key: "from", header: "From", cell: (r) => (r.from_status ? <CompanyStatusPill status={r.from_status as "approved"} /> : "None") },
          { key: "to", header: "To", cell: (r) => <CompanyStatusPill status={r.to_status as "approved"} /> },
          { key: "reason", header: "Reason", cell: (r) => r.reason },
          { key: "by", header: "By", cell: (r) => r.changed_by_email ?? "System" },
        ]}
      />
      <Table
        caption="Badges"
        rowKey={(r) => r.id}
        rows={detail.badges}
        empty={<p className="text-text-2">No badges.</p>}
        columns={[
          { key: "issued", header: "Issued", cell: (r) => <When value={r.issued_at} /> },
          { key: "revoked", header: "Revoked", cell: (r) => (r.revoked_at ? <When value={r.revoked_at} /> : "Active") },
          { key: "reason", header: "Reason", cell: (r) => r.reason },
          { key: "evidence", header: "Evidence checks", numeric: true, cell: (r) => r.evidence_check_ids.length },
        ]}
      />
    </div>
  );
}

function AuditTab({ detail }: { detail: Detail }) {
  return (
    <Table
      caption="Audit entries for this company (latest 200)"
      compact
      rowKey={(r) => r.id}
      rows={detail.audit}
      empty={<p className="text-text-2">No audit entries.</p>}
      columns={[
        { key: "at", header: "When", cell: (r) => <When value={r.created_at} /> },
        { key: "action", header: "Action", cell: (r) => <Mono>{r.action}</Mono> },
        { key: "actor", header: "Actor", cell: (r) => r.actor_email ?? `${r.actor_type}${r.actor_id ? `: ${r.actor_id}` : ""}` },
        { key: "data", header: "Change", cell: (r) => <JsonDetails value={{ before: r.before, after: r.after }} summary="Show change" /> },
      ]}
    />
  );
}
