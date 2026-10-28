/**
 * Resolves the acting user's membership from the database. Every onboarding function calls it,
 * so authorization never depends on what a page or form claims about the user's role.
 */
import type { CompanyRole } from "../auth/invitations";
import { getPool, isUuid, type Queryable } from "../db/pool";
import { PermissionError, type Actor, type ActorMembership } from "./permissions";

export async function loadActor(actor: Actor, roles?: readonly CompanyRole[], db: Queryable = getPool()): Promise<ActorMembership> {
  if (!isUuid(actor.userId) || !isUuid(actor.companyId)) throw new PermissionError();
  const found = await db.query<{ id: string; role: CompanyRole }>(
    "select id, role from company_memberships where company_id = $1 and user_id = $2 and status = 'active'",
    [actor.companyId, actor.userId],
  );
  const row = found.rows[0];
  if (!row) throw new PermissionError("You're not an active member of this company.");
  if (roles && !roles.includes(row.role)) throw new PermissionError();
  return { ...actor, membershipId: row.id, role: row.role };
}
