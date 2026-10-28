# SEO site architecture, page families and rollout plan

> **Revised after the reference-site review.** This plan was revised after the reference-site review completed on 2026-10-27 ([review README](../research/reference-review/README.md)). The page families (§1) and URL patterns (§2) are confirmed, with the changes listed in "Changes after the reference review" below. Items that wait on an owner or counsel decision are marked **pending**. No content briefs or page copy are included in this version.

**Status:** proposal for review, revised after the reference-site review · **Date:** 2026-10-28 (first version 2026-10-27) · **Workstream:** SEO / content
**Companion files:** `docs/seo/keyword-to-page-map.csv` (298 keywords → 134 URLs), `docs/seo/raw/` (new Semrush pulls), `docs/research/keyword-research.md`, `docs/research/reference-matrix.md` (v2, "matrix"), `docs/research/compliance-and-platform-facts.md` ("compliance facts"), `docs/research/reference-review/` (the 11 site reviews in `sites/` and `implications-for-content-seo-design.md`, cited as "implications"), and the business rules in `docs/business-rules/` ("lead lifecycle", "mover verification", "consent draft", "shared pricing").

**Data rules used here.** All volumes, KD and CPC values are Semrush US-database figures pulled 2026-10-27. They are models, not first-party analytics. Nothing has been estimated or invented. Anything not yet measured is marked **[missing]**, and facts that still need a primary-source check are marked **[verify]**. This container cannot fetch most external sites (proxy 403). The reference review has since captured competitor pages as text in a headless browser (2026-10-27; no screenshots reviewed). Live SERP features and People Also Ask boxes are still not observed. Claims from the review keep its evidence labels ([capture], [walk], [semrush], [search], [v1], [inference], [cross-site analysis]; defined in the review README). `sites/x.md` means `docs/research/reference-review/sites/x.md`, the verified review of that site.

---

## Changes after the reference review

This revision applies every change the review proposes for this file: SA-1 to SA-20 in [implications §6.9][impl-69] and [§10][impl-10], which carry decisions D4 and D7 to D13 ([§1][impl-1]). It also applies two additions that name sections of this file without an SA number: the internal-link rules in [§6.6][impl-66] and the no-savings rule in [§4.5][impl-45]. **Pending** marks an item that waits on the owner or counsel.

| Change | Sections | What changed | Evidence |
|---|---|---|---|
| SA-1 | Header; §0 to §2 headings | "Provisional" removed; owner- and counsel-dependent items marked **pending** | [README][readme]; [implications §6.9][impl-69] |
| SA-2 | §0 items 4, 5 and new 9 | No mover phone numbers on cards, lists or geo pages (profiles **pending**). Sponsored slots stay out of ranked lists, consent lists, awards and comparisons, and never say "Preferred", "Featured" or "Partner". Badge name **pending** counsel | [implications §5][impl-5], [§11 Q7][impl-11]; [Move.org][s-mo]; [moveBuddha][s-mb]; [CMR][s-cmr] |
| SA-3 | §1.1; §1.2 B2B | Self-serve Apply first. `/for-movers/` publishes its buying rules and sells no rankings, awards, placement or editorial coverage | [implications §9.1][impl-91]; [Move.org][s-mo]; [Moving.com][s-mc] |
| SA-4 | §1.2 Quote survey, Geo index | One survey on `www`, with no third-party form host; the confirmation names the consent-list movers. `/movers/` gets dated per-state counts, a matching explanation and method links | [implications §2.5][impl-25]; [moveBuddha][s-mb]; [MyGoodMovers][s-mgm]; [Move.org][s-mo] |
| SA-5 | §1.2 Cost calculator | "The top 10 are all working tools" replaced. A range before contact, an H1, a method page and one model for widget and results | [Move.org][s-mo]; [moveBuddha][s-mb]; [implications §2.7][impl-27] |
| SA-6 | §1.2 Verify a mover | Aimed at checking a mover before hiring; forecast well below 4.4k | [moveBuddha][s-mb]; [implications §6.1][impl-61] |
| SA-7 | §1.2 directory; §2.1; §2.3; §3.1; §3.2; §5.3; §8.2 | Directory name and slug **pending**, written `{directory}`; a neutral badge anchor; a published sort rule; Sponsored items kept outside ranked order | [implications §5.3][impl-53]; [MyGoodMovers][s-mgm]; [HomeGuide][s-hg] |
| SA-8 | §1.2 Company profile, Utility; §2.1 | `/reviews/` only at 10 eligible reviews; sourced, dated credential rows; a company-provided block; related-party disclosure; a token-gated review form | [implications §4.2][impl-42], [§4.4][impl-44]; [Move.org][s-mo]; [CMR][s-cmr]; [MyGoodMovers][s-mgm] |
| SA-9 | §1.2 Comparison; §4.6 | No composite score, no related-party picks, the paid line inside the list, no rating-based rank under 5 reviews, no awards | [CMR][s-cmr]; [MyGoodMovers][s-mgm]; [Move.org][s-mo] |
| SA-10 | §1.2 Trust pages; §2.1; §2.2; §2.4; §5.3 | "Which companies receive my request" added; `/advertising-disclosure/` named "How AMC makes money"; partner forms on `www` and widgets `noindex`; rating sorts apply the minimum sample | [implications §3.4][impl-34], [§4.4][impl-44]; [Unpakt][s-up]; [Moving.com][s-mc]; [moveBuddha][s-mb] |
| SA-11 | §3.3 rule 4; §7.4 | Geo and route pages open with the H1 and an answer holding two dated, page-specific data points. National, sponsored and quote modules sit below. A crawl checks the first 150 words | [Move.org][s-mo]; [implications §6.8][impl-68] |
| SA-12 | §0; §4.1 G1, G4, G7, G10 | G1 counts approved movers with explicit coverage and equals the count shown; G4 is required for state hubs once data exists; shared mover cards count as template; G10 adds a working survey entry | [HireAHelper][s-hah]; [moveBuddha][s-mb]; [MyGoodMovers][s-mgm]; [implications §7.5][impl-75] |
| SA-13 | §4.5; §5.1; §5.3 | Profiles with brand demand reviewed first; forum-and-social count added as input W; a build and KPI order, with state hubs and city pages measured once each passes G1 | [implications §6.1][impl-61]; [CMR][s-cmr]; [HireAHelper][s-hah] |
| SA-14 | §6.3; §6.4 | Scope stated wherever a range appears, titles included; one dataset by metric ID, with a widget-results test; "recent request mix" rules, for counsel; the sample-brief deferral lifted | [Moving.com][s-mc]; [moveBuddha][s-mb] |
| SA-15 | §1.2 Home; §7.1 to §7.3; §8.2 | One stored role-and-money statement for body, meta, Organization and consent; legal entity, owner and ties; an author, a different reviewer and a data owner; methodology scope; earned dates | [implications §3.4][impl-34], [§6.7][impl-67]; [CMR][s-cmr]; [MyGoodMovers][s-mgm]; [moveBuddha][s-mb]; [Move.org][s-mo] |
| SA-16 | §0; §7.6; §7.7; §8.3 | OAI-AdsBot added as a business decision; bots challenged only at quote submission; a monthly verified-bot check; a wider AI baseline | [ConsumerAffairs][s-ca]; [moveBuddha][s-mb]; [Budget Van Lines][s-bvl] |
| SA-17 | §8.2; §8.5; §8.7 | No "best", "top {n}" or fixed counts in geo and route titles; metas read the page record; the B2B H1 drops "licensed"; a schema lint and one rating type in profile markup; §8.7 points to §8.8 | [implications §6.5][impl-65]; [Unpakt][s-up]; [Moving.com][s-mc]; [HireAHelper][s-hah] |
| SA-18 | New §8.8 | Tag policy for survey, contact, consent and confirmation pages; §8.6 stays portal-only | [implications §3.5][impl-35]; [HireAHelper][s-hah]; [EnergySage][s-es] |
| SA-19 | §9 | Drift checks cover figures by metric ID, ratings and the role text; a daily synthetic walk of every survey entry; a verified-bot check in the logs | [implications §2.7][impl-27]; [MyGoodMovers][s-mgm]; [Unpakt][s-up] |
| SA-20 | §11 | New pulls: Wave 1 state cost keywords, a "preferred movers" search and AI check, and keyword lists for reference outlier pages | [implications §7.5][impl-75], [§5.3][impl-53] |
| Implications §6.6 | §3.2; §3.3 rule 2; §4.4; §9 | Source links on numbers; no header links to single movers; no mover phones in lists; a cannibalization alert for `/compare/` against city long-distance pages | [implications §6.6][impl-66]; [Move.org][s-mo] |
| Implications §4.5 | §6.3 rule 6; §11 | No savings, "people helped", booked-move or job-count claims; the facts registry covers every public number | [implications §4.5][impl-45]; [Unpakt][s-up]; [Budget Van Lines][s-bvl] |
| Consistency | §2.3 | Breadcrumbs skip a level that is not yet published, because the build order can put a long-distance page live before its city page or state hub | SA-13; [implications §6.1][impl-61]; §3.3 rule 2 |
| Consistency | §5.3 | The build order and the writing order in the implications differ. Here the build order sets build priority and Wave 1 KPIs; it does not change what launches in batch A (§4.7), and trust pages are written first | SA-13; [implications §6.1][impl-61], [§7.1][impl-71] |
| Consistency | Header; §0; §5.3; §8.2; §9; §10; §11 | Nine business decisions, not eight; ten Wave 1 trust pages, not nine; the three role-statement metas are exempt from the data-point rule; survey analytics follow §8.8; the §10 seo-sxo entry notes the SA-5 correction; the data rules and §11 say what the review captured | SA-2; SA-5; SA-10; SA-15; SA-18; [README][readme] |

**Confirmed** (the approach is kept, and SA items refine some sections), per [implications §6.9][impl-69]: the §0 geo, profile, route and ZIP decisions, gate first, no FAQ or HowTo rich results, and answer agents allowed; §1.1 and §1.2; §2.1 to §2.5, where EnergySage's location-filled ZIP shows why §2.5 bans IP-based content swapping [walk; sites/energysage.md]; §3.1 to §3.3; §4.1 to §4.4, §4.6 and §4.7, which are stricter than any reference, since none showed a coverage gate [cross-site analysis]; §5.2 and §5.3, including New York entering through routes ("movers nyc" is KD 72) [semrush phrase_these_2026-10-27.csv; sites/unpakt.md]; §6.1 to §6.3; §7.1 to §7.5; §8.1, §8.3, §8.4, §8.6 and §8.7; and §10.

**Companion changes in other documents** (owned there, not made in this file): the discovery brief §8 drops its "provisional" note in the same change set as SA-1 ([implications §10][impl-10]); [matrix][matrix] §1 and §6 stop calling this plan provisional; visual direction §13.4 uses the `/moving-routes/{origin}-to-{destination}/` pattern from §2.1 (matrix §6); the keyword map's two directory rows, which point to `/preferred-movers/`, follow the §0 item 9 decision; and the "smaller metros are achievable" fix belongs to keyword research §2 (SA-13).

[readme]: ../research/reference-review/README.md
[matrix]: ../research/reference-matrix.md
[impl-1]: ../research/reference-review/implications-for-content-seo-design.md#1-decisions-this-review-supports
[impl-5]: ../research/reference-review/implications-for-content-seo-design.md#5-preferred-movers-naming-and-trademark-risk
[impl-10]: ../research/reference-review/implications-for-content-seo-design.md#10-changes-to-existing-documents
[impl-11]: ../research/reference-review/implications-for-content-seo-design.md#11-open-questions-for-the-owner
[impl-25]: ../research/reference-review/implications-for-content-seo-design.md#25-after-submit
[impl-27]: ../research/reference-review/implications-for-content-seo-design.md#27-failure-modes-seen-in-the-walks
[impl-34]: ../research/reference-review/implications-for-content-seo-design.md#34-the-role-and-money-statement
[impl-35]: ../research/reference-review/implications-for-content-seo-design.md#35-tag-policy
[impl-42]: ../research/reference-review/implications-for-content-seo-design.md#42-credential-rows
[impl-44]: ../research/reference-review/implications-for-content-seo-design.md#44-reviews
[impl-45]: ../research/reference-review/implications-for-content-seo-design.md#45-facts-registry-and-claims
[impl-53]: ../research/reference-review/implications-for-content-seo-design.md#53-recommendation
[impl-61]: ../research/reference-review/implications-for-content-seo-design.md#61-page-families-to-build-first
[impl-65]: ../research/reference-review/implications-for-content-seo-design.md#65-structured-data
[impl-66]: ../research/reference-review/implications-for-content-seo-design.md#66-internal-links
[impl-67]: ../research/reference-review/implications-for-content-seo-design.md#67-e-e-a-t
[impl-68]: ../research/reference-review/implications-for-content-seo-design.md#68-content-shapes-for-ai-answers
[impl-69]: ../research/reference-review/implications-for-content-seo-design.md#69-site-architecture-what-is-confirmed-and-what-changes
[impl-71]: ../research/reference-review/implications-for-content-seo-design.md#71-first-pieces-to-write
[impl-75]: ../research/reference-review/implications-for-content-seo-design.md#75-state-hubs
[impl-91]: ../research/reference-review/implications-for-content-seo-design.md#91-published-buying-rules
[s-ca]: ../research/reference-review/sites/consumeraffairs.md
[s-hg]: ../research/reference-review/sites/homeguide.md
[s-bvl]: ../research/reference-review/sites/budgetvanlines.md
[s-mc]: ../research/reference-review/sites/movingcom.md
[s-up]: ../research/reference-review/sites/unpakt.md
[s-cmr]: ../research/reference-review/sites/consumermovingreviews.md
[s-es]: ../research/reference-review/sites/energysage.md
[s-hah]: ../research/reference-review/sites/hireahelper.md
[s-mb]: ../research/reference-review/sites/movebuddha.md
[s-mo]: ../research/reference-review/sites/moveorg.md
[s-mgm]: ../research/reference-review/sites/mygoodmovers.md

---

## 0. Decisions at a glance

| Topic | Decision |
|---|---|
| Geo pages | `/movers/{state}/` → `/movers/{state}/{city}/` → `/movers/{state}/{city}/long-distance/`. Full state slugs, never 2-letter codes. |
| Company profiles | Live under `/companies/{slug}/`, outside `/movers/`, so a company slug can never collide with a state slug. |
| Routes | Directional state routes at `/moving-routes/{origin}-to-{destination}/`. A→B and B→A are separate pages, each with its own gate, and are never canonicalized to each other. City-to-city routes stay unindexed until they pass a stricter gate. Wave 1 indexes none. |
| ZIP pages | No indexable ZIP pages in any planned wave. ZIPs are used only for matching and to prefill the quote form. |
| Indexation | A programmatic page gets no public URL until it passes its gate (§4). Pages that later fall below the gate switch to `noindex` (with hysteresis), then are consolidated. |
| Wave 1 markets | **Texas** (Dallas, Houston, Austin, San Antonio), **Florida** (Orlando, Miami, Tampa, plus Jacksonville as a reserve) and **California** (Los Angeles metro only), plus 16 directional state routes (§5). |
| Gate thresholds | Each of these must be met, not averaged: ≥3 approved movers with explicit coverage (≥5 for state pages), ≥3 verified local facts, a sourced and dated cost block, ≥4 unique FAQs, ≥40% unique content (hard fail below 30%), and a named human reviewer. Full table in §4. |
| Rich results | No FAQ or HowTo rich results in the plan. Google retired FAQ rich results for all sites on 2026-05-07, and HowTo was removed in 2023 (compliance facts §5). FAQ sections exist for users and AI answers only. |
| AI crawlers | Allow search and answer agents. Training crawlers and OAI-AdsBot are separate business decisions; the recommendation and options are in §7.6. |

**Decisions this plan needs from the business** (feed into the consolidated question list):
1. **Production domain.** This doc assumes `https://www.{domain}/` for the public site and `https://app.{domain}/` for the portals.
2. **Movers without an MC number.** The platform rule "USDOT **and** MC required" excludes intrastate-only movers, who hold state credentials instead (TxDMV, FDACS IM#, CA Cal-T). That shrinks coverage for **local** city pages. FMCSA has also proposed ending MC numbers (compliance facts §1). Local city pages depend on this decision.
3. **State credential verification.** Texas requires TxDMV registration to move household goods for compensation within Texas, and Florida and California have their own regimes. Local-move pages in Wave 1 states should show and verify these numbers. This needs a verification pipeline.
4. **Mover contact details.** No mover phone numbers on cards, lists or geo pages. A direct call skips the count question and named-mover consent, and Move.org and moveBuddha put phone numbers on ranking and partner cards [capture; inference; sites/moveorg.md; sites/movebuddha.md]. On profiles the choice is **pending** (implications §11 Q7). The recommended default shows at least the website, so a consumer who declines consent can still reach a mover. If contact details are hidden, the profile says so. Whatever is decided, structured data must match what is visible on the page.
5. **Sponsored placement.** Recommended: none at launch (mover verification §9 decision 5). If any paid placement exists, it is labeled "Sponsored" and sits outside ranked lists, consent lists, awards and comparisons. It never uses "Preferred", "Featured" or "Partner", and it never affects verification status, ratings, review display or order (FTC guidance; compliance facts §4; mover verification §4). Move.org's sponsored slots are called "Preferred Partner" and "Featured Partner" (/disclosure/) [capture; sites/moveorg.md].
6. **Training-crawler policy** (§7).
7. **Adjacent verticals.** Car shipping is broker-dominated and conflicts with the movers-only policy. Truck rental is DIY intent. Neither gets pages before a scope decision.
8. **Spanish content** for TX, FL and CA, considered after launch. If it happens, it must be real translated pages with hreflang.
9. **Badge and directory name (pending).** "Preferred Mover" is a screening status that every approved mover gets, never a paid badge (mover verification §4). The name still needs counsel clearance and a comprehension test before Phase 3 design sign-off (implications §5). In this market "Preferred" already labels paid or tied status: Move.org's sponsored "Preferred Partner" slots, and CMR's owner, "Preferred Movers Network Inc." (/best-interstate-moving-companies/) [capture; sites/moveorg.md; sites/consumermovingreviews.md]. Either way, "Preferred" is never used for a paid product or without the house name, and the directory slug and badge anchor stay neutral, so a later rename needs no redirects (implications §5.3). The slug, written `{directory}` in §1.2 and §2.1, is fixed after the "preferred movers" search and AI check in §11.

---

## 1. Page families

### 1.1 Consumer vs business intent

| | Consumer (hire a mover / plan a move) | Business (movers buying leads) |
|---|---|---|
| Example queries | "moving companies dallas", "moving from new york to florida", "how much do movers cost" | "buy moving leads" (720/mo, KD 18), "exclusive moving leads" (480, KD 9), "long distance moving leads" (390, KD 4) |
| Namespace | Everything except `/for-movers/` | `/for-movers/` only |
| Primary CTA | Quote survey (`/get-quotes/`, embedded entry points) | Self-serve Apply first (`/for-movers/apply/`), with "talk to us" second |
| Navigation | Main nav | Header utility link and footer only |
| Rules | No B2B CTAs or lead-pricing talk on consumer pages | No consumer quote form, no consumer FAQs. Before sign-up, publishes the price basis, the consumer-set cap, shared-lead credits and claim reasons (company prices stay private). Sells no rankings, awards, placement, review products or editorial coverage |

The B2B rules follow implications §9.1, §9.2 and §9.8. Move.org lists rankings and awards under partner "Editorial opportunities" (/partnership/), and no captured provider page showed prices, caps and refund terms together [capture; sites/moveorg.md; sites/movingcom.md; cross-site analysis].

### 1.2 Family table

Everything below is for consumers unless marked B2B. "Gate" refers to §4.

| Family | URL | Purpose / intent | Indexation rule | Minimum differentiation and data |
|---|---|---|---|---|
| Home | `/` | Brand, plus the head term "moving companies" (135k/mo, KD 62, a long-horizon target) | Index | AMC role-and-money statement (§7.1), how sharing works, trust summary, links to published hubs |
| Quote survey | `/get-quotes/` | Transactional: "moving quotes" (12.1k, KD 52), "moving company quotes" (6.6k), "free moving quotes" (720) | Index the landing page only. Survey steps are client state, not URLs. `/get-quotes/confirmation/` is `noindex` | Plain explanation of who receives the request and of the sharing limit; movers-only policy; consent disclosure. One survey on `www` under AMC's name, with no third-party form host; moveBuddha's partner form runs on another host [walk; sites/movebuddha.md]. The confirmation names the movers listed at consent (implications §2.5). Tags follow §8.8 |
| National service pillars | `/long-distance-movers/`, `/interstate-movers/`, `/local-movers/` (`/cross-country-movers/` only in W2+) | Commercial national pillars | Index | Original explanation of service types, FMCSA authority (interstate), verified-mover counts, cost links |
| Geo index | `/movers/` | Entry to the state hubs; satisfies "movers near me" through links | Index | Lists **published** hubs only, each with a dated count of approved movers. A short explanation of matching and the sharing limit, with links to the verification and review methods. ZIP/city search box. No IP-based content swapping. The hub is the #4 page at Move.org and the #2 page at MyGoodMovers [semrush top_pages_2026-10-27.csv, top_pages_more_2026-10-27.csv; sites/moveorg.md; sites/mygoodmovers.md] |
| State hub | `/movers/{state}/` | Commercial: "moving companies florida" (1.3k, KD 30), "texas movers" (1k, KD 34) | Gate (state) | A dated count of approved movers; state regulator section (who licenses intrastate movers, with an official link) **[verify per state]**; Census state-to-state migration data **[missing: pull]**; published children (cities, long-distance, routes); a cost block once §6.3 data exists (G4) |
| State long-distance | `/movers/{state}/long-distance/` | Commercial: "long distance movers florida" (390, KD 20, $45 CPC), "long distance movers texas" (260, KD 20, $50.63) | Gate (state LD) | ≥5 movers with interstate capability originating in the state; top outbound published routes; interstate rules summary |
| City page | `/movers/{state}/{city}/` | Commercial/local: "moving companies dallas" (4.4k, KD 42) and "movers dallas" (2.9k) share 8/10 top-10 URLs, so one page targets both | Gate (city) | Mover cards with credential rows that keep "based in" apart from "serves"; verified local facts; a scoped cost block; local FAQs answered from page evidence; neutral review excerpts under a published rule with no star filter (full gate in §4) |
| City long-distance | `/movers/{state}/{city}/long-distance/` | Commercial outbound: "long distance movers dallas" (390, KD 17, $38.22), "...houston" (320), "...los angeles" (880) | Gate (city LD) | Top destinations from this origin (Census county flows or AMC data, n ≥ 30); long-distance cost ranges; ≥40% unique vs the parent city page |
| ZIP | none | — | **Never indexable**; no public ZIP pages | Exception path for the future: a named **community** page (not a ZIP page) when demand ≥50/mo and coverage meets the city gate |
| State route (directional) | `/moving-routes/{origin-state}-to-{dest-state}/` | Mixed informational/commercial: "moving from new york to florida" (480, KD 10) and its variants | Gate (route) | Directional mover coverage; flow data; cost ranges by home size; departure and arrival requirements; must differ from the reverse route |
| City route | `/moving-routes/{city}-{st}-to-{city}-{st}/` | Long-tail city pairs (the largest measured is NYC→Miami at 90/mo) | Gate (city route). **Wave 1: none indexed.** Shown as anchored sections of state routes | As for state routes, plus ≥100/mo demand or ≥30 AMC leads in 6 months |
| Moving-to guide | `/moving-to/{state}/`, `/moving-to/{state}/{city}/` (W2) | Informational relocation: "moving to florida" (2.4k, KD 27; SERP dominated by Reddit, Facebook and Quora), "moving to texas" (1.3k, KD 12), "moving to dallas" (2.4k, KD 13) | Gate (moving-to) | Official arrival requirements with sources (DMV, vehicle registration); migration data; moving logistics. **Out of scope:** neighborhood and school recommendations (no expertise) |
| Cost guide | `/moving-costs/`, `/moving-costs/{local,long-distance,how-movers-charge}/` | Informational: the "how much do movers cost" family (9.9k, KD 32), "how do moving companies charge" (1.9k, KD 19) | Index once it passes editorial review | Ranges with stated assumptions, sources, dates and sample sizes (§6.3); "movers set their own prices" disclosure. State cost content (a state hub section or `/moving-costs/{state}/` spokes) is **pending** the Wave 1 state cost keyword pull (§11). MyGoodMovers' four state cost pages earn about twice its four state mover pages (1,489 against 782 visits) [semrush top_pages_more_2026-10-27.csv, computed; sites/mygoodmovers.md] |
| Cost calculator | `/moving-cost-calculator/` | Tool: "moving cost calculator" (5.4k, KD 49) and "moving cost estimator" (5.4k). Most top-10 URLs are calculators, but Move.org's #3 page (`/moving-costs/`) showed no calculator fields, in a capture that skips iframes [semrush phrase_organic_top10_2026-10-27.csv; capture /moving-costs/; sites/moveorg.md] | Index the tool page; **results never indexable** (no parameter URLs) | A server-rendered page with an H1 and a working range estimator that shows a labeled range before any contact field. One model version feeds the widget, the results view and the survey prefill, with a CI consistency test (§6.3 rule 6); moveBuddha priced one move two ways [walk; sites/movebuddha.md]. A versioned public method page. Wording must not read as a quote or binding estimate (FMCSA red flag; counsel question) |
| Verify a mover | `/verify-a-mover/` | Tool for consumers checking a mover before hiring: "usdot number lookup" (4.4k, KD 18), "mc number lookup" (2.4k, KD 30), "what is a usdot number" (880). FMCSA and trucking-compliance pages lead the "usdot number lookup" top 10, with one mover blog at #3, so forecast well below 4.4k [semrush seo/raw/semrush_phrase_organic_top10_2026-10-27.csv]. moveBuddha's USDOT guide earns 509 visits [semrush top_pages_2026-10-27.csv; sites/movebuddha.md] | Index the landing page only. **Lookup results are `noindex`**, with no static page per carrier | Title and H1 address checking a mover before hiring; the USDOT and MC explainers are sections. Explains USDOT, MC and state licenses; current MC-number status; data timestamp; "not an endorsement" |
| Mover directory (name **pending**, §0 item 9) | `/{directory}/`, `/{directory}/page/{n}/`. Slug **pending**: a neutral word that does not depend on the badge name, so a rename needs no redirects (implications §5.3) | Commercial/navigational: "moving company reviews" (880) | Index (paginated pages self-canonical) | Public definition of the badge: a screening status every approved mover gets, never a paid one (mover verification §4). A published sort rule with no money input (purchases, balances, budgets or plans), no review-count default and no rating-sort priority under 5 eligible reviews (implications §4.4). Any Sponsored item is labeled and kept outside the ranked order. MyGoodMovers' Terms let paid plans change listing order, and HomeGuide drops out-of-budget pros from results until Monday [capture /terms-and-conditions; search: help.homeguide.com article 486, own page; sites/mygoodmovers.md; sites/homeguide.md] |
| Company profile | `/companies/{slug}/`; `/companies/{slug}/reviews/` only once the company has 10 eligible reviews (until then, reviews sit on the profile) | Entity pages | Live on approval. Indexed when the profile-completeness gate passes (§4.5); `noindex` while suspended | Credential rows (USDOT number, MC number while required, authority type, "no broker authority on record", insurance filings, any verified state credential), each with a source link and an absolute check date (implications §4.2). Company-provided facts sit in a separate block, never under an FMCSA credit line, where Move.org lists GPS tracking [capture /allied-moving-reviews/; sites/moveorg.md]. Any tie to AMC's people is disclosed (implications §4.3). Original description, actual coverage ("based in" apart from "serves"), genuine reviews or "No customer reviews yet". Contact details per §0 item 4 |
| Comparison | `/compare/{slug}/` | Commercial: "best long distance moving companies" (**49.5k, KD 36**, $27.44) | Comparison gate (§4.6). Earliest W2 | Published methodology, inclusion independent of membership, material-connection disclosure, sourced claims, counsel review. The §4.6 extensions: no composite score, no related-party picks, the paid line inside the list, no rating-based rank under 5 reviews, no awards |
| Guides | `/guides/`, `/guides/{slug}/` | Informational: "moving out of state" (2.4k, KD 12), scams, estimates, rights | Index once it passes editorial review | Named author and reviewer, citations, dates, a defined information-gain statement (§6) |
| Trust pages | `/how-we-verify-movers/`, `/movers-vs-brokers/`, `/review-methodology/`, `/advertising-disclosure/` (page name and header link: "How AMC makes money"), `/which-companies-receive-my-request/` (MVP scope M11), `/editorial-policy/`, `/about/`, `/contact/`, `/complaints/`, `/report-a-concern/` | Entity and trust; "movers vs brokers" (110, KD 6), "moving broker" (320, KD 12) | Index | Specific, supportable statements only (no "government approved", "guaranteed" or "the best"). "How AMC makes money" carries the role-and-money statement (§7.1). "Which companies receive my request" explains the count question, the movers named at consent, removal, and that a request is never resold (implications §3.3) |
| Authors | `/authors/{slug}/` | E-E-A-T | Index | Real person, truthful credentials, list of articles |
| B2B | `/for-movers/`, `/for-movers/moving-leads/`, `/for-movers/pricing/`, `/for-movers/eligibility/`, `/for-movers/reviews-and-reputation/`, `/for-movers/apply/` | Business intent | Index the landing pages. Application steps are `noindex` | Movers-only eligibility, exclusive vs shared explanation, verification process, and the published buying rules (§1.1). A USDOT check tells a mover before sign-up whether its record looks eligible and why not, if FMCSA's API terms allow it (implications §9.8; MVP scope S7) |
| Research | `/research/{slug}/` | Original aggregated data (link and citation asset) | Index only once data thresholds are met (§7.5). Earliest W2/W3 | Methodology, n, period, consent basis |
| Utility | `/search/`, `/get-quotes/confirmation/`, the review form `/companies/{slug}/review/`, any embeddable partner widget (§2.4 rule 7), all of `app.{domain}` | Functional | `noindex` (portal also requires authentication) | The review form opens only with a single-use invitation token; there is no open "Write a review" link, as CMR and MyGoodMovers have [capture; sites/consumermovingreviews.md; sites/mygoodmovers.md] |

---

## 2. URL hierarchy

### 2.1 Proposed patterns

```
https://www.{domain}/
├── get-quotes/
├── long-distance-movers/   interstate-movers/   local-movers/
├── movers/
│   └── {state}/                      e.g. /movers/texas/
│       ├── long-distance/            /movers/texas/long-distance/
│       └── {city}/                   /movers/texas/dallas/
│           └── long-distance/        /movers/texas/dallas/long-distance/
├── moving-routes/
│   ├── {state}-to-{state}/           /moving-routes/new-york-to-florida/
│   └── {city}-{st}-to-{city}-{st}/   /moving-routes/new-york-city-ny-to-miami-fl/   (gated)
├── moving-to/{state}/[{city}/]       /moving-to/florida/   /moving-to/texas/dallas/
├── moving-costs/[{topic}/]           /moving-costs/how-movers-charge/
├── moving-cost-calculator/
├── verify-a-mover/
├── {directory}/[page/{n}/]           slug pending (§0 item 9)
├── companies/{slug}/[reviews/[page/{n}/]]   reviews/ only at 10+ eligible reviews
├── compare/{slug}/
├── guides/[{slug}/]
├── research/[{slug}/]
├── authors/{slug}/
├── for-movers/[{page}/]
└── how-we-verify-movers/  movers-vs-brokers/  review-methodology/  advertising-disclosure/
    which-companies-receive-my-request/  editorial-policy/  about/  contact/  complaints/
    report-a-concern/  privacy/  terms/
https://app.{domain}/   company portal and admin: noindex, authenticated
```

### 2.2 Slug and format rules

- **Lowercase ASCII and hyphens.** Uppercase requests 301 to lowercase. No file extensions, no dates in guide URLs, and no query parameters in primary content URLs.
- **Trailing slash** on every HTML page. A URL without one 301s to the slashed version. Files (`robots.txt`, `sitemap*.xml`, `llms.txt`, media) take no slash.
- **State slugs** come from a fixed list of the 50 states plus DC, written as full names (`new-york`, `north-carolina`, `district-of-columbia`). Two-letter codes 301 to the full slug (`/movers/tx/` → `/movers/texas/`).
- **City slugs** use the official Census place name, transliterated, with apostrophes removed and abbreviations kept as written (`st-petersburg`, `ofallon`). If two places in one state share a name, append the county slug (`springfield-clark-county`).
- **Reserved words** that can never be city slugs under `/movers/{state}/`: `long-distance`, `local`, `cost`, `costs`, `reviews`, `page`, `routes`.
- **Route grammar.** The parser tries `{state}-to-{state}` against the state list first. City routes always carry the `-{st}` suffix on both sides, so "Washington, DC" and Washington state never collide.
- **Company slugs** are the legal or DBA name, plus the headquarters city and state on a collision (`a-1-moving-dalton-ga`). Slugs are immutable after publishing except for a rename, which automatically 301s from slug history.
- **Host.** `www` is the public canonical host and the apex 301s to it. The `app.` subdomain keeps portal cookies and crawl isolated. Everything public lives on `www`: guides, the quote survey, tools and any partner or referral form. There is no second content, quote or tool host. Unpakt runs a separate blog host whose NYC post overlaps its NYC city page, a copy of Moving.com's calculator ranks on realtor.moving.com, and moveBuddha's partner form runs on another host [capture; semrush; walk; sites/unpakt.md; sites/movingcom.md; sites/movebuddha.md].

### 2.3 Breadcrumbs (visible, mirrored in `BreadcrumbList`)

| Page | Trail |
|---|---|
| City | Home › Movers › Texas › Dallas |
| City long-distance | Home › Movers › Texas › Dallas › Long-distance |
| State long-distance | Home › Movers › Florida › Long-distance |
| Route | Home › Moving routes › New York to Florida |
| Moving-to | Home › Moving to › Texas › Dallas |
| Profile | Home › {Directory} › {Company} |
| Cost spoke | Home › Moving costs › How movers charge |
| Guide | Home › Guides › {Title} |
| B2B | Home › For movers › Moving leads |

If an ancestor page is not yet published, the trail skips that level until it is. For example, a city long-distance page can pass its gate before its city page (§5.3). No breadcrumb links to an unpublished URL (§3.3 rule 2).

### 2.4 Canonical rules

1. Every indexable page has a self-referencing, absolute `https://www.` canonical with a trailing slash. It must be identical in the server-rendered HTML and after hydration, and never injected by JavaScript.
2. Tracking parameters (`utm_*`, `gclid`, `fbclid`, `msclkid`) canonicalize to the clean URL. The server does not redirect them, so analytics keep working.
3. Filter and sort parameters on city pages and the directory (`?service=packing&sort=rating`) canonicalize to the base URL. Filter controls are buttons or form state, not crawlable `<a href>` links with parameters. Canonical and `noindex` are never combined on the same URL. A rating sort gives no priority to a company with fewer than 5 eligible reviews of that type (implications §4.4).
4. Paginated pages (`/page/{n}/`) are self-canonical and indexable with unique titles. `/page/1/` 301s to the base URL.
5. No cross-family canonicals: A→B never points to B→A, and a city long-distance page never points to its city page. Never canonicalize to a `noindex` or redirected URL.
6. Where an editorial page overlaps a programmatic one, the editorial page is canonical and the programmatic page is consolidated (301), not cross-canonicalized.
7. Partner and referral traffic enters AMC's own survey on `www`. An embeddable widget for partner sites, if one is built, returns `noindex` and carries no canonical (rule 3). No copy of the survey, tools or content is served on another host (§2.2).

### 2.5 Redirects and status codes

| Situation | Response |
|---|---|
| Permanent move, rename, consolidation | **301** to the most relevant surviving page, never blanket to home. Max one hop. A redirect table (source, target, reason, author, date) lives in the CMS and is checked in CI for chains. |
| Removed page with no equivalent | **410** |
| Never-published geo or route URL (for example `/movers/texas/lubbock/` before its gate) | **404** with search and a quote entry point. Never a thin 200 (soft 404) |
| Geo page that falls below its gate | Stays 200 and switches to `noindex` after hysteresis (§4.4). After 90 days below gate it 301s to the state hub, or returns 410 if no relevant parent exists |
| Suspended company | 200 with a neutral status notice ("not currently part of the American Moving Choice network"), `noindex`, and removed from the directory, city pages and sitemaps |
| Maintenance | 503 with `Retry-After` |
| Geo/IP | No automatic IP-based redirects or content swapping. "Use my location" is user-initiated |

---

## 3. Topic clusters and internal linking

### 3.1 Clusters (keyword assignment is in the CSV; one primary URL per keyword)

| Cluster | Pillar | Spokes | Evidence for the split |
|---|---|---|---|
| Long-distance and interstate | `/long-distance-movers/` | `/interstate-movers/`, `/movers/{state}/long-distance/`, `/movers/{state}/{city}/long-distance/`, routes, `/moving-costs/long-distance/`, `/guides/moving-out-of-state/`, `/compare/best-long-distance-moving-companies/` (W2) | Measured shared top-10 URLs: LD↔interstate **2** (interlink only); LD↔cross-country **5** (same cluster, so cross-country is a section in W1); LD↔"best long distance" **4** (separate page); interstate↔"best interstate" **4** (section) |
| Local moving | `/local-movers/` | City pages, `/moving-costs/local/` | "movers X" ↔ "moving companies X" **8** (same page) |
| Moving costs | `/moving-costs/` | `/moving-cost-calculator/`, `/moving-costs/how-movers-charge/`, `/moving-costs/local/`, `/moving-costs/long-distance/`, `/guides/moving-estimates-explained/`, `/guides/how-much-to-tip-movers/` (W2) | Calculator ↔ "how much do movers cost" **1** (separate pages) |
| Trust and verification | `/how-we-verify-movers/` | `/verify-a-mover/`, `/movers-vs-brokers/`, `/guides/how-to-avoid-moving-scams/`, `/guides/how-to-choose-a-moving-company/`, `/guides/your-rights-when-moving-interstate/`, `/review-methodology/`, `/guides/moving-insurance-and-valuation/` (W2) | Differentiator cluster; low KD (6–30) |
| Relocation by destination | `/moving-to/` | `/moving-to/{state}/`, `/moving-to/{state}/{city}/` | "moving to florida" ↔ NY→FL route **0** (separate families) |
| Company entities | `/{directory}/` (slug pending, §0 item 9) | `/companies/{slug}/` | — |
| B2B | `/for-movers/` | `/for-movers/moving-leads/`, `/pricing/`, `/eligibility/`, `/reviews-and-reputation/`, `/apply/` | Business intent |

Overlap was measured on Semrush organic top-10 URLs for 13 keywords (`docs/seo/raw/semrush_phrase_organic_top10_2026-10-27.csv` plus the research CSV). Pairs not measured are marked "verify" in the CSV before any split or merge.

### 3.2 Link modules by family (only to **published, indexable** pages)

| From | Must link to |
|---|---|
| City | Its state hub (breadcrumb and body); its long-distance child if published; up to 5 nearest published cities in the same state; up to 5 published routes whose origin is the state; `/moving-costs/local/`; `/guides/how-to-choose-a-moving-company/`; each listed mover's profile (never a mover's phone number, §0 item 4) |
| City long-distance | Parent city; state long-distance page; published routes from the state; `/interstate-movers/`; `/moving-costs/long-distance/` |
| State hub | All published cities, the state long-distance page, published inbound and outbound routes, `/moving-to/{state}/`, `/verify-a-mover/` (state license lookup section) |
| Route | Origin and destination state hubs; destination `/moving-to/` guide; the reverse route (anchor text "Moving from Florida to New York", direction explicit); `/interstate-movers/`; a calculator link with prefilled parameters (the calculator stays canonical); profiles of matching movers |
| Profile | Every published city page in its **verified** service area (top 10, then "all service areas" on the profile); `/how-we-verify-movers/#badge` (a neutral anchor that survives a badge rename, §0 item 9); `/review-methodology/` |
| Guides | Contextual links to money pages (cost guide → calculator and `/get-quotes/`; scams guide → `/verify-a-mover/` and `/movers-vs-brokers/`) |
| Every badge | `/how-we-verify-movers/` anchor for that badge |
| Every number | Its source or method page, from the facts-registry entry behind it (§6.3 rule 6) |

### 3.3 Anti-orphan and anti-doorway rules (checked by a staging crawl in CI)

1. Every indexable page has **≥3 contextual inbound links** from other indexable pages and is **≤3 clicks from home**. Orphans block release.
2. Indexable pages never link to unpublished or gated URLs (no 404s), and footers carry no city link farms. The footer lists only published state hubs. The header links to no single mover; Move.org's header links to five single movers [capture /; sites/moveorg.md].
3. Anchors are descriptive and varied. Exact-match anchors are not repeated sitewide.
4. **Doorway test.** Each page fully answers its query without a click. The quote entry is embedded and optional, with no auto-redirect and no interstitial. A page whose only value is a form fails. Each geo and route page opens with the H1 and a short answer holding at least two dated, page-specific data points, such as the count of approved movers with explicit coverage and a sourced cost range or route fact. National, sponsored and quote modules sit below that answer. The staging crawl reads the first 150 words of main content and fails the page if either data point is missing or a national or sponsored module renders above the answer. Move.org's Houston page opens with its lead widget and a national partner card before any local content [capture /movers/texas/houston/; sites/moveorg.md].
5. A page with a near-identical sibling (uniqueness below 40%) is merged before publishing, not interlinked.

---

## 4. Programmatic guardrails (Google spam policies)

**Policy basis** (compliance facts §5, from search excerpts of developers.google.com, **[verify]** wording before launch):
- *Doorway abuse* explicitly includes city- or region-targeted pages that funnel users to one destination.
- *Scaled content abuse* covers many low-value pages made mainly to rank, **however they are produced** (AI, human or both).
- Google's AI optimization guide says generative AI search is still SEO, with eligibility requiring indexability and snippet eligibility.

So we **never generate** the cartesian product of cities × ZIPs × routes × services. Candidates come only from measured demand (Semrush, AMC leads, Census flows) **and** real coverage.

### 4.1 Publishing gate (every item must pass; thresholds are configurable per family in admin)

| # | Check | City | City LD | State hub | State LD | State route | City route | Moving-to | How it's measured |
|---|---|---|---|---|---|---|---|---|---|
| G1 | Approved movers with explicit coverage | ≥3 | ≥3 | ≥5 | ≥5 | ≥3 (directional) | ≥3 (directional) | n/a (links to hub) | Matching engine (`@amc/core` `matchCompany`) run on representative lead facts; approved, verified, unpaused movers only. **Local** coverage counts only explicit county/ZIP inclusions plus local capability, not nationwide or statewide catch-all rules. The mover count shown on the page equals this G1 count. Only approved household-goods carriers count; container, storage and truck-rental firms never appear in a count or list. HireAHelper's Tallahassee list counts movers based in Orlando and Georgia, and moveBuddha lists PODS among movers [capture /movers/tallahassee_fl/, /movers/ca/; sites/hireahelper.md; sites/movebuddha.md] |
| G2 | Demand evidence | listed in CSV | ≥50/mo or AMC ≥20 leads/6 mo | — | — | max variant ≥50/mo, or AMC ≥20 leads/6 mo | ≥100/mo **or** AMC ≥30 leads/6 mo, **and** the state route already published | ≥50/mo | Semrush (dated) or AMC lead counts |
| G3 | Verified local or route facts | ≥3 | ≥3 | ≥3 incl. state regulator | ≥3 | ≥4 (departure + arrival) | ≥4 | ≥5 official requirements | Facts registry: claim, official source URL, verifier, verified date, recheck date. Expired facts hide themselves |
| G4 | Cost block | sourced + dated | sourced + dated | required once §6.3 data exists | sourced + dated | sourced + dated | sourced + dated | optional | §6.3 rules. If data is missing, the block is omitted and the page fails the gate and waits. A state hub is the exception: until data exists it publishes without the block and says why. MyGoodMovers' state cost pages outearn its state mover pages, and its Pennsylvania cost page ranks #8 for "how much do movers cost" [semrush top_pages_more_2026-10-27.csv, computed; seo/raw/semrush_phrase_organic_top10_2026-10-27.csv; sites/mygoodmovers.md; implications §6.1, §7.5] |
| G5 | Original data point | ≥1 | ≥1 | ≥1 | ≥1 | ≥2 | ≥2 | ≥1 | Census/IRS flows, BLS OEWS metro data, or AMC aggregates (n ≥ 30) |
| G6 | Unique FAQs | ≥4 | ≥3 | ≥3 | ≥3 | ≥4 | ≥3 | ≥4 | Answers cite page-specific evidence; templated answers don't count |
| G7 | Unique content | ≥40% | ≥40% (vs parent city too) | ≥40% | ≥40% | ≥40% (vs reverse route too) | ≥40% | ≥40% | Share of main-content 5-word shingles found on no other page in the family. Global header, footer and nav are excluded; template boilerplate counts. Mover cards that also appear on a sibling page count as template. HireAHelper's three captured city pages share 11 of their first 12 H2s, and the clear difference is the mover inventory [capture; sites/hireahelper.md]. **30–40% = editor must improve; <30% = hard fail** |
| G8 | Swap test | pass | pass | pass | pass | pass | pass | pass | Reviewer confirms every section holds at least one statement that would be false on a sibling page |
| G9 | Human review | 100% in W1–W2 | same | same | same | same | same | same | Named reviewer and date stored. From W3 on: a 20% sample plus every page with any flagged check |
| G10 | Technical | pass | pass | pass | pass | pass | pass | pass | Main content present in server-rendered HTML; 200; self-canonical; unique title and meta; schema validates; CWV lab budget (§8.7); a working survey entry that reaches the contact step, with no raw template tokens. MyGoodMovers' long-distance landing page showed raw form code instead of a form [walk /long-distance-moving/; sites/mygoodmovers.md] |

### 4.2 Unpublished vs `noindex`

- Programmatic geo and route pages that fail the gate **are not published** (404). They are not "published as noindex".
- `noindex` is used only for pages that must exist for users: company profiles that fail the completeness gate, a published geo page that has dropped below its gate (§4.4), utility pages and tool results.

### 4.3 Data freshness

- Coverage counts are recomputed nightly. The displayed "as of" date updates; `lastmod` changes only when the mover list changes.
- Cost data must be at most 12 months old, with the source date shown.
- Verified facts are rechecked every 6 months or on a regulatory change.
- Mover credentials follow the verification schedule in the product spec.

### 4.4 Hysteresis, consolidation and pruning

- **Index** at G1 ≥ threshold. **Deindex** only when coverage stays below (threshold − 1) for 30 consecutive days. This avoids flapping.
- After 90 days below gate: consolidate with a 301 to the state hub (if relevant), otherwise return 410. Inbound links and sitemaps update the same day.
- **Monthly pruning review** (first 6 months). For each page the decision is keep, improve, consolidate (301), `noindex` or remove (410).
  - Triggers: zero impressions for 16 weeks with no leads; cannibalization (two URLs alternating for one query); stale data; failed gate re-check.
  - Watch one cannibalization pair closely: a `/compare/` page and a city long-distance page ranking for the same query. A moveBuddha city long-distance page ranks #9 for "best long distance moving companies" [semrush seo/raw/semrush_phrase_organic_top10_2026-10-27.csv; implications §6.1].

### 4.5 Company profiles (completeness gate for indexing)

- Profiles go live on approval, as the brief requires.
- They are **indexed** once these conditions hold:
  - credentials are verified and current;
  - the original description passes a duplication check (≤50% shingle overlap with the company's own site, otherwise it is `noindex` until rewritten);
  - coverage is configured.
- New companies show "New to our network" and "No customer reviews yet". No rating and no `aggregateRating` until at least one genuine on-platform review exists.
- **Review order.** Complete and index first the profiles of approved movers with measured brand demand (the keyword map's "Navigational brand query" rows). Profiles can catch brand searches: one CMR profile brings 162 of that site's 191 visits from two keywords, probably the company's name [semrush top_pages_more_2026-10-27.csv; inference; sites/consumermovingreviews.md].

### 4.6 Comparison gate (`/compare/*`)

All of these are required:
- a published methodology (criteria, weights, data sources with dates);
- inclusion criteria independent of membership or payment, with non-members treated equally;
- no composite score that blends editorial judgment with consumer ratings;
- no related-party picks: a mover tied to AMC's people may be listed with a disclosure, but is never featured, ranked or compared (implications §4.3);
- a material-connection disclosure (movers pay AMC for leads), inside the list block, not in a separate block;
- no rank, "top" or "best" label from ratings with fewer than 5 eligible reviews of that type;
- no awards, and no ranking or editorial product offered to movers;
- every claim sourced;
- a named author and reviewer;
- counsel review;
- an update cadence of 6 months or less.

At the references, CMR feeds third-party feedback into an editorial 1-to-10 score. Two movers its own page calls "related companies" (the sentence is cut off in the capture) lead its captured lists, and its disclosure sits in a separate block that a quote can drop [capture /best-interstate-moving-companies/, /how-we-rank-movers/; inference; sites/consumermovingreviews.md]. MyGoodMovers labels a mover with two reviews "BEST LOCAL MOVER" (/movers/al) [capture; sites/mygoodmovers.md]. Move.org lists rankings and awards under partner "Editorial opportunities" (/partnership/) [capture; sites/moveorg.md].

H1s and titles must be scoped and supportable ("...compared on FMCSA authority, complaint history and verified reviews"), never a bare "the best".

### 4.7 Batch rollout

| Stage | Size | Watch window | Go criteria for the next stage |
|---|---|---|---|
| W1 batch A | about 18 programmatic pages plus core, trust, guide and B2B pages | 3 weeks | No manual actions; pages discovered and crawled; drift check clean |
| W1 batch B | about 18 programmatic pages | 4–8 weeks | All of: ≥80% of W1 programmatic URLs indexed within 8 weeks; "Crawled – currently not indexed" <20% per family; ≥50% of pages with impressions; ≥70% of organic leads from W1 pages with ≥1 matched buyer |
| W2 | ≤50 programmatic pages per batch | 2–4 weeks per batch | Same criteria; failing families pause and are improved or pruned before expanding |

---

## 5. Initial market selection

### 5.1 Method

```
Market score = 0.35·D + 0.25·V + 0.20·A + 0.20·F      (each 0–100)
Hard gate C: a market enters a wave only if G1 coverage passes at publish time.
```

| Input | Definition | Source / status |
|---|---|---|
| **D** demand | max("movers X", "moving companies X") + "long distance movers X" + 0.5 × "moving to X", normalized to the top market. The max avoids double-counting: the two local variants share 8/10 URLs | Semrush 2026-10-27 |
| **V** value | Volume-weighted CPC across the market's commercial keywords. This is a **proxy** for lead value until AMC lead prices and sell-through exist | Semrush. Expected AMC lead price and sell-through are **[missing]** |
| **A** attainability | 100 − volume-weighted KD | Semrush |
| **F** content feasibility | Checklist: official local moving rules found (30), BLS OEWS metro data (20), Census flows (20), licensed local imagery (15), state licensing regime documented (15) | **[missing]**. Set to 50 for all markets, so it doesn't affect rank |
| **C** coverage gate | Approved movers covering the market (G1) | **[missing until onboarding]**. The score also tells sales where to recruit first |
| **W** SERP weakness | Count of forum and social results (Reddit, Facebook, Quora, YouTube, Instagram) in a route or moving-to candidate's top 10. Added after the reference review. Recorded beside the score, not weighted, until every candidate is measured | "moving from new york to florida" 4 of 10; "moving to florida" 3 of 10 [semrush seo/raw/semrush_phrase_organic_top10_2026-10-27.csv, phrase_organic_top10_2026-10-27.csv]. Every other candidate **[missing: pull]** |

The tables below were computed with this formula from the raw Semrush CSVs (`docs/research/raw/semrush/` and `docs/seo/raw/`). Recompute when F, C and lead economics exist.

### 5.2 Scores (20 candidate metros)

| Rank | Metro | Demand (vol) | D | Vol-wtd CPC $ | V | Vol-wtd KD | A | Score |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | New York City | 6,280 | 100 | 27.54 | 100 | 67 | 33 | 76.5 |
| 2 | Dallas | 5,990 | 95 | 20.86 | 76 | 40 | 60 | 74.3 |
| 3 | Los Angeles | 5,280 | 84 | 20.52 | 75 | 36 | 64 | 70.8 |
| 4 | Chicago | 4,880 | 78 | 24.03 | 87 | 46 | 54 | 69.9 |
| 5 | Austin | 4,900 | 78 | 21.57 | 78 | 52 | 48 | 66.5 |
| 6 | Denver | 3,400 | 54 | 26.04 | 95 | 34 | 66 | 65.8 |
| 7 | Atlanta | 5,260 | 84 | 16.40 | 60 | 44 | 56 | 65.5 |
| 8 | Houston | 5,120 | 82 | 16.36 | 59 | 51 | 49 | 63.3 |
| 9 | Nashville | 3,340 | 53 | 19.52 | 71 | 38 | 62 | 58.7 |
| 10 | Seattle | 2,900 | 46 | 21.89 | 79 | 39 | 61 | 58.2 |
| 11 | Orlando | 3,400 | 54 | 16.63 | 60 | 46 | 54 | 54.8 |
| 12 | Phoenix | 2,200 | 35 | 17.88 | 65 | 35 | 65 | 51.6 |
| 13 | Miami | 1,600 | 25 | 20.12 | 73 | 38 | 62 | 49.6 |
| 14 | Columbus OH | 1,600 | 25 | 17.42 | 63 | 30 | 70 | 48.7 |
| 15 | Charlotte | 1,130 | 18 | 20.27 | 74 | 33 | 67 | 48.1 |
| 16 | San Antonio | 2,400 | 38 | 14.99 | 54 | 48 | 52 | 47.4 |
| 17 | Tampa | 1,730 | 28 | 17.10 | 62 | 46 | 54 | 46.0 |
| 18 | Raleigh | 590 | 9 | 21.63 | 79 | 41 | 59 | 44.7 |
| 19 | Las Vegas | 1,600 | 25 | 15.25 | 55 | 47 | 53 | 43.4 |
| 20 | Jacksonville | 720 | 11 | 18.92 | 69 | 50 | 50 | 41.2 |

**State roll-up:**

| State | Metro demand | State-level keyword volume | Notes |
|---|---:|---:|---|
| TX | 18,410 | 3,470 | Four metros in the top 16 |
| FL | 7,450 | **6,110** (highest) | Also the top **inbound** route state |
| CA | 5,280 | 1,070 | Top **origin** state for interstate routes |
| NY | 6,280 | 2,480 | KD 67–72 locally |
| GA | 5,260 | 1,020 | — |
| IL | 4,880 | 460 | — |
| CO | 3,400 | 1,810 | — |
| TN | 3,340 | 1,230 | — |
| AZ | 2,200 | 1,320 | — |
| NC | 1,720 | 1,570 | — |

**Directional route demand (max variant, Semrush 2026-10-27):**

| Route | Vol | Max CPC $ | Min KD |
|---|---:|---:|---:|
| NY→CA | 720 | 17.23 | 21 |
| CA→NY | 590 | 15.05 | 27 |
| CA→TX | 480 | 39.45 | 14 |
| NY→FL | 480 | 38.60 | 10 |
| CA→FL | 320 | 23.82 | 19 |
| OH→FL | 210 | 8.42 | 6 |
| CA→TN | 170 | n/a | 6 |
| CA→AZ | 140 | 21.19 | 11 |
| CA→WA | 140 | 16.69 | 15 |
| TX→CA | 140 | 20.29 | 5 |
| CA→NV | 110 | 13.37 | 14 |
| CA→CO | 110 | 12.66 | 12 |
| CA→NC | 110 | 17.23 | 15 |
| CA→OR | 110 | 14.79 | 5 |
| MA→FL | 110 | 18.25 | 21 |
| FL→NY | 110 | 19.13 | 14 |
| NJ→FL | 90 | 25.62 | 17 |
| IL→FL | 90 | 13.17 | 9 |
| TX→FL | 90 | 20.19 | 18 |
| NYC→Miami (city pair) | 90 | 18.18 | 12 |

Every measured city pair is ≤90/mo, which is why no city route is indexed in W1.

### 5.3 Proposed waves

**Wave 1: TX + FL + CA (LA).**

Rationale:
- Texas is the largest state cluster.
- Florida has the highest state-level and inbound demand. Its local KDs are mid-range, and inbound routes such as NY→FL are high-CPC with low KD.
- California is the dominant origin for the route set and LA ranks #3 overall.
- NYC ranks #1 but has the hardest local SERP (KD 67–72), so New York enters through routes first.

Wave 1 pages (≈36 programmatic, each subject to the gate):

| Type | Pages |
|---|---|
| State hubs (3) | `/movers/texas/`, `/movers/florida/`, `/movers/california/` |
| State long-distance (3) | texas, florida, california |
| City pages (8 + 1 reserve) | Dallas, Houston, Austin, San Antonio, Orlando, Miami, Tampa, Los Angeles; reserve: Jacksonville (lowest score) |
| City long-distance (3) | Dallas, Houston, Los Angeles |
| Directional state routes (16) | new-york-to-california, california-to-new-york, california-to-texas, new-york-to-florida, california-to-florida, ohio-to-florida, california-to-tennessee, california-to-arizona, california-to-washington, texas-to-california, california-to-nevada, california-to-colorado, california-to-north-carolina, california-to-oregon, massachusetts-to-florida, florida-to-new-york |
| Moving-to (2) | `/moving-to/florida/`, `/moving-to/texas/` |

Plus the non-programmatic Wave 1 set:
- Home, `/get-quotes/`, the 3 national pillars and the calculator.
- `/moving-costs/` with 3 spokes.
- `/verify-a-mover/`, the 10 trust pages and authors.
- About 6 guides (moving out of state, how to choose, scams, estimates explained, your rights interstate, and an author/editorial set).
- The B2B section (6 pages).
- The directory (`/{directory}/`) and approved profiles.

**Supply dependency:** route pages need directional coverage. For example, NY→FL needs movers whose rules include origin NY and destination FL, such as FL interstate carriers running northeast routes. Recruit for the routes, not only for the cities.

**Build and KPI order** (implications §6.1). This order sets build priority and the Wave 1 KPIs. It does not change what launches in batch A (§4.7), and the trust pages are still written first, because badges, consent and lists link to them (implications §7.1).
1. Tools and cost pages: the calculator, `/moving-costs/` and its spokes, and `/verify-a-mover/`.
2. National pillars, state and city long-distance pages, directional routes and the two moving-to guides.
3. Trust and B2B pages.
4. `/movers/`, the directory and approved profiles.
5. State hubs and city pages, each when it passes G1. Their KPIs start on the date each one passes, not at launch.

Every programmatic page still waits for its gate (§4.1), and the programmatic batches in §4.7 fill in this order. Head terms ("moving companies", KD 62; "long distance moving companies", KD 63) and best-of terms are not Wave 1 KPIs; they wait for Wave 2 and the comparison gate. Calculators lead Moving.com (29.97% of visits) and moveBuddha (about 13.4%), moveBuddha's city long-distance pages earn 460–956 visits each, and city pages lead only at HireAHelper (10 of its top 15 pages, 24.6% of visits) [semrush top_pages_2026-10-27.csv; sites/movingcom.md; sites/movebuddha.md; sites/hireahelper.md; cross-site analysis].

**Wave 2** (after the W1 go criteria in §4.7 are met):

| Type | Pages |
|---|---|
| States and cities | CO (Denver, highest city CPC with low KD), GA (Atlanta), IL (Chicago, plus Chicago long-distance at KD 15 / $51.48 CPC), TN (Nashville), NC (Charlotte, Raleigh), AZ (Phoenix), NY state hub and `/movers/new-york/long-distance/` (NYC section) |
| Routes | NJ→FL, IL→FL, TX→FL, NY→TX, MI→FL, PA→FL, FL→NC, FL→GA, CO→TX, TX→CO |
| Moving-to | TN (KD 6), NC, SC, CO, AZ, GA states; cities Dallas (2.4k, KD 13), Houston (2.4k, KD 16), Atlanta, Austin, Orlando, Denver, Nashville |
| Editorial | `/compare/best-long-distance-moving-companies/` (comparison gate), `/guides/how-much-to-tip-movers/`, `/guides/best-time-to-move/` (with AMC seasonality data), `/guides/cheapest-way-to-move-across-country/`, `/guides/moving-insurance-and-valuation/` |

**Wave 3+:** Seattle, Las Vegas, Columbus, NYC local (after authority builds), the moving checklist (link asset), research reports and any city routes that pass the gate.

**Inputs still missing for a final selection:**
- coverage C, the hard gate;
- AMC lead price and sell-through per market;
- feasibility F;
- seasonality and trends (not pulled);
- Census or IRS migration flows (not pulled; network blocked here);
- SERP features and PAA per market (not observed);
- forum-and-social counts (input W) for most route and moving-to candidates;
- metros outside the 20 sampled (for example Fort Worth, San Diego, Indianapolis).

---

## 6. Content and FAQ research process

### 6.1 Process (per cluster, then per page)

1. **Cluster research (deep, once per cluster):**
   - Semrush questions and related keywords;
   - Google PAA and related searches, captured in a real browser because this container cannot fetch SERPs;
   - Reddit (for example r/moving, city subreddits), public Facebook groups, YouTube comments;
   - consumer complaints (FMCSA complaint information via Protect Your Move, BBB);
   - official sources: FMCSA, state regulators (TxDMV, FDACS, BHGS, NYSDOT), DMV and revenue departments, Census, BLS.
2. **Page check (light, per page):** confirm local specifics and record sources. Do **not** claim every platform was searched for every page. The record shows exactly what was checked.
3. **Community sources only surface questions and worries. Answers come from verifiable sources.** A Reddit thread can justify an FAQ question but never an answer.
4. Write original copy with direct answers first (a 40–60 word answer under a question heading where natural), tables for comparisons, and natural internal links. **No word-count targets and no keyword-density targets.** Under 300 words of main content is a review trigger only.

### 6.2 Source record (one per brief; stored with the page in the CMS)

| Field | Description |
|---|---|
| id | Stable row id |
| question_or_claim | The question users ask, or the claim made on the page |
| source_url | Exact URL (never a homepage) |
| source_type | official / community / Semrush / AMC data / mover-provided / third-party study |
| accessed_date | ISO date |
| intent | informational / commercial / transactional / navigational |
| answer_evidence | Official or primary source that supports the answer (blank = can't publish yet) |
| intended_page | URL#section |
| status | to review / to verify / verified / rejected |
| verified_by / recheck_due | Reviewer and date |

### 6.3 Cost-estimate rules

1. Publish **ranges, never point prices**. Each range states the assumptions (home size, distance band, included and excluded services, season), source, "data as of" date and sample size. The scope (home size, distance band) appears wherever the range appears, titles and meta descriptions included.
2. Allowed sources, in order of preference:
   - (a) member-reported rate cards with ≥5 distinct movers per geography;
   - (b) AMC aggregated, consented lead data, for non-price facts only (n ≥ 30 per geography, cells under 10 suppressed);
   - (c) authoritative public data (for example BLS OEWS metro wages for SOC 53-7062, as labor-cost context only);
   - (d) third-party studies with a published method, cited.
   Competitor figures appear only as cited context, never as our data.
3. Every cost block says that movers set their own prices and that AMC does not provide quotes or binding estimates. Counsel should approve this wording.
4. Refresh every 6 months or when a source updates. If data is insufficient, omit the block; the page then waits at the gate.
5. The calculator has a versioned formula, a public method page and a changelog. Outputs are labeled as ranges, and its wording gets counsel review (compliance facts §2). The widget, the results view and the survey prefill use one model version (rule 6).
6. **One record per figure.** Every public number is a facts-registry entry with a definition, query, owner and as-of date (implications §4.5). Titles, metas, answers, body, tables, JSON-LD, the calculator widget and its results all render from one versioned dataset by metric ID. CI fails on two values for one metric ID or on a missing date. A calculator test sends the same inputs to the widget and the results view and fails if the ranges differ. For one move, moveBuddha's widget topped out at $7,814 for freight and its results page at $1,761 [walk; sites/movebuddha.md]. Moving.com gives two unsourced averages for one 1,000-mile move [capture /movers/moving-cost-calculator.asp, /tips/cheap-ways-to-move-cross-country/; sites/movingcom.md]. Make no savings, "people helped", booked-move or job-count claims, since AMC never sees bookings. Unpakt's "save 45%" (/) and Budget Van Lines' "Up to 50%" (/how-it-works) have no source [capture; sites/unpakt.md; sites/budgetvanlines.md].
7. **Recent request mix.** A block built from consented requests is called "recent request mix by route and size", never "recent estimates". It uses only requests above the §7.5 thresholds and shows only labeled typical ranges from the versioned cost model, never a price per request. AMC's role statement says AMC does not give moving estimates (consent draft §1), so the block goes to counsel with the other range questions (compliance facts §2). Moving.com's undated "Recent Estimates" block, with no source or sign that entries are real requests, is the pattern to avoid [capture /movers/moving-cost-calculator.asp; sites/movingcom.md].

### 6.4 Sample briefs

The deferral is lifted, because the reference-site review is complete. Sample briefs are not included in this version. The first briefs cover the pieces in implications §7.1, starting with the trust pages that every other page links to, and each carries a §6.2 source record.

---

## 7. AI search visibility (GEO/AEO)

Google's position (AI optimization guide, May–June 2026; compliance facts §5) is that generative AI search **is still SEO**. Pages must be indexed and snippet-eligible. llms.txt, "chunking" and manufactured mentions are not needed. We follow that, and treat other AI platforms as separate surfaces measured separately.

### 7.1 Entity consistency

- One Organization entity, `https://www.{domain}/#organization`, used on every page that references the publisher. It carries the exact name "American Moving Choice", logo, URL, `sameAs` (real profiles only) and a real support contact. The Organization entity and `/about/` name the legal entity, its owner and any ties between AMC's people and movers, brokers or lead buyers (brief §11 Q1; implications §11 Q10). Legal name, owner and address come from the client **[missing]**. MyGoodMovers names its operator only in its legal pages [capture; sites/mygoodmovers.md].
- One counsel-approved, versioned **role-and-money statement**, stored once and rendered from that record. It appears in the body, inside the consent block (so it is hashed into the consent record), in the Organization `description` and in the meta descriptions of the home, About and "How AMC makes money" pages only (§8.2). It says that AMC is a platform, not a mover or broker; that it does not transport, estimate, arrange or book moves; that participating movers pay for the requests they buy; and that payment never changes verification, ratings, review display, or order in the directory, geo pages or consent list. It names what AMC checks instead of saying "licensed" (implications §3.4). Counsel writes the wording now that the review is complete. It replaces the three role wordings in consent draft §1, this section and brief §1.
- **Where the statement shows:** beside the first survey screen on every entry module, phones included; inside the consent block; on confirmation; in the footer; and behind a header "How AMC makes money" link that cannot be closed. On directory, geo and comparison pages, the paid-relationship line sits inside the list block. A build check matches body, meta, JSON-LD and consent text to the record. No walked reference flow said how the site itself is paid. Move.org's money line is a top strip that can be closed, and CMR's disclosure is a separate block that a quote can drop [walk; capture /, /best-interstate-moving-companies/; inference; cross-site analysis; sites/moveorg.md; sites/consumermovingreviews.md].
- Brand facts (founding date, team) appear only if they are true. No fabricated stats.

### 7.2 Authorship and policies

- Named authors (`/authors/{slug}/`, ProfilePage + Person) with truthful credentials. Every guide, cost, route, moving-to and geo page names an author, a different reviewer with relevant experience and, for each data block, a named data owner (brief §11 Q9) **[who? missing]**. No team-only bylines and no unnamed "fact-checked" stamps: CMR's bylines name only teams, and MyGoodMovers' "Fact-Checked" stamps name no one [capture; sites/consumermovingreviews.md; sites/mygoodmovers.md]. A publish check blocks a page with a missing role or with the same person as author and reviewer.
- Required policies: editorial policy (including how AI assistance is used and checked); review methodology (FTC platform guide), covering the evidence labels, AMC-sent invitations, the minimum sample before any rank or "top" claim, and a written policy for any AI review summary, which needs at least 10 reviews (implications §4.4); "How AMC makes money" at `/advertising-disclosure/` (how AMC makes money, how sponsored placement is labeled); how we verify movers (what is checked, when, and what is not checked).

### 7.3 Citations and dates

- Link primary sources inline (FMCSA, state agencies, Census, BLS).
- "Last updated" changes only on a substantive edit. "Last reviewed" shows a reviewer and date for periodic checks. Each data block carries its own "data as of" date. Never fake freshness.
- Dates are earned only. "Last updated" equals the CMS time of the last substantive edit. No relative dates ("6 months ago"). No year in a title or H1 unless the page's data is for that year and on a refresh schedule. Reading time is computed or left out, and templated pages carry no first-person experience lines. moveBuddha shows the capture day as "Last Updated" (/movers/ca/) and a templated "decade" of personal experience (/movers/ca/los-angeles/long-distance/), and Move.org's February 2025 guides read "Last Updated: 6 months ago" (/what-goes-into-moving-estimate/) [capture; sites/movebuddha.md; sites/moveorg.md].
- Keep snippets eligible: no `nosnippet` on content we want cited; default `max-snippet:-1`.

### 7.4 Citable formats

Put the self-contained answer in the first screen of each page. Use question-phrased H2s where they are natural, comparison tables, and definitions ("A household goods broker is..."). Write for people. Don't rewrite pages "for AI".

On geo and route pages, that answer is local and holds at least two dated, page-specific data points (§3.3 rule 4). Definitions, tables and dated data blocks follow. On directory, geo and comparison pages, the paid-relationship line sits inside the list block, so a quoted list keeps it (§7.1).

### 7.5 Original aggregated data (only with consent and sufficient samples)

- Example: a quarterly "AMC Moving Demand" report covering inbound and outbound state shares, seasonality and move-size mix from **consented** lead data.
- Thresholds: n ≥ 100 for national stats; n ≥ 30 per city or route; cells under 10 suppressed; periods of 90 days or more.
- Each report includes a published methodology and states the consent basis. Counsel must confirm the privacy policy permits aggregate use.
- Optional Dataset markup (Dataset Search only).

### 7.6 Crawler access policy (verified 2026-10-27, compliance facts §6)

| Operator | Agent | Purpose | Recommendation |
|---|---|---|---|
| Google | `Googlebot` | Search (also feeds AI Overviews and AI Mode) | Allow |
| Google | `Google-Extended` (token only) | Gemini training and grounding in Gemini Apps; does not affect Search | Business decision (see below) |
| Microsoft | `bingbot` | Bing, which also grounds Copilot. AI use is controlled with NOARCHIVE/NOCACHE meta tags, not robots.txt | Allow; no NOARCHIVE |
| OpenAI | `OAI-SearchBot` | ChatGPT search inclusion | Allow |
| OpenAI | `GPTBot` | Model training | Business decision |
| OpenAI | `ChatGPT-User` | User-initiated fetches; robots.txt may not apply | Allow |
| OpenAI | `OAI-AdsBot` | Ad landing-page validation (compliance facts §6) | Business decision, made with any ChatGPT advertising plan (implications §11 Q18) |
| Anthropic | `Claude-SearchBot` | Search indexing | Allow |
| Anthropic | `ClaudeBot` | Training data | Business decision |
| Anthropic | `Claude-User` | User-directed fetches | Allow |
| Perplexity | `PerplexityBot` | Search indexing; not used for training | Allow |
| Perplexity | `Perplexity-User` | User-triggered fetches; generally ignores robots.txt | Allow |
| Apple | `Applebot` / `Applebot-Extended` (token) | Search / training opt-out | Allow Applebot; Applebot-Extended is a business decision |

**Training-crawler recommendation:** **allow at launch** (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended). For a new brand, being represented in model knowledge supports unprompted brand recall, and the content is public marketing material. Revisit before publishing original datasets, which could be licensed instead.
- Each vendor documents that blocking training crawlers does not affect search inclusion, so this decision is independent of search visibility.
- **Never rely on robots.txt for private data.** Lead, portal and quote pages are protected by authentication and `noindex`, because user-triggered fetchers may ignore robots.txt.
- Allowlist verified bots in the CDN/WAF. A bot-blocking default would otherwise override robots.txt.
- Challenge bots only at quote submission, never on content pages. Each month, check in the logs that verified agents get HTTP 200 on a sample of every published family (§9). ConsumerAffairs, HomeGuide and Moving.com blocked all or part of the review's headless capture, yet one answer engine still quoted ConsumerAffairs' blocked page [capture; search; sites/consumeraffairs.md; sites/homeguide.md; sites/movingcom.md].

**llms.txt:** optional and cheap. Publish a short one listing the trust pages and hubs after launch (P3). It is **not** a ranking or citation lever: Google ignores it, and no other vendor has confirmed using it.

### 7.7 AI visibility measurement

- **Query sample:** 66 fixed prompts, run monthly with a pre-launch baseline.
  - 15 commercial ("best long distance moving companies", "moving companies in Dallas");
  - 15 cost ("how much does it cost to move from New York to Florida");
  - 10 trust ("how to check if a mover is legit", "movers vs brokers");
  - 10 route and relocation;
  - 5 brand ("American Moving Choice reviews");
  - 5 B2B ("buy moving leads");
  - 6 per-state: one cost and one verification prompt for each Wave 1 state (TX, FL, CA).
- **Platforms:** Google AI Overviews and AI Mode, ChatGPT (search on), Perplexity, Gemini, Claude (web search), Microsoft Copilot.
- **Record per run:** date, platform, mode or model if shown, logged-in state, location context (device location or prompt-stated city), exact prompt, whether AMC is mentioned, whether it is cited and which URL, order, competitor domains cited, accuracy of statements about AMC, and a screenshot. Run each prompt 2–3 times.
- **Reference tracking (added after the reference review):** each run also records citations of six moving references (ConsumerAffairs, Moving.com, Move.org, moveBuddha, HireAHelper and MyGoodMovers). It flags answers that repeat a figure differing from the cited live page and answers that omit a paid relationship. For brand prompts, it records which review profiles about AMC the answer relies on. One search tool repeated moveBuddha figures that differ from its live pages, and brand answers about Budget Van Lines relied on third-party review sites [search; sites/movebuddha.md; sites/budgetvanlines.md].
- **Limitations:** answers are non-deterministic and personalized, and models change, so read results as directional only. DataForSEO AI-visibility tools are not available in this environment.
- **Referral tracking:**
  - a GA4 "AI assistants" channel group matching referrers such as chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com and claude.ai, plus the `utm_source` values these products append **[verify current behavior per platform]**;
  - conversions (survey start, completion, qualified lead) reported by that channel;
  - Search Console's generative-AI performance report (compliance facts §5) **[confirm availability on the property]**.

---

## 8. Technical SEO specification

### 8.1 Rendering

Public pages are server-rendered or statically generated with incremental revalidation. Main content, title, meta, canonical, robots and JSON-LD are all in the initial HTML; JavaScript never injects or changes them. The quote survey hydrates as an island.

### 8.2 Metadata templates

Keep the primary phrase first. Add " | American Moving Choice" only when the title stays ≤ about 65 characters. Set the WebSite `name` so Google can show the site name. Each description must contain at least one page-specific data point; the home, About and "How AMC makes money" descriptions carry the role-and-money statement instead (§7.1).

- Data points in titles and descriptions are read from the page record (§6.3 rule 6), never typed by hand, and any range states its scope.
- Geo and route titles, H1s and H2s carry no "best", "top {n}" or fixed counts. "Best" appears only on pages that pass the comparison gate (§4.6). Fixed-count or "best" geo headings appear at ConsumerAffairs ("4 Best" titles), moveBuddha ("10 Best Moving Companies in Rhode Island (2026 Reviews)", /movers/ri/) and HireAHelper ("Compare the Best 10", /movers/tallahassee_fl/) [search; capture; sites/consumeraffairs.md; captures/movebuddha.md; sites/hireahelper.md].

| Family | Title template | H1 template |
|---|---|---|
| State hub | Moving Companies in {State} \| Verified {State} Movers & Costs | Moving companies in {State} |
| State LD | Long-Distance Movers in {State} \| Out-of-State Moving Quotes | Long-distance movers in {State} |
| City | Movers in {City}, {ST} \| Compare Verified Moving Companies | Movers in {City}, {ST}: compare screened moving companies |
| City LD | Long-Distance Movers in {City}, {ST} \| Verified Interstate Carriers | Long-distance movers in {City} |
| Route | Moving from {A} to {B}: Costs, Movers & Planning Guide | Moving from {A} to {B} |
| Moving-to | Moving to {Place}: Costs, Requirements & Moving Tips | Moving to {Place} |
| Profile | {Company}: Reviews, USDOT {DOT} & Service Areas | {Company} |
| Directory | {Directory name}: Screened Moving Carriers \| American Moving Choice | {Directory name} (name **pending**, §0 item 9) |
| Calculator | Moving Cost Calculator: Estimate Your Moving Cost Range | Moving cost calculator |
| B2B | Moving Leads for Carriers: Exclusive & Shared Leads \| American Moving Choice | Moving leads for household-goods carriers |

### 8.3 Robots directives

| Scope | Directive |
|---|---|
| Indexable public pages | `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` |
| Below-gate geo pages, incomplete or suspended profiles | `noindex, follow` |
| Utility pages, tool results, review forms, internal search | `noindex` |
| `app.{domain}` | `X-Robots-Tag: noindex, nofollow` on every response, plus authentication. Not disallowed in robots.txt, so crawlers can see the noindex |

`robots.txt` on `www`:
- Allows the agents in §7.6, following the business decisions recorded there (training crawlers, OAI-AdsBot).
- Lists the sitemap index.
- Disallows `/api/` only.
- Does not block parameters, so canonicals stay visible.

### 8.4 Sitemaps

- `/sitemap.xml` is a sitemap index pointing to:
  - `/sitemaps/core.xml` (home, pillars, tools, trust, B2B);
  - `guides.xml`, `costs.xml`, `states.xml`, `cities.xml`, `routes.xml`, `moving-to.xml`, `companies.xml`;
  - `videos.xml` (video entries for pages with video modules).
- Include only URLs that are `published`, `indexable` and self-canonical with a 200 status. Exclude redirects, `noindex`, parameter URLs and pagination beyond page 1.
- `lastmod` is the time of the last **substantive** change: main copy, verified facts, cost data, mover-list membership, or new reviews (profiles). Never the render time.
- Split at 50,000 URLs or 50 MB per file. Reference the index in robots.txt and submit it in GSC and Bing Webmaster Tools.
- Ping **IndexNow** on publish, unpublish and substantive updates (Bing and other participating engines).

### 8.5 Structured data (JSON-LD, server-rendered, only what is visible)

| Family | Types | Notes |
|---|---|---|
| Sitewide | `Organization` (`@id`), `WebSite` (home) | Real `sameAs` and contact only. No `SearchAction` dependence |
| All pages with breadcrumbs | `BreadcrumbList` | Must mirror the visible trail |
| Guides, cost guides, routes, moving-to | `Article` + author `Person` (`url` = author page); `WebPage.reviewedBy` where a reviewer is shown | datePublished/dateModified must match the visible dates |
| Authors | `ProfilePage` + `Person` | Truthful credentials |
| State and city pages, directory | `WebPage`/`CollectionPage` + `ItemList` of `MovingCompany` (each references `/companies/{slug}/#company`) | **No** `LocalBusiness` for AMC on geo pages, because AMC has no location there. No ratings on list pages |
| Company profiles | `MovingCompany` with name, url, logo, address (if public), `areaServed` matching visible coverage, `identifier` as `PropertyValue` for USDOT (and MC if present), and `sameAs` (the company's site, only if displayed) | `aggregateRating`/`review` **only** with genuine on-page user reviews; never on profiles without reviews. Third-party review pages may be eligible for review snippets, but stars are not promised. AMC's own Organization pages can't carry self-serving review markup. Mark up one named rating type (move experience by default; **pending** implications §11 Q15) whose `ratingCount` equals the visible count for that type, never a blend of quote- and move-experience ratings. HireAHelper's profile markup matches its visible rating [capture /movers/dalton_ga/a-1-moving/; sites/hireahelper.md] |
| Pages with video modules | `VideoObject` (name, description, thumbnailUrl, uploadDate, duration, contentUrl or embedUrl) | Matches the visible player. Captions and transcript on the page |
| FAQ sections | none | FAQ rich results were retired on 2026-05-07, so no FAQPage markup is planned (Google advises against over-investing in markup for AI) |
| Research reports | `Dataset` (optional) | Dataset Search only |
| Never | `HowTo`, fabricated `Review`, ratings for AMC itself | — |

**Schema lint.** It runs in CI on every template and in the weekly production drift run (§9). It fails a page that has:
- FAQPage or HowTo markup;
- any rating or review on AMC's own Organization, WebSite or WebPage;
- more than one Organization node, or an Organization `@id` other than the canonical one;
- `MovingCompany` on anything but an approved mover's profile or list item;
- ratings inside geo-page lists;
- JSON-LD values that differ from the visible text.

At the references, FAQPage is still on Moving.com (3 of 6 captured pages), CMR (4 of 10) and MyGoodMovers (2 pages). Unpakt marks itself up as a MovingCompany rated 4.2 from 36 on every captured www page, and Moving.com's quote page carries two Organization nodes [capture; sites/movingcom.md; sites/consumermovingreviews.md; sites/mygoodmovers.md; sites/unpakt.md].

### 8.6 Private portals

The portal and admin live on `app.{domain}`:
- authentication is required on every route, and authorization is enforced server-side;
- every response sends `noindex`;
- no public links point to the portal except `/login`;
- no lead or consumer data ever reaches public HTML, sitemaps, JSON-LD or analytics payloads.

### 8.7 Core Web Vitals budgets

| | LCP | INP | CLS | Where measured |
|---|---|---|---|---|
| **Field target** (the real measure) | ≤2.5 s | ≤200 ms | ≤0.1 | p75 per template and device in CrUX or RUM (web-vitals library, no PII), once traffic is sufficient |
| **Lab budget** (pre-launch CI, Lighthouse mobile, throttled; proposed) | ≤2.0 s | TBT ≤200 ms (as an INP proxy) | ≤0.05 | Staging, per template. A failure blocks the release |

Supporting budgets (proposed):
- ≤170 KB compressed JS on first load for public templates;
- hero image ≤150 KB in AVIF/WebP with `fetchpriority="high"` and explicit dimensions;
- ≤2 font files with `font-display: swap`;
- third-party scripts deferred until after interaction where compliance allows. Survey, contact, consent and confirmation pages follow the tag policy in §8.8. If a consent certificate is adopted (DEP-20), its script loads only on the consent step and before the consent text, so test its cost;
- reserved space for mover lists and consent blocks;
- video modules show a poster facade until clicked, with no autoplaying audio.

Report lab and field numbers separately. Never present lab results as real-user CWV.

### 8.8 Tag policy for quote pages

This policy covers the `/get-quotes/` steps, the contact and consent steps and `/get-quotes/confirmation/` (implications §3.5). §8.6 stays portal-only.
- No ad, retargeting or social pixels, and no chat widgets.
- No session replay or heatmaps (PostHog recordings off), unless counsel approves full masking.
- First-party analytics only. No field values are sent before submit, and no ZIPs, dates, sizes or contact details go into URLs, event names or payloads. This also applies to survey entry modules embedded on content pages.
- A consent certificate, if DEP-20 adopts one, loads only on the consent step and is named in the privacy notice.
- A consent tool that reads Global Privacy Control. Stack and architecture §1 names none yet.
- A CI script inventory for each step, checked against an allowlist. The tag-manifest version is stored in the consent record.
- **Counsel:** do replay tools or pixels on forms create wiretap-law exposure, for example under California's CIPA? No section of compliance facts covers this yet; implications D12 proposes a new compliance facts §9 for it.

At least seven of the nine captured reference sites load replay-capable tools, and all nine load ad tags; whether they run on form steps is unknown [capture; cross-site analysis; matrix §3.3]. HireAHelper loads FullStory replay, and its first checkout URL carries ZIPs and dates. EnergySage's onboarding URLs carry the ZIP [capture; walk; sites/hireahelper.md; sites/energysage.md]. Move.org loads TrustedForm, the only consent-certificate script seen, and EnergySage honors Global Privacy Control [capture; sites/moveorg.md; sites/energysage.md].

---

## 9. Measurement

| Area | Setup | KPIs and decision rules |
|---|---|---|
| Google Search Console | Domain property; per-family sitemaps; page-indexing and generative-AI performance reports | Indexed vs submitted per family (≥80% within 8 weeks of publish); "Crawled – currently not indexed" <20%; impressions, clicks, CTR and position by family and market |
| Bing Webmaster Tools | Import from GSC; IndexNow key | Indexed coverage; Copilot/AI reporting where available **[verify]** |
| Analytics (GA4 + server-side events, no PII) | Landing page family dimension; survey events, collected on quote pages under the §8.8 tag policy | Survey start rate, completion rate, qualified-lead rate, leads with ≥1 matched buyer, net revenue per organic session (after credits) by family and market |
| Rank tracking | Semrush Position Tracking project: all H and M keywords from the CSV, tagged by family, market and wave; daily; national location for national terms and city-level locations for city terms; desktop and mobile | Visibility by tag; cannibalization alerts (two URLs alternating), including a `/compare/` page against a city long-distance page (§4.4) |
| Drift (seo-drift) | Baseline per template and per published URL: status, title, meta, canonical, robots, H1, JSON-LD types, internal link count. Also every figure by metric ID (title, meta, body, JSON-LD, calculator widget and results), ratings and review counts per experience type, the role-and-money text, and the schema lint (§8.5). Diff in CI on every deploy against staging, plus a weekly production run | Block or alert on an added `noindex`, a canonical change, a schema error, a missing H1 or a status change, or on a figure, rating or role text that differs from its record |
| Synthetic survey walk | A daily run of every survey entry module (home, geo, route, cost, profile and calculator entry points) to the contact step with test ZIPs. It stops there and submits nothing | Alert on a broken step, a lost answer, raw template tokens or a missing coverage result; releases fail on raw tokens (G10). MyGoodMovers' named landing page showed raw form code, Unpakt failed into a sign-in page, and custom widgets stopped the review's walker at Budget Van Lines and EnergySage [walk; sites/mygoodmovers.md; sites/unpakt.md; sites/budgetvanlines.md; sites/energysage.md] |
| Logs | Bot hits by family (Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot). A monthly verified-bot check: HTTP 200 for verified agents on a sample of every published family, and WAF changes reviewed in each release (§7.6) | Crawl coverage of new batches; wasted crawl on parameter URLs; any challenge or block served to a verified agent |
| Reviews | Monthly SEO review (first 6 months), then quarterly | Pruning decisions (§4.4); SXO review (seo-sxo) for pages with high impressions and low survey starts; title and meta tests for low CTR at good positions |

---

## 10. Skills log

| Skill | Used how | Contribution | Notes |
|---|---|---|---|
| seo-plan | Loaded | Planning structure; local-service and publisher templates (location-page quality gates, E-E-A-T author requirements) | Its "hard stop at 50 location pages" suits a single local business. For a marketplace it is replaced here by data-driven gates and batch caps |
| seo-sxo | Loaded | Page-type taxonomy and SERP-consensus approach (calculator SERP 10/10 tools, corrected after the reference review in §1.2; Dallas SERP = providers + aggregators; NY→FL fragmented UGC) | Its URL-fetch pipeline couldn't run (no site exists; fetching is blocked) |
| seo-cluster | Loaded | SERP-overlap thresholds (7–10 merge, 4–6 cluster, 2–3 interlink, 0–1 separate) applied to 13 keywords' Semrush top-10s | Full pairwise clustering and the cluster-map HTML were deferred until PAA and SERP data can be captured |
| seo-programmatic | Loaded | Uniqueness formula, 40%/30% thresholds, batch rollout, standalone-value test, sitemap and canonical rules for programmatic pages | Human review set stricter here (100% in W1–W2 vs the skill's 5–10%) |
| seo-geo-aeo | Loaded | Signal checklist (E-E-A-T, citability, answer formats) | Its audit/report workflow is not applicable pre-launch (no site). Its FAQ/HowTo schema advice is superseded by verified retirements |
| seo-geo | Loaded | Google AI-guide synthesis (still SEO; llms.txt not needed), platform-specific citation surfaces, measurement ideas | Its crawler table conflicts with vendor docs (it calls GPTBot a search crawler). Superseded by compliance facts §6 |
| seo-schema | Skimmed | Active and retired types (FAQ retired 2026-05-07, HowTo deprecated); JSON-LD in initial HTML | Matches compliance facts §5 |
| seo-local | Skimmed | Swap test for doorway risk; per-location uniqueness | AMC has no locations, so no LocalBusiness on geo pages and no GBP pages for cities |
| seo-technical | Skimmed | JS canonical/noindex pitfalls, CWV thresholds, IndexNow, AI-crawler management | — |
| seo-sitemap | Skimmed | 50k/50 MB limits, lastmod accuracy, exclude noindex URLs | — |
| seo-competitor-pages | Skimmed | Fairness rules for `/compare/*` (verifiable claims, "as of" dates, disclosure) | Folded into the comparison gate |
| seo-content-brief | Skimmed | Brief structure, information-gain rule, E-E-A-T fields | Its fixed meta-length and keyword-placement rules are treated as guidance only. No density targets, per the client brief |
| seo-maps | Evaluated only | — | Not applicable. Only for real, eligible business locations; AMC must not create city GBPs. Its DataForSEO/Google tiers are unavailable here |
| seo-hreflang | Evaluated only | — | Not applicable until real Spanish (or other) versions exist |
| seo-flow | Evaluated only | — | Optional. The FLOW prompt library could structure later find/optimize cycles; not needed for this plan |
| seo-ecommerce | Evaluated only | — | Not applicable. No product catalog or merchant feeds; lead sales are B2B services |
| seo-dataforseo | Evaluated only | — | **Unavailable.** DataForSEO MCP server is not installed. Semrush MCP was used instead |
| seo-backlinks | Evaluated only | — | Deferred. Competitor authority is in `keyword-research.md` (AS 44–48, 9k–20k referring domains). Link-gap and outreach planning is a later deliverable |
| seo-drift | Evaluated | Specified in §9 | — |
| seo-google | Evaluated | — | **Unavailable now.** Needs Google Cloud credentials and a live property (GSC, CrUX, PageSpeed) |
| Semrush MCP (integration) | Used | 13 report calls this pass: 3 `phrase_these` batches (127 keywords), 8 `phrase_organic` top-10s, 2 `phrase_questions` | ~8,400 API units (1,290 phrase_these + 2,300 phrase_organic + 4,800 phrase_questions). Raw data in `docs/seo/raw/` |

---

## 11. Data gaps and dependencies

- **Not observed (network policy blocks fetching):** live SERP features, PAA questions and AI Overview presence. The reference review captured competitor page layouts as text (2026-10-27), but reviewed no screenshots and parsed no nested JSON-LD (matrix §9). Capture SERP features and PAA in a real browser during cluster research (§6.1), before the brief that needs them.
- **Not pulled:**
  - Census ACS / IRS migration flows (route and state data points);
  - BLS OEWS metro wages;
  - seasonality and trend columns;
  - SERP overlap for unmeasured pairs marked "verify" in the CSV (for example "out of state movers" vs "interstate movers", "best moving companies" vs "best long distance moving companies", "exclusive moving leads" vs "buy moving leads");
  - metros outside the 20 sampled;
  - Wave 1 state cost keywords ("cost to move to {state}", "moving costs {state}", "how much do movers cost in {state}") for TX, FL and CA, before choosing between a state hub cost section and `/moving-costs/{state}/` spokes (implications §7.5);
  - a "preferred movers" search-results and AI-answer check, before the directory slug and badge name are fixed (§0 item 9; implications §5.3);
  - organic keyword lists for reference outlier pages, such as HireAHelper's Tallahassee, Beckley and Oshkosh pages at about 140–160 visits per keyword [semrush top_pages_2026-10-27.csv; sites/hireahelper.md; matrix §9].
- **Product and data dependencies:**
  - a facts registry (claim, source, verifier, dates), extended to every public number with a definition, query, owner and as-of date (§6.3 rule 6);
  - a cost-data store (range, n, period, method, source);
  - coverage counts from the matching engine;
  - state-license verification (TxDMV, FDACS IM#, CA Cal-T) for local moves;
  - review data (none at launch);
  - authors and reviewers with real credentials;
  - consent coverage for aggregate statistics.
- **Approvals:** the nine business decisions in §0; counsel review of the calculator and cost wording, the recent request mix block (§6.3 rule 7), comparison pages, the role-and-money statement, review-related copy, the badge and directory name (implications §5.4) and the wiretap question in §8.8.
