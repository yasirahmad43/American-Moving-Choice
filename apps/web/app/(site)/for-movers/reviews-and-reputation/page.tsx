import Link from "next/link";
import { ApplyCta, ForMoversNav } from "@/components/site/for-movers";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Token } from "@/components/site/review-notes";

const URL = "/for-movers/reviews-and-reputation/";
const TITLE = "Reviews and Reputation for Movers | American Moving Choice";
const DESCRIPTION =
  "How reviews work for movers on American Moving Choice: we send the invitations, evidence labels show what was checked, and you can respond but never edit or remove.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function ReviewsReputationPage() {
  return (
    <PageFrame
      url={URL}
      h1="Reviews and reputation"
      description={DESCRIPTION}
      trail={[
        { label: "For movers", href: "/for-movers/" },
        { label: "Reviews and reputation", href: URL },
      ]}
      overline="For moving companies"
      lede="Reviews on American Moving Choice come only from consumers whose request a mover bought, and we send every invitation. That keeps reviews fair to you and believable to consumers."
      waitingOn="The owner approves the invitation timing and rating rules; counsel reviews the conduct rules."
    >
      <ForMoversNav current={URL} />

      <h2>Who can review you</h2>
      <p>Only a consumer whose request you bought through us. Each review carries a label that says what we checked:</p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Review evidence labels">
        <table>
          <thead>
            <tr>
              <th scope="col">Label</th>
              <th scope="col">Evidence</th>
              <th scope="col">What it can rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Verified platform inquiry</td>
              <td>The reviewer sent the request you bought</td>
              <td>Your quoting and sales experience</td>
            </tr>
            <tr>
              <td>Verified customer</td>
              <td>Plus a written estimate, order for service or deposit receipt from you, checked by our moderators</td>
              <td>Quoting and booking</td>
            </tr>
            <tr>
              <td>Verified completed move</td>
              <td>Plus a bill of lading, final invoice or delivery receipt, checked by our moderators</td>
              <td>The move itself</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Quote-experience and move-experience ratings are shown separately and never blended. Marking a lead completed in your pipeline isn&apos;t evidence on its own.</p>

      <h2>How invitations are sent</h2>
      <ul>
        <li>
          Once contact has been recorded, eligible consumers can receive a quote-experience invitation, no earlier than <Token k="setting.quote_invite_delay_days" /> days
          after the purchase. A purchase alone doesn't trigger disclosure of your company name.
        </li>
        <li>
          After contact is recorded, you can ask us to invite customers you&apos;ve marked booked or completed to review the move. We send those invitations, log every
          request, and we watch for patterns such as inviting only a small share of booked customers.
        </li>
        <li>Each invitation is a single-use link. There is no open &quot;write a review&quot; form.</li>
      </ul>

      <h2>What you can and can&apos;t do</h2>
      <ul>
        <li>Owner and manager roles can respond to feedback through the portal, truthfully and without sharing the customer's private details.</li>
        <li>You can report a review with a reason. Reports go to our moderators, and both sides can appeal.</li>
        <li>You can&apos;t edit, delete or hide a review. We never reject a review for being negative.</li>
        <li>No incentives tied to a positive review, no review gating and no fake reviews. Breaking these rules can lead to suspension.</li>
      </ul>

      <h2>Ratings</h2>
      <p>
        Quote and moving-experience ratings are calculated separately from eligible records. Public company profiles, company review pages,
        preferred-mover showcases and consumer rating sorts aren't part of this service. Feedback remains part of the portal and moderation workflow.
      </p>

      <h2>What you can&apos;t buy</h2>
      <p>
        No review product, rating boost, award or placement is for sale. Buying more leads brings more invitations, but never changes how ratings are
        calculated or how our team moderates feedback. <Link href="/review-methodology/">Our review methodology</Link> explains the process.
      </p>

      <ApplyCta />
    </PageFrame>
  );
}
