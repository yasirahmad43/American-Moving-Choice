/**
 * Review form input rules (review methodology; mover verification §6). Pure, so tests import it
 * directly. Evidence files can't be uploaded in the preview: a move-experience reviewer describes
 * the documents they hold, and moderation decides the label.
 */
import { z } from "zod";

export type InvitationReviewType = "quote_experience" | "move_experience";

/** Documents a reviewer can say they hold (review_evidence.kind; review methodology label table). */
export const EVIDENCE_KINDS = ["estimate", "deposit_receipt", "bill_of_lading", "final_invoice", "delivery_receipt"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  estimate: "A written estimate from this mover",
  deposit_receipt: "A deposit receipt from this mover",
  bill_of_lading: "A bill of lading signed at delivery",
  final_invoice: "A final invoice",
  delivery_receipt: "A delivery receipt",
};

/** Documents that show the move was completed (Verified completed move). */
export const COMPLETION_KINDS: readonly EvidenceKind[] = ["bill_of_lading", "final_invoice", "delivery_receipt"];

/** Attempts per window (build plan §6: review submission is rate limited). */
export const REVIEW_RATE_LIMITS = {
  submitPerIp: { limit: 10, windowSeconds: 60 * 60 },
  submitPerToken: { limit: 5, windowSeconds: 60 * 60 },
} as const;

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

const baseSchema = z.object({
  rating: z.coerce
    .number({ error: "Choose a rating from 1 to 5 stars." })
    .int("Choose a rating from 1 to 5 stars.")
    .min(1, "Choose a rating from 1 to 5 stars.")
    .max(5, "Choose a rating from 1 to 5 stars."),
  title: text(100).optional().transform((v) => (v ? v : null)),
  body: text(4000).min(20, "Tell us a little more: at least 20 characters."),
  displayName: text(40).min(2, "Enter the name to show with your review, such as your first name and last initial."),
  attest: z.literal(true, { error: "Confirm that this review describes your own experience with this mover." }),
});

const moveSchema = baseSchema.extend({
  evidenceKinds: z
    .array(z.enum(EVIDENCE_KINDS))
    .min(1, "Tick the documents you have from this move.")
    .refine((kinds) => kinds.some((k) => COMPLETION_KINDS.includes(k)), {
      message: "A moving-experience review needs a document showing the move was completed: a bill of lading signed at delivery, a final invoice or a delivery receipt.",
    }),
  evidenceDescription: text(1000).min(10, "Describe the documents in a sentence or two, such as their dates and what they show."),
});

export type ReviewInput = z.output<typeof baseSchema> & {
  evidenceKinds?: EvidenceKind[];
  evidenceDescription?: string;
};

export type FieldErrors = Partial<Record<"rating" | "title" | "body" | "displayName" | "attest" | "evidenceKinds" | "evidenceDescription", string>>;

/** Validates raw form values for one invitation type. */
export function parseReviewInput(type: InvitationReviewType, raw: Record<string, unknown>): { ok: true; input: ReviewInput } | { ok: false; errors: FieldErrors } {
  const schema = type === "move_experience" ? moveSchema : baseSchema;
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, input: parsed.data as ReviewInput };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof FieldErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** Reads a FormData into the shape parseReviewInput expects. */
export function reviewFormValues(form: FormData): Record<string, unknown> {
  const rating = form.get("rating");
  return {
    rating: typeof rating === "string" && rating !== "" ? rating : undefined,
    title: form.get("title") ?? undefined,
    body: form.get("body") ?? "",
    displayName: form.get("displayName") ?? "",
    attest: form.get("attest") === "on" || form.get("attest") === "true",
    evidenceKinds: form.getAll("evidenceKinds").filter((v): v is string => typeof v === "string"),
    evidenceDescription: form.get("evidenceDescription") ?? "",
  };
}
