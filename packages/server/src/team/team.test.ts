import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createUser, resetDatabase, tokenFromMessage } from "../../test/helpers";
import { acceptInvitation, getInvitation } from "../auth/invitations";
import { createSession, readSession } from "../auth/sessions";
import { signupCompany } from "../auth/signup";
import { closePool, getPool } from "../db/pool";
import { PermissionError } from "../companies/permissions";
import { changePassword, describeUserAgent, listSessions, signOutOtherSessions, updateFullName } from "./account";
import { cancelInvitation, changeMemberRole, getTeam, inviteMember, setAgentPurchase, setMemberStatus } from "./team";

const pool = () => getPool();
let companyId: string;
let ownerId: string;
const owner = () => ({ userId: ownerId, companyId });

async function addMember(email: string, role: string): Promise<{ userId: string; membershipId: string }> {
  const userId = await createUser({ email, password: "member password 123" });
  const m = await pool().query<{ id: string }>("insert into company_memberships (company_id, user_id, role) values ($1, $2, $3) returning id", [companyId, userId, role]);
  return { userId, membershipId: m.rows[0]!.id };
}

beforeAll(async () => {
  await resetDatabase();
  ({ userId: ownerId, companyId } = await signupCompany(
    { fullName: "Olive Owner", email: "olive@demo-team.invalid", password: "olive password 1234", legalName: "Demo Team Movers", usdot: "9000060", mc: "MC-9000060", phone: "7375550160" },
    { bcryptCost: 4 },
  ));
});

afterAll(async () => {
  await closePool();
});

describe("team (database)", () => {
  it("an invitation link from the outbox lets a new user join with the invited role", async () => {
    const result = await inviteMember(owner(), { email: "Andy.Agent@Demo-Team.invalid", role: "agent" }, { ip: "203.0.113.7" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const message = await pool().query("select template, to_address, body_text from messages where related_id = $1", [result.invitationId]);
    expect(message.rows[0]).toMatchObject({ template: "invitation", to_address: "andy.agent@demo-team.invalid" });
    expect(message.rows[0].body_text).not.toMatch(/\/invite\/[A-Za-z0-9_-]{43}/);

    const token = await tokenFromMessage("related_id = $1", [result.invitationId], "/invite");
    expect(await getInvitation(token)).toMatchObject({ state: "valid", role: "agent", email: "andy.agent@demo-team.invalid" });
    const accepted = await acceptInvitation(token, { kind: "new", fullName: "Andy Agent", password: "andy password 1234" });
    expect(accepted).toMatchObject({ ok: true, companyId, createdUser: true });
    const membership = await pool().query(
      "select m.role, m.status, m.can_purchase from company_memberships m join users u on u.id = m.user_id where u.email = $1",
      ["andy.agent@demo-team.invalid"],
    );
    expect(membership.rows).toEqual([{ role: "agent", status: "active", can_purchase: false }]);
    // The link works once.
    expect(await acceptInvitation(token, { kind: "new", fullName: "Andy Again", password: "andy password 1234" })).toMatchObject({ ok: false });

    const team = await getTeam(owner());
    expect(team.members.map((m) => [m.email, m.role])).toEqual([
      ["olive@demo-team.invalid", "owner"],
      ["andy.agent@demo-team.invalid", "agent"],
    ]);
    expect(team.members[0]!.isSelf).toBe(true);
  });

  it("managers invite agents only; agents and billing can't manage the team", async () => {
    const manager = await addMember("mia@demo-team.invalid", "manager");
    const asManager = { userId: manager.userId, companyId };
    expect(await inviteMember(asManager, { email: "new.manager@demo-team.invalid", role: "manager" })).toMatchObject({ ok: false, field: "role" });
    const invited = await inviteMember(asManager, { email: "new.agent@demo-team.invalid", role: "agent" });
    expect(invited.ok).toBe(true);
    expect(await inviteMember(owner(), { email: "olive@demo-team.invalid", role: "agent" })).toMatchObject({ ok: false, message: expect.stringMatching(/already on this team/) });
    expect(await inviteMember(owner(), { email: "not-an-email", role: "agent" })).toMatchObject({ ok: false, field: "email" });

    const agent = await addMember("ann@demo-team.invalid", "agent");
    await expect(getTeam({ userId: agent.userId, companyId })).rejects.toBeInstanceOf(PermissionError);
    await expect(inviteMember({ userId: agent.userId, companyId }, { email: "x@demo-team.invalid", role: "agent" })).rejects.toBeInstanceOf(PermissionError);
    await expect(changeMemberRole(asManager, agent.membershipId, "manager")).rejects.toBeInstanceOf(PermissionError);

    // Managers can withdraw agent invitations; an owner's billing invitation is beyond them.
    if (invited.ok) expect(await cancelInvitation(asManager, invited.invitationId)).toBe(true);
    const billing = await inviteMember(owner(), { email: "bill@demo-team.invalid", role: "billing" });
    if (!billing.ok) throw new Error("expected an invitation");
    await expect(cancelInvitation(asManager, billing.invitationId)).rejects.toBeInstanceOf(PermissionError);
    expect(await cancelInvitation(owner(), billing.invitationId)).toBe(true);
  });

  it("owners change roles, disable members and set agent purchasing, with guards", async () => {
    const agent = await addMember("abe@demo-team.invalid", "agent");
    expect(await setAgentPurchase(owner(), agent.membershipId, true)).toEqual({ ok: true });
    expect(await changeMemberRole(owner(), agent.membershipId, "manager")).toEqual({ ok: true });
    const row = (await pool().query("select role, can_purchase from company_memberships where id = $1", [agent.membershipId])).rows[0];
    expect(row).toEqual({ role: "manager", can_purchase: true });
    expect(await setAgentPurchase(owner(), agent.membershipId, false)).toMatchObject({ ok: false });

    expect(await setMemberStatus(owner(), agent.membershipId, "disabled")).toEqual({ ok: true });
    // A disabled member loses access to the company.
    await expect(getTeam({ userId: agent.userId, companyId })).rejects.toBeInstanceOf(PermissionError);
    expect(await setMemberStatus(owner(), agent.membershipId, "active")).toEqual({ ok: true });

    const self = (await pool().query("select id from company_memberships where user_id = $1", [ownerId])).rows[0].id as string;
    expect(await changeMemberRole(owner(), self, "manager")).toMatchObject({ ok: false, message: expect.stringMatching(/your own/) });

    // Two owners: one can step the other down; a disabled owner can't act any more.
    const second = await addMember("oscar@demo-team.invalid", "owner");
    expect(await changeMemberRole({ userId: second.userId, companyId }, self, "manager")).toEqual({ ok: true });
    await expect(setMemberStatus(owner(), second.membershipId, "disabled")).rejects.toBeInstanceOf(PermissionError);
    expect(await changeMemberRole({ userId: second.userId, companyId }, self, "owner")).toEqual({ ok: true });
    expect(await setMemberStatus(owner(), second.membershipId, "disabled")).toEqual({ ok: true });
    await expect(changeMemberRole({ userId: second.userId, companyId }, self, "manager")).rejects.toBeInstanceOf(PermissionError);
    const audits = await pool().query("select action from audit_log where company_id = $1 and action like 'company.member_%' order by id", [companyId]);
    expect(audits.rows.map((r) => r.action)).toContain("company.member_disabled");
  });
});

describe("account settings (database)", () => {
  it("changes the password after re-authentication and signs out other sessions", async () => {
    const userId = await createUser({ email: "pat@demo-account.invalid", password: "pat old password 1" });
    const a = await createSession(userId, { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0 Safari/537.36" });
    const b = await createSession(userId);
    expect((await listSessions(userId, a.session.id)).map((s) => s.current).sort()).toEqual([false, true]);

    expect(await changePassword({ userId, sessionId: a.session.id, current: "wrong password!!", password: "pat new password 1", confirm: "pat new password 1" })).toMatchObject({
      ok: false,
      field: "current",
    });
    expect(await changePassword({ userId, sessionId: a.session.id, current: "pat old password 1", password: "short", confirm: "short" })).toMatchObject({ ok: false, field: "password" });
    expect(await changePassword({ userId, sessionId: a.session.id, current: "pat old password 1", password: "pat new password 1", confirm: "different one 12" })).toMatchObject({ ok: false, field: "confirm" });
    const changed = await changePassword({ userId, sessionId: a.session.id, current: "pat old password 1", password: "pat new password 1", confirm: "pat new password 1" });
    expect(changed).toEqual({ ok: true, otherSessionsSignedOut: 1 });
    expect(await readSession(a.token)).not.toBeNull();
    expect(await readSession(b.token)).toBeNull();

    await createSession(userId);
    expect(await signOutOtherSessions(userId, a.session.id)).toBe(1);
    expect(await updateFullName(userId, " Pat Demo ")).toEqual({ ok: true });
    expect((await pool().query("select full_name from users where id = $1", [userId])).rows[0].full_name).toBe("Pat Demo");
    expect(await updateFullName(userId, "P")).toMatchObject({ ok: false });
    expect(describeUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0 Safari/537.36")).toBe("Chrome on macOS");
  });
});
