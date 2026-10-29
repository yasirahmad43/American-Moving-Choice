import { env } from "@amc/server/env";
import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";
import { BusinessContactChannels } from "@/components/site/business-details";

const URL = "/contact/";
const TITLE = "Contact American Moving Choice";
const DESCRIPTION = "Get help with an American Moving Choice request, report a concern, ask about your personal details, or send an editorial correction.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function ContactPage() {
  const { APP_URL } = env();
  return (
    <PageFrame
      url={URL}
      h1="Contact us"
      description={DESCRIPTION}
      trail={[{ label: "Contact", href: URL }]}
      overline="Help"
      lede="We're an online service, not a moving company, so we can't change a mover's quote or schedule. We can help with your request, your details and our network."
      waitingOn="The support email, phone and hours come from the owner."
    >
      <h2>Questions about your request</h2>
      <p>Use <Link href="/report-a-concern/">our contact and concern form</Link>. Choose &quot;Something else&quot; for a question about your request, or &quot;My personal details&quot; for a privacy request. Leave an email address or phone number if you want a reply.</p>
      <BusinessContactChannels />
      <p>
        If you have your request reference (it starts with AMC-), include it so we can find your request. Please don&apos;t send card numbers or
        other payment details: we never take payment for your move.
      </p>
      <p>
        <Note kind="owner">support hours and a response-time target; no timing promise is made until the owner sets one (brief §11 Q1)</Note>
      </p>

      <h2>Report a mover or a broker</h2>
      <p>
        If a company acted as a broker, contacted you without permission or outside your chosen channels, didn't identify itself, or treated you badly, use{" "}
        <Link href="/report-a-concern/">Report a concern</Link>. You&apos;ll get a case reference. <Link href="/complaints/">Complaints</Link> explains what
        happens next and how to complain to FMCSA or your state.
      </p>

      <h2>Corrections to our pages</h2>
      <p>
        Found a mistake on one of our pages? Use <Link href="/report-a-concern/">our form</Link>, choose &quot;Something else&quot;, and include the page link, the correction and a source if you have one. Our <Link href="/editorial-policy/">editorial policy</Link>{" "}
        explains how we handle corrections.
      </p>
      <BusinessContactChannels editorial />

      <h2>Moving companies</h2>
      <p>
        Movers in our network can sign in at <a href={`${APP_URL}/login`}>company sign-in</a>. To join, start at{" "}
        <Link href="/for-movers/">For movers</Link>.
      </p>
    </PageFrame>
  );
}
