import { LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import { AuthCard, AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <AuthShell>
      <AuthCard title="We can't find that page" description="The address may be mistyped, or you may not have access to it.">
        <LinkButton href="/">Go to your dashboard</LinkButton>
      </AuthCard>
    </AuthShell>
  );
}
