import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getBillingOverview, submitClaim, BillingError, maskRef } from "../src/billing/billing";
import { addNote, getRecord, groupByStage, listRecords, updateRecord, CrmError } from "../src/crm/records";
import { closePool, getPool, withCompany } from "../src/db/pool";
import { PermissionError } from "../src/marketplace/permissions";
import { purchase } from "../src/marketplace/purchase";
import { listCompanyReviews, privateDetailProblem, reportReview, requestMoveReview, respondToReview, ReviewToolsError } from "../src/reviews-company/reviews";
import { resetDatabase } from "./helpers";
import { actorOf, addDemoCard, makeCompany, makeMember, makeRequest, type TestCompany, type TestRequest } from "./marketplace-fixtures";

const pool = () => getPool();
let n = 0;
const idem = () => `crm-key-${Date.now()}-${++n}`;

let alpha: TestCompany;
let beta: TestCompany;
let shared: TestRequest;
let alphaPurchase: string;
let betaPurchase: string;

beforeAll(async () => {
  await resetDatabase();
  alpha = await makeCompany({ name: "Crm Alpha Movers", exclusive: 9000, shared: 4000 });
  beta = await makeCompany({ name: "Crm Beta Movers", exclusive: 8000, shared: 3500 });
  await addDemoCard(alpha);
  await addDemoCard(beta);
  shared = await makeRequest({ limit: 2, named: [alpha, beta] });
  const a = await purchase({ ...actorOf(alpha), groupId: shared.groupId, idempotencyKey: idem() });
  const b = await purchase({ ...actorOf(beta), groupId: shared.groupId, idempotencyKey: idem() });
  if (!a.ok || !b.ok) throw new Error("fixture purchases failed");
  alphaPurchase = a.purchaseId;
  betaPurchase = b.purchaseId;
});

afterAll(async () => {
  await closePool();
});

describe("crm", () => {
  it("lists purchased requests with the customer's name and logs contact views on the detail", async () => {
    const list = await listRecords(actorOf(alpha));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ purchaseId: alphaPurchase, stage: "new", customerName: `Jordan ${shared.lastName}`, leadType: "shared" });
    expect((await listRecords(actorOf(alpha), { q: shared.lastName.slice(0, 8) })).length).toBe(1);
    expect((await listRecords(actorOf(alpha), { q: "nobody-matches" })).length).toBe(0);

    const detail = await getRecord({ ...actorOf(alpha), ip: "203.0.113.9" }, alphaPurchase);
    expect(detail.contact).toEqual({ firstName: "Jordan", lastName: shared.lastName, email: shared.email, phone: shared.phone });
    expect(detail.consent).toBeNull(); // the fixture has no consent record
    expect(detail.purchase).toMatchObject({ leadType: "shared", position: 1, sharingLimit: 2, buyerCount: 2, chargedCents: 4000, sharingCreditsReceivedCents: 800 });
    const views = await pool().query("select user_id, ip from contact_access_log where purchase_id = $1 and action = 'view'", [alphaPurchase]);
    expect(views.rows).toEqual([{ user_id: alpha.ownerId, ip: "203.0.113.9" }]);
  });

  it("keeps notes and records private to each company on a shared request (RLS)", async () => {
    await addNote(actorOf(alpha), alphaPurchase, "Alpha private note: customer prefers mornings.");
    // Even a raw query inside beta's company scope can't see alpha's notes or CRM rows.
    const seen = await withCompany(beta.companyId, async (c) => ({
      notes: (await c.query("select body from crm_notes")).rows,
      records: (await c.query("select purchase_id from crm_records")).rows,
    }));
    expect(seen.notes).toEqual([]);
    expect(seen.records).toEqual([{ purchase_id: betaPurchase }]);
    const betaDetail = await getRecord(actorOf(beta), betaPurchase);
    expect(betaDetail.timeline.some((t) => t.body?.includes("Alpha private note"))).toBe(false);
    await expect(getRecord(actorOf(beta), alphaPurchase)).rejects.toBeInstanceOf(CrmError);
    // Writing a note for another company's purchase fails the RLS check too.
    await expect(
      withCompany(beta.companyId, (c) => c.query("insert into crm_notes (purchase_id, company_id, body) values ($1, $2, 'x')", [alphaPurchase, alpha.companyId])),
    ).rejects.toThrow(/row-level security/);
    const alphaDetail = await getRecord(actorOf(alpha), alphaPurchase);
    expect(alphaDetail.timeline[0]).toMatchObject({ kind: "note", actorName: `${alpha.name} Owner` });
  });

  it("changes stage, follow-up, value and assignment with activity entries; lost needs a reason", async () => {
    await expect(updateRecord(actorOf(alpha), alphaPurchase, { stage: "lost" })).rejects.toBeInstanceOf(CrmError);
    const agent = await makeMember(alpha, "agent");
    await updateRecord(actorOf(alpha), alphaPurchase, { stage: "contacted", followUpAt: new Date("2030-01-02T15:00:00Z"), estimatedValueCents: 150000, assigneeUserId: agent });
    const detail = await getRecord(actorOf(alpha), alphaPurchase);
    expect(detail).toMatchObject({ stage: "contacted", estimatedValueCents: 150000, assigneeUserId: agent });
    const types = detail.timeline.filter((t) => t.kind === "activity").map((t) => t.type);
    expect(types).toEqual(expect.arrayContaining(["stage_change", "follow_up", "estimated_value", "assignment", "purchased"]));
    await updateRecord(actorOf(alpha), alphaPurchase, { stage: "lost", lostReason: "Chose a mover with an earlier date" });
    expect((await getRecord(actorOf(alpha), alphaPurchase)).lostReason).toBe("Chose a mover with an earlier date");
    await updateRecord(actorOf(alpha), alphaPurchase, { stage: "booked" });
    expect((await getRecord(actorOf(alpha), alphaPurchase)).lostReason).toBeNull();

    // Agents see only assigned requests and can't reassign.
    const other = await makeMember(alpha, "agent");
    expect(await listRecords(actorOf(alpha, other))).toEqual([]);
    await expect(getRecord(actorOf(alpha, other), alphaPurchase)).rejects.toBeInstanceOf(PermissionError);
    expect((await listRecords(actorOf(alpha, agent))).map((r) => r.purchaseId)).toEqual([alphaPurchase]);
    await expect(updateRecord(actorOf(alpha, agent), alphaPurchase, { assigneeUserId: other })).rejects.toBeInstanceOf(PermissionError);
    await updateRecord(actorOf(alpha, agent), alphaPurchase, { stage: "booked", estimatedValueCents: 160000 });
    // A billing member has no CRM access.
    const billing = await makeMember(alpha, "billing");
    await expect(listRecords(actorOf(alpha, billing))).rejects.toBeInstanceOf(PermissionError);
  });

  it("groups records into pipeline columns with totals", async () => {
    const columns = groupByStage(await listRecords(actorOf(alpha)));
    expect(columns.map((c) => c.stage)).toEqual(["new", "contacted", "qualified", "quote_sent", "follow_up", "booked", "completed", "lost"]);
    expect(columns.find((c) => c.stage === "booked")).toMatchObject({ totalValueCents: 160000 });
  });
});

describe("billing", () => {
  it("shows the credit balance, the sharing credit in the ledger and purchases as receipts", async () => {
    const overview = await getBillingOverview(actorOf(alpha));
    expect(overview.balanceCents).toBe(800);
    expect(overview.ledger.map((l) => l.kind).sort()).toEqual(["purchase_charge", "sharing_credit"]);
    expect(overview.receipts).toHaveLength(1);
    expect(overview.receipts[0]).toMatchObject({ purchaseId: alphaPurchase, chargedCents: 4000, cardAmountCents: 4000, route: "Austin, TX to Houston, TX" });
    expect(overview.receipts[0]!.paymentRef).toMatch(/^Demo /);
    expect(maskRef("pi_3abcdefghijk")).toBe("…fghijk");
    const agent = await makeMember(alpha, "agent");
    await expect(getBillingOverview(actorOf(alpha, agent))).rejects.toBeInstanceOf(PermissionError);
  });

  it("accepts qualifying quality claims in the window and rejects the rest up front", async () => {
    await expect(submitClaim(actorOf(beta), { purchaseId: betaPurchase, reason: "hired_another_mover", evidence: "They told me on the phone." })).rejects.toThrow(/doesn't qualify/);
    await expect(submitClaim(actorOf(beta), { purchaseId: betaPurchase, reason: "disconnected_phone", evidence: "short" })).rejects.toBeInstanceOf(BillingError);
    await expect(submitClaim(actorOf(beta), { purchaseId: alphaPurchase, reason: "disconnected_phone", evidence: "Called twice: number not in service." })).rejects.toThrow(/not found/);
    const id = await submitClaim(actorOf(beta), { purchaseId: betaPurchase, reason: "disconnected_phone", evidence: "Called twice on Oct 28: number not in service." });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    await expect(submitClaim(actorOf(beta), { purchaseId: betaPurchase, reason: "fake_data", evidence: "Name looks like test data." })).rejects.toThrow(/already been filed/);
    expect((await getBillingOverview(actorOf(beta))).claims[0]).toMatchObject({ reason: "disconnected_phone", status: "open" });

    // Outside the window.
    await pool().query("update purchases set created_at = now() - interval '73 hours' where id = $1", [alphaPurchase]);
    await expect(submitClaim(actorOf(alpha), { purchaseId: alphaPurchase, reason: "never_requested", evidence: "The person said they never asked for quotes." })).rejects.toThrow(/window/);
    await pool().query("update purchases set created_at = now() where id = $1", [alphaPurchase]);
  });
});

describe("company review tools", () => {
  let reviewId: string;

  beforeAll(async () => {
    const invitation = await pool().query<{ id: string }>(
      `insert into review_invitations (purchase_id, company_id, review_type, token_hash, expires_at)
       values ($1, $2, 'quote_experience', repeat('a', 64), now() + interval '30 days') returning id`,
      [alphaPurchase, alpha.companyId],
    );
    const review = await pool().query<{ id: string }>(
      `insert into reviews (company_id, purchase_id, invitation_id, review_type, rating, title, body, reviewer_display_name, evidence_level, status, published_at)
       values ($1, $2, $3, 'quote_experience', 4, 'Helpful', 'Clear estimate.', 'Jordan S.', 'platform_inquiry', 'published', now()) returning id`,
      [alpha.companyId, alphaPurchase, invitation.rows[0]!.id],
    );
    reviewId = review.rows[0]!.id;
  });

  it("posts a public response without private details, and reports a review", async () => {
    expect(privateDetailProblem("Call us at (512) 555-0199")).toMatch(/phone number/);
    expect(privateDetailProblem("We emailed jordan@example.com")).toMatch(/email/);
    expect(privateDetailProblem("Thanks for the kind words!")).toBeNull();
    await expect(respondToReview(actorOf(alpha), reviewId, "Call 512-555-0199 anytime")).rejects.toBeInstanceOf(ReviewToolsError);
    await respondToReview(actorOf(alpha), reviewId, "Thank you for choosing us.");
    await respondToReview(actorOf(alpha), reviewId, "Thank you for the review.");
    const reviews = await listCompanyReviews(actorOf(alpha));
    expect(reviews[0]).toMatchObject({ id: reviewId, response: { body: "Thank you for the review." } });
    expect((await pool().query("select count(*)::int as n from review_responses where review_id = $1", [reviewId])).rows[0].n).toBe(1);
    await expect(respondToReview(actorOf(beta), reviewId, "Not ours")).rejects.toBeInstanceOf(ReviewToolsError);
    const agent = await makeMember(alpha, "agent");
    await expect(respondToReview(actorOf(alpha, agent), reviewId, "Agent reply")).rejects.toBeInstanceOf(PermissionError);

    await reportReview(actorOf(alpha), reviewId, "This review describes a different company's crew.");
    await expect(reportReview(actorOf(alpha), reviewId, "Reporting again for the same reason.")).rejects.toThrow(/already reported/);
    expect((await listCompanyReviews(actorOf(alpha)))[0]!.openReport).not.toBeNull();
  });

  it("requests a move review only for booked or completed customers, once", async () => {
    await expect(requestMoveReview(actorOf(beta), betaPurchase)).rejects.toThrow(/Booked or Completed/);
    await updateRecord(actorOf(beta), betaPurchase, { stage: "completed" });
    await requestMoveReview(actorOf(beta), betaPurchase);
    const invitation = await pool().query("select review_type, requested_by, requested_by_user, sent_at from review_invitations where purchase_id = $1", [betaPurchase]);
    expect(invitation.rows[0]).toEqual({ review_type: "move_experience", requested_by: "company", requested_by_user: beta.ownerId, sent_at: null });
    await expect(requestMoveReview(actorOf(beta), betaPurchase)).rejects.toThrow(/already been requested/);
    expect((await getRecord(actorOf(beta), betaPurchase)).moveReviewRequestedAt).not.toBeNull();
  });
});
