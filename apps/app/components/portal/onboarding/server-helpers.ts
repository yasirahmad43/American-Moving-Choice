import "server-only";

/**
 * Shared server-side helpers for the onboarding pages and their server actions. Every action
 * resolves the membership and role on the server (requireMembership) and passes only the
 * resolved IDs to @amc/server, which loads the membership again before acting.
 */
import { requestMeta, requireMembership, type CompanyRole } from "@amc/server/auth";
import { deliverPending } from "@amc/server/outbox";
import { after } from "next/server";

export interface ActionContext {
  actor: { userId: string; companyId: string };
  role: CompanyRole;
  user: Awaited<ReturnType<typeof requireMembership>>["user"];
  ip: string | null;
  userAgent: string | null;
}

/** The signed-in member acting for their active company, limited to `roles`. */
export async function actionContext(roles?: readonly CompanyRole[]): Promise<ActionContext> {
  const { user, membership } = await requireMembership(roles ? { roles } : {});
  const meta = await requestMeta();
  return { actor: { userId: user.id, companyId: membership.companyId }, role: membership.role, user, ip: meta.ip, userAgent: meta.userAgent };
}

/** Sends queued emails after the response (demo mode stores them for the admin mailbox). */
export function deliverOutboxLater(): void {
  after(async () => {
    try {
      await deliverPending({ limit: 20 });
    } catch {
      console.error("[outbox] delivery after response failed");
    }
  });
}

/** Form values as plain strings and string lists, for refilling a form after an error. Never passwords. */
export function formValues(formData: FormData, multi: readonly string[] = [], skip: readonly string[] = []): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION") || skip.includes(key) || typeof value !== "string") continue;
    if (multi.includes(key)) values[key] = [...((values[key] as string[] | undefined) ?? []), value.slice(0, 2000)];
    else values[key] = value.slice(0, 5000);
  }
  return values;
}
