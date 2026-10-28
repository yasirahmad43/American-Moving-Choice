import Link from "next/link";
import { ApplyCta, ForMoversNav } from "@/components/site/for-movers";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note, Token } from "@/components/site/review-notes";
import { storedTextParts } from "@/lib/stored-texts";

const URL = "/for-movers/";
const TITLE = "Moving Leads for Carriers: Exclusive & Shared | American Moving Choice";
const DESCRIPTION =
  "A movers-only network: household-goods carriers with no broker authority buy move requests from consumers who chose how many movers may contact them.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function ForMoversPage() {
  const moversOnly = storedTextParts("ST-2");
  return (
    <PageFrame
      url={URL}
      h1="Moving leads for household-goods carriers"
      description={DESCRIPTION}
      trail={[{ label: "For movers", href: URL }]}
      overline="For moving companies"
      lede="American Moving Choice is a network for movers only. Consumers tell us about their move, see which movers in our network serve it, and choose how many can contact them. You buy only the requests you want."
      waitingOn="Pricing, credit and claim rules are proposals pending owner approval; counsel drafts the mover agreement."
    >
      <ForMoversNav current={URL} />

      <h2>A network for movers only</h2>
      <blockquote>
        <p>
          {moversOnly.map((part, index) =>
            part.kind === "text" ? <span key={index}>{part.text}</span> : <Link key={index} href="/how-we-verify-movers/">{part.label}</Link>,
          )}
        </p>
      </blockquote>
      <p>
        Brokers and lead resellers can&apos;t join, and no company can buy a ranking, a badge, reviews or a place in our directory.{" "}
        <Link href="/advertising-disclosure/">How AMC makes money</Link> explains what payment never changes.
      </p>

      <h2>What you get</h2>
      <ul>
        <li>A public profile and a listing in our mover directory once you&apos;re approved.</li>
        <li>
          Our screening badge, <Token k="badge.name" />, which every approved mover gets and no mover can buy.
        </li>
        <li>Move requests from consumers in the areas and move types you choose to serve, shown to you before you buy.</li>
        <li>A simple pipeline for the leads you buy, private to your company.</li>
      </ul>

      <h2>How requests reach you</h2>
      <ol>
        <li>A consumer enters their move. We match it against each mover&apos;s coverage and capabilities, using published rules.</li>
        <li>
          The consumer sees the movers that serve the move, chooses the most who may contact them (1 to <Token k="setting.max_movers" />), and can
          remove any mover before sending.
        </li>
        <li>
          Only movers named on the consumer&apos;s Review and send screen can buy the lead. You see a preview without contact details, and you have{" "}
          <Token k="setting.sale_window_hours" /> hours to decide.
        </li>
        <li>When you buy, the contact details appear straight away and the lead lands in your pipeline.</li>
      </ol>
      <p>
        <Link href="/for-movers/moving-leads/">Moving leads</Link> lists the checks every request passes and what a preview shows.
      </p>

      <h2>How pricing works, in brief</h2>
      <ul>
        <li>Your prices are set per company and stay private. No mover sees another&apos;s prices.</li>
        <li>A consumer who chooses 1 creates an exclusive lead: only one mover can buy it, at its exclusive price.</li>
        <li>
          A consumer who chooses 2 or more creates a shared lead. Your price steps down as more movers buy it, and you get the difference back as
          account credit automatically.
        </li>
        <li>Your card is charged when you buy. There are no subscriptions or minimum spends.</li>
      </ul>
      <p>
        <Note kind="owner">pricing policy, factor schedule and maximum are proposals pending owner approval (shared pricing §9)</Note>{" "}
        <Link href="/for-movers/pricing/">Pricing and buying rules</Link> has the full rules and a worked example.
      </p>

      <h2>How we verify you</h2>
      <ol>
        <li>You apply with your USDOT and MC numbers, business details and service areas.</li>
        <li>We check your FMCSA record: active registration, household-goods carrier authority, no broker authority and the required insurance filings.</li>
        <li>We call the phone number on your official record to confirm the application, and check any state credentials.</li>
        <li>Our team reviews the results. Once approved, you can buy leads. We recheck federal records every week.</li>
      </ol>
      <p>
        <Link href="/for-movers/eligibility/">Who can join</Link> lists every requirement.
      </p>

      <ApplyCta />
    </PageFrame>
  );
}
