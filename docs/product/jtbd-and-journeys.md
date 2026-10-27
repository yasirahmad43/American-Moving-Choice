# Jobs-to-be-Done, Personas and End-to-End Journeys

**Status:** Phase 1 draft · 2026-10-27 · Owner: Product
**Evidence level:** Hypothesis. No customer or mover interviews have taken place yet. Every job, pain and gain below is tagged with where it comes from, and section 6 sets out how we validate them before live billing.

| Tag | Source |
|---|---|
| **[B]** | The client brief: a stated requirement. |
| **[R]** | Reference research: `docs/research/reference-matrix.md` (search-based; direct site browsing was blocked by the network policy). |
| **[K]** | Keyword and intent data: `docs/research/keyword-research.md` (Semrush US, 2026-10-27). |
| **[H]** | Domain hypothesis. Needs validation (section 6). |

**Skills applied:**
- `product-strategy-session`: positioning, proto-personas, journeys and decision points, run in "best guess" mode from the brief and research because there are no live stakeholders yet.
- `jobs-to-be-done`: functional, social and emotional jobs; pains and gains ranked by intensity.
- `discovery-process`: the validation plan in section 6.

The workshop and interview steps those skills call for are designed here, not run. Section 6.

---

## 1. Positioning (draft for client review)

> **For** people planning a household move in the US **who** want quotes from real moving companies without being sold to by brokers or flooded with calls, **American Moving Choice** is a moving-company comparison and quote-request marketplace **that** sends your request only to verified carriers (never brokers), and only to as many as you choose. **Unlike** lead sites that resell your details widely or hide that they are brokers, we publish how we verify each mover, how we make money, and which movers received your request.

> **For** licensed household-goods carriers **who** need a steady flow of relevant move requests, AMC is a lead marketplace **that** offers exclusive or capped-share leads matched to your exact coverage and routes. It includes a free CRM and reputation tools. **Unlike** lead vendors that sell the same lead to many buyers and mix brokers in with carriers, every buyer on AMC is a verified carrier, and the sharing cap is set by the consumer.

**Problem statement (consumer):** People hiring a mover can't easily tell real carriers from brokers. Once they submit a quote request they lose control of who contacts them. [R] [B] Several references never say how many companies will call, and some bury broker status or blanket autodialer consent in their terms (reference matrix §4, patterns 1, 4, 11). The result is unwanted calls, a risk of fraud, and low trust in every comparison site.

**Problem statement (mover):** Carriers pay for leads that are often oversold, misrouted or shared with brokers, and have little visibility into lead quality or competition. [H] We need interviews to confirm this.

---

## 2. Proto-personas

**Consumers**

| ID | Persona | Situation | Notes |
|---|---|---|---|
| C1 | **Local mover** | Same metro, apartment or small house, often moving on a tight timeline | Largest search demand ("movers [city]"; Atlanta, Dallas and Austin each have a 7,300–8,000 demand index) [K] |
| C2 | **Long-distance / interstate household mover** | Moving across state lines, 2–4 bedroom home, high spend, high fraud exposure | Highest commercial value: "long distance moving companies" has 74k searches at a $44.63 CPC; "interstate movers" is 9.9k at $45.27 [K] |
| C3 | **Vehicle shipper** (adjacent job) | Needs a car moved, either alongside a household move or on its own | Ranked low priority because the searcher isn't hiring a household mover [K] |
| C4 | **DIY / truck renter** (adjacent job) | Price-sensitive and considering renting a truck | May need labor only; ranked low priority [K] |

**Movers**

| ID | Persona | Situation |
|---|---|---|
| M1 | **Owner / GM** of a small-to-mid household-goods carrier (roughly 2–50 trucks) | Decides which lead vendors to use, sets budgets, cares about reputation. [H] |
| M2 | **Sales agent / estimator** | Works leads fast, needs contact details, notes and follow-ups. [H] |
| M3 | **Billing / office manager** | Handles receipts, credits, disputes and reconciliation with accounting. [H] |

**Internal**

| ID | Persona | Situation |
|---|---|---|
| A1 | **Verification and ops analyst** | Reviews applications, FMCSA evidence, credential alerts, complaints and broker reports. [B] |
| A2 | **Marketplace and finance admin** | Sets prices and policies, handles refunds, disputes and reconciliation. [B] |
| A3 | **Content editor / SEO** | Drafts, reviews and publishes geographic content and guides. [B] |

---

## 3. Jobs-to-be-Done

### 3.1 C1 Local mover and C2 Long-distance mover

Most jobs are shared. Where C1 and C2 differ, it is noted.

**Functional jobs**
- Find movers that actually serve *my* origin and destination and can handle my move size and dates. [B] [R]
- Get a realistic price expectation before talking to anyone. moveBuddha's "No Email Required" calculator shows the pattern. [R] [K] "moving cost calculator" has 5.4k searches, and the calculator is about 30% of moving.com's organic traffic.
- Compare a small number of credible quotes on equal terms. [R]
- (C2) Confirm the company is a licensed interstate carrier, not a broker, and understand my rights: valuation, binding vs non-binding estimates. [R] [B]
- (C1) Book quickly, sometimes for a move within days. [H]

**Social jobs**
- Look like I made a responsible, well-researched choice to my partner or family. [H]
- Avoid being the person who got scammed by a "moving company" that turned out to be a broker. [H] [R]

**Emotional jobs**
- Feel in control of who has my phone number. [R] [B]
- Avoid the dread of a phone that won't stop ringing after I hit submit. [R] [H]
- Feel confident that the price I'm quoted won't double on moving day. [H] (C2 especially)

**Pains, ranked by intensity (hypothesis)**

1. **Unwanted call floods and loss of control over sharing.** Acute. [R] [H]
2. **Broker deception and fraud risk** (C2). Acute: a "mover" turns out to be a broker, or prices change at delivery. [R] [H]
3. **Contact details demanded before any value is shown.** High: Budget Van Lines asks for contact info up front. [R]
4. **No way to verify credentials quickly.** High: users don't know where to check USDOT or MC numbers. [R] [K] "usdot number lookup" gets 4.4k searches at KD 18.
5. **Fake-looking ratings** that are inconsistent across pages. Medium. [R]
6. **Thin or irrelevant local pages** that list movers who don't serve the route. Medium. [R]

**Gains**
- Expectations: a price range before contact; told exactly how many movers will receive my request; the movers named, with their USDOT/MC numbers. [R] [B]
- Savings: one form instead of calling 5 companies. [H]
- Adoption factors: "movers only, no brokers" stated plainly, a visible verification date, a published review methodology, and no savings claims we can't back up. [R] (pattern 7 to avoid)
- Life improvement: "I submitted once, heard from the 2 movers I chose, and nobody else called." [H]

### 3.2 C3 Vehicle shipper and C4 DIY / truck renter (adjacent jobs)

**Jobs**

| Persona | Job |
|---|---|
| C3 | Get my car to the new home safely, at a known price, from a trustworthy transporter. |
| C4 | Move as cheaply as possible myself, maybe with hired help for loading. |

**Tension with the business model:** The brief's movers-only addendum makes *approved household-goods moving carriers* the only eligible lead buyers. [B] Consumer auto transport is widely brokered [H, verify]. Truck-rental companies don't buy per-lead in this model. Collecting leads we can't sell to an eligible buyer would be dishonest to consumers and would waste their consent.

**Recommendation for the MVP:**

| Need | MVP handling | Later |
|---|---|---|
| Vehicle with a household move (C2 + C3) | Optional add-on in the moving survey ("I also need to ship a vehicle"). Routed only to approved movers whose verified capabilities include `auto_transport` that they perform themselves. The `auto_transport` service already exists in `packages/core/src/matching.ts`. | Keep. |
| Standalone car shipping (C3) | **No lead capture.** Publish an honest guide (how to verify an auto transporter; broker vs carrier for vehicles) that says plainly that AMC does not currently match standalone vehicle shipments. An optional "tell me when this is available" list with separate consent. | Evaluate a separate verified **auto-transport carrier** network (carriers only, same verification standard) if demand and supply justify it. |
| DIY / truck rental (C4) | Content comparing truck rental with full-service costs. Capture "loading/unloading help only" as `labor_only`, routed only to approved movers offering it. | Evaluate disclosed affiliate partnerships with rental companies. No lead resale. |

### 3.3 M1 Owner/GM, M2 Sales agent, M3 Billing manager

**Functional jobs**

| Persona | Jobs |
|---|---|
| M1 | Fill the schedule with profitable jobs in the lanes and areas I want. [B] Control lead spend and know my cost per booked job. [H] Protect and grow my reputation. [B] |
| M2 | Reach the consumer first, with the right context. [H] Track follow-ups so nothing slips. [B] |
| M3 | Reconcile charges, credits and refunds against our books. Dispute bad leads without a fight. [B] [H] |

**Social jobs**
- M1: be seen as a legitimate, licensed carrier. The badge and verification shown on the profile are a differentiator from brokers. [B] [H]
- M2: look responsive and professional to the consumer. [H]

**Emotional jobs**
- M1: stop feeling ripped off by oversold leads. [H]
- M3: feel certain the numbers add up. [H]

**Pains, ranked by intensity (hypothesis)**

1. **Oversold leads.** The same lead is sold to many buyers, including brokers, so the close rate collapses. [H]
2. **Misrouted leads.** Wrong area, direction or size, and refund fights over them. [H]
3. **Slow or opaque dispute processes.** [H]
4. **Opaque pricing and surprise charges.** [H]
5. **No time to switch CRMs.** Leads arrive in email and get lost. [H]

**Gains**
- Expectations: a precise coverage editor (directional routes, origin-only, exclusions); a visible buyer count and cap before purchase; credits applied automatically when a lead is shared further. [B]
- Savings: a free core CRM, so no separate tool is needed for leads. [B]
- Adoption factors: transparent price per lead, a published credit and refund policy, and the fact that brokers are excluded. [B] [H]

### 3.4 A1–A3 Internal

| Persona | Functional jobs | Emotional job |
|---|---|---|
| A1 | Approve only real carriers, with evidence that would stand up to scrutiny. Catch expiring credentials before they become a problem. [B] | Never be the reason a broker got in. |
| A2 | Set prices and policies without breaking historical records. Resolve disputes consistently. Reconcile with Stripe daily. [B] | (same as A1) |
| A3 | Publish geo pages only when they're genuinely useful. Roll back mistakes. [B] | (same as A1) |

---

## 4. End-to-end journeys

Each journey lists stages, the **moments of truth** (MoT) where trust is won or lost, and the failure modes with the designed response.

### J1. Consumer: search to confirmation (C1/C2)

| # | Stage | What happens | MoT / design intent |
|---|---|---|---|
| 1 | Discover | Lands on a city, state or route page or a guide from organic search, ads, AI search or a referral | Page-specific value proposition with real coverage data. No doorway-style pages. [B] [R] |
| 2 | Orient | Reads "movers only, no brokers", the verification explanation and the "how we make money" disclosure | **MoT:** honesty above the fold [R] |
| 3 | Estimate (optional) | Uses the ungated cost estimator; inputs pre-fill the survey | Value before contact [R] |
| 4 | Move details | Origin and destination ZIP (or city→ZIP disambiguation), date or flexible range, size, services | Low friction first. Progress bar, back navigation, saved progress [B] |
| 5 | Coverage pre-check (recommended) | The server counts eligible verified movers for the route **before** asking for contact details. It returns a count only, never identities or prices. | **MoT:** if there is no coverage, say so now. Don't collect a lead we can't serve. The `unmatched` state (business-rules lifecycle §1) stays as the fallback when coverage changes between the pre-check and submission. |
| 6 | Why we need contact details | Plain-language explanation of who receives the details and when | [B] |
| 7 | Contact details | First and last name, email, phone. Inline validation (format, line validity) | Helpful errors [B] |
| 8 | How many companies | "How many moving companies would you like to hear from?" 1 = exclusive; maximum is admin-configurable. Explains this is a **maximum**, not a guarantee of quotes | Asked **after** personal info, per the brief [B] |
| 9 | Consent and disclosures | Unchecked consent box, separate from submit. Names the eligible movers (wording pending counsel). **Only movers named here can ever buy the lead**: enforced in the DB by `lead_eligibility.named_in_consent` and tested. Versioned wording | **MoT:** consent evidence stored (wording version, timestamp, selected limit, page, IP/UA, the named movers) [B] [R] |
| 10 | Submit and confirmation | What happens next, the maximum number of companies, how they'll be told which movers received their details, how to withdraw or lower the limit, support contact | [B] |
| 11 | Mover contact | Each purchase triggers an email to the consumer naming the mover, with a profile link | **MoT:** "which companies receive my request" [B, addendum §5] |
| 12 | Decide and move | Consumer books (or doesn't) outside the platform | Out of platform [B] |
| 13 | Review | Invitation after an eligible CRM milestone, if consent and contact preferences allow | Evidence label assigned; negative reviews are published under the methodology [B] |

**Failure modes**

| Failure | Detection | Designed response |
|---|---|---|
| **Unsupported location** (non-US, PO-box-only ZIP, APO/FPO, territories not yet supported) | ZIP resolution | Say plainly that we can't help with this location yet. Link to official resources. Collect nothing further. |
| **No eligible movers** for the route, size or service | Coverage pre-check at step 5 | Honest message ("We don't have verified movers for this route yet"). Offer guides. Optional "notify me" with separate consent. Never list a lead with zero eligible buyers. |
| **Duplicate submission** (same phone or email, same route, within the window) | Normalized contact hash + route + time window | Tell the consumer we already have their request from [date]. The original limit applies; resubmitting can't widen it (DB-level test). Offer to manage the existing request. |
| **Invalid phone or email** | Format, line-type and MX checks | Inline, specific fix-it messages. A hard block only for impossible values. |
| **Bot or spam** | Turnstile, honeypot, velocity limits | Silent rejection of obvious bots. Risky submissions go to an admin review queue before listing. |
| **Consent declined** | Checkbox unchecked | Nothing is shared. Offer the Preferred Movers directory to contact movers directly. |
| **Abandonment mid-survey** | Funnel events | Progress is saved locally. No follow-up contact unless consent was given (counsel to confirm partial-lead rules). |
| **Consumer withdraws, opts out or replies STOP** after submission | Manage-request link, support case, or an opt-out received by the platform | Removed from inventory immediately (`withdrawn`). The opt-out is **propagated to every mover that already bought the lead**, and their CRM records are flagged "do not contact" (compliance facts §3, implication 4). Movers must honor opt-outs under the mover agreement. |

### J2. Consumer: from a company profile (C1/C2)

| # | Stage | What happens | Notes |
|---|---|---|---|
| 1 | Visit profile | Sees USDOT/MC with official lookup links, verification status and date, credentials, services and coverage, reviews or "No customer reviews yet", and "New to our network" where true | Never a fabricated rating [B] |
| 2 | Request a quote | Clicks "Request a quote". Same survey and rules; the profile company is recorded as `requested_company` and named **first** in the consent list | Same sharing limits and purchase rules [B]. Choosing 1 means only one company can buy, and the profile company still buys under the normal rules (`mover-verification-and-reviews.md` §5) |
| 3 | Out of coverage | The requested mover doesn't serve this route | Tell the consumer before contact details. Offer other eligible movers, opt-in only. |

**Rule source:** there is no first-look window for the profile company at launch (`mover-verification-and-reviews.md` §5). If the owner later wants one, it is a business-rules change, and the analytics should first show how often profile-origin requests are bought by a different mover.

### J3. Mover: application to first booked job (M1/M2)

| # | Stage | What happens | MoT / failure handling |
|---|---|---|---|
| 1 | Discover | "Buy moving leads" page: pricing model, movers-only policy, exclusive vs shared, credit and refund policy | [K] "buy moving leads" 720 searches, KD 18. Publish rules up front. |
| 2 | Apply | Legal name, DBA, address, authorized representative, USDOT, MC, services, service areas, insurance docs, state credentials. Attests to no brokering and no resale | [B] |
| 3 | Verification | Automated FMCSA identity match: name, DBA, address. Authority type and status (carrier vs broker; dual registration detected). Insurance on file. Evidence snapshot stored | **Failure:** a broker or dual authority leads to rejection with the reason. A name or address mismatch goes to manual review. MC-number availability is pending research (DEP-19). |
| 4 | Admin review | Analyst sees the evidence and approves or rejects with a reason. Reviewer and date recorded | [B] |
| 5 | Approved | Profile draft, Preferred Mover badge, directory listing, service-area placement where genuinely applicable | **MoT:** accurate public listing [B] |
| 6 | Set up | Save a card (SetupIntent with explicit authorization for future off-session charges), coverage rules, notification preferences, team invites. Prices are set by admin | Purchasing stays locked until payment method and prices exist |
| 7 | Marketplace | Sees matching leads: redacted preview, price, buyer count / max, credit policy | Realtime availability; server is authoritative |
| 8 | Purchase | One click with an idempotency key. Reservation, then charge, then disclosure | **Failures:** below. |
| 9 | Work the lead | Contact revealed, lead in CRM at "New". Call or email outside the platform; stages, notes, tasks | CRM is private per company [B] |
| 10 | Booked / completed | Moves the lead through stages. Review invitation at an eligible milestone | "Completed" alone never proves the move happened [B] |
| 11 | Reputation | Responds to reviews, reports abuse, sees ratings | Can't edit or delete reviews [B] |

**Purchase failures:**
- Lead taken while viewing: "sold out" or "purchase in progress, retrying".
- Card declined or authentication required: no disclosure, reservation released, prompt to update the card.
- Duplicate click: same result returned.

**Mover failure modes**

| Failure | Designed response |
|---|---|
| **Credential expiry or invalidation** (weekly FMCSA re-check, document expiry, or a trigger such as a broker-activity report) | Before expiry: alerts at 30, 14, 7 and 0 days. On any failure that can't be confirmed: new purchases suspended and Preferred status removed automatically. Purchased leads, CRM history, invoices and support access stay available. Profile shows the current status truthfully ("Verification under review"). See `mover-verification-and-reviews.md` §3. |
| **Payment failure off-session** | No disclosure. Notify owner and billing roles. After repeated failures, purchasing pauses until the card is updated. |
| **Bad lead** (disconnected number, wrong person, out of area) | Dispute within the policy window with a reason. Admin decides. Default remedy is account credit. The slot is never reopened (DB-level test). |
| **Chargeback** | Ledger entry; account flagged; purchasing paused pending review. |
| **Coverage edited** | Affects future matching only. Purchased leads are untouched. |
| **Team member leaves** | Owner or manager deactivates them. Access revoked immediately and audit-logged. |

### J4. Billing manager (M3)

Receipts per purchase → monthly statement → credit balance and history (sharing credits, quality-refund credits, spends, adjustments) → dispute status.

**MoT:** every number traces to a ledger entry with a reason [B].

**Failure:** a mismatch between the statement and the card statement. The reconciliation report and support path explain it.

### J5. Admin / ops (A1–A3)

| Persona | Flow |
|---|---|
| A1 | Verification queue → evidence → decision → re-check scheduler and alerts → complaints and broker-activity reports → review moderation and appeals |
| A2 | Price sheet per company (append-only history) → sharing and credit policy versions → disputes and refunds → daily reconciliation exceptions |
| A3 | Payload CMS: draft → review → publish → version history and rollback, with publishing gates (coverage and data thresholds) deciding index vs noindex |

**MoT:** every privileged action is audit-logged [B].

### J6. Review lifecycle

| # | Stage | Detail |
|---|---|---|
| 1a | Quote-experience invitation | **AMC sends it, not the company.** Every consumer whose request was purchased is invited after a set delay (about 7 days), subject to contact preferences, so companies can't hand-pick happy customers. |
| 1b | Move-experience invitation | The company requests it for customers it marks Booked or Completed. The platform sends it and logs every request. Selective-invitation patterns are monitored and can trigger an audit. |
| 2 | Link | A secure single-use link. The reviewer's contact details are never shown publicly. |
| 3 | Submission | The consumer submits a rating and text, choosing whether it reviews the *quoting experience* or an *actual move*. They can upload evidence (an estimate or deposit receipt; a bill of lading or final invoice). |
| 4 | Labelling | Moderation assigns the evidence label from what was collected: Verified platform inquiry, Verified customer, or Verified completed move (definitions in `mover-verification-and-reviews.md` §6). A CRM "Completed" stage alone never earns "Verified completed move". |
| 5 | Moderation | Under the published methodology. Rejected only for policy reasons, never for being negative. |
| 6 | Publication | Published, with an optional public company response (owner or manager roles). |

**Failure modes:**
- Company reports a review as fake, abusive or unrelated: admin decides, with an appeal route for both sides.
- Company tries to suppress or edit a review: not possible. The company has no write access.
- Incentive offered conditionally on a positive rating: prohibited and reportable.

---

## 5. Opportunities by persona (input to MVP scoping)

| Opportunity | Personas | Evidence | Where it lands |
|---|---|---|---|
| Consumer chooses the maximum number of movers; told who received the request | C1, C2 | [B] [R] | MVP (`mvp-scope.md`) |
| Coverage pre-check before contact details | C1, C2, M1 | [H] | MVP |
| Ungated cost estimator | C1, C2 | [R] [K] | MVP (Should) |
| Public USDOT/MC lookup tool | C2, M1 | [K] | MVP (Should); depends on FMCSA access |
| Directional coverage editor with exclusions | M1 | [B] | MVP |
| Automatic sharing credits | M1, M3 | [B] | MVP, pending policy approval |
| Free core CRM | M2 | [B] | MVP |
| Auto-buy rules and daily budgets | M1 | [H] | Later; discovery question L4 |
| Inventory builder | C2, M2 | [R] | Later |

---

## 6. Discovery and validation plan

This follows the `discovery-process` workflow, adapted. We can't interview anyone from this environment, so this section designs the research rather than reporting it.

### 6.1 What we must learn before live billing (decision gates)

| # | Question | Why it matters | Method | Gate / decision it feeds |
|---|---|---|---|---|
| L1 | What do carriers in the launch markets pay today per lead (exclusive vs shared, local vs long-distance), and what share books? | Sets each company's initial exclusive and shared prices | Mover interviews (past invoices, not opinions) | Client price sheet (DEP-03) |
| L2 | Do movers understand the "equalizing step-down" credit policy, and do they prefer it to a flat shared price or a later-buyer discount with no credits? | Policy must be transparent and accepted | Comprehension test: show 3 policy cards and ask them to compute their cost for a 3-buyer example | Policy approval (DEP-01). Target: ≥80% compute it correctly |
| L3 | What counts as a bad lead, and what dispute window and evidence feel fair? | Refund policy and dispute workflow | Interviews; review of the vendor policies they currently use | Refund policy (DEP-04) |
| L4 | How fast do they respond to leads; who buys (owner or agent); do they need auto-buy or daily budgets? | Notifications, permissions, Later backlog | Interviews; pilot logs (time to first view and to first purchase) | Notification channel priority; auto-buy go/no-go |
| L5 | Is supply feasible under movers-only plus USDOT+MC in each launch market? How many interstate carriers also do local work there? | **Biggest strategic risk.** Local demand is large [K]. Intrastate-only movers have no FMCSA operating authority, so no MC number; they hold state credentials instead. FMCSA has also said it plans to stop issuing MC numbers through a future rulemaking (`docs/research/compliance-and-platform-facts.md` §1). The rule is already a platform setting (`require_mc_number`, default on). | FMCSA data analysis per market (needs data access; DEP-09); outreach conversion tracking | Launch market selection (DEP-05); owner decision on a state-licensed local track (DEP-19; business-rules owner decision #1) |
| L6 | How many companies do consumers choose? Do they understand "maximum, not a guarantee"? Does explaining why we need contact details help or hurt completion? | Lead mix (exclusive vs shared) drives revenue | 2 rounds × 5 moderated mobile usability tests on the Phase 3 prototype; post-launch A/B tests | Survey copy and the default limit |
| L7 | What contact channel and how many calls do consumers tolerate? | Consent design and lead value | Usability-test debrief; post-submission micro-survey | Consent and contact preference fields |
| L8 | Will movers save a card for off-session charges, or do they need prepaid balances or ACH? | Payment design (ACH settlement delay vs instant disclosure) | Interviews; pilot | ACH top-up priority |
| L9 | Will movers invite *all* customers to review? What completion evidence can consumers realistically provide? | Review integrity; evidence labels | Interviews; consumer test of the review form | Review evidence standards |

### 6.2 Mover interviews (8–12, saturation-driven)

**Recruiting:**
- Carriers in the candidate launch markets, from FMCSA data once accessible.
- Movers met through national and state moving trade associations where they exist.
- Owner networks.
- Mix: at least 3 local-heavy, at least 3 interstate-heavy, at least 2 multi-truck operators with sales staff.
- Incentive: lead credit at launch, or a gift card.

**Guide (Mom Test: past behaviour only, never "would you use…"):**
1. Tell me about the last lead you bought that turned into a booked job. Where did it come from? What did it cost?
2. Which lead sources did you pay for last month? Roughly how many leads, and how many booked?
3. Walk me through the first 10 minutes after a lead arrives. Who sees it and what do they do?
4. Tell me about the last time you disputed a lead. What happened?
5. When have you paid more for an exclusive lead? Was it worth it?
6. Who in your company is allowed to spend money on leads? How do you control it?
7. What made you stop using a lead vendor?
8. How do you get reviews today? Which customers do you ask?
9. Do you hold interstate authority? (Check against FMCSA, not self-report.)

**Synthesis:** affinity map with frequency counts. Rank pains by frequency × intensity × strategic fit (1–5 each). Update section 3 and replace [H] tags with interview evidence.

### 6.3 Consumer usability tests

| Item | Plan |
|---|---|
| Rounds | 2 rounds × 5 participants on mobile (each round has a defined goal; see below) |
| Participants | People who moved in the last 6 months or plan to move within 3 months; mix of local and interstate |
| Tasks | Get a price idea; request quotes for a stated scenario; find out who received the request; withdraw the request |
| Measures | Task success, time on task, errors, the step where people hesitate, and comprehension checks on "maximum, not guarantee", "movers only" and the consent text |
| Round 1 | Fix copy and order |
| Round 2 | Confirm the fixes |

### 6.4 Pilot (concierge-style) before scaling billing

| Item | Plan |
|---|---|
| Scope | One launch market, 5–10 approved carriers, 2–4 weeks |
| When | After Phase 4 and the Phase 5 MVP |
| Verification | Manual (admin-assisted) if the FMCSA integration isn't finished |
| Payments | Real card charges at pilot prices, or invoiced manually. **Choose with counsel and the client.** |
| Proposed go/no-go thresholds (for client approval) | 24h sell-through ≥60% of available slots. Dispute rate ≤10% of purchases. At least 60% of pilot movers buy again within 14 days. No P1 defects in purchase, disclosure or ledger. |

These thresholds are **proposals**, not industry benchmarks.

### 6.5 Timeline and readout

| Week | Activity |
|---|---|
| 1 | Recruit; interview guide sign-off |
| 2–3 | Interviews and usability round 1 (prototype dependent) |
| 4 | Synthesis and readout: policy and price recommendation, go/no-go on the MC rule as written, launch-market confirmation |

After launch: one mover conversation per week (continuous discovery).
