import Link from "next/link";
import { ApplyCta, ForMoversNav } from "@/components/site/for-movers";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";

const URL = "/for-movers/eligibility/";
const TITLE = "Who Can Join: Eligibility for Movers | American Moving Choice";
const DESCRIPTION =
  "Movers only: USDOT and MC numbers, active household-goods carrier authority, no broker authority, required insurance and our movers-only terms. See every check.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function EligibilityPage() {
  return (
    <PageFrame
      url={URL}
      h1="Who can join our network"
      description={DESCRIPTION}
      trail={[
        { label: "For movers", href: "/for-movers/" },
        { label: "Eligibility", href: URL },
      ]}
      overline="For moving companies"
      lede="American Moving Choice works only with moving carriers: companies that physically do the move and are responsible for it. These are our network rules, not a statement of what the law requires of every moving business."
      waitingOn="The owner decides the MC-number rule for local movers and insurance minimums; counsel drafts the mover agreement."
    >
      <ForMoversNav current={URL} />

      <h2>Requirements</h2>
      <ol>
        <li>
          <strong>USDOT and MC numbers.</strong> Many in-state-only local movers legitimately hold no MC number, and FMCSA has said it plans to stop
          assigning them, so this rule is a setting we can change. <Note kind="owner">the MC requirement versus a state-licensed local-mover track (mover verification §9 decision 1)</Note>
        </li>
        <li>
          <strong>Active household-goods carrier authority</strong> for the services you offer (federal authority for interstate moves), plus the state
          credentials your in-state work needs, such as a California Cal-T permit, a Texas TxDMV number, Florida FDACS registration or New York NYSDOT
          authority. <Note kind="verify">state credential names from compliance facts §1</Note>
        </li>
        <li>
          <strong>No broker authority</strong> on any docket linked to your USDOT number. A company that holds both carrier and broker authority
          can&apos;t join, even if its carrier authority is active.
        </li>
        <li>
          <strong>The required insurance</strong>: the federal filings your authority needs, plus the certificate of insurance our policy asks for.{" "}
          <Note kind="owner">insurance minimums beyond federal filings (mover verification §9 decision 3)</Note>
        </li>
        <li>
          <strong>Our movers-only terms</strong>: no reselling or sharing of leads, no handing a customer&apos;s move to another business, and the carrier
          that quotes a move is the carrier that does it. <Link href="/mover-terms/">Mover terms (summary)</Link>
        </li>
      </ol>

      <h2>What you&apos;ll need to apply</h2>
      <ul>
        <li>Legal business name and any trade names (DBAs)</li>
        <li>A physical business address (not a PO box)</li>
        <li>An authorized representative with the authority to bind the company: name, title, email and mobile number</li>
        <li>USDOT number and MC or docket numbers</li>
        <li>Services, move types and the areas you serve</li>
        <li>State credentials by state, and insurance certificates with expiry dates</li>
      </ul>

      <h2>The checks we run</h2>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Verification checks">
        <table>
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">To pass</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>USDOT record</td>
              <td>Exists, active and not out of service</td>
            </tr>
            <tr>
              <td>Identity</td>
              <td>Legal name, trade name and physical address match your application</td>
            </tr>
            <tr>
              <td>Authority type and status</td>
              <td>Active carrier authority with household-goods scope where you offer interstate moves; no broker authority on any linked docket</td>
            </tr>
            <tr>
              <td>Insurance filings</td>
              <td>The required filings on file and active</td>
            </tr>
            <tr>
              <td>Recent record changes</td>
              <td>Recent changes to contact details, address or officers get an extra review</td>
            </tr>
            <tr>
              <td>Callback</td>
              <td>We confirm your application by calling the phone number on your official FMCSA record, not the one you gave us</td>
            </tr>
            <tr>
              <td>State credentials and insurance certificate</td>
              <td>Numbers match the state&apos;s records; the certificate names your company and is in date</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>After you&apos;re approved</h2>
      <ul>
        <li>We recheck federal status, authority and insurance every week, and run a full re-verification every year.</li>
        <li>We remind you before an insurance certificate or state credential expires.</li>
        <li>
          If a check fails and can&apos;t be confirmed, buying is paused and your badge comes off until it&apos;s fixed. Leads you already bought stay
          available.
        </li>
      </ul>
      <p>
        Consumers can read the same rules on <Link href="/how-we-verify-movers/">How we verify movers</Link>.
      </p>

      <ApplyCta />
    </PageFrame>
  );
}
