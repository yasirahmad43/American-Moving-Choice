/**
 * Platform configuration for super admins and finance (S7 must: settings form, sharing policies,
 * consent text versions, admin users with invitations). Settings go through setSetting, which
 * validates and audits each change; everything else audits here.
 */
import { createHash } from "node:crypto";
import { normalizeEmail, validatePolicy } from "@amc/core";
import { audit } from "../audit/audit";
import { hashPassword, passwordProblem } from "../auth/password";
import { AUTH_RATE_LIMITS, checkRateLimit, rateLimitKey } from "../auth/rate-limit";
import type { AdminRole } from "../auth/sessions";
import { isTokenShaped, newToken, sha256Hex } from "../auth/tokens";
import { getPool, isUniqueViolation, tx, type Queryable } from "../db/pool";
import { env } from "../env/env";
import { REDACTED_LINK, enqueueEmail } from "../outbox/outbox";
import { SETTING_DEFINITIONS, SETTING_KEYS, SettingValidationError, getSettings, setSetting, type SettingKey } from "../settings/settings";
import { AdminError, requireText, type AdminActor } from "./common";

// ================================================================== settings

export interface SettingsUpdateResult {
  changed: SettingKey[];
}

/** Parses one form value into the type a setting's schema expects. */
export function coerceSettingInput(key: SettingKey, raw: string | null): unknown {
  const def = SETTING_DEFINITIONS[key];
  if (typeof def.default === "boolean") return raw === "true" || raw === "on";
  if (typeof def.default === "number") {
    const trimmed = (raw ?? "").trim();
    return trimmed === "" || !/^-?\d+(\.\d+)?$/.test(trimmed) ? Number.NaN : Number(trimmed);
  }
  return (raw ?? "").trim();
}

/**
 * Validates every submitted setting first, then applies the changed ones one by one through
 * setSetting (each validated against the database and audited). Unknown keys are ignored.
 */
export async function updateSettings(actor: AdminActor, form: Partial<Record<string, string | null>>): Promise<SettingsUpdateResult> {
  const current = await getSettings();
  const next = new Map<SettingKey, unknown>();
  const errors: string[] = [];
  for (const key of SETTING_KEYS) {
    if (!(key in form)) continue;
    const value = coerceSettingInput(key, form[key] ?? null);
    const parsed = SETTING_DEFINITIONS[key].schema.safeParse(value);
    if (!parsed.success) {
      errors.push(`${SETTING_DEFINITIONS[key].label}: ${parsed.error.issues[0]?.message ?? "invalid value"}`);
      continue;
    }
    if (JSON.stringify(parsed.data) !== JSON.stringify(current[key])) next.set(key, parsed.data);
  }
  if (errors.length) throw new AdminError(`Check these settings. ${errors.join(". ")}.`, "invalid_settings");
  // Lower the sharing limit before switching to a shorter policy, and switch to a longer policy before raising it.
  const order: SettingKey[] = [...next.keys()].sort((a, b) => {
    const weight = (k: SettingKey) => (k === "max_sharing_limit" ? ((next.get(k) as number) < current.max_sharing_limit ? 0 : 2) : k === "active_policy_version" ? 1 : 3);
    return weight(a) - weight(b);
  });
  const changed: SettingKey[] = [];
  for (const key of order) {
    try {
      await setSetting(key, next.get(key) as never, { userId: actor.userId, ip: actor.ip ?? null });
      changed.push(key);
    } catch (error) {
      if (error instanceof SettingValidationError) {
        const saved = changed.length ? ` Saved before the error: ${changed.map((k) => SETTING_DEFINITIONS[k].label).join(", ")}.` : "";
        throw new AdminError(`${SETTING_DEFINITIONS[key].label}: ${error.reason}.${saved}`, "invalid_settings");
      }
      throw error;
    }
  }
  return { changed };
}

// ================================================================== sharing policies

export async function listSharingPolicies(db: Queryable = getPool()) {
  const found = await db.query<{ version: string; factors_bp: number[]; created_at: Date; groups: number }>(
    `select s.version, s.factors_bp, s.created_at, (select count(*)::int from lead_groups g where g.policy_version = s.version) as groups
     from sharing_policies s order by s.created_at desc`,
  );
  return found.rows;
}

const POLICY_VERSION = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Parses "100, 80, 65" (percent) or "10000, 8000" (basis points) into basis points. */
export function parseFactors(input: string): number[] {
  const parts = input.split(/[\s,]+/).filter(Boolean);
  if (!parts.length) throw new AdminError("Enter the factors, starting with 100.", "invalid_factors");
  const numbers = parts.map((p) => Number(p.replace(/%$/, "")));
  if (numbers.some((n) => !Number.isFinite(n))) throw new AdminError("Factors must be numbers, such as 100, 80, 65.", "invalid_factors");
  const percent = numbers[0] === 100;
  return numbers.map((n) => Math.round(percent ? n * 100 : n));
}

/**
 * Creates a new sharing policy version (sharing policies are never edited: purchases record the
 * version they used). Validated with @amc/core validatePolicy.
 */
export async function createSharingPolicy(actor: AdminActor, input: { version: string; factors: string }): Promise<void> {
  const version = input.version.trim().toLowerCase();
  if (!POLICY_VERSION.test(version) || version.length > 60) throw new AdminError("Use a version name of lowercase letters, numbers and hyphens, such as share-stepdown-v2.", "invalid_version");
  const factorsBp = parseFactors(input.factors);
  if (factorsBp.length > 10) throw new AdminError("A policy covers at most 10 buyers.", "invalid_factors");
  try {
    validatePolicy({ version, factorsBp });
  } catch (error) {
    throw new AdminError(`The factors are not a valid policy: ${(error as Error).message}.`, "invalid_factors");
  }
  try {
    await tx(async (client) => {
      await client.query("insert into sharing_policies (version, factors_bp) values ($1, $2::int[])", [version, factorsBp]);
      await audit({ actorType: "admin", actorId: actor.userId, action: "policy.create", entity: "sharing_policy", entityId: version, after: { factors_bp: factorsBp }, ip: actor.ip ?? null }, client);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AdminError("A policy with that version already exists.", "duplicate");
    throw error;
  }
}

/** Makes a policy version the one new requests use (setSetting checks it fits the sharing limit). */
export async function activateSharingPolicy(actor: AdminActor, version: string): Promise<void> {
  try {
    await setSetting("active_policy_version", version, { userId: actor.userId, ip: actor.ip ?? null });
  } catch (error) {
    if (error instanceof SettingValidationError) throw new AdminError(`Can't activate this policy: ${error.reason}.`, "invalid_policy");
    throw error;
  }
}

// ================================================================== consent text versions

export async function listConsentVersions(db: Queryable = getPool()) {
  const found = await db.query<{ id: string; kind: string; body: string; sha256: string; status: string; effective_from: Date | null; approved_by: string | null; created_at: Date; cited: number }>(
    `select v.id, v.kind, v.body, v.sha256, v.status, v.effective_from, v.approved_by, v.created_at,
            (select count(*)::int from consent_records r where r.consent_text_version_id = v.id) as cited
     from consent_text_versions v order by v.created_at desc`,
  );
  return found.rows;
}

const CONSENT_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function createConsentDraft(actor: AdminActor, input: { id: string; kind: string; body: string }): Promise<void> {
  const id = input.id.trim().toLowerCase();
  if (!CONSENT_ID.test(id) || id.length > 60) throw new AdminError("Use a version ID of lowercase letters, numbers and hyphens, such as consent-v1.", "invalid_id");
  if (input.kind !== "contact_consent" && input.kind !== "terms_privacy_ack") throw new AdminError("Choose the kind of text.");
  const body = input.body.replace(/\r\n/g, "\n").trim();
  if (body.length < 20) throw new AdminError("Enter the full consent text.", "missing_text");
  if (body.length > 5000) throw new AdminError("Keep the text under 5,000 characters.", "too_long");
  if (input.kind === "contact_consent" && !body.includes("{N}")) throw new AdminError("Contact-consent text must include {N}, the number of movers the consumer chose.", "missing_placeholder");
  const sha = createHash("sha256").update(body, "utf8").digest("hex");
  try {
    await tx(async (client) => {
      await client.query("insert into consent_text_versions (id, kind, body, sha256, status) values ($1, $2, $3, $4, 'draft')", [id, input.kind, body, sha]);
      await audit({ actorType: "admin", actorId: actor.userId, action: "consent_text.create_draft", entity: "consent_text_version", entityId: id, after: { kind: input.kind, sha256: sha }, ip: actor.ip ?? null }, client);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AdminError("A consent text with that ID already exists.", "duplicate");
    throw error;
  }
}

/** Marks a draft approved with the approver's name (the counsel sign-off reference). The text is frozen from then on. */
export async function approveConsentVersion(actor: AdminActor, id: string, approverInput: string): Promise<void> {
  const approver = requireText(approverInput, "the approver's name (counsel sign-off)", 200);
  await tx(async (client) => {
    const row = (await client.query<{ status: string }>("select status from consent_text_versions where id = $1 for update", [id])).rows[0];
    if (!row) throw new AdminError("Consent text not found.", "not_found");
    if (row.status !== "draft") throw new AdminError("Only a draft can be approved.", "bad_status");
    await client.query("update consent_text_versions set status = 'approved', approved_by = $2, effective_from = now() where id = $1", [id, approver]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "consent_text.approve", entity: "consent_text_version", entityId: id, before: { status: "draft" }, after: { status: "approved", approved_by: approver }, ip: actor.ip ?? null }, client);
  });
}

export async function retireConsentVersion(actor: AdminActor, id: string): Promise<void> {
  const settings = await getSettings();
  if (settings.active_consent_version === id) throw new AdminError("This text is active. Make another version active first.", "active");
  await tx(async (client) => {
    const row = (await client.query<{ status: string }>("select status from consent_text_versions where id = $1 for update", [id])).rows[0];
    if (!row) throw new AdminError("Consent text not found.", "not_found");
    if (row.status !== "approved") throw new AdminError("Only an approved text can be retired.", "bad_status");
    await client.query("update consent_text_versions set status = 'retired' where id = $1", [id]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "consent_text.retire", entity: "consent_text_version", entityId: id, before: { status: "approved" }, after: { status: "retired" }, ip: actor.ip ?? null }, client);
  });
}

// ================================================================== admin users

export const ADMIN_ROLES: readonly AdminRole[] = ["super_admin", "ops", "verification", "finance", "content_editor", "moderator", "support"];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super admin",
  ops: "Operations",
  verification: "Verification",
  finance: "Finance",
  content_editor: "Content editor",
  moderator: "Moderator",
  support: "Support",
};

export const ADMIN_INVITATION_TTL_SECONDS = 3 * 24 * 60 * 60;

export async function listAdminUsers(db: Queryable = getPool()) {
  const [users, invitations] = await Promise.all([
    db.query<{ user_id: string; email: string; full_name: string | null; admin_role: AdminRole; created_at: Date; mfa_enabled_at: Date | null; last_login_at: Date | null; locked_until: Date | null }>(
      `select a.user_id, u.email, u.full_name, a.admin_role, a.created_at, u.mfa_enabled_at, u.last_login_at, u.locked_until
       from admin_users a join users u on u.id = a.user_id order by a.created_at`,
    ),
    db.query<{ id: string; email: string; admin_role: AdminRole; expires_at: Date; created_at: Date; invited_by_email: string | null }>(
      `select i.id, i.email, i.admin_role, i.expires_at, i.created_at, u.email as invited_by_email
       from admin_invitations i left join users u on u.id = i.invited_by
       where i.accepted_at is null and i.revoked_at is null and i.expires_at > now() order by i.created_at desc`,
    ),
  ]);
  return { users: users.rows, invitations: invitations.rows };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isRole = (value: string): value is AdminRole => (ADMIN_ROLES as readonly string[]).includes(value);

/**
 * Invites an admin by email with a role: a single-use link (3 days) in the outbox. The stored
 * body is redacted and the template is "invitation", so only a super admin can reveal the link in
 * the demo mailbox (outbox/mailbox.ts).
 */
export async function inviteAdmin(actor: AdminActor, input: { email: string; role: string }): Promise<{ invitationId: string; token: string }> {
  const email = normalizeEmail(input.email);
  if (!EMAIL.test(email) || email.length > 254) throw new AdminError("Enter an email address.", "invalid_email");
  if (!isRole(input.role)) throw new AdminError("Choose a role.");
  const role = input.role;
  const token = newToken();
  return tx(async (client) => {
    const existing = await client.query("select 1 from admin_users a join users u on u.id = a.user_id where u.email = $1", [email]);
    if (existing.rowCount) throw new AdminError("That person is already an admin.", "already_admin");
    await client.query("update admin_invitations set revoked_at = now() where email = $1 and accepted_at is null and revoked_at is null", [email]);
    const row = await client.query<{ id: string }>(
      `insert into admin_invitations (email, admin_role, token_hash, invited_by, expires_at)
       values ($1, $2, $3, $4, now() + make_interval(secs => $5)) returning id`,
      [email, role, sha256Hex(token), actor.userId, ADMIN_INVITATION_TTL_SECONDS],
    );
    const invitationId = row.rows[0]!.id;
    const body = (link: string) =>
      [
        `You've been invited to the American Moving Choice admin portal as ${ADMIN_ROLE_LABELS[role].toLowerCase()}.`,
        "",
        `Open this link within ${ADMIN_INVITATION_TTL_SECONDS / 86_400} days to set up your account. It works once:`,
        link,
        "",
        "You'll set up two-step verification with an authenticator app before you can use the admin portal.",
        "If you weren't expecting this, ignore this email.",
      ].join("\n");
    await enqueueEmail(
      {
        to: email,
        template: "invitation",
        subject: "You're invited to the American Moving Choice admin portal",
        bodyText: body(REDACTED_LINK),
        secretBodyText: body(`${env().APP_URL}/admin-invite/${token}`),
        relatedType: "admin_invitation",
        relatedId: invitationId,
      },
      client,
    );
    await audit({ actorType: "admin", actorId: actor.userId, action: "admin_user.invite", entity: "admin_invitation", entityId: invitationId, after: { role }, ip: actor.ip ?? null }, client);
    return { invitationId, token };
  });
}

export async function revokeAdminInvitation(actor: AdminActor, invitationId: string): Promise<void> {
  await tx(async (client) => {
    const updated = await client.query("update admin_invitations set revoked_at = now() where id = $1 and accepted_at is null and revoked_at is null", [invitationId]);
    if (!updated.rowCount) throw new AdminError("That invitation is no longer pending.", "not_pending");
    await audit({ actorType: "admin", actorId: actor.userId, action: "admin_user.invitation_revoke", entity: "admin_invitation", entityId: invitationId, ip: actor.ip ?? null }, client);
  });
}

export interface AdminInvitationDetails {
  id: string;
  email: string;
  role: AdminRole;
  state: "valid" | "expired" | "accepted" | "revoked";
  hasAccount: boolean;
}

export async function getAdminInvitation(token: string, db: Queryable = getPool()): Promise<AdminInvitationDetails | null> {
  if (!isTokenShaped(token)) return null;
  const row = (await db.query<{ id: string; email: string; admin_role: AdminRole; expires_at: Date; accepted_at: Date | null; revoked_at: Date | null; has_account: boolean }>(
    `select i.id, i.email, i.admin_role, i.expires_at, i.accepted_at, i.revoked_at, exists (select 1 from users u where u.email = i.email) as has_account
     from admin_invitations i where i.token_hash = $1`,
    [sha256Hex(token)],
  )).rows[0];
  if (!row) return null;
  const state = row.accepted_at ? "accepted" : row.revoked_at ? "revoked" : row.expires_at.getTime() <= Date.now() ? "expired" : "valid";
  return { id: row.id, email: row.email, role: row.admin_role, state, hasAccount: row.has_account };
}

export type AdminAcceptResult = { ok: true; userId: string } | { ok: false; reason: "invalid" | "expired" | "used" | "account_exists" | "wrong_user" | "weak_password" | "invalid_name" | "rate_limited"; message?: string };

/**
 * Accepts an admin invitation once, as a new account or as the signed-in user whose email it was
 * sent to. The account still has to enroll TOTP before requireAdmin lets it in.
 */
export async function acceptAdminInvitation(
  token: string,
  as: { kind: "new"; fullName: string; password: string } | { kind: "existing"; userId: string },
  ip: string | null = null,
): Promise<AdminAcceptResult> {
  if (!isTokenShaped(token)) return { ok: false, reason: "invalid" };
  let fullName: string | null = null;
  if (as.kind === "new") {
    const problem = passwordProblem(as.password);
    if (problem) return { ok: false, reason: "weak_password", message: problem };
    fullName = as.fullName.trim();
    if (fullName.length < 2 || fullName.length > 120) return { ok: false, reason: "invalid_name" };
  }
  const { limit, windowSeconds } = AUTH_RATE_LIMITS.invitationAcceptPerIp;
  if (!(await checkRateLimit(rateLimitKey("admin-invite:ip", ip ?? "unknown"), limit, windowSeconds)).allowed) return { ok: false, reason: "rate_limited" };
  const preview = await getAdminInvitation(token);
  if (!preview) return { ok: false, reason: "invalid" };
  if (preview.state === "expired") return { ok: false, reason: "expired" };
  if (preview.state !== "valid") return { ok: false, reason: "used" };
  const passwordHash = as.kind === "new" ? await hashPassword(as.password) : null;
  try {
    return await tx(async (client): Promise<AdminAcceptResult> => {
      const inv = (await client.query<{ id: string; email: string; admin_role: AdminRole; invited_by: string | null; expires_at: Date; accepted_at: Date | null; revoked_at: Date | null }>(
        "select id, email, admin_role, invited_by, expires_at, accepted_at, revoked_at from admin_invitations where token_hash = $1 for update",
        [sha256Hex(token)],
      )).rows[0];
      if (!inv) return { ok: false, reason: "invalid" };
      if (inv.accepted_at || inv.revoked_at) return { ok: false, reason: "used" };
      if (inv.expires_at.getTime() <= Date.now()) return { ok: false, reason: "expired" };
      let userId: string;
      if (as.kind === "new") {
        const created = await client.query<{ id: string }>(
          "insert into users (email, password_hash, full_name, email_verified_at) values ($1, $2, $3, now()) on conflict (email) do nothing returning id",
          [inv.email, passwordHash, fullName],
        );
        if (!created.rows[0]) return { ok: false, reason: "account_exists" };
        userId = created.rows[0].id;
      } else {
        const user = await client.query<{ email: string }>("select email from users where id = $1", [as.userId]);
        if (user.rows[0]?.email !== inv.email) return { ok: false, reason: "wrong_user" };
        userId = as.userId;
      }
      await client.query("insert into admin_users (user_id, admin_role, created_by) values ($1, $2, $3) on conflict (user_id) do nothing", [userId, inv.admin_role, inv.invited_by]);
      await client.query("update admin_invitations set accepted_at = now(), accepted_user_id = $2 where id = $1", [inv.id, userId]);
      await audit({ actorType: "user", actorId: userId, action: "admin_user.invitation_accept", entity: "admin_invitation", entityId: inv.id, after: { role: inv.admin_role, new_account: as.kind === "new" }, ip }, client);
      return { ok: true, userId };
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "account_exists" };
    throw error;
  }
}

async function superAdminCount(db: Queryable): Promise<number> {
  const found = await db.query<{ n: number }>("select count(*)::int as n from admin_users where admin_role = 'super_admin'");
  return found.rows[0]?.n ?? 0;
}

/** Changes an admin's role. The last super admin can't be demoted, and nobody changes their own role. */
export async function changeAdminRole(actor: AdminActor, userId: string, roleInput: string): Promise<void> {
  if (!isRole(roleInput)) throw new AdminError("Choose a role.");
  if (userId === actor.userId) throw new AdminError("You can't change your own role. Ask another super admin.", "self");
  await tx(async (client) => {
    await client.query("lock table admin_users in share row exclusive mode");
    const row = (await client.query<{ admin_role: AdminRole }>("select admin_role from admin_users where user_id = $1", [userId])).rows[0];
    if (!row) throw new AdminError("Admin not found.", "not_found");
    if (row.admin_role === "super_admin" && roleInput !== "super_admin" && (await superAdminCount(client)) <= 1) throw new AdminError("There must be at least one super admin.", "last_super_admin");
    await client.query("update admin_users set admin_role = $2 where user_id = $1", [userId, roleInput]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "admin_user.role_change", entity: "admin_user", entityId: userId, before: { role: row.admin_role }, after: { role: roleInput }, ip: actor.ip ?? null }, client);
  });
}

/** Removes admin access (the account stays) and signs the user out everywhere. */
export async function removeAdmin(actor: AdminActor, userId: string, reasonInput: string): Promise<void> {
  const reason = requireText(reasonInput, "the reason for removing access", 500);
  if (userId === actor.userId) throw new AdminError("You can't remove your own access.", "self");
  await tx(async (client) => {
    await client.query("lock table admin_users in share row exclusive mode");
    const row = (await client.query<{ admin_role: AdminRole }>("select admin_role from admin_users where user_id = $1", [userId])).rows[0];
    if (!row) throw new AdminError("Admin not found.", "not_found");
    if (row.admin_role === "super_admin" && (await superAdminCount(client)) <= 1) throw new AdminError("There must be at least one super admin.", "last_super_admin");
    await client.query("delete from admin_users where user_id = $1", [userId]);
    await client.query("update sessions set revoked_at = now() where user_id = $1 and revoked_at is null", [userId]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "admin_user.remove", entity: "admin_user", entityId: userId, before: { role: row.admin_role }, after: { reason }, ip: actor.ip ?? null }, client);
  });
}


