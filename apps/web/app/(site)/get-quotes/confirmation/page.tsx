import { env } from "@amc/server/env";
import { getConfirmationByToken } from "@amc/server/leads";
import { Container, EmptyState, LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ConfirmationView } from "@/components/survey/confirmation-view";
import { CONFIRMATION_COOKIE } from "@/components/survey/cookie";
import { storedText } from "@/lib/stored-texts";

export const metadata: Metadata = {
  title: "Request Sent",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

/**
 * Confirmation after sending (build plan §7.2): the request comes from a short-lived httpOnly
 * cookie set when it was sent, never from a URL parameter. Noindex (site architecture §2.1).
 */
export default async function ConfirmationPage() {
  const token = (await cookies()).get(CONFIRMATION_COOKIE)?.value;
  const confirmation = token ? await getConfirmationByToken(token) : null;
  return (
    <Container size="reading" className="py-8 sm:py-12">
      {confirmation && token ? (
        <ConfirmationView
          confirmation={confirmation}
          manageUrl={`${env().WEB_URL}/my-request/${token}/`}
          texts={{ st1a: storedText("ST-1a"), st4b: storedText("ST-4b") }}
        />
      ) : (
        <div className="grid gap-6">
          <h1 className="type-display-l text-text">Request confirmation</h1>
          <EmptyState
          title="No recent request to show"
          description="This page shows your confirmation for a short time after you send a request. Your confirmation email has your reference number and a link to manage your request."
          action={
            <LinkButton href="/get-quotes/" variant="secondary">
              Start a quote request
            </LinkButton>
          }
          />
        </div>
      )}
    </Container>
  );
}
