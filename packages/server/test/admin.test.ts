import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AdminError, parseDollarsToCents } from "../src/admin/common";
import { approveCompany, getCompanyDetail, recordCallback, recordCheckDecision, reinstateCompany, rejectCompany, rerunChecks, reviewProfileDescription, setCompanyPrice, suspendCompany, verificationQueue } from "../src/admin/companies";
import { adjustCredit, approveClaim, chargeReconciliation, createDispute, listProviderRefunds, retryProviderRefund, reconciliation, refundCap, refundPurchase, rejectClaim, updateDispute } from "../src/admin/finance";
import { decideLead, getLeadDetail, listLeads } from "../src/admin/leads";
import { dashboardStats, listAuditLog, listMailbox } from "../src/admin/overview";
import {
  acceptAdminInvitation,
  activateSharingPolicy,
  approveConsentVersion,
  changeAdminRole,
  createConsentDraft,
  createSharingPolicy,
  inviteAdmin,
  parseFactors,
  removeAdmin,
  updateSettings,
} from "../src/admin/platform";
import { checkEvidence, decideReport, labelProblem, publishReview, rejectReview, supportedEvidenceLevel } from "../src/admin/reviews";
import { caseReverify, caseSuspend, createCase, getCase, updateCase } from "../src/cases/cases";
import { closePool, getPool } from "../src/db/pool";
import { createUser, resetDatabase, tokenFromMessage } from "./helpers";

const pool = () => getPool();
const fixed = (prefix: string, n: number) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const company = (n: number) => fixed("c0", n);
const lead = (n: number) => fixed("d1", n);
const purchase = (n: number) => fixed("d4", n);
const review = (n: number) => fixed("e2", n);
const ADMIN = fixed("a0", 1);
const admin = { userId: ADMIN, ip: "203.0.113.5" };

const balance = async (companyId: string) =>
  (await pool().query<{ balance_cents: number }>("select balance_cents from company_credit_balance where company_id = $1", [companyId])).rows[0]!.balance_cents;
const auditCount = async (action: string, entityId?: string) =>
  (await pool().query<{ n: number }>("select count(*)::int as n from audit_log where action = $1 and ($2::text is null or entity_id = $2)", [action, entityId ?? null])).rows[0]!.n;

async function expectAdminError(promise: Promise<unknown>, code?: string): Promise<AdminError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AdminError);
    if (code) expect((error as AdminError).code).toBe(code);
    return error as AdminError;
  }
  throw new Error("expected an AdminError");
}

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
});

afterAll(async () => {
  await closePool();
});

describe("helpers", () => {
  it("parses dollar amounts into cents", () => {
    expect(parseDollarsToCents("95")).toBe(9500);
    expect(parseDollarsToCents("$1,200.5")).toBe(120050);
    expect(parseDollarsToCents("-25.00", { allowNegative: true })).toBe(-2500);
    expect(parseDollarsToCents("-25")).toBeNull();
    expect(parseDollarsToCents("12.345")).toBeNull();
    expect(parseDollarsToCents("abc")).toBeNull();
  });

  it("parses policy factors as percentages or basis points", () => {
    expect(parseFactors("100, 80, 65")).toEqual([10000, 8000, 6500]);
    expect(parseFactors("10000 9000")).toEqual([10000, 9000]);
  });

  it("caps refunds at the net paid, and cash at the card amount", () => {
    expect(refundCap({ charged_cents: 4200, sharing_credits: 840, card_amount_cents: 1000 }, "credit")).toBe(3360);
    expect(refundCap({ charged_cents: 4200, sharing_credits: 840, card_amount_cents: 1000 }, "cash")).toBe(1000);
  });

  it("matches evidence labels to the accepted documents", () => {
    expect(supportedEvidenceLevel({ disclosed: false, acceptedKinds: [] })).toBeNull();
    expect(supportedEvidenceLevel({ disclosed: true, acceptedKinds: [] })).toBe("platform_inquiry");
    expect(supportedEvidenceLevel({ disclosed: true, acceptedKinds: ["estimate"] })).toBe("verified_customer");
    expect(supportedEvidenceLevel({ disclosed: true, acceptedKinds: ["estimate", "bill_of_lading"] })).toBe("completed_move");
    expect(supportedEvidenceLevel({ disclosed: true, acceptedKinds: ["bill_of_lading"] })).toBe("platform_inquiry");
    expect(labelProblem("quote_experience", "platform_inquiry", "platform_inquiry")).toBeNull();
    expect(labelProblem("quote_experience", "verified_customer", "platform_inquiry")).toMatch(/supports/);
    expect(labelProblem("move_experience", "verified_customer", "completed_move")).toMatch(/completed move/);
  });
});

describe("verification queue and approval", () => {
  const prairie = company(16);

  it("lists the in-review applicant with its flags", async () => {
    const queue = await verificationQueue();
    const row = queue.find((r) => r.id === prairie);
    expect(row).toMatchObject({ stage: "admin_review" });
    expect(row?.flags).toEqual(expect.arrayContaining(["identity_mismatch", "recent_changes"]));
    expect(row?.pending_checks).toEqual(expect.arrayContaining(["callback_verification", "state_credentials"]));
  });

  it("refuses to approve while checks are pending", async () => {
    const error = await expectAdminError(approveCompany(admin, prairie, { exclusiveCents: 9300, sharedCents: 4100, approveDescription: true }), "not_approvable");
    expect(error.message).toMatch(/Callback/);
  });

  it("requires a fresh official record before the callback check", async () => {
    await expectAdminError(recordCallback(admin, prairie, { confirmed: true, note: "Called" }), "no_official_phone");
    const summary = await rerunChecks(admin, prairie);
    expect(summary.source).toBe("fixture");
    const detail = await getCompanyDetail(prairie);
    expect(detail?.officialPhone).toBe("+18065550116");
  });

  it("approves with prices after reviewer decisions: badge, prices, live profile, audit", async () => {
    await expectAdminError(recordCheckDecision(admin, prairie, { checkType: "identity_match", result: "pass", note: "" }), "missing_text");
    await recordCheckDecision(admin, prairie, { checkType: "identity_match", result: "pass", note: "DBA confirmed with the owner; same entity." });
    await recordCheckDecision(admin, prairie, { checkType: "recent_record_changes", result: "pass", note: "Mailing address change confirmed by phone." });
    await recordCallback(admin, prairie, { confirmed: true, note: "Called the number on the FMCSA record; the owner confirmed the application." });
    await recordCheckDecision(admin, prairie, { checkType: "state_credentials", result: "pass", note: "TxDMV lookup shows the certificate active (demo)." });

    await expectAdminError(approveCompany(admin, prairie, { exclusiveCents: 0, sharedCents: 4100, approveDescription: true }), "invalid_price");
    const result = await approveCompany(admin, prairie, { exclusiveCents: 9900, sharedCents: 4400, approveDescription: true, note: "All checks passed." });
    expect(result.publicStatus).toBe("live");

    const c = (await pool().query("select status, approved_at from companies where id = $1", [prairie])).rows[0];
    expect(c.status).toBe("approved");
    expect(c.approved_at).toBeInstanceOf(Date);
    const badge = (await pool().query("select evidence_check_ids, revoked_at from badges where company_id = $1 and revoked_at is null", [prairie])).rows[0];
    expect(badge.evidence_check_ids).toHaveLength(9);
    const price = (await pool().query("select exclusive_cents, shared_cents, set_by from current_price($1)", [prairie])).rows[0];
    expect(price).toEqual({ exclusive_cents: 9900, shared_cents: 4400, set_by: ADMIN });
    const profile = (await pool().query("select public_status, network_joined_at, description_status from company_profiles where company_id = $1", [prairie])).rows[0];
    expect(profile).toMatchObject({ public_status: "live", description_status: "approved" });
    expect(profile.network_joined_at).toBeInstanceOf(Date);
    expect(await auditCount("company.approve", prairie)).toBe(1);
    const history = await pool().query("select to_status from company_status_history where company_id = $1 order by created_at desc, id desc limit 1", [prairie]);
    expect(history.rows[0].to_status).toBe("approved");
    // Approving twice is refused.
    await expectAdminError(approveCompany(admin, prairie, { exclusiveCents: 9900, sharedCents: 4400, approveDescription: true }), "bad_status");
  });

  it("appends prices instead of editing them", async () => {
    await setCompanyPrice(admin, prairie, { exclusiveCents: 10500, sharedCents: 4600, note: "Market review" });
    const rows = await pool().query("select exclusive_cents from company_prices where company_id = $1 order by id", [prairie]);
    expect(rows.rows.map((r) => r.exclusive_cents)).toEqual([9300, 9900, 10500]);
    expect(await auditCount("company.price_set")).toBe(1);
  });

  it("suspends (badge revoked, purchases blocked) and reinstates (badge reissued)", async () => {
    await suspendCompany(admin, prairie, "Consumer report of broker activity under review");
    const after = (await pool().query("select status, company_can_purchase(c) as can from companies c where id = $1", [prairie])).rows[0];
    expect(after).toEqual({ status: "suspended", can: false });
    expect((await pool().query("select count(*)::int as n from badges where company_id = $1 and revoked_at is null", [prairie])).rows[0].n).toBe(0);
    expect((await pool().query("select public_status from company_profiles where company_id = $1", [prairie])).rows[0].public_status).toBe("under_review");

    await reinstateCompany(admin, prairie, "Report not substantiated; checks re-run");
    const again = (await pool().query("select status, company_can_purchase(c) as can from companies c where id = $1", [prairie])).rows[0];
    expect(again).toEqual({ status: "approved", can: true });
    expect((await pool().query("select count(*)::int as n from badges where company_id = $1", [prairie])).rows[0].n).toBe(2);
    expect((await pool().query("select public_status from company_profiles where company_id = $1", [prairie])).rows[0].public_status).toBe("live");
  });

  it("moderates profile descriptions; an edited description goes back to pending", async () => {
    await pool().query("update company_profiles set description = 'Demo edited description that needs review.' where company_id = $1", [prairie]);
    expect((await pool().query("select description_status from company_profiles where company_id = $1", [prairie])).rows[0].description_status).toBe("pending");
    await expectAdminError(reviewProfileDescription(admin, prairie, { approve: false, reason: "" }), "missing_text");
    expect(await reviewProfileDescription(admin, prairie, { approve: false, reason: "Claims an award without evidence." })).toBe("hidden");
    expect(await reviewProfileDescription(admin, prairie, { approve: true })).toBe("live");
    expect((await pool().query("select count(*)::int as n from moderation_actions where target_id = $1", [prairie])).rows[0].n).toBe(2);
  });

  it("rejects an application with a reason and emails the owner", async () => {
    const owner = await createUser({ email: "applicant@demo-reject.invalid" });
    const id = (await pool().query("insert into companies (legal_name, usdot_number, mc_number, status) values ('Demo Reject Me', '9000050', 'MC-9000050', 'in_review') returning id")).rows[0].id;
    await pool().query("insert into company_memberships (company_id, user_id, role) values ($1, $2, 'owner')", [id, owner]);
    await expectAdminError(rejectCompany(admin, id, ""), "missing_text");
    await rejectCompany(admin, id, "Broker authority on the FMCSA record.");
    expect((await pool().query("select status, status_reason from companies where id = $1", [id])).rows[0]).toEqual({ status: "rejected", status_reason: "Broker authority on the FMCSA record." });
    const message = await pool().query("select template, to_address from messages where related_id = $1", [id]);
    expect(message.rows).toEqual([{ template: "company_rejected", to_address: "applicant@demo-reject.invalid" }]);
  });
});

describe("finance", () => {
  const lonestar = company(1);

  it("a credit adjustment changes the balance, once per form", async () => {
    const before = await balance(lonestar);
    const result = await adjustCredit(admin, { companyId: lonestar, amountCents: 2500, note: "Goodwill credit", idempotencyKey: "test-adjust-0001" });
    expect(result.created).toBe(true);
    expect(await balance(lonestar)).toBe(before + 2500);
    const repeat = await adjustCredit(admin, { companyId: lonestar, amountCents: 2500, note: "Goodwill credit", idempotencyKey: "test-adjust-0001" });
    expect(repeat.created).toBe(false);
    expect(await balance(lonestar)).toBe(before + 2500);
    await expectAdminError(adjustCredit(admin, { companyId: lonestar, amountCents: -(before + 2501), note: "Too much", idempotencyKey: "test-adjust-0002" }), "insufficient_credit");
    await adjustCredit(admin, { companyId: lonestar, amountCents: -500, note: "Correction", idempotencyKey: "test-adjust-0003" });
    expect(await balance(lonestar)).toBe(before + 2000);
    expect(await auditCount("billing.credit_adjustment")).toBe(2);
  });

  it("a claim approval refunds the net paid as credit", async () => {
    const claimId = (await pool().query("insert into lead_quality_claims (purchase_id, company_id, reason, evidence) values ($1, $2, 'disconnected_phone', 'Call log') returning id", [purchase(5), lonestar])).rows[0].id;
    const charged = (await pool().query("select charged_cents from purchases where id = $1", [purchase(5)])).rows[0].charged_cents;
    const before = await balance(lonestar);
    const amount = await approveClaim(admin, claimId, "Number disconnected on two attempts.");
    expect(amount).toBe(charged);
    expect(await balance(lonestar)).toBe(before + charged);
    const entry = (await pool().query("select kind, amount_cents from ledger_entries where purchase_id = $1 and kind = 'quality_refund_credit'", [purchase(5)])).rows[0];
    expect(entry).toEqual({ kind: "quality_refund_credit", amount_cents: charged });
    expect((await pool().query("select status, refund_mode, refund_amount_cents from lead_quality_claims where id = $1", [claimId])).rows[0]).toEqual({ status: "approved", refund_mode: "credit", refund_amount_cents: charged });
    await expectAdminError(approveClaim(admin, claimId, "again"), "bad_status");
  });

  it("rejects a claim with a note", async () => {
    const claimId = (await pool().query("insert into lead_quality_claims (purchase_id, company_id, reason) values ($1, $2, 'never_requested') returning id", [purchase(6), lonestar])).rows[0].id;
    await rejectClaim(admin, claimId, "Consent record and call recording show the request was genuine.");
    expect((await pool().query("select status from lead_quality_claims where id = $1", [claimId])).rows[0].status).toBe("rejected");
  });

  it("refunds cash through the demo provider, capped and only once", async () => {
    await expectAdminError(refundPurchase(admin, { purchaseId: purchase(6), mode: "cash", amountCents: 999_999, note: "Billing error" }), "exceeds_cap");
    const result = await refundPurchase(admin, { purchaseId: purchase(6), mode: "cash", note: "Duplicate charge" });
    expect(result.ref).toMatch(/^demo_refund_/);
    const entry = (await pool().query("select kind, amount_cents from ledger_entries where purchase_id = $1 and kind = 'cash_refund'", [purchase(6)])).rows[0];
    expect(entry.amount_cents).toBe(result.amountCents);
    await expectAdminError(refundPurchase(admin, { purchaseId: purchase(6), mode: "credit", note: "Again" }), "already_refunded");
  });

  it("records disputes and pauses purchases", async () => {
    const id = await createDispute(admin, { companyId: lonestar, purchaseId: purchase(5), amountCents: 4200, reason: "Card holder disputes the charge", pausePurchases: true });
    expect((await pool().query("select billing_status from companies where id = $1", [lonestar])).rows[0].billing_status).toBe("suspended");
    await expectAdminError(updateDispute(admin, id, { status: "won", restorePurchases: true }), "missing_text");
    await updateDispute(admin, id, { status: "won", outcome: "Evidence accepted by the bank.", restorePurchases: true });
    expect((await pool().query("select billing_status from companies where id = $1", [lonestar])).rows[0].billing_status).toBe("good");
  });

  it("restores purchases automatically when the last open dispute closes", async () => {
    const id = await createDispute(admin, { companyId: lonestar, reason: "Second dispute", pausePurchases: true });
    await updateDispute(admin, id, { status: "closed", outcome: "Withdrawn by the card holder.", restorePurchases: false });
    expect((await pool().query("select billing_status from companies where id = $1", [lonestar])).rows[0].billing_status).toBe("good");
  });

  it("retries failed provider refunds and reconciles provider charges", async () => {
    const attempt = (await pool().query(
      `insert into purchase_attempts (group_id, company_id, idempotency_key, status, lead_type, position, price_row_id, list_price_cents, charge_cents, card_amount_cents, payment_ref, expires_at)
       values ($1, $2, 'orphan-test', 'expired', 'shared', 2, (select id from company_prices where company_id = $2 order by id limit 1), 4000, 3200, 3200, 'demo_orphan', now())
       returning id`,
      [fixed("d0", 4), company(6)],
    )).rows[0].id;
    await pool().query("insert into payment_charges (attempt_id, company_id, provider, provider_ref, amount_cents, status) values ($1, $2, 'demo', 'demo_orphan', 3200, 'succeeded')", [attempt, company(6)]);
    const refund = (await pool().query(
      "insert into payment_refunds (attempt_id, company_id, provider, provider_ref, amount_cents, reason, status, error_code) values ($1, $2, 'demo', 'demo_orphan', 3200, 'slot_unavailable', 'failed', 'network_error') returning id",
      [attempt, company(6)],
    )).rows[0].id;
    expect((await chargeReconciliation({ onlyIssues: true })).find((r) => r.attempt_id === attempt)?.issues).toEqual(["Charged without a purchase or a completed refund"]);
    expect((await listProviderRefunds()).map((r) => r.id)).toContain(refund);
    expect(await retryProviderRefund(admin, refund)).toBe(true);
    expect((await pool().query("select status from payment_refunds where id = $1", [refund])).rows[0].status).toBe("succeeded");
    expect((await chargeReconciliation({ onlyIssues: true })).find((r) => r.attempt_id === attempt)).toBeUndefined();
    await expectAdminError(retryProviderRefund(admin, refund), "bad_status");
  });

  it("reconciles purchases with their ledger entries", async () => {
    const rows = await reconciliation();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.filter((r) => r.issues.length)).toEqual([]);
  });
});

describe("reviews", () => {
  it("publishes a pending review so it shows on the profile data", async () => {
    await expectAdminError(publishReview(admin, review(3), { evidenceLevel: "verified_customer" }), "label_not_supported");
    await publishReview(admin, review(3), { evidenceLevel: "platform_inquiry" });
    const row = (await pool().query("select status, published_at, evidence_level from reviews where id = $1", [review(3)])).rows[0];
    expect(row.status).toBe("published");
    expect(row.published_at).toBeInstanceOf(Date);
    const visible = await pool().query("select id from reviews where company_id = $1 and status = 'published'", [company(1)]);
    expect(visible.rows.map((r) => r.id)).toContain(review(3));
    expect((await pool().query("select action from moderation_actions where target_id = $1", [review(3)])).rows.map((r) => r.action)).toContain("publish");
  });

  it("rejects with a policy reason and records the moderation action", async () => {
    const inv = (await pool().query(
      `insert into review_invitations (purchase_id, company_id, review_type, token_hash, expires_at, sent_at)
       values ($1, $2, 'move_experience', repeat('ab', 32), now() + interval '30 days', now()) returning id`,
      [purchase(6), company(1)],
    )).rows[0].id;
    const id = (await pool().query(
      `insert into reviews (company_id, purchase_id, invitation_id, review_type, rating, body, reviewer_display_name, evidence_level)
       values ($1, $2, $3, 'move_experience', 1, 'Demo pending review', 'Chris E.', 'platform_inquiry') returning id`,
      [company(1), purchase(6), inv],
    )).rows[0].id;
    const ev = (await pool().query("insert into review_evidence (review_id, kind, file_ref) values ($1, 'estimate', 'demo://e.pdf') returning id", [id])).rows[0].id;
    await checkEvidence(admin, ev, { accepted: true });
    await expectAdminError(publishReview(admin, id, { evidenceLevel: "platform_inquiry" }), "label_not_supported");
    await rejectReview(admin, id, { reason: "no_evidence", note: "No completion document." });
    const row = (await pool().query("select status, rejection_reason from reviews where id = $1", [id])).rows[0];
    expect(row.status).toBe("rejected");
    expect(row.rejection_reason).toMatch(/No evidence/);
    const actions = await pool().query("select action, reason from moderation_actions where target_id = $1", [id]);
    expect(actions.rows).toEqual([{ action: "reject", reason: row.rejection_reason }]);
  });

  it("an upheld report removes a published review", async () => {
    const reportId = (await pool().query("insert into review_reports (review_id, reporter_type, reporter_company_id, reason) values ($1, 'company', $2, 'Not our customer') returning id", [review(1), company(1)])).rows[0].id;
    await decideReport(admin, reportId, { uphold: true, decision: "Reviewer confirmed it was about another company." });
    expect((await pool().query("select status from reviews where id = $1", [review(1)])).rows[0].status).toBe("removed");
  });
});

describe("leads", () => {
  it("lists without contact details and logs the admin view", async () => {
    const list = await listLeads({ status: "qualified" });
    expect(list.total).toBeGreaterThan(0);
    expect(JSON.stringify(list.rows)).not.toMatch(/@demo\.invalid/);
    const detail = await getLeadDetail(admin, lead(1));
    expect(detail?.consent?.rendered_text).toMatch(/participating movers/);
    expect(detail?.consentCompanies.some((c) => !c.named)).toBe(true);
    expect(await auditCount("lead.view", lead(1))).toBe(1);
  });

  it("approves a request waiting for review, and expires and withdraws others", async () => {
    await pool().query("update leads set status = 'needs_review' where id = $1", [lead(2)]);
    await expectAdminError(decideLead(admin, lead(3), "approve", "ok then"), "bad_status");
    await decideLead(admin, lead(2), "approve", "Risk signals reviewed: genuine request.");
    expect((await pool().query("select status from leads where id = $1", [lead(2)])).rows[0].status).toBe("qualified");
    await decideLead(admin, lead(3), "expire", "Consumer called to say the move is cancelled.");
    expect((await pool().query("select g.status from leads l join lead_groups g on g.id = l.group_id where l.id = $1", [lead(3)])).rows[0].status).toBe("expired");
    await decideLead(admin, lead(1), "withdraw", "Consumer asked by phone to withdraw consent.");
    expect((await pool().query("select g.status from leads l join lead_groups g on g.id = l.group_id where l.id = $1", [lead(1)])).rows[0].status).toBe("withdrawn");
    const notice = await pool().query("select count(*)::int as n from messages where template = 'lead_withdrawn'");
    expect(notice.rows[0].n).toBe(1);
  });
});

describe("settings, policies, consent text and admin users", () => {
  it("updates settings with validation and an audit row per change", async () => {
    await expectAdminError(updateSettings(admin, { sale_window_hours: "0" }), "invalid_settings");
    const result = await updateSettings(admin, { sale_window_hours: "48", show_zip_in_preview: "false" });
    expect(result.changed).toEqual(["sale_window_hours"]);
    expect(await auditCount("settings.update", "sale_window_hours")).toBe(1);
  });

  it("creates sharing policies validated by @amc/core and activates them", async () => {
    await expectAdminError(createSharingPolicy(admin, { version: "bad-policy", factors: "100, 120" }), "invalid_factors");
    await createSharingPolicy(admin, { version: "share-test-v2", factors: "100, 85, 70, 60, 50, 45" });
    await activateSharingPolicy(admin, "share-test-v2");
    expect((await pool().query("select value from platform_settings where key = 'active_policy_version'")).rows[0].value).toBe("share-test-v2");
    await createSharingPolicy(admin, { version: "share-test-short", factors: "100, 80" });
    await expectAdminError(activateSharingPolicy(admin, "share-test-short"), "invalid_policy");
  });

  it("creates consent drafts and approves them with a name", async () => {
    await expectAdminError(createConsentDraft(admin, { id: "consent-v1", kind: "contact_consent", body: "I agree that movers may contact me about my move." }), "missing_placeholder");
    await createConsentDraft(admin, { id: "consent-v1", kind: "contact_consent", body: "I agree that up to {N} of the movers listed above may contact me." });
    await approveConsentVersion(admin, "consent-v1", "Jane Counsel, Example LLP");
    expect((await pool().query("select status, approved_by from consent_text_versions where id = 'consent-v1'")).rows[0]).toEqual({ status: "approved", approved_by: "Jane Counsel, Example LLP" });
  });

  it("invites an admin by link; the link is hidden from ops in the mailbox", async () => {
    const { invitationId } = await inviteAdmin(admin, { email: "New.Ops@Demo.invalid", role: "ops" });
    const token = await tokenFromMessage("related_id = $1", [invitationId], "/admin-invite");
    const accepted = await acceptAdminInvitation(token, { kind: "new", fullName: "New Ops", password: "a-long-enough-password-1" });
    expect(accepted.ok).toBe(true);
    expect((await acceptAdminInvitation(token, { kind: "new", fullName: "New Ops", password: "a-long-enough-password-1" })).ok).toBe(false);
    const userId = accepted.ok ? accepted.userId : "";
    expect((await pool().query("select admin_role from admin_users where user_id = $1", [userId])).rows[0].admin_role).toBe("ops");

    const asOps = await listMailbox({ adminRole: "ops", demoMode: true }, { limit: 500 });
    expect(asOps.rows.some((m) => m.template === "invitation")).toBe(false);
    const asSuper = await listMailbox({ adminRole: "super_admin", demoMode: true }, { limit: 500 });
    const invitation = asSuper.rows.find((m) => m.related_id === invitationId);
    expect(invitation?.body).toContain("/admin-invite/");
    const notDemo = await listMailbox({ adminRole: "super_admin", demoMode: false }, { limit: 500 });
    expect(notDemo.rows.find((m) => m.related_id === invitationId)?.body).not.toContain("/admin-invite/");
    expect((await listMailbox({ adminRole: "finance", demoMode: true })).rows).toEqual([]);

    await expectAdminError(changeAdminRole(admin, ADMIN, "ops"), "self");
    await changeAdminRole(admin, userId, "support");
    await removeAdmin(admin, userId, "Left the team");
    expect((await pool().query("select count(*)::int as n from admin_users where user_id = $1", [userId])).rows[0].n).toBe(0);
  });
});

describe("cases", () => {
  it("creates, updates, re-verifies and suspends from a case", async () => {
    const id = await createCase(admin, { caseType: "broker_activity", description: "Consumer says the mover handed the job to another company.", companyId: company(2), reporterEmail: "reporter@demo.invalid" });
    const created = await getCase(id);
    expect(created?.case.sla_due_at).toBeInstanceOf(Date);
    await expectAdminError(updateCase(admin, id, { status: "resolved" }), "missing_outcome");
    await updateCase(admin, id, { assignee: ADMIN, status: "in_progress" });
    expect(await caseReverify(admin, id)).toBe("pass");
    await caseSuspend(admin, id, "Credible report of brokering");
    expect((await pool().query("select status from companies where id = $1", [company(2)])).rows[0].status).toBe("suspended");
    await updateCase(admin, id, { status: "resolved", outcome: "Company suspended pending re-verification." });
    const after = await getCase(id);
    expect(after?.case.status).toBe("resolved");
    expect(after?.history.length).toBeGreaterThanOrEqual(4);
  });
});

describe("dashboard and audit log", () => {
  it("summarizes activity and lists audit entries", async () => {
    const stats = await dashboardStats();
    expect(stats.money).toHaveLength(2);
    expect(stats.queues.pendingVerifications).toBeGreaterThanOrEqual(0);
    expect(stats.money[1]!.grossChargesCents).toBeGreaterThan(0);
    const log = await listAuditLog({ action: "company." });
    expect(log.total).toBeGreaterThan(3);
  });
});
