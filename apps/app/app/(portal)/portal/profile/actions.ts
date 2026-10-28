"use server";

import { COMPANY_MANAGERS, PermissionError, updateProfile } from "@amc/server/companies";
import { refresh } from "next/cache";
import { errorResult, successResult, type ActionState } from "@/components/portal/onboarding/form-state";
import { actionContext, formValues } from "@/components/portal/onboarding/server-helpers";

const field = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** Saves the public profile (owners and managers). Moderated changes to a live profile go to review. */
export async function updateProfileAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext(COMPANY_MANAGERS);
  const values = formValues(formData);
  try {
    const result = await updateProfile(
      ctx.actor,
      { displayName: field(formData, "displayName"), description: field(formData, "description"), logoUrl: field(formData, "logoUrl"), website: field(formData, "website") },
      { ip: ctx.ip },
    );
    if (!result.ok) {
      if ("reason" in result) return errorResult(previous, "Your profile isn't set up yet. Save the company details step of your application first.", { values });
      return errorResult(previous, "Check the highlighted fields.", { fieldErrors: result.fieldErrors, values });
    }
    refresh();
    if (!result.changed) return successResult(previous, "Nothing changed.");
    return successResult(
      previous,
      result.sentForReview
        ? "Saved. A reviewer checks profile changes before they go public, so your profile is marked under review until then."
        : "Saved.",
    );
  } catch (error) {
    if (error instanceof PermissionError) return errorResult(previous, error.message, { values });
    throw error;
  }
}
