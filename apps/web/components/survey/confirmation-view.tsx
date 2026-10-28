/**
 * Confirmation (step 9; build plan §7.2; implications §2.5; consent draft §6 without
 * {typical_window}, VD §13.8): reference code, the movers named, the maximum, what happens next,
 * the manage link and the report link. No timing promise, no upsells. Used inline after sending
 * and by /get-quotes/confirmation/.
 */
import { CHANNEL_LABELS, MOVE_SIZE_LABELS, type Channel } from "@amc/core/src/survey";
import type { MoveSize } from "@amc/core";
import { Alert, Card, formatAbsoluteDate } from "@amc/ui";
import Link from "next/link";
import type { Ref } from "react";
import { MoverName } from "./mover-name";
import type { SurveyTexts } from "./texts";

export interface ConfirmationData {
  referenceCode: string;
  limit: number;
  movers: { companyId: string; displayName: string; usdotNumber: string | null; profileSlug: string | null; isDemo: boolean }[];
  route: { originCity: string; originState: string; destCity: string; destState: string };
  moveDate: string;
  moveDateFlexible: boolean;
  moveSize: MoveSize;
  channels: Channel[];
  joinedReferenceCode: string | null;
}

export function ConfirmationView({
  confirmation: c,
  manageUrl,
  texts,
  headingRef,
  headingLevel = "h1",
}: {
  confirmation: ConfirmationData;
  manageUrl: string;
  texts: Pick<SurveyTexts, "st1a" | "st4b">;
  headingRef?: Ref<HTMLHeadingElement>;
  /** h2 inline under the survey page's H1; h1 on the confirmation page. */
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  const channelList = c.channels.map((ch) => CHANNEL_LABELS[ch].toLowerCase()).join(", ");
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="type-overline text-text-2">Confirmation</p>
        <Heading ref={headingRef} tabIndex={-1} className="type-display-l text-text focus:outline-none">
          Request sent
        </Heading>
        <p className="type-lede text-text-2">
          Your reference number is <strong className="tabular text-text">{c.referenceCode}</strong>. We're sending a copy to your email address.
        </p>
      </header>

      {c.joinedReferenceCode ? (
        <Alert tone="info" title="We already had a request from you for this route">
          This request joins your earlier request {c.joinedReferenceCode}. The lowest number of movers you chose applies, and movers that bought your
          first request count toward it.
        </Alert>
      ) : null}

      <Card as="section" title="Who can receive your request" titleAs="h2">
        <p className="mb-4 text-text">
          {c.limit === 1
            ? "Only 1 mover from this list can buy your request and get your contact details."
            : `Up to ${c.limit} movers from this list can buy your request and get your contact details.`}{" "}
          A mover may decide not to buy it or not to quote, so you might hear from fewer.
        </p>
        <ol className="grid gap-4">
          {c.movers.map((m) => (
            <li key={m.companyId} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              <MoverName {...m} />
            </li>
          ))}
        </ol>
        <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-border pt-4 type-small sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-text">Move</dt>
          <dd className="text-text-2">
            {c.route.originCity}, {c.route.originState} to {c.route.destCity}, {c.route.destState} · {MOVE_SIZE_LABELS[c.moveSize]} ·{" "}
            <span className="tabular">
              {c.moveDateFlexible ? "from " : ""}
              {formatAbsoluteDate(c.moveDate, { month: "long" })}
            </span>
          </dd>
          <dt className="font-semibold text-text">Movers may contact you by</dt>
          <dd className="text-text-2">{channelList}</dd>
        </dl>
      </Card>

      <section aria-labelledby="next-heading" className="grid gap-3">
        <h2 id="next-heading" className="type-h3 text-text">
          What happens next
        </h2>
        <ol className="grid list-decimal gap-2 pl-6 text-text">
          <li>Movers named above can buy your request. When one does, we email you its name, its USDOT number and a link to its profile.</li>
          <li>Movers that buy it contact you directly, only in the ways you chose. They'll ask about your inventory and access.</li>
          <li>A reputable mover will offer an in-home or virtual survey before giving a written estimate. You're never obligated to hire anyone.</li>
        </ol>
        <p className="text-text-2">We can't promise when, or whether, any mover buys your request or gets in touch.</p>
      </section>

      <Card as="section" title="Changed your mind?" titleAs="h2">
        <p className="text-text">
          You can see your request, which movers have bought it, and withdraw it at any time. Withdrawing stops any new mover from buying it, and we tell
          movers that already bought it to stop contacting you.
        </p>
        <p className="mt-3">
          <a href={manageUrl} className="link font-semibold" rel="noreferrer">
            Manage your request
          </a>
        </p>
        <p className="mt-2 type-small text-text-2">Keep this link private: anyone who has it can see and withdraw your request. It's also in your email.</p>
      </Card>

      <section aria-labelledby="concern-heading" className="grid gap-2">
        <h2 id="concern-heading" className="type-h4 text-text">
          Contact from a company you weren't told about?
        </h2>
        <p className="text-text">
          Only the movers named above can buy your request. If another company contacts you about it,{" "}
          <Link href="/report-a-concern/" className="link">
            report a concern
          </Link>
          .
        </p>
      </section>

      <div className="grid gap-3 border-t border-border pt-5 type-small text-text-2">
        <p>{texts.st4b}</p>
        <p>{texts.st1a}</p>
      </div>
    </div>
  );
}
