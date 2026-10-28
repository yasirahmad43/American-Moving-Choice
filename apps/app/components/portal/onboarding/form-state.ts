import type { FormState } from "@/lib/form";

/** Server action state for the onboarding forms (useActionState). */
export interface ActionState {
  status: "idle" | "error" | "success";
  message?: string;
  /** Keyed by field name, or by path such as "rows.0.number". */
  fieldErrors?: Record<string, string>;
  /** Submitted values to refill the form after an error. Never passwords. */
  values?: Record<string, string | string[]>;
  attempt?: number;
}

export const idleState: ActionState = { status: "idle", attempt: 0 };

export function errorResult(previous: ActionState, message: string, extra: Pick<ActionState, "fieldErrors" | "values"> = {}): ActionState {
  return { status: "error", message, ...extra, attempt: (previous.attempt ?? 0) + 1 };
}

export function successResult(previous: ActionState, message: string): ActionState {
  return { status: "success", message, attempt: (previous.attempt ?? 0) + 1 };
}

/** The subset FormMessage reads. */
export const asFormState = (state: ActionState): FormState => ({
  status: state.status,
  message: state.message,
  fieldErrors: state.fieldErrors,
  attempt: state.attempt,
});
