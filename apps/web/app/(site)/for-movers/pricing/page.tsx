import Link from "next/link";
import { ApplyCta, ForMoversNav } from "@/components/site/for-movers";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note, Token } from "@/components/site/review-notes";
import { PLATFORM_SETTING_DEFAULTS } from "@/lib/content/tokens";

const URL = "/for-movers/pricing/";
const TITLE = "Pricing and Buying Rules for Movers | American Moving Choice";
const DESCRIPTION =
  "How movers buy leads on American Moving Choice: preview before purchase, private per-company prices, exclusive and shared leads, step-down credits and quality claims.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

/** Proposed step-down factors, share-stepdown-v1-proposal (build plan §4.1; shared pricing §3). */
const FACTORS = [100, 80, 65, 55, 50];

/** The worked three-buyer example from shared pricing §5 (illustrative prices). */
const EXAMPLE_STEPS = [
  { step: 1, buyer: "Mover A ($40.00 shared price)", charged: "$40.00", credits: "None" },
  { step: 2, buyer: "Mover B ($35.00)", charged: "$28.00 (80%)", credits: "Mover A gets $8.00" },
  { step: 3, buyer: "Mover C ($45.00)", charged: "$29.25 (65%)", credits: "Mover A gets $6.00; Mover B gets $5.25" },
];

const EXAMPLE_TOTALS = [
  { buyer: "Mover A", price: "$40.00", charged: "$40.00", credits: "$14.00", net: "$26.00" },
  { buyer: "Mover B", price: "$35.00", charged: "$28.00", credits: "$5.25", net: "$22.75" },
  { buyer: "Mover C", price: "$45.00", charged: "$29.25", credits: "$0.00", net: "$29.25" },
];

function Proposal() {
  return <Note kind="owner">proposal pending owner approval (shared pricing §9)</Note>;
}

export default function PricingPage() {
  const claimHours = PLATFORM_SETTING_DEFAULTS.claim_window_hours;
  return (
    <PageFrame
      url={URL}
      h1="Pricing and buying rules for movers"
      description={DESCRIPTION}
      trail={[
        { label: "For movers", href: "/for-movers/" },
        { label: "Pricing", href: URL },
      ]}
      overline="For moving companies"
      lede="Everything you need to work out what a lead costs before you sign up. Your own prices stay private; the rules that apply to everyone are here."
      waitingOn="Every figure on this page is a proposal pending owner approval. Counsel drafts the mover agreement these rules go into."
    >
      <ForMoversNav current={URL} />

      <h2>What you see before and after you buy</h2>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="What you see before and after you buy">
        <table>
          <thead>
            <tr>
              <th scope="col">Before you buy (preview)</th>
              <th scope="col">After you buy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                First name; origin and destination city and state; move date; move size; source category (for example Organic Search or Referral);
                when the request was sent; exclusive or shared; how many movers have bought it and the most who can; your price; a summary of the
                credit policy
              </td>
              <td>The consumer&apos;s full name, phone number and email address as they agreed to be contacted, and the lead in your pipeline</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Before purchase you never see a phone number, email address, surname, street address, free-text notes or anything about other buyers. Contact
        details appear only after your payment succeeds.
      </p>

      <h2>How prices are set</h2>
      <ul>
        <li>Each mover has its own exclusive price and its own shared price, set in its account.</li>
        <li>Prices are private. We don&apos;t publish them, and movers never see one another&apos;s prices.</li>
        <li>A purchase keeps the price it was made at, even if your prices change later.</li>
      </ul>
      <p>
        <Note kind="owner">prices per move category (local, in-state long-distance, interstate) and starting price bands (implications §9.1; brief §11 Q6; shared pricing §9 decision 3)</Note>
      </p>

      <h2>The consumer sets the cap</h2>
      <p>
        The survey asks each consumer, &quot;How many moving companies would you like to hear from?&quot; Their answer is the most movers who can buy
        the lead, from 1 to <Token k="setting.max_movers" />. <Proposal />
      </p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Exclusive and shared leads">
        <table>
          <thead>
            <tr>
              <th scope="col">Consumer&apos;s answer</th>
              <th scope="col">Lead type</th>
              <th scope="col">Who can buy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Exclusive</td>
              <td>One mover at most, at its exclusive price. An exclusive lead is never resold.</td>
            </tr>
            <tr>
              <td>
                2 to <Token k="setting.max_movers" />
              </td>
              <td>Shared</td>
              <td>Up to that many movers, each at its own shared price, stepping down as more buy.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The type is fixed when the consumer sends the request. Buyers are counted as companies, so your team members never use extra places. If the same
        consumer sends the request again, it joins the first one and keeps the lowest number they chose.
      </p>

      <h2>Shared leads: the step-down credit schedule</h2>
      <p>
        You pay your shared price if you&apos;re the first buyer. Each time another mover buys the same lead, the price steps down for everyone: the
        new buyer pays the lower percentage, and every earlier buyer gets the difference back as account credit, automatically. In the end every buyer
        pays the same percentage of its own price. <Proposal />
      </p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Step-down schedule">
        <table>
          <thead>
            <tr>
              <th scope="col">Buyers in the end</th>
              {FACTORS.map((_, index) => (
                <th key={index} scope="col">
                  {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Each buyer pays, as a share of its own price</th>
              {FACTORS.map((factor) => (
                <td key={factor}>{factor}%</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Credits are worked out from your own price only, in whole cents, rounded half up. They&apos;re spent automatically on your next purchases
        before your card is charged. <Note kind="owner">credit terms: no transfer, no expiry at launch, and handling on account closure (shared pricing §9 decision 4)</Note>
      </p>

      <h3>Worked example: three buyers</h3>
      <p>Illustrative prices, not recommendations. The consumer chose 3.</p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Worked example: purchases in order">
        <table>
          <caption className="sr-only">Purchases in order</caption>
          <thead>
            <tr>
              <th scope="col">Purchase</th>
              <th scope="col">Buyer</th>
              <th scope="col">Charged</th>
              <th scope="col">Credit to earlier buyers</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_STEPS.map((row) => (
              <tr key={row.step}>
                <td>{row.step}</td>
                <td>{row.buyer}</td>
                <td>{row.charged}</td>
                <td>{row.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Worked example: what each buyer paid">
        <table>
          <caption className="sr-only">What each buyer paid in the end</caption>
          <thead>
            <tr>
              <th scope="col">Buyer</th>
              <th scope="col">Shared price</th>
              <th scope="col">Charged</th>
              <th scope="col">Credit received</th>
              <th scope="col">Net cost (65%)</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_TOTALS.map((row) => (
              <tr key={row.buyer}>
                <td>{row.buyer}</td>
                <td>{row.price}</td>
                <td>{row.charged}</td>
                <td>{row.credits}</td>
                <td>{row.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <Note kind="owner">worked example from shared pricing §5 under the proposed 100 / 80 / 65 / 55 / 50% schedule; the figures change if the schedule changes</Note>
      </p>

      <h2>Lead-quality claims</h2>
      <p>
        If a lead is invalid, you can claim within {claimHours} hours of buying it. <Proposal />
      </p>
      <ul>
        <li>
          <strong>Reasons that qualify:</strong> the phone number is disconnected or not the consumer&apos;s, the email bounces, the consumer says they
          never sent a request, or the details are fake.
        </li>
        <li>
          <strong>Evidence:</strong> for example a call log showing the number is disconnected, or a bounce message.
        </li>
        <li>
          <strong>Reasons that never qualify:</strong> the consumer hasn&apos;t answered yet, chose another mover, decided not to move yet, or found
          your price too high.
        </li>
        <li>
          <strong>If approved:</strong> you get account credit for what you paid for that lead, less any sharing credit you already received. The
          lead isn&apos;t reopened to other buyers.
        </li>
      </ul>
      <p>
        <Note kind="owner">valid reasons, evidence, claim window and claim-rate monitoring (shared pricing §9 decision 5; implications §9.1)</Note>{" "}
        <Note kind="owner">a remedy when a consumer withdraws soon after a purchase (implications §9.1)</Note>
      </p>

      <h2>Payment</h2>
      <ul>
        <li>You save a card and authorize charges for the leads your company buys.</li>
        <li>Your card is charged at the moment you buy, after any account credit is applied. Contact details appear once the payment succeeds.</li>
        <li>If a payment fails, nothing is charged and no contact details are shown.</li>
        <li>No subscriptions, minimum spends or setup fees.</li>
      </ul>
      <p>
        <Note kind="counsel">card authorization wording and the mover agreement&apos;s payment terms (consent draft §9, §11)</Note>
      </p>

      <h2>When buying is suspended</h2>
      <p>We stop a company from buying leads when:</p>
      <ul>
        <li>a recheck of its FMCSA record or insurance fails, or a state credential or insurance certificate expires;</li>
        <li>we find broker activity, such as passing a move to another company;</li>
        <li>we find fraud, such as fake reviews or misuse of consumer details;</li>
        <li>charges go unpaid, or a payment is disputed while we look into it.</li>
      </ul>
      <p>
        Leads you&apos;ve already bought, your pipeline history and your credit balance stay available. You can apply to be reinstated once the cause is
        fixed and rechecked. <Note kind="counsel">suspension, notice and appeal terms in the mover agreement (consent draft §11 item 7)</Note>
      </p>

      <h2>What you can&apos;t buy</h2>
      <p>
        Public company showcases aren't part of the service. No ranking, award, reviews or editorial coverage is for sale, and spending doesn't bypass screening.{" "}
      </p>

      <ApplyCta note="Applying is free, and you can read every rule here before you buy a single lead." />
    </PageFrame>
  );
}
