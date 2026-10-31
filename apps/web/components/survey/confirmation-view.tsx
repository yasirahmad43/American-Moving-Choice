/**
 * Saved-request confirmation: reference code, contact limit, next steps, private management
 * link and concern link. No company identities, delivery claims or timing promises. Used inline after sending
 * and by /get-quotes/confirmation/.
 */
import { CHANNEL_LABELS, MOVE_SIZE_LABELS, type Channel } from "@amc/core/src/survey";
import type { MoveSize } from "@amc/core";
import { Alert, Card, formatAbsoluteDate } from "@amc/ui";
import Link from "next/link";
import type { Ref } from "react";
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
          Request received
        </Heading>
        <p className="type-lede text-text-2">
          Your request is saved. Your reference number is <strong className="tabular text-text">{c.referenceCode}</strong>. Save your private link so you can review or withdraw the request later.
        </p>
        <p className="mt-2"><a href={manageUrl} className="inline-flex min-h-12 w-fit items-center rounded-control bg-brand-navy px-5 py-3 font-semibold text-white no-underline" rel="noreferrer">Manage your saved request</a></p>
      </header>

      {c.joinedReferenceCode ? (
        <Alert tone="info" title="We already had a request from you for this route">
          This request joins your earlier request {c.joinedReferenceCode}. The lowest number of movers you chose applies, and movers that received your
          contact details through the first request count toward it.
        </Alert>
      ) : null}

      <Card contentInset="card" as="section" title="Who can receive your request" titleAs="h2">
        <p className="mb-4 text-text">
          {c.limit === 1
            ? "Only 1 participating moving company may receive your details and contact you."
            : `Up to ${c.limit} participating moving companies may receive your details and contact you.`}{" "}
          Each mover decides whether to respond, so you might hear from fewer.
        </p>
        <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-border pt-4 type-small sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-text">Move</dt>
          <dd className="text-text-2">
            {c.route.originCity}, {c.route.originState} to {c.route.destCity}, {c.route.destState} · {MOVE_SIZE_LABELS[c.moveSize]} ·{" "}
            <span className="tabular">
              {c.moveDateFlexible ? "from " : ""}
              {formatAbsoluteDate(c.moveDate, { month: "long" })}
            </span>
          </dd>
          <dt className="font-semibold text-text">Your contact methods</dt>
          <dd className="text-text-2">{channelList}</dd>
        </dl>
      </Card>

      <section aria-labelledby="next-heading" className="grid gap-3">
        <h2 id="next-heading" className="type-h3 text-text">
          What happens next
        </h2>
        <ol className="grid list-decimal gap-2 pl-6 text-text">
          <li>Keep your reference number and use your private manage link to review your request.</li>
          <li>If a moving company contacts you, it will introduce itself. Ask for its USDOT number and written estimate.</li>
          <li>A reputable mover will offer an in-home or virtual survey before giving a written estimate. You're never obligated to hire anyone.</li>
        </ol>
        <p className="text-text-2">We can't promise when, or whether, any mover will get in touch.</p>
      </section>

      <Card contentInset="card" as="section" title="Changed your mind?" titleAs="h2">
        <p className="text-text">
          You can see your request status and contact preferences, and withdraw it at any time. Withdrawing stops additional companies from receiving your
          contact details. It cannot take back details already shared; contact a company directly if you want it to stop contacting you.
        </p>
        <p className="mt-3">
          <a href={manageUrl} className="link font-semibold" rel="noreferrer">
            Manage your request
          </a>
        </p>
        <p className="mt-2 type-small text-text-2">Save this link before leaving the page. Keep it private: anyone who has it can see and withdraw your request.</p>
      </Card>

      <section aria-labelledby="concern-heading" className="grid gap-2">
        <h2 id="concern-heading" className="type-h4 text-text">
          Unexpected contact about your move?
        </h2>
        <p className="text-text">
          If a company does not identify itself, ignores your contact preferences, or contacts you after you withdraw,{" "}
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
