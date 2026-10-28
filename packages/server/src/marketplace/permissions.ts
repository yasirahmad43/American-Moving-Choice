/**
 * Company permission matrix for the marketplace, CRM, billing and review tools (data-model §2).
 * Every service entry point resolves the actor's membership from the database with resolveActor,
 * so a role or company ID from the client is never trusted.
 */
import type { CompanyRole } from "../auth/invitations";
import type { Queryable } from "../db/pool";

export interface CompanyActor {
  userId: string;
  companyId: string;
  role: CompanyRole;
  canPurchase: boolean;
  /** Client IP for access logs (from requestMeta), when known. */
  ip?: string | null;
}

export type Capability =
  | "marketplace.view"
  | "marketplace.purchase"
  | "crm.view"
  /** See and edit every purchased request, not only those assigned to you. */
  | "crm.all"
  | "crm.assign"
  | "reviews.manage"
  | "billing.view"
  | "billing.manage"
  | "claims.submit";

const SALES: readonly CompanyRole[] = ["owner", "manager", "agent"];
const MANAGERS: readonly CompanyRole[] = ["owner", "manager"];

/** True when the actor's role (and per-user purchase toggle) allows the capability. */
export function can(actor: Pick<CompanyActor, "role" | "canPurchase">, capability: Capability): boolean {
  const { role } = actor;
  switch (capability) {
    case "marketplace.view":
    case "crm.view":
      return SALES.includes(role);
    case "marketplace.purchase":
      // Owners always may; managers and agents need the per-user purchase toggle.
      return role === "owner" || ((role === "manager" || role === "agent") && actor.canPurchase);
    case "crm.all":
    case "crm.assign":
    case "reviews.manage":
      return MANAGERS.includes(role);
    case "billing.view":
      return role === "owner" || role === "manager" || role === "billing";
    case "billing.manage":
      return role === "owner" || role === "billing";
    case "claims.submit":
      return role === "owner" || role === "manager" || role === "billing";
  }
}

export class PermissionError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function assertCan(actor: CompanyActor, capability: Capability, message?: string): void {
  if (!can(actor, capability)) throw new PermissionError(message);
}

/**
 * The user's active membership in the company, from the database. Throws PermissionError when
 * there is none (disabled members and other companies' users included).
 */
export async function resolveActor(
  db: Queryable,
  input: { userId: string; companyId: string; ip?: string | null },
): Promise<CompanyActor> {
  const result = await db.query<{ role: CompanyRole; can_purchase: boolean }>(
    `select role, can_purchase from company_memberships
     where user_id = $1 and company_id = $2 and status = 'active'`,
    [input.userId, input.companyId],
  );
  const row = result.rows[0];
  if (!row) throw new PermissionError("You are not an active member of this company.");
  return { userId: input.userId, companyId: input.companyId, role: row.role, canPurchase: row.can_purchase, ip: input.ip ?? null };
}
