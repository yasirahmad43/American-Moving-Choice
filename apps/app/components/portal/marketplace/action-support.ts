import "server-only";

/**
 * Shared plumbing for the S6 server actions: resolve the signed-in member on the server (the
 * services re-check the membership and role from the database), and turn service errors into form
 * messages without leaking internals.
 */
import { requestMeta, requireMembership, type CompanyRole } from "@amc/server/auth";
import { BillingError } from "@amc/server/billing";
import { CrmError } from "@amc/server/crm";
import { PermissionError } from "@amc/server/marketplace";
import { PaymentMethodError } from "@amc/server/payments";
import { ReviewToolsError } from "@amc/server/reviews-company";
import { errorState, type FormState } from "@/lib/form";

export interface ActionActor {
  userId: string;
  companyId: string;
  ip: string | null;
}

/** The member acting, limited to roles. Call outside try/catch: it redirects when access is missing. */
export async function actionActor(roles: readonly CompanyRole[]): Promise<ActionActor> {
  const { user, membership } = await requireMembership({ roles });
  const { ip } = await requestMeta();
  return { userId: user.id, companyId: membership.companyId, ip };
}

const KNOWN_ERRORS = [PermissionError, CrmError, BillingError, PaymentMethodError, ReviewToolsError];

export function knownErrorMessage(error: unknown): string | null {
  return KNOWN_ERRORS.some((E) => error instanceof E) ? (error as Error).message : null;
}

const GENERIC = "Something went wrong and nothing was saved. Try again.";

/** Runs a mutation and returns the next form state: success with a message, or an error message. */
export async function runAction<Field extends string>(
  previous: FormState<Field>,
  label: string,
  fn: () => Promise<string | void>,
): Promise<FormState<Field>> {
  try {
    const message = await fn();
    return { status: "success", message: message ?? "Saved.", attempt: (previous.attempt ?? 0) + 1 };
  } catch (error) {
    const known = knownErrorMessage(error);
    if (!known) console.error(`[${label}] action failed${error instanceof Error ? `: ${error.name}` : ""}`);
    return errorState(previous, known ?? GENERIC);
  }
}

export const formText = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};
