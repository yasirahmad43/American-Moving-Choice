"use server";

/** Review tools: public responses and reports (owner and manager; re-checked by the service). */
import { reportReview, respondToReview } from "@amc/server/reviews-company";
import { revalidatePath } from "next/cache";
import { actionActor, formText, runAction } from "@/components/portal/marketplace/action-support";
import type { FormState } from "@/lib/form";

export async function respondAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(["owner", "manager"]);
  return runAction(previous, "reviews.respond", async () => {
    await respondToReview(actor, formText(formData, "reviewId"), formText(formData, "body"));
    revalidatePath("/portal/reviews");
    return "Response published. It appears under the review on your public profile.";
  });
}

export async function reportAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(["owner", "manager"]);
  return runAction(previous, "reviews.report", async () => {
    await reportReview(actor, formText(formData, "reviewId"), formText(formData, "reason"));
    revalidatePath("/portal/reviews");
    return "Reported. Our moderators will review it and tell you the outcome.";
  });
}
