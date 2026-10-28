import { EVIDENCE_KIND_LABELS, EVIDENCE_LABELS, EVIDENCE_LEVELS, REJECTION_REASONS, listReports, listResponses, listReviews, supportedEvidenceLevel } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { many } from "@amc/server/db";
import { Card, Field, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { LinkTabs, Mono, Status, When, humanize, param } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../_lib/roles";
import { descriptionAction } from "../companies/actions";
import { evidenceAction, moderateReviewAction, removeResponseAction, reportAction } from "./actions";

const item = adminNavItem("/admin/reviews");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
  { id: "removed", label: "Removed" },
  { id: "reports", label: "Reports" },
  { id: "responses", label: "Responses" },
  { id: "profiles", label: "Profile descriptions" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const Stars = ({ rating }: { rating: number }) => <span className="tabular font-semibold">{rating} of 5</span>;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const tab: Tab = (TABS.find((t) => t.id === param(sp.tab))?.id ?? "pending") as Tab;
  const canModerate = hasAdminRole(adminRole, ROLES.reviews);
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description="Reviews are rejected only for policy reasons, never for being negative. Every decision is recorded in the moderation log." />
      <LinkTabs label="Moderation queues" current={tab} items={TABS.map((t) => ({ id: t.id, label: t.label, href: `/admin/reviews?tab=${t.id}` }))} />
      {tab === "pending" || tab === "published" || tab === "rejected" || tab === "removed" ? <ReviewList status={tab} canModerate={canModerate && tab === "pending"} /> : null}
      {tab === "reports" ? <Reports canModerate={canModerate} /> : null}
      {tab === "responses" ? <Responses canModerate={canModerate} /> : null}
      {tab === "profiles" ? <Profiles canModerate={hasAdminRole(adminRole, ROLES.profiles)} /> : null}
    </div>
  );
}

async function ReviewList({ status, canModerate }: { status: string; canModerate: boolean }) {
  const reviews = await listReviews(status);
  if (!reviews.length) return <p className="text-text-2">No {status} reviews.</p>;
  return (
    <div className="grid gap-4">
      {reviews.map((r) => {
        const supported = supportedEvidenceLevel({ disclosed: r.disclosed, acceptedKinds: r.evidence.filter((e) => e.result === "accepted").map((e) => e.kind) });
        return (
          <Card
            key={r.id}
            as="article"
            title={r.title ?? "Untitled review"}
            titleAs="h2"
            description={
              <>
                <Link className="text-link underline" href={`/admin/companies/${r.company_id}`}>{r.legal_name}</Link> · {humanize(r.review_type)} · <Stars rating={r.rating} /> · {r.reviewer_display_name}
                {r.origin_state ? ` (${r.origin_state} to ${r.dest_state ?? "?"})` : ""} · submitted <When value={r.created_at} />
              </>
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3">
                <p className="whitespace-pre-line">{r.body ?? "No text."}</p>
                {r.incentive_disclosure ? <p className="type-small">Incentive disclosure: {r.incentive_disclosure}</p> : null}
                <p className="type-small text-text-2">
                  Label requested: {EVIDENCE_LABELS[r.evidence_level]}. Purchase {r.disclosed ? "disclosed" : "not disclosed"}; the evidence supports {supported ? EVIDENCE_LABELS[supported].toLowerCase() : "no label"}.
                </p>
                {r.status !== "pending" ? (
                  <p>
                    <Status value={r.status} /> {r.published_at ? <>on <When value={r.published_at} /></> : null} {r.rejection_reason ? `· ${r.rejection_reason}` : null}
                  </p>
                ) : null}
                <div>
                  <h3 className="mb-2 type-h4">Evidence</h3>
                  {r.evidence.length === 0 ? <p className="type-small text-text-2">No documents uploaded.</p> : null}
                  <ul className="grid gap-3">
                    {r.evidence.map((e) => (
                      <li key={e.id} className="rounded-control border border-border p-3">
                        <p className="font-semibold">{EVIDENCE_KIND_LABELS[e.kind] ?? humanize(e.kind)} <Status value={e.result} /></p>
                        {e.file_ref ? <p className="type-small"><Mono>{e.file_ref}</Mono></p> : null}
                        {e.note ? <p className="type-small text-text-2">{e.note}</p> : null}
                        {canModerate && e.result === "pending" ? (
                          <ActionForm action={evidenceAction} submitLabel="Record check" submitVariant="secondary" className="mt-2">
                            <input type="hidden" name="evidenceId" value={e.id} />
                            <Field id={`ev-result-${e.id}`} label="Document check" required>
                              <Select name="result" required defaultValue="">
                                <option value="" disabled>
                                  Choose
                                </option>
                                <option value="accepted">Accept: it shows this company and request</option>
                                <option value="rejected">Reject</option>
                              </Select>
                            </Field>
                            <Field id={`ev-note-${e.id}`} label="Note" optional help="Required when rejecting.">
                              <Textarea name="note" rows={2} maxLength={500} />
                            </Field>
                          </ActionForm>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {canModerate ? (
                <ActionForm action={moderateReviewAction} submitLabel="Record decision" confirm={{ title: "Record this moderation decision?", description: "Published reviews appear on the company's profile. Every decision is logged.", confirmLabel: "Record" }}>
                  <input type="hidden" name="reviewId" value={r.id} />
                  <Field id={`decision-${r.id}`} label="Decision" required>
                    <Select name="decision" required defaultValue="">
                      <option value="" disabled>
                        Choose
                      </option>
                      <option value="publish">Publish</option>
                      <option value="reject">Reject for a policy reason</option>
                    </Select>
                  </Field>
                  <Field id={`label-${r.id}`} label="Evidence label (when publishing)">
                    <Select name="evidenceLevel" defaultValue={supported && (r.review_type !== "move_experience" || supported === "completed_move") ? supported : ""}>
                      <option value="">Choose</option>
                      {EVIDENCE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {EVIDENCE_LABELS[level]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={`reason-${r.id}`} label="Policy reason (when rejecting)">
                    <Select name="reason" defaultValue="">
                      <option value="">Choose</option>
                      {Object.entries(REJECTION_REASONS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={`note-${r.id}`} label="Note" optional>
                    <Textarea name="note" rows={2} maxLength={500} />
                  </Field>
                </ActionForm>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

async function Reports({ canModerate }: { canModerate: boolean }) {
  const reports = await listReports("open");
  if (!reports.length) return <p className="text-text-2">No open reports.</p>;
  return (
    <div className="grid gap-4">
      {reports.map((r) => (
        <Card key={r.id} as="article" title={`Report on a review of ${r.review_company}`} titleAs="h2" description={<>From {r.reporter_type === "company" ? r.reporter_company ?? "a company" : "a consumer"} · <When value={r.created_at} /></>}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <p><strong>Reason:</strong> {r.reason}</p>
              <blockquote className="border-l-4 border-border-strong pl-4 text-text-2">
                <p className="font-semibold">{r.review_title ?? "Untitled"} · <Stars rating={r.review_rating} /> · <Status value={r.review_status} /></p>
                <p className="whitespace-pre-line">{r.review_body}</p>
              </blockquote>
            </div>
            {canModerate ? (
              <ActionForm action={reportAction} submitLabel="Record decision" confirm={{ title: "Record this report decision?", description: "Upholding removes the review from the profile.", confirmLabel: "Record" }}>
                <input type="hidden" name="reportId" value={r.id} />
                <Field id={`report-decision-${r.id}`} label="Decision" required>
                  <Select name="decision" required defaultValue="">
                    <option value="" disabled>
                      Choose
                    </option>
                    <option value="dismiss">Dismiss: the review stays</option>
                    <option value="uphold">Uphold: remove the review under the policy</option>
                  </Select>
                </Field>
                <Field id={`report-note-${r.id}`} label="Decision note" required>
                  <Textarea name="note" rows={2} required minLength={3} maxLength={1000} />
                </Field>
              </ActionForm>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

async function Responses({ canModerate }: { canModerate: boolean }) {
  const responses = await listResponses();
  return (
    <Table
      caption="Company responses"
      rowKey={(r) => r.id}
      rows={responses}
      empty={<p className="text-text-2">No responses.</p>}
      columns={[
        { key: "company", header: "Company", cell: (r) => r.legal_name },
        { key: "review", header: "Review", cell: (r) => r.review_title ?? "Untitled" },
        { key: "body", header: "Response", cell: (r) => <span className="whitespace-pre-line">{r.body}</span> },
        { key: "at", header: "Posted", cell: (r) => <When value={r.created_at} /> },
        {
          key: "remove",
          header: "Remove",
          cell: (r) =>
            canModerate ? (
              <ActionForm action={removeResponseAction} submitLabel="Remove" submitVariant="danger" confirm={{ title: "Remove this response?", description: "It disappears from the profile. The company can post a new one.", confirmLabel: "Remove" }}>
                <input type="hidden" name="responseId" value={r.id} />
                <Field id={`resp-reason-${r.id}`} label="Reason" required>
                  <Textarea name="reason" rows={2} required minLength={3} maxLength={500} />
                </Field>
              </ActionForm>
            ) : null,
        },
      ]}
    />
  );
}

async function Profiles({ canModerate }: { canModerate: boolean }) {
  const profiles = await many<{ company_id: string; legal_name: string; company_status: string; description: string; description_status: string; updated_at: Date }>(
    `select p.company_id, c.legal_name, c.status as company_status, p.description, p.description_status, p.updated_at
     from company_profiles p join companies c on c.id = p.company_id
     where p.description is not null and p.description_status = 'pending' order by p.updated_at`,
  );
  if (!profiles.length) return <p className="text-text-2">No descriptions waiting for review.</p>;
  return (
    <div className="grid gap-4">
      {profiles.map((p) => (
        <Card key={p.company_id} as="article" title={p.legal_name} titleAs="h2" description={<>Company <Status value={p.company_status} /> · edited <When value={p.updated_at} /></>}>
          <div className="grid gap-4 lg:grid-cols-2">
            <blockquote className="border-l-4 border-border-strong pl-4 whitespace-pre-line">{p.description}</blockquote>
            {canModerate ? (
              <ActionForm action={descriptionAction} submitLabel="Record decision">
                <input type="hidden" name="companyId" value={p.company_id} />
                <Field id={`desc-decision-${p.company_id}`} label="Decision" required>
                  <Select name="decision" required defaultValue="">
                    <option value="" disabled>
                      Choose
                    </option>
                    <option value="approve">Approve the description</option>
                    <option value="reject">Reject with a reason</option>
                  </Select>
                </Field>
                <Field id={`desc-reason-${p.company_id}`} label="Reason (for rejections)" optional>
                  <Textarea name="reason" rows={2} maxLength={1000} />
                </Field>
              </ActionForm>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
