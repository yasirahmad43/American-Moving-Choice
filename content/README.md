# Site content: drafts, briefs and conventions

**Status:** draft copy for owner, counsel and editorial review, started 2026-10-28. Nothing in this folder is approved for publication. Every page here waits on the decisions and reviews its front matter lists.

This folder holds the public-site copy for American Moving Choice (AMC) before it moves into the CMS (Payload, per `docs/architecture/stack-and-architecture.md`). The first set follows implications §7.1 (`docs/research/reference-review/implications-for-content-seo-design.md`): the trust pages first, because badges, consent screens and lists link to them, then the cost pages.

## 1. Layout

| Path | What it holds |
|---|---|
| `content/README.md` | These conventions |
| `content/stored-texts.md` | Standard statements (ST-1 to ST-7) that every surface renders from one record |
| `content/pages/{family}/{slug}.md` | Page copy, with front matter |
| `content/briefs/{slug}.md` | The brief for each page: intent, outline, decision dependencies and the source record (site architecture §6.2) |
| `docs/research/content-claims/` | Research notes behind the regulatory claims the pages make |

Families: `trust` and `costs` so far.

## 2. Page front matter

```yaml
---
id: trust-how-we-verify-movers          # stable ID
url: /how-we-verify-movers/              # from site architecture §2.1
family: Trust page                       # site architecture §1.2 family name
title: "How We Verify Movers | American Moving Choice"   # about 65 characters or fewer
meta_description: "…"                    # 155 characters or fewer; at least one page-specific fact (site architecture §8.2)
h1: "How we verify movers"
breadcrumb: "Home › How we verify movers"
indexation: index once approved          # site architecture §1.2 rule for the family
schema: [WebPage, BreadcrumbList]        # site architecture §8.5; never FAQPage or HowTo
primary_queries: []                      # rows from docs/seo/keyword-to-page-map.csv, if any
status: draft-v0                         # draft-v0 → owner/counsel review → approved
author: "{{page.author}}"                # named person, pending brief §11 Q9
reviewer: "{{page.reviewer}}"            # a different named person
data_owner: "{{page.data_owner}}"        # for pages with data blocks; otherwise n/a
ai_assisted: true                        # see the editorial policy
ai_role: drafted                         # drafted | summarized | none; sets the review note's AI line and the author's label (editorial policy, "How we tell you")
stored_texts: [ST-1, ST-2]               # keys used on the page
tokens: []                               # registry and setting keys used on the page
depends_on: []                           # owner and counsel decisions that can change the copy
last_updated: null                       # set by the CMS on the first approved publish
---
```

**Anchors.** A section that any page links to carries an explicit `<a id="…"></a>` line before its heading, as How we verify movers' `#badge` does, and keeps that ID when the heading changes. Links may target only such IDs; no renderer is specified to make heading slugs (build plan §12 renders Markdown from `content/`).

## 3. Tokens and markers

**Tokens** are values the CMS renders from a record, so a number or name lives in one place (implications §4.5; site architecture §6.3 rule 6). Never type the value by hand. Until the CMS exists, `content/tokens.json` holds the values the site renders; `null` renders as a visible "pending" placeholder.

| Token | Meaning | Current value or status | Source | Platform setting |
|---|---|---|---|---|
| `{{org.legal_name}}`, `{{org.address}}`, `{{org.owner}}` | Legal entity, address, owner | Missing | brief §11 Q1 | — |
| `{{org.support_email}}`, `{{org.support_phone}}`, `{{org.editorial_email}}` | Contact points | Missing | brief §11 Q1 | — |
| `{{badge.name}}` | Name of the screening badge | Pending counsel and usability round 1. Working name "Preferred Mover · American Moving Choice" | implications §5; site architecture §0 item 9 | — |
| `{{directory.name}}`, `{{directory.url}}` | Mover directory name and slug | Pending, with the badge name | site architecture §0 item 9 | — |
| `{{setting.max_movers}}` | Highest answer allowed to "How many moving companies would you like to hear from?" | Proposed 5 | shared pricing §1; brief §11 Q5 | `max_sharing_limit` |
| `{{setting.require_mc_number}}` | Whether an MC number is required to join | On | mover verification §1 | `require_mc_number` (not in build plan §4.1's 002 list; confirm) |
| `{{setting.sale_window_hours}}` | How long movers can buy a request | Proposed 72 | lead lifecycle §1 | `sale_window_hours` |
| `{{setting.local_radius_miles}}` | Distance that separates local from in-state long-distance moves | 50 | lead lifecycle §3 | `local_max_miles` |
| `{{setting.duplicate_window_days}}` | Window in which a repeat request joins the first | 30 | lead lifecycle §4 | `duplicate_window_days` |
| `{{setting.new_to_network_days}}` | How long a profile shows "New to our network" | Proposed 90 | mover verification §5, §9 | `new_to_network_days` |
| `{{setting.quote_invite_delay_days}}` | Days after purchase before the quote-experience review invitation | About 7 | mover verification §6 | `quote_invite_delay_days` |
| `{{setting.post_move_invite_days}}` | Days after the stated move date before AMC's move-experience invitation | Proposed 21; a rule change pending the owner | implications §4.4 | `post_move_invite_days` |
| `{{setting.rank_min_reviews}}` | Eligible reviews of one type needed before any rank, "top" claim or rating-sort priority | 5 | implications §4.4, §11 Q15 | `rank_min_reviews` |
| `{{setting.ai_summary_min_reviews}}` | Reviews needed before any AI review summary | 10 | implications §4.4 | none (tokens.json value) |
| `{{setting.reviews_subpage_min}}` | Eligible reviews before a profile gets its own `/reviews/` page | 10 | site architecture §1.2 | none (tokens.json value) |
| `{{setting.stop_propagation_target}}` | Target time for a STOP or withdrawal to reach every buyer | Owner sets it | implications §2.6 | none (tokens.json value) |
| `{{setting.geo_min_movers}}`, `{{setting.geo_min_movers_state}}` | Movers needed before a city, long-distance or route page, or a state page, goes live | 3; 5 | site architecture §4.1 G1 | none (tokens.json value; §4.1 makes gate thresholds configurable per family in admin) |
| `{{setting.geo_min_facts}}`, `{{setting.geo_min_facts_route}}`, `{{setting.moving_to_min_requirements}}` | Checked facts needed on a location page, a route page, and official requirements on a moving-to guide | 3; 4; 5 | site architecture §4.1 G3 | none (tokens.json value) |
| `{{setting.geo_min_data_points}}`, `{{setting.geo_min_data_points_route}}` | Original data points needed on a location page and a route page | 1; 2 | site architecture §4.1 G5 | none (tokens.json value) |
| `{{setting.geo_deindex_days}}`, `{{setting.geo_consolidate_days}}` | Days below the bar before a live location page is set to noindex, and before it is redirected or removed | 30; 90 | site architecture §4.4 | none (tokens.json value) |
| `{{setting.fact_recheck_months}}` | Longest gap between rechecks of a verified fact | 6 | site architecture §4.3 | none (tokens.json value) |
| `{{setting.credential_alert_days}}` | When movers are alerted before a certificate or state credential expires | "30, 14 and 7" (and again on the day) | mover verification §3 | none (tokens.json value) |
| `{{policy.quote_max_words}}` | Longest quote from an official source | 25 | README §5 | — |
| `{{pricing.revenue_relationship}}` | The precise sentence on how AMC's revenue varies with the number of buyers | Owner and counsel approve; default sentence in stored texts | implications §11 Q8 | — |
| `{{company.*}}` | Values from one mover's record, such as `{{company.verified_date}}` | From the verification record; content pages show the specimen "[the date shown on its profile]" | mover verification §3 | — |
| `{{cost.model.version}}`, `{{cost.dataset.version}}`, `{{cost.model.effective_date}}`, `{{cost.dataset.next_refresh}}`, `{{cost.changelog.*}}` | Model and dataset version metadata | cost-model-v1 (proposal); No data yet; Not live yet | build plan §7.3 | — |
| `{{cost.method.*}}` | Method values: thresholds, percentiles, rounding, bands, service assumptions, request-data minimums, refresh and age limits | Proposed v1 defaults; the data owner confirms | build plan §7.3; method page | — |
| `{{cost.result.*}}` | One calculator result | Run time; content pages show specimens such as "[low] to [high]" | ST-7 | — |
| `{{cost.hub.<size>.<move_type>.<field>}}` | One row of the Moving costs table | No data yet (null) | site architecture §6.3 rule 6 | — |
| `{{text.ST-n}}` | A stored text from `stored-texts.md` | Draft | this folder | — |
| `{{page.author}}`, `{{page.reviewer}}`, `{{page.data_owner}}` | Named people | Missing | brief §11 Q9 | — |

A setting token renders the platform setting named in the last column (`_setting_keys` in `tokens.json`), or the `tokens.json` value where none exists yet. Keys in `tokens.json` that begin with `_` are notes, not tokens. `{{company.verified_date}}` and `{{cost.result.*}}` are content-page specimens: on a page about no single mover or result, they render the bracketed placeholder in `tokens.json`, and profiles and the calculator fill real values at run time.

**Regulatory figures.** A figure that states a law or regulator's rule (for example the $75,000 broker bond, 49 U.S.C. 13906(b)(3); the $5,000 and $10,000 cargo minimums, 49 CFR 387.303T; 110% and 15% at delivery, 49 CFR 375.407 and 375.703; 60 cents a pound, 49 CFR 375.201) may be typed where the same sentence or table row cites its primary source and the source record has a row for it. A title or meta may carry it only if the body cites it. AMC's own numbers are never typed: they are tokens from the table above (site architecture §6.3 rule 6).

**Markers** flag what must happen before publication. They never ship. The publish check fails while any remains.

| Marker | Use it when |
|---|---|
| `[Counsel: …]` | Legal wording or a legal question. Implications names several items counsel words: the role statement, broker definitions, consent, the 110% rule and range wording |
| `[Owner: … — default shown (implications §11 Qn)]` | The copy follows a recommended default the owner has not yet approved |
| `[Data: …]` | A data block that is omitted at publish unless its source passes the thresholds in site architecture §6.3 |
| `[Data owner: …]` | A method value, definition or format the data owner must confirm before launch |
| `[Verify: …]` | A fact taken from a search excerpt or a secondary source. Confirm it against the primary page before publishing |
| `[Build: …]` | A statement about product behavior that the build must make true and test |

## 4. Voice

- Plain, direct and calm. Write to one reader as "you"; AMC is "we". Short sentences and short paragraphs. US spelling.
- Sentence-case headings. Question headings where readers would ask the question.
- Put the answer first. Question-led pages open with a 40 to 60 word answer under the H1 (site architecture §6.1 step 4, §7.4).
- Use tables for comparisons, numbered lists for steps and plain lists for sets.
- Explain a rule's reason in one clause when the reason helps the reader trust it.
- No hype, no exclamation marks, and none of the clichés VD §3 bans ("seamless", "elevate", "hassle-free", "stress-free", "peace of mind").
- Absolute dates only ("verified on March 3, 2027"). No relative dates and no year in a title unless the page's data is for that year.
- Name "American Moving Choice" in full on first mention on a page. "How AMC makes money" is the fixed page name (site architecture §1.2).
- On consumer pages, say "move request" or "request", never "lead". B2B pages under `/for-movers/` may say "lead".
- Name the steps of the quote survey as implications §2.1 numbers them: What you need, Where, When, Size and services, What we found, Your details, How many movers, Review and send, Confirmation.

## 5. Wording rules

These come from implications §3.4, §4.2, §4.4, §8.6, compliance facts §2 and §4, VD §3 and site architecture §8.2.

| Don't write | Why | Write instead |
|---|---|---|
| "licensed", "vetted", "verified", "certified" or "screened" on their own | The reference review found these words used with no method at seven sites; 49 CFR 375.207 questions stay with counsel | Name the check ("active household-goods carrier authority on the FMCSA record, checked weekly") or link to How we verify movers. The review labels "Verified platform inquiry", "Verified customer" and "Verified completed move" may appear as label names, always with their definitions |
| "our movers", "your mover", "we'll match you with the right mover", "we book", "booking", "a specialist will call" | AMC is not a mover or broker and does not pick, assign or book (compliance facts §2; implications D5) | "movers in our network", "movers you choose to hear from", "movers contact you directly" |
| "get your quote", "instant quote", "instant price", "instant estimate", "your price" | AMC gives no quotes or estimates; sight-unseen estimates are an FMCSA red flag | "request quotes from movers", "planning range" |
| "save", "save up to …%", "cheapest", "lowest price", "best rate", "discount" | No savings claims; AMC has no complete record of who hires which mover (movers' CRM stages are self-reported) | Describe what affects price |
| "best", "top", "#1", "top-rated", "leading", "trusted by thousands" | No ranking at launch; no unsourced counts (implications §4.4, §7.3) | Specific, sourced facts |
| "guaranteed", "protected", "safe", "government approved", "official", "endorsed" | Unsupportable; never borrow authority (VD §3) | What was checked, when and where |
| "independent reviews" | Movers pay AMC; the FTC rule bars misrepresenting independence (compliance facts §4) | "Reviews collected by American Moving Choice from consumers whose requests a mover bought", with the paid relationship stated |
| "We never sell your data", "We don't sell your details" | Counsel must first decide whether paid delivery to named movers is a "sale" (implications §3.7) | Say who receives the details, up to what number, and that those movers pay |
| "Free quotes" | Some movers charge for some estimate types; AMC can't promise free quotes | "Free to use. Movers pay us, not you." |
| "Preferred", "Partner", "Featured" | The badge name is pending, and these words read as paid in this market (implications §5) | `{{badge.name}}` |
| Counts, ratings, years in business, "people helped", "moves completed" | Fabricated or unregistered numbers (mover verification §5; implications §4.5) | A registry token, or nothing |
| First-person experience on templated pages ("As movers ourselves…") | Not true of AMC (site architecture §7.3) | Plain statements |

The bans apply to claims about AMC or movers. Allowed: negated statements of what AMC doesn't do (ST-1a's "arrange or book moves"; "we don't take deposits, booking fees…"), words quoted inside a naming rule (the Sponsored rule), a regulation's own terms ("certified scale", "certified checks") and the three review label names. The copy check lists each allowance by page.

Never name or quote competitors in consumer copy. Quotes from official sources stay under 25 words (`{{policy.quote_max_words}}` on pages), with a link.

## 6. Facts, sources and the law

- Every factual claim about the law or a regulator traces to a source record row with a primary source. Federal rules come from eCFR, the U.S. Code, FMCSA, the FTC or the FCC; state rules come from the state agency or statute.
- When the only access was a search excerpt, the row says so and the copy carries `[Verify: …]` until someone confirms the primary page. Fetching primary pages was blocked in this environment on 2026-10-27 (compliance facts, "How this was researched").
- Describe the law in plain words and link it. Don't draw legal conclusions about AMC; those are questions for counsel (`[Counsel: …]`).
- AMC's own rules come from the documents in `docs/business-rules/`, the implications document and site architecture. Where those documents disagree, the implications document's recommendation is shown with an `[Owner: …]` marker and the current rule is named in the brief.

## 7. Source records

Each brief ends with a source record using site architecture §6.2's fields: `id`, `question_or_claim`, `source_url`, `source_type`, `accessed_date`, `intent`, `answer_evidence`, `intended_page`, `status`, `verified_by / recheck_due`.

This folder adds one `source_type` to the §6.2 list: **AMC policy**, for a statement that rests on an AMC document (for example `docs/business-rules/mover-verification-and-reviews.md` §3). Its `source_url` is the repository path and section.

## 8. Publish checklist (per page)

1. No markers remain, and every `depends_on` item is decided.
2. Stored texts render from their records. Tokens resolve to registry values with dates.
3. Author, a different reviewer and, where data appears, a data owner are named (site architecture §7.2).
4. Every source record row is `verified`.
5. Internal links point only to published, indexable pages (site architecture §3.2), and every #anchor exists on its target page as an explicit ID (§2). Drafts may link to planned pages; the check removes or holds those links.
6. Title, meta, H1, breadcrumb and JSON-LD match the visible page (site architecture §8.2, §8.5).
7. `last_updated` is set by the CMS, not by hand.

## 9. Which page owns which topic

Each topic has one home page. Other pages give a one- or two-sentence summary and link there.

| Page | Owns |
|---|---|
| How we verify movers (`/how-we-verify-movers/`) | Who can join, every check AMC runs, rechecks, what happens when a check fails, the badge's meaning, what AMC does not check |
| Movers vs brokers (`/movers-vs-brokers/`) | Carrier and broker definitions, the comparison table, reading an FMCSA record, broker disclosure duties, why AMC is movers-only and holds no operating authority |
| How AMC makes money (`/advertising-disclosure/`) | Who pays, how requests are priced to movers (in brief), AMC's incentives and their limits, what payment never changes, sponsored placement, related parties |
| Which companies receive my request (`/which-companies-receive-my-request/`) | The request path, the count question, naming and removing movers, consent, notices after sending, time and duplicate limits, withdrawal, who else handles your details |
| Review methodology (`/review-methodology/`) | Who can review, evidence labels, invitations, moderation, ratings, minimum samples, AI summaries |
| Editorial policy (`/editorial-policy/`) | Authors and reviewers, sources, numbers and dates, corrections, AI use, images, editorial independence |
| How the calculator works (`/moving-cost-calculator/method/`) | The cost model, its data sources and thresholds, the range method, versioning |
| Moving cost calculator (`/moving-cost-calculator/`) | The tool's interface copy |
| How movers charge (`/moving-costs/how-movers-charge/`) | Hourly and weight-based pricing, estimate types, the 110% rule, valuation, extra charges, documents, deposits |
| Moving costs (`/moving-costs/`) | The cost overview, the gated ranges table, cost drivers, links to the spokes and the calculator |

How movers charge states these rules once, in summary tables. /guides/moving-estimates-explained/ and /guides/moving-insurance-and-valuation/ explain them in depth and link back for the rule text, never restating the tables. [Owner and editorial: confirm (How movers charge brief §10 item 2)]

The role-and-money statement (ST-1) belongs to "How AMC makes money". Other pages use ST-1b, or ST-1e and a link; none writes its own version of AMC's role. A sentence that says only that movers pay for the requests they buy is page copy. Until counsel approves ST-1e, How movers charge's first two sentences under "Where does American Moving Choice fit?" and Moving costs' role line carry the same [Counsel] marker.

## 10. Proposed additions to other documents

- **Method page URL.** `/moving-cost-calculator/method/` for the calculator's public method page (site architecture §6.3 rule 5 asks for one but gives no URL). Breadcrumb: Home › Moving cost calculator › How the calculator works. Add it to site architecture §2.1 if approved.
- **Source type.** "AMC policy", as §7 above describes, for site architecture §6.2.
- **Regulatory figures and policy numbers.** §3's rule: a regulatory figure may be typed beside its primary-source citation; AMC's own numbers, including the location-page gate thresholds, the 30- and 90-day rules, the 6-month fact recheck, the credential alert days and the quote limit, are tokens. Site architecture §6.3 rule 6 and §4.1 ("thresholds are configurable per family in admin") should name these registry keys if approved.
