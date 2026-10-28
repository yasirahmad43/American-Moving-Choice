import { env } from "@amc/server/env";
import { CheckCircleIcon, Container, IdCardIcon, InfoIcon, RouteMark } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { Survey } from "@/components/survey/survey";
import { StoredTextLine, type SurveyTexts } from "@/components/survey/texts";
import { PLATFORM_SETTING_DEFAULTS } from "@/lib/content/tokens";
import { mediaById } from "@/lib/media";
import { storedText, storedTextParts } from "@/lib/stored-texts";
import { checkCoverageAction, submitRequestAction } from "./actions";
import { lookupZipAction } from "./zip-action";

const PAGE = "/get-quotes/";

export const metadata: Metadata = {
  title: "Request Quotes From Moving Companies",
  description:
    "Tell us about your move, see which movers in our network serve it, choose how many can contact you, and send your request. Free to use; movers pay us.",
  alternates: { canonical: "/get-quotes/" },
};

// Settings and the active consent text are read per request.
export const dynamic = "force-dynamic";

/**
 * The quote survey (build plan §7.2; VD §13.7): steps in the left column, a reassurance rail on
 * the right. The steps are client state, not URLs (site architecture §2.1), and this route loads
 * no third-party script (site architecture §8.8).
 */
export default function GetQuotesPage() {
  const texts: SurveyTexts = {
    st1a: storedText("ST-1a"),
    st1b: storedTextParts("ST-1b"),
    st2: storedTextParts("ST-2"),
    st4a: storedText("ST-4a"),
    st4b: storedText("ST-4b"),
  };
  // The local-move loop: a sofa through an apartment door, the kind of move the survey starts with.
  const art = mediaById(PAGE, "local-hero-sofa-apartment-door");
  const maxMovers = PLATFORM_SETTING_DEFAULTS.max_sharing_limit;
  return (
    <div className="mesh-light">
      <Container className="grid gap-8 py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-end lg:gap-12">
          <header className="grid max-w-[60ch] gap-3">
            <p className="flex items-center gap-3 type-overline text-text-2">
              <span aria-hidden="true" className="h-px w-8 bg-brand-red" />
              Quote request
            </p>
            <h1 className="type-display-l text-text">Request quotes from movers in our network</h1>
            <p className="text-text-2">Nothing goes to any mover until you send your request at Review and send. Going back a step keeps your answers.</p>
            <p className="type-small text-text-2">
              <StoredTextLine parts={texts.st1b} />
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 type-small text-text-2">
              <li className="inline-flex items-center gap-1.5">
                <IdCardIcon size={16} className="text-brand-navy" /> Movers only
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircleIcon size={16} className="text-brand-navy" /> You choose how many, 1 to {maxMovers}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <InfoIcon size={16} className="text-brand-navy" />{" "}
                <Link href="/which-companies-receive-my-request/" className="link">
                  Who receives my request
                </Link>
              </li>
            </ul>
          </header>
          <div className="zoom-media relative hidden aspect-[16/9] overflow-hidden rounded-card ring-1 ring-border lg:block" aria-hidden="true">
            <MediaFrame asset={art} sizes="(min-width: 1024px) 24rem, 100vw" />
            <p className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-pill bg-surface/90 px-3 py-1 type-small font-semibold text-text">
              <RouteMark size={12} /> Your move, one route
            </p>
          </div>
        </div>
        <div className="bezel">
          <div className="bezel-inner p-5 sm:p-8">
            <Survey texts={texts} checkCoverage={checkCoverageAction} submitRequest={submitRequestAction} lookupZip={lookupZipAction} webUrl={env().WEB_URL} />
            <noscript>
              <p className="text-text">The quote survey needs JavaScript. You can still browse the movers in our directory.</p>
            </noscript>
          </div>
        </div>
      </Container>
    </div>
  );
}
