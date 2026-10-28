/**
 * Movers-only terms summary shown in the application (consent and disclosure draft §11). It is a
 * versioned summary for counsel to turn into the agreement: the version and its sha256 are stored
 * with every acceptance (mover_terms_acceptances), so a later edit needs a new version.
 */
import { createHash } from "node:crypto";

export const MOVER_TERMS_VERSION = "mover-terms-summary-v0-draft";

/** Draft status shown next to the terms until counsel approves a final text. */
export const MOVER_TERMS_STATUS_NOTE = "Draft summary for owner and counsel review. The full mover agreement is not final.";

export interface TermsSection {
  title: string;
  body: string;
}

export const MOVER_TERMS_SECTIONS: readonly TermsSection[] = [
  {
    title: "Eligibility",
    body: "We work only with moving carriers. You keep active household-goods carrier authority, your USDOT and MC numbers, insurance and the state credentials your work needs, and you tell us promptly about any change. You hold no broker authority.",
  },
  {
    title: "Use of requests",
    body: "You contact only the consumer, only about the move they asked about, and only within the consent they gave. You honor opt-outs immediately. You never resell, share or broker a request, and the carrier that quotes is the carrier that performs the move.",
  },
  {
    title: "Conduct",
    body: "You follow FMCSA consumer-protection rules, including written estimates and the required consumer booklets, and you don't give sight-unseen binding estimates where they are prohibited. No deceptive pricing.",
  },
  {
    title: "Pricing, credits and disputes",
    body: "Request prices, sharing credits, lead-quality claims, disputes and suspension work as described in our pricing and credits policy.",
  },
  {
    title: "Reviews",
    body: "No review gating, no incentives that depend on what a reviewer says, and no fake reviews. Your public responses are truthful and never disclose a customer's private information.",
  },
  {
    title: "Data protection",
    body: "You keep consumer data secure, follow the retention and deletion obligations, and notify us of any breach.",
  },
  {
    title: "Audit and enforcement",
    body: "We may verify your company at any time and may suspend or remove it for violations, with notice and an appeal.",
  },
];

/** The exact text the acceptance refers to. */
export function moverTermsText(): string {
  return [`American Moving Choice mover terms (${MOVER_TERMS_VERSION})`, ...MOVER_TERMS_SECTIONS.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`)].join("\n");
}

export const MOVER_TERMS_SHA256 = createHash("sha256").update(moverTermsText(), "utf8").digest("hex");
