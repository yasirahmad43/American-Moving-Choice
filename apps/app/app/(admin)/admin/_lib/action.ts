import "server-only";

/**
 * Wrapper for admin server actions: re-checks the admin role and MFA (requireAdmin), builds the
 * actor with the request IP, turns AdminError into a form message, and revalidates the pages the
 * decision changes. Unexpected errors are logged without their details (they can carry data) and
 * shown as a generic message.
 */
import { AdminError, isAdminError, type AdminActor } from "@amc/server/admin";
import { requestMeta, requireAdmin, type AdminRole } from "@amc/server/auth";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { errorState, type FormState } from "@/lib/form";

export interface ActionContext {
  actor: AdminActor;
  adminRole: AdminRole;
}

export async function adminAction(
  previous: FormState,
  roles: readonly AdminRole[],
  run: (ctx: ActionContext) => Promise<string>,
  revalidate: readonly string[] = [],
): Promise<FormState> {
  const { user, adminRole } = await requireAdmin({ roles });
  const { ip } = await requestMeta();
  try {
    const message = await run({ actor: { userId: user.id, ip }, adminRole });
    for (const path of revalidate) revalidatePath(path);
    return { status: "success", message, attempt: (previous.attempt ?? 0) + 1 };
  } catch (error) {
    unstable_rethrow(error);
    if (isAdminError(error)) return errorState(previous, error.message);
    console.error(`[admin] action failed${error instanceof Error ? ` (${error.name})` : ""}`);
    return errorState(previous, "Something went wrong, and nothing was changed. Try again, or check the audit log.");
  }
}

/** A trimmed string from form data. */
export function field(formData: FormData, name: string, max = 5000): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A UUID from a hidden field; an AdminError (shown as the form message) when it isn't one. */
export function idField(formData: FormData, name: string): string {
  const value = field(formData, name, 64);
  if (!UUID.test(value)) throw new AdminError("The form is missing its record. Reload the page and try again.");
  return value;
}
