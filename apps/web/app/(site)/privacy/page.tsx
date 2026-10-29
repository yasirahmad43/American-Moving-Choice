import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";
import { BusinessIdentity, BusinessContactChannels } from "@/components/site/business-details";
import { REVIEW_NOTES_IN_HTML } from "@/lib/review-mode";

const URL = "/privacy/";
const TITLE = "Privacy Policy | American Moving Choice";
const DESCRIPTION = "How the American Moving Choice preview handles move-request details, contact choices and privacy questions. The final policy is awaiting legal review.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function PrivacyPage() {
  return (
    <PageFrame
      url={URL}
      h1="Privacy policy"
      description={DESCRIPTION}
      trail={[{ label: "Privacy", href: URL }]}
      overline="Legal"
      lede="See what a move request collects, who may receive your details and how to ask a privacy question. This preview explains the current flow; the final privacy policy is awaiting legal review before launch."
      waitingOn="The final privacy policy and required notices await legal review."
    >
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">counsel writes the full privacy policy, including the notice at collection that applicable state privacy laws require (consent draft §5; compliance facts §3)</Note>
      </p> : null}

      <h2>Who we are</h2>
      <p>
        This service is operated by <BusinessIdentity />. For privacy questions, use <Link href="/report-a-concern/">our form</Link> and choose &quot;My personal details&quot;.
      </p>
      <BusinessContactChannels />

      <h2>What a move request collects</h2>
      <ul>
        <li>Move details: where you&apos;re moving from and to, the date, the size of your home and the services you want.</li>
        <li>Contact details: your name, email address and phone number, and how you agree to be contacted.</li>
        <li>
          A record of your consent: the text you saw, the maximum number of movers and contact channels you chose, the eligible-company snapshot, and when you agreed.
        </li>
      </ul>
      <p>
        We ask for contact details only after we&apos;ve checked coverage and shown you the number of eligible movers. Company names aren't shown before contact. Move details stay in your browser
        while you fill in the survey; contact details are never stored in your browser.{" "}
        <Note kind="build">contact details never stored client-side (VD §9.3); no ZIPs, dates or contact details in URLs or analytics (site architecture §8.8)</Note>
      </p>

      <h2>Who receives your details</h2>
      <p>
        Only eligible movers recorded for your request, and no more than the number you chose, can receive your contact details. Each of those
        movers receives only the information needed to respond through your chosen channels. <Link href="/which-companies-receive-my-request/">Which companies receive my request</Link> explains
        each step. Companies identify themselves when they contact you.
      </p>
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">review the count-based contact permission, paid delivery of requests, state privacy disclosures and opt-out wording before real consumer requests are accepted</Note>
      </p> : null}

      <h2>Service providers</h2>
      <p>
        The final policy will identify the providers that process personal details and explain their roles. That disclosure is still under legal review.
        For a question about details you have shared, use <Link href="/report-a-concern/">our privacy form</Link> and choose &quot;My personal details&quot;.
      </p>
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">list the processors that handle personal data (hosting, database, email and text delivery, payments for movers) and what each does</Note>
      </p> : null}

      <h2>How long we keep your details</h2>
      <p>
        Retention periods for move requests, consent records and cases have not yet been finalized in this preview policy. You can ask about a record or request deletion through{" "}
        <Link href="/report-a-concern/">Report a concern</Link>; choose &quot;My personal details&quot;.
      </p>
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">retention periods for requests, consent records and cases</Note>
      </p> : null}

      <h2>Your choices</h2>
      <ul>
        <li>You can withdraw a request from the link on your confirmation page. This stops additional movers from receiving your contact details, and we tell movers that already received them to stop contacting you. It cannot take back details already shared.</li>
        <li>You can reply STOP to any text message from a mover, or ask the mover or us to stop contacting you.</li>
        <li>
          You can ask us about the details we hold about you, or ask us to delete them, through <Link href="/report-a-concern/">Report a concern</Link>{" "}
          (choose &quot;My personal details&quot;).
        </li>
      </ul>
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">state-law rights and how to exercise them, and Global Privacy Control handling (site architecture §8.8)</Note>
      </p> : null}

      <h2>Tracking on quote pages</h2>
      <p>
        The quote survey and its confirmation page load no advertising, retargeting or social-media tags, no chat widgets and no session recording.{" "}
        <Note kind="build">script allowlist per survey step checked in CI (site architecture §8.8)</Note>
      </p>
    </PageFrame>
  );
}
