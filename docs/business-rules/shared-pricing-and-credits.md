# Shared-Lead Pricing, Credits, Refunds and Disputes

**Status:** Proposal for owner approval. Do not enable live billing until the decisions in §9 are signed off.
**Implemented in code (test mode only):** `packages/core/src/sharing.ts` (calculator), `db/migrations/001_marketplace_core.sql` (`reserve_purchase`, `complete_purchase`, `refund_purchase`), with tests in `packages/core/test/sharing.test.ts` and `db/test/purchase.test.ts`.
**Last updated:** 2026-10-27

---

## 1. What the consumer's choice means

| Consumer answer to "How many moving companies would you like to hear from?" | Lead type | Who can buy |
|---|---|---|
| 1 | **Exclusive** | At most one distinct company, at that company's *exclusive* price. |
| 2 … N (N = admin-configured maximum, proposed 5) | **Shared** | At most that many distinct companies, each at its own *shared* price adjusted by the policy below. |

- The number is a **maximum**, not a promise of that many quotes. The survey says so in plain words.
- Lead type is fixed when the consumer submits. A shared lead is never converted to exclusive, and an exclusive lead is never resold.
- Buyers are counted as **distinct companies**. Team members inside one company never use extra slots.
- A duplicate submission from the same consumer joins the original request group. The group keeps the **lowest** limit the consumer ever selected, and buyers are counted across the whole group (tested: *duplicate consumer submission cannot widen the sharing limit*).

## 2. The four kinds of money movement (kept separate in the ledger)

| # | Kind | Triggered by | Form | Ledger entry |
|---|---|---|---|---|
| 1 | **Automatic shared-lead credit** | Another company successfully buys a shared lead you already bought | Account credit, posted automatically in the same database transaction as the triggering purchase | `sharing_credit` |
| 2 | **Lead-quality refund** | An approved claim that the lead was invalid (e.g. disconnected number, consumer never requested, fake data) | Account credit by default | `quality_refund_credit` |
| 3 | **Cash refund** | Admin decision only (billing error, duplicate charge, account closure per policy) | Money back to the original payment method via Stripe | `cash_refund` |
| 4 | **Company account credit / adjustment** | Admin goodwill, promotions, corrections | Account credit (+/−) | `adjustment` |

Account credits are spent automatically on the company's next purchases before any card charge (`credit_spend`). Credits reserved by an in-flight purchase are held so the same credit can't be spent twice (tested: *account credit is applied to the next purchase and held against concurrent use*).

## 3. Policy options considered

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **A. Flat shared price, no credits** | Every buyer pays its own shared price. | Simplest possible; no credit ledger. | Early buyers pay full price for a lead that later becomes more crowded. Doesn't meet the brief's requirement that later purchases trigger credits. Hard to justify publicly as lead counts rise. |
| **B. Equalizing step-down with automatic credits (recommended)** | Each buyer's *final* cost = its own shared price × a published factor for the final number of buyers. Later buyers pay the current factor. Earlier buyers are credited the difference automatically. | Transparent ("everyone ends at the same percentage of their own price"). Fair across different company prices. Exact in integer cents with no rounding drift. Already implemented and tested. | Needs a credit ledger and clear credit terms. Revenue per lead is lower than option A when many companies buy. |
| C. Naive equal split (price ÷ buyers) | Each buyer ends up paying its price divided by the buyer count. | Easy to explain. | Platform revenue stays at about one shared price no matter how many companies buy, so every extra sale earns roughly nothing while adding payment fees and support load. **Not recommended.** |
| D. Later-buyer discount, no credits | Buyer *k* pays its price × factor *k*; earlier buyers get nothing back. | Simple; no credits. | Penalizes the earliest (most engaged) buyers; doesn't meet the credit requirement. |

### Recommended launch policy (B), in one sentence for movers

> "For a shared lead, you pay your shared price if you're first. Each time another mover buys the same lead, the price steps down for everyone. You get the difference back automatically as account credit, so in the end every mover pays the same percentage of their own price: 100% alone, 80% with 2 buyers, 65% with 3, 55% with 4, 50% with 5."

The factors **100 / 80 / 65 / 55 / 50%** are a starting proposal, not a market fact. They should be validated in mover interviews and price tests (see §8 for alternative schedules).

## 4. The formula

For buyer *i* with snapshotted shared price *Pᵢ* (integer cents) and factor *f(n)* for *n* buyers:

- Effective cost: **Eᵢ(n) = round_half_up(Pᵢ × f(n))**, computed in integer cents and basis points.
- The *k*-th buyer is charged **E_k(k)** at purchase time.
- When purchase *k* succeeds, every earlier buyer *i < k* receives **Eᵢ(k−1) − Eᵢ(k)** as account credit.
- Credits telescope, so after *N* buyers each buyer has paid exactly **Eᵢ(N)** net. Rounding happens once per buyer per step, with no accumulated drift (tested: *every buyer's net cost equals own price × final factor*).

| Question from the brief | Answer under the recommended policy |
|---|---|
| What do later buyers pay? | Their own shared price × the factor for their position (e.g. 80% as 2nd buyer, 65% as 3rd). |
| Which earlier buyers receive credits? | **All** earlier buyers of that lead, each based on its *own* snapshotted price. |
| How do company-specific prices affect it? | Each company's charge and credits are computed only from its own price. Nobody subsidizes a competitor's price, and buyers never learn each other's prices. |
| Do credits apply after every additional purchase? | Yes. They are posted atomically with each successful additional purchase. A failed or abandoned attempt posts nothing. |
| Rounding | Half-up to the cent on each effective cost; credits are differences of rounded values. See the rounding example below. |
| Maximum credits | Per buyer per lead: Pᵢ × (1 − f(max)). That is 50% of the buyer's shared price at the proposed 5-buyer maximum. Credits can never exceed what the buyer was charged (tested). |
| Price changes by admin | Never rewrite history. Every purchase stores the price row it used, its list price, its charge and the policy version. Credits use the snapshot (tested: *historical purchases keep their pricing after admin price changes*). |
| Policy changes by admin | A lead is priced under the policy version stamped on it at creation. New versions apply only to new leads. |

## 5. Worked examples

Sample companies (illustrative prices, not recommendations):

| Company | Shared price | Exclusive price |
|---|---|---|
| A | $40.00 | $90.00 |
| B | $35.00 | $80.00 |
| C | $45.00 | $95.00 |
| D | $30.00 | $75.00 |
| E | $50.00 | $100.00 |

Card fee assumption: 2.9% + $0.30 per successful card charge (standard US online card pricing as published by Stripe; **verify against the account's actual pricing**). Credits spent later incur no new card fee, but the fee on the original charge is not returned when we issue a credit.

<!-- generated by packages/core/scripts/worked-examples.ts; policy share-stepdown-v1-proposal; factors 100% / 80% / 65% / 55% / 50% -->
#### 1 buyer (consumer limit 3)

| Step | Buyer (shared price) | Charged now | Credits issued to earlier buyers |
|---|---|---|---|
| 1 | A ($40.00) | $40.00 | — |

| Buyer | Shared price | Charged | Credits received | Net cost | Net as % of own price |
|---|---|---|---|---|---|
| A | $40.00 | $40.00 | $0.00 | $40.00 | 100.0% |

Platform: gross charges $40.00 − credits $0.00 = **net revenue $40.00**; est. card fees if every charge is card-funded $1.46 → **net after fees $38.54** (fees = 3.6% of net revenue).

#### 2 buyers (consumer limit 3)

| Step | Buyer (shared price) | Charged now | Credits issued to earlier buyers |
|---|---|---|---|
| 1 | A ($40.00) | $40.00 | — |
| 2 | B ($35.00) | $28.00 | A +$8.00 |

| Buyer | Shared price | Charged | Credits received | Net cost | Net as % of own price |
|---|---|---|---|---|---|
| A | $40.00 | $40.00 | $8.00 | $32.00 | 80.0% |
| B | $35.00 | $28.00 | $0.00 | $28.00 | 80.0% |

Platform: gross charges $68.00 − credits $8.00 = **net revenue $60.00**; est. card fees if every charge is card-funded $2.57 → **net after fees $57.43** (fees = 4.3% of net revenue).

#### 3 buyers (consumer limit 3)

| Step | Buyer (shared price) | Charged now | Credits issued to earlier buyers |
|---|---|---|---|
| 1 | A ($40.00) | $40.00 | — |
| 2 | B ($35.00) | $28.00 | A +$8.00 |
| 3 | C ($45.00) | $29.25 | A +$6.00, B +$5.25 |

| Buyer | Shared price | Charged | Credits received | Net cost | Net as % of own price |
|---|---|---|---|---|---|
| A | $40.00 | $40.00 | $14.00 | $26.00 | 65.0% |
| B | $35.00 | $28.00 | $5.25 | $22.75 | 65.0% |
| C | $45.00 | $29.25 | $0.00 | $29.25 | 65.0% |

Platform: gross charges $97.25 − credits $19.25 = **net revenue $78.00**; est. card fees if every charge is card-funded $3.72 → **net after fees $74.28** (fees = 4.8% of net revenue).

#### 5 buyers (consumer limit 5)

| Step | Buyer (shared price) | Charged now | Credits issued to earlier buyers |
|---|---|---|---|
| 1 | A ($40.00) | $40.00 | — |
| 2 | B ($35.00) | $28.00 | A +$8.00 |
| 3 | C ($45.00) | $29.25 | A +$6.00, B +$5.25 |
| 4 | D ($30.00) | $16.50 | A +$4.00, B +$3.50, C +$4.50 |
| 5 | E ($50.00) | $25.00 | A +$2.00, B +$1.75, C +$2.25, D +$1.50 |

| Buyer | Shared price | Charged | Credits received | Net cost | Net as % of own price |
|---|---|---|---|---|---|
| A | $40.00 | $40.00 | $20.00 | $20.00 | 50.0% |
| B | $35.00 | $28.00 | $10.50 | $17.50 | 50.0% |
| C | $45.00 | $29.25 | $6.75 | $22.50 | 50.0% |
| D | $30.00 | $16.50 | $1.50 | $15.00 | 50.0% |
| E | $50.00 | $25.00 | $0.00 | $25.00 | 50.0% |

Platform: gross charges $138.75 − credits $38.75 = **net revenue $100.00**; est. card fees if every charge is card-funded $5.53 → **net after fees $94.47** (fees = 5.5% of net revenue).

#### Ladder for five companies that all have a $40.00 shared price

| Buyers so far | New buyer pays | Each earlier buyer's credit at this step | Every buyer's net cost now | Platform net revenue |
|---|---|---|---|---|
| 1 | $40.00 | — | $40.00 | $40.00 |
| 2 | $32.00 | $8.00 | $32.00 | $64.00 |
| 3 | $26.00 | $6.00 | $26.00 | $78.00 |
| 4 | $22.00 | $4.00 | $22.00 | $88.00 |
| 5 | $20.00 | $2.00 | $20.00 | $100.00 |

#### Platform net revenue by policy option (companies A–E above, before payment fees)

| Buyers | A. Flat price, no credits | B. Equalizing step-down (recommended) | C. Naive split (price ÷ buyers) | D. Later-buyer discount, no credits | Exclusive alternative (first company's exclusive price) |
|---|---|---|---|---|---|
| 1 | $40.00 | $40.00 | $40.00 | $40.00 | $90.00 |
| 2 | $75.00 | $60.00 | $37.50 | $68.00 | $90.00 |
| 3 | $120.00 | $78.00 | $40.00 | $97.25 | $90.00 |
| 4 | $150.00 | $82.50 | $37.50 | $113.75 | $90.00 |
| 5 | $200.00 | $100.00 | $40.00 | $138.75 | $90.00 |

#### Rounding example (odd prices)

| Buyer | Shared price | Charged | Credits | Net | Exact price × 65% |
|---|---|---|---|---|---|
| X | $33.33 | $33.33 | $11.67 | $21.66 | 21.6645 |
| Y | $29.99 | $23.99 | $4.50 | $19.49 | 19.4935 |
| Z | $40.01 | $26.01 | $0.00 | $26.01 | 26.0065 |


**How to read the economics.** Exclusive sales earn the most per lead unless four or five companies buy a shared lead. Shared leads earn more per lead as buyers are added under option B. They never fall below one full shared price, unlike option C. The right exclusive-to-shared price ratio depends on observed sell-through, and we will set it from data during the pilot.

**Contribution margin** per lead = net revenue − payment fees − lead acquisition cost (media, content or affiliate cost per *qualified* lead) − verification costs (phone/email validation, consent certificate). Acquisition cost is unknown before launch. We will measure it by source category and report it in the admin dashboard (see the analytics plan in the architecture doc). We do not assume any cost-per-lead figure here.

## 6. Refunds, disputes and failures

| Situation | Treatment | Effect on sharing slots | Effect on other buyers' credits |
|---|---|---|---|
| Payment fails or the reservation expires | No purchase and no disclosure. The reservation is released (tested). | Slot released | None |
| Payment succeeds after the reservation expired and someone else took the slot | `complete_purchase` returns no purchase. The system automatically refunds the payment in full (cash refund, logged). | Unchanged | None |
| Duplicate clicks / repeated webhooks | Idempotency key per attempt; unique `payment_ref`, unique ledger `dedupe_key`, and webhook event IDs stored once (tested). | — | — |
| **Lead-quality claim approved** | Default: account credit equal to the buyer's *net* paid for that lead (charged − sharing credits already received). The database rejects larger refunds. The refunded purchase **stops accruing further sharing credits**, so the buyer recovers exactly its charge and no more (tested). Proposed claim window: 72 hours after purchase, with evidence (e.g. call log, bounced email). | **Never reopened** once contact details were disclosed (tested) | Unchanged. Credits already issued stand, and later buyers still pay the factor for their position. |
| Lead proven fraudulent for everyone | Admin bulk action refunds every buyer its net paid (credit or cash). The lead is marked invalid and its source is flagged for review. | Closed | Each buyer recovers its full charge: sharing credits already received plus the net refund. |
| Cash refund (admin) | Refund to the original payment method through Stripe; fees not recoverable. | Never reopened | Unchanged |
| Chargeback / dispute | Record a dispute entry, pause new purchases for that company, gather evidence (consent record, disclosure log, purchase authorization). Stripe dispute fees are borne by the platform unless the mover agreement says otherwise (counsel). | Never reopened | Unchanged |
| Company suspended or credentials expire | Purchasing is blocked immediately (tested: *expired-credential companies cannot purchase*). Existing purchased leads, CRM history and support access are kept. Credit balance is kept, and its handling on closure follows §9. | — | — |

## 7. Payment methods and when contact details are revealed

- **Cards (recommended for instant lead purchases):** card saved with a SetupIntent and explicit authorization for future charges. Each purchase is an off-session PaymentIntent. Contact details are disclosed only after the payment succeeds, in the same transaction that records the purchase.
- **ACH bank debit:** Stripe ACH Direct Debit typically takes about 4 business days to succeed (faster settlement only for eligible accounts). Unauthorized-debit returns remain possible afterwards: up to 60 days for consumer accounts, 2 banking days for business accounts (see `docs/research/compliance-and-platform-facts.md` §7). We recommend ACH only for **prepaid credit top-ups**: funds become spendable credit after the debit succeeds, and top-ups from new accounts can carry a limit until they have a clean history. ACH is never used for instant per-lead purchases, because contact details cannot be taken back if a debit later fails.
- Stripe's own customer credit balance applies only to invoices, so our internal ledger is the system of record for credits and Stripe holds only the cash movements.
- **Account credit:** spent first, automatically. Partial credit plus card for the remainder is supported.

## 8. Alternative factor schedules (for the pricing decision)

Platform net revenue for a lead bought by companies that all have a $40 shared price:

| Buyers | Steep (100/70/55/45/40) | **Proposed (100/80/65/55/50)** | Gentle (100/90/80/70/60) | Flat, no credits |
|---|---|---|---|---|
| 1 | $40 | $40 | $40 | $40 |
| 2 | $56 | $64 | $72 | $80 |
| 3 | $66 | $78 | $96 | $120 |
| 4 | $72 | $88 | $112 | $160 |
| 5 | $80 | $100 | $120 | $200 |

Steeper schedules are more attractive to movers. Gentler schedules earn more per lead. The schedule is one admin-configured array; changing it creates a new policy version for future leads only.

## 9. Decisions that need owner approval before live billing

1. **Policy option:** B (recommended) or A (no credits).
2. **Factor schedule** and **maximum consumer limit** (proposed 5).
3. **Starting exclusive and shared price bands** per market or move type. These are admin-set per company, but we need defaults.
4. **Credit terms:** non-transferable; spendable only on leads; expiry (recommended: none at launch); treatment on account closure (spend-down only, or cash-out for credit funded by cash refunds). Needs accountant review: liability accounting, possible unclaimed-property rules.
5. **Quality-claim policy:** valid reasons, evidence, claim window (proposed 72h), monthly cap or claim-rate monitoring, and who decides.
6. **Dispute/chargeback terms** in the mover agreement (fees, suspension).
7. **Payment methods at launch:** card only for purchases; whether to offer ACH prepaid top-ups.
8. **Sales tax:** whether lead sales are taxable in the states where buyers are located (accountant). Stripe Tax can calculate it if needed.
