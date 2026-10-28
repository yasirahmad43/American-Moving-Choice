/**
 * Review moderation (mover verification §6; S7 must: pending reviews with evidence descriptions,
 * publish with the evidence label or reject with a reason, the reports queue, response removal).
 * Reviews are never rejected for being negative; every decision writes moderation_actions (the
 * append-only moderation log) and audit_log.
 */
import { audit } from "../audit/audit";
import { getPool, tx, type Queryable } from "../db/pool";
import { AdminError, requireText, type AdminActor } from "./common";

export const EVIDENCE_LEVELS = ["platform_inquiry", "verified_customer", "completed_move"] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  platform_inquiry: "Verified platform inquiry",
  verified_customer: "Verified customer",
  completed_move: "Verified completed move",
};

/** Evidence kinds that prove a business relationship and a completed move (mover verification §6). */
export const RELATIONSHIP_EVIDENCE = ["estimate", "order_for_service", "deposit_receipt"] as const;
export const COMPLETION_EVIDENCE = ["bill_of_lading", "final_invoice", "delivery_receipt"] as const;

export const EVIDENCE_KIND_LABELS: Record<string, string> = {
  estimate: "Written estimate",
  order_for_service: "Order for service",
  deposit_receipt: "Deposit receipt",
  bill_of_lading: "Bill of lading",
  final_invoice: "Final invoice",
  delivery_receipt: "Delivery receipt",
};

/** Policy reasons a review may be rejected for (never for being negative). */
export const REJECTION_REASONS = {
  no_evidence: "No evidence for the label it needs",
  unrelated: "Not about this company's service",
  abusive: "Abusive or hateful language",
  private_data: "Contains private personal data",
  conflict_of_interest: "Conflict of interest",
  duplicate: "Duplicate of another review",
  other: "Other policy reason",
} as const;
export type RejectionReason = keyof typeof REJECTION_REASONS;

/**
 * The strongest label the accepted evidence supports. Publishing needs at least the purchase and
 * disclosure (platform inquiry); higher labels need accepted documents.
 */
export function supportedEvidenceLevel(input: { disclosed: boolean; acceptedKinds: readonly string[] }): EvidenceLevel | null {
  if (!input.disclosed) return null;
  const relationship = input.acceptedKinds.some((k) => (RELATIONSHIP_EVIDENCE as readonly string[]).includes(k));
  const completion = input.acceptedKinds.some((k) => (COMPLETION_EVIDENCE as readonly string[]).includes(k));
  if (relationship && completion) return "completed_move";
  if (relationship) return "verified_customer";
  return "platform_inquiry";
}

const RANK: Record<EvidenceLevel, number> = { platform_inquiry: 1, verified_customer: 2, completed_move: 3 };

/** Whether a label may be published for a review type and the evidence on file. */
export function labelProblem(reviewType: string, label: EvidenceLevel, supported: EvidenceLevel | null): string | null {
  if (!supported) return "The purchase behind this review has no disclosure record, so it can't carry any label.";
  if (RANK[label] > RANK[supported]) return `The accepted evidence supports "${EVIDENCE_LABELS[supported]}" at most.`;
  if (reviewType === "move_experience" && label !== "completed_move") return "A moving-experience review needs the verified completed move label.";
  return null;
}

export interface ModerationReview {
  id: string;
  company_id: string;
  legal_name: string;
  slug: string | null;
  purchase_id: string;
  review_type: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewer_display_name: string;
  origin_state: string | null;
  dest_state: string | null;
  evidence_level: EvidenceLevel;
  status: string;
  incentive_disclosure: string | null;
  rejection_reason: string | null;
  published_at: Date | null;
  created_at: Date;
  disclosed: boolean;
  evidence: { id: string; kind: string; file_ref: string | null; result: string; note: string | null; checked_at: Date | null }[];
}

export async function listReviews(status: string = "pending", db: Queryable = getPool()): Promise<ModerationReview[]> {
  const found = await db.query<ModerationReview>(
    `select r.id, r.company_id, c.legal_name, pr.slug, r.purchase_id, r.review_type, r.rating, r.title, r.body, r.reviewer_display_name,
            r.origin_state, r.dest_state, r.evidence_level, r.status, r.incentive_disclosure, r.rejection_reason, r.published_at, r.created_at,
            exists (select 1 from disclosures d where d.purchase_id = r.purchase_id) as disclosed,
            coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'file_ref', e.file_ref, 'result', e.result, 'note', e.note, 'checked_at', e.checked_at) order by e.created_at)
                      from review_evidence e where e.review_id = r.id), '[]'::jsonb) as evidence
     from reviews r join companies c on c.id = r.company_id left join company_profiles pr on pr.company_id = r.company_id
     where r.status = $1 order by r.created_at ${status === "pending" ? "asc" : "desc"} limit 200`,
    [status],
  );
  return found.rows;
}

async function lockReview(db: Queryable, reviewId: string) {
  const found = await db.query<{ id: string; company_id: string; purchase_id: string; review_type: string; status: string; evidence_level: EvidenceLevel }>(
    "select id, company_id, purchase_id, review_type, status, evidence_level from reviews where id = $1 for update",
    [reviewId],
  );
  const review = found.rows[0];
  if (!review) throw new AdminError("Review not found.", "not_found");
  return review;
}

async function moderation(db: Queryable, targetType: string, targetId: string, action: string, reason: string | null, moderatorId: string): Promise<void> {
  await db.query("insert into moderation_actions (target_type, target_id, action, reason, moderator_id) values ($1, $2, $3, $4, $5)", [
    targetType,
    targetId,
    action,
    reason,
    moderatorId,
  ]);
}

/** Marks one evidence document accepted or rejected after checking it. */
export async function checkEvidence(actor: AdminActor, evidenceId: string, input: { accepted: boolean; note?: string | null }): Promise<void> {
  const note = input.accepted ? (input.note?.trim() || null) : requireText(input.note, "why the document was not accepted", 500);
  await tx(async (client) => {
    const ev = (await client.query<{ id: string; review_id: string; result: string; company_id: string; review_status: string }>(
      `select e.id, e.review_id, e.result, r.company_id, r.status as review_status
       from review_evidence e join reviews r on r.id = e.review_id where e.id = $1 for update of e`,
      [evidenceId],
    )).rows[0];
    if (!ev) throw new AdminError("Evidence not found.", "not_found");
    if (ev.review_status !== "pending") throw new AdminError("Evidence can only be checked while the review is pending.", "bad_status");
    const result = input.accepted ? "accepted" : "rejected";
    await client.query("update review_evidence set result = $2, note = $3, checked_by = $4, checked_at = now() where id = $1", [evidenceId, result, note, actor.userId]);
    await moderation(client, "review_evidence", evidenceId, input.accepted ? "accept_evidence" : "reject_evidence", note, actor.userId);
    await audit(
      { actorType: "admin", actorId: actor.userId, companyId: ev.company_id, action: `review.evidence_${result}`, entity: "review_evidence", entityId: evidenceId, before: { result: ev.result }, after: { result, note }, ip: actor.ip ?? null },
      client,
    );
  });
}

/** Publishes a pending review with an evidence label the evidence supports. */
export async function publishReview(actor: AdminActor, reviewId: string, input: { evidenceLevel: string; note?: string | null }): Promise<void> {
  if (!(EVIDENCE_LEVELS as readonly string[]).includes(input.evidenceLevel)) throw new AdminError("Choose the evidence label.");
  const label = input.evidenceLevel as EvidenceLevel;
  await tx(async (client) => {
    const review = await lockReview(client, reviewId);
    if (review.status !== "pending") throw new AdminError("Only a pending review can be published.", "bad_status");
    const facts = await client.query<{ disclosed: boolean; kinds: string[] }>(
      `select exists (select 1 from disclosures d where d.purchase_id = $2) as disclosed,
              coalesce((select array_agg(e.kind) from review_evidence e where e.review_id = $1 and e.result = 'accepted'), '{}') as kinds`,
      [reviewId, review.purchase_id],
    );
    const supported = supportedEvidenceLevel({ disclosed: facts.rows[0]!.disclosed, acceptedKinds: facts.rows[0]!.kinds });
    const problem = labelProblem(review.review_type, label, supported);
    if (problem) throw new AdminError(problem, "label_not_supported");
    const reason = input.note?.trim() || `Meets the review guidelines; ${EVIDENCE_LABELS[label].toLowerCase()} confirmed.`;
    await client.query("update reviews set status = 'published', evidence_level = $2, published_at = now(), rejection_reason = null where id = $1", [reviewId, label]);
    await moderation(client, "review", reviewId, "publish", reason, actor.userId);
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId: review.company_id,
        action: "review.publish",
        entity: "review",
        entityId: reviewId,
        before: { status: review.status, evidence_level: review.evidence_level },
        after: { status: "published", evidence_level: label, reason },
        ip: actor.ip ?? null,
      },
      client,
    );
  });
}

/** Rejects a pending review for a policy reason (the reason is stored on the review and in the moderation log). */
export async function rejectReview(actor: AdminActor, reviewId: string, input: { reason: string; note?: string | null }): Promise<void> {
  if (!Object.hasOwn(REJECTION_REASONS, input.reason)) throw new AdminError("Choose the policy reason.");
  const label = REJECTION_REASONS[input.reason as RejectionReason];
  const note = input.reason === "other" ? requireText(input.note, "the policy reason", 500) : input.note?.trim() || null;
  const reason = note ? `${label}: ${note}` : label;
  await tx(async (client) => {
    const review = await lockReview(client, reviewId);
    if (review.status !== "pending") throw new AdminError("Only a pending review can be rejected.", "bad_status");
    await client.query("update reviews set status = 'rejected', rejection_reason = $2 where id = $1", [reviewId, reason]);
    await moderation(client, "review", reviewId, "reject", reason, actor.userId);
    await audit(
      { actorType: "admin", actorId: actor.userId, companyId: review.company_id, action: "review.reject", entity: "review", entityId: reviewId, before: { status: review.status }, after: { status: "rejected", reason }, ip: actor.ip ?? null },
      client,
    );
  });
}

// ================================================================== reports and responses

export async function listReports(status: string = "open", db: Queryable = getPool()) {
  const found = await db.query<{
    id: string;
    review_id: string;
    reporter_type: string;
    reporter_company: string | null;
    reason: string;
    status: string;
    decision: string | null;
    created_at: Date;
    review_status: string;
    review_title: string | null;
    review_body: string | null;
    review_rating: number;
    review_company: string;
  }>(
    `select rr.id, rr.review_id, rr.reporter_type, rc.legal_name as reporter_company, rr.reason, rr.status, rr.decision, rr.created_at,
            r.status as review_status, r.title as review_title, r.body as review_body, r.rating as review_rating, c.legal_name as review_company
     from review_reports rr join reviews r on r.id = rr.review_id join companies c on c.id = r.company_id
     left join companies rc on rc.id = rr.reporter_company_id
     where rr.status = $1 order by rr.created_at limit 200`,
    [status],
  );
  return found.rows;
}

/**
 * Decides a report. Upholding it removes the review (status removed) under the published policy;
 * dismissing it leaves the review as it is. Both need a decision note.
 */
export async function decideReport(actor: AdminActor, reportId: string, input: { uphold: boolean; decision: string }): Promise<void> {
  const decision = requireText(input.decision, "a decision note", 1000);
  await tx(async (client) => {
    const report = (await client.query<{ id: string; review_id: string; status: string }>("select id, review_id, status from review_reports where id = $1 for update", [reportId])).rows[0];
    if (!report) throw new AdminError("Report not found.", "not_found");
    if (report.status !== "open") throw new AdminError("This report was already decided.", "bad_status");
    const review = await lockReview(client, report.review_id);
    const status = input.uphold ? "upheld" : "dismissed";
    await client.query("update review_reports set status = $2, decision = $3, decided_by = $4, decided_at = now() where id = $1", [reportId, status, decision, actor.userId]);
    await moderation(client, "review_report", reportId, input.uphold ? "uphold_report" : "dismiss_report", decision, actor.userId);
    if (input.uphold && review.status === "published") {
      await client.query("update reviews set status = 'removed' where id = $1", [review.id]);
      await moderation(client, "review", review.id, "remove", decision, actor.userId);
    }
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId: review.company_id,
        action: input.uphold ? "review.report_uphold" : "review.report_dismiss",
        entity: "review_report",
        entityId: reportId,
        before: { report_status: "open", review_status: review.status },
        after: { report_status: status, review_status: input.uphold && review.status === "published" ? "removed" : review.status, decision },
        ip: actor.ip ?? null,
      },
      client,
    );
  });
}

export async function listResponses(db: Queryable = getPool()) {
  const found = await db.query<{ id: string; review_id: string; company_id: string; legal_name: string; body: string; status: string; created_at: Date; review_title: string | null }>(
    `select s.id, s.review_id, s.company_id, c.legal_name, s.body, s.status, s.created_at, r.title as review_title
     from review_responses s join companies c on c.id = s.company_id join reviews r on r.id = s.review_id
     where s.status <> 'removed' order by s.created_at desc limit 200`,
  );
  return found.rows;
}

/** Removes a company's public response for a policy reason. */
export async function removeResponse(actor: AdminActor, responseId: string, reasonInput: string): Promise<void> {
  const reason = requireText(reasonInput, "the reason for removing the response", 500);
  await tx(async (client) => {
    const response = (await client.query<{ id: string; company_id: string; status: string }>("select id, company_id, status from review_responses where id = $1 for update", [responseId])).rows[0];
    if (!response) throw new AdminError("Response not found.", "not_found");
    if (response.status === "removed") throw new AdminError("This response was already removed.", "bad_status");
    await client.query("update review_responses set status = 'removed' where id = $1", [responseId]);
    await moderation(client, "review_response", responseId, "remove", reason, actor.userId);
    await audit(
      { actorType: "admin", actorId: actor.userId, companyId: response.company_id, action: "review.response_remove", entity: "review_response", entityId: responseId, before: { status: response.status }, after: { status: "removed", reason }, ip: actor.ip ?? null },
      client,
    );
  });
}

export async function moderationLog(targetId: string, db: Queryable = getPool()) {
  const found = await db.query<{ id: string; target_type: string; action: string; reason: string | null; moderator_email: string | null; created_at: Date }>(
    `select m.id::text, m.target_type, m.action, m.reason, u.email as moderator_email, m.created_at
     from moderation_actions m left join users u on u.id = m.moderator_id where m.target_id = $1 order by m.created_at desc`,
    [targetId],
  );
  return found.rows;
}
