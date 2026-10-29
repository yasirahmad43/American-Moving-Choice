import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";
import { REVIEW_NOTES_IN_HTML } from "@/lib/review-mode";

const URL = "/mover-terms/";
const TITLE = "Moving Company Terms (Preview) | American Moving Choice";
const DESCRIPTION = "A preview summary for moving companies covering eligibility, use of requests, conduct, pricing, reviews and data. The final agreement is awaiting legal review.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

/** The key mover terms from consent draft §11, shown as a draft summary for counsel. */
export default function MoverTermsPage() {
  return (
    <PageFrame
      url={URL}
      h1="Moving company terms: preview summary"
      description={DESCRIPTION}
      trail={[{ label: "Mover terms", href: URL }]}
      overline="Legal · For movers"
      lede="Review the eligibility, contact and conduct rules described for participating moving companies. This summary is a preview; the final mover agreement is awaiting legal review before launch."
      waitingOn="The final mover agreement and this public summary await legal review."
    >
      {REVIEW_NOTES_IN_HTML ? <p>
        <Note kind="counsel">this summary follows consent draft §11; counsel drafts the agreement and approves any public summary of it</Note>
      </p> : null}
      <ol>
        <li>
          <strong>Eligibility.</strong> Movers only. Keep active household-goods carrier authority, USDOT and MC numbers, the required insurance and
          any state credentials; hold no broker authority; tell us promptly of any change.{" "}
          <Note kind="owner">the notice period for credential changes (consent draft §11 item 1)</Note>
        </li>
        <li>
          <strong>Use of requests.</strong> Contact only the consumer, only about the requested move, and only as the consumer agreed. Honor opt-outs
          immediately. No resale, sharing or brokering of a request. The carrier that quotes the move is the carrier that does it.
        </li>
        <li>
          <strong>Conduct.</strong> Follow FMCSA&apos;s consumer-protection rules, including written estimates and the required booklets, and no
          deceptive pricing.
        </li>
        <li>
          <strong>Pricing, credits, quality claims, disputes and suspension.</strong> As published in our{" "}
          <Link href="/for-movers/pricing/">buying rules for movers</Link>.
        </li>
        <li>
          <strong>Reviews.</strong> No review gating, no incentives tied to a positive review, no fake reviews. Responses must be truthful and must not
          disclose a customer&apos;s private information.
        </li>
        <li>
          <strong>Data protection.</strong> Keep consumer data secure, follow retention and deletion obligations, and report breaches.
        </li>
        <li>
          <strong>Audit and enforcement.</strong> We may verify, suspend and remove a mover for violations, with notice and a way to appeal.
        </li>
      </ol>
      <p>
        See <Link href="/for-movers/eligibility/">who can join</Link> and <Link href="/for-movers/">how the network works for movers</Link>.
      </p>
    </PageFrame>
  );
}
