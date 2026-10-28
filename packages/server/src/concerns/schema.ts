/**
 * The public "Report a concern" form (/report-a-concern/): case types, labels and validation.
 * Pure (no database, no server-only import) so the form, the server action and tests share it.
 */
import { z } from "zod";

/** Case types a member of the public can choose. They map to cases.case_type (002). */
export const CONCERN_TYPES = [
  "broker_activity",
  "unlisted_contact",
  "credential",
  "misconduct",
  "review",
  "privacy",
  "other",
] as const;

export type ConcernType = (typeof CONCERN_TYPES)[number];

/** Radio labels and one-line descriptions, in the order the form shows them. */
export const CONCERN_TYPE_LABELS: Record<ConcernType, { label: string; description: string }> = {
  broker_activity: {
    label: "A company acting as a broker",
    description: "It said it would pass your move to another company, or another company turned up on moving day.",
  },
  unlisted_contact: {
    label: "Unexpected contact about my request",
    description: "More companies contacted you than you allowed, or contact did not match your preferences.",
  },
  credential: {
    label: "A mover's credentials look wrong",
    description: "A USDOT or MC number, authority, insurance or state license that doesn't match what the company told you.",
  },
  misconduct: {
    label: "How a mover treated me",
    description: "For example pressure, a demand for a large deposit, or belongings held until you pay more.",
  },
  review: { label: "A review", description: "A review that breaks our review rules, or a problem leaving one." },
  privacy: { label: "My personal details", description: "How your details were used or shared, or a request to delete them." },
  other: { label: "Something else", description: "Anything that doesn't fit the options above." },
};

export const DESCRIPTION_MAX = 4000;

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .transform((value) => (value === "" ? null : value));

/** Phone numbers: digits, spaces and common punctuation; 10 to 15 digits. */
const phonePattern = /^[0-9+().\-\s]{7,25}$/;

export const concernInputSchema = z
  .object({
    caseType: z.enum(CONCERN_TYPES, { error: "Choose what your concern is about." }),
    company: trimmed(200),
    description: z
      .string()
      .trim()
      .min(20, "Tell us a little more: at least 20 characters.")
      .max(DESCRIPTION_MAX, `Use ${DESCRIPTION_MAX} characters or fewer.`),
    name: trimmed(120),
    email: trimmed(254).refine((value) => value === null || z.email().safeParse(value).success, "Enter an email address like name@example.com."),
    phone: trimmed(25).refine(
      (value) => value === null || (phonePattern.test(value) && (value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 15)),
      "Enter a phone number with area code, like 555-123-4567.",
    ),
  })
  .strict();

export type ConcernInput = z.output<typeof concernInputSchema>;

export type ConcernField = keyof z.input<typeof concernInputSchema>;

/** Field errors keyed by field name (first message only), for the form. */
export function concernFieldErrors(error: z.ZodError): Partial<Record<ConcernField, string>> {
  const errors: Partial<Record<ConcernField, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) errors[field as ConcernField] = issue.message;
  }
  return errors;
}

/**
 * A USDOT or MC number in the company text, if the text is only that: "1234567", "USDOT 1234567",
 * "MC-123456". Used to link the case to a company record; anything else stays free text.
 */
export function parseCarrierNumber(text: string | null): { kind: "usdot" | "mc"; number: string } | null {
  if (!text) return null;
  const match = /^\s*(?:(us\s*dot|dot|mc)[\s#:-]*)?(\d{4,8})\s*$/i.exec(text);
  if (!match) return null;
  const kind = match[1] && /^mc$/i.test(match[1]) ? "mc" : "usdot";
  return { kind, number: match[2]! };
}
