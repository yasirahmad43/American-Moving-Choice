/** Shared between the server action and the form (a "use server" file may export only async functions). */
import type { ConcernField } from "@amc/server/concerns";

/** Name of the hidden field people never see; bots that fill every field fill it. */
export const HONEYPOT_FIELD = "leave_this_blank";

export type ConcernFormValues = Partial<Record<ConcernField, string>>;

export type ConcernFormState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<ConcernField, string>>; values: ConcernFormValues }
  | { status: "failed"; message: string; values: ConcernFormValues }
  | { status: "sent"; reference: string | null };
