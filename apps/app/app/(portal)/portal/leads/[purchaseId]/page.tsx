import { requestMeta, requireMembership } from "@amc/server/auth";
import { CLAIM_REASONS } from "@amc/server/billing";
import { CRM_STAGE_LABELS, CRM_STAGES, CrmError, getRecord, type CrmRecordDetail } from "@amc/server/crm";
import { PermissionError } from "@amc/server/marketplace";
import { AbsoluteDate, Alert, Card, Chip, Field, Input, Money, PageHeader, Select, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/portal/marketplace/action-form";
import { FollowUpChip } from "@/components/portal/marketplace/follow-up-chip";
import { CHANNEL_LABELS, CLAIM_STATUS_LABELS, MOVE_SIZE_LABELS, MOVE_TYPE_LABELS, SERVICE_LABELS, SOURCE_LABELS, label, ordinal } from "@/components/portal/marketplace/labels";
import { portalNavItem } from "@/lib/nav/portal";
import { addNoteAction, assignAction, requestReviewAction, submitClaimAction, updateDetailsAction, updateStageAction } from "../actions";

const item = portalNavItem("/portal/leads");

export const metadata: Metadata = { title: "Purchased request" };

function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="type-small text-text-3">{term}</dt>
      <dd className="text-text">{children}</dd>
    </div>
  );
}

const ACTIVITY_LABELS: Record<string, string> = {
  note: "Note",
  purchased: "Purchased",
  stage_change: "Stage",
  follow_up: "Follow-up",
  estimated_value: "Estimated value",
  assignment: "Assignment",
  lost_reason: "Lost reason",
  review_requested: "Review request",
  call: "Call",
  email: "Email",
  sms: "Text message",
};

function Timeline({ record }: { record: CrmRecordDetail }) {
  if (record.timeline.length === 0) return <p className="text-text-2">No notes or activity yet.</p>;
  return (
    <ol className="grid gap-3" aria-label="Notes and activity, newest first">
      {record.timeline.map((entry) => (
        <li key={entry.id} className={`rounded-control border border-border p-3 ${entry.kind === "note" ? "bg-surface-2" : "bg-surface"}`}>
          <p className="type-small text-text-3">
            <span className="font-semibold text-text-2">{ACTIVITY_LABELS[entry.type] ?? entry.type}</span> · <AbsoluteDate value={entry.at} withTime />
            {entry.actorName ? ` · ${entry.actorName}` : ""}
          </p>
          {entry.body ? <p className="mt-1 whitespace-pre-line">{entry.body}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export default async function PurchasedRequestPage({ params }: { params: Promise<{ purchaseId: string }> }) {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const { purchaseId } = await params;
  const { ip } = await requestMeta();
  let record: CrmRecordDetail;
  try {
    record = await getRecord({ userId: user.id, companyId: membership.companyId, ip }, purchaseId);
  } catch (error) {
    if (error instanceof CrmError || error instanceof PermissionError) notFound();
    throw error;
  }
  const { contact, move, consent, purchase } = record;
  const name = contact ? `${contact.firstName} ${contact.lastName}` : "Customer";
  const hidden = { purchaseId };
  const claimOpen = new Date() <= record.claimDeadline && !purchase.refundedAt;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={name}
        overline={move.referenceCode ?? undefined}
        breadcrumbs={[{ label: "Purchased requests", href: "/portal/leads" }, { label: name }]}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Chip tone={purchase.leadType === "exclusive" ? "exclusive" : "shared"}>{purchase.leadType === "exclusive" ? "Exclusive" : "Shared"}</Chip>
            <span>
              Stage: <strong>{CRM_STAGE_LABELS[record.stage]}</strong>
            </span>
            <FollowUpChip at={record.followUpAt} />
          </span>
        }
        size="portal"
      />

      {move.withdrawnAt ? (
        <Alert tone="error" title="The customer withdrew consent">
          On <AbsoluteDate value={move.withdrawnAt} withTime /> the customer withdrew this request. Stop contacting them about it.
        </Alert>
      ) : null}
      <p className="type-small text-text-2">Notes and activity are private to your company, even on shared requests.</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="grid content-start gap-6">
          <Card title="Contact details" titleAs="h2">
            {contact ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <Fact term="Name">{name}</Fact>
                <Fact term="Phone">
                  <a className="link tabular" href={`tel:${contact.phone}`}>
                    {formatPhone(contact.phone)}
                  </a>
                </Fact>
                <Fact term="Email">
                  <a className="link break-all" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                </Fact>
              </dl>
            ) : (
              <p className="text-text-2">Contact details are not available for this purchase.</p>
            )}
            <p className="mt-3 type-small text-text-3">Each time this page is opened, the view is logged. Contact the customer only about this move and within their consent.</p>
          </Card>

          <Card title="Move details" titleAs="h2">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact term="From">
                {move.originCity}, {move.originState} <span className="tabular">{move.originZip}</span>
              </Fact>
              <Fact term="To">
                {move.destCity}, {move.destState} <span className="tabular">{move.destZip}</span>
              </Fact>
              <Fact term="Move date">
                {move.moveDate ? <AbsoluteDate value={move.moveDate} /> : "Not given"}
                {move.moveDateFlexible ? " (flexible)" : ""}
              </Fact>
              <Fact term="Size">{label(MOVE_SIZE_LABELS, move.moveSize)}</Fact>
              <Fact term="Move type">{label(MOVE_TYPE_LABELS, move.moveType)}</Fact>
              <Fact term="Distance">{move.distanceMiles === null ? "Not given" : <span className="tabular">{Math.round(move.distanceMiles)} miles</span>}</Fact>
              <Fact term="Services">{move.services.length ? move.services.map((s) => label(SERVICE_LABELS, s)).join(", ") : "None requested"}</Fact>
              <Fact term="Source">{label(SOURCE_LABELS, move.sourceCategory)}</Fact>
              <Fact term="Submitted">
                <AbsoluteDate value={move.submittedAt} withTime />
              </Fact>
            </dl>
          </Card>

          <Card title="Consent summary" titleAs="h2">
            {consent ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <Fact term="May contact by">{consent.channels.map((c) => label(CHANNEL_LABELS, c)).join(", ")}</Fact>
                <Fact term="Consent given">
                  <AbsoluteDate value={consent.submittedAt} withTime />
                </Fact>
                <Fact term="Most movers the customer allowed">
                  <span className="tabular">{consent.selectedLimit}</span>
                </Fact>
                <Fact term="Eligible companies recorded">
                  <span className="tabular">{consent.namedCount}</span>
                </Fact>
                <Fact term="Consent text version">
                  <span className="font-mono text-[0.875rem]">{consent.textVersion}</span>
                </Fact>
              </dl>
            ) : (
              <p className="text-text-2">No consent record is attached to this request.</p>
            )}
          </Card>

          <Card title="Purchase" titleAs="h2">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact term="Bought">
                <AbsoluteDate value={purchase.purchasedAt} withTime />
              </Fact>
              <Fact term="Buyers">
                <span className="tabular">
                  {purchase.leadType === "exclusive"
                    ? "Exclusive: only your company"
                    : `You were the ${ordinal(purchase.position)} of ${purchase.buyerCount} so far (up to ${purchase.sharingLimit})`}
                </span>
              </Fact>
              <Fact term="Charged">
                <Money cents={purchase.chargedCents} />
                {purchase.creditApplied > 0 ? (
                  <span className="text-text-2">
                    {" "}
                    (<Money cents={purchase.creditApplied} /> from account credit)
                  </span>
                ) : null}
              </Fact>
              {purchase.leadType === "shared" ? (
                <Fact term="Shared-request credits received">
                  <Money cents={purchase.sharingCreditsReceivedCents} />
                </Fact>
              ) : null}
              {purchase.refundedAt ? (
                <Fact term="Refunded">
                  <AbsoluteDate value={purchase.refundedAt} />
                </Fact>
              ) : null}
            </dl>
          </Card>

          <Card title="Notes and activity" titleAs="h2">
            <div className="grid gap-5">
              <ActionForm action={addNoteAction} hidden={hidden} submitLabel="Add note" resetOnSuccess>
                <Field id="note-body" label="New note" help="Private to your company.">
                  <Textarea name="body" rows={3} maxLength={5000} />
                </Field>
              </ActionForm>
              <Timeline record={record} />
            </div>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Stage" titleAs="h2">
            <ActionForm action={updateStageAction} hidden={hidden} submitLabel="Save stage">
              <Field id="stage" label="Stage">
                <Select name="stage" defaultValue={record.stage}>
                  {CRM_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {CRM_STAGE_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="lostReason" label="Lost reason" optional help="Required when the stage is Lost.">
                <Input name="lostReason" defaultValue={record.lostReason ?? ""} maxLength={300} />
              </Field>
            </ActionForm>
          </Card>

          <Card title="Follow-up and value" titleAs="h2">
            <ActionForm action={updateDetailsAction} hidden={hidden} submitLabel="Save">
              <Field id="followUpAt" label="Follow-up date" optional>
                <Input type="date" name="followUpAt" defaultValue={record.followUpAt ? record.followUpAt.toISOString().slice(0, 10) : ""} />
              </Field>
              <Field id="estimatedValue" label="Estimated value (dollars)" optional>
                <Input name="estimatedValue" inputMode="decimal" defaultValue={record.estimatedValueCents === null ? "" : (record.estimatedValueCents / 100).toFixed(2)} />
              </Field>
            </ActionForm>
          </Card>

          <Card title="Assignment" titleAs="h2">
            {record.permissions.assign ? (
              <ActionForm action={assignAction} hidden={hidden} submitLabel="Save assignment">
                <Field id="assigneeUserId" label="Assigned to">
                  <Select name="assigneeUserId" defaultValue={record.assigneeUserId ?? ""}>
                    <option value="">Nobody</option>
                    {record.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </ActionForm>
            ) : (
              <p>{record.members.find((m) => m.userId === record.assigneeUserId)?.name ?? "Nobody"}</p>
            )}
          </Card>

          {record.permissions.claim ? (
            <Card title="Quality claim" titleAs="h2">
              {record.claim ? (
                <div className="grid gap-2">
                  <p>
                    Claim filed <AbsoluteDate value={record.claim.createdAt} />: {CLAIM_REASONS.find((r) => r.code === record.claim!.reason)?.label ?? record.claim.reason}.
                  </p>
                  <p>
                    Status: <strong>{label(CLAIM_STATUS_LABELS, record.claim.status)}</strong>
                    {record.claim.decision ? ` · ${record.claim.decision}` : ""}
                  </p>
                </div>
              ) : claimOpen ? (
                <ActionForm action={submitClaimAction} hidden={hidden} submitLabel="File claim">
                  <p className="type-small text-text-2">
                    If the contact details are invalid, you can file a claim until <AbsoluteDate value={record.claimDeadline} withTime />. An approved claim is
                    refunded as account credit. A customer not answering yet, or choosing another mover, doesn&apos;t qualify.
                  </p>
                  <Field id="reason" label="Reason">
                    <Select name="reason" defaultValue="">
                      <option value="" disabled>
                        Choose a reason
                      </option>
                      {CLAIM_REASONS.filter((r) => r.qualifies).map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="evidence" label="Evidence" help="When you tried to reach the customer and what happened, for example the bounce message.">
                    <Textarea name="evidence" rows={3} maxLength={2000} />
                  </Field>
                </ActionForm>
              ) : (
                <p className="text-text-2">The claim window for this purchase has closed.</p>
              )}
            </Card>
          ) : null}

          {record.permissions.requestReview ? (
            <Card title="Move review" titleAs="h2">
              {record.moveReviewRequestedAt ? (
                <p>
                  Requested <AbsoluteDate value={record.moveReviewRequestedAt} />. American Moving Choice sends the invitation; the review is published after moderation.
                </p>
              ) : record.stage === "booked" || record.stage === "completed" ? (
                <ActionForm action={requestReviewAction} hidden={hidden} submitLabel="Ask for a move review">
                  <p className="type-small text-text-2">
                    American Moving Choice emails the customer a review invitation. You never send it yourself, and every request is logged.
                  </p>
                </ActionForm>
              ) : (
                <p className="text-text-2">You can ask for a move review once the request is Booked or Completed.</p>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
