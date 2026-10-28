import { env } from "@amc/server/env";
import { Container } from "@amc/ui";
import type { Metadata } from "next";
import { Survey } from "@/components/survey/survey";
import { StoredTextLine, type SurveyTexts } from "@/components/survey/texts";
import { storedText, storedTextParts } from "@/lib/stored-texts";
import { checkCoverageAction, submitRequestAction } from "./actions";
import { lookupZipAction } from "./zip-action";

export const metadata: Metadata = {
  title: "Request Quotes From Moving Companies",
  description:
    "Tell us about your move, see which movers in our network serve it, choose how many can contact you, and send your request. Free to use; movers pay us.",
  alternates: { canonical: "/get-quotes/" },
};

// Settings and the active consent text are read per request.
export const dynamic = "force-dynamic";

/**
 * The quote survey (build plan §7.2). The steps are client state, not URLs (site architecture
 * §2.1), and this route loads no third-party script (site architecture §8.8).
 */
export default function GetQuotesPage() {
  const texts: SurveyTexts = {
    st1a: storedText("ST-1a"),
    st1b: storedTextParts("ST-1b"),
    st2: storedTextParts("ST-2"),
    st4a: storedText("ST-4a"),
    st4b: storedText("ST-4b"),
  };
  return (
    <Container className="grid gap-8 py-8 sm:py-12">
      <header className="grid max-w-[60ch] gap-2">
        <h1 className="type-h3 text-text">Request quotes from movers in our network</h1>
        <p className="type-small text-text-2">
          Nothing goes to any mover until you send your request at Review and send. Going back a step keeps your answers.
        </p>
        <p className="type-small text-text-2">
          <StoredTextLine parts={texts.st1b} />
        </p>
      </header>
      <Survey texts={texts} checkCoverage={checkCoverageAction} submitRequest={submitRequestAction} lookupZip={lookupZipAction} webUrl={env().WEB_URL} />
      <noscript>
        <p className="text-text">The quote survey needs JavaScript. You can still browse the movers in our directory.</p>
      </noscript>
    </Container>
  );
}
