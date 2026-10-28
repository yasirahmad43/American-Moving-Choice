import { landingPath, requireSession, safeNextPath } from "@amc/server/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/session";
import { AuthCard } from "@/components/auth-shell";
import { MfaCodeForm } from "./mfa-code-form";

export const metadata: Metadata = { title: "Two-step verification" };

/** The second step for a new session (build plan §6). */
export default async function MfaVerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext, "");
  const user = await requireSession();
  if (user.mfa === "setup") redirect(`/mfa/setup${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  if (user.mfa === "ok") redirect(safeNextPath(next, landingPath(user)));

  return (
    <AuthCard
      title={"Two\u2011step verification"}
      description="Enter the code from your authenticator app to finish signing in."
      footer={
        <form action={logout}>
          <p>
            Signed in as <span className="font-semibold text-text">{user.email}</span>.{" "}
            <button type="submit" className="link min-h-11">
              Sign out
            </button>
          </p>
        </form>
      }
    >
      <MfaCodeForm mode="verify" next={next} />
    </AuthCard>
  );
}
