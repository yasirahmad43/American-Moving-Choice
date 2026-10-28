"use server";

import { requestMeta } from "@amc/server/auth";
import { reviewFormValues, submitReview, type FieldErrors } from "@amc/server/reviews-public";
import type { ActionState } from "@/components/directory/form-state";

export type ReviewField = keyof FieldErrors;
export type ReviewFormState = ActionState<ReviewField, { reviewType: "quote_experience" | "move_experience" }>;

const MESSAGES = {
  rate_limited: "Too many attempts from this link or connection. Wait an hour, then try again.",
  invalid: "This review link isn't valid. Use the link in the email we sent you.",
  used: "This review link has already been used. Each link works once.",
  expired: "This review link has expired.",
} as const;

/** Submits the review form. The token travels in the form body, not the action URL. */
export async function submitReviewAction(previous: ReviewFormState, form: FormData): Promise<ReviewFormState> {
  const attempt = previous.attempt + 1;
  const token = typeof form.get("token") === "string" ? (form.get("token") as string) : "";
  const raw = reviewFormValues(form);
  const values: ReviewFormState["values"] = {
    rating: typeof raw.rating === "string" ? raw.rating : "",
    title: typeof raw.title === "string" ? raw.title : "",
    body: typeof raw.body === "string" ? raw.body : "",
    displayName: typeof raw.displayName === "string" ? raw.displayName : "",
    evidenceKinds: Array.isArray(raw.evidenceKinds) ? (raw.evidenceKinds as string[]) : [],
    evidenceDescription: typeof raw.evidenceDescription === "string" ? raw.evidenceDescription : "",
  };
  const { ip } = await requestMeta();
  const result = await submitReview(token, raw, { ip });
  if (result.ok) {
    return { status: "success", attempt, result: { reviewType: result.reviewType } };
  }
  if (result.error === "validation") {
    return { status: "error", attempt, message: "Check the highlighted answers.", fieldErrors: result.fieldErrors, values };
  }
  return { status: "error", attempt, message: MESSAGES[result.error], values };
}
