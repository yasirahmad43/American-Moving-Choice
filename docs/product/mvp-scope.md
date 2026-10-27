# MVP Scope, Prioritization and Later Enhancements

**Status:** Phase 1–2 draft for client review · 2026-10-27 · Owner: Product

**Related:**
- `docs/product/jtbd-and-journeys.md`
- `docs/product/backlog.md`
- `docs/business-rules/*`
- `docs/research/*`

**Skills applied:**
- `write-spec`: problem, goals, non-goals, P0/P1/P2 requirements, metrics, open questions.
- `prioritization-advisor`: framework selection (section 2).
- `roadmap-planning`: epic hypotheses, Now/Next/Later, dependencies.
- `product-strategy-session`: decision points.

The interactive workshops these skills describe need the client and engineering lead in the room. This document is the pre-read for that session, not a substitute for it.

---

## 1. Problem, goals and non-goals

**Problem:**
- **Consumers** can't tell real moving carriers from brokers, and they lose control of who contacts them once they submit a request.
- **Carriers** pay for leads that are oversold, misrouted or shared with brokers.

The consumer side is backed by reference research. The carrier side is a hypothesis, to be validated in interviews (`jtbd-and-journeys.md` §6).

**Goals** (launch + 90 days, in the launch markets). All targets are **starting hypotheses (low confidence)**, to be replaced by pilot baselines.

| # | Goal | Metric (method) | Starting target |
|---|---|---|---|
| G1 | Consumers complete a request they feel in control of | Survey start → submit rate (PostHog funnel); confirmation-page comprehension (usability tests) | Baseline from pilot. Comprehension of "maximum, not a guarantee" ≥ 80% |
| G2 | Marketplace liquidity | Share of qualified leads with ≥ 1 eligible buyer; 24h slot sell-through (SQL) | ≥ 80% matched; ≥ 60% of slots sold within 24h |
| G3 | Movers activate and come back | Approved → first purchase within 14 days; repeat purchase within 30 days | ≥ 50%; ≥ 60% |
| G4 | Integrity never breaks | Leads disclosed to ineligible companies; fabricated ratings shown; cross-company data exposures (audit and test suite) | 0 / 0 / 0 |
| G5 | Profitable lead sales | Contribution margin per lead by acquisition source, after credits, refunds, payment fees, validation and messaging costs (finance report) | Positive by month 3 for organic. Paid sources tracked against a break-even CPL |

**Non-goals for this release**

| Non-goal | Why |
|---|---|
| Bidding or auctions | Excluded by the brief. Fixed per-company prices are simpler to explain and audit. |
| Consumer–provider messaging inside AMC | Excluded by the brief. Movers contact consumers outside the platform. |
| Native mobile apps | Responsive web plus PWA first (section 7). |
| Payouts to movers (Stripe Connect) | Movers only *buy* leads, so no payouts are needed. Revisit only if a payout product enters scope. |
| Selling standalone car-shipping or truck-rental requests | No eligible buyer under the movers-only rule (section 6). |
| Paid or promoted placement | Recommended not at launch (business-rules decision #5). If added later, it must be clearly labelled and kept separate from verification and ratings. |
| Multilingual or international pages | `seo-hreflang` applies only once real alternate-language versions exist. |
| Auto-buy rules and bulk buying | High value but low confidence and high complexity. Gated on discovery question L4. |

---

## 2. Prioritization framework (prioritization-advisor)

**Context answers:**

| Question | Answer |
|---|---|
| Q1 Stage | **Pre-PMF.** A new product with untested pricing and policy. |
| Q2 Team | **Small team:** 2 full-time engineers plus a fractional designer, SEO/content and QA. |
| Q3 Decision need | **Too many requirements, and hard trade-offs** between compliance-critical foundations and growth features. |
| Q4 Data | **Minimal product data.** Some demand data from Semrush for SEO page families. |

**Recommendation:**

| Framework | Used for |
|---|---|
| **MoSCoW** | The launch boundary. Anything that protects consent, money, private data, or the movers-only promise is a **Must by rule**, not by score. |
| **ICE** (Impact × Confidence × Ease, each 1–10) | Ranking Should and Could candidates. |
| **RICE** | Only for SEO page-family rollout, where Semrush volume supplies Reach (`docs/seo/*`). |

**Why not RICE everywhere:** with no usage data, Reach would be invented.

**Alternative:** a Value/Effort 2×2 for the live client workshop.

**Pitfalls to avoid:**
- Treating ICE scores as precise.
- The PM scoring alone. Re-score with the client and the engineering lead.
- Keeping ICE after the pilot. Switch to RICE once funnel data exists.

---

## 3. MVP boundary (MoSCoW)

### Must: launch-blocking (P0)

| ID | Capability | Why it's a Must |
|---|---|---|
| M1 | Progressive quote survey (order per `lead-lifecycle-and-purchase-rules.md` §2), saved progress, back navigation, helpful errors, confirmation page | Core consumer loop [B] |
| M2 | Versioned consent and disclosures, plus an immutable consent evidence record | Legal exposure (TCPA and state laws), counsel item |
| M3 | Lead quality: Turnstile, phone and email validation, duplicate grouping, risk score → `needs_review`, blocklists | Movers won't pay for junk; protects the sharing limit (enforced in DB) |
| M4 | Matching (coverage rules, capabilities, exclusions) with an eligibility and coverage re-check at purchase time | Core loop; brief §5. The engine exists in `packages/core`. The re-check inside `reserve_purchase` is still to build. |
| M5 | Marketplace: allow-list previews, per-company price, buyer count / max, credit-policy note, realtime availability | Core loop; privacy |
| M6 | Purchase: saved card plus explicit authorization for future charges, off-session charge, idempotency, disclosure only after payment success, signed webhooks, auto-refund on late success | Money integrity. Core is tested at the DB level. |
| M7 | Ledger: charges, credit spends, sharing credits (approved policy), quality refunds as credit, cash refunds, adjustments; receipts; daily reconciliation | Auditable finances [B] |
| M8 | Mover application, FMCSA checks (admin-assisted fallback), admin review, approval effects, weekly re-check, automatic suspension on credential failure | The movers-only promise |
| M9 | Company portal core: coverage editor, marketplace, purchased leads (search, sort, filter), lead detail, CRM list view (stages, notes, assignment, follow-up date), teams with owner/manager/agent/billing roles, billing (payment methods, receipts, credits) | Brief §9; the free CRM is the incentive |
| M10 | Admin core: companies and verification queue, append-only pricing, sharing and credit policy versions plus the maximum limit, leads (validation and consent records, duplicates, expiry), disputes, refunds and adjustments, audit log viewer, reconciliation exceptions, complaint and report cases | Brief §10 |
| M11 | Public site core: home, priority-market state and city pages (gated by coverage and the publishing checklist), Preferred Movers directory and profiles (no fabricated ratings; "New to our network"; "No customer reviews yet"), trust pages, "Buy moving leads" page, technical SEO baseline, portals noindexed and behind auth | Acquisition plus trust; addendum §3 and §5 |
| M12 | Consumer email naming each mover that received their details; opt-out and withdrawal propagated to every purchasing mover | Addendum §5 ("which companies receive"); compliance facts §3 |
| M13 | Measurement: privacy-safe funnel events, server-side attribution capture, revenue / sell-through / time-to-first-purchase reports | Brief §14 |
| M14 | Security and operations: admin MFA, server-side authorization plus RLS, rate limits, backups with point-in-time recovery and a restore drill, audit logs, error monitoring, secrets management, retention schedule | Brief §14; launch acceptance |

**Trust pages (M11):**
- How We Verify Movers
- Movers vs Brokers
- How AMC Makes Money / Advertising Disclosure
- Which Companies Receive My Request
- Review Methodology
- Complaints & Reporting
- Privacy
- Consumer Terms
- Mover Terms

### Should: at launch, or within 6 weeks of launch (P1)

| ID | Capability | ICE | Note |
|---|---|---:|---|
| S1 | Authorized CSV exports (role-gated, audited, purchased leads only) | 384 | A brief requirement; cheap once authorization helpers exist |
| S2 | Manage-my-request page via magic link (withdraw, lower the limit, see recipients) | 343 | Trust; duplicate handling |
| S3 | SMS new-lead alerts to companies | 336 | Speed-to-lead. Needs Twilio A2P 10DLC registration, which has lead time. |
| S4 | CRM tasks and email reminders | 294 | |
| S5 | Monthly statements and downloadable invoices | 280 | |
| S6 | Ungated cost estimator with stated assumptions, sources and date | 240 | **Strategic override ↑:** calculators are the competitors' strongest traffic family [K] |
| S7 | Public USDOT/MC lookup tool | 216 | KD 18 / 4.4k searches [K]. Reuses the FMCSA client. Check the API terms allow public display. |
| S8 | City-to-city route pages, gated on real coverage and data | 216 | Long-tail KD 10–15 [K] |
| S9 | CRM pipeline (kanban) view, deal value, lost reasons | 210 | A brief requirement |
| S10 | Saved views (marketplace and purchased leads) | 196 | |
| S11 | Review collection and reputation: platform-sent invitations, secure links, evidence upload, moderation, responses, reports | 168 | **Strategic override ↑:** trust is the core of the positioning, and invitations depend on purchases accumulating, so start at launch. The no-fake-rating display, the methodology page and the report channel are already Musts (M11). |
| S12 | Compressed video module with captions and transcript on conversion pages | 150 | A brief requirement; depends on the production budget |

### Could: next releases (P2)

| ID | Capability | ICE | Note |
|---|---|---:|---|
| C1 | Configurable CRM stages (rename, reorder, add, mapped to system stages) | 144 | A brief requirement. Default stages ship in the MVP. |
| C2 | Agent spend limits or purchase approval | 120 | Depends on L4 (who buys) |
| C3 | Rating trends and reputation analytics | 108 | |
| C4 | Prepaid credit top-ups by ACH bank debit | 80 | ACH isn't final for about 4 business days and returns are possible later (compliance facts §7). Only as prepaid balance, never to release contact details instantly. |
| C5 | ZIP pages, only where meaningfully differentiated | 60 | |

### Won't (this release)

| Item | Note |
|---|---|
| Auto-buy rules | ICE 96. Revisit after L4. |
| Inventory builder | ICE 60 |
| Bidding | Excluded by the brief |
| Consumer–provider messaging | Excluded by the brief |
| Native apps | Section 7 |
| Paid placement | Not at launch |
| Standalone car-shipping and truck-rental lead sales | Section 6 |
| Stripe Connect payouts | No payouts needed |
| Multilingual | No alternate-language versions planned |
| Public API | |
| Customer stories | They need real, permissioned customers first |

### ICE scoring assumptions

**Scale:** Impact (1–10) is the effect on G1–G5. Confidence (1–10) is evidence strength: [K] or [R] evidence ≥ 6; [H] only ≤ 5. Ease (1–10) is the inverse of effort for a 2-engineer team.

**Scored by:** PM alone. **Must be re-scored with the client and the engineering lead before Phase 4 starts.**

---

## 4. Now / Next / Later (outcome-framed)

| Horizon | Epic | Hypothesis | Success signal |
|---|---|---|---|
| **Now** (Phases 1–5) | **E-A Controlled quote request** | We believe that letting consumers set the maximum number of movers, naming the eligible movers at consent, and checking coverage before asking for contact details will raise completion and cut complaints, because loss of control is the top consumer pain. | Start→submit rate; complaint rate per 1,000 leads |
| Now | **E-B Verified-carrier marketplace** | We believe exclusive and capped leads from verified carriers only will drive ≥ 60% 30-day repeat purchase, because oversold and brokered leads are the top mover pain. | Repeat purchase; dispute rate |
| Now | **E-C Transparent shared-lead credits** | We believe automatic, formula-based credits will make movers willing to buy shared leads at their shared price, because later sharing no longer feels like a penalty. | Shared-slot fill rate; credit-policy comprehension (L2) |
| **Next** (Phases 6–8) | **E-D Free core CRM** | We believe a built-in CRM will raise activation and retention, because leads stop getting lost in email. | Share of purchased leads moved past "New" within 48h; 90-day company retention |
| Next | **E-E Reputation with evidence labels** | We believe evidence-labelled reviews sent by AMC will raise consumer trust and profile conversion. | Profile → request conversion; review volume per purchased lead |
| Next | **E-F Priority-market content** | We believe data-led, coverage-gated state, city and route pages will earn qualified organic leads within 3–6 months. | Organic qualified leads by page family |
| **Later** | Auto-buy and budgets · CRM add-ons (section 5) · inventory builder · ACH top-ups · native apps (if section 7 criteria are met) · evaluation of an auto-transport carrier network · state-licensed local-mover track (if the owner decides; DEP-19) | | |

**Dependencies that shape the sequence:**
- E-B and E-C need the owner's approval of the credit policy (DEP-01) and the prices (DEP-03) before live billing.
- E-A needs counsel-approved consent wording (DEP-07) before real leads are captured.
- E-F needs approved movers in each market before city pages are indexed (DEP-18).

The full plan is in `backlog.md`.

---

## 5. CRM: free core vs future paid add-ons

The core CRM is free and is the incentive [B]. In the MVP, every feature is available to every approved company with **no plan gating in the UI**. As architectural insurance (P2), the data model includes a `company_entitlements` table and feature flags, so add-ons can be gated later without migrations.

**Free core (MVP):** default stages (New → Contacted → Qualified → Quote Sent → Follow-up → Booked → Completed / Lost), list view, notes and activity history, assignment, follow-up date, and lost reasons. Pipeline view, tasks and reminders, deal value and exports follow as Shoulds, all free.

**Paid add-on candidates (later; validate demand in interviews first):**

| Add-on | Why it could be paid | Extra dependency |
|---|---|---|
| Click-to-call with call tracking and recording | Per-minute and number costs | Telephony provider; call-recording consent laws vary by state (counsel) |
| SMS conversations from the platform | Per-message cost | A2P 10DLC campaign for movers; consent propagation |
| Automated follow-up sequences (email or SMS) | Labour saving | Consent and opt-out handling |
| Estimate and quote documents with e-signature | Replaces separate tools | E-sign provider; FMCSA estimate rules for interstate (counsel) |
| Booking deposits and payments | Revenue share possible | **Stripe Connect** (payouts to movers), which is not needed today |
| Crew scheduling and dispatch calendar | Operational depth | Likely tips the native-app decision |
| Advanced analytics (source ROI, close-rate benchmarks across anonymized peers) | Data value | Aggregation thresholds for privacy |
| Integrations (moving-software CRMs, webhooks, Zapier) | Saves time for larger carriers | API and webhook platform |
| Multi-branch or multi-location management | Larger carriers | Role model extension |
| Reputation widgets for the mover's own site | Marketing value | Must show reviews unaltered |

---

## 6. Adjacent intents: car shipping and truck rental

The brief asks to include people shipping cars or renting trucks. The addendum then restricts buyers to approved moving carriers. MVP handling:

| Consumer intent | MVP handling | Lead sold? |
|---|---|---|
| Household move **plus** a vehicle | An optional "I also need to ship a vehicle" service in the survey. Matched only to approved movers whose verified capabilities include `auto_transport` that they perform themselves. | Yes, under normal rules |
| Loading or unloading help only (DIY with a rental truck) | The `labor_only` service, matched only to approved movers offering it | Yes, under normal rules |
| **Standalone** vehicle shipping | An informational path: how to verify an auto transporter (carrier vs broker for vehicles) and what affects cost. The page states plainly that AMC doesn't currently match standalone vehicle shipments. Optional "notify me when available" with its own consent. | **No** |
| Truck rental | An informational path: renting vs hiring a mover, cost comparison with stated assumptions. Offers a mover quote request if the consumer changes their mind. | **No** (no rental lead resale) |

**Survey entry:** "What do you need help with?" offers:
- Household move: local / long-distance
- Ship a vehicle only
- Rent a truck
- Loading help only

The two information-only intents never reach the contact step.

**Later:** evaluate a separately verified **auto-transport carrier** network (carriers only, the same verification standard) if demand and supply data justify it. Truck-rental affiliate partnerships would be clearly disclosed.

---

## 7. Native mobile apps: evaluation

**Recommendation:** a responsive web portal plus a **PWA** first.

**PWA scope:**
- Installable from the browser.
- Web push for new-lead alerts, alongside email and SMS. iOS supports web push for home-screen web apps; confirm current platform behaviour during Phase 6.
- The marketplace and lead detail are optimized for one-handed use.

**Revisit native apps when at least 2 of these hold for 2 consecutive months:**
1. ≥ 50% of lead purchases happen on mobile devices.
2. Median time from lead availability to first view for mobile-first buyers stays above the target despite web push. The pilot sets the target.
3. ≥ 40% of interviewed or active movers ask for an app unprompted.
4. A roadmap add-on needs device capabilities the web handles poorly: native dialer call logging, background location for crews, offline use.
5. App-store presence is shown to help mover acquisition.

**Rough cost when triggered:** a React Native (Expo) company app reusing the TypeScript domain package and APIs. About **8–12 engineer-weeks** for marketplace, lead detail, CRM basics and push. Then about 0.5 engineer-weeks a month for maintenance and store releases. Consumer apps are not recommended: moving is infrequent, so the consumer job is served by the web.

---

## 8. Success metrics

**Leading indicators (days to weeks):**
- Survey: start, each step, contact-step drop-off, submit.
- Validation pass rate and reasons for rejection or review.
- Share of leads with ≥ 1 eligible buyer; share unmatched.
- Time to first purchase (median, P90); slot fill rate within 24h.
- Approved → first purchase within 14 days.
- Purchase errors (declines, authentication required).
- Dispute rate.

**Lagging indicators (weeks to months):**
- Repeat purchase and company retention at 30, 60 and 90 days.
- Net revenue per lead after credits, refunds and fees.
- Contribution margin by acquisition source.
- Organic landing sessions and qualified leads by page family.
- AI referral sessions and documented citations (measured through a recorded query sample; see SEO docs).
- Profile → request conversion.
- Review volume per purchased lead.

**Rules:**
- No personal contact information in analytics payloads.
- Attribution evidence (click IDs, UTMs, referrer) is stored separately from inferred source categories.
- Prelaunch lab numbers are reported separately from field data.

---

## 9. Open questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| 1 | Approve the shared-lead credit policy and factor schedule | Client | Yes, before live billing |
| 2 | Initial exclusive and shared price per company (or per market and move type) | Client | Yes, before live billing |
| 3 | Maximum selectable number of companies (default proposal in business rules) | Client | Yes, before Phase 4 copy freeze |
| 4 | Quality-claim policy: reasons, window (72h proposed), evidence | Client + counsel | Yes, before live billing |
| 5 | Keep MC required, or add a state-licensed local track? Serve local moves at launch? | Client (business-rules decisions #1–2) | Yes, before launch-market confirmation |
| 6 | Consent wording, marketplace legal classification, privacy ("sale" of personal information under state laws), retention, review policy | Counsel | Yes, before real lead capture |
| 7 | Launch markets (research recommends TX + FL first; `keyword-research.md` §4) | Client | Yes, before Phase 7 content |
| 8 | Pilot payment approach: live card at pilot prices or manual invoice | Client + counsel | Yes, before the pilot |
| 9 | Sales tax on lead sales; accounting for the credit liability | Accountant | Before live billing |
| 10 | Photography and video budget (licensed vs original) | Client | Before Phase 7 media |
| 11 | Named authors and reviewers with truthful credentials | Client | Before publishing guides |
| 12 | FMCSA QCMobile WebKey and network allowlisting for the dev environment | Engineering + client | Before Phase 6 automation (admin-assisted fallback available) |

---

## 10. Timeline considerations

**Hard dependencies, not engineering effort, set the earliest launch date:**
- Counsel sign-off on consent and classification.
- Stripe live activation.
- Twilio A2P 10DLC registration (SMS only).
- Recruiting enough approved movers in each launch market.
- Content production throughput.

Estimates and the critical path are in `backlog.md`.
