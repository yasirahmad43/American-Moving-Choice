/**
 * Team invitations (build plan §6; data model §2). An owner or manager invites by email; the email
 * goes to the outbox with a single-use link that expires after 7 days. Accepting creates the
 * account if needed and the membership. Who may invite whom (owners anyone, managers agents only)
 * is checked by the caller, which knows the inviter's membership.
 */
import { normalizeEmail } from "@amc/core";
import { audit } from "../audit/audit";
import { getPool, isUniqueViolation, tx } from "../db/pool";
import { env } from "../env/env";
import { REDACTED_LINK, enqueueEmail } from "../outbox/outbox";
import { hashPassword, passwordProblem } from "./password";
import { AUTH_RATE_LIMITS, checkRateLimit, rateLimitKey } from "./rate-limit";
import { isTokenShaped, newToken, sha256Hex } from "./tokens";

export const INVITATION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type CompanyRole = "owner" | "manager" | "agent" | "billing";
export const COMPANY_ROLES: readonly CompanyRole[] = ["owner", "manager", "agent", "billing"];

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  owner: "Owner",
  manager: "Manager",
  agent: "Agent",
  billing: "Billing",
};

/** Owners and managers can buy leads by default; agents only when an owner turns it on. */
const canPurchaseByDefault = (role: CompanyRole) => role === "owner" || role === "manager";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

/** Creates an invitation, revoking earlier pending ones for the same email and company. */
export async function createInvitation(input: {
  companyId: string;
  email: string;
  role: CompanyRole;
  invitedBy: string;
  ip?: string | null;
}): Promise<{ invitationId: string; token: string }> {
  const email = normalizeEmail(input.email);
  if (!EMAIL.test(email)) throw new InvitationError("That is not an email address.");
  if (!COMPANY_ROLES.includes(input.role)) throw new InvitationError("Unknown role.");
  const token = newToken();

  return tx(async (client) => {
    const company = await client.query<{ legal_name: string }>("select legal_name from companies where id = $1", [input.companyId]);
    const companyName = company.rows[0]?.legal_name;
    if (!companyName) throw new InvitationError("Company not found.");
    const member = await client.query(
      "select 1 from company_memberships m join users u on u.id = m.user_id where m.company_id = $1 and u.email = $2",
      [input.companyId, email],
    );
    if (member.rowCount) throw new InvitationError("That person is already on this team.");

    await client.query(
      "update invitations set revoked_at = now() where company_id = $1 and email = $2 and accepted_at is null and revoked_at is null",
      [input.companyId, email],
    );
    const inserted = await client.query<{ id: string }>(
      `insert into invitations (company_id, email, role, token_hash, invited_by, expires_at)
       values ($1, $2, $3, $4, $5, now() + make_interval(secs => $6)) returning id`,
      [input.companyId, email, input.role, sha256Hex(token), input.invitedBy, INVITATION_TTL_SECONDS],
    );
    const invitationId = inserted.rows[0]!.id;
    const body = (linkText: string) =>
      [
        `You've been invited to join ${companyName} on the American Moving Choice company portal as ${COMPANY_ROLE_LABELS[input.role].toLowerCase()}.`,
        "",
        `To accept, open this link within ${INVITATION_TTL_SECONDS / 86_400} days. It works once:`,
        linkText,
        "",
        "If you weren't expecting this, ignore this email.",
      ].join("\n");
    await enqueueEmail(
      {
        to: email,
        template: "invitation",
        subject: `You're invited to join ${companyName} on American Moving Choice`,
        // The stored body_text never holds the token; only the encrypted deliverable body does.
        bodyText: body(REDACTED_LINK),
        secretBodyText: body(`${env().APP_URL}/invite/${token}`),
        relatedType: "invitation",
        relatedId: invitationId,
      },
      client,
    );
    await audit(
      {
        actorType: "user",
        actorId: input.invitedBy,
        companyId: input.companyId,
        action: "company.invitation_created",
        entity: "invitation",
        entityId: invitationId,
        after: { role: input.role },
        ip: input.ip ?? null,
      },
      client,
    );
    return { invitationId, token };
  });
}

export interface InvitationDetails {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  role: CompanyRole;
  expiresAt: Date;
  state: "valid" | "expired" | "accepted" | "revoked";
  /** Whether an account already exists for the invited email (sign in instead of creating one). */
  hasAccount: boolean;
}

/** Details for the invitation page. Null for malformed or unknown tokens. */
export async function getInvitation(token: string): Promise<InvitationDetails | null> {
  if (!isTokenShaped(token)) return null;
  const found = await getPool().query<{
    id: string;
    company_id: string;
    legal_name: string;
    email: string;
    role: CompanyRole;
    expires_at: Date;
    accepted_at: Date | null;
    revoked_at: Date | null;
    has_account: boolean;
  }>(
    `select i.id, i.company_id, c.legal_name, i.email, i.role, i.expires_at, i.accepted_at, i.revoked_at,
            exists (select 1 from users u where u.email = i.email) as has_account
     from invitations i join companies c on c.id = i.company_id
     where i.token_hash = $1`,
    [sha256Hex(token)],
  );
  const row = found.rows[0];
  if (!row) return null;
  const state = row.accepted_at ? "accepted" : row.revoked_at ? "revoked" : row.expires_at.getTime() <= Date.now() ? "expired" : "valid";
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.legal_name,
    email: row.email,
    role: row.role,
    expiresAt: row.expires_at,
    state,
    hasAccount: row.has_account,
  };
}

export type AcceptAs = { kind: "new"; fullName: string; password: string } | { kind: "existing"; userId: string };

export type AcceptResult =
  | { ok: true; userId: string; companyId: string; createdUser: boolean }
  | {
      ok: false;
      reason:
        | "invalid_token"
        | "expired"
        | "already_used"
        | "account_exists"
        | "wrong_user"
        | "weak_password"
        | "already_member"
        | "invalid_name"
        | "rate_limited";
      message?: string;
    };

/**
 * Accepts an invitation once: as a new account (name and password) or as the signed-in user.
 * Rate limited per IP, and the invitation is checked before the (deliberately slow) bcrypt hash,
 * then checked again under a row lock inside the transaction.
 */
export async function acceptInvitation(token: string, as: AcceptAs, ip: string | null = null): Promise<AcceptResult> {
  if (!isTokenShaped(token)) return { ok: false, reason: "invalid_token" };
  let fullName: string | null = null;
  if (as.kind === "new") {
    const problem = passwordProblem(as.password);
    if (problem) return { ok: false, reason: "weak_password", message: problem };
    fullName = as.fullName.trim();
    if (fullName.length < 2 || fullName.length > 120) return { ok: false, reason: "invalid_name" };
  }
  const { limit, windowSeconds } = AUTH_RATE_LIMITS.invitationAcceptPerIp;
  if (!(await checkRateLimit(rateLimitKey("invite:ip", ip ?? "unknown"), limit, windowSeconds)).allowed) {
    return { ok: false, reason: "rate_limited" };
  }
  const preview = await getInvitation(token);
  if (!preview) return { ok: false, reason: "invalid_token" };
  if (preview.state === "accepted" || preview.state === "revoked") return { ok: false, reason: "already_used" };
  if (preview.state === "expired") return { ok: false, reason: "expired" };
  const passwordHash = as.kind === "new" ? await hashPassword(as.password) : null;

  try {
    return await tx(async (client): Promise<AcceptResult> => {
      const found = await client.query<{
        id: string;
        company_id: string;
        email: string;
        role: CompanyRole;
        invited_by: string | null;
        expires_at: Date;
        accepted_at: Date | null;
        revoked_at: Date | null;
      }>(
        "select id, company_id, email, role, invited_by, expires_at, accepted_at, revoked_at from invitations where token_hash = $1 for update",
        [sha256Hex(token)],
      );
      const invitation = found.rows[0];
      if (!invitation) return { ok: false, reason: "invalid_token" };
      if (invitation.accepted_at || invitation.revoked_at) return { ok: false, reason: "already_used" };
      if (invitation.expires_at.getTime() <= Date.now()) return { ok: false, reason: "expired" };

      let userId: string;
      if (as.kind === "new") {
        // Accepting an emailed link proves the address, so the account starts verified.
        const created = await client.query<{ id: string }>(
          `insert into users (email, password_hash, full_name, email_verified_at) values ($1, $2, $3, now())
           on conflict (email) do nothing returning id`,
          [invitation.email, passwordHash, fullName],
        );
        if (!created.rows[0]) return { ok: false, reason: "account_exists" };
        userId = created.rows[0].id;
      } else {
        const user = await client.query<{ email: string }>("select email from users where id = $1", [as.userId]);
        if (user.rows[0]?.email !== invitation.email) return { ok: false, reason: "wrong_user" };
        userId = as.userId;
      }

      const membership = await client.query(
        `insert into company_memberships (company_id, user_id, role, status, can_purchase, invited_by)
         values ($1, $2, $3, 'active', $4, $5) on conflict (company_id, user_id) do nothing`,
        [invitation.company_id, userId, invitation.role, canPurchaseByDefault(invitation.role), invitation.invited_by],
      );
      if (!membership.rowCount) return { ok: false, reason: "already_member" };
      await client.query("update invitations set accepted_at = now() where id = $1", [invitation.id]);
      await audit(
        {
          actorType: "user",
          actorId: userId,
          companyId: invitation.company_id,
          action: "company.invitation_accepted",
          entity: "invitation",
          entityId: invitation.id,
          after: { role: invitation.role, new_account: as.kind === "new" },
          ip,
        },
        client,
      );
      return { ok: true, userId, companyId: invitation.company_id, createdUser: as.kind === "new" };
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "account_exists" };
    throw error;
  }
}

/** Revokes a pending invitation. The caller checks that the actor may manage this company's team. */
export async function revokeInvitation(input: { invitationId: string; companyId: string; actorId: string; ip?: string | null }): Promise<boolean> {
  return tx(async (client) => {
    const updated = await client.query(
      "update invitations set revoked_at = now() where id = $1 and company_id = $2 and accepted_at is null and revoked_at is null",
      [input.invitationId, input.companyId],
    );
    if (!updated.rowCount) return false;
    await audit(
      { actorType: "user", actorId: input.actorId, companyId: input.companyId, action: "company.invitation_revoked", entity: "invitation", entityId: input.invitationId, ip: input.ip ?? null },
      client,
    );
    return true;
  });
}
