# American Moving Choice: Discovery & Implementation Brief (Phase 1)

**Date:** 2026-10-27, revised 2026-10-28 after the reference-site review · **Status:** Phase 1 deliverable for review · **Branch:** `claude/fervent-bohr-u9rg4y`

This brief is the entry point. Each section summarizes a decision or finding and links to the detailed document. Everything marked **Decision needed** is collected in [§11 Questions](#11-consolidated-questions-for-the-owner).

| Document | What it contains |
|---|---|
| [`business-rules/lead-lifecycle-and-purchase-rules.md`](business-rules/lead-lifecycle-and-purchase-rules.md) | Lead states, survey order, matching, quality controls, disclosure, consent evidence, purchase flow |
| [`business-rules/shared-pricing-and-credits.md`](business-rules/shared-pricing-and-credits.md) | Shared-lead policy options, formula, worked examples, refunds/disputes, decisions |
| [`business-rules/mover-verification-and-reviews.md`](business-rules/mover-verification-and-reviews.md) | Movers-only eligibility, FMCSA verification workflow, Preferred Mover program, profiles, reviews |
| [`architecture/stack-and-architecture.md`](architecture/stack-and-architecture.md) | Stack, environments, security, performance, measurement, operating costs |
| [`architecture/data-model.md`](architecture/data-model.md) | Full logical data model, permissions matrix, database invariants |
| [`seo/site-architecture.md`](seo/site-architecture.md) | Page families, URL hierarchy, clusters, publishing gate, market selection, AI visibility, technical SEO |
| [`product/jtbd-and-journeys.md`](product/jtbd-and-journeys.md), [`product/mvp-scope.md`](product/mvp-scope.md), [`product/backlog.md`](product/backlog.md) | Jobs to be done, journeys, MVP boundary, phased backlog with acceptance criteria and estimates |
| [`design/visual-direction.md`](design/visual-direction.md), [`design/style-tile.html`](design/style-tile.html) | Visual direction, tokens with contrast checks, components, page blueprints, style tile |
| [`research/reference-matrix.md`](research/reference-matrix.md) | Reference-site findings and the reference-to-requirement matrix |
| [`research/keyword-research.md`](research/keyword-research.md) | Semrush competitor traffic, page families, keyword opportunities, priority markets |
| [`research/compliance-and-platform-facts.md`](research/compliance-and-platform-facts.md) | Sourced FMCSA / TCPA / FTC / Google / AI-crawler / Stripe / Core Web Vitals facts and questions for counsel |
| [`skills-log.md`](skills-log.md) | Skills and integrations used, their outputs, and what was unavailable |
| [`business-rules/consent-and-disclosure-copy-draft.md`](business-rules/consent-and-disclosure-copy-draft.md) | Draft consumer consent, disclosures, badge explainer and mover payment authorization, for counsel |

### Phase 1 report

| | |
|---|---|
| **What works** | Research and business rules are complete and ready for review. The marketplace's hardest guarantees (no overselling, no double charges, no contact data before payment, credits that match the formula, refunds that never reopen slots, consent-scoped buyers, company isolation) run as tested code in test mode. |
| **Evidence** | 23 unit tests + 17 PostgreSQL integration tests passing locally and in GitHub Actions; the race suite passed 10/10 repeated runs. Semrush exports in `research/raw/semrush/`. Every regulatory claim is cited with an access date. |
| **Not done / not production-ready** | No public site, portals, payments integration, verification client, CMS or analytics yet. The financial policy and consent wording await your and counsel's approval. Reference-site quote flows were observed only up to the contact step, so what happens after submit is unknown at every site (§3). |
| **Outstanding dependencies** | Answers to §11 (especially pricing, refunds, sharing limit, counsel, markets); integration access (Stripe, FMCSA WebKey, Supabase/Vercel approval, Search Console/GA4, Twilio 10DLC); a base branch for pull requests. |
| **Next deliverable** | Phase 2 sign-off pack: the final product spec (merging these documents and your answers), migrations for the full data model, app scaffolding with preview deployments, and a clickable quote-survey prototype. |

---

## 1. The business and its user journeys

**What we are:** a nationwide platform that helps people planning a move compare **licensed, independent moving carriers**. Consumers use the site for free. Approved movers pay American Moving Choice for the move requests they choose to buy, then contact the consumer directly. American Moving Choice is **not a moving company and not a broker**: we don't give estimates on movers' behalf, take deposits, book moves, or pick a mover for the consumer. That positioning matters legally (see compliance facts §2) and is a trust feature in itself.

**Three customers, three jobs:**

| Who | Core job | What success looks like |
|---|---|---|
| Consumer moving locally, in-state or across states | "Help me find trustworthy movers for my move without being flooded by calls or scammed by a broker." | A quick, honest survey; control over how many movers may contact them; clear identity and credentials for every mover; useful cost and planning guidance. |
| Moving carrier (owner, sales agent, billing) | "Give me real, fresh, in-area move requests I can win, at a price that pays back, and help me follow up." | Accurate matching to their coverage, transparent pricing and credits, instant access after purchase, a CRM that saves time, fair reviews. |
| AMC operations / admin | "Run a trustworthy, profitable marketplace." | Verified network, low fraud, clean money trail, measurable acquisition-to-revenue economics, compliant consent and reviews. |

**Primary journeys** (detailed with failure modes in `product/jtbd-and-journeys.md`):
1. **Consumer:** search or ad → state/city/route page or guide → survey (move details → why we ask → contact → *"How many moving companies would you like to hear from?"* → consent naming the participating movers) → confirmation (who may contact them, what happens next) → contact from movers → review invitation.
2. **Mover:** "for movers" page → application → FMCSA and document verification → admin review → approval (profile + Preferred Mover badge) → coverage and pricing confirmed → marketplace → purchase → CRM follow-up → booking → review requests.
3. **Admin:** verification queue → pricing and settings → lead quality review → refunds/disputes → reconciliation → content publishing → reporting.

## 2. Skills, integrations and access gaps

Full record in [`skills-log.md`](skills-log.md). Highlights:

- **Integrations that worked:** Semrush (real US data pulled for 11 domains and about 100 keywords), GitHub. Available but not yet used (need your go-ahead because they create billable resources): Supabase, Vercel. Also present: Canva, Higgsfield (image/video generation), Google Drive, Hugging Face.
- **Failed to connect in this session:** Similarweb, Figma, Amplitude, Notion, Linear, Asana, Atlassian, ClickUp, Monday, Intercom, Pendo, Fireflies, Slack, BigQuery. Similarweb would have added traffic estimates, and Figma would have hosted design files.
- **Not available:** a DataForSEO integration (needed by `seo-dataforseo`), Google Search Console / GA4 API access (needed by `seo-google`), Stripe account keys, FMCSA QCMobile WebKey, Twilio/Postmark accounts, and the `ui-ux-pro-max` design skill (not installed; `high-end-visual-design` and `design-taste-frontend-v1` were used instead).
- **Network restriction and how it was handled:** this cloud environment's network policy refuses direct connections to the reference sites, fmcsa.dot.gov and federalregister.gov. At your direction, the reference sites were observed directly from a **Vercel Sandbox in your Vercel account** (project `amc-reference-research`). Headless Chromium rendered public pages there, respecting robots.txt, and walked quote flows with test ZIPs, stopping at or before the contact step, without entering personal data. Tools: `tools/reference-capture/`. The review of all 11 sites is complete; findings are in §3.
  - Moving.com loaded only partly; its bot protection blocked some pages.
  - HomeGuide refused the headless browser and ConsumerAffairs refused all automated access. No attempt was made to bypass either. Their reviews rest on search results, Semrush and the earlier search-only matrix, so confidence in them is low.
  - The regulatory research (FMCSA/FCC/FTC) still rests on search excerpts of official pages, each cited; open the key pages directly before launch.

## 3. Reference-site findings

The direct review of all 11 reference sites is complete.

**How the evidence was gathered.** Direct captures on 2026-10-27 (§2) covered up to 14 public pages per site; ConsumerAffairs and HomeGuide blocked them, and Moving.com loaded partly. Quote-flow walks with test ZIPs stopped at or before the contact step, so nothing after submit was seen. Semrush gave US traffic estimates; searches covered owners, regulators and complaints. Site names in the list link to the verified site reviews; [`research/reference-review/README.md`](research/reference-review/README.md) covers labels and limits.

Ranked by Semrush estimated US organic traffic (October 2026): ConsumerAffairs (~420k/mo), HomeGuide (~326k), EnergySage (~239k, a model rather than a competitor), HireAHelper (~125k), Move.org (~108k), Moving.com (~65k), moveBuddha (~38k), MyGoodMovers (~26k), Unpakt (~6k), Budget Van Lines (~2k), Consumer Moving Reviews (CMR, <1k) [semrush: domain_rank]. Moving is a slice of the top two: about 24k (ConsumerAffairs' /movers/ folder) and at least 1,239 (HomeGuide) [semrush: top_pages_more]. See `research/keyword-research.md` for method and caveats.

What matters most:
1. **Value before contact is rare.** In the walks, only [moveBuddha](research/reference-review/sites/movebuddha.md)'s price ranges and [HireAHelper](research/reference-review/sites/hireahelper.md)'s mover names offered it; [CMR](research/reference-review/sites/consumermovingreviews.md) and [MyGoodMovers](research/reference-review/sites/mygoodmovers.md) take contact details first [walk]. No site showed a live count of eligible movers [cross-site analysis]. We should show that count first.
2. **None seen lets consumers pick how many companies.** [Moving.com](research/reference-review/sites/movingcom.md) says "up to 4" (/leads/) and [MyGoodMovers](research/reference-review/sites/mygoodmovers.md) three, in an FAQ [capture]; [HomeGuide](research/reference-review/sites/homeguide.md) capped phone sharing at five in a 2023 article [search]. Our edge: consumers set the cap, buyers are named at consent, all are carriers, and credits follow sharing [inference].
3. **Consent is weak where seen.** [CMR](research/reference-review/sites/consumermovingreviews.md) relies on "By submitting" (/request-a-quote/); [MyGoodMovers](research/reference-review/sites/mygoodmovers.md)' unchecked box also accepts its Terms and names no mover (/moving-cost-calculator) [walk]. Their adequacy is for counsel (compliance facts §3). Our draft's box also bundles the Terms ([consent draft](business-rules/consent-and-disclosure-copy-draft.md) §5); a split is proposed.
4. **Role and money.** No walked flow said how the site is paid [walk; cross-site analysis]; we state both in the survey, consent and confirmation. Our risk is drift, not concealment [inference]: [Unpakt](research/reference-review/sites/unpakt.md) holds payments and [CMR](research/reference-review/sites/consumermovingreviews.md) promises a specialist call [capture; walk], features for counsel to weigh (compliance facts §2).
5. **Credentials are claimed more than shown.** At least seven sites say "licensed", "vetted" or "verified" without a method [cross-site analysis]. [Move.org](research/reference-review/sites/moveorg.md)'s list says its picks aren't brokers, yet its review calls the #1 pick "a broker and a carrier" (/allied-moving-reviews/) [capture]. [HireAHelper](research/reference-review/sites/hireahelper.md)'s best profile signals need bookings we don't run [inference].
6. **"Preferred" already reads as paid or affiliated.** [Move.org](research/reference-review/sites/moveorg.md)'s sponsored slots include "Preferred Partner" (/disclosure/), and [CMR](research/reference-review/sites/consumermovingreviews.md)'s owner is Preferred Movers Network Inc. [capture]. Our badge is a screening status every approved mover gets, not a paid one ([mover verification](business-rules/mover-verification-and-reviews.md) §4). Decide the name before Phase 3 design sign-off, after counsel clearance and usability round 1.
7. **Numbers and ratings drift.** Figures drift at eight of 11 sites, ratings or counts at four of nine captured sites [cross-site analysis]. [moveBuddha](research/reference-review/sites/movebuddha.md) priced one test move two ways [walk]; [MyGoodMovers](research/reference-review/sites/mygoodmovers.md) calls a two-review mover "BEST LOCAL MOVER" (/movers/al) [capture]. We need one record per number, invitation-only labeled reviews and minimum samples for "top" claims.
8. **Tools and cost pages lead traffic.** [Moving.com](research/reference-review/sites/movingcom.md)'s calculator draws about 30% of its visits. City pages lead only at [HireAHelper](research/reference-review/sites/hireahelper.md) (24.6%), and state cost pages earn at [MyGoodMovers](research/reference-review/sites/mygoodmovers.md). Routes are small: 133 to 156 visits at moveBuddha, 1 to 3 for CMR's ZIP lanes [semrush: top_pages, top_pages_more]. No site shows a coverage gate like ours [cross-site analysis].
9. **Money and ties shape order.** [MyGoodMovers](research/reference-review/sites/mygoodmovers.md)' Terms let plans change listing order, and [CMR](research/reference-review/sites/consumermovingreviews.md)'s related companies lead its lists [capture]. No captured mover page shows prices, caps and refunds together [cross-site analysis]. We should publish buying rules and keep payment out of order and badges.
10. **Forms carry tracking.** At least seven of nine captured sites load replay-capable tools [cross-site analysis]. We need a tag policy for survey pages; wiretap exposure is for counsel.

Decisions, proposed document changes and owner questions: [`research/reference-review/implications-for-content-seo-design.md`](research/reference-review/implications-for-content-seo-design.md) (§1, §10, §11). Cross-site matrix: [`research/reference-matrix.md`](research/reference-matrix.md).

## 4. Proposed MVP and later enhancements

Summary below; the full prioritization is in `product/mvp-scope.md`.

**MVP (launch in Wave 1 markets):**
- Public site: home, quote survey + confirmation, trust pages (How We Verify Movers, Movers vs Brokers, Review Methodology, How AMC Makes Money, Which Companies Receive My Request, Editorial Policy, About, Contact, Complaints, Report a Concern; `seo/site-architecture.md` §1.2), Wave 1 state/city/route pages that pass the publishing gate, cost guide + calculator, the mover directory (name pending) and company profiles, "for movers" lead-buying pages.
- Lead intake: progressive survey, validation and risk scoring, duplicate grouping, consent evidence, honest no-coverage handling.
- Mover onboarding: application, FMCSA API checks + document upload, admin review, approval → profile + badge.
- Marketplace: matching, real-time previews, exclusive/shared purchase with card + account credit, the recommended credit policy (after approval).
- Company portal: purchased leads, CRM pipeline (configurable stages, notes, tasks, assignment, follow-ups, lost reasons, exports), billing (payment methods, receipts, credits, quality claims), team roles, notification preferences, reviews and reputation.
- Admin portal: companies and verification, pricing and settings, leads and consent records, purchases/disclosures, refunds/disputes, reconciliation, content workflow, profiles, reports, audit log.

**Later:** ACH prepaid wallet; CRM add-ons (automations, two-way SMS/email from the CRM, call tracking, calendar sync, integrations with moving-software platforms, API access); original data reports once enough consented data exists; additional buyer categories (e.g. auto-transport *carriers*) with the same carrier-only rule; native apps if usage warrants.

**Out of scope initially:** bidding, consumer–mover messaging on the platform, booking/deposits, native apps. The reference review recommends making booking and deposits a standing exclusion, not just an initial one (owner decision; see [implications](research/reference-review/implications-for-content-seo-design.md) D5).

## 5. Recommended stack and architecture

Next.js on Vercel (public site + separate authenticated portal app), PostgreSQL on Supabase (Auth with MFA, Realtime, Storage, RLS as defense in depth), Payload CMS, Stripe, a transactional outbox with Inngest jobs, Postmark/Twilio, Turnstile, Sentry, GA4/Search Console/Bing/PostHog. Rough fixed platform cost is **$250–$600/month** before usage-based fees, people and ads. Details, tradeoffs and alternatives are in `architecture/stack-and-architecture.md`, and the full data model is in `architecture/data-model.md`.

**Already built and tested in this branch** (useful independent work while answers are pending, all in test mode with no live money):
- `packages/core`: matching engine (nationwide, origin-only, destination-only, directional routes, any-within-group, all-groups-required, exclusions override, paused rules, capability ceiling), eligibility snapshots, shared-lead calculator, allow-list preview redaction, ZIP/phone normalization, duplicate-group limit. **23 unit tests passing.**
- `db/migrations/001_marketplace_core.sql`: transactional purchase core in PostgreSQL. **17 integration tests passing** against Postgres 16, including:
  - exactly one winner when two companies race for an exclusive lead
  - eight companies racing for three shared slots never exceed the cap
  - failed payments reveal nothing and release the slot
  - repeated clicks and webhooks have no duplicate effect
  - late payment success after expiry is detected for refund
  - credits match the formula with different prices and rounding
  - credit holds prevent double-spend
  - refunds never reopen capacity and are capped at net paid
  - duplicate submissions can't widen limits
  - price history is preserved
  - brokers, unapproved companies and expired credentials are blocked
  - the MC requirement is a setting
  - only movers named in the consent can buy, and coverage edits force a fresh match
  - a withdrawal or lowered limit during an in-flight payment prevents disclosure
  - one company can't read another's CRM notes (RLS)
  
  The race suite passed 10 of 10 repeated runs.

## 6. Lead lifecycle and purchase rules

Full rules in `business-rules/lead-lifecycle-and-purchase-rules.md`. Key points:
- **Lead type is the consumer's choice:** 1 = exclusive (one company, ever); 2…N = shared, capped at the consumer's number; maximum N is admin-configured (proposed 5). Buyers are counted as distinct companies. Shared never converts to exclusive.
- **Purchases of one lead are serialized:** a single in-flight reservation (2-minute hold) means price and position are deterministic and overselling is structurally impossible. Contact details are disclosed only after payment succeeds, in the same transaction that records the purchase.
- **Server-authoritative availability** with real-time buyer counts. Previews never include phone, email, surname, address or notes, and this is enforced in code, exports, notifications and the database.
- **Duplicates** join the original request group, keep the lowest selected limit, and count buyers across the group.
- **Consent** names the participating movers who may buy the request. Only those movers can buy it (pending counsel). Full evidence is stored, including wording version, timestamp, IP, the named movers and the selected limit.
- **Recovery:** webhook dedupe, idempotent completion, an expiry sweeper that checks Stripe before releasing, and daily reconciliation of Stripe against the ledger.

## 7. Shared-pricing options with worked examples

Full analysis in `business-rules/shared-pricing-and-credits.md`. The examples there are generated from the tested calculator.

**Recommended:** an *equalizing step-down* policy. In the end every buyer pays the same percentage of **its own** shared price: **100% alone, 80% with 2 buyers, 65% with 3, 55% with 4, 50% with 5**. Later buyers pay their own price × the current factor, and earlier buyers receive the difference automatically as account credit. It is exact in integer cents with no rounding drift, and history is never rewritten by price changes.

Example with companies priced at $40, $35, $45, $30 and $50 shared:

| Buyers | What the newest buyer pays | Platform net revenue | Net after est. card fees |
|---|---|---|---|
| 1 | A $40.00 | $40.00 | $38.54 |
| 2 | B $28.00 (A credited $8.00) | $60.00 | $57.43 |
| 3 | C $29.25 (A +$6.00, B +$5.25) | $78.00 | $74.28 |
| 5 | E $25.00 (A +$2.00, B +$1.75, C +$2.25, D +$1.50) | $100.00 | $94.47 |

A naive "price ÷ buyers" split keeps platform revenue stuck near one shared price (about $40) no matter how many companies buy. It is shown in the policy document and not recommended. The factor schedule, maximum limit, price bands, credit terms and claim rules all need your approval before live billing.

## 8. SEO architecture and initial market selection

> **Reference review complete.** The review (§3) confirmed this plan's approach: full state slugs, `/companies/` profiles, directional routes, no ZIP pages and a publishing gate that no reference matches. `seo/site-architecture.md` has been revised with the review's proposed changes (SA-1 to SA-20 in the [implications document](research/reference-review/implications-for-content-seo-design.md) §6.9). Items that wait on you or counsel, such as the badge and directory name, are marked pending there. The Wave 1 list still waits on your answer to §11 Q3 and on approved-mover coverage. With the review done, the condition for starting content work is met; implications §7.1 lists the recommended first pieces.

Full plan in `seo/site-architecture.md`. Every keyword-to-page mapping in `seo/keyword-to-page-map.csv` (298 keywords → 134 URLs) carries real Semrush numbers.

- **Consumer vs business intent are separate trees.** Consumer: `/movers/{state}/`, `/movers/{state}/{city}/` (+ `long-distance/` children), `/moving-routes/{a}-to-{b}/` (each direction its own page), `/moving-to/`, `/moving-costs/`, `/moving-cost-calculator/`, `/verify-a-mover/`, `/compare/`, `/guides/`. Company profiles live at `/companies/{slug}/`, so they can never collide with a state. Business: `/for-movers/` ("buy moving leads"). Portals on `app.` are all noindex. No indexable ZIP pages in any wave.
- **Publishing gate:** a programmatic page is published only when it passes every check:
  - at least 3 approved movers with explicit coverage (5 for state pages), the same count the page shows
  - at least 3 verified local facts
  - a sourced, dated cost block where site architecture §4.1 G4 requires one (state hubs once data exists; optional for moving-to guides)
  - at least 3 or 4 unique FAQs by family (site architecture §4.1 G6)
  - at least 40% unique content
  - a "swap test" (the page wouldn't make sense with another city's name in it)
  - a named human reviewer (every page in waves 1 and 2; a sample after that, per §4.1 G9)

  Pages that fail aren't published, and pages that later slip below the gate are deindexed after a 30-day buffer. This is our safeguard against Google's doorway and scaled-content policies.
- **Market selection:** a score built from Semrush demand, CPC (as a proxy for lead value), keyword difficulty and content feasibility, with **approved-mover coverage as a hard gate**.
  - **Provisional Wave 1:** Texas (Dallas, Houston, Austin, San Antonio), Florida (Orlando, Miami, Tampa), Los Angeles, long-distance pages for TX/FL/CA, and 16 directional state routes led by NY→CA, CA→NY, CA→TX and NY→FL. That is about 36 programmatic pages.
  - **Wave 2:** Denver, Atlanta, Chicago, Nashville, Charlotte, Raleigh, Phoenix, NYC.
- **AI search visibility:**
  - consistent entity data
  - named authors and reviewers
  - editorial, review and advertising policies
  - dated citations
  - original aggregated data only with consent and minimum sample sizes
  - search crawlers allowed (training crawlers are your decision, §11 Q12)
  - llms.txt treated as optional (Google says it has no effect)
  - a documented monthly AI-query sample for measurement
- **Note:** Google retired FAQ rich results in May 2026, so FAQs are written for people and AI answers, not for SERP features.

## 9. Proposed visual direction

**"Route Ledger"** (full system in `design/visual-direction.md`; see `design/style-tile.html`). Each page is anchored on the visitor's actual route (origin → destination), and every trust claim sits next to dated, sourced evidence (verification date, official FMCSA link, review evidence label).

- **Typography:** Archivo, heavy and slightly condensed, echoes the wordmark. Source Sans 3 is the body face. Both are open-licensed. Public Sans is deliberately avoided because it reads as US government.
- **Color:** navy `#063167` is primary.
  - Brand red `#E0141C` (4.90:1 on white) is reserved for the logo, large display text and small accents.
  - Buttons use a deeper red `#C21018` (6.21:1 with white text). Red on navy fails contrast and is never used.
  - Over 60 color pairs were computed for light and dark mode, and every recommended pair passes WCAG AA.
- **Layout:**
  - Desktop: a split hero, with the message and a captioned video on the left and the survey on the right.
  - Mobile: the order is headline → survey → video.
  - Mobile card grids follow the brief: 2 columns for short cards, 3–4 only for compact items, 1 where needed, with touch targets of at least 44px.
- **Motion:** one trigger-once storytelling moment. No pinning, scroll scrubbing or continuous animation. Forms, purchases and dashboards stay instant, and `prefers-reduced-motion` is respected.
- **Trust components:** the Preferred Mover badge always carries a "what this means" explainer and its verification date. Honest "New to our network" and "No customer reviews yet" states are built in. There are no seals, eagles or faux-official marks.
- **Style tile checks:** axe-core found 0 accessibility violations at 360px and 1280px in light, dark and reduced-motion modes, with no horizontal scroll at 360px. The logo is a soft-edged raster, so a vector master and a trademark check are needed before launch.

## 10. Phased backlog

Full backlog with user stories, Given/When/Then acceptance criteria, dependencies and a scenario traceability matrix in `product/backlog.md`. Team assumption: 2 full-stack engineers, 0.5 designer, 0.5 SEO/content strategist (plus freelance writers), 0.25 QA, with external counsel and an accountant.

| Phase | Goal | Engineering | Calendar* | Exit gate |
|---|---|---|---|---|
| 1 Discovery | Validated rules, pricing and policy recommendation | 0–1 ew + research | W1–4 | Decisions logged; mover-interview readout |
| 2 Spec & architecture | Buildable spec and production-shaped skeleton | 3–5 ew | W1–5 | CI green; staging deployed; RLS tests pass |
| 3 Brand & designs | One coherent system plus representative screens | 2–3 ew + 4–6 design-weeks | W3–10 | Design sign-off; usability round 1 |
| 4 Intake & validation | Valid, consented requests become sellable lead groups | 6–8 ew | W5–11 | End-to-end in staging; counsel copy sign-off |
| 5 Matching, purchase, payments, credits | Safe purchases with correct money movement | 7–10 ew | W9–16 | Purchase/credit acceptance scenarios green in Stripe test mode |
| 6 Portals, CRM, teams, verification, reviews | Movers self-serve; ops run without engineers | 12–16 ew | W12–22 | Onboarding end-to-end without engineering help |
| 7 Content, SEO, rollout | Gated priority-market pages, trust content, measurement | 6–8 ew + 10–16 content-weeks | W8–24 | Batch 1 published; page-quality scenarios green |
| 8 Launch validation & handover | Proven production readiness | 4–6 ew | W23–27 | Launch checklist complete (restore drill, reconciliation demo, audits) |
| **Total** | | **40–57 ew (46–66 with 15% contingency)** | **≈ 26–30 weeks** | |

\*Assumes 2 engineers in parallel, overlapping phases, and decisions arriving on time. A **one-market pilot is possible around weeks 15–18**, once Phases 4 and 5 and admin-assisted verification are done and counsel has signed off.

**The critical path is mostly not engineering:**
- counsel sign-off (before any real leads)
- your approval of the credit policy, prices and refunds (before live billing)
- the FMCSA WebKey and network access (an admin-assisted fallback keeps the pilot moving)
- recruiting movers in each launch market (this gates indexable pages)
- content throughput (0.5 FTE can't produce 10–16 content-weeks; add freelance writers or shrink batch 1)

**Top risks:**
- the MC requirement excluding local movers
- the marketplace's legal classification and consent rules
- slow ranking for a new domain
- movers rejecting the shared-lead credit policy, to be tested in interviews and the pilot

## 11. Consolidated questions for the owner

Each question has a recommended default. Answering "accept defaults" on any item is enough to proceed. Items 4, 6 and 7 block live billing; items 2 and 10 block launch.

| # | Topic | Question | Recommended default |
|---|---|---|---|
| 1 | **Production domain & identity** | Which domain is ours, and can you grant DNS access? What legal entity name, business address and support email/phone should appear in disclosures? | americanmovingchoice.com (if registered), with DNS on Cloudflare |
| 2 | **Business classification & counsel** | Who is counsel, and by when can they review: (a) our lead-marketplace vs broker position, especially for exclusive leads; (b) the consent draft (`business-rules/consent-and-disclosure-copy-draft.md`); (c) privacy policy, consumer terms and mover terms; (d) retention rules; (e) state moving-broker definitions (e.g. Florida)? | Engage counsel during Phase 2. No live leads until sign-off |
| 3 | **Launch markets** | Approve the proposed Wave 1 markets (§8), or name markets where you already have mover relationships? | Wave 1 as proposed, adjusted to where pilot movers actually operate |
| 4 | **Provider coverage & eligibility** | How many movers can you bring to a pilot, and where? Do they all hold USDOT + MC + household-goods carrier authority? Keep MC mandatory? That excludes intrastate-only local movers, and FMCSA has announced plans to stop issuing MC numbers. | Keep MC mandatory (the setting exists). Aim for at least 3 approved movers with explicit coverage per city or route page, and 5 per state page, before indexing (site architecture §4.1 G1) |
| 5 | **Sharing limit** | What is the most companies a consumer may choose? Should any option be preselected? | Maximum 5; nothing preselected |
| 6 | **Pricing policy** | Approve the equalizing step-down (100/80/65/55/50%) or pick another option or schedule? Should a company's prices also vary by move category (local / in-state / interstate), not only exclusive vs shared? What are the starting price bands? | Approve step-down. **Yes to per-category prices:** interstate leads are worth far more (Semrush CPCs for long-distance terms run ~$38–$51 vs ~$17–$26 for city "movers" terms). Price bands set from pilot data |
| 7 | **Refunds & credits** | Valid quality-claim reasons, claim window, credit vs cash, credit expiry, closure treatment, dispute fees? | Account credit by default; 72-hour window with evidence; credits don't expire; disputes per mover terms |
| 8 | **Payments & tax** | Do you have a verified Stripe account? Card-only purchases at launch? Who is the accountant for sales tax on lead sales (e.g. Washington, Texas) and for credit-liability accounting? | Card-only purchases; ACH prepaid top-ups later; accountant review in Phase 5 |
| 9 | **Budget, team & timeline** | What are the build team and budget (the estimates assume the team in `product/backlog.md`), the monthly operating and content budget, the photo/video budget and the target launch date? Who are the named authors and reviewers with real credentials? Is there a paid-ads budget at launch? | Organic-first launch with a small paid-search test once tracking is verified |
| 10 | **Integration access** | Approve creating Supabase and Vercel projects (billable). Provide: Stripe test keys; an FMCSA QCMobile WebKey (via Login.gov); Search Console, GA4 and Bing Webmaster access; Twilio (A2P 10DLC registration takes weeks and needs your EIN); Postmark; Cloudflare. Reconnect Similarweb and Figma. Widen this environment's network allowlist (reference sites, fmcsa.dot.gov, federalregister.gov, ecfr.gov, census.gov, huduser.gov). | Start A2P 10DLC and the FMCSA WebKey now; they have the longest lead times |
| 11 | **Car shipping & truck rental** | Is it OK that standalone vehicle shipping and truck rental are information-only at MVP (no lead sales), with a vehicle add-on for household moves? | Yes. Revisit a separately verified auto-transport *carrier* network later |
| 12 | **AI crawler access** | Allow AI **search** crawlers? Separately, allow AI **training** crawlers? | Allow search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, plus Googlebot/Bingbot). Training crawlers are your call; we suggest allowing them at launch and reviewing quarterly |
| 13 | **Repository** | The repo had no commits, so this branch is its only branch and there is nothing to open a pull request against. May I create a `main` branch (an empty initial commit) so the work can go through a reviewed draft PR? | Yes: create `main`, then open the draft PR from this branch |

**While you decide**, independent work continues in this order:
1. Monorepo app scaffolding and CI preview deployments (no billable resources without approval).
2. Geography import pipeline (Census + HUD crosswalk) once the network allowlist permits.
3. Quote-survey UI built against the consent draft, with copy behind feature flags until counsel approves.
4. The FMCSA verification client against recorded fixtures.
