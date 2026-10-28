import { env } from "@amc/server/env";
import { Alert } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AuthCard } from "@/components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ForgotPasswordPage() {
  await connection(); // read the email mode at request time, not build time
  const demoEmail = !env().POSTMARK_SERVER_TOKEN;
  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you sign in with. We'll email a link to choose a new password."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="link">
            Back to sign in
          </Link>
        </p>
      }
    >
      {demoEmail ? (
        <Alert tone="info" role="none" className="mb-5">
          In this preview no email leaves the system. Reset emails appear in the admin mailbox.
        </Alert>
      ) : null}
      <ForgotPasswordForm />
    </AuthCard>
  );
}
