# Phased Backlog: American Moving Choice

**Status:** draft v1 · 2026-10-27 · Owner: Product. Re-baseline after client decisions and mover interviews.

**Related:**
- `docs/product/mvp-scope.md` (MoSCoW, ICE)
- `docs/product/jtbd-and-journeys.md`
- `docs/business-rules/*` (rules this backlog implements)
- `docs/research/compliance-and-platform-facts.md`
- `docs/seo/*` and `docs/design/*` (page-level and visual detail owned there)

**Skills applied:**
- `user-story`: Mike Cohn format plus Gherkin. One When and one Then per scenario. Enablers are written as tasks, not fake user stories.
- `roadmap-planning`: dependencies, sequencing, Now/Next/Later.
- `write-spec`: P0/P1/P2 priorities, exit criteria.
- `prioritization-advisor`: priorities come from `mvp-scope.md` §3.

---

## 0. Conventions and team assumptions

**Team (assumed):**

| Role | Allocation |
|---|---|
| Full-stack engineers (Next.js / TypeScript / Postgres) | 2 full-time |
| Product designer | 0.5 |
| SEO/content strategist (plus freelance writers, budget-dependent) | 0.5 |
| QA | 0.25 |
| Client-side product owner | about 0.25 |

Counsel and an accountant review externally. AI agents assist, but every estimate assumes a human reviews and owns the work.

**Units:**
- **ew** = engineer-week (one engineer, one focused week, including tests and code review).
- Story sizes: **S** ≤ 0.5 ew, **M** 0.5–1.5 ew, **L** 1.5–3 ew.
- Phase ranges exclude time spent waiting on the client, counsel or vendors.

**Priority:** P0 = Must, P1 = Should, P2 = Could. These map to `mvp-scope.md` IDs (M1–M14, S1–S12, C1–C5).

**IDs:**
- Dependencies: `DEP-xx` (§1).
- Acceptance scenarios: `AS-xx` (§11).
- Stories: `phase.epic.story`.

**Story format:** "As a … I want to … so that …", then `Given … · When … · Then …` scenarios.

---

## 1. External dependencies and client decisions

| ID | Dependency | Needed by | Owner | Status / lead time |
|---|---|---|---|---|
| DEP-01 | Approve the shared-lead credit policy and factors (`shared-pricing-and-credits.md` §9) | P5 live billing | Client | Open |
| DEP-02 | Maximum selectable number of companies | P4 copy freeze | Client | Open |
| DEP-03 | Initial exclusive and shared price per company (or per market and move type) | P5 live billing | Client (informed by L1) | Open |
| DEP-04 | Quality-claim / refund policy: reasons, window (72h proposed), evidence | P5 | Client + counsel | Open |
| DEP-05 | Launch markets (research suggests TX + FL first) | P6 recruiting, P7 content | Client | Open |
| DEP-06 | Production domain, DNS access, approved brand files. **Only a raster logo exists** (`brand/logo-source.webp`); a vector master is needed | P3, P7 | Client | Open |
| DEP-07 | Counsel review (scope below) | P4 go-live (real leads), P8 | Counsel | Not started; typically several weeks |
| DEP-08 | Stripe account. Test mode now; **live mode needs business verification** | P5 | Client | Open |
| DEP-09 | FMCSA QCMobile WebKey, open-data access, and network allowlisting (fmcsa.dot.gov is **blocked** in the current dev environment) | P6 automation (admin-assisted fallback available) | Client + engineering | Open |
| DEP-10 | Twilio account (Lookup) and **A2P 10DLC brand and campaign registration** for SMS | P4 (Lookup), P5/P6 (SMS) | Client | Open; registration takes days to weeks |
| DEP-11 | Email provider plus SPF/DKIM/DMARC on the domain | P4 | Client + engineering | Open |
| DEP-12 | Supabase and Vercel organizations, billing, dev/staging/prod | P2 | Client | Open |
| DEP-13 | Continued Semrush access; Google Search Console, Bing Webmaster, GA4 | P7 | Client | Semrush works today |
| DEP-14 | Cloudflare Turnstile keys; Sentry and PostHog accounts | P2/P4 | Engineering | Open |
| DEP-15 | Photography and video: budget, licensed library or shoot | P3, P7 | Client | Open |
| DEP-16 | Named authors and reviewers with truthful credentials; editorial policy sign-off | P7 | Client | Open |
| DEP-17 | Accountant (scope below) | P5 live billing | Client | Open |
| DEP-18 | Mover recruitment in launch markets: at least N approved movers per market before city pages are indexed (N set in the SEO publishing checklist) | P6–P7 | Client (business development) | Open: **critical path** |
| DEP-19 | MC policy: keep "USDOT + MC required", or add a state-licensed local track (business-rules decision #1) | P6, P7 | Client | Open |
| DEP-20 | Consent-certificate approach: third-party certificate or self-hosted evidence only | P4 | Client + counsel | Open |
| DEP-21 | Geographic dataset choice and licence: Census ZCTA and county files plus the HUD-USPS ZIP crosswalk, or a commercial ZIP database | P4 | Engineering + client (if paid) | Open |

**DEP-07 counsel scope:**
- Consent wording.
- Marketplace classification: broker risk (compliance facts §2).
- Privacy policy and state privacy law (the "sale" of personal information and opt-out).
- Consumer and mover terms: no resale or brokering; honoring opt-outs.
- Review policy.
- Retention schedule.

**DEP-17 accountant scope:**
- Sales tax on lead sales by state.
- Accounting for the credit liability.
- Unclaimed-property treatment of credits.

---

## 2. Status of Phases 1–2

### Phase 1: Discovery, assumptions, business rules, research

| Item | Status | Evidence / gap |
|---|---|---|
| Business-rule drafts (lifecycle, matching, disclosure, purchase, pricing and credits, verification, reviews) | **Done (draft)** | `docs/business-rules/*.md` |
| Reference-site research matrix | **Done, with a limitation** | `docs/research/reference-matrix.md`. Sites could not be browsed directly from this environment, so the findings come from search excerpts. Pending: a human walkthrough of competitor quote flows to record step order and consent text. |
| Keyword and competitor research | **Done** (Semrush US, 2026-10-27) | `docs/research/keyword-research.md` (gaps listed in its §5) |
| Compliance and platform facts | **Done** (search-excerpt based; [confirm] items open) | `docs/research/compliance-and-platform-facts.md` |
| JTBD, journeys, discovery plan | **Done** (hypothesis level) | `docs/product/jtbd-and-journeys.md` |
| MVP scope and prioritization | **Done** (PM-scored draft) | `docs/product/mvp-scope.md` |
| Mover interviews, consumer usability tests | **Not started** | Needs recruiting (`jtbd-and-journeys.md` §6) |
| Client decisions DEP-01–05, DEP-19 | **Open** | Consolidated questions in the discovery brief |
| Counsel engagement | **Not started** | DEP-07 |

### Phase 2: Specification, architecture, data model, roadmap

| Item | Status | Evidence / gap |
|---|---|---|
| Stack decision | **Made** | Next.js on Vercel, Supabase Postgres, Payload CMS, Stripe, background jobs and outbox |
| Core domain package | **Done.** 22 unit tests passing (re-run 2026-10-27) | `packages/core/src` (matching, sharing/credit calculator, preview redaction, dedupe helpers, ZIP-as-string) |
| Marketplace core schema and purchase functions | **Done.** 14 Postgres integration tests passing (re-run 2026-10-27) | `db/migrations/001_marketplace_core.sql`, `db/test/purchase.test.ts` |
| MC requirement as a platform setting | **Done** | `platform_settings.require_mc_number`, tested |
| Coverage and capability re-check inside `reserve_purchase` | **Gap** | The reservation re-checks eligibility, sale window, cap and duplicates, but **not coverage**. Story 5.1.2. |
| Group status and limit re-check inside `complete_purchase` for in-flight reservations | **Gap** | A withdrawal or a duplicate-lowered limit during a pending payment is not re-checked. Stories 5.3.7 and 5.3.8. |
| Full data model (rest of the schema; see 2.4) | **Pending** | Task 2.4 |
| Environments, CI, auth and tenancy skeleton, ADRs, roadmap with dates | **Pending** | Tasks 2.2–2.9 |

---

## 3. Phase summary

| Phase | Goal | Engineering (ew) | Design | Content / SEO | Calendar weeks* | Exit gate |
|---|---|---:|---|---|---|---|
| 1 Discovery | Validated rules, pricing and policy recommendation | 0–1 (plus 1.5–2.5 PM/research weeks) | — | — | W1–4 | Decisions logged; interview readout |
| 2 Spec and architecture | Buildable spec and production-shaped skeleton | 3–5 | — | — | W1–5 | CI green; staging deployed; RLS tests pass |
| 3 Brand and designs | One coherent system plus representative screens | 2–3 | 4–6 design-weeks | — | W3–10 | Design sign-off; usability round 1 |
| 4 Intake and validation | Valid, consented requests become sellable lead groups | 6–8 | in P3 | copy | W5–11 | E2E in staging; counsel copy sign-off |
| 5 Matching, purchase, payments, credits | Safe purchases with correct money movement | 7–10 | in P3 | — | W9–16 | AS-01–07, AS-10, AS-22–27 green at API level (Stripe test mode) |
| 6 Portals, CRM, teams, verification, reviews | Movers self-serve; ops run without engineers | 12–16 | 1–2 | — | W12–22 | Onboarding E2E without engineering help |
| 7 Content, SEO, rollout | Gated priority-market pages, trust content, measurement | 6–8 | 1 | 10–16 content-weeks + 3–5 SEO weeks | W8–24 | Batch 1 published; AS-11, 12, 18, 21 green |
| 8 Launch validation and handover | Proven production readiness | 4–6 | — | — | W23–27 | Launch checklist complete |
| **Total** | | **40–57 ew** (+15% contingency → **46–66 ew**) | **6–9 design-weeks** | **10–16 content-weeks** | **≈ 26–30 weeks to batch-1 launch** | |

\*Calendar weeks assume 2 engineers working in parallel, overlapping phases, and decisions arriving on time.

**Pilot:** a one-market pilot is possible around **W15–18**. It needs Phase 4, Phase 5 and an admin-assisted subset of 6.1, plus counsel sign-off.

**Bottlenecks:**
- **Design at 0.5 FTE** makes Phase 3 a long pole. Recommendation: 1.0 FTE from W2 to W8, sliced so survey designs land first.
- **Content at 0.5 FTE** can't produce 10–16 content-weeks inside the plan. Freelance writers, or a smaller batch 1, are needed (§12).

---

## 4. Phase 1: Discovery (remaining tasks)

**Goal:** turn hypotheses into decisions before build-heavy phases commit money.

| Task | Acceptance | Deps |
|---|---|---|
| 1.1 Collect answers to the consolidated questions | DEP-01–05 and DEP-19 are decided, or deferred with a date, in a decision log | Client |
| 1.2 Mover interviews (8–12) and synthesis | L1–L5, L8, L9 answered with evidence. JTBD [H] tags updated. Price and policy recommendation written | Recruiting |
| 1.3 Consumer usability round 1 on the Phase 3 prototype | L6 and L7 answered. Copy changes logged | 3.6 |
| 1.4 Human walkthrough of competitor quote flows | Step order, consent text and recipient counts recorded with screenshots for at least 6 references | Browser access outside this environment |
| 1.5 Counsel kickoff | Question list from compliance facts sent. Review dates agreed | DEP-07 |
| 1.6 FMCSA supply analysis for candidate markets | Per market: count of active household-goods carriers with no broker authority, and how many also serve local moves | DEP-09 |

**Estimate:** 1.5–2.5 PM/research weeks, 0–1 ew.

**Exit:** a pricing and credit policy recommendation ready for approval, and a market shortlist with supply numbers.

---

## 5. Phase 2: Specification, architecture, data model, roadmap

**Goal:** a buildable spec and a skeleton that already behaves like production.

| Task | Acceptance | Size | Deps |
|---|---|---|---|
| 2.1 Spec sign-off and change control | Business rules, backlog and architecture reviewed with the client. Change requests logged with a scope trade | S | Client |
| 2.2 Environments | dev/staging/prod Supabase projects and Vercel projects with preview deployments. Secrets live only in server configuration. Protected `main` | S | DEP-12 |
| 2.3 CI pipeline | Required checks on every PR: lint, typecheck, `packages/core` tests, `db` tests on ephemeral Postgres 16, migration apply check, preview deploy | M | 2.2 |
| 2.4 Full data model migrations (scope below) | Each tenant table has an RLS policy **and** a cross-company isolation test | L | 2.1 |
| 2.5 Auth and tenancy skeleton | Supabase Auth; admin MFA; membership-based roles; a server-side `requireRole` helper; per-request `app.company_id` context. A test proves company A's session can't read company B's rows through the API or SQL | M | 2.4 |
| 2.6 Audit log foundation | Append-only table. Every privileged action writes actor, action, target, before/after and request ID. No UPDATE or DELETE grants | S | 2.4 |
| 2.7 Observability | Error monitoring, structured logs, request IDs, alert routing | S | DEP-14 |
| 2.8 ADRs (topics below) | Each ADR states the decision, alternatives and consequences | S | — |
| 2.9 Roadmap v1 with dates | Now/Next/Later from `mvp-scope.md` §4, with dates once DEPs are known | S | 1.1 |

**2.4 data model scope:**
- Memberships and roles
- Coverage-rule tables mirroring `packages/core` types
- Lead lifecycle states (business rules §1)
- Consent records
- Attribution
- CRM (stages, activities, tasks)
- Verification evidence
- Reviews
- Complaints and cases
- Notifications and outbox
- Geography
- Media
- Content references
- Audit log

**2.8 ADR topics:**
- Card-instant vs ACH-prepaid payments.
- Background jobs and outbox.
- Payload inside the Next app.
- Realtime via broadcast with no personal data.
- Matching in SQL vs a service.

**Estimate:** 3–5 ew.

**Exit:** CI green, staging deployed, ERD reviewed, auth and RLS isolation tests passing for two test companies.

---

## 6. Phase 3: Brand system and representative designs

**Goal:** one coherent visual system and representative public, company and admin screens that pass accessibility checks and support usability tests. The visual direction is owned in `docs/design/*`.

| Task | Acceptance | Deps |
|---|---|---|
| 3.1 Design tokens (colour from the logo, sampled at navy `#063167` and red `#E0141C`; type scale; spacing; radii; elevation; motion with reduced-motion variants) | Body-text pairs ≥ 4.5:1 contrast; large text and UI components ≥ 3:1; focus indicator ≥ 3:1 against adjacent colours | — |
| 3.2 Component library in code | Keyboard operable, visible focus, no horizontal scroll at 320px, touch targets ≥ 24×24px (44px preferred for primary actions), catalogue route for review | 3.1 |
| 3.3 Representative public designs (list below) | Approved by client; mobile and desktop | 3.1 |
| 3.4 Representative company-portal designs (list below) | Approved | 3.1 |
| 3.5 Representative admin designs (list below) | Approved | 3.1 |
| 3.6 Clickable prototype for usability tests | Supports the tasks in `jtbd-and-journeys.md` §6.3 | 3.3 |
| 3.7 Brand asset production | Vector logo master approved by the client (recreated from the raster only with client approval), favicon set, social images | DEP-06 |
| 3.8 Photography, video and licensing plan | Every asset is licensed or original. Generated imagery is never presented as real staff, customers, offices or moves | DEP-15 |

**3.3 public screens:**
- Home: hero, survey entry, video module
- City page
- Route page
- Company profile in three states: with reviews / no reviews / new to network
- Preferred directory
- Trust-page template
- Survey steps
- Confirmation

**3.4 company-portal screens:**
- Marketplace list and preview card
- Purchase states: in progress / sold out / declined / success
- Lead detail
- CRM list and pipeline
- Billing and credits
- Coverage editor
- Team management

**3.5 admin screens:**
- Verification queue and evidence view
- Pricing
- Lead review
- Claims
- Audit log

**Estimate:** 4–6 design-weeks, 2–3 ew (3.1, 3.2).

**Exit:** design sign-off; usability round 1 completed on the prototype.

---

## 7. Phase 4: Consumer intake and lead validation

**Goal:** a consumer can submit a valid, consented request that becomes a sellable lead group. Production capture of real leads waits for counsel's copy sign-off (DEP-07).

### Epic 4.1 Survey flow (M1)

**4.1.1 Tell us what you need** · P0 · S
- **As a** visitor, **I want to** say whether I need a household move, vehicle shipping only, a truck rental, or loading help, **so that** I get the right path without handing over contact details for something AMC can't serve.
- Given I pick "Ship a vehicle only" · When I continue · Then I land on the informational vehicle-shipping path and no contact step is shown (`mvp-scope.md` §6).
- Given I pick "Household move" · When I continue · Then the origin step loads with my choice saved.

**4.1.2 Enter origin and destination** · P0 · M · AS-09 · DEP-21
- **As a** consumer planning a move, **I want to** enter where I'm moving from and to by ZIP or city, **so that** only movers who serve my route are considered.
- Given I am on the origin step · When I enter "02108" · Then it resolves to Boston, MA and is stored as the string "02108".
- Given I type an ambiguous city such as "Springfield" · When I select it · Then I must confirm the state, and a ZIP set is resolved before I can continue.
- Given I enter a non-US or unknown ZIP · When I continue · Then I see a specific message that we can't serve that location yet, and nothing else is collected.

**4.1.3 Move date or flexible range** · P0 · S
- **As a** consumer, **I want to** give an exact date or a flexible window, **so that** movers know whether they can take the job.
- Given today is 2026-10-27 · When I pick a date in the past or more than 12 months out · Then inline validation explains the allowed range.

**4.1.4 Move size and services** · P0 · S
- **As a** consumer, **I want to** describe my home size and the services I need (packing, storage, specialty items, vehicle add-on, loading help only), **so that** matched movers can actually do the job.
- Given I select "I also need to ship a vehicle" · When I continue · Then the lead records the `auto_transport` service for matching.

**4.1.5 Progress, back navigation, saved progress** · P0 · M
- **As a** consumer on a phone, **I want** my answers kept when I go back or reload, **so that** I don't start over.
- Given I completed three steps · When I press back twice and then forward · Then every answer is still filled in and the progress indicator is correct.
- Given I haven't reached the contact step · When I reload · Then answers come back from session storage plus a server draft keyed by an anonymous ID, and no contact data exists server-side.

**4.1.6 Coverage pre-check before contact details** · P0 · S · *recommended; confirm with the business-rules owner*
- **As a** consumer, **I want to** know before giving my details whether verified movers serve my move, **so that** I don't share contact information for nothing.
- Given no approved mover matches my route, size and services · When I finish the services step · Then I see an honest "no participating movers serve this route yet" message with guides and an optional, separately consented "notify me". The contact step is never shown.
- Given coverage disappears between the pre-check and submission · When I submit · Then the lead becomes `unmatched` and the confirmation page says so honestly.

### Epic 4.2 Contact, sharing limit and consent (M1, M2)

**4.2.1 Explain why we need contact details** · P0 · S · DEP-07
- **As a** consumer, **I want to** understand who receives my contact details, when, and why, **so that** I can choose to share them.
- Given I reach the contact step · When it renders · Then a plain-language explanation appears above the first contact field.

**4.2.2 Enter name, email and phone with helpful validation** · P0 · M · DEP-10, DEP-11
- **As a** consumer, **I want** mistakes in my contact details caught kindly, **so that** movers can actually reach me.
- Given I enter a disconnected or impossible phone number · When I leave the field · Then I see a specific correction message and can't continue until it's fixed.
- Given I enter an email on a domain with no MX record · When I leave the field · Then I'm asked to check the address.

**4.2.3 Choose how many companies** · P0 · S · DEP-02
- **As a** consumer, **I want to** choose how many moving companies can receive my request, **so that** I control how many calls I get.
- Given I submitted my contact details · When the question "How many moving companies would you like to hear from?" appears · Then I can choose 1 up to the admin maximum, with the explanation that this is a maximum and not a guarantee of quotes, and that 1 means exclusive.

**4.2.4 Consent with named eligible movers** · P0 · M · DEP-07, DEP-20
- **As a** consumer, **I want to** see exactly which movers may contact me before I agree, **so that** my consent is informed.
- Given I am on the review step · When it renders · Then it shows: the eligible participating movers by name (the profile company first for profile-origin requests), my chosen maximum, the movers-only statement, how AMC makes money, and an **unchecked** consent box separate from the submit button.
- Given I don't tick the consent box · When I press submit · Then nothing is shared and I'm offered the Preferred Movers directory instead.

**4.2.5 Record consent evidence** · P0 · M
- **As an** AMC compliance owner, **I want** an immutable record of every consent, **so that** we and buying movers can prove what the consumer agreed to.
- Given a consumer submits with consent · When the lead is created · Then the record stores: wording version ID and full rendered text, UTC timestamp, IP, user agent, page URL, checkbox state, named movers shown, selected limit, form-state hash and, if used, a certificate ID. The record has no update path and a retention of at least the counsel-approved period (compliance facts §3).

**4.2.6 Confirmation page** · P0 · S
- **As a** consumer who just submitted, **I want to** know what happens next, **so that** I'm not surprised by calls.
- Given my lead is qualified · When the confirmation page loads · Then it shows: the maximum number of companies, that I'll be emailed the name of each mover that receives my details, how to withdraw or lower the limit, and support contacts.

### Epic 4.3 Lead quality (M3)

**4.3.1 Bot defence** · P0 · S · DEP-14
- **As a** buying mover, **I want** automated junk blocked, **so that** I don't pay for fake leads.
- Given a submission fails Turnstile, fills the honeypot, or completes faster than the minimum time · When it's processed · Then it's rejected with a neutral message and the reason is stored.

**4.3.2 Risk scoring and review queue** · P0 · M
- **As an** ops analyst, **I want** borderline submissions held for review, **so that** suspicious leads never reach the marketplace unchecked.
- Given a submission scores above the review threshold (datacenter IP, velocity, geography mismatch) · When validation finishes · Then the lead enters `needs_review` with the reasons visible to admins and is not listed.

**4.3.3 Duplicate detection and grouping** · P0 · M · AS-07
- **As a** consumer, **I want** a repeat submission recognized, **so that** my details aren't spread further than I chose.
- Given I submitted the same route within 30 days with the same phone or email · When I submit again · Then the new lead joins my original group, the group limit becomes the lower of my choices, I'm told we already have my request, and the group is never sold beyond that limit.

**4.3.4 High-risk-only SMS code** · P1 · S · DEP-10
- **As an** honest consumer, **I want** extra verification only when something looks off, **so that** most people face no friction.
- Given my submission is high-risk but not rejected · When I submit · Then I'm asked for an SMS code, and only a verified code moves the lead out of review.

**4.3.5 Blocklists and do-not-contact list** · P0 · S
- **As an** ops analyst, **I want** known-fraud and do-not-contact values blocked, **so that** we never sell those requests.
- Given a phone or email is on the do-not-contact list · When a submission uses it · Then it's rejected and never listed.

### Epic 4.4 Consumer transparency (M12, S2)

**4.4.1 Tell me which mover received my details** · P0 · S · *depends on 5.3.1*
- **As a** consumer, **I want** an email each time a mover receives my details, **so that** I know who will contact me.
- Given a mover's purchase of my lead completes · When disclosure is recorded · Then I receive an email naming that mover with a link to its profile, and the email never names other buyers' activity.

**4.4.2 Manage my request** · P1 · M
- **As a** consumer, **I want to** withdraw or lower my limit from a secure link, **so that** I stay in control after submitting.
- Given I open my magic link · When I lower my limit from 3 to 1 · Then no further sales can happen beyond the buyers who already purchased, and the page lists the movers who received my details.

**4.4.3 Propagate withdrawals and opt-outs** · P0 · M · AS-27
- **As a** consumer who changed my mind, **I want** every mover that has my details told to stop contacting me, **so that** my opt-out actually works.
- Given two movers purchased my lead · When I withdraw or reply STOP through AMC · Then the lead leaves inventory immediately, both movers' CRM records are flagged "do not contact" and they're notified, and the action is logged.

### Epic 4.5 Measurement (M13)

| Task | Acceptance |
|---|---|
| 4.5.1 Funnel events | `survey_start`, `step_complete`, `abandon`, `submit`, `validated`, `rejected` are sent with **no** names, emails, phones or street addresses (payload test). |
| 4.5.2 Attribution capture | UTMs, click IDs, referrer and landing page are stored server-side with the lead. The derived source category (Organic Search, Paid Search, Paid Social, Referral, Direct) is stored separately from the raw evidence. |

### Epic 4.6 Lead creation pipeline

**4.6.1 (task)** Qualified lead → matching → `available` or `unmatched`, through the outbox.

| Check | Acceptance |
|---|---|
| Policy lock | The group is created with the sharing-policy version locked |
| Retry safety | Retries never create a second group (idempotent) |
| Unmatched | An unmatched lead is never listed |

**Phase 4 estimate:** 6–8 ew.

**Exit:**
- E2E in staging: a valid submission creates a qualified lead group with a consent record; duplicates are grouped; bots are rejected; the unmatched path is honest.
- Usability round 2 passed.
- Counsel copy sign-off before production capture.

---

## 8. Phase 5: Matching, purchasing, payments and credits

**Goal:** approved companies can buy leads safely, money moves correctly, and everything is proven in Stripe test mode.

### Epic 5.1 Matching and inventory (M4, M5)

**5.1.1 (task) Coverage storage and matching parity** · P0 · M

| Check | Acceptance |
|---|---|
| Parity | Coverage rules are stored relationally. SQL matching returns exactly the same eligible set as `packages/core` `matchCompany` across a shared fixture suite (parity test). |
| Performance | Indexes keep matching under 200 ms P95 for 10k companies (load fixture). |

**5.1.2 Re-check coverage at purchase** · P0 · S · AS-23
- **As a** consumer, **I want** my lead sold only to movers that still serve my move at the moment of purchase, **so that** stale screens can't misroute it.
- Given a company removed the lead's destination state from its coverage after the marketplace loaded · When it tries to reserve the lead · Then the reservation is refused with `not_matching` and nothing is charged.

**5.1.3 Coverage changes are forward-only** · P0 · S · AS-22
- **As a** mover, **I want** coverage edits to change only future availability, **so that** leads I already bought stay mine.
- Given I bought a lead in Florida · When I remove Florida from my coverage · Then the purchased lead and its CRM history are unchanged and new Florida leads stop matching.

**5.1.4 Marketplace inventory API with allow-list previews** · P0 · M · AS-24
- **As an** approved mover, **I want to** see matching leads with enough detail to decide, **so that** I only pay for leads I want.
- Given an available lead matches my coverage · When I load the marketplace · Then each card shows only:
  - first name
  - origin and destination city/state (ZIP where allowed)
  - move date and size
  - source category
  - timestamp
  - exclusive or shared
  - buyer count and maximum
  - my price
  - the credit-policy note

  A response-snapshot test proves no surname, phone, email, street address or notes appear.

**5.1.5 Realtime availability** · P0 · M
- **As a** mover, **I want** buyer counts and availability to update live, **so that** I don't try to buy sold-out leads.
- Given another company buys the last slot · When the broadcast arrives · Then my card shows "Sold out" within 2 seconds. The broadcast payload carries no personal data, and the server still decides any purchase attempt.

**5.1.6 New-lead notifications** · P0 email, P1 SMS · S · AS-24 · DEP-10
- **As a** mover, **I want** to be alerted to new matching leads, **so that** I can respond first.
- Given a lead becomes available and matches my coverage and notification preferences · When the notification is sent · Then it contains preview fields only and a link to the marketplace.

### Epic 5.2 Payment methods (M6)

**5.2.1 Save a card with explicit authorization** · P0 · M · DEP-08
- **As a** mover's billing user, **I want to** save a card and explicitly authorize future lead charges, **so that** purchases are one click.
- Given I add a card · When I confirm · Then a SetupIntent completes, and the authorization text version, timestamp, user and IP are recorded. Purchasing stays locked until a card **and** admin prices exist.

**5.2.2 Manage payment methods** · P0 · S
- **As a** billing user, **I want to** set a default card, remove old ones, and be warned before expiry, **so that** purchases don't fail.
- Given my default card expires in 30 days · When the daily job runs · Then owner and billing roles are emailed.

### Epic 5.3 Purchase (M6)

**5.3.1 Buy a lead** · P0 · L · AS-01, AS-02, AS-04
- **As an** approved mover, **I want to** buy a lead in one action, **so that** I can contact the consumer immediately.
- Given the lead is available and I'm eligible · When I click Buy with a client idempotency key · Then the flow runs:
  1. reserve
  2. apply credit
  3. off-session PaymentIntent (Stripe idempotency key = attempt ID)
  4. complete
  5. disclose

  The contact details appear and the lead lands in my CRM at "New".

**5.3.2 In-progress and sold-out experience** · P0 · S
- **As a** mover, **I want** clear feedback when someone else is mid-purchase or the lead sells out, **so that** I'm not confused or double-charged.
- Given another purchase of the same lead is in flight · When I click Buy · Then the client retries `purchase_in_progress` for up to 5 seconds and then shows either success or "Sold out" without charging me.

**5.3.3 Declines and authentication required** · P0 · M · AS-03
- **As a** mover whose card fails, **I want** a clear prompt and no partial outcome, **so that** I can fix it.
- Given my card is declined or needs authentication off-session · When the purchase is attempted · Then no contact details are revealed, the reservation is released, owner and billing roles are notified, and after 3 consecutive failures purchasing is paused until the card is updated.

**5.3.4 Signed, idempotent webhooks** · P0 · M · AS-04
- **As an** AMC finance admin, **I want** payment notifications processed exactly once, **so that** the ledger never double-counts.
- Given Stripe redelivers `payment_intent.succeeded` three times · When each delivery is processed · Then the signature is verified, `record_payment_event` deduplicates, and exactly one purchase and one charge entry exist.

**5.3.5 Late success is refunded when the slot is gone** · P0 · S
- **As a** mover, **I want** to be refunded automatically if my payment succeeds after the lead sold out, **so that** I never pay for nothing.
- Given my reservation expired and another company took the slot · When my payment success arrives · Then `complete_purchase` returns null, a Stripe refund is issued, a ledger record and notice are created, and no contact details are revealed.

**5.3.6 Sweeper checks the PaymentIntent before expiring** · P0 · S
- **As a** mover, **I want** a slow payment not to lose me the lead unfairly, **so that** confirmations in flight are honored.
- Given my reservation has passed its hold time but my PaymentIntent is still processing · When the sweeper runs · Then the reservation isn't expired until Stripe reports a final state.

**5.3.7 Withdrawal during a pending payment** · P0 · S · AS-27 · *closes a gap found in `complete_purchase`*
- **As a** consumer who withdrew, **I want** no mover to receive my details afterwards, **so that** withdrawal is final.
- Given a reservation is in flight · When I withdraw before the payment completes · Then completion returns no purchase, the payment is refunded, and nothing is disclosed.

**5.3.8 Limit lowered during a pending payment** · P0 · S · AS-07 · *closes a gap found in `complete_purchase`*
- **As a** consumer, **I want** a lowered limit to apply to purchases not yet completed, **so that** my latest choice is respected.
- Given one buyer has purchased and a second reservation is in flight · When my duplicate submission lowers the limit to 1 · Then the second completion is refused and refunded, and the group shows sold out at 1.

### Epic 5.4 Credits, refunds and disputes (M7)

**5.4.1 Automatic sharing credits** · P0 · S · AS-05 · DEP-01
- **As an** earlier buyer of a shared lead, **I want** credits applied automatically when others join, **so that** I pay the published share price.
- Given I bought first at $40.00 shared · When a second company completes a purchase under the approved policy · Then I receive the sharing credit defined in `shared-pricing-and-credits.md`, tied to the triggering purchase.

**5.4.2 Credits pay for future purchases** · P0 · S
- **As a** mover with a credit balance, **I want** credits used before my card, **so that** I get their value without extra steps.
- Given I have $8.00 of credit and two concurrent reservations · When both are priced · Then the credit is held by only one of them (tested at DB level) and the card covers the rest.

**5.4.3 Submit a lead-quality claim** · P0 · M · DEP-04
- **As a** mover, **I want to** dispute an invalid lead with evidence within the window, **so that** I'm not charged for bad data.
- Given I bought a lead 10 hours ago and the number is disconnected · When I submit a claim with reason and evidence · Then a case is opened for admin review and I can track its status.

**5.4.4 Decide a claim** · P0 · M · AS-06
- **As an** AMC finance admin, **I want to** approve a claim as credit (default) or cash refund, **so that** remedies are consistent and auditable.
- Given a disclosed lead's claim is approved · When the refund posts · Then the ledger records it, the refunded purchase stops accruing sharing credits, and the sharing slot is **not** reopened.

**5.4.5 Chargebacks** · P0 · M
- **As an** AMC finance admin, **I want** card disputes recorded and the account paused, **so that** we can respond with evidence.
- Given Stripe sends `charge.dispute.created` · When it's processed · Then a dispute entry is recorded, the company's purchasing is paused, and an evidence pack (consent record, disclosure log, purchase authorization) is assembled.

### Epic 5.5 Financial records and policy (M7, M10)

| Task / story | Acceptance | Size | AS |
|---|---|---|---|
| 5.5.1 Receipts | Every completed purchase emails a receipt and shows it in the portal (amount, card or credit split, policy version, lead reference) | S | — |
| 5.5.2 Daily reconciliation | A job matches Stripe balance transactions to ledger entries. Unmatched items create exceptions for admin with amount, type and reference | M | AS-13 |
| 5.5.3 Policy configuration | Admin creates new sharing-policy versions, the maximum selectable number and the sale window. New lead groups lock the current version; existing groups and purchases are unaffected (test) | M | AS-10 |
| 5.5.4 Lead expiry | When the sale window ends the group becomes `expired`, leaves inventory, and reservations are refused (test) | S | AS-26 |

**5.6 (task) API-level acceptance suite in Stripe test mode:**
- Covers AS-01 to AS-07, AS-22 to AS-27, using concurrent HTTP clients and test cards (decline, authentication required).
- Runs in CI against staging.

**Phase 5 estimate:** 7–10 ew. The tested DB core saves about 2 ew.

**Exit:**
- The listed AS are green at API level in test mode.
- A scripted day of activity reconciles to zero exceptions.
- DEP-01, DEP-03, DEP-04, DEP-08 and DEP-17 are approved before live mode.

---

## 9. Phase 6: Admin portal, company portal, CRM, teams, verification, reviews

**Goal:** approved movers self-serve end-to-end, and ops run the marketplace without engineering help.

### Epic 6.1 Mover application and verification (M8)

**6.1.1 Apply as a mover** · P0 · M
- **As a** moving-company owner, **I want to** apply online with my business and authority details, **so that** I can join the network.
- Given I complete the application with legal name, DBA, address, authorized representative, USDOT, MC (if `require_mc_number` is on), services, service areas, insurance and state credentials, and the no-brokering / no-resale attestations · When I submit · Then my status is `applied` and I see what happens next.

**6.1.2 Automated FMCSA checks with evidence** · P0 · L · AS-15 · DEP-09
- **As an** ops analyst, **I want** official records checked automatically, **so that** I review evidence instead of typing numbers into websites.
- Given an applicant whose USDOT record shows broker authority (alone or with carrier authority) · When verification runs · Then the application is marked for rejection with reason "broker authority", and the source, payload snapshot, hash and timestamp are stored.

**Recorded fixtures cover:**
- Carrier with household-goods scope
- Broker-only
- Dual registration
- Name mismatch
- Inactive authority
- Missing insurance
- Recent record changes

**6.1.3 Admin verification review** · P0 · M · AS-14
- **As an** ops analyst, **I want** one screen with all evidence, highlighted mismatches and a callback checklist, **so that** decisions are fast and defensible.
- Given an application in `in_review` · When I approve after completing callback verification to the phone number on the official record · Then the decision, reviewer, date and notes are stored append-only.

**6.1.4 State credentials and insurance certificates** · P0 · M
- **As an** ops analyst, **I want to** record state licence checks and insurance certificate details with expiry dates, **so that** alerts and suspensions are automatic.
- Given I upload a certificate whose named insured doesn't match the legal name · When I save it · Then the mismatch is flagged and approval is blocked.

**6.1.5 Approval creates an accurate listing** · P0 · M · AS-17
- **As a** newly approved mover, **I want** my profile, badge and directory listing created from verified data, **so that** consumers see accurate information.
- Given my application is approved · When the approval is saved · Then a profile is generated with the verified legal name/DBA, USDOT, MC, verification date, official lookup links, verified services and coverage, "New to our network", and "No customer reviews yet". It's published only after I review the descriptive fields.

**6.1.6 Re-check, expiry alerts and automatic suspension** · P0 · M · AS-16
- **As an** AMC compliance owner, **I want** credential failures to stop purchases automatically, **so that** an unverified company never receives consumer details.
- Given the weekly FMCSA re-check finds a company's authority inactive · When the job runs · Then new purchases are blocked and Preferred status removed immediately, the owner is notified, and purchased leads, CRM history and invoices remain accessible.
- Alerts fire at 30, 14, 7 and 0 days before insurance or state credentials expire.

**6.1.7 Report suspected broker activity or inaccurate credentials** · P0 · S
- **As a** consumer, **I want to** report a listed company I believe is a broker, **so that** AMC investigates.
- Given I submit the public report form · When it's received · Then a case with an SLA and assignee is created and can trigger immediate re-verification.

### Epic 6.2 Teams and permissions (M9)

**6.2.1 Invite team members with roles** · P0 · M
- **As a** company owner, **I want to** invite colleagues as manager, agent or billing, **so that** everyone has the access they need and no more.
- Given I invite an agent · When they accept · Then they can view the marketplace and work purchased leads, but can't change billing or team settings. The permission matrix is in `docs/business-rules`.

**6.2.2 Server-side permission enforcement** · P0 · M · AS-08
- **As a** company owner, **I want** other companies to have no path to my data, **so that** my leads and notes stay private.
- Given company B's manager is signed in · When they request company A's lead, note, team member or export by ID through any API · Then the response is 404/403 and an RLS-level test confirms zero rows.

**6.2.3 Deactivate a member** · P0 · S
- **As a** company owner, **I want** a departing employee's access cut immediately, **so that** lead data doesn't leave with them.
- Given I deactivate an agent · When they make their next request · Then their session is rejected and the action is audit-logged.

**6.2.4 Agent spend limits** · P2 · M

### Epic 6.3 Company portal (M9)

**6.3.1 Coverage editor** · P0 · L · AS-09
- **As a** mover, **I want to** set nationwide coverage, origin and destination states or counties, directional routes, move types, sizes, services, exclusions and pauses, **so that** I only see leads I want.
- Given I add the route FL → GA and exclude destination AK · When I save · Then a "what would match" preview shows a sample FL → GA lead as matching and GA → FL as not matching.

**6.3.2 Marketplace UI** · P0 · M
- **As a** mover, **I want** a fast, filterable marketplace with live availability, **so that** I can act quickly.
- Given 50 matching leads · When I filter by move size · Then results update without a full page reload and stay within the allow-list fields.

**6.3.3 Purchased leads: search, sort, filter** · P0 · M; **saved views** P1 · S
- **As a** sales agent, **I want to** find any purchased lead quickly, **so that** follow-ups don't slip.
- Given I search by consumer surname · When results load · Then only my company's purchased leads appear.

**6.3.4 Lead detail after purchase** · P0 · S
- **As a** sales agent, **I want** the consumer's contact details, move facts, consent summary and do-not-contact status in one place, **so that** I contact them correctly.
- Given the consumer withdrew · When I open the lead · Then a prominent "Do not contact" banner shows the date of the opt-out.

**6.3.5 Notification preferences** · P0 · S
- **As a** mover, **I want to** choose which alerts I get and on which channel, **so that** I'm not spammed.
- Given I disable email alerts for local moves · When a matching local lead appears · Then I'm not emailed about it.

**6.3.6 Profile management** · P0 · M
- **As a** mover, **I want to** edit my description, logo, photos and videos, **so that** my profile represents my business.
- Given I upload a photo · When I publish · Then I must attest I have the rights to publish it. Credential fields (legal name, USDOT, MC, verification) are read-only.

**6.3.7 Billing** · P0 · M; **monthly statements** P1 · S
- **As a** billing user, **I want to** see payment methods, receipts, credit balance and history, and claim status, **so that** I can reconcile with our books.
- Given credits were issued on three leads · When I open the credit history · Then each entry shows amount, reason, the triggering purchase and date, and the balance equals the sum.

### Epic 6.4 CRM (M9, S4, S9, S1, C1)

**6.4.1 Default stages, list view** · P0 · M
- **As a** sales agent, **I want** purchased leads to move through New → Contacted → Qualified → Quote Sent → Follow-up → Booked → Completed / Lost, **so that** I always know where each lead stands.
- Given a lead is at "New" · When I change it to "Contacted" · Then the change is logged in its activity history with actor and time.

**6.4.2 Notes and activity history** · P0 · S · AS-08
- **As a** sales agent, **I want to** keep private notes on a lead, **so that** my team has context.
- Given my company and another company both bought the same shared lead · When I add a note · Then the other company can never see it. Covered at the DB level today; to build at the API level.

**6.4.3 Assignment and follow-up date** · P0 · S
- **As a** manager, **I want to** assign leads and set follow-up dates, **so that** work is distributed.
- Given I assign a lead to an agent with a follow-up date of tomorrow · When tomorrow arrives · Then it appears in that agent's "Due today" list.

**6.4.4 Tasks and email reminders** · P1 · M
- **As an** agent, **I want** reminders for tasks, **so that** nothing slips.
- Given a task is due at 10:00 · When 10:00 passes · Then I receive one reminder email.

**6.4.5 Pipeline view, deal value, lost reasons** · P1 · M
- **As a** manager, **I want** a pipeline view with estimated value and lost reasons, **so that** I can forecast and learn.
- Given I drag a lead to "Lost" · When I drop it · Then I must pick a lost reason before the change saves.

**6.4.6 Authorized exports** · P1 · S · AS-08, AS-24
- **As an** owner or manager, **I want to** export my purchased leads to CSV, **so that** I can use my own tools.
- Given I'm an agent without export permission · When I request an export · Then it's refused.
- Given I'm a manager · When I export · Then the file contains only my company's purchased leads, and the export is audit-logged.

**6.4.7 Configurable stages** · P2 · M
- Renamed or added stages map to system stages so reporting stays consistent.

### Epic 6.5 Reviews and reputation (S11)

**6.5.1 Platform-sent quote-experience invitations** · P1 · M
- **As an** AMC trust owner, **I want** every consumer whose request was purchased invited to review the quoting experience, **so that** feedback is collected consistently, including from dissatisfied customers.
- Given a purchase was disclosed 7 days ago and the consumer allows email · When the invitation job runs · Then one invitation per purchasing company is sent with a secure single-use link.

**6.5.2 Company-requested move-experience invitations** · P1 · M
- **As a** mover, **I want to** request move reviews for customers I've marked Booked or Completed, **so that** my real work is reflected.
- Given I request an invitation for a Completed lead · When it's sent · Then AMC sends it (not me), logs it, and includes it in selective-invitation monitoring.

**6.5.3 Submit a review with evidence** · P1 · M
- **As a** consumer, **I want to** review either the quoting experience or the actual move, and optionally upload proof, **so that** my review carries the right label.
- Given I open a valid single-use link · When I submit a move review with a final invoice · Then it enters moderation with experience type "move" and the evidence attached, and the link can't be reused.

**6.5.4 Moderation and evidence labels** · P1 · M · AS-20
- **As a** moderator, **I want** labels assigned only from collected evidence, **so that** badges are truthful.
- Given a review's only evidence is the purchase record · When I publish it · Then its label is "Verified platform inquiry", even if the company marked the lead Completed.

**6.5.5 Company public response** · P1 · S
- **As a** company owner or manager, **I want to** respond publicly to a review, **so that** consumers see our side.
- Given a published review · When I post a response · Then it appears under the review with my company name and date, and its edit history is kept.

**6.5.6 Report, never edit** · P1 · S · AS-19
- **As a** mover, **I want to** report a fake, abusive or unrelated review, **so that** it's reviewed fairly. I accept that I can't edit or delete reviews.
- Given I'm a company owner · When I try to change a review's text or rating through any endpoint · Then it's refused (no write permission). My report goes to moderation with an appeal path.

**6.5.7 New-review notifications** · P1 · S
- **Rating trends:** P2.

### Epic 6.6 Admin portal (M10)

| Story | Acceptance (Given · When · Then) | P | Size | AS |
|---|---|---|---|---|
| 6.6.1 Manage companies | Given a suspended company · When an admin reinstates it after re-verification · Then purchasing resumes and the change is audit-logged. A support "view as" is read-only and logged | P0 | M | — |
| 6.6.2 Set company prices | Given a company has purchases at $90 exclusive · When admin sets $120 · Then a new effective-dated row is added and past purchases still show $90 | P0 | S | AS-10 |
| 6.6.3 Leads console | Given a lead · When an admin opens it · Then validation reasons, consent record, duplicates (merge/unmerge), expiry, availability, and purchase and disclosure history are visible. Contact details are shown only to roles with that permission, and access is logged | P0 | M | — |
| 6.6.4 Claims, refunds, adjustments | Given an adjustment above the threshold · When one admin creates it · Then a second admin must approve before it posts (maker-checker) | P0 | M | — |
| 6.6.5 Payments and reconciliation | Given a reconciliation exception · When finance resolves it · Then the resolution, note and actor are stored | P0 | S | AS-13 |
| 6.6.6 Profiles and badges | Given a company's Preferred status is suspended · When its profile renders · Then the badge is gone and the status reads truthfully | P0 | S | AS-16 |
| 6.6.7 Complaints and report cases | Given a broker-activity report · When it's assigned · Then the SLA clock, assignee and outcome are tracked, with a link to trigger re-verification | P0 | M | — |
| 6.6.8 Audit log viewer | Given any privileged action · When admin filters the audit log by company · Then the action appears with actor, time, before/after and request ID | P0 | S | — |
| 6.6.9 Reports | Given a date range · When finance opens revenue · Then gross charges, credits, refunds, fees and net reconcile to the ledger. Funnel, sell-through, time to first purchase and attribution views share the same range | P0 | M | — |
| 6.6.10 Admin roles and MFA | Given a content admin · When they open pricing · Then access is denied. All admin roles require MFA | P0 | S | — |

**Phase 6 estimate:** 12–16 ew.

**Exit:**
- A test mover goes from application to verification (fixtures), approval, card, coverage, purchase and CRM with no engineering help.
- AS-08 and AS-14 to AS-20 are green.
- The ops runbook is drafted.

---

## 10. Phase 7: Content, SEO implementation, measured market rollout

**Goal:** priority-market pages and trust content published behind quality gates, with measurement in place. Page families, URL patterns, the keyword map and the publishing checklist live in `docs/seo/*`; this phase implements them.

| Story / task | Acceptance (Given · When · Then) | P | Size | Deps / AS |
|---|---|---|---|---|
| 7.1 CMS workflow (Payload) | Given an editor drafts a city page · When a reviewer publishes it · Then a version is stored and an earlier version can be restored in one action. Roles: writer, reviewer, publisher | P0 | M | — |
| 7.2 Templates (list below) | Given each template · When it renders with fixture data · Then it passes the template checklist: headings, breadcrumbs, internal links, survey entry, FAQs | P0 | L | 3.3 |
| 7.3 Publishing gates | Given a city page whose approved-mover coverage is below the threshold · When it's published · Then it's `noindex` and excluded from the sitemap until the gate passes | P0 | M | DEP-18 |
| 7.4 Technical SEO (scope below) | Automated tests for each | P0 | M | AS-12 |
| 7.5 Company profile pages | Given a newly approved company with zero eligible reviews · When its profile renders · Then it shows "New to our network" and "No customer reviews yet", **no** rating, and **no** `AggregateRating` in JSON-LD. The quote button starts the standard survey with that company named first | P0 | M | AS-17, AS-18, AS-21 |
| 7.6 Preferred Movers directory | Given any badge · When a visitor hovers, taps or focuses it · Then an explainer states what was checked and when, and that it isn't a government endorsement or a performance guarantee | P0 | S | — |
| 7.7 Cost estimator | Given I enter a route and size · When the estimate shows · Then the assumptions, data sources and "last updated" date are visible, and no contact details are required | P1 | M | — |
| 7.8 USDOT/MC lookup tool | Given I enter a USDOT number · When results load · Then authority type (carrier / broker), status and lookup date show, with a link to the official record | P1 | M | DEP-09 |
| 7.9 Media pipeline and video module | Given a conversion page · When it loads on mobile · Then images are responsive with correct priorities. Video has a poster, captions, a transcript and controls, and no autoplay audio | P0 / P1 (video) | S | DEP-15 |
| 7.10 Content batch 1 | Given each launch-market page · When submitted for review · Then it has a source record (question, URL, date, intent, evidence), named author and reviewer, and sourced and dated cost statements | P0 | content | DEP-05, DEP-16 |
| 7.11 Measurement | Given launch · When verified · Then GSC and Bing receive sitemaps, page-family dashboards exist, and an AI-visibility query sample log (platform, date, context, limitations) is started | P0 | S | DEP-13 |
| 7.12 Rollout process | Given 6 weeks of data · When a page family underperforms · Then it's consolidated or noindexed per the SEO playbook, and the next batch is approved by review | P0 | process | — |
| 7.13 Small phones, keyboard, reduced motion | Given a 320px viewport, keyboard-only navigation and `prefers-reduced-motion` · When the survey and representative pages are exercised in Playwright · Then every task completes and no non-essential animation runs | P0 | S | AS-11 |

**7.2 templates:**
- Home
- State hub
- City page
- Route page (P1)
- Company profile
- Directory
- Guide
- Cost page
- Trust pages
- "Buy moving leads"

**7.4 technical SEO scope:**
- Metadata and canonical URLs
- Redirects and status codes
- `robots`
- Sitemap index by page family
- Breadcrumbs
- Structured data validated against visible content
- Parameter and filter URL handling
- Portals noindexed and behind auth

**Phase 7 estimate:** 6–8 ew; 10–16 content-weeks; 3–5 SEO weeks; about 1 design-week.

**Exit:**
- Batch 1 published with every gate passing.
- AS-11, AS-12, AS-18 and AS-21 green.
- Sitemaps accepted; dashboards live.

---

## 11. Phase 8: Launch validation, documentation, handover

| Task | Acceptance | Size | AS |
|---|---|---|---|
| 8.1 Full acceptance suite | Every AS in §12 is green in staging (Playwright plus Stripe test mode), and the report is attached to the launch review | M | all |
| 8.2 Load and concurrency test | A burst of 200 concurrent purchase attempts on 20 hot leads produces zero oversells, zero duplicate charges, and P95 purchase latency under the agreed budget | M | AS-01, AS-02 |
| 8.3 Security review | Pen test (external or structured internal), dependency audit, secrets rotation, rate-limit verification, RLS policy review. No high-severity findings left open | M | AS-08 |
| 8.4 Backup and restore drill | A point-in-time restore of production-like data to staging. The ledger re-sums to the same balances and reconciliation still passes. Measured RTO/RPO documented | S | AS-13 |
| 8.5 Payment reconciliation demo | A scripted set of charges, declines, refunds, disputes and credits reconciles to zero exceptions, demonstrated to the client | S | AS-13 |
| 8.6 Accessibility audit (WCAG 2.2 AA) | Automated checks plus manual keyboard and screen-reader passes on representative pages and the portals. No critical issues open | M | AS-11, AS-12 |
| 8.7 Performance lab audit | Representative pages meet lab budgets: LCP ≤ 2.5s, CLS ≤ 0.1, and a lab proxy for INP within budget on a mid-tier mobile profile. Real-user monitoring is enabled to collect field data. **Lab results are reported as prelaunch, not as Core Web Vitals field data** | M | AS-12 |
| 8.8 Compliance and vendor sign-offs (list below) | Each is signed off and recorded in the launch checklist | — | — |
| 8.9 Runbooks and handover | Incident response, payment-provider outage with a "pause marketplace" switch, credential-failure handling, data subject requests, admin and mover help docs, handover sessions recorded | M | — |
| 8.10 Launch readiness review | The production-ready criteria in §13 are met. **Nothing is labelled production-ready while core flows are mocked, financial rules are unapproved, or private data is exposed** | S | — |

**8.8 sign-offs:**
- Counsel (DEP-07)
- Accountant (DEP-17)
- Stripe live mode (DEP-08)
- Twilio A2P registration (DEP-10, if SMS is used at launch)
- Email DNS authentication (DEP-11)

**Phase 8 estimate:** 4–6 ew.

---

## 12. Acceptance scenario traceability

**Status key:**
- **Covered:** an automated test passes today (re-run 2026-10-27).
- **Partial:** part is tested.
- **To build:** nothing tested yet.

**Test paths:**
- DB tests: `db/test/purchase.test.ts`
- Core tests: `packages/core/test/*.test.ts`

| AS | Scenario | Phase | Status | Evidence / remaining work |
|---|---|---|---|---|
| AS-01 | Two companies attempt to purchase one exclusive lead; exactly one succeeds and is charged | 5 | **Covered (DB)** | DB: "two companies race for one exclusive lead: exactly one succeeds and is charged". To build: API + Stripe test-mode version (5.6), load test (8.2) |
| AS-02 | Concurrent attempts for a shared lead's final slot never exceed its cap | 5 | **Covered (DB + core)** | DB: "many concurrent buyers never exceed the cap, even when racing for the final slot". Core: "never sells beyond the consumer cap". To build: API level (5.6) |
| AS-03 | Failed payments reveal no contact information | 5 | **Covered (DB)** | DB: "failed payment releases the slot and reveals nothing". To build: Stripe decline / authentication-required paths, and checks on notifications and exports (5.3.3) |
| AS-04 | Repeated purchase requests and payment notifications create no duplicate financial effects | 5 | **Covered (DB)** | DB: "repeated clicks and repeated payment notifications create no duplicate effects"; "success arriving after the reservation expired is honoured only if the slot is still free". To build: signed webhook handler and Stripe idempotency keys (5.3.4) |
| AS-05 | Credits match the approved formula, including differing company prices and rounding | 5 | **Covered (core + DB); formula pending approval** | Core: "every buyer's net cost equals own price x final factor (different prices)"; "rounds half up in integer cents"; "matches the worked examples in the policy doc". DB: "credits follow the approved formula with different company prices and rounding"; "a refunded buyer stops accruing sharing credits and cannot be refunded more than it paid net". Re-run with the approved factors (DEP-01) |
| AS-06 | Refunded disclosed leads do not silently regain sale capacity | 5 | **Covered (DB)** | DB: "refunded disclosed lead does not regain sale capacity" |
| AS-07 | Duplicate consumer submissions cannot bypass sharing limits | 4–5 | **Partial** | DB: "duplicate consumer submission cannot widen the sharing limit". Core: "duplicate submissions can never widen the sharing limit". To build: detection at intake (4.3.3); limit lowered during a pending payment (5.3.8, a known gap) |
| AS-08 | One company cannot access another company's leads, CRM notes, team or exports | 2, 6 | **Partial** | DB: "contact details only after purchase; one company cannot read another's CRM notes". To build: RLS and API tests for every tenant table, teams and exports (2.4, 6.2.2, 6.4.6) |
| AS-09 | Geography and directional-route preferences match correctly | 4–6 | **Covered (core)** | Core matching tests (8): nationwide; FL→GA vs GA→FL; origin-only; destination-only; any-within-group; exclusions override; paused ignored; capability ceiling. Plus "keeps leading zeros" and "classifies moves". To build: ZIP / city / county resolution against the dataset (4.1.2), SQL parity (5.1.1), editor preview (6.3.1) |
| AS-10 | Historical purchases retain their pricing records after admin changes | 5–6 | **Covered (DB + core)** | DB: "historical purchases keep their pricing after admin price changes". Core: "uses snapshotted prior prices, so admin price changes don't rewrite history". To build: admin UI (6.6.2) |
| AS-11 | Public pages work on small phones, with keyboard navigation and reduced motion | 3, 7 | **To build** | 3.2, 7.13, 8.6 |
| AS-12 | Representative pages pass accessibility, rendering, metadata, schema, sitemap and performance checks | 7–8 | **To build** | 7.4, 8.6, 8.7 |
| AS-13 | Backup restoration and payment reconciliation are demonstrated | 5, 8 | **To build** | 5.5.2, 8.4, 8.5 |
| AS-14 | Brokers and unapproved companies cannot purchase leads or receive contact details | 5–6 | **Covered (DB)** | DB: "brokers, unapproved and expired-credential companies cannot purchase" (also asserts no contact details). To build: verification sets the flags from evidence (6.1.2–6.1.3); marketplace hides inventory |
| AS-15 | Submitted numbers match the approved company and required carrier authority | 6 | **To build** | 6.1.2 with recorded FMCSA fixtures |
| AS-16 | Credential failures suspend new purchases and Preferred status | 6 | **Partial** | DB purchase block for expired credentials (same test as AS-14). To build: weekly re-check job, Preferred suspension and notifications (6.1.6, 6.6.6) |
| AS-17 | Newly approved companies receive accurate public listings | 6–7 | **To build** | 6.1.5, 7.5 |
| AS-18 | Companies without reviews display no fabricated rating | 7 | **To build** | 7.5 (rendering + JSON-LD test) |
| AS-19 | Companies cannot alter reviews or suppress valid criticism | 6 | **To build** | 6.5.6 (permission tests) |
| AS-20 | Review badges reflect the actual evidence collected | 6 | **To build** | 6.5.4 |
| AS-21 | Company-profile quote requests follow the sharing limits and purchase rules | 4, 7 | **Partial** | The core sharing-limit and purchase rules are tested (AS-02, AS-07). To build: profile entry point and E2E (7.5) |
| AS-22 | Coverage changes affect future availability without removing purchased records (brief §5) | 5 | **To build** | 5.1.3 |
| AS-23 | Eligibility and availability are re-checked at purchase (brief §5) | 5 | **Partial** | `reserve_purchase` re-checks eligibility, sale window, already-purchased, in-progress and cap (DB tests). **Coverage and capability re-check missing** (5.1.2) |
| AS-24 | Pre-purchase restrictions hold in server responses, exports, notifications and access controls (brief §6) | 5–6 | **Partial** | Core: "never contains contact details, surname, address or notes". `lead_contact_for_company` requires purchase plus disclosure (DB test). To build: API, notification and export snapshot tests (5.1.4, 5.1.6, 6.4.6) |
| AS-25 | A disclosed shared lead never becomes exclusive; purchased exclusive leads are never resold (brief §7) | 5 | **Partial** | The AS-01 test proves the loser can't buy afterwards; the AS-06 test proves a refund doesn't reopen. To build: an explicit test that lowering a partly sold shared group's limit to 1 can't enable an exclusive sale |
| AS-26 | Unpurchased leads expire at the end of the sale window | 5 | **To build** | `reserve_purchase` already refuses expired groups (untested). Add a test plus the expiry job (5.5.4) |
| AS-27 | A withdrawal or opt-out reaches every purchasing mover and blocks further disclosure | 4–5 | **To build** | 4.4.3; 5.3.7 (withdrawal during a pending payment, a known gap) |
| AS-28 | The MC-number requirement can be switched without a migration (compliance facts §1) | 2 | **Covered (DB)** | DB: "the MC-number requirement is a platform setting (default on)" |

---

## 13. Launch checklist (production-ready criteria)

**Legal and compliance**
- [ ] Counsel sign-off (DEP-07), covering:
  - consent wording and evidence record
  - marketplace classification (broker risk)
  - privacy policy, including state-law "sale" and opt-out handling
  - consumer and mover terms (no resale or brokering; opt-out honoring)
  - review policy and methodology
  - advertising and marketplace disclosures
  - retention schedule
- [ ] Accountant sign-off (DEP-17): sales tax by state, credit-liability accounting.
- [ ] Owner approvals: credit policy (DEP-01), prices (DEP-03), claim policy (DEP-04), maximum sharing limit (DEP-02), MC policy (DEP-19).

**Money**
- [ ] Stripe live mode activated; webhook endpoints and signing secrets in production configuration only.
- [ ] Reconciliation demo passed (8.5); daily job scheduled with alerting.
- [ ] "Pause marketplace" switch tested.

**Data and security**
- [ ] Every AS green (§12), with the report attached.
- [ ] Pen-test or security-review findings closed (8.3); admin MFA enforced; rate limits verified.
- [ ] Backup and point-in-time restore drill passed; RTO/RPO documented (8.4).
- [ ] No personal data in analytics payloads (payload tests); portals noindexed and behind auth.

**Experience and SEO**
- [ ] WCAG 2.2 AA audit with no critical issues open (8.6); small-phone, keyboard and reduced-motion checks passed (7.13).
- [ ] Lab performance budgets met (8.7); real-user monitoring live. Field data is reported separately once enough exists.
- [ ] Batch 1 pages pass the publishing gates; sitemaps submitted; GSC and Bing verified.
- [ ] Trust pages live: How We Verify, Movers vs Brokers, How We Make Money, Which Companies Receive My Request, Review Methodology, Complaints & Reporting, support contacts.

**Operations**
- [ ] Twilio A2P 10DLC approved (if SMS at launch); email SPF/DKIM/DMARC passing.
- [ ] Runbooks, help docs and handover done (8.9); support inbox and phone staffed.
- [ ] Enough approved movers in each launch market to meet the coverage gate (DEP-18).
- [ ] **Not production-ready if any core flow is mocked, any financial rule is unapproved, or any private data exposure is open.**

---

## 14. Critical path and top risks

**Critical path (non-engineering items dominate):**
1. Counsel review (DEP-07) → real lead capture → pilot.
2. Owner approval of policy and prices (DEP-01, 03, 04) → live billing.
3. FMCSA access (DEP-09) → automated verification. The admin-assisted fallback keeps the pilot unblocked.
4. Mover recruitment (DEP-18) → coverage gates → indexable city pages → organic leads.
5. Content throughput → batch 1.

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **R1 Supply under "USDOT + MC required".** Intrastate-only local movers have no MC, so local demand (the largest search volume) may go unserved. FMCSA plans to stop issuing MC numbers through a future rulemaking. | High / High | Pick markets by FMCSA carrier counts (1.6). The `require_mc_number` setting is already built. Owner decision on a state-licensed local track (DEP-19). |
| **R2 Legal classification and consent** (broker risk; TCPA; state mini-TCPAs; state privacy "sale") | Medium / High | Counsel early (1.5). Named-seller consent with an immutable evidence record. Opt-out propagation (4.4.3). |
| **R3 Time to rank for a new domain.** Moving leaders have Authority Score 44–48 and about 9k–20k referring domains (`keyword-research.md`). | High / High | Lead with long-tail, tools and route pages. Budget paid acquisition for the pilot. Track AI-search citations separately. |
| **R4 Pricing and credit-policy acceptance** by movers | Medium / High | Interviews (L1, L2), the pilot, versioned policies that can change for future leads only. |
| **R5 Payment friction and margin.** Off-session authentication requests; card fees eat into small lead prices. | Medium / Medium | Card-first with clear recovery (5.3.3); credits pay first (no fee); ACH only for prepaid top-ups (C4). |
| **R6 Content throughput** at 0.5 FTE | High / Medium | Freelance writers, a smaller batch 1, a reusable data-led page structure (never doorway pages). |
| **R7 Lead-quality disputes** erode margin | Medium / Medium | Layered validation (4.3), claim-rate monitoring, published claim policy. |
| **R8 Multi-tenant data exposure** | Low / Critical | Server-side authorization plus RLS plus isolation tests in CI (2.4, 6.2.2), pen test (8.3). |
| **R9 Withdrawal or limit change during a pending payment** (found in the DB core) | Low / High | Fix and test before Phase 5 exit (5.3.7, 5.3.8). |
