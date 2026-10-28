/** State shared by the directory pages' server actions and their forms (useActionState). */
export interface ActionState<Field extends string = string, Result = undefined> {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  /** Submitted values to refill the form after an error. */
  values?: Partial<Record<Field, string | string[]>>;
  result?: Result;
  /** Increments on each response, so the form can move focus again. */
  attempt: number;
}

export const idleState = { status: "idle", attempt: 0 } as const;
