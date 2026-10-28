/**
 * Company review tools (mover verification §6): list the company's reviews, post a public
 * response, report a review to moderation, and ask AMC to invite a customer marked booked or
 * completed to review the move. Companies can't edit or delete reviews, and the invitation is sent
 * by AMC (the review_invitations sweep), never by the company.
 */
import { randomBytes, createHash } from "node:crypto";
import { hasContactEvidence } from "../reviews-public/contact-evidence";
import { audit } from "../audit/audit";
import { getPool, isUuid, tx, withCompany, type Queryable } from "../db/pool";
import { assertCan, resolveActor } from "../marketplace/permissions";

export class ReviewToolsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewToolsError";
  }
}

export interface CompanyReview {
  id: string;
  reviewType: "quote_experience" | "move_experience";
  rating: number;
  title: string | null;
  body: string | null;
  reviewerDisplayName: string;
  originState: string | null;
  destState: string | null;
  evidenceLevel: string;
  status: "pending" | "published" | "rejected" | "removed";
  publishedAt: Date | null;
  createdAt: Date;
  response: { body: string; status: string; updatedAt: Date } | null;
  openReport: { reason: string; createdAt: Date } | null;
}

export async function listCompanyReviews(input: { userId: string; companyId: string }, db: Queryable = getPool()): Promise<CompanyReview[]> {
  const actor = await resolveActor(db, input);
  assertCan(actor, "reviews.manage");
  const rows = await db.query<{
    id: string;
    review_type: CompanyReview["reviewType"];
    rating: number;
    title: string | null;
    body: string | null;
    reviewer_display_name: string;
    origin_state: string | null;
    dest_state: string | null;
    evidence_level: string;
    status: CompanyReview["status"];
    published_at: Date | null;
    created_at: Date;
    response_body: string | null;
    response_status: string | null;
    response_updated_at: Date | null;
    report_reason: string | null;
    report_created_at: Date | null;
  }>(
    `select r.id, r.review_type, r.rating, r.title, r.body, r.reviewer_display_name, r.origin_state, r.dest_state, r.evidence_level,
            r.status, r.published_at, r.created_at,
            rr.body as response_body, rr.status as response_status, rr.updated_at as response_updated_at,
            rep.reason as report_reason, rep.created_at as report_created_at
     from reviews r
     left join lateral (select body, status, updated_at from review_responses
                        where review_id = r.id and company_id = r.company_id and status <> 'removed'
                        order by created_at desc limit 1) rr on true
     left join lateral (select reason, created_at from review_reports
                        where review_id = r.id and reporter_company_id = r.company_id and status = 'open'
                        order by created_at desc limit 1) rep on true
     where r.company_id = $1 and r.status in ('published', 'pending')
     order by coalesce(r.published_at, r.created_at) desc`,
    [actor.companyId],
  );
  return rows.rows.map((r) => ({
    id: r.id,
    reviewType: r.review_type,
    rating: r.rating,
    title: r.title,
    body: r.body,
    reviewerDisplayName: r.reviewer_display_name,
    originState: r.origin_state,
    destState: r.dest_state,
    evidenceLevel: r.evidence_level,
    status: r.status,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    response: r.response_body ? { body: r.response_body, status: r.response_status ?? "published", updatedAt: r.response_updated_at! } : null,
    openReport: r.report_reason ? { reason: r.report_reason, createdAt: r.report_created_at! } : null,
  }));
}

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const ADDRESS_PATTERN = /\b\d{1,6}\s+[A-Za-z0-9.' ]{2,40}\s(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|way)\b/i;

/**
 * Responses are public and must not disclose the customer's private information (consent draft
 * §11 item 5). This catches the obvious cases (emails, phone numbers, street addresses).
 */
export function privateDetailProblem(text: string): string | null {
  if (EMAIL_PATTERN.test(text)) return "Remove the email address: responses are public and can't include private details.";
  if (PHONE_PATTERN.test(text)) return "Remove the phone number: responses are public and can't include private details.";
  if (ADDRESS_PATTERN.test(text)) return "Remove the street address: responses are public and can't include private details.";
  return null;
}

/** Posts or replaces the company's public response to a published review. Owner and manager only. */
export async function respondToReview(input: { userId: string; companyId: string; ip?: string | null }, reviewId: string, body: string): Promise<void> {
  const text = body.trim();
  if (text.length < 2) throw new ReviewToolsError("Write a response first.");
  if (text.length > 2000) throw new ReviewToolsError("Keep the response under 2,000 characters.");
  const problem = privateDetailProblem(text);
  if (problem) throw new ReviewToolsError(problem);
  if (!isUuid(reviewId)) throw new ReviewToolsError("That review was not found.");
  await tx(async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "reviews.manage", "Only owners and managers can respond to reviews.");
    const review = await client.query("select 1 from reviews where id = $1 and company_id = $2 and status = 'published' for update", [reviewId, actor.companyId]);
    if (!review.rowCount) throw new ReviewToolsError("You can respond only to published reviews of your company.");
    const existing = await client.query<{ id: string }>(
      "select id from review_responses where review_id = $1 and company_id = $2 and status <> 'removed' order by created_at desc limit 1",
      [reviewId, actor.companyId],
    );
    let responseId: string;
    if (existing.rows[0]) {
      responseId = existing.rows[0].id;
      await client.query("update review_responses set body = $2, author_user_id = $3, status = 'published' where id = $1", [responseId, text, actor.userId]);
    } else {
      const inserted = await client.query<{ id: string }>(
        "insert into review_responses (review_id, company_id, author_user_id, body) values ($1, $2, $3, $4) returning id",
        [reviewId, actor.companyId, actor.userId, text],
      );
      responseId = inserted.rows[0]!.id;
    }
    await audit(
      { actorType: "user", actorId: actor.userId, companyId: actor.companyId, action: existing.rows[0] ? "review_response.update" : "review_response.create", entity: "review_response", entityId: responseId, after: { review_id: reviewId }, ip: actor.ip ?? null },
      client,
    );
  });
}

/** Reports a review to moderation with a reason (one open report per review and company). */
export async function reportReview(input: { userId: string; companyId: string; ip?: string | null }, reviewId: string, reason: string): Promise<void> {
  const text = reason.trim();
  if (text.length < 10) throw new ReviewToolsError("Explain why this review breaks the review guidelines.");
  if (text.length > 1000) throw new ReviewToolsError("Keep the reason under 1,000 characters.");
  if (!isUuid(reviewId)) throw new ReviewToolsError("That review was not found.");
  await tx(async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "reviews.manage", "Only owners and managers can report reviews.");
    const review = await client.query("select 1 from reviews where id = $1 and company_id = $2 and status in ('published', 'pending') for update", [reviewId, actor.companyId]);
    if (!review.rowCount) throw new ReviewToolsError("That review was not found.");
    const open = await client.query("select 1 from review_reports where review_id = $1 and reporter_company_id = $2 and status = 'open'", [reviewId, actor.companyId]);
    if (open.rowCount) throw new ReviewToolsError("You've already reported this review; moderation will review it.");
    const inserted = await client.query<{ id: string }>(
      `insert into review_reports (review_id, reporter_type, reporter_company_id, reporter_user_id, reason)
       values ($1, 'company', $2, $3, $4) returning id`,
      [reviewId, actor.companyId, actor.userId, text],
    );
    await audit(
      { actorType: "user", actorId: actor.userId, companyId: actor.companyId, action: "review.report", entity: "review_report", entityId: inserted.rows[0]!.id, after: { review_id: reviewId }, ip: actor.ip ?? null },
      client,
    );
  });
}

/** How long a requested move-experience invitation stays valid once created. */
export const MOVE_INVITATION_DAYS = 30;

/**
 * Asks AMC to invite the customer of a purchase marked booked or completed to review the move
 * (review_invitations, requested_by company). AMC's invitation sweep sends it and issues the
 * single-use link; the token hash stored here is a placeholder that the sender replaces.
 */
export async function requestMoveReview(input: { userId: string; companyId: string; ip?: string | null }, purchaseId: string): Promise<void> {
  if (!isUuid(purchaseId)) throw new ReviewToolsError("That purchased request was not found.");
  await withCompany(input.companyId, async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "reviews.manage", "Only owners and managers can request reviews.");
    const record = await client.query<{ stage: string; withdrawn: boolean; refunded: boolean }>(
      `select r.stage, l.withdrawn_at is not null as withdrawn, p.refunded_at is not null as refunded
       from crm_records r join purchases p on p.id = r.purchase_id
       join lateral (select withdrawn_at from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
       where r.purchase_id = $1 and r.company_id = $2 for update of r`,
      [purchaseId, actor.companyId],
    );
    const row = record.rows[0];
    if (!row) throw new ReviewToolsError("That purchased request was not found.");
    if (row.stage !== "booked" && row.stage !== "completed") throw new ReviewToolsError("Mark the request Booked or Completed before asking for a move review.");
    if (!await hasContactEvidence(actor.companyId, purchaseId, client)) throw new ReviewToolsError("Record customer contact before asking for a move review.");
    if (row.withdrawn) throw new ReviewToolsError("The customer withdrew their request, so they won't be contacted for a review.");
    if (row.refunded) throw new ReviewToolsError("This purchase was refunded, so it can't be reviewed.");
    const placeholderHash = createHash("sha256").update(randomBytes(32)).digest("hex");
    const inserted = await client.query<{ id: string }>(
      `insert into review_invitations (purchase_id, company_id, review_type, requested_by, requested_by_user, token_hash, send_after, expires_at)
       values ($1, $2, 'move_experience', 'company', $3, $4, now(), now() + make_interval(days => $5))
       on conflict (purchase_id, review_type) do nothing returning id`,
      [purchaseId, actor.companyId, actor.userId, placeholderHash, MOVE_INVITATION_DAYS],
    );
    if (!inserted.rows[0]) throw new ReviewToolsError("A move review has already been requested for this customer.");
    const recordId = await client.query<{ id: string }>("select id from crm_records where purchase_id = $1", [purchaseId]);
    await client.query(
      "insert into crm_activities (record_id, company_id, type, body, actor_user_id) values ($1, $2, 'review_requested', $3, $4)",
      [recordId.rows[0]!.id, actor.companyId, "Asked American Moving Choice to invite the customer to review the move.", actor.userId],
    );
    await audit(
      { actorType: "user", actorId: actor.userId, companyId: actor.companyId, action: "review_invitation.request", entity: "review_invitation", entityId: inserted.rows[0].id, after: { purchase_id: purchaseId, review_type: "move_experience" }, ip: actor.ip ?? null },
      client,
    );
  });
}
