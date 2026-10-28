import { createMfaSetup, landingPath, requireSession, safeNextPath } from "@amc/server/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/session";
import { AuthCard } from "@/components/auth-shell";
import { MfaCodeForm } from "../mfa-code-form";

export const metadata: Metadata = { title: "Set up two-step verification" };

/** TOTP enrollment (build plan §6): required for admins at first sign-in, optional for company users. */
export default async function MfaSetupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext, "");
  const user = await requireSession();
  if (user.mfaEnabled) redirect(user.mfa === "ok" ? safeNextPath(next, landingPath(user)) : `/mfa${next ? `?next=${encodeURIComponent(next)}` : ""}`);

  const setup = await createMfaSetup({ id: user.id, email: user.email });
  const groupedSecret = setup.secret.match(/.{1,4}/g)?.join(" ") ?? setup.secret;
  return (
    <AuthCard
      title={"Set up two\u2011step verification"}
      description={
        user.adminRole
          ? "Admin accounts need a second step at every sign-in. Set it up now with an authenticator app."
          : "Add a second step to your sign-in with an authenticator app."
      }
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
      <ol className="grid list-decimal gap-5 pl-5 marker:font-semibold marker:text-text-2">
        <li className="pl-1">
          <p>Open an authenticator app on your phone (for example Google Authenticator, Microsoft Authenticator or 1Password).</p>
        </li>
        <li className="pl-1">
          <p>Scan this QR code, or enter the setup key by hand.</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL generated on the server */}
          <img
            src={setup.qrDataUrl}
            width={200}
            height={200}
            alt="QR code that adds American Moving Choice to an authenticator app"
            className="mt-3 rounded-control border border-border bg-white p-2"
          />
          <p className="mt-3 type-small text-text-2">
            Setup key: <code className="font-mono text-base tracking-wider text-text">{groupedSecret}</code>
          </p>
        </li>
        <li className="pl-1">
          <p className="mb-3">Enter the 6-digit code the app shows.</p>
          <MfaCodeForm mode="setup" next={next} setupToken={setup.setupToken} />
        </li>
      </ol>
    </AuthCard>
  );
}
