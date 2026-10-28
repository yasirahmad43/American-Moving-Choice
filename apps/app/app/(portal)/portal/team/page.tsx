import { COMPANY_ROLE_LABELS, requireMembership, type CompanyRole } from "@amc/server/auth";
import { canManageMembers, invitableRoles } from "@amc/server/companies";
import { getTeam } from "@amc/server/team";
import { AbsoluteDate, Card, PageHeader, StatusPill, Table } from "@amc/ui";
import type { Metadata } from "next";
import { portalNavItem } from "@/lib/nav/portal";
import { CancelInvitationButton, InviteForm, MemberControls } from "@/components/portal/onboarding/team-forms";

const item = portalNavItem("/portal/team");

export const metadata: Metadata = { title: item.label };

const ROLE_SUMMARIES: Record<CompanyRole, string> = {
  owner: "Everything, including the team, billing and the application.",
  manager: "Requests, CRM, coverage, profile and reviews; views billing; invites agents.",
  agent: "Marketplace and their assigned requests; buys requests only if an owner allows it.",
  billing: "Payment methods, receipts, credits and disputes only.",
};

/** Team members, invitations and roles (data model §2: owners manage the team; managers invite agents). */
export default async function TeamPage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const team = await getTeam({ userId: user.id, companyId: membership.companyId });
  const owner = canManageMembers(team.actorRole);
  const roleOptions = (["owner", "manager", "agent", "billing"] as const).map((r) => ({ value: r, label: COMPANY_ROLE_LABELS[r] }));
  const inviteRoles = invitableRoles(team.actorRole).map((r) => ({ value: r, label: COMPANY_ROLE_LABELS[r] }));

  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title="Team" description={owner ? "Invite teammates, set their roles and turn access off when someone leaves." : "Your teammates. As a manager you can invite agents."} />

      <Card title="Invite a teammate" titleAs="h2" description="We email them a link that works once and expires in 7 days. In this preview the email goes to the demo mailbox.">
        <InviteForm roles={inviteRoles} roleHelp={owner ? "Owners can invite any role." : "Managers can invite agents."} />
      </Card>

      <Card title="Members" titleAs="h2">
        <Table sortable
          caption="Team members"
          hideCaption
          rowKey={(m) => m.membershipId}
          rows={team.members}
          columns={[
            {
              key: "who",
              header: "Member",
              cell: (m) => (
                <div className="grid">
                  <span className="font-semibold text-text">
                    {m.fullName ?? m.email}
                    {m.isSelf ? <span className="font-normal text-text-3"> (you)</span> : null}
                  </span>
                  <span className="type-small break-all text-text-2">{m.email}</span>
                </div>
              ),
            },
            { key: "role", header: "Role", cell: (m) => COMPANY_ROLE_LABELS[m.role] },
            {
              key: "status",
              header: "Access",
              cell: (m) => (
                <div className="grid justify-items-start gap-1">
                  <StatusPill tone={m.status === "active" ? "success" : "neutral"}>{m.status === "active" ? "Active" : "Turned off"}</StatusPill>
                  {m.role === "agent" ? <span className="type-small text-text-2">{m.canPurchase ? "Can buy requests" : "Can't buy requests"}</span> : null}
                  <span className="type-small text-text-3">{m.mfaEnabled ? "Two-step verification on" : "Two-step verification off"}</span>
                </div>
              ),
            },
            { key: "joined", header: "Joined", cell: (m) => <AbsoluteDate value={m.joinedAt} /> },
            ...(owner
              ? [
                  {
                    key: "actions",
                    header: "Manage",
                    cell: (m: (typeof team.members)[number]) =>
                      m.isSelf ? (
                        <span className="type-small text-text-3">Another owner can change your role.</span>
                      ) : (
                        <MemberControls membershipId={m.membershipId} name={m.fullName ?? m.email} role={m.role} status={m.status} canPurchase={m.canPurchase} roles={roleOptions} />
                      ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Card title="Pending invitations" titleAs="h2">
        <Table sortable
          caption="Pending invitations"
          hideCaption
          rowKey={(i) => i.id}
          rows={team.invitations}
          empty={<p className="text-text-2">No pending invitations.</p>}
          columns={[
            { key: "email", header: "Email", cell: (i) => <span className="break-all">{i.email}</span> },
            { key: "role", header: "Role", cell: (i) => COMPANY_ROLE_LABELS[i.role] },
            { key: "by", header: "Invited by", cell: (i) => i.invitedBy ?? "—" },
            { key: "expires", header: "Expires", cell: (i) => <AbsoluteDate value={i.expiresAt} withTime /> },
            {
              key: "actions",
              header: "Manage",
              cell: (i) => (owner || i.role === "agent" ? <CancelInvitationButton invitationId={i.id} email={i.email} /> : <span className="type-small text-text-3">Only an owner can withdraw this.</span>),
            },
          ]}
        />
      </Card>

      <Card title="What each role can do" titleAs="h2">
        <dl className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(ROLE_SUMMARIES) as CompanyRole[]).map((role) => (
            <div key={role}>
              <dt className="font-semibold text-text">{COMPANY_ROLE_LABELS[role]}</dt>
              <dd className="type-small text-text-2">{ROLE_SUMMARIES[role]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
