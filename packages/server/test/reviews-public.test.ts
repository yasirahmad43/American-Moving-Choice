/**
 * Slice S4: review invitations and submission. Single use, expiry, rate limits and the evidence
 * rules of mover verification §6 (quote reviews are platform inquiries; move reviews carry the
 * reviewer's described evidence and stay pending for moderation).
 */
import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { newToken, sha256Hex } from "../src/auth/tokens";
import { closePool, getPool } from "../src/db/pool";
import { getProfile } from "../src/profiles/queries";
import { parseReviewInput } from "../src/reviews-public/logic";
import { getInvitation, submitReview } from "../src/reviews-public/reviews";
import { resetDatabase } from "./helpers";

const pool = () => getPool();
let purchaseId: string;
let companyId: string;

/** A new invitation for the seed's purchase that has none yet (one per review type). */
async function invite(type: "quote_experience" | "move_experience", options: { expiresInHours?: number; sendAfterHours?: number } = {}): Promise<string> {
  const token = newToken();
  await pool().query("delete from reviews where purchase_id = $1 and review_type = $2", [purchaseId, type]);
  await pool().query("delete from review_invitations where purchase_id = $1 and review_type = $2", [purchaseId, type]);
  await pool().query(
    `insert into review_invitations (purchase_id, company_id, review_type, token_hash, send_after, sent_at, expires_at)
     values ($1, $2, $3, $4, now() + make_interval(hours => $5), now(), now() + make_interval(hours => $6))`,
    [purchaseId, companyId, type, sha256Hex(token), options.sendAfterHours ?? -1, options.expiresInHours ?? 24 * 30],
  );
  return token;
}

const quoteInput = { rating: "4", title: "Prompt estimate", body: "They called back within a day and sent a written estimate.", displayName: "Jo P.", attest: true };

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: "test-admin-password",
    moverEmail: "owner@demo-lone-star.invalid",
    moverPassword: "test-mover-password",
    bcryptCost: 4,
  });
  await pool().query(seed.sql);
  const purchase = await pool().query<{ id: string; company_id: string }>(
    `select p.id, p.company_id from purchases p where not exists (select 1 from review_invitations i where i.purchase_id = p.id) limit 1`,
  );
  purchaseId = purchase.rows[0]!.id;
  companyId = purchase.rows[0]!.company_id;
});

beforeEach(async () => {
  await pool().query("delete from rate_limits where key like 'review:%'");
});

afterAll(async () => {
  await closePool();
});

describe("getInvitation", () => {
  it("accepts a valid token, records the first open and names the company", async () => {
    const token = await invite("quote_experience");
    const result = await getInvitation(token, { markOpened: true });
    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error("unreachable");
    expect(result.invitation.reviewType).toBe("quote_experience");
    expect(result.invitation.companyId).toBe(companyId);
    expect(result.invitation.slug).toMatch(/^demo-/);
    const opened = await pool().query("select opened_at from review_invitations where id = $1", [result.invitation.id]);
    expect(opened.rows[0].opened_at).toBeInstanceOf(Date);
  });

  it("refuses malformed, unknown, expired and not-yet-sent tokens", async () => {
    expect((await getInvitation("not-a-token")).status).toBe("invalid");
    expect((await getInvitation(newToken())).status).toBe("invalid");
    const expired = await invite("quote_experience", { expiresInHours: -1 });
    expect((await getInvitation(expired)).status).toBe("expired");
    const early = await invite("quote_experience", { sendAfterHours: 48 });
    expect((await getInvitation(early)).status).toBe("invalid");
  });
});

describe("submitReview", () => {
  it("submits once as a pending Verified platform inquiry; the link then refuses reuse", async () => {
    const token = await invite("quote_experience");
    const first = await submitReview(token, quoteInput, { ip: "203.0.113.7" });
    expect(first).toMatchObject({ ok: true, status: "pending", reviewType: "quote_experience" });
    if (!first.ok) throw new Error("unreachable");
    const stored = await pool().query(
      "select status, evidence_level, rating, reviewer_display_name, origin_state, dest_state, published_at from reviews where id = $1",
      [first.reviewId],
    );
    expect(stored.rows[0]).toMatchObject({ status: "pending", evidence_level: "platform_inquiry", rating: 4, reviewer_display_name: "Jo P.", published_at: null });
    expect(stored.rows[0].origin_state).toMatch(/^[A-Z]{2}$/);
    const invitation = await pool().query("select completed_at from review_invitations where token_hash = $1", [sha256Hex(token)]);
    expect(invitation.rows[0].completed_at).toBeInstanceOf(Date);

    expect(await submitReview(token, quoteInput, { ip: "203.0.113.7" })).toEqual({ ok: false, error: "used" });
    expect((await getInvitation(token)).status).toBe("used");
    const audit = await pool().query("select actor_type, after from audit_log where action = 'review.submit' and entity_id = $1", [first.reviewId]);
    expect(audit.rows[0].actor_type).toBe("consumer");
  });

  it("never shows a pending review on the profile", async () => {
    const before = await pool().query<{ slug: string }>("select slug from company_profiles where company_id = $1", [companyId]);
    const result = await getProfile(before.rows[0]!.slug);
    if (result?.kind !== "live") throw new Error("expected a live profile");
    expect(result.profile.reviews.map((r) => r.title)).not.toContain("Prompt estimate");
  });

  it("refuses expired and invalid tokens without writing anything", async () => {
    const expired = await invite("quote_experience", { expiresInHours: -2 });
    expect(await submitReview(expired, quoteInput)).toEqual({ ok: false, error: "expired" });
    expect(await submitReview("garbage", quoteInput)).toEqual({ ok: false, error: "invalid" });
    expect(await submitReview(newToken(), quoteInput)).toEqual({ ok: false, error: "invalid" });
    const count = await pool().query("select count(*)::int as n from reviews where purchase_id = $1 and review_type = 'quote_experience'", [purchaseId]);
    expect(count.rows[0].n).toBe(0);
  });

  it("returns field errors for invalid input and leaves the link usable", async () => {
    const token = await invite("quote_experience");
    const result = await submitReview(token, { rating: "", body: "short", displayName: "", attest: false });
    expect(result.ok).toBe(false);
    if (result.ok || result.error !== "validation") throw new Error("expected validation errors");
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["attest", "body", "displayName", "rating"]);
    expect((await getInvitation(token)).status).toBe("valid");
  });

  it("needs described completion evidence for a move review and keeps it pending with the evidence unchecked", async () => {
    const token = await invite("move_experience");
    const noEvidence = await submitReview(token, { ...quoteInput, evidenceKinds: ["estimate"], evidenceDescription: "Estimate dated June 3." });
    if (noEvidence.ok || noEvidence.error !== "validation") throw new Error("expected validation errors");
    expect(noEvidence.fieldErrors.evidenceKinds).toMatch(/completed/);

    const ok = await submitReview(token, {
      ...quoteInput,
      evidenceKinds: ["estimate", "bill_of_lading"],
      evidenceDescription: "Bill of lading signed at delivery on June 20.",
    });
    expect(ok).toMatchObject({ ok: true, status: "pending", reviewType: "move_experience" });
    if (!ok.ok) throw new Error("unreachable");
    const review = await pool().query("select status, evidence_level from reviews where id = $1", [ok.reviewId]);
    expect(review.rows[0]).toEqual({ status: "pending", evidence_level: "platform_inquiry" });
    const evidence = await pool().query("select kind, result, file_ref, note from review_evidence where review_id = $1 order by kind", [ok.reviewId]);
    expect(evidence.rows.map((r) => [r.kind, r.result, r.file_ref])).toEqual([
      ["bill_of_lading", "pending", null],
      ["estimate", "pending", null],
    ]);
    expect(evidence.rows[0].note).toContain("June 20");
  });

  it("rate limits attempts per token and per IP", async () => {
    const token = await invite("quote_experience");
    for (let i = 0; i < 5; i++) {
      const attempt = await submitReview(token, { ...quoteInput, rating: "9" }, { ip: `198.51.100.${i}` });
      expect(attempt.ok).toBe(false);
    }
    expect(await submitReview(token, quoteInput, { ip: "198.51.100.99" })).toEqual({ ok: false, error: "rate_limited" });

    await pool().query("delete from rate_limits where key like 'review:%'");
    for (let i = 0; i < 10; i++) await submitReview(newToken(), quoteInput, { ip: "192.0.2.1" });
    expect(await submitReview(token, quoteInput, { ip: "192.0.2.1" })).toEqual({ ok: false, error: "rate_limited" });
  });
});

describe("parseReviewInput", () => {
  it("trims, drops an empty title and requires the attestation", () => {
    const parsed = parseReviewInput("quote_experience", { ...quoteInput, title: "   ", body: `  ${quoteInput.body}  ` });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("unreachable");
    expect(parsed.input.title).toBeNull();
    expect(parsed.input.body).toBe(quoteInput.body);
    expect(parseReviewInput("quote_experience", { ...quoteInput, attest: false }).ok).toBe(false);
  });
});
