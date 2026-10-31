"use server";

/**
 * Report a concern: validate, check the honeypot and the per-IP rate limit, then create the case
 * and its audit entry (@amc/server/concerns). Nothing from the form goes into a URL, a log line or
 * an error message; the reply carries only the case reference (build plan §5; site architecture §8.8).
 */
import { publicRequestMeta } from "@amc/server/public-forms";
import { concernFieldErrors, concernInputSchema, concernRateLimit, createConcernCase, type ConcernField } from "@amc/server/concerns";
import { HONEYPOT_FIELD, type ConcernFormState, type ConcernFormValues } from "./shared";
import { publicSubmissionAllowed, SECURITY_CHECK_MESSAGE } from "@/lib/security/bot-check";

const FIELDS: ConcernField[] = ["caseType", "company", "description", "name", "email", "phone"];
const DISPLAY_MAX: Record<ConcernField, number> = { caseType: 30, company: 200, description: 4000, name: 120, email: 254, phone: 25 };

export async function submitConcern(_previous: ConcernFormState, formData: FormData): Promise<ConcernFormState> {
  const values: ConcernFormValues = {};
  const displayValues: ConcernFormValues = {};
  const typeErrors: Partial<Record<ConcernField, string>> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
    displayValues[field] = values[field]!.slice(0, DISPLAY_MAX[field]);
    if (value !== null && typeof value !== "string") typeErrors[field] = "Enter text in this field; file uploads are not supported.";
  }

  try {
    const { ip } = await publicRequestMeta();
    const limit = await concernRateLimit(ip);
    if (!limit.allowed) {
      return {
        status: "failed",
        message: "You've sent several reports in the last hour, so we didn't send this one. Please try again later, or write to us using the details on our Contact page.",
        values: displayValues,
      };
    }
    // Every attempt is counted. A filled or non-text trap receives a neutral acknowledgement.
    if (formData.getAll(HONEYPOT_FIELD).some(trap => typeof trap !== "string" || trap.trim() !== "")) return { status: "sent", reference: null };
    const parsed = concernInputSchema.safeParse(values);
    if (!parsed.success || Object.keys(typeErrors).length) {
      return { status: "invalid", fieldErrors: { ...(!parsed.success ? concernFieldErrors(parsed.error) : {}), ...typeErrors }, values: displayValues };
    }
    if (!await publicSubmissionAllowed()) return { status: "failed", message: SECURITY_CHECK_MESSAGE, values: displayValues };
    const result = await createConcernCase(parsed.data, { ip });
    return { status: "sent", reference: result.reference };
  } catch {
    // Database errors can contain descriptions and contact values; never log their payload.
    console.error("[report-a-concern] could not store a report");
    return {
      status: "failed",
      message: "We couldn't send your report just now, and nothing was saved. Please try again in a few minutes.",
      values: displayValues,
    };
  }
}
