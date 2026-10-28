import { COMPANY_ROLE_LABELS, getSessionUserUnverified, getInvitation } from "@amc/server/auth";
import { AbsoluteDate, LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import { logout } from "@/app/actions/session";
import { AuthCard } from "@/components/auth-shell";
import { AcceptInvitationForm } from "./accept-invitation-form";

export const metadata: Metadata = { title: "Team invitation", referrer: "no-referrer" };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitation(token);

  if (!invitation || invitation.state !== "valid") {
    const copy =
      invitation?.state === "expired"
        ? "This invitation has expired. Ask the person who invited you to send a new one."
        : invitation?.state === "accepted"
          ? "This invitation was already used. Sign in to reach the portal."
          : "This invitation link isn't valid. Ask the person who invited you to send a new one.";
    return (
      <AuthCard title="Invitation unavailable" description={copy}>
        <LinkButton href="/login">Go to sign in</LinkButton>
      </AuthCard>
    );
  }

  const user = await getSessionUserUnverified();
  const role = COMPANY_ROLE_LABELS[invitation.role].toLowerCase();
  const description = (
    <p>
      You&apos;re invited to join <strong className="text-text">{invitation.companyName}</strong> as {role}, using{" "}
      <strong className="text-text">{invitation.email}</strong>. The invitation expires on <AbsoluteDate value={invitation.expiresAt} />.
    </p>
  );

  if (user && user.email !== invitation.email) {
    return (
      <AuthCard title="Join the team" description={description}>
        <p className="mb-4 text-text-2">
          You&apos;re signed in as {user.email}. Sign out, then open the invitation link again to accept it as {invitation.email}.
        </p>
        <form action={logout}>
          <button type="submit" className="link min-h-11">
            Sign out
          </button>
        </form>
      </AuthCard>
    );
  }

  if (!user && invitation.hasAccount) {
    return (
      <AuthCard title="Join the team" description={description}>
        <p className="mb-4 text-text-2">An account already uses this email. Sign in, then you can accept the invitation.</p>
        <LinkButton href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in to accept</LinkButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Join the team" description={description}>
      <AcceptInvitationForm token={token} signedIn={Boolean(user)} />
    </AuthCard>
  );
}
