import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note, Token } from "@/components/site/review-notes";
import { PUBLIC_ROLE_STATEMENT } from "@/lib/public-copy";

const URL = "/terms/";
const TITLE = "Terms of Use | American Moving Choice";
const DESCRIPTION = "Placeholder terms of use for the American Moving Choice preview: the service's role, your request, and the sections counsel will write.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function TermsPage() {
  return (
    <PageFrame
      url={URL}
      h1="Terms of use"
      description={DESCRIPTION}
      trail={[{ label: "Terms of use", href: URL }]}
      overline="Legal"
      lede="This is a placeholder. Counsel writes the terms of use; the outline below shows what they will cover."
      waitingOn="Counsel writes these terms. Nothing on this page is the agreement itself."
    >
      <p>
        <Note kind="counsel">counsel writes the terms of use. Arbitration, if any, is not bundled into the contact-consent checkbox (consent draft §5)</Note>
      </p>

      <h2>Who you&apos;re agreeing with</h2>
      <p>
        <Token k="org.legal_name" />, <Token k="org.address" />.
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
        <Note kind="counsel">acceptable use, disclaimers, limitation of liability, governing law and dispute resolution</Note>
      </p>

      <h2>Moving companies</h2>
      <p>
        Movers in our network agree to separate terms. <Link href="/mover-terms/">Mover terms (summary)</Link>
      </p>
    </PageFrame>
  );
}
