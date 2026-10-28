"use server";

/**
 * Application wizard actions. Each resolves the member and role on the server, validates with the
 * shared step schema in @amc/server/companies and redirects to the next step on success.
 */
import {
  APPLICATION_STEPS,
  COMPANY_MANAGERS,
  MAX_STATE_CREDENTIALS,
  PermissionError,
  STEP_TITLES,
  isApplicationStep,
  saveApplicationStep,
  submitApplication,
  type ApplicationStep,
} from "@amc/server/companies";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { errorResult, type ActionState } from "@/components/portal/onboarding/form-state";
import { actionContext, deliverOutboxLater, formValues } from "@/components/portal/onboarding/server-helpers";

const MULTI = ["moveTypes", "moveSizes", "services", "states", "coverages"];

const str = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};
const list = (formData: FormData, name: string) => formData.getAll(name).filter((v): v is string => typeof v === "string");

/** The step's input object from the form fields (names match the step schema). */
function stepInput(step: ApplicationStep, formData: FormData): Record<string, unknown> {
  switch (step) {
    case "company":
      return Object.fromEntries(["legalName", "dbaName", "addressLine1", "addressLine2", "city", "state", "zip", "phone", "website"].map((k) => [k, str(formData, k)]));
    case "identifiers":
      return { usdot: str(formData, "usdot"), mc: str(formData, "mc") };
    case "services":
      return { moveTypes: list(formData, "moveTypes"), moveSizes: list(formData, "moveSizes"), services: list(formData, "services") };
    case "areas":
      return { states: list(formData, "states"), reach: str(formData, "reach") || undefined };
    case "credentials":
      return {
        noneRequired: str(formData, "noneRequired"),
        rows: Array.from({ length: MAX_STATE_CREDENTIALS }, (_, i) => ({
          state: str(formData, `rows.${i}.state`),
          number: str(formData, `rows.${i}.number`),
          issuer: str(formData, `rows.${i}.issuer`),
          expiresOn: str(formData, `rows.${i}.expiresOn`),
        })),
      };
    case "insurance":
      return { insurer: str(formData, "insurer"), policyNumber: str(formData, "policyNumber"), expiresOn: str(formData, "expiresOn"), coverages: list(formData, "coverages") };
    case "representative":
      return { name: str(formData, "name"), title: str(formData, "title"), email: str(formData, "email"), phone: str(formData, "phone"), attest: str(formData, "attest") };
    case "review":
      return { termsVersion: str(formData, "termsVersion"), acceptTerms: str(formData, "acceptTerms") };
  }
}

export async function saveStepAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const step = str(formData, "step");
  if (!isApplicationStep(step) || step === "review") return errorResult(previous, "Something went wrong. Reload the page and try again.");
  const ctx = await actionContext(COMPANY_MANAGERS);
  const values = formValues(formData, MULTI, ["step"]);
  let result;
  try {
    result = await saveApplicationStep(ctx.actor, step, stepInput(step, formData), { ip: ctx.ip });
  } catch (error) {
    if (error instanceof PermissionError) return errorResult(previous, error.message, { values });
    throw error;
  }
  if (!result.ok) {
    if (result.reason === "locked") return errorResult(previous, result.message, { values });
    const count = Object.keys(result.fieldErrors).length;
    const message = result.fieldErrors._form ?? (count === 1 ? "Check the highlighted field." : "Check the highlighted fields.");
    return errorResult(previous, message, { fieldErrors: result.fieldErrors, values });
  }
  const next = APPLICATION_STEPS[APPLICATION_STEPS.indexOf(step) + 1] ?? "review";
  // The portal layout shows the company name and status; render it again.
  if (step === "company") revalidatePath("/portal", "layout");
  redirect(`/portal/application?step=${next}&saved=${step}`);
}

export async function submitApplicationAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await actionContext(COMPANY_MANAGERS);
  const values = formValues(formData, [], ["termsVersion"]);
  let result;
  try {
    result = await submitApplication(ctx.actor, stepInput("review", formData), { ip: ctx.ip, userAgent: ctx.userAgent });
  } catch (error) {
    if (error instanceof PermissionError) return errorResult(previous, error.message, { values });
    throw error;
  }
  if (!result.ok) {
    if (result.reason === "invalid") return errorResult(previous, "Check the highlighted field.", { fieldErrors: result.fieldErrors, values });
    if (result.reason === "locked") return errorResult(previous, result.message);
    return errorResult(previous, `Finish or update these steps first: ${result.missing.map((s) => STEP_TITLES[s]).join(", ")}.`, { values });
  }
  deliverOutboxLater();
  revalidatePath("/portal", "layout");
  redirect(`/portal?submitted=${result.status}`);
}
