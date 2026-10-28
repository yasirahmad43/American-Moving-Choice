import { getSessionUserUnverified } from "@amc/server/auth";
import { LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/session";
import { AuthCard, AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "No access" };

const REASONS: Record<string, { title: string; body: string }> = {
  "no-company": {
    title: "Your account isn't linked to a company",
    body: "Ask your company's owner to invite you from the Team page, or apply to join the network as a new company.",
  },
  role: {
    title: "Your role doesn't include this page",
    body: "Ask your company's owner or a manager if you need access.",
  },
  "admin-role": {
    title: "Your admin role doesn't include this page",
    body: "Ask a super admin if you need access.",
  },
};

export default async function AccessDenied({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const copy = REASONS[reason ?? ""] ?? REASONS.role!;
  const user = await getSessionUserUnverified();
  return (
    <AuthShell>
      <AuthCard
        title={copy.title}
        description={copy.body}
        footer={
          user ? (
            <form action={logout}>
              <p>
                Signed in as <span className="font-semibold text-text">{user.email}</span>.{" "}
                <button type="submit" className="link min-h-11">
                  Sign out
                </button>
              </p>
            </form>
          ) : null
        }
      >
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/">Go to your dashboard</LinkButton>
          {reason === "no-company" ? (
            <Link href="/signup" className="link inline-flex min-h-12 items-center">
              Apply as a new company
            </Link>
          ) : null}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
