"use server";

/**
 * Report a concern: validate, check the honeypot and the per-IP rate limit, then create the case
 * and its audit entry (@amc/server/concerns). Nothing from the form goes into a URL, a log line or
 * an error message; the reply carries only the case reference (build plan §5; site architecture §8.8).
 */
import { requestMeta } from "@amc/server/auth";
import { concernFieldErrors, concernInputSchema, concernRateLimit, createConcernCase, type ConcernField } from "@amc/server/concerns";
import { HONEYPOT_FIELD, type ConcernFormState, type ConcernFormValues } from "./shared";

const FIELDS: ConcernField[] = ["caseType", "company", "description", "name", "email", "phone"];

export async function submitConcern(_previous: ConcernFormState, formData: FormData): Promise<ConcernFormState> {
  const values: ConcernFormValues = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  // A filled honeypot gets the same acknowledgement as a person, without storing anything.
  const trap = formData.get(HONEYPOT_FIELD);
  if (typeof trap === "string" && trap.trim() !== "") return { status: "sent", reference: null };

  const parsed = concernInputSchema.safeParse(values);
  if (!parsed.success) return { status: "invalid", fieldErrors: concernFieldErrors(parsed.error), values };

  try {
    const { ip } = await requestMeta();
    const limit = await concernRateLimit(ip);
    if (!limit.allowed) {
      return {
        status: "failed",
        message: "You've sent several reports in the last hour, so we didn't send this one. Please try again later, or write to us using the details on our Contact page.",
        values,
      };
    }
    const result = await createConcernCase(parsed.data, { ip });
    return { status: "sent", reference: result.reference };
  } catch (error) {
    // Log the error class only: driver messages can carry the submitted values.
    console.error(`[report-a-concern] could not store a report (${error instanceof Error ? error.name : "unknown error"})`);
    return {
      status: "failed",
      message: "We couldn't send your report just now, and nothing was saved. Please try again in a few minutes.",
      values,
    };
  }
}
