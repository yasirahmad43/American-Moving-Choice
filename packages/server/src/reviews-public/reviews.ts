/**
 * Public review invitations and submission (build plan §7.5; mover verification §6; review
 * methodology). The form opens only with a valid single-use token; the database keeps only the
 * token's sha256. Every review starts pending: a quote-experience review is a Verified platform
 * inquiry (the purchase proves it), and a move-experience review carries the reviewer's description
 * of their documents for moderation, which alone can raise the label (evidence upload is out of
 * scope in the preview).
 */
import type pg from "pg";
import { audit } from "../audit/audit";
import { checkRateLimit, rateLimitKey } from "../auth/rate-limit";
import { isTokenShaped, sha256Hex } from "../auth/tokens";
import { getPool, isUniqueViolation, tx, type Queryable } from "../db/pool";
import { REVIEW_RATE_LIMITS, parseReviewInput, type FieldErrors, type InvitationReviewType } from "./logic";

export interface InvitationView {
  id: string;
  reviewType: InvitationReviewType;
  companyId: string;
  slug: string | null;
  companyName: string;
  isDemo: boolean;
  expiresAt: Date;
}

export type InvitationLookup =
  | { status: "valid"; invitation: InvitationView }
  | { status: "used" }
  | { status: "expired" }
  | { status: "invalid" };

interface InvitationRow {
  id: string;
  review_type: InvitationReviewType;
  company_id: string;
  purchase_id: string;
  slug: string | null;
  company_name: string;
  is_demo: boolean;
  send_after: Date;
  completed_at: Date | null;
  expires_at: Date;
  now: Date;
}

const INVITATION_SELECT = `select i.id, i.review_type, i.company_id, i.purchase_id, p.slug, coalesce(p.display_name, c.legal_name) as company_name,
  c.is_demo, i.send_after, i.completed_at, i.expires_at, now() as now
  from review_invitations i join companies c on c.id = i.company_id left join company_profiles p on p.company_id = c.id
  where i.token_hash = $1`;

function classify(row: InvitationRow | undefined): InvitationLookup {
  if (!row || row.send_after > row.now) return { status: "invalid" };
  if (row.completed_at) return { status: "used" };
  if (row.expires_at <= row.now) return { status: "expired" };
  return {
    status: "valid",
    invitation: {
      id: row.id,
      reviewType: row.review_type,
      companyId: row.company_id,
      slug: row.slug,
      companyName: row.company_name,
      isDemo: row.is_demo,
      expiresAt: row.expires_at,
    },
  };
}

/** Looks an invitation up by its raw token. Records the first time a valid link is opened. */
export async function getInvitation(token: string, options: { markOpened?: boolean } = {}, db: Queryable = getPool()): Promise<InvitationLookup> {
  if (!isTokenShaped(token)) return { status: "invalid" };
  const found = await db.query<InvitationRow>(INVITATION_SELECT, [sha256Hex(token)]);
  const result = classify(found.rows[0]);
  if (result.status === "valid" && options.markOpened) {
    await db.query("update review_invitations set opened_at = now() where id = $1 and opened_at is null", [result.invitation.id]);
  }
  return result;
}

export type SubmitResult =
  | { ok: true; reviewId: string; status: "pending"; reviewType: InvitationReviewType }
  | { ok: false; error: "rate_limited" | "invalid" | "used" | "expired" }
  | { ok: false; error: "validation"; fieldErrors: FieldErrors };

export interface SubmitContext {
  ip?: string | null;
}

/**
 * Submits one review for an invitation. Rate limited per IP and per token; single use (the
 * invitation row is locked, and reviews.invitation_id is unique); refuses expired links.
 */
export async function submitReview(token: string, raw: Record<string, unknown>, context: SubmitContext = {}): Promise<SubmitResult> {
  const tokenHash = isTokenShaped(token) ? sha256Hex(token) : null;
  const ipLimit = await checkRateLimit(
    rateLimitKey("review:ip", context.ip ?? "unknown"),
    REVIEW_RATE_LIMITS.submitPerIp.limit,
    REVIEW_RATE_LIMITS.submitPerIp.windowSeconds,
  );
  if (!ipLimit.allowed) return { ok: false, error: "rate_limited" };
  if (!tokenHash) return { ok: false, error: "invalid" };
  const tokenLimit = await checkRateLimit(
    rateLimitKey("review:token", tokenHash),
    REVIEW_RATE_LIMITS.submitPerToken.limit,
    REVIEW_RATE_LIMITS.submitPerToken.windowSeconds,
  );
  if (!tokenLimit.allowed) return { ok: false, error: "rate_limited" };

  try {
    return await tx(async (client: pg.PoolClient) => {
      const found = await client.query<InvitationRow>(`${INVITATION_SELECT} for update of i`, [tokenHash]);
      const state = classify(found.rows[0]);
      if (state.status !== "valid") return { ok: false, error: state.status } as const;
      const row = found.rows[0]!;

      const parsed = parseReviewInput(row.review_type, raw);
      if (!parsed.ok) return { ok: false, error: "validation", fieldErrors: parsed.errors } as const;
      const input = parsed.input;

      // The route comes from the request the mover bought, never from the reviewer.
      const route = await client.query<{ origin_state: string | null; dest_state: string | null }>(
        `select l.origin_state, l.dest_state from purchases pu join leads l on l.group_id = pu.group_id
         where pu.id = $1 order by l.is_primary desc, l.created_at limit 1`,
        [row.purchase_id],
      );
      const review = await client.query<{ id: string }>(
        `insert into reviews (company_id, purchase_id, invitation_id, review_type, rating, title, body, reviewer_display_name,
                              origin_state, dest_state, evidence_level, status)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'platform_inquiry', 'pending') returning id`,
        [
          row.company_id, row.purchase_id, row.id, row.review_type, input.rating, input.title, input.body, input.displayName,
          route.rows[0]?.origin_state ?? null, route.rows[0]?.dest_state ?? null,
        ],
      );
      const reviewId = review.rows[0]!.id;
      if (row.review_type === "move_experience") {
        for (const kind of input.evidenceKinds ?? []) {
          await client.query(
            `insert into review_evidence (review_id, kind, file_ref, result, note) values ($1, $2, null, 'pending', $3)`,
            [reviewId, kind, `Described by the reviewer (no file uploaded in the preview): ${input.evidenceDescription ?? ""}`],
          );
        }
      }
      await client.query(
        "update review_invitations set completed_at = now(), opened_at = coalesce(opened_at, now()) where id = $1",
        [row.id],
      );
      await audit(
        {
          actorType: "consumer",
          actorId: null,
          companyId: row.company_id,
          action: "review.submit",
          entity: "review",
          entityId: reviewId,
          after: { review_type: row.review_type, status: "pending", invitation_id: row.id },
          ip: context.ip ?? null,
        },
        client,
      );
      return { ok: true, reviewId, status: "pending", reviewType: row.review_type } as const;
    });
  } catch (error) {
    // A concurrent submission for the same invitation lost the race.
    if (isUniqueViolation(error)) return { ok: false, error: "used" };
    throw error;
  }
}
