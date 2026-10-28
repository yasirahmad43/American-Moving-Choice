import type { z } from "zod";

/** State shape shared by the auth forms' server actions (useActionState). */
export interface FormState<Field extends string = string> {
  status: "idle" | "error" | "success";
  /** Summary shown above the form. */
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  /** Submitted values to refill the form after an error. Never includes passwords. */
  values?: Partial<Record<Field, string>>;
  /** Increments on each response, so the form can move focus to the errors again. */
  attempt?: number;
}

export const initialFormState: FormState = { status: "idle", attempt: 0 };

/** A trimmed string from form data ("" when missing). */
export function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Like formString but keeps whitespace (passwords). */
export function formRaw(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export type ParsedForm<T, Field extends string> = { ok: true; data: T } | { ok: false; fieldErrors: Partial<Record<Field, string>> };

/** Validates input with a zod schema; on failure returns the first message per top-level field. */
export function parseForm<S extends z.ZodType, Field extends string = string>(schema: S, input: Record<string, unknown>): ParsedForm<z.output<S>, Field> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Partial<Record<Field, string>> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "") as Field;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { ok: false, fieldErrors };
}

export function errorState<Field extends string>(
  previous: FormState<Field>,
  message: string,
  extra: Pick<FormState<Field>, "fieldErrors" | "values"> = {},
): FormState<Field> {
  return { status: "error", message, ...extra, attempt: (previous.attempt ?? 0) + 1 };
}
