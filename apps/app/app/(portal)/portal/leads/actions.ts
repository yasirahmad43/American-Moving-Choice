"use server";

/**
 * CRM server actions for a purchased request. Each resolves the member on the server; the CRM,
 * billing and review services re-check the role and assignment against the database.
 */
import { submitClaim } from "@amc/server/billing";
import { addNote, CRM_STAGES, updateRecord, type CrmStage } from "@amc/server/crm";
import { requestMoveReview } from "@amc/server/reviews-company";
import { revalidatePath } from "next/cache";
import { actionActor, formText, runAction } from "@/components/portal/marketplace/action-support";
import { errorState, type FormState } from "@/lib/form";

const SALES = ["owner", "manager", "agent"] as const;

function refresh(purchaseId: string) {
  revalidatePath(`/portal/leads/${purchaseId}`);
  revalidatePath("/portal/leads");
  revalidatePath("/portal/pipeline");
}

export async function updateStageAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(SALES);
  const purchaseId = formText(formData, "purchaseId");
  const stage = formText(formData, "stage");
  if (!(CRM_STAGES as readonly string[]).includes(stage)) return errorState(previous, "Choose a stage.");
  const lostReason = formText(formData, "lostReason");
  return runAction(previous, "crm.stage", async () => {
    await updateRecord(actor, purchaseId, {
      stage: stage as CrmStage,
      ...(formData.has("lostReason") ? { lostReason: lostReason || null } : {}),
    });
    refresh(purchaseId);
    return "Stage saved.";
  });
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function updateDetailsAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(SALES);
  const purchaseId = formText(formData, "purchaseId");
  const followUp = formText(formData, "followUpAt");
  const value = formText(formData, "estimatedValue").replace(/[$,\s]/g, "");
  if (followUp && !DATE.test(followUp)) return errorState(previous, "Enter the follow-up date as a date.");
  if (value && !/^\d{1,7}(\.\d{1,2})?$/.test(value)) return errorState(previous, "Enter the estimated value in dollars, for example 1850 or 1850.00.");
  return runAction(previous, "crm.details", async () => {
    await updateRecord(actor, purchaseId, {
      // Noon UTC keeps the chosen calendar day in every US time zone.
      followUpAt: followUp ? new Date(`${followUp}T12:00:00Z`) : null,
      estimatedValueCents: value ? Math.round(Number(value) * 100) : null,
    });
    refresh(purchaseId);
    return "Follow-up and value saved.";
  });
}

export async function assignAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(["owner", "manager"]);
  const purchaseId = formText(formData, "purchaseId");
  const assignee = formText(formData, "assigneeUserId");
  return runAction(previous, "crm.assign", async () => {
    await updateRecord(actor, purchaseId, { assigneeUserId: assignee || null });
    refresh(purchaseId);
    return "Assignment saved.";
  });
}

export async function addNoteAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(SALES);
  const purchaseId = formText(formData, "purchaseId");
  const body = formText(formData, "body");
  return runAction(previous, "crm.note", async () => {
    await addNote(actor, purchaseId, body);
    refresh(purchaseId);
    return "Note added.";
  });
}

export async function submitClaimAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(["owner", "manager", "billing"]);
  const purchaseId = formText(formData, "purchaseId");
  return runAction(previous, "billing.claim", async () => {
    await submitClaim(actor, { purchaseId, reason: formText(formData, "reason"), evidence: formText(formData, "evidence") });
    refresh(purchaseId);
    revalidatePath("/portal/billing");
    return "Claim filed. An American Moving Choice reviewer will decide it and the result will appear in Billing.";
  });
}

export async function requestReviewAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(["owner", "manager"]);
  const purchaseId = formText(formData, "purchaseId");
  return runAction(previous, "reviews.request", async () => {
    await requestMoveReview(actor, purchaseId);
    refresh(purchaseId);
    return "Requested. American Moving Choice will email the customer a review invitation.";
  });
}
