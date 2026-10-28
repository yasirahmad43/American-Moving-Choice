import { getSessionUserUnverified, landingPath, safeNextPath } from "@amc/server/auth";
import { Alert } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

type Search = { next?: string; reset?: string; signed_out?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "");
  const user = await getSessionUserUnverified();
  if (user) redirect(user.mfa === "ok" ? safeNextPath(next, landingPath(user)) : landingPath(user));

  const notice = params.reset ? "Your password was changed. Sign in with the new one." : params.signed_out ? "You've signed out." : null;
  return (
    <AuthCard
      title="Sign in"
      description="For moving companies in the network and American Moving Choice staff."
      footer={
        <p>
          New moving company?{" "}
          <Link href="/signup" className="link">
            Apply to join the network
          </Link>
        </p>
      }
    >
      {notice ? (
        <Alert tone="success" className="mb-5">
          {notice}
        </Alert>
      ) : null}
      <LoginForm next={next} />
    </AuthCard>
  );
}
