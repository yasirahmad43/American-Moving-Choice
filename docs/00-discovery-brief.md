# American Moving Choice: Discovery & Implementation Brief (Phase 1)

**Date:** 2026-10-27 · **Status:** Phase 1 deliverable for review · **Branch:** `claude/fervent-bohr-u9rg4y`

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
| **Evidence** | 23 unit tests + 15 PostgreSQL integration tests passing locally and in GitHub Actions; the race suite passed 10/10 repeated runs. Semrush exports in `research/raw/semrush/`. Every regulatory claim is cited with an access date. |
| **Not done / not production-ready** | No public site, portals, payments integration, verification client, CMS or analytics yet. The financial policy and consent wording await your and counsel's approval. Competitor flows were not observed in a live browser (network policy). |
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
- **Network restriction:** this cloud environment's network policy refused direct connections to the reference sites, fmcsa.dot.gov and federalregister.gov. Research used web search results that quote those pages. Every fact is cited, and anything not confirmed from a primary source is marked UNVERIFIED. Someone should walk each competitor quote flow in a real browser and open the key FMCSA/FCC/FTC pages directly before launch.

## 3. Reference-site findings

Ranked by Semrush estimated US organic traffic (October 2026): ConsumerAffairs (~420k/mo), HomeGuide (~326k), EnergySage (~239k, a model rather than a competitor), HireAHelper (~125k), Move.org (~108k), Moving.com (~65k), moveBuddha (~38k), MyGoodMovers (~26k), Unpakt (~6k), Budget Van Lines (~2k), Consumer Moving Reviews (<1k). See `research/keyword-research.md` for method and caveats.

What matters most (full matrix in `research/reference-matrix.md`):
1. **Value before contact details.** The strongest flows (moveBuddha's estimator, HireAHelper's priced listings) give something useful before asking for a phone number. Broker-style flows ask for contact details first and then "multiple movers will be in touch". We ask move details first, explain why we need contact details, and show exactly how many and which movers may receive them.
2. **Say how many companies will call.** Most references don't, or bury it. Our consumer-selected limit (1 = exclusive) is a real differentiator.
3. **Consent quality is weak across the category** (bundled arbitration, sitewide autodialer consent in terms). Ours names the movers, uses a separate unchecked box, and keeps full evidence.
4. **Profiles:** HireAHelper's structure (rates, policies, booked-move counts) is the best model, but stale reviews and placeholder data hurt trust. We show freshness dates, verification dates and honest empty states.
5. **Ratings must be consistent and genuine.** One reference shows different scores for the same company on different pages. We keep one source of truth, show quote and move experiences separately, and never fabricate ratings.
6. **Traffic drivers:** cost calculators (≈30% of moving.com's organic traffic), city "movers" pages (HireAHelper's model), "best X companies" guides (Move.org) and brand cost content. State hubs are a gap competitors barely serve. Route pages exist only at moveBuddha and are small.
7. **Avoid:** undisclosed broker roles, fake-looking ratings, contact gates before value, and near-empty permutation pages such as ZIP-to-ZIP routes.

## 4. Proposed MVP and later enhancements

Summary below; the full prioritization is in `product/mvp-scope.md`.

**MVP (launch in Wave 1 markets):**
- Public site: home, quote survey + confirmation, trust pages (How We Verify Movers, Movers vs Brokers, Review Methodology, Advertising Disclosure, Editorial Policy), Wave 1 state/city/route pages that pass the publishing gate, cost guide + calculator, Preferred Movers directory and company profiles, "for movers" lead-buying pages.
- Lead intake: progressive survey, validation and risk scoring, duplicate grouping, consent evidence, honest no-coverage handling.
- Mover onboarding: application, FMCSA API checks + document upload, admin review, approval → profile + badge.
- Marketplace: matching, real-time previews, exclusive/shared purchase with card + account credit, the recommended credit policy (after approval).
- Company portal: purchased leads, CRM pipeline (configurable stages, notes, tasks, assignment, follow-ups, lost reasons, exports), billing (payment methods, receipts, credits, quality claims), team roles, notification preferences, reviews and reputation.
- Admin portal: companies and verification, pricing and settings, leads and consent records, purchases/disclosures, refunds/disputes, reconciliation, content workflow, profiles, reports, audit log.

**Later:** ACH prepaid wallet; CRM add-ons (automations, two-way SMS/email from the CRM, call tracking, calendar sync, integrations with moving-software platforms, API access); original data reports once enough consented data exists; additional buyer categories (e.g. auto-transport *carriers*) with the same carrier-only rule; native apps if usage warrants.

**Out of scope initially:** bidding, consumer–mover messaging on the platform, booking/deposits, native apps.

## 5. Recommended stack and architecture

Next.js on Vercel (public site + separate authenticated portal app), PostgreSQL on Supabase (Auth with MFA, Realtime, Storage, RLS as defence in depth), Payload CMS, Stripe, a transactional outbox with Inngest jobs, Postmark/Twilio, Turnstile, Sentry, GA4/Search Console/Bing/PostHog. Rough fixed platform cost is **$250–$600/month** before usage-based fees, people and ads. Details, tradeoffs and alternatives are in `architecture/stack-and-architecture.md`, and the full data model is in `architecture/data-model.md`.

**Already built and tested in this branch** (useful independent work while answers are pending, all in test mode with no live money):
- `packages/core`: matching engine (nationwide, origin-only, destination-only, directional routes, any-within-group, all-groups-required, exclusions override, paused rules, capability ceiling), eligibility snapshots, shared-lead calculator, allow-list preview redaction, ZIP/phone normalization, duplicate-group limit. **23 unit tests passing.**
- `db/migrations/001_marketplace_core.sql`: transactional purchase core in PostgreSQL. **15 integration tests passing** against Postgres 16, including:
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

*(Summary to be completed from `seo/site-architecture.md`.)*

## 9. Proposed visual direction

*(Summary to be completed from `design/visual-direction.md`.)*

## 10. Phased backlog

*(Summary to be completed from `product/backlog.md`.)*

## 11. Consolidated questions for the owner

Each question has a recommended default. Answering "accept defaults" on any item is enough to proceed. Items 4, 6 and 7 block live billing; items 2 and 10 block launch.

| # | Topic | Question | Recommended default |
|---|---|---|---|
| 1 | **Production domain & identity** | Which domain is ours, and can you grant DNS access? What legal entity name, business address and support email/phone should appear in disclosures? | americanmovingchoice.com (if registered), with DNS on Cloudflare |
| 2 | **Business classification & counsel** | Who is counsel, and by when can they review: (a) our lead-marketplace vs broker position, especially for exclusive leads; (b) the consent draft (`business-rules/consent-and-disclosure-copy-draft.md`); (c) privacy policy, consumer terms and mover terms; (d) retention rules; (e) state moving-broker definitions (e.g. Florida)? | Engage counsel during Phase 2. No live leads until sign-off |
| 3 | **Launch markets** | Approve the proposed Wave 1 markets (§8), or name markets where you already have mover relationships? | Wave 1 as proposed, adjusted to where pilot movers actually operate |
| 4 | **Provider coverage & eligibility** | How many movers can you bring to a pilot, and where? Do they all hold USDOT + MC + household-goods carrier authority? Keep MC mandatory? That excludes intrastate-only local movers, and FMCSA has announced plans to stop issuing MC numbers. | Keep MC mandatory (the setting exists). Aim for at least 3 approved movers per Wave 1 market before indexing its pages |
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
