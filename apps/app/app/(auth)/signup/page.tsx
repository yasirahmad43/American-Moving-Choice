import { getSessionUserUnverified, landingPath } from "@amc/server/auth";
import { getRequireMcNumber } from "@amc/server/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Apply to join the network" };

/** Company application, step 1 (build plan §11 F): the account, the company and its numbers. */
export default async function SignupPage() {
  const user = await getSessionUserUnverified();
  if (user) redirect(landingPath(user));
  const requireMc = await getRequireMcNumber();
  return (
    <AuthCard
      title="Apply to join the network"
      description={
        <>
          <p>Step 1 of the application: your account and your company&apos;s federal numbers.</p>
          <p className="mt-2 type-small">
            The network accepts moving carriers only. Companies with broker authority, including dual carrier and broker registrations,
            can&apos;t join.
          </p>
        </>
      }
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="link">
            Sign in
          </Link>
        </p>
      }
    >
      <SignupForm requireMc={requireMc} />
    </AuthCard>
  );
}
