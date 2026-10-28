import { requireMembership } from "@amc/server/auth";
import { listSessions } from "@amc/server/team";
import { AbsoluteDate, Alert, Card, LinkButton, PageHeader, StatusPill } from "@amc/ui";
import type { Metadata } from "next";
import { portalNavItem } from "@/lib/nav/portal";
import { DisableMfaForm, NameForm, PasswordForm, SignOutOthersForm } from "@/components/portal/onboarding/settings-forms";

const item = portalNavItem("/portal/settings");

export const metadata: Metadata = { title: item.label };

/** The signed-in user's own settings: name, password, two-step verification and sessions. */
export default async function SettingsPage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const sessions = await listSessions(user.id, user.session.id);
  const remind = !user.mfaEnabled && membership.role !== "agent";

  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title="Settings" description={`Your sign-in and security for ${user.email}.`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Your name" titleAs="h2">
          <NameForm fullName={user.fullName ?? ""} />
        </Card>

        <Card title="Two-step verification" titleAs="h2" description="A code from an authenticator app at each sign-in, in addition to your password.">
          <div className="grid gap-4">
            <p>
              <StatusPill tone={user.mfaEnabled ? "success" : "neutral"}>{user.mfaEnabled ? "On" : "Off"}</StatusPill>
            </p>
            {user.mfaEnabled ? (
              user.adminRole ? (
                <p className="text-text-2">Admin accounts must keep two-step verification on.</p>
              ) : (
                <details className="rounded-control border border-border">
                  <summary className="flex min-h-11 cursor-pointer items-center px-3 font-semibold text-text">Turn off two-step verification</summary>
                  <div className="p-3">
                    <DisableMfaForm />
                  </div>
                </details>
              )
            ) : (
              <>
                {remind ? (
                  <Alert tone="warning" role="none">
                    Your role can buy requests or manage billing. We recommend turning on two-step verification.
                  </Alert>
                ) : null}
                <div>
                  <LinkButton href="/mfa/setup?next=/portal/settings">Set up two-step verification</LinkButton>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card title="Change password" titleAs="h2">
          <PasswordForm email={user.email} />
        </Card>

        <Card title="Where you're signed in" titleAs="h2" description="Sessions last 30 days from your last visit.">
          <ul className="mb-4 grid gap-2">
            {sessions.map((s) => (
              <li key={s.id} className="rounded-control border border-border p-3">
                <p className="font-semibold text-text">
                  {s.device}
                  {s.current ? <span className="font-normal text-text-3"> (this browser)</span> : null}
                </p>
                <p className="type-small text-text-2">
                  Signed in <AbsoluteDate value={s.createdAt} withTime />; last active <AbsoluteDate value={s.lastSeenAt} withTime />
                </p>
              </li>
            ))}
          </ul>
          <SignOutOthersForm disabled={sessions.length <= 1} />
        </Card>
      </div>
    </div>
  );
}
