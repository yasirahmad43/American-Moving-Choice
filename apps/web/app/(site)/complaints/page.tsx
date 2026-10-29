import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";
import { BusinessContactChannels } from "@/components/site/business-details";

const URL = "/complaints/";
const TITLE = "Complaints About a Mover or Broker | American Moving Choice";
const DESCRIPTION =
  "How to complain about a mover or broker: report it to American Moving Choice, to FMCSA's National Consumer Complaint Database or 1-888-368-7238, or to your state.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

const STATE_REGULATORS = [
  { state: "California", body: "Bureau of Household Goods and Services (BHGS), which issues Cal-T household mover permits", href: "https://bhgs.dca.ca.gov/" },
  { state: "Florida", body: "Department of Agriculture and Consumer Services (FDACS), which registers in-state movers and moving brokers", href: "https://www.fdacs.gov/" },
  { state: "New York", body: "Department of Transportation (NYSDOT), which issues in-state household goods authority", href: "https://www.dot.ny.gov/" },
  { state: "Texas", body: "Department of Motor Vehicles (TxDMV), where in-state household goods carriers register", href: "https://www.txdmv.gov/" },
];

export default function ComplaintsPage() {
  return (
    <PageFrame
      url={URL}
      h1="Complaints about a mover or a broker"
      description={DESCRIPTION}
      trail={[{ label: "Complaints", href: URL }]}
      overline="Trust page"
      lede="You can tell us, tell FMCSA, tell your state, or all three. Telling us helps keep a company that breaks our rules out of our network; FMCSA and the states can act against it."
      waitingOn="The owner sets our handling targets, and the regulator details are checked against their primary sources before publication."
    >
      <h2>Tell American Moving Choice</h2>
      <p>
        Use <Link href="/report-a-concern/">Report a concern</Link> if a company you heard from through us acted as a broker, contacted you without
        permission or outside your chosen channels, didn't identify itself, showed credentials that look wrong, or treated you badly. Leave your contact details in the form if you want us to get in touch.
      </p>
      <BusinessContactChannels />
      <ol>
        <li>You get a case reference straight away. Quote it if you write to us about the same problem.</li>
        <li>Someone on our team reviews the report and may contact you if you left contact details.</li>
        <li>
          A report of broker activity or wrong credentials starts a full recheck of the company. If a check fails, we stop the company from buying
          requests while we look into it.{" "}
          <Link href="/how-we-verify-movers/">How we verify movers</Link>
        </li>
        <li>We record what we decided and why. We can&apos;t settle a claim or a price dispute between you and a mover.</li>
      </ol>
      <p>
        <Note kind="owner">a handling target for each case type; no timing promise is made until the owner sets one (mover verification §7)</Note>{" "}
        <Note kind="build">each report creates a case with an assignee and an outcome, and broker or credential reports trigger re-verification (mover verification §3, §7)</Note>
      </p>

      <h2>Problems with your belongings or your bill</h2>
      <p>
        Loss, damage and delivery disputes are between you and the mover. For an interstate move, FMCSA tells consumers to file a written claim with
        the mover within 9 months of delivery, and says movers must offer a neutral dispute settlement program. FMCSA can&apos;t resolve a claim for
        you. <a href="https://www.fmcsa.dot.gov/protect-your-move/what-if-problems">FMCSA: What if there are problems?</a>{" "}
        <Note kind="verify">carrier-vs-broker note B12: 49 U.S.C. 14706 and FMCSA&apos;s claims page, from search excerpts</Note>
      </p>
      <p>
        <Link href="/moving-costs/how-movers-charge/">How movers charge</Link> explains the limits on what a mover can ask you to pay at delivery.
      </p>

      <h2>Complain to FMCSA</h2>
      <p>
        FMCSA, the federal agency that registers interstate movers and brokers, takes complaints through its{" "}
        <a href="https://nccdb.fmcsa.dot.gov/">National Consumer Complaint Database</a> or by phone at 1-888-368-7238 (1-888-DOT-SAFT), 8 a.m. to 8
        p.m. Eastern Time, Monday to Friday. FMCSA uses complaints to decide which companies to investigate; a complaint doesn&apos;t replace legal
        action. <a href="https://www.fmcsa.dot.gov/consumer-protection/complaint-center-faqs">FMCSA: Complaint Center FAQs</a>{" "}
        <Note kind="verify">consumer-moving-rules note C15 (verified excerpt); check that nccdb.fmcsa.dot.gov works before publishing</Note>
      </p>

      <h2>Complain to your state</h2>
      <p>
        In-state moves fall under state rules, and state attorneys general and consumer agencies also pursue moving fraud. Some of the state agencies
        that license movers:
      </p>
      <ul>
        {STATE_REGULATORS.map((item) => (
          <li key={item.state}>
            <strong>{item.state}:</strong> <a href={item.href}>{item.body}</a>
          </li>
        ))}
      </ul>
      <p>
        For other states, contact your state attorney general&apos;s consumer protection office.{" "}
        <Note kind="verify">state regulator names and links from compliance facts §1; confirm each agency&apos;s complaint page before publishing</Note>{" "}
        <Note kind="owner">a full state-by-state list with complaint links (mover verification §7)</Note>
      </p>
    </PageFrame>
  );
}
