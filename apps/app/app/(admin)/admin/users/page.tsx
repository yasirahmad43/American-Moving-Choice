import { ADMIN_ROLES, ADMIN_ROLE_LABELS, listAdminUsers } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { Card, Field, Input, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { Status, When } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { changeRoleAction, inviteAdminAction, removeAdminAction, revokeInvitationAction } from "./actions";

const item = adminNavItem("/admin/users");

export const metadata: Metadata = { title: `${item.label} · Admin` };

export default async function AdminUsersPage() {
  const { user } = await requireAdmin({ roles: item.roles });
  const { users, invitations } = await listAdminUsers();
  return (
    <div className="grid gap-8">
      <PageHeader size="portal" title={item.label} description="Every admin must set up two-step verification at first sign-in and pass it on each new session." />
      <Table
        caption="Admins"
        rowKey={(u) => u.user_id}
        rows={users}
        columns={[
          { key: "email", header: "Email", cell: (u) => <span className="grid"><span className="font-semibold">{u.email}</span><span className="type-small text-text-2">{u.full_name}</span></span> },
          { key: "role", header: "Role", cell: (u) => ADMIN_ROLE_LABELS[u.admin_role] },
          { key: "mfa", header: "Two-step", cell: (u) => (u.mfa_enabled_at ? <Status value="approved" label="Set up" /> : <Status value="pending" label="Not set up" />) },
          { key: "login", header: "Last sign-in", cell: (u) => <When value={u.last_login_at} /> },
          {
            key: "manage",
            header: "Manage",
            cell: (u) =>
              u.user_id === user.id ? (
                <span className="type-small text-text-2">You</span>
              ) : (
                <div className="grid gap-4">
                  <ActionForm action={changeRoleAction} submitLabel="Change role" submitVariant="secondary" resetOnSuccess={false} inline>
                    <input type="hidden" name="userId" value={u.user_id} />
                    <Field id={`role-${u.user_id}`} label="Role">
                      <Select name="role" defaultValue={u.admin_role}>
                        {ADMIN_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ADMIN_ROLE_LABELS[r]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </ActionForm>
                  <details>
                    <summary className="min-h-11 cursor-pointer py-2 type-small font-semibold text-link">Remove access</summary>
                    <ActionForm action={removeAdminAction} submitLabel="Remove access" submitVariant="danger" confirm={{ title: `Remove ${u.email}?`, description: "They lose admin access and are signed out everywhere. Their account stays.", confirmLabel: "Remove" }}>
                      <input type="hidden" name="userId" value={u.user_id} />
                      <Field id={`remove-reason-${u.user_id}`} label="Reason" required>
                        <Textarea name="reason" rows={2} required minLength={3} maxLength={500} />
                      </Field>
                    </ActionForm>
                  </details>
                </div>
              ),
          },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Invite an admin" titleAs="h2" description="Sends a single-use link that expires in 3 days. In demo mode the link appears in the mailbox for super admins only.">
          <ActionForm action={inviteAdminAction} submitLabel="Send invitation">
            <Field id="invite-email" label="Email" required>
              <Input name="email" type="email" required maxLength={254} autoComplete="off" />
            </Field>
            <Field id="invite-role" label="Role" required>
              <Select name="role" required defaultValue="">
                <option value="" disabled>
                  Choose a role
                </option>
                {ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ADMIN_ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
          </ActionForm>
        </Card>
        <Table
          caption="Pending invitations"
          rowKey={(i) => i.id}
          rows={invitations}
          empty={<p className="text-text-2">No pending invitations.</p>}
          columns={[
            { key: "email", header: "Email", cell: (i) => i.email },
            { key: "role", header: "Role", cell: (i) => ADMIN_ROLE_LABELS[i.admin_role] },
            { key: "expires", header: "Expires", cell: (i) => <When value={i.expires_at} /> },
            {
              key: "revoke",
              header: "Revoke",
              cell: (i) => (
                <ActionForm action={revokeInvitationAction} submitLabel="Revoke" submitVariant="secondary" confirm={{ title: `Revoke the invitation for ${i.email}?`, description: "The link stops working.", confirmLabel: "Revoke" }}>
                  <input type="hidden" name="invitationId" value={i.id} />
                </ActionForm>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
