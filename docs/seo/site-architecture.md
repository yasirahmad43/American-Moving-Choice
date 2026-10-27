# SEO site architecture, page families and rollout plan

> **PROVISIONAL — to be revised after the full reference-site review.** The URL patterns (§2) and page-family decisions (§1) are provisional until every reference site has been reviewed directly in a browser. No content briefs or page copy are included in this version.

**Status:** provisional proposal for review · **Date:** 2026-10-27 · **Workstream:** SEO / content
**Companion files:** `docs/seo/keyword-to-page-map.csv` (298 keywords → 134 URLs), `docs/seo/raw/` (new Semrush pulls), `docs/research/keyword-research.md`, `docs/research/reference-matrix.md`, `docs/research/compliance-and-platform-facts.md`.

**Data rules used here.** All volumes, KD and CPC values are Semrush US-database figures pulled 2026-10-27. They are models, not first-party analytics. Nothing has been estimated or invented. Anything not yet measured is marked **[missing]**, and facts that still need a primary-source check are marked **[verify]**. This container cannot fetch most external sites (proxy 403), so live SERP features, People Also Ask boxes and competitor page layouts were not observed directly.

---

## 0. Decisions at a glance (provisional)

| Topic | Decision |
|---|---|
| Geo pages (provisional) | `/movers/{state}/` → `/movers/{state}/{city}/` → `/movers/{state}/{city}/long-distance/`. Full state slugs, never 2-letter codes. |
| Company profiles (provisional) | Live under `/companies/{slug}/`, outside `/movers/`, so a company slug can never collide with a state slug. |
| Routes (provisional) | Directional state routes at `/moving-routes/{origin}-to-{destination}/`. A→B and B→A are separate pages, each with its own gate, and are never canonicalized to each other. City-to-city routes stay unindexed until they pass a stricter gate. Wave 1 indexes none. |
| ZIP pages (provisional) | No indexable ZIP pages in any planned wave. ZIPs are used only for matching and to prefill the quote form. |
| Indexation | A programmatic page gets no public URL until it passes its gate (§4). Pages that later fall below the gate switch to `noindex` (with hysteresis), then are consolidated. |
| Wave 1 markets | **Texas** (Dallas, Houston, Austin, San Antonio), **Florida** (Orlando, Miami, Tampa, plus Jacksonville as a reserve) and **California** (Los Angeles metro only), plus 16 directional state routes (§5). |
| Gate thresholds | Each of these must be met, not averaged: ≥3 Preferred Movers with genuine coverage, ≥3 verified local facts, a sourced and dated cost block, ≥4 unique FAQs, ≥40% unique content (hard fail below 30%), and a named human reviewer. Full table in §4. |
| Rich results | No FAQ or HowTo rich results in the plan. Google retired FAQ rich results for all sites on 2026-05-07, and HowTo was removed in 2023 (compliance facts §5). FAQ sections exist for users and AI answers only. |
| AI crawlers | Allow search and answer agents. Training crawlers are a separate business decision; the recommendation and options are in §7. |

**Decisions this plan needs from the business** (feed into the consolidated question list):
1. **Production domain.** This doc assumes `https://www.{domain}/` for the public site and `https://app.{domain}/` for the portals.
2. **Movers without an MC number.** The platform rule "USDOT **and** MC required" excludes intrastate-only movers, who hold state credentials instead (TxDMV, FDACS IM#, CA Cal-T). That shrinks coverage for **local** city pages. FMCSA has also proposed ending MC numbers (compliance facts §1). Local city pages depend on this decision.
3. **State credential verification.** Texas requires TxDMV registration to move household goods for compensation within Texas, and Florida and California have their own regimes. Local-move pages in Wave 1 states should show and verify these numbers. This needs a verification pipeline.
4. **Mover contact details on public profiles.** Showing a mover's phone or website lets consumers bypass the lead flow. Whatever is decided, structured data must match what is visible on the page.
5. **Sponsored placement.** If any paid placement exists, it must be labeled and must never affect verification status or ratings (FTC guidance; compliance facts §4).
6. **Training-crawler policy** (§7).
7. **Adjacent verticals.** Car shipping is broker-dominated and conflicts with the movers-only policy. Truck rental is DIY intent. Neither gets pages before a scope decision.
8. **Spanish content** for TX, FL and CA, considered after launch. If it happens, it must be real translated pages with hreflang.

---

## 1. Page families (provisional: revisit after the full reference-site review)

### 1.1 Consumer vs business intent

| | Consumer (hire a mover / plan a move) | Business (movers buying leads) |
|---|---|---|
| Example queries | "moving companies dallas", "moving from new york to florida", "how much do movers cost" | "buy moving leads" (720/mo, KD 18), "exclusive moving leads" (480, KD 9), "long distance moving leads" (390, KD 4) |
| Namespace | Everything except `/for-movers/` | `/for-movers/` only |
| Primary CTA | Quote survey (`/get-quotes/`, embedded entry points) | Apply / talk to sales (`/for-movers/apply/`) |
| Navigation | Main nav | Header utility link and footer only |
| Rules | No B2B CTAs or lead-pricing talk on consumer pages | No consumer quote form, no consumer FAQs |

### 1.2 Family table

Everything below is for consumers unless marked B2B. "Gate" refers to §4.

| Family | URL | Purpose / intent | Indexation rule | Minimum differentiation and data |
|---|---|---|---|---|
| Home | `/` | Brand, plus the head term "moving companies" (135k/mo, KD 62, a long-horizon target) | Index | AMC role statement, how sharing works, trust summary, links to published hubs |
| Quote survey | `/get-quotes/` | Transactional: "moving quotes" (12.1k, KD 52), "moving company quotes" (6.6k), "free moving quotes" (720) | Index the landing page only. Survey steps are client state, not URLs. `/get-quotes/confirmation/` is `noindex` | Plain explanation of who receives the request and of the sharing limit; movers-only policy; consent disclosure |
| National service pillars | `/long-distance-movers/`, `/interstate-movers/`, `/local-movers/` (`/cross-country-movers/` only in W2+) | Commercial national pillars | Index | Original explanation of service types, FMCSA authority (interstate), verified-mover counts, cost links |
| Geo index | `/movers/` | Entry to the state hubs; satisfies "movers near me" through links | Index | Lists **published** hubs only. ZIP/city search box. No IP-based content swapping |
| State hub | `/movers/{state}/` | Commercial: "moving companies florida" (1.3k, KD 30), "texas movers" (1k, KD 34) | Gate (state) | State regulator section (who licenses intrastate movers, with an official link) **[verify per state]**; Census state-to-state migration data **[missing: pull]**; published children (cities, long-distance, routes) |
| State long-distance | `/movers/{state}/long-distance/` | Commercial: "long distance movers florida" (390, KD 20, $45 CPC), "long distance movers texas" (260, KD 20, $50.63) | Gate (state LD) | ≥5 movers with interstate capability originating in the state; top outbound published routes; interstate rules summary |
| City page | `/movers/{state}/{city}/` | Commercial/local: "moving companies dallas" (4.4k, KD 42) and "movers dallas" (2.9k) share 8/10 top-10 URLs, so one page targets both | Gate (city) | Mover cards with credentials; local facts; cost block; local FAQs (full gate in §4) |
| City long-distance | `/movers/{state}/{city}/long-distance/` | Commercial outbound: "long distance movers dallas" (390, KD 17, $38.22), "...houston" (320), "...los angeles" (880) | Gate (city LD) | Top destinations from this origin (Census county flows or AMC data, n ≥ 30); long-distance cost ranges; ≥40% unique vs the parent city page |
| ZIP | none | — | **Never indexable**; no public ZIP pages | Exception path for the future: a named **community** page (not a ZIP page) when demand ≥50/mo and coverage meets the city gate |
| State route (directional) | `/moving-routes/{origin-state}-to-{dest-state}/` | Mixed informational/commercial: "moving from new york to florida" (480, KD 10) and its variants | Gate (route) | Directional mover coverage; flow data; cost ranges by home size; departure and arrival requirements; must differ from the reverse route |
| City route | `/moving-routes/{city}-{st}-to-{city}-{st}/` | Long-tail city pairs (the largest measured is NYC→Miami at 90/mo) | Gate (city route). **Wave 1: none indexed.** Shown as anchored sections of state routes | As for state routes, plus ≥100/mo demand or ≥30 AMC leads in 6 months |
| Moving-to guide | `/moving-to/{state}/`, `/moving-to/{state}/{city}/` (W2) | Informational relocation: "moving to florida" (2.4k, KD 27; SERP dominated by Reddit, Facebook and Quora), "moving to texas" (1.3k, KD 12), "moving to dallas" (2.4k, KD 13) | Gate (moving-to) | Official arrival requirements with sources (DMV, vehicle registration); migration data; moving logistics. **Out of scope:** neighborhood and school recommendations (no expertise) |
| Cost guide | `/moving-costs/`, `/moving-costs/{local,long-distance,how-movers-charge}/` | Informational: the "how much do movers cost" family (9.9k, KD 32), "how do moving companies charge" (1.9k, KD 19) | Index once it passes editorial review | Ranges with stated assumptions, sources, dates and sample sizes (§6.3); "movers set their own prices" disclosure |
| Cost calculator | `/moving-cost-calculator/` | Tool: "moving cost calculator" (5.4k, KD 49) and "moving cost estimator" (5.4k). The top 10 are all working tools | Index the tool page; **results never indexable** (no parameter URLs) | Working range estimator with a versioned method page. Wording must not read as a quote or binding estimate (FMCSA red flag; counsel question) |
| Verify a mover | `/verify-a-mover/` | Tool: "usdot number lookup" (4.4k, KD 18), "mc number lookup" (2.4k, KD 30), "what is a usdot number" (880) | Index the landing page only. **Lookup results are `noindex`**, with no static page per carrier | Explains USDOT, MC and state licenses; current MC-number status; data timestamp; "not an endorsement" |
| Preferred Movers directory | `/preferred-movers/`, `/preferred-movers/page/{n}/` | Commercial/navigational: "moving company reviews" (880) | Index (paginated pages self-canonical) | Public definition of "Preferred Mover"; ordering rule disclosed; sponsored items labeled |
| Company profile | `/companies/{slug}/`, `/companies/{slug}/reviews/` | Entity pages | Live on approval. Indexed when the profile-completeness gate passes (§4.5); `noindex` while suspended | Verified credentials and dates, original description, actual coverage, genuine reviews or "No customer reviews yet" |
| Comparison | `/compare/{slug}/` | Commercial: "best long distance moving companies" (**49.5k, KD 36**, $27.44) | Comparison gate (§4.6). Earliest W2 | Published methodology, inclusion independent of membership, material-connection disclosure, sourced claims, counsel review |
| Guides | `/guides/`, `/guides/{slug}/` | Informational: "moving out of state" (2.4k, KD 12), scams, estimates, rights | Index once it passes editorial review | Named author and reviewer, citations, dates, a defined information-gain statement (§6) |
| Trust pages | `/how-we-verify-movers/`, `/movers-vs-brokers/`, `/review-methodology/`, `/advertising-disclosure/`, `/editorial-policy/`, `/about/`, `/contact/`, `/complaints/`, `/report-a-concern/` | Entity and trust; "movers vs brokers" (110, KD 6), "moving broker" (320, KD 12) | Index | Specific, supportable statements only (no "government approved", "guaranteed" or "the best") |
| Authors | `/authors/{slug}/` | E-E-A-T | Index | Real person, truthful credentials, list of articles |
| B2B | `/for-movers/`, `/for-movers/moving-leads/`, `/for-movers/pricing/`, `/for-movers/eligibility/`, `/for-movers/reviews-and-reputation/`, `/for-movers/apply/` | Business intent | Index the landing pages. Application steps are `noindex` | Movers-only eligibility, exclusive vs shared explanation, verification process |
| Research | `/research/{slug}/` | Original aggregated data (link and citation asset) | Index only once data thresholds are met (§7.5). Earliest W2/W3 | Methodology, n, period, consent basis |
| Utility | `/search/`, `/get-quotes/confirmation/`, `/companies/{slug}/review/`, all of `app.{domain}` | Functional | `noindex` (portal also requires authentication) | — |

---

## 2. URL hierarchy (provisional: revisit after the full reference-site review)

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
├── preferred-movers/[page/{n}/]
├── companies/{slug}/[reviews/[page/{n}/]]
├── compare/{slug}/
├── guides/[{slug}/]
├── research/[{slug}/]
├── authors/{slug}/
├── for-movers/[{page}/]
└── how-we-verify-movers/  movers-vs-brokers/  review-methodology/  advertising-disclosure/
    editorial-policy/  about/  contact/  complaints/  report-a-concern/  privacy/  terms/
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
- **Host.** `www` is the public canonical host and the apex 301s to it. The `app.` subdomain keeps portal cookies and crawl isolated.

### 2.3 Breadcrumbs (visible, mirrored in `BreadcrumbList`)

| Page | Trail |
|---|---|
| City | Home › Movers › Texas › Dallas |
| City long-distance | Home › Movers › Texas › Dallas › Long-distance |
| State long-distance | Home › Movers › Florida › Long-distance |
| Route | Home › Moving routes › New York to Florida |
| Moving-to | Home › Moving to › Texas › Dallas |
| Profile | Home › Preferred Movers › {Company} |
| Cost spoke | Home › Moving costs › How movers charge |
| Guide | Home › Guides › {Title} |
| B2B | Home › For movers › Moving leads |

### 2.4 Canonical rules

1. Every indexable page has a self-referencing, absolute `https://www.` canonical with a trailing slash. It must be identical in the server-rendered HTML and after hydration, and never injected by JavaScript.
2. Tracking parameters (`utm_*`, `gclid`, `fbclid`, `msclkid`) canonicalize to the clean URL. The server does not redirect them, so analytics keep working.
3. Filter and sort parameters on city pages and the directory (`?service=packing&sort=rating`) canonicalize to the base URL. Filter controls are buttons or form state, not crawlable `<a href>` links with parameters. Canonical and `noindex` are never combined on the same URL.
4. Paginated pages (`/page/{n}/`) are self-canonical and indexable with unique titles. `/page/1/` 301s to the base URL.
5. No cross-family canonicals: A→B never points to B→A, and a city long-distance page never points to its city page. Never canonicalize to a `noindex` or redirected URL.
6. Where an editorial page overlaps a programmatic one, the editorial page is canonical and the programmatic page is consolidated (301), not cross-canonicalized.

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
| Company entities | `/preferred-movers/` | `/companies/{slug}/` | — |
| B2B | `/for-movers/` | `/for-movers/moving-leads/`, `/pricing/`, `/eligibility/`, `/reviews-and-reputation/`, `/apply/` | Business intent |

Overlap was measured on Semrush organic top-10 URLs for 13 keywords (`docs/seo/raw/semrush_phrase_organic_top10_2026-10-27.csv` plus the research CSV). Pairs not measured are marked "verify" in the CSV before any split or merge.

### 3.2 Link modules by family (only to **published, indexable** pages)

| From | Must link to |
|---|---|
| City | Its state hub (breadcrumb and body); its long-distance child if published; up to 5 nearest published cities in the same state; up to 5 published routes whose origin is the state; `/moving-costs/local/`; `/guides/how-to-choose-a-moving-company/`; each listed mover's profile |
| City long-distance | Parent city; state long-distance page; published routes from the state; `/interstate-movers/`; `/moving-costs/long-distance/` |
| State hub | All published cities, the state long-distance page, published inbound and outbound routes, `/moving-to/{state}/`, `/verify-a-mover/` (state license lookup section) |
| Route | Origin and destination state hubs; destination `/moving-to/` guide; the reverse route (anchor text "Moving from Florida to New York", direction explicit); `/interstate-movers/`; a calculator link with prefilled parameters (the calculator stays canonical); profiles of matching movers |
| Profile | Every published city page in its **verified** service area (top 10, then "all service areas" on the profile); `/how-we-verify-movers/#preferred-mover`; `/review-methodology/` |
| Guides | Contextual links to money pages (cost guide → calculator and `/get-quotes/`; scams guide → `/verify-a-mover/` and `/movers-vs-brokers/`) |
| Every badge | `/how-we-verify-movers/` anchor for that badge |

### 3.3 Anti-orphan and anti-doorway rules (checked by a staging crawl in CI)

1. Every indexable page has **≥3 contextual inbound links** from other indexable pages and is **≤3 clicks from home**. Orphans block release.
2. Indexable pages never link to unpublished or gated URLs (no 404s), and footers carry no city link farms. The footer lists only published state hubs.
3. Anchors are descriptive and varied. Exact-match anchors are not repeated sitewide.
4. **Doorway test.** Each page fully answers its query without a click. The quote entry is embedded and optional, with no auto-redirect and no interstitial. A page whose only value is a form fails.
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
| G1 | Preferred Movers with genuine coverage | ≥3 | ≥3 | ≥5 | ≥5 | ≥3 (directional) | ≥3 (directional) | n/a (links to hub) | Matching engine (`@amc/core` `matchCompany`) run on representative lead facts; approved, verified, unpaused movers only. **Local** coverage counts only explicit county/ZIP inclusions plus local capability, not nationwide or statewide catch-all rules |
| G2 | Demand evidence | listed in CSV | ≥50/mo or AMC ≥20 leads/6 mo | — | — | max variant ≥50/mo, or AMC ≥20 leads/6 mo | ≥100/mo **or** AMC ≥30 leads/6 mo, **and** the state route already published | ≥50/mo | Semrush (dated) or AMC lead counts |
| G3 | Verified local or route facts | ≥3 | ≥3 | ≥3 incl. state regulator | ≥3 | ≥4 (departure + arrival) | ≥4 | ≥5 official requirements | Facts registry: claim, official source URL, verifier, verified date, recheck date. Expired facts hide themselves |
| G4 | Cost block | sourced + dated | sourced + dated | optional | sourced + dated | sourced + dated | sourced + dated | optional | §6.3 rules. If data is missing, the block is omitted and the page fails the gate and waits |
| G5 | Original data point | ≥1 | ≥1 | ≥1 | ≥1 | ≥2 | ≥2 | ≥1 | Census/IRS flows, BLS OEWS metro data, or AMC aggregates (n ≥ 30) |
| G6 | Unique FAQs | ≥4 | ≥3 | ≥3 | ≥3 | ≥4 | ≥3 | ≥4 | Answers cite page-specific evidence; templated answers don't count |
| G7 | Unique content | ≥40% | ≥40% (vs parent city too) | ≥40% | ≥40% | ≥40% (vs reverse route too) | ≥40% | ≥40% | Share of main-content 5-word shingles found on no other page in the family. Global header, footer and nav are excluded; template boilerplate counts. **30–40% = editor must improve; <30% = hard fail** |
| G8 | Swap test | pass | pass | pass | pass | pass | pass | pass | Reviewer confirms every section holds at least one statement that would be false on a sibling page |
| G9 | Human review | 100% in W1–W2 | same | same | same | same | same | same | Named reviewer and date stored. From W3 on: a 20% sample plus every page with any flagged check |
| G10 | Technical | pass | pass | pass | pass | pass | pass | pass | Main content present in server-rendered HTML; 200; self-canonical; unique title and meta; schema validates; CWV lab budget (§8.7) |

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

### 4.5 Company profiles (completeness gate for indexing)

- Profiles go live on approval, as the brief requires.
- They are **indexed** once these conditions hold:
  - credentials are verified and current;
  - the original description passes a duplication check (≤50% shingle overlap with the company's own site, otherwise it is `noindex` until rewritten);
  - coverage is configured.
- New companies show "New to our network" and "No customer reviews yet". No rating and no `aggregateRating` until at least one genuine on-platform review exists.

### 4.6 Comparison gate (`/compare/*`)

All of these are required:
- a published methodology (criteria, weights, data sources with dates);
- inclusion criteria independent of membership or payment, with non-members treated equally;
- a material-connection disclosure (movers pay AMC for leads);
- every claim sourced;
- a named author and reviewer;
- counsel review;
- an update cadence of 6 months or less.

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
- `/verify-a-mover/`, the 9 trust pages and authors.
- About 6 guides (moving out of state, how to choose, scams, estimates explained, your rights interstate, and an author/editorial set).
- The B2B section (6 pages).
- `/preferred-movers/` and approved profiles.

**Supply dependency:** route pages need directional coverage. For example, NY→FL needs movers whose rules include origin NY and destination FL, such as FL interstate carriers running northeast routes. Recruit for the routes, not only for the cities.

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

1. Publish **ranges, never point prices**. Each range states the assumptions (home size, distance band, included and excluded services, season), source, "data as of" date and sample size.
2. Allowed sources, in order of preference:
   - (a) member-reported rate cards with ≥5 distinct movers per geography;
   - (b) AMC aggregated, consented lead data, for non-price facts only (n ≥ 30 per geography, cells under 10 suppressed);
   - (c) authoritative public data (for example BLS OEWS metro wages for SOC 53-7062, as labor-cost context only);
   - (d) third-party studies with a published method, cited.
   Competitor figures appear only as cited context, never as our data.
3. Every cost block says that movers set their own prices and that AMC does not provide quotes or binding estimates. Counsel should approve this wording.
4. Refresh every 6 months or when a source updates. If data is insufficient, omit the block; the page then waits at the gate.
5. The calculator has a versioned formula, a public method page and a changelog. Outputs are labeled as ranges, and its wording gets counsel review (compliance facts §2).

### 6.4 Sample briefs

Sample briefs deferred until the full reference-site review is complete.

---

## 7. AI search visibility (GEO/AEO)

Google's position (AI optimization guide, May–June 2026; compliance facts §5) is that generative AI search **is still SEO**. Pages must be indexed and snippet-eligible. llms.txt, "chunking" and manufactured mentions are not needed. We follow that, and treat other AI platforms as separate surfaces measured separately.

### 7.1 Entity consistency

- One Organization entity, `https://www.{domain}/#organization`, used on every page that references the publisher. It carries the exact name "American Moving Choice", logo, URL, `sameAs` (real profiles only) and a real support contact. Legal name and address come from the client **[missing]**.
- One counsel-approved **role statement**, reused verbatim in the footer, `/about/`, the schema `description` and the quote flow. It must cover: AMC is an online marketplace; it connects consumers with independent, screened moving carriers; it is not a mover or broker and does not transport goods; participating movers pay for quote requests. Wording to be written after the reference-site review and counsel input.
- Brand facts (founding date, team) appear only if they are true. No fabricated stats.

### 7.2 Authorship and policies

- Named authors (`/authors/{slug}/`, ProfilePage + Person) with truthful credentials. Regulatory and cost content needs a named reviewer with relevant experience **[who? missing]**.
- Required policies: editorial policy (including how AI assistance is used and checked), review methodology (FTC platform guide), advertising disclosure (how AMC makes money, how sponsored placement is labeled), how we verify movers (what is checked, when, and what is not checked).

### 7.3 Citations and dates

- Link primary sources inline (FMCSA, state agencies, Census, BLS).
- "Last updated" changes only on a substantive edit. "Last reviewed" shows a reviewer and date for periodic checks. Each data block carries its own "data as of" date. Never fake freshness.
- Keep snippets eligible: no `nosnippet` on content we want cited; default `max-snippet:-1`.

### 7.4 Citable formats

Put the self-contained answer in the first screen of each page. Use question-phrased H2s where they are natural, comparison tables, and definitions ("A household goods broker is..."). Write for people. Don't rewrite pages "for AI".

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

**llms.txt:** optional and cheap. Publish a short one listing the trust pages and hubs after launch (P3). It is **not** a ranking or citation lever: Google ignores it, and no other vendor has confirmed using it.

### 7.7 AI visibility measurement

- **Query sample:** 60 fixed prompts, run monthly with a pre-launch baseline.
  - 15 commercial ("best long distance moving companies", "moving companies in Dallas");
  - 15 cost ("how much does it cost to move from New York to Florida");
  - 10 trust ("how to check if a mover is legit", "movers vs brokers");
  - 10 route and relocation;
  - 5 brand ("American Moving Choice reviews");
  - 5 B2B ("buy moving leads").
- **Platforms:** Google AI Overviews and AI Mode, ChatGPT (search on), Perplexity, Gemini, Claude (web search), Microsoft Copilot.
- **Record per run:** date, platform, mode or model if shown, logged-in state, location context (device location or prompt-stated city), exact prompt, whether AMC is mentioned, whether it is cited and which URL, order, competitor domains cited, accuracy of statements about AMC, and a screenshot. Run each prompt 2–3 times.
- **Limitations:** answers are non-deterministic and personalized, and models change, so read results as directional only. DataForSEO AI-visibility tools are not available in this environment.
- **Referral tracking:**
  - a GA4 "AI assistants" channel group matching referrers such as chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com and claude.ai, plus the `utm_source` values these products append **[verify current behaviour per platform]**;
  - conversions (survey start, completion, qualified lead) reported by that channel;
  - Search Console's generative-AI performance report (compliance facts §5) **[confirm availability on the property]**.

---

## 8. Technical SEO specification

### 8.1 Rendering

Public pages are server-rendered or statically generated with incremental revalidation. Main content, title, meta, canonical, robots and JSON-LD are all in the initial HTML; JavaScript never injects or changes them. The quote survey hydrates as an island.

### 8.2 Metadata templates

Keep the primary phrase first. Add " | American Moving Choice" only when the title stays ≤ about 65 characters. Set the WebSite `name` so Google can show the site name. Each description must contain at least one page-specific data point.

| Family | Title template | H1 template |
|---|---|---|
| State hub | Moving Companies in {State} \| Verified {State} Movers & Costs | Moving companies in {State} |
| State LD | Long-Distance Movers in {State} \| Out-of-State Moving Quotes | Long-distance movers in {State} |
| City | Movers in {City}, {ST} \| Compare Verified Moving Companies | Movers in {City}, {ST}: compare screened moving companies |
| City LD | Long-Distance Movers in {City}, {ST} \| Verified Interstate Carriers | Long-distance movers in {City} |
| Route | Moving from {A} to {B}: Costs, Movers & Planning Guide | Moving from {A} to {B} |
| Moving-to | Moving to {Place}: Costs, Requirements & Moving Tips | Moving to {Place} |
| Profile | {Company}: Reviews, USDOT {DOT} & Service Areas | {Company} |
| Directory | Preferred Movers: Screened Moving Carriers \| American Moving Choice | Preferred Movers |
| Calculator | Moving Cost Calculator: Estimate Your Moving Cost Range | Moving cost calculator |
| B2B | Moving Leads for Carriers: Exclusive & Shared Leads \| American Moving Choice | Moving leads for licensed carriers |

### 8.3 Robots directives

| Scope | Directive |
|---|---|
| Indexable public pages | `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` |
| Below-gate geo pages, incomplete or suspended profiles | `noindex, follow` |
| Utility pages, tool results, review forms, internal search | `noindex` |
| `app.{domain}` | `X-Robots-Tag: noindex, nofollow` on every response, plus authentication. Not disallowed in robots.txt, so crawlers can see the noindex |

`robots.txt` on `www`:
- Allows all of the agents in §7.6.
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
| Company profiles | `MovingCompany` with name, url, logo, address (if public), `areaServed` matching visible coverage, `identifier` as `PropertyValue` for USDOT (and MC if present), and `sameAs` (the company's site, only if displayed) | `aggregateRating`/`review` **only** with genuine on-page user reviews; never on profiles without reviews. Third-party review pages may be eligible for review snippets, but stars are not promised. AMC's own Organization pages can't carry self-serving review markup |
| Pages with video modules | `VideoObject` (name, description, thumbnailUrl, uploadDate, duration, contentUrl or embedUrl) | Matches the visible player. Captions and transcript on the page |
| FAQ sections | none | FAQ rich results were retired on 2026-05-07, so no FAQPage markup is planned (Google advises against over-investing in markup for AI) |
| Research reports | `Dataset` (optional) | Dataset Search only |
| Never | `HowTo`, fabricated `Review`, ratings for AMC itself | — |

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
- third-party scripts deferred until after interaction where compliance allows. The consent-certificate script must load before the consent text, so test its cost;
- reserved space for mover lists and consent blocks;
- video modules show a poster facade until clicked, with no autoplaying audio.

Report lab and field numbers separately. Never present lab results as real-user CWV.

---

## 9. Measurement

| Area | Setup | KPIs and decision rules |
|---|---|---|
| Google Search Console | Domain property; per-family sitemaps; page-indexing and generative-AI performance reports | Indexed vs submitted per family (≥80% within 8 weeks of publish); "Crawled – currently not indexed" <20%; impressions, clicks, CTR and position by family and market |
| Bing Webmaster Tools | Import from GSC; IndexNow key | Indexed coverage; Copilot/AI reporting where available **[verify]** |
| Analytics (GA4 + server-side events, no PII) | Landing page family dimension; survey events | Survey start rate, completion rate, qualified-lead rate, leads with ≥1 matched buyer, net revenue per organic session (after credits) by family and market |
| Rank tracking | Semrush Position Tracking project: all H and M keywords from the CSV, tagged by family, market and wave; daily; national location for national terms and city-level locations for city terms; desktop and mobile | Visibility by tag; cannibalization alerts (two URLs alternating) |
| Drift (seo-drift) | Baseline per template and per published URL: status, title, meta, canonical, robots, H1, JSON-LD types, internal link count. Diff in CI on every deploy against staging, plus a weekly production run | Block or alert on an added `noindex`, a canonical change, a schema error, a missing H1 or a status change |
| Logs | Bot hits by family (Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot) | Crawl coverage of new batches; wasted crawl on parameter URLs |
| Reviews | Monthly SEO review (first 6 months), then quarterly | Pruning decisions (§4.4); SXO review (seo-sxo) for pages with high impressions and low survey starts; title and meta tests for low CTR at good positions |

---

## 10. Skills log

| Skill | Used how | Contribution | Notes |
|---|---|---|---|
| seo-plan | Loaded | Planning structure; local-service and publisher templates (location-page quality gates, E-E-A-T author requirements) | Its "hard stop at 50 location pages" suits a single local business. For a marketplace it is replaced here by data-driven gates and batch caps |
| seo-sxo | Loaded | Page-type taxonomy and SERP-consensus approach (calculator SERP 10/10 tools; Dallas SERP = providers + aggregators; NY→FL fragmented UGC) | Its URL-fetch pipeline couldn't run (no site exists; fetching is blocked) |
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

- **Not observed (network policy blocks fetching):** live SERP features, PAA questions, competitor page layouts, AI Overview presence. Capture them in a real browser as part of the full reference-site review, before any briefs are written.
- **Not pulled:**
  - Census ACS / IRS migration flows (route and state data points);
  - BLS OEWS metro wages;
  - seasonality and trend columns;
  - SERP overlap for unmeasured pairs marked "verify" in the CSV (for example "out of state movers" vs "interstate movers", "best moving companies" vs "best long distance moving companies", "exclusive moving leads" vs "buy moving leads");
  - metros outside the 20 sampled.
- **Product and data dependencies:**
  - a facts registry (claim, source, verifier, dates);
  - a cost-data store (range, n, period, method, source);
  - coverage counts from the matching engine;
  - state-license verification (TxDMV, FDACS IM#, CA Cal-T) for local moves;
  - review data (none at launch);
  - authors and reviewers with real credentials;
  - consent coverage for aggregate statistics.
- **Approvals:** the eight business decisions in §0; counsel review of the calculator and cost wording, comparison pages, the role statement and review-related copy.
