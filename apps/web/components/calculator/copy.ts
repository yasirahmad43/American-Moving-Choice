/**
 * Calculator interface strings, keyed by the IDs in content/pages/costs/moving-cost-calculator.md
 * ("Calculator widget: interface copy"). Values in {braces} are filled at run time; registry
 * tokens arrive as `tokens` from the server (content/tokens.json and platform settings), never
 * typed here. Strings marked [Build: not rendered in model v1] (form.month.*) are left out.
 */
export const COPY = {
  "form.name": "Moving cost calculator",
  "form.route.legend": "Where are you moving?",
  "form.origin.label": "Moving from (ZIP)",
  "form.origin.help": "5-digit ZIP code",
  "form.destination.label": "Moving to (ZIP)",
  "form.destination.help": "5-digit ZIP code",
  "form.size.legend": "Move size",
  "form.size.help": "The range uses movers' rates for a typical move of this size.",
  "form.services.legend": "Services (optional)",
  "form.services.help": "Pick any you want included in the range.",
  "form.services.packing.help": "The movers pack your belongings.",
  "form.submit": "Calculate the range",
  "form.submit.busy": "Processing…",
  "form.progress.origin": "moving-from ZIP code",
  "form.progress.destination": "moving-to ZIP code",
  "form.progress.size": "move size",
  "form.progress.done": "Nothing else needed.",
  "form.privacy":
    "No contact details needed. Your answers never appear in the page address, and we don't keep them unless you continue to the quote survey.",

  "route.check": "If this looks wrong, check the ZIP codes.",

  "error.origin.required": "Enter the ZIP code you're moving from.",
  "error.destination.required": "Enter the ZIP code you're moving to.",
  "error.zip.short": "Enter a 5-digit ZIP code.",
  "error.zip.non_us": "That isn't a US ZIP code. We can show ranges only for moves within the US.",
  "error.zip.lookup": "We couldn't check this ZIP code just now. Try again in a moment.",
  "error.size.required": "Choose a move size.",
  "error.count.one": "1 answer needs attention.",
  "notice.zip.same":
    "You entered the same ZIP code twice. That works for a move within one ZIP code; if not, check the moving-to ZIP code.",

  "results.heading": "Result for this move",
  "results.assume.heading": "What this range assumes",
  "results.includes.heading": "What the range includes",
  "results.includes.intro": "As each mover's rate card prices them:",
  "results.excludes.heading": "What the range leaves out",
  "results.changed": "You changed an answer. Calculate the range again to update it.",

  "cta.button": "See which movers cover this move",
  "cta.help":
    "Opens our quote survey with your ZIP codes, move size and services filled in for you to check. Nothing reaches a mover unless you send a request.",

  "state.no_data.heading": "Not enough data for a range yet",
  "state.no_data.services":
    "There's enough data for this move without services, but too few movers price every service you picked. Remove some or all of them to see a range.",
  "state.size_unpriced.heading": "No range for this kind of move",
  "state.size_unpriced.body":
    "Movers' rate cards cover homes from a studio to 4+ bedrooms. They don't cover office moves or moves of a few items, so there's no range for this move.",
  "state.next.intro": "You can still see which movers cover this move and request quotes from them.",
  "state.stale.heading": "No range for this area right now",
  "state.error.heading": "We couldn't load a range",
  "state.error.body": "Something went wrong. Nothing was shared with any mover, and your answers are still filled in.",
  "state.error.retry": "Try again",
} as const;

export type CopyId = keyof typeof COPY;

/** Strings that carry registry tokens, filled on the server. */
export interface TokenCopy {
  "form.services.storage.help": string;
  "form.services.specialty_items.help": string;
  "state.no_data.body": string;
  "state.stale.body": string;
}

/** error.zip.unknown and error.zip.unsupported name the ZIP code. */
export function errorText(id: string, zip?: string): string {
  if (id === "error.zip.unknown") return `We can't find ZIP code ${zip ?? ""}. Check the number.`;
  if (id === "error.zip.unsupported") return `We can't show ranges for moves to or from ZIP code ${zip ?? ""} yet.`;
  return (COPY as Record<string, string>)[id] ?? COPY["error.zip.lookup"];
}

/** error.count.one / error.count.other */
export const errorCountText = (n: number): string => (n === 1 ? COPY["error.count.one"] : `${n} answers need attention.`);

/** The method page's anchor for ST-7's link. */
export const METHOD_LINK = "/moving-cost-calculator/method/#how-is-the-range-built";
export const HOW_MOVERS_CHARGE = "/moving-costs/how-movers-charge/";
export const MONEY_PAGE = "/advertising-disclosure/";
export const VERIFY_A_MOVER = "/verify-a-mover/";
export const MOVING_COSTS = "/moving-costs/";
