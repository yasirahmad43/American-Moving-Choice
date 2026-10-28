import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note, Token } from "@/components/site/review-notes";
import { storedText } from "@/lib/stored-texts";

const URL = "/about/";
const TITLE = "About American Moving Choice";

// ST-1c: only the home, About and "How AMC makes money" pages carry it (site architecture §8.2).
export const metadata = pageMetadata(URL, TITLE, storedText("ST-1c"));

export default function AboutPage() {
  return (
    <PageFrame
      url={URL}
      h1="About American Moving Choice"
      description={storedText("ST-1c")}
      trail={[{ label: "About", href: URL }]}
      overline="Trust page"
      lede="What we are, who runs us, and what we don't do."
      waitingOn="The legal entity, owner and address come from the owner, and counsel approves the role statement."
    >
      <h2>What we are</h2>
      <blockquote>
        <p>{storedText("ST-1a")}</p>
      </blockquote>
      <p>
        <Note kind="counsel">the role statement is ST-1a, rendered from its stored record; counsel approves its final wording (content/stored-texts.md)</Note>
      </p>

      <h2>Who runs American Moving Choice</h2>
      <p>
        American Moving Choice is operated by <Token k="org.legal_name" />, owned by <Token k="org.owner" />, at <Token k="org.address" />.
      </p>
      <p>
        <Note kind="owner">the legal entity, its owner and its address, and any ties between our people and movers, brokers or lead buyers, which this page must disclose (site architecture §7.1; implications §11 Q1, Q10)</Note>
      </p>

      <h2>How we work</h2>
      <ul>
        <li>
          We work only with movers: companies with household-goods carrier authority and no broker authority on their FMCSA record.{" "}
          <Link href="/how-we-verify-movers/">How we verify movers</Link>
        </li>
        <li>
          You choose how many movers can receive your details, and you see each one by name before you send.{" "}
          <Link href="/which-companies-receive-my-request/">Which companies receive my request</Link>
        </li>
        <li>
          Movers pay us for the requests they buy; you pay us nothing. <Link href="/advertising-disclosure/">How AMC makes money</Link>
        </li>
        <li>
          Reviews come only from people whose request a mover bought through us. <Link href="/review-methodology/">How reviews work</Link>
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        See <Link href="/contact/">Contact</Link> for how to reach us, or <Link href="/report-a-concern/">report a concern</Link> about a mover or a broker.
      </p>
    </PageFrame>
  );
}
