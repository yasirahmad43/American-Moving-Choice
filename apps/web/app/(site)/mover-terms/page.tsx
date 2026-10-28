import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";

const URL = "/mover-terms/";
const TITLE = "Mover Terms (Draft Summary) | American Moving Choice";
const DESCRIPTION = "A draft summary of the terms movers agree to before joining American Moving Choice: eligibility, use of requests, conduct, pricing, reviews and data.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

/** The key mover terms from consent draft §11, shown as a draft summary for counsel. */
export default function MoverTermsPage() {
  return (
    <PageFrame
      url={URL}
      h1="Mover terms: draft summary"
      description={DESCRIPTION}
      trail={[{ label: "Mover terms", href: URL }]}
      overline="Legal · For movers"
      lede="A summary of what movers agree to before they can buy requests. It is a draft for counsel, who writes the agreement itself."
      waitingOn="Counsel drafts the mover agreement from this summary (consent draft §11)."
    >
      <p>
        <Note kind="counsel">this summary follows consent draft §11; counsel drafts the agreement and approves any public summary of it</Note>
      </p>
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
