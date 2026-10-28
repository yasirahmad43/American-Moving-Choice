"use server";

/** Review moderation decisions. */
import { AdminError, checkEvidence, decideReport, publishReview, rejectReview, removeResponse } from "@amc/server/admin";
import type { FormState } from "@/lib/form";
import { adminAction, field, idField } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const PATHS = ["/admin/reviews", "/admin"];

export async function moderateReviewAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.reviews, async ({ actor }) => {
    const reviewId = idField(formData, "reviewId");
    const decision = field(formData, "decision", 20);
    if (decision === "publish") {
      await publishReview(actor, reviewId, { evidenceLevel: field(formData, "evidenceLevel", 40), note: field(formData, "note", 500) });
      return "Review published.";
    }
    if (decision === "reject") {
      await rejectReview(actor, reviewId, { reason: field(formData, "reason", 40), note: field(formData, "note", 500) });
      return "Review rejected.";
    }
    throw new AdminError("Choose publish or reject.");
  }, PATHS);
}

export async function evidenceAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.reviews, async ({ actor }) => {
    const result = field(formData, "result", 20);
    if (result !== "accepted" && result !== "rejected") throw new AdminError("Choose accept or reject.");
    await checkEvidence(actor, idField(formData, "evidenceId"), { accepted: result === "accepted", note: field(formData, "note", 500) });
    return `Document ${result}.`;
  }, PATHS);
}

export async function reportAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.reviews, async ({ actor }) => {
    const decision = field(formData, "decision", 20);
    if (decision !== "uphold" && decision !== "dismiss") throw new AdminError("Choose uphold or dismiss.");
    await decideReport(actor, idField(formData, "reportId"), { uphold: decision === "uphold", decision: field(formData, "note", 1000) });
    return decision === "uphold" ? "Report upheld; the review is removed." : "Report dismissed; the review stays.";
  }, PATHS);
}

export async function removeResponseAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.reviews, async ({ actor }) => {
    await removeResponse(actor, idField(formData, "responseId"), field(formData, "reason", 500));
    return "Response removed.";
  }, PATHS);
}
