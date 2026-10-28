import { ADMIN_ROLE_LABELS, getAdminInvitation } from "@amc/server/admin";
import { getSessionUserUnverified } from "@amc/server/auth";
import { LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import { logout } from "@/app/actions/session";
import { AuthCard, AuthShell } from "@/components/auth-shell";
import { AcceptAdminInvitationForm } from "./accept-form";

export const metadata: Metadata = { title: "Admin invitation", referrer: "no-referrer" };

/** Accepting an admin invitation link (outside the admin layout: the person isn't an admin yet). */
export default async function AdminInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getAdminInvitation(token);
  if (!invitation || invitation.state !== "valid") {
    const copy =
      invitation?.state === "expired"
        ? "This invitation has expired. Ask a super admin to send a new one."
        : invitation?.state === "accepted"
          ? "This invitation was already used. Sign in to reach the admin portal."
          : "This invitation link isn't valid.";
    return (
      <AuthShell>
        <AuthCard title="Invitation unavailable" description={copy}>
          <LinkButton href="/login">Go to sign in</LinkButton>
        </AuthCard>
      </AuthShell>
    );
  }
  const user = await getSessionUserUnverified();
  const description = (
    <p>
      You&apos;re invited to the American Moving Choice admin portal as <strong className="text-text">{ADMIN_ROLE_LABELS[invitation.role].toLowerCase()}</strong>, using{" "}
      <strong className="text-text">{invitation.email}</strong>. You&apos;ll set up two-step verification next.
    </p>
  );
  let body;
  if (user && user.email !== invitation.email) {
    body = (
      <>
        <p className="mb-4 text-text-2">You&apos;re signed in as {user.email}. Sign out, then open the invitation link again.</p>
        <form action={logout}>
          <button type="submit" className="link min-h-11">
            Sign out
          </button>
        </form>
      </>
    );
  } else if (!user && invitation.hasAccount) {
    body = (
      <>
        <p className="mb-4 text-text-2">An account already uses this email. Sign in, then you can accept the invitation.</p>
        <LinkButton href={`/login?next=${encodeURIComponent(`/admin-invite/${token}`)}`}>Sign in to accept</LinkButton>
      </>
    );
  } else {
    body = <AcceptAdminInvitationForm token={token} signedIn={Boolean(user)} />;
  }
  return (
    <AuthShell>
      <AuthCard title="Join the admin team" description={description}>
        {body}
      </AuthCard>
    </AuthShell>
  );
}
