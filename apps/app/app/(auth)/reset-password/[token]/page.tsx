import { findPasswordResetToken } from "@amc/server/auth";
import { LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await findPasswordResetToken(token);
  if (!valid) {
    return (
      <AuthCard title="This link has expired" description="Reset links work once and expire after 60 minutes. Ask for a new one.">
        <LinkButton href="/forgot-password">Send a new link</LinkButton>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Choose a new password" description="After you save it, every device signed in to this account is signed out.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
