# Consent, Disclosure and Authorization Copy — DRAFT v0 for counsel

**Status:** Working draft written by the product team to make counsel review concrete. **Not legal advice and not approved for use.** Every block below will be stored as a versioned `consent_text_versions` record once counsel approves it, and the exact rendered text (including the named movers) is hashed into each consent record.
**Last updated:** 2026-10-27
**Related:** `lead-lifecycle-and-purchase-rules.md` §2 and §6, `research/compliance-and-platform-facts.md` §2–§4 and §7.

Placeholders are in `{braces}`. Bracketed notes `[Counsel: …]` flag open questions.

---

## 1. Site-wide role statement (footer, survey, confirmation, "How it works")

> American Moving Choice is an online platform that connects people planning a move with independent, licensed moving companies in our network. We are not a moving company or a moving broker. We don't transport household goods, give moving estimates, or arrange or book moves. Participating movers pay us to receive move requests. Each mover sets its own prices and terms and is responsible for its services.

## 2. Movers-only statement (survey, directory, profiles, "for movers")

> **Movers only, no brokers.** Every company in our network must hold active household-goods carrier authority with the FMCSA, provide its USDOT and MC numbers, and agree not to resell your request or hand your move to another company. Brokers and lead resellers can't join. [Counsel: confirm phrasing while the MC requirement is a platform rule that some legitimate local movers can't meet.]

## 3. "Why we ask for your contact details" (shown before the contact step)

> To prepare a quote, movers need to reach you to confirm details like access, stairs and inventory. You'll choose how many movers may receive your details, and you'll see which ones before you submit. We don't sell your details to anyone else.

## 4. Sharing-limit question (asked after contact details)

**How many moving companies would you like to hear from?**
Options: 1 · 2 · 3 · … · {admin_max}

Helper text:
> This is the most movers who can receive your details. It doesn't guarantee that every company will send a quote. Choose **1** if you want to hear from only one mover.

[Product: no option is preselected; the user must choose. Counsel/UX to confirm.]

## 5. Review-and-consent step

Summary block:
> **Your request:** {origin_city}, {origin_state} → {destination_city}, {destination_state} · {move_date_or_range} · {move_size}
> **Up to {N} of these participating movers may receive your details and contact you:**
> {Mover display name 1} (USDOT {n}) · {Mover display name 2} (USDOT {n}) · …
> [Product: list every mover eligible for this request at submission, capped at a reasonable display count with "show all". Only listed movers can buy this request.]

Checkbox (unchecked by default, separate from the button):
> ☐ I agree that up to {N} of the movers listed above may contact me about my move at the phone number and email I provided, including by calls and text messages that may use automated technology or prerecorded voice. Consent isn't required to buy any goods or services. Message and data rates may apply. I can opt out at any time by replying STOP to a text or by contacting the mover or American Moving Choice. I agree to the [Terms of Use] and acknowledge the [Privacy Policy].

[Counsel:
- Whether automated-technology language should be optional or separate. Under the restored PEWC standard the call/text consent must identify the seller and be clear and conspicuous.
- State law add-ons (e.g. FL, OK, MD, TX texting rules).
- Whether naming movers individually satisfies company-identification requirements for shared leads.
- Arbitration: recommend **not** bundling arbitration into this checkbox.
- Required privacy-notice-at-collection language for applicable state privacy laws.]

Button: **Send my request**

## 6. Confirmation page

> **Request received.** Up to {N} {N==1 ? "mover" : "movers"} from the list you saw may contact you, usually within {typical_window}. A mover may decide not to quote, so you might hear from fewer.
> **What happens next:** movers will ask about your inventory and access. A reputable mover will offer an in-home or virtual survey before giving a written estimate.
> **Changed your mind?** {Withdraw request} stops new movers from receiving it. Movers who already received it will be told you withdrew consent.
> **Questions or problems?** {support_email} · {support_phone} · [Report a problem with a mover]

No-coverage variant:
> **We don't have a participating mover for this route yet.** We haven't shared your details with anyone. Here's how to check any mover's registration on the FMCSA website, and our guide to choosing a mover. [Product: offer an optional "notify me if a mover joins" only with separate consent.]

## 7. Advertising & marketplace disclosure (linked from every page; summarized near quote buttons)

> **How we make money:** participating movers pay American Moving Choice for the move requests they choose to buy. Payment doesn't affect a mover's verification status, its customer ratings, or how reviews are displayed. If we ever offer paid placement, it will be clearly labelled "Sponsored".

## 8. Preferred Mover badge explainer (next to every badge)

> **Preferred Mover — American Moving Choice** means this company passed our network screening on {verified_date}: active USDOT registration and household-goods carrier authority, no broker authority, required insurance on file, and agreement to our movers-only terms. It is not a government endorsement or a guarantee of performance. Customer reviews are shown separately. [See official FMCSA record] · [How we verify movers]

## 9. Mover payment authorization (company portal, when saving a card)

> I authorize American Moving Choice to save this payment method and charge it for the move requests I or members of my company purchase, in the amounts shown at the time of each purchase, and for any amounts owed under the Mover Terms. Account credits are applied before charging this payment method. I can remove this payment method at any time in Billing, which stops future charges but doesn't cancel purchases already made. Authorized by {user_name} for {company_legal_name} on {timestamp}.

[Counsel/Stripe: confirm wording satisfies the card networks' stored-credential and merchant-initiated transaction rules. ACH top-ups need a separate mandate text from Stripe's ACH flow.]

## 10. Purchase confirmation dialog (marketplace)

> **Buy this {exclusive|shared} request for {price}?** {credit_line: "${credit} account credit will be applied; ${card} will be charged to {card_brand} •••• {last4}."} {shared_line: "Up to {limit} movers can buy this request. If others buy it after you, you'll automatically receive account credit under the shared-request policy."} Contact details appear immediately after payment succeeds. [Buy] [Cancel]

## 11. Key Mover Terms (summary for counsel to draft the agreement)

1. Eligibility: movers only; maintain active HHG carrier authority, USDOT/MC, insurance and state credentials; notify within {n} days of any change; no broker authority.
2. Use of requests: contact only the consumer, only about the requested move, within the consumer's consent; honor opt-outs immediately; no resale, sharing or brokering; the carrier quoting is the carrier performing the move.
3. Conduct: comply with FMCSA consumer-protection rules (written estimates, required booklets, no sight-unseen binding estimates where prohibited); no deceptive pricing.
4. Pricing, credits, quality claims, disputes and suspension as in `shared-pricing-and-credits.md`.
5. Reviews: no review gating, no incentives conditioned on sentiment, no fake reviews; responses must be truthful and must not disclose customer private information.
6. Data protection: consumer data security, retention and deletion obligations; breach notification.
7. Audit and enforcement: the right to verify, suspend and remove for violations, with notice and appeal.
