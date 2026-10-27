# Lead Lifecycle, Matching, Disclosure and Purchase Rules

**Status:** Proposed rules. The rules marked **(enforced)** are already implemented in `db/migrations/001_marketplace_core.sql` and/or `packages/core` and covered by automated tests. Items marked **(counsel)** need legal review before launch.
**Last updated:** 2026-10-27

---

## 1. Lead lifecycle

```
survey_in_progress ──► submitted ──► validating ──┬─► rejected (spam / invalid / blocked)
                                                  ├─► needs_review (suspicious; admin decides)
                                                  └─► qualified ──► matching ──┬─► unmatched (no eligible participating mover)
                                                                               └─► available ──► partially_sold ──► sold_out
                                                                                        │               │
                                                                                        └──► expired ◄──┘   (sale window ends)
   any state ──► withdrawn (consumer opts out / deletion request)        any sold state ──► invalidated (proven fraud; refunds)
```

| State | Meaning | Visible in marketplace? |
|---|---|---|
| survey_in_progress | Visitor is filling the survey. Progress is kept in session storage plus a server draft keyed by an anonymous ID. No contact data is stored until the contact step is submitted. | No |
| submitted / validating | Contact step submitted. Automated checks run (§4). | No |
| rejected | Failed hard checks (e.g. bot, invalid phone, blocked list). The consumer sees a neutral, helpful message, never an accusation. | No |
| needs_review | Borderline risk score. Held for admin review within a target window. | No |
| qualified | Passed checks. Consent record stored (§6). | No |
| unmatched | No approved mover covers the move. The consumer is told honestly on the confirmation page that no participating mover currently serves the route, with useful next steps. We do not sell or share the request elsewhere. | No |
| available / partially_sold | Listed to eligible companies until the sale window closes or the sharing limit is reached. | Yes (preview only) |
| sold_out | Distinct buyers = sharing limit **(enforced)**. | No |
| expired | Sale window ended (proposed 72 hours, admin-configurable). | No |
| withdrawn | Consumer withdrew consent or asked for deletion. Removed from inventory immediately, and payments already in flight are refunded without disclosure **(enforced; tested)**. Buyers who already purchased are notified to stop contact, per counsel's guidance. | No |
| invalidated | Proven fraudulent after sale. Bulk refunds go out under the credit policy. | No |

## 2. Survey order (consumer side)

1. Origin ZIP (or city/state resolved to a ZIP set)
2. Destination ZIP (or city/state)
3. Move date or flexible range
4. Move size
5. Services needed (packing, storage, specialty items, etc.)
   - **Coverage pre-check:** before asking for any contact details, the server checks whether at least one participating mover serves the move. If none does, the consumer is told so on the spot, with useful next steps, and no contact details are requested.
6. *Why we ask for contact details*, then first and last name, email, phone
7. **"How many moving companies would you like to hear from?"** (1 … admin maximum), with the explanation: *"This is the maximum number of participating movers who can receive your details. It doesn't guarantee that every company will send a quote. Choose 1 if you'd like to hear from only one mover."*
8. Review and consent (§6): names the participating movers eligible to receive the request, the movers-only statement and the disclosures. Unchecked consent box, separate from the submit button.
9. Confirmation page: what happens next, the number of companies that may contact them, how to change their mind, support contact.

Back navigation keeps every answer. Unsupported locations (e.g. non-US ZIPs, unknown ZIPs) get specific error messages. Car shipping and truck rental requests are not sold to movers at MVP; see `docs/product/mvp-scope.md` for how those intents are handled.

## 3. Matching **(enforced in `packages/core/src/matching.ts`)**

A company is eligible for a lead only if **all** of the following hold:

1. **Company eligibility:** status `approved`, no broker authority (including dual carrier/broker registrations), USDOT and MC on file, credentials valid and unexpired, billing in good standing **(enforced in SQL `company_can_purchase`)**.
2. **Capabilities:** the verified profile offers the move type (local / intrastate / interstate), the move size and every requested service. Coverage rules can never widen capabilities.
3. **Coverage rules:** at least one active `include` rule matches and no active `exclude` rule matches.
   - A rule matches when **every specified dimension** matches (origin set, destination set, move types, sizes, services).
   - Inside a location set, **any** member matches (state OR county FIPS OR ZIP).
   - **Nationwide** = an include rule with no location dimensions.
   - **Origin-only** = origin set only; the destination is ignored. Destination-only works the same way.
   - **Directional route** = origin set + destination set. FL→GA and GA→FL are separate rules.
   - **Exclusions override inclusions.** Paused rules are ignored.
4. **Consent scope:** the company was among the participating movers named to the consumer at submission (§6). Movers that join or start covering the area later can't buy that request **(enforced: `lead_eligibility.named_in_consent`; tested)**. Counsel to confirm this is the right scope.

Move type: `interstate` if the states differ; otherwise `local` up to an admin-configured distance (default 50 miles), else `intrastate`. Distances come from geocoded ZIP centroids. "Long-distance" in marketing copy means intrastate beyond the local radius plus interstate.

Coverage changes apply only to **future** availability. Purchased leads, CRM records and invoices are never removed when coverage changes. At every purchase attempt the database rechecks company eligibility (status, broker flag, numbers, credential expiry) and consent scope. If the company's coverage changed since the lead was matched (its `coverage_version` moved on), the reservation fails with `eligibility_stale`. The app then re-runs the matcher, refreshes or withdraws the eligibility snapshot, and retries **(enforced; tested)**.

### Geography data rules
- ZIP codes are 5-character strings, always **(enforced: `parseZip5`, SQL `check (zip ~ '^[0-9]{5}$')`)**.
- A ZIP can span several counties and cities. We store a primary county (largest residential share from the HUD-USPS ZIP–county crosswalk) and the full mapping. Matching uses the primary county; admin tools show the others.
- Ambiguous city names (e.g. "Springfield") always resolve with a state, and the user picks from a list when needed.
- Dataset: US Census Gazetteer and county FIPS + HUD-USPS ZIP crosswalk, refreshed quarterly with a change log. ZCTAs are not ZIP codes and are used only for maps and area statistics. A commercial ZIP database is an option if USPS city-name accuracy proves insufficient.

## 4. Lead quality controls

Defence is layered so honest consumers rarely see friction:

| Layer | Check | On failure |
|---|---|---|
| Bot defence | Cloudflare Turnstile (invisible), honeypot field, minimum completion time, per-IP/device rate limits | Reject, or challenge |
| Contact validity | Phone: NANP format, line-type/carrier lookup, disconnected check. Email: syntax, MX record, disposable-domain list | Ask the user to correct. Reject after repeated invalid attempts |
| Risk signals | Datacenter/VPN IP, velocity (many submissions from one device), mismatched geography, test-like names | Raise the risk score. High scores go to `needs_review` or an optional SMS code (high-risk only) |
| Plausibility | Move date in the future and within 12 months; origin ≠ destination unless local; valid ZIPs | Inline validation |
| Duplicates | Same normalized phone or email (hashed) + same route within 30 days | Join the original request group; never sold twice beyond the group limit **(enforced)** |
| Blocklists | Known fraud phones/emails/IPs; consumer do-not-contact requests | Reject |

Every decision stores its reasons for admin review and for tuning conversion versus quality.

## 5. Marketplace preview and disclosure **(enforced)**

**Before purchase**, eligible companies see only: first name; origin and destination city/state (ZIP where the admin setting allows); move date; move size; source category (Organic Search, Paid Search, Paid Social, Referral, Direct, Other); lead timestamp; exclusive/shared; current and maximum buyer count; *their* price; credit-policy summary.

**Never before purchase:** phone, email, surname, street address, free-text notes, detailed attribution, other buyers' identities or activity.

Enforcement points:
- Previews are built field-by-field from an allow-list (`packages/core/src/preview.ts`), never by spreading the record, and a test asserts no sensitive values appear.
- Contact details come only from `lead_contact_for_company()`, which returns rows only when that company has a completed, disclosed purchase. Failed payments reveal nothing (tested).
- Notifications (email/SMS/push), CSV exports and API responses use the same preview projection. Exports of purchased leads are permission-checked per company role.
- Real-time updates carry only lead ID, status and buyer count. The server stays authoritative: a stale "Buy" click fails cleanly with "This lead is no longer available".

**After purchase:** the purchasing company sees the authorized contact details, and the lead lands in its CRM. Each company's CRM activity is private, even on shared leads **(enforced via RLS; tested)**.

## 6. Consent evidence (counsel)

Stored for every submitted request, immutable:

- Consent text **version ID** and a hash of the exact rendered text (including the list of named movers)
- Server timestamp (UTC), IP address, user agent, page URL, form version, A/B variant
- Checkbox state and the separate submit action
- Selected sharing limit and the resulting lead type
- Named participating movers (company IDs + display names) shown at submission
- Optional third-party consent certificate (e.g. TrustedForm) ID if adopted
- Later changes: withdrawals, do-not-contact requests, deletion requests, with timestamps

Recommended consent design (pending counsel): name each participating mover that may receive the request; one checkbox per consumer action, unchecked by default; plain statement that American Moving Choice is a platform that connects consumers with participating **movers** and is not a moving company or broker; that movers pay us for requests; how many companies can receive the details; and how to opt out. Calls/texts may use automated technology only if consent covers it.

## 7. Purchase flow **(enforced)**

1. **Reserve:** `reserve_purchase(company, lead_group, idempotency_key)` in one transaction:
   - Same company + same key returns the same attempt (double-click safe).
   - Locks the company row (serializes its credit holds) and the lead row (serializes inventory).
   - Rechecks eligibility, availability, the sale window, that the company hasn't already bought, and the cap.
   - **One in-flight reservation per lead** (partial unique index). A concurrent buyer gets `purchase_in_progress` and the client retries for a few seconds, so position and price are deterministic and overselling is impossible.
   - Computes the price from the company's current price row and the lead's policy version, applies available account credit first, and holds the credit.
2. **Charge:** the card remainder is charged off-session through Stripe with the attempt ID as the Stripe idempotency key. Zero card amount (fully credit-funded) skips Stripe.
3. **Complete:** `complete_purchase(attempt, payment_ref)` runs after payment success (synchronous result or webhook, whichever arrives first). It's idempotent, so repeated notifications return the same purchase. In one transaction it creates the purchase with its price snapshot, the ledger entries, the sharing credits, the disclosure, and marks the lead sold out at the cap.
4. **Fail/expire:** `fail_purchase` or the expiry sweeper releases the reservation. The production sweeper asks Stripe for the PaymentIntent status before expiring an attempt whose payment may still be processing.
5. **Late success / changed lead:** `complete_purchase` returns no purchase, and the system issues an automatic full refund, when the payment succeeds after the hold expired and the slot was taken. It does the same if the consumer **withdrew** during the payment, or a duplicate submission **lowered the sharing limit** below this buyer's position. No contact details are disclosed in any of these cases **(enforced; tested)**.
6. **Webhook dedupe:** every provider event ID is recorded once (`record_payment_event`).
7. **Recovery:** if the app crashes after Stripe succeeds but before completion, the webhook or the reconciliation job (Stripe PaymentIntents vs `purchase_attempts`) completes or refunds it. A daily reconciliation report lists any mismatch.

## 8. Company verification lifecycle (movers-only)

See `docs/business-rules/mover-verification-and-reviews.md`.
