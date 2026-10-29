/**
 * Email copy for lead intake (outbox templates). Consumer emails say "request", never "lead", and
 * never "your mover" (content/README.md §4, §5). Mover notices carry only preview fields (lead
 * lifecycle §5): no contact details, no ZIP codes. Links that carry the manage token are passed as
 * the secret body so the admin mailbox shows a redacted copy (outbox.ts).
 */
import { MOVE_SIZE_LABELS } from "@amc/core/src/survey";
import type { MoveSize } from "@amc/core";
import { REDACTED_LINK } from "../outbox/outbox";

export interface NamedMoverText {
  displayName: string;
  usdotNumber: string | null;
}

export interface RouteText {
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
}

export const routeLine = (r: RouteText) => `${r.originCity}, ${r.originState} to ${r.destCity}, ${r.destState}`;

/** "November 14, 2026" for a YYYY-MM-DD date, without time-zone drift. */
export function longDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function requestReceivedEmail(input: {
  referenceCode: string;
  route: RouteText;
  limit: number;
  movers: NamedMoverText[];
  manageUrl: string;
  webUrl: string;
  joinedReferenceCode: string | null;
}): { subject: string; bodyText: string; secretBodyText: string } {
  const lines = [
    `We received your moving request ${input.referenceCode}: ${routeLine(input.route)}.`,
    "",
  ];
  if (input.joinedReferenceCode) {
    lines.push(
      `We already had a request from you for this route (${input.joinedReferenceCode}), so this one joins it. The lowest number of movers you chose applies, and companies that already received your first request count toward it.`,
      "",
    );
  }
  lines.push(
    input.limit === 1
      ? "Only 1 participating moving company can receive your request and contact details."
      : `Up to ${input.limit} participating moving companies can receive your request and contact details.`,
    "",
    "We have saved your move details and contact preferences. Each company will identify itself and use the contact methods recorded with your request.",
    "",
    "Movers will ask about your inventory and access. A reputable mover will offer an in-home or virtual survey before giving a written estimate.",
    "",
    "See your request or withdraw it:",
    "{{manage_link}}",
    "Keep this link private: anyone who has it can see and withdraw your request.",
    "",
    `Unexpected contact about this request? Report it: ${input.webUrl}/report-a-concern/`,
  );
  const template = lines.join("\n");
  return {
    subject: `We received your moving request ${input.referenceCode}`,
    bodyText: template.replace("{{manage_link}}", REDACTED_LINK),
    secretBodyText: template.replace("{{manage_link}}", input.manageUrl),
  };
}

export function requestAvailableEmail(input: {
  route: RouteText;
  moveSize: MoveSize;
  moveDate: string;
  limit: number;
  appUrl: string;
}): { subject: string; bodyText: string } {
  const type = input.limit === 1 ? "exclusive" : `shared (up to ${input.limit} buyers)`;
  return {
    subject: `New request available: ${routeLine(input.route)}`,
    bodyText: [
      `A new ${type} request matches your coverage: ${routeLine(input.route)}, ${MOVE_SIZE_LABELS[input.moveSize].toLowerCase()}, moving around ${longDate(input.moveDate)}.`,
      "The consumer requested contact from participating moving companies that serve this move. Identify your company when you contact them and honor their chosen contact methods.",
      `Open the marketplace to see the preview and your price: ${input.appUrl}/portal/marketplace`,
    ].join("\n"),
  };
}

export function requestWithdrawnBuyerEmail(input: { route: RouteText; referenceCode: string; withdrawnOn: string }): { subject: string; bodyText: string } {
  return {
    subject: `Stop contact: request ${input.referenceCode} was withdrawn`,
    bodyText: [
      `The consumer who sent request ${input.referenceCode} (${routeLine(input.route)}) withdrew it on ${input.withdrawnOn}.`,
      "Stop contacting them about this move. Don't call, text or email them, and mark the record \"do not contact\" in your systems.",
      "Our mover terms require you to honor withdrawals and opt-outs right away.",
    ].join("\n"),
  };
}

export function requestWithdrawnConsumerEmail(input: { referenceCode: string; route: RouteText; buyers: number; webUrl: string }): { subject: string; bodyText: string } {
  return {
    subject: `You withdrew your moving request ${input.referenceCode}`,
    bodyText: [
      `You withdrew your moving request ${input.referenceCode} (${routeLine(input.route)}). No additional moving company can receive your contact details through it.`,
      input.buyers > 0
        ? `We told the ${input.buyers === 1 ? "company that received it" : `${input.buyers} companies that received it`} to stop contacting you. Withdrawing can't take back details a mover already received.`
        : "No moving company received your contact details from us through this request.",
      `Contact from a company after this? Report it: ${input.webUrl}/report-a-concern/`,
    ].join("\n"),
  };
}
