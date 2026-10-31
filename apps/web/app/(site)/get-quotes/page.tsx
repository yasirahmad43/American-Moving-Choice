import { env } from "@amc/server/env";
import { CheckCircleIcon, Container, IdCardIcon, InfoIcon } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { socialMetadata } from "@/components/site/social-metadata";
import { StoryNextSteps } from "@/components/site/story-sections";
import { Survey } from "@/components/survey/survey";
import { StoredTextLine, type SurveyTexts } from "@/components/survey/texts";
import { PLATFORM_SETTING_DEFAULTS } from "@/lib/content/tokens";
import { pageMediaPlan } from "@/lib/page-media";
import { PUBLIC_REQUEST_ASSURANCE, PUBLIC_ROLE_STATEMENT, publicMarketingText } from "@/lib/public-copy";
import { storedText, storedTextParts } from "@/lib/stored-texts";
import { checkCoverageAction, submitRequestAction } from "./actions";
import { lookupZipAction } from "./zip-action";
import { AssistantFaq } from "@/components/site/assistant-faq";
import { staticAssistantFaq } from "@/lib/assistant-faq/static";

const PAGE = "/get-quotes/";

export const metadata: Metadata = {
  title: "Request Quotes From Moving Companies",
  description:
    "Tell us about your move, choose how many companies may contact you, and review your request before sending. Free to request.",
  alternates: { canonical: "/get-quotes/" },
  ...socialMetadata(PAGE, "Request Moving Quotes | American Moving Choice", "Tell us about your move, choose your company contact limit, and review before sending. Free to request.", { topic: "survey household route" }),
};

// Settings and the active consent text are read per request.
export const dynamic = "force-dynamic";

/**
 * The full quote survey lives in the hero card. The steps are client state, not URLs
 * (site architecture §2.1), and this route loads
 * no third-party script (site architecture §8.8).
 */
export default function GetQuotesPage() {
  const texts: SurveyTexts = {
    st1a: PUBLIC_ROLE_STATEMENT,
    st1b: [{ kind: "text", text: PUBLIC_REQUEST_ASSURANCE }],
    st2: storedTextParts("ST-2").map(part => part.kind === "text" ? { ...part, text: publicMarketingText(part.text) } : part),
    st4a: storedText("ST-4a"),
    st4b: publicMarketingText(storedText("ST-4b")),
  };
  const plan = pageMediaPlan(PAGE, { topic: "survey household route" });
  const maxMovers = PLATFORM_SETTING_DEFAULTS.max_sharing_limit;
  return <>
    <VideoSurveyHero url={PAGE} className="vsh--quote-request" eyebrow="Quote request" title="Request quotes from movers in our network"
      description="Nothing goes to any mover until you send your request at Review and send. Going back a step keeps your answers."
      survey={<div className="quote-survey-full p-4 sm:p-6" data-content-inset="card">
        <Survey texts={texts} checkCoverage={checkCoverageAction} submitRequest={submitRequestAction} lookupZip={lookupZipAction} webUrl={env().WEB_URL} />
        <noscript><p className="text-text">The quote survey needs JavaScript. Please enable JavaScript to choose your contact preferences and send a request.</p></noscript>
      </div>}>
      <p className="text-sm leading-relaxed"><StoredTextLine parts={texts.st1b} /></p>
      <ul className="grid gap-3 text-sm">
        <li className="flex items-center gap-2"><IdCardIcon size={17} /> Movers only</li>
        <li className="flex items-center gap-2"><CheckCircleIcon size={17} /> You choose how many, 1 to {maxMovers}</li>
        <li className="flex items-center gap-2"><InfoIcon size={17} /><Link href="/which-companies-receive-my-request/" className="inline-flex min-h-11 items-center text-white underline underline-offset-4">Who receives my request</Link></li>
      </ul>
    </VideoSurveyHero>
    <Container><AssistantFaq url={PAGE} items={staticAssistantFaq(PAGE)!} /><StoryNextSteps url={PAGE} images={plan.images} /></Container>
  </>;
}
