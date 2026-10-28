import Link from "next/link";
import { ApplyCta, ForMoversNav } from "@/components/site/for-movers";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note, Token } from "@/components/site/review-notes";

const URL = "/for-movers/moving-leads/";
const TITLE = "Moving Leads: How Requests Are Checked | American Moving Choice";
const DESCRIPTION =
  "The checks every move request passes before movers can buy it: bot defense, contact validity, risk signals, plausibility, duplicates and blocklists.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

const CHECKS = [
  { layer: "Bot defense", check: "Invisible challenge, a hidden honeypot field, a minimum completion time and rate limits per IP address and device", fail: "Rejected, or challenged" },
  { layer: "Contact validity", check: "Phone: North American format, line type and disconnected-number checks. Email: syntax, a working mail domain and a disposable-domain list", fail: "The consumer is asked to correct it; rejected after repeated invalid attempts" },
  { layer: "Risk signals", check: "Data-center or VPN addresses, many submissions from one device, mismatched geography, test-like names", fail: "A higher risk score; high scores go to manual review or an optional text-message code" },
  { layer: "Plausibility", check: "Move date in the future and within 12 months; valid ZIP codes; origin and destination differ unless the move is local", fail: "Corrected in the form before sending" },
  { layer: "Duplicates", check: "The same phone or email (compared as keyed hashes) on the same route within the duplicate window", fail: "Joins the original request, which is never sold beyond the consumer's number" },
  { layer: "Blocklists", check: "Known fraud phones, emails and addresses, and consumers who asked not to be contacted", fail: "Rejected" },
];

export default function MovingLeadsPage() {
  return (
    <PageFrame
      url={URL}
      h1="Moving leads: how every request is checked"
      description={DESCRIPTION}
      trail={[
        { label: "For movers", href: "/for-movers/" },
        { label: "Moving leads", href: URL },
      ]}
      overline="For moving companies"
      lede="Each lead comes from a consumer who entered their move, chose how many eligible movers may contact them, and agreed to the contact channels shown. Before any mover can buy it, the request passes the checks below."
      waitingOn="Some checks depend on providers not yet connected in the preview; the owner approves this list."
    >
      <ForMoversNav current={URL} />

      <h2>What makes a lead</h2>
      <ul>
        <li>The consumer saw the number of eligible movers for their route. Individual company names aren't shown before contact.</li>
        <li>
          They chose the most movers who may contact them (1 to <Token k="setting.max_movers" />) and how: calls, texts or email.
        </li>
        <li>They ticked a separate box agreeing to be contacted by eligible movers, within their chosen maximum. We store the request, eligibility snapshot, and what they agreed to.</li>
        <li>
          Only eligible movers recorded for that request can buy the lead, within <Token k="setting.sale_window_hours" /> hours of the request.
        </li>
        <li>When you follow up, introduce your company clearly and use only the consumer's selected contact channels.</li>
      </ul>

      <h2>The checks</h2>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Lead quality checks">
        <table>
          <thead>
            <tr>
              <th scope="col">Layer</th>
              <th scope="col">Check</th>
              <th scope="col">On failure</th>
            </tr>
          </thead>
          <tbody>
            {CHECKS.map((row) => (
              <tr key={row.layer}>
                <th scope="row">{row.layer}</th>
                <td>{row.check}</td>
                <td>{row.fail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Every decision stores its reasons for our team to review. The duplicate window is <Token k="setting.duplicate_window_days" /> days.{" "}
        <Note kind="build">in the preview, bot defense runs as honeypot, minimum time and rate limits; phone line-type and email domain checks need providers (build plan §9)</Note>
      </p>

      <h2>What the preview shows</h2>
      <p>
        Before you buy, you see whether the consumer&apos;s phone and email passed validation, that their consent is stored, and the contact channels
        they chose, along with the move details. You never see contact details before you buy.{" "}
        <Note kind="build">pass flags and channel choice in the preview, with no contact data (implications §9.3)</Note>{" "}
        <Link href="/for-movers/pricing/">Pricing and buying rules</Link> lists every preview field.
      </p>

      <h2>What we don&apos;t claim</h2>
      <p>
        We don&apos;t promise how many leads you&apos;ll see, how many consumers will answer, or how many jobs you&apos;ll book. We&apos;ll publish
        figures like these only once we&apos;ve measured them. If a lead turns out to be invalid, you can make a quality claim under our{" "}
        <Link href="/for-movers/pricing/">buying rules</Link>.
      </p>

      <ApplyCta />
    </PageFrame>
  );
}
