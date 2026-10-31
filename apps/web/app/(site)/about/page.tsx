import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";
import { BusinessIdentity } from "@/components/site/business-details";
import { PUBLIC_ROLE_STATEMENT } from "@/lib/public-copy";

const URL = "/about/";
const TITLE = "About American Moving Choice";

// ST-1c: only the home, About and "How AMC makes money" pages carry it (site architecture §8.2).
export const metadata = pageMetadata(URL, TITLE, "Moving guidance, clear contact preferences and independent moving companies. Learn how American Moving Choice works.");

export default function AboutPage() {
  return (
    <PageFrame
      url={URL}
      h1="About American Moving Choice"
      description="Moving guidance, clear contact preferences and independent moving companies."
      trail={[{ label: "About", href: URL }]}
      overline="Trust page"
      lede="What we are, who runs us, and what we don't do."
      waitingOn="The legal entity, owner and address come from the owner, and counsel approves the role statement."
    >
      <h2>What we are</h2>
      <blockquote>
        <p>{PUBLIC_ROLE_STATEMENT}</p>
      </blockquote>
      <p>
        <Note kind="counsel">the role statement is ST-1a, rendered from its stored record; counsel approves its final wording (content/stored-texts.md)</Note>
      </p>

      <h2>Who runs American Moving Choice</h2>
      <p>
        This online moving guide and quote-request service is operated by <BusinessIdentity />.
      </p>
      <p>
        <Note kind="owner">the legal entity, its owner and its address, and any ties between our people and movers, brokers or lead buyers, which this page must disclose (site architecture §7.1; implications §11 Q1, Q10)</Note>
      </p>

      <h2>How we work</h2>
      <ul>
        <li>
          Our participation policy is for moving carriers with household-goods carrier authority and no broker authority. Learn what those credentials mean and how to check a company's current official record.{" "}
          <Link href="/how-we-verify-movers/">How we verify movers</Link>
        </li>
        <li>
          You choose the maximum number of participating companies that may receive your details for calls and email about your move. Companies introduce themselves when they contact you.{" "}
          <Link href="/which-companies-receive-my-request/">Which companies receive my request</Link>
        </li>
        <li>
          Requesting quotes is free. Add your contact details, choose your company limit, then review and send.
        </li>
        <li>
          Review invitations are linked to recorded requests and company contact. <Link href="/review-methodology/">How reviews work</Link>
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        See <Link href="/contact/">Contact</Link> for how to reach us, or <Link href="/report-a-concern/">report a concern</Link> about a mover or a broker.
      </p>
    </PageFrame>
  );
}
