import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";
import { BusinessIdentity } from "@/components/site/business-details";
import { PUBLIC_ROLE_STATEMENT } from "@/lib/public-copy";
import { REVIEW_NOTES_IN_HTML } from "@/lib/review-mode";

const URL = "/terms/";
const TITLE = "Terms of Use | American Moving Choice";
const DESCRIPTION = "How American Moving Choice works, your request choices and the responsibilities described in this preview. Final terms are awaiting legal review.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function TermsPage() {
  return (
    <PageFrame
      url={URL}
      h1="Terms of use"
      description={DESCRIPTION}
      trail={[{ label: "Terms of use", href: URL }]}
      overline="Legal"
      lede="Understand the service's role, the choices attached to your request and the separate agreement you make with a mover. These preview terms are awaiting final legal review before launch."
      waitingOn="The final terms of use await legal review."
    >
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">counsel writes the terms of use. Arbitration, if any, is not bundled into the contact-consent checkbox (consent draft §5)</Note>
      </p> : null}

      <h2>Who you&apos;re agreeing with</h2>
      <p>
        <BusinessIdentity />.
      </p>

      <h2>What the service is</h2>
      <blockquote>
        <p>{PUBLIC_ROLE_STATEMENT}</p>
      </blockquote>
      <p>
        Each mover sets its own prices and terms and is responsible for its services. Any agreement for your move is between you and the mover you
        hire. <Note kind="counsel">confirm this sentence and the limits of our responsibility for movers&apos; conduct</Note>
      </p>

      <h2>Your request</h2>
      <ul>
        <li>Give accurate move and contact details, and send requests only for your own move.</li>
        <li>
          Your request goes only to eligible movers recorded for it, up to the number you choose and through the contact channels you select. Company names are introduced during contact. See{" "}
          <Link href="/which-companies-receive-my-request/">Which companies receive my request</Link>.
        </li>
        <li>Using American Moving Choice is free. We never take deposits or payments for your move.</li>
      </ul>

      <h2>Reviews</h2>
      <p>
        Reviews follow our <Link href="/review-methodology/">review methodology</Link>. <Note kind="counsel">content license and conduct rules for reviews</Note>
      </p>

      <h2>Acceptable use, liability and disputes</h2>
      <p>
        The final terms will address acceptable use, liability and dispute handling. Those provisions are not finalized in this preview.
        If you have a question about a request or a problem with a move, use <Link href="/report-a-concern/">Report a concern</Link>.
      </p>
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">acceptable use, disclaimers, limitation of liability, governing law and dispute resolution</Note>
      </p> : null}

    </PageFrame>
  );
}
