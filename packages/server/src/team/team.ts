/**
 * Team management (data model §2 permission matrix; build plan §6). Owners invite anyone, change
 * roles, disable and re-enable members and set an agent's purchase permission. Managers see the
 * team and invite agents. Invitations go out through the outbox with a single-use link
 * (APP_URL/invite/[token]); accepting is handled by @amc/server/auth.
 *
 * Every function loads the actor's membership from the database and checks the target belongs to
 * the same company, so IDs from a form are never trusted on their own.
 */
import { normalizeEmail } from "@amc/core";
import { audit } from "../audit/audit";
import { COMPANY_ROLES, InvitationError, createInvitation, revokeInvitation, type CompanyRole } from "../auth/invitations";
import { checkRateLimit, rateLimitKey } from "../auth/rate-limit";
import { getPool, isUuid, tx } from "../db/pool";
import { loadActor } from "../companies/actor";
import { PermissionError, canInviteRole, canManageMembers, canRevokeInvitation, type Actor } from "../companies/permissions";

export interface TeamMember {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string;
  role: CompanyRole;
  status: "active" | "disabled";
  canPurchase: boolean;
  mfaEnabled: boolean;
  joinedAt: Date;
  isSelf: boolean;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: CompanyRole;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: string | null;
}

export interface TeamView {
  actorRole: CompanyRole;
  members: TeamMember[];
  invitations: PendingInvitation[];
}

const TEAM_VIEWERS: readonly CompanyRole[] = ["owner", "manager"];
/** Invitations one company can send per hour. */
export const INVITATIONS_PER_HOUR = 20;

export async function getTeam(actor: Actor): Promise<TeamView> {
  const member = await loadActor(actor, TEAM_VIEWERS);
  const db = getPool();
  const members = await db.query<{
    id: string;
    user_id: string;
    full_name: string | null;
    email: string;
    role: CompanyRole;
    status: "active" | "disabled";
    can_purchase: boolean;
    mfa_enabled: boolean;
    created_at: Date;
  }>(
    `select m.id, m.user_id, u.full_name, u.email, m.role, m.status, m.can_purchase, u.mfa_enabled_at is not null as mfa_enabled, m.created_at
     from company_memberships m join users u on u.id = m.user_id
     where m.company_id = $1
     order by m.status, array_position(array['owner','manager','agent','billing'], m.role), m.created_at`,
    [actor.companyId],
  );
  const invitations = await db.query<{ id: string; email: string; role: CompanyRole; expires_at: Date; created_at: Date; invited_by: string | null }>(
    `select i.id, i.email, i.role, i.expires_at, i.created_at, coalesce(u.full_name, u.email) as invited_by
     from invitations i left join users u on u.id = i.invited_by
     where i.company_id = $1 and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
     order by i.created_at desc`,
    [actor.companyId],
  );
  return {
    actorRole: member.role,
    members: members.rows.map((r) => ({
      membershipId: r.id,
      userId: r.user_id,
      fullName: r.full_name,
      email: r.email,
      role: r.role,
      status: r.status,
      canPurchase: r.can_purchase,
      mfaEnabled: r.mfa_enabled,
      joinedAt: r.created_at,
      isSelf: r.user_id === actor.userId,
    })),
    invitations: invitations.rows.map((r) => ({ id: r.id, email: r.email, role: r.role, expiresAt: r.expires_at, createdAt: r.created_at, invitedBy: r.invited_by })),
  };
}

export type InviteResult = { ok: true; invitationId: string } | { ok: false; field?: "email" | "role"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sends an invitation (owners: any role; managers: agents only). */
export async function inviteMember(actor: Actor, input: { email: string; role: string }, meta: { ip?: string | null } = {}): Promise<InviteResult> {
  const member = await loadActor(actor, TEAM_VIEWERS);
  const email = normalizeEmail(input.email ?? "");
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, field: "email", message: "Enter an email address like name@company.com." };
  if (!(COMPANY_ROLES as readonly string[]).includes(input.role)) return { ok: false, field: "role", message: "Choose a role." };
  const role = input.role as CompanyRole;
  if (!canInviteRole(member.role, role)) {
    return { ok: false, field: "role", message: member.role === "manager" ? "Managers can invite agents. Ask an owner to invite other roles." : "You can't invite people." };
  }
  const limited = await checkRateLimit(rateLimitKey("invite:company", actor.companyId), INVITATIONS_PER_HOUR, 3600);
  if (!limited.allowed) return { ok: false, message: "Too many invitations in the last hour. Try again later." };
  try {
    const { invitationId } = await createInvitation({ companyId: actor.companyId, email, role, invitedBy: member.userId, ip: meta.ip ?? null });
    return { ok: true, invitationId };
  } catch (error) {
    if (error instanceof InvitationError) return { ok: false, field: "email", message: error.message };
    throw error;
  }
}

/** Revokes a pending invitation the actor could have sent. */
export async function cancelInvitation(actor: Actor, invitationId: string, meta: { ip?: string | null } = {}): Promise<boolean> {
  const member = await loadActor(actor, TEAM_VIEWERS);
  if (!isUuid(invitationId)) return false;
  const found = await getPool().query<{ role: CompanyRole }>(
    "select role from invitations where id = $1 and company_id = $2 and accepted_at is null and revoked_at is null",
    [invitationId, actor.companyId],
  );
  const invitation = found.rows[0];
  if (!invitation) return false;
  if (!canRevokeInvitation(member.role, invitation.role)) throw new PermissionError();
  return revokeInvitation({ invitationId, companyId: actor.companyId, actorId: member.userId, ip: meta.ip ?? null });
}

export type MemberChangeResult = { ok: true } | { ok: false; message: string };

/** Owners and managers can buy by default; agents only when an owner allows it; billing never. */
const purchaseDefault = (role: CompanyRole) => role === "owner" || role === "manager";

async function changeMember(
  actor: Actor,
  membershipId: string,
  meta: { ip?: string | null },
  apply: (target: { role: CompanyRole; status: "active" | "disabled"; userId: string; activeOwners: number }) =>
    | { ok: false; message: string }
    | { sql: string; params: unknown[]; action: string; before: unknown; after: unknown },
): Promise<MemberChangeResult> {
  if (!isUuid(membershipId)) return { ok: false, message: "That team member doesn't exist." };
  return tx(async (client): Promise<MemberChangeResult> => {
    const member = await loadActor(actor, ["owner"], client);
    if (!canManageMembers(member.role)) throw new PermissionError();
    // Lock the company's memberships so two owners can't remove each other at once.
    const rows = await client.query<{ id: string; user_id: string; role: CompanyRole; status: "active" | "disabled" }>(
      "select id, user_id, role, status from company_memberships where company_id = $1 order by id for update",
      [actor.companyId],
    );
    const target = rows.rows.find((r) => r.id === membershipId);
    if (!target) return { ok: false, message: "That team member doesn't exist." };
    if (target.user_id === member.userId) return { ok: false, message: "You can't change your own role or access. Ask another owner." };
    const activeOwners = rows.rows.filter((r) => r.role === "owner" && r.status === "active").length;
    const change = apply({ role: target.role, status: target.status, userId: target.user_id, activeOwners });
    if ("ok" in change) return change;
    await client.query(change.sql, [membershipId, actor.companyId, ...change.params]);
    await audit(
      { actorType: "user", actorId: member.userId, companyId: actor.companyId, action: change.action, entity: "company_membership", entityId: membershipId, before: change.before, after: change.after, ip: meta.ip ?? null },
      client,
    );
    return { ok: true };
  });
}

/** Changes a member's role (owners only; never the last active owner). */
export function changeMemberRole(actor: Actor, membershipId: string, role: string, meta: { ip?: string | null } = {}): Promise<MemberChangeResult> {
  if (!(COMPANY_ROLES as readonly string[]).includes(role)) return Promise.resolve({ ok: false, message: "Choose a role." });
  const next = role as CompanyRole;
  return changeMember(actor, membershipId, meta, (target) => {
    if (target.role === next) return { ok: false, message: "That's already their role." };
    if (target.role === "owner" && target.status === "active" && target.activeOwners <= 1) return { ok: false, message: "A company needs at least one active owner." };
    return {
      sql: "update company_memberships set role = $3, can_purchase = $4 where id = $1 and company_id = $2",
      params: [next, purchaseDefault(next)],
      action: "company.member_role_changed",
      before: { role: target.role },
      after: { role: next, can_purchase: purchaseDefault(next) },
    };
  });
}

/** Disables or re-enables a member (owners only). A disabled member loses portal access at once. */
export function setMemberStatus(actor: Actor, membershipId: string, status: "active" | "disabled", meta: { ip?: string | null } = {}): Promise<MemberChangeResult> {
  if (status !== "active" && status !== "disabled") return Promise.resolve({ ok: false, message: "Unknown status." });
  return changeMember(actor, membershipId, meta, (target) => {
    if (target.status === status) return { ok: false, message: status === "disabled" ? "They're already disabled." : "They're already active." };
    if (status === "disabled" && target.role === "owner" && target.activeOwners <= 1) return { ok: false, message: "A company needs at least one active owner." };
    return {
      sql: "update company_memberships set status = $3 where id = $1 and company_id = $2",
      params: [status],
      action: status === "disabled" ? "company.member_disabled" : "company.member_enabled",
      before: { status: target.status },
      after: { status },
    };
  });
}

/** Lets an agent buy requests, or stops them (owners only; owners and managers always can). */
export function setAgentPurchase(actor: Actor, membershipId: string, canPurchase: boolean, meta: { ip?: string | null } = {}): Promise<MemberChangeResult> {
  return changeMember(actor, membershipId, meta, (target) => {
    if (target.role !== "agent") return { ok: false, message: "Only an agent's purchase permission can be changed." };
    return {
      sql: "update company_memberships set can_purchase = $3 where id = $1 and company_id = $2",
      params: [canPurchase],
      action: "company.member_purchase_changed",
      before: null,
      after: { can_purchase: canPurchase },
    };
  });
}
