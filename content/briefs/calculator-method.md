# Brief: How the moving cost calculator works

## 1. Header

| Field | Value |
|---|---|
| Page file | `content/pages/costs/calculator-method.md` |
| URL | `/moving-cost-calculator/method/`, proposed in `content/README.md` §10 and not yet in site architecture §2.1 |
| Family | Cost calculator. Site architecture §1.2's Cost calculator row asks for "a versioned public method page"; the content folder is `costs` |
| Status | draft-v0 |
| Date | 2026-10-28 |
| Breadcrumb | Home › Moving cost calculator › How the calculator works (`content/README.md` §10) |
| Indexation | Index once approved. The Cost calculator rule in site architecture §1.2 indexes the tool page and never the results. This is a static method page with no parameters, so the draft follows the trust-page rule ("Index") |
| Schema | `WebPage` (with `reviewedBy` once the reviewer is shown) and `BreadcrumbList` (site architecture §8.5). No FAQPage, HowTo or Dataset |
| Stored texts | ST-6 under the answer; ST-7 in the label section |
| Topic ownership | This page owns the cost model, its data sources and thresholds, the range method and versioning (`content/README.md` §9). Valuation, estimate types and extra charges stay with How movers charge; the money relationship stays with How AMC makes money |

## 2. Purpose and reader

**Purpose.** Make every calculator range checkable. Site architecture §6.3 rule 5 requires a versioned formula, a public method page and a changelog, and implications §7.2 and §8.3 require a method link on every range. ST-7's "How this range is calculated" link points here, so this page has to answer what a label can't: what goes in, how the range is built, when no range shows, what the range leaves out and what money can't change.

**Readers.**
- **Primary:** a person planning a household move who has just seen a range, or a "not enough data" message, and wants to know where it came from and how far to trust it. They arrive from the label link, the cost hub or a cost block on a geo or route page.
- **Secondary:** editors, reviewers, journalists and answer engines that cite AMC's figures, and movers in the network who want to know how their rate cards are used. The page carries no B2B call to action (site architecture §1.1).

**What the reader should leave with:** the range is a planning figure from movers' own rates, never a price; the method, thresholds and version are public; and no mover can pay to move a range.

## 3. Search intent and target queries

There are none. `docs/seo/keyword-to-page-map.csv` maps no keyword to `/moving-cost-calculator/method/`, and no Semrush pull covers method-page queries such as "how is the moving cost range calculated" **[missing: not pulled]**. This is a trust and entity page. It earns its place through inbound links from every range and through citations, not through rankings.

The calculator queries in the map belong to the tool page. The method page must not compete for them, so its title and H1 avoid "estimator" and "estimate" and it links to the tool.

| Keyword (not targeted here) | Volume | KD | Mapped URL | Priority |
|---|---:|---:|---|---|
| moving cost calculator | 5,400 | 49 | `/moving-cost-calculator/` | H |
| moving cost estimator | 5,400 | 45 | `/moving-cost-calculator/` | H |
| moving estimate | 4,400 | 45 | `/moving-cost-calculator/` | M |
| long distance moving cost calculator | 210 | 43 | `/moving-cost-calculator/` | M |

Source: `docs/seo/keyword-to-page-map.csv` lines 20 to 23 (Semrush US, 2026-10-27).

## 4. Information gain

What the reference review saw, and what this page adds. "Matrix" is `docs/research/reference-matrix.md` (v2); "implications" is `docs/research/reference-review/implications-for-content-seo-design.md`.

| What the references showed | Evidence | What this page adds |
|---|---|---|
| One move priced two ways: moveBuddha's widget topped out at $7,814 for freight and its results page at $1,761 | Implications §2.7 (Two prices); matrix §3.2 (moveBuddha row), §5 item 10; `sites/movebuddha.md` | A public version box, and the rule that one model version feeds the calculator, its results view and the request-form prefill, checked by a test |
| Unsourced figures that disagree: Moving.com gives $5,450 and $4,890 for one 1,000-mile move, and its "Recent Estimates" block has no date or source | Matrix §3.2 (Moving.com row), §5 item 10; implications §7.2; `sites/movingcom.md` | The source order with thresholds, a dated label on every range, and the rule that request figures are called "recent request mix by route and size", never "recent estimates" |
| A range only after contact: MyGoodMovers labels its tool "Planning estimate, not a final quote", but its FAQ says the estimate appears after the form is sent | Implications §2.2 (Range bullet); matrix §3.7 (MyGoodMovers row), §5 item 1; `sites/mygoodmovers.md` | No contact details needed to see a range; answers kept out of URLs and not stored unless the reader continues |
| Mixed wording: HireAHelper's calculator says "not estimates" under an "Accurate Moving Estimate" title | `sites/hireahelper.md` (Markup and content); matrix §4 (Sourced ranges row) | One label, "Planning range, not a quote", explained part by part, plus a section on why a range isn't an estimate |
| A per-mover formula sold as a guaranteed price before anyone sees the goods: Unpakt prices from each mover's "cost per unit of stuff" | Matrix §3.8 (Unpakt row); `sites/unpakt.md` (Guarantee; Price explainer) | The per-mover formula for each move type, published, but turned into a range across movers and never presented as a price or guarantee |
| Savings claims with no method: "Save up to 30%" (moveBuddha), "Up to 50%" (Budget Van Lines), "45% … on average" (Unpakt) | Matrix §5 item 15; implications §4.5 | Stated rules: no claims that you'll pay less, no raising or lowering of figures, and payment never changes a range |
| A sample stated, but figures drift: moveBuddha's route average cites "847 real-time quotes" over 90 days, yet the route's title and meta ranges differ | `sites/movebuddha.md` (Numbers); matrix §4 (Sourced ranges row) | The basis (source and number of movers) on every label, rendered from one record |
| Missing method elements: the site reviews recommend a sourced method page (Moving.com); sample size, an as-of date and an insufficient-data state (MyGoodMovers); a dated method (HireAHelper); a formula on a versioned method page (Unpakt); and one versioned model with a consistency test (moveBuddha) | Matrix §4 (Ungated cost range row: "Method page, changelog, consistency test"); the adopt-and-adapt sections of those five site reviews | All of them on one page: formulas, the middle-half rule, thresholds with an honest no-range state (VD §3 principle 5), exclusions, version and changelog. The review covered captured pages only, so this is a gap in what was captured, not a proven absence |

## 5. Outline

- H1 How the moving cost calculator works (answer block, ST-6, page status note, byline)
- H2 Current version
- H2 What do you enter, and how is each answer used?
- H2 How is the range built?
  - H3 What a rate card holds
  - H3 Which movers count
  - H3 Local moves
  - H3 Long-distance moves
  - H3 From many results to one range
- H2 When does the calculator show no range?
- H2 Where does the data come from?
- H2 What does a range include?
- H2 How do I read the label on a range?
- H2 Why do we call it a planning range?
- H2 Can a mover pay to change a range?
- H2 How is the method updated?
- H2 What can't a planning range tell you?
- H2 What happens to the answers you enter?
- H2 Found an error?
- H2 Related pages

## 6. Must-cover checklist

| # | Must-cover item | Covered under |
|---|---|---|
| 1 | Answer first: a planning range for a household move, built from rate cards movers in the network give us; not a quote or an estimate; ST-6 | H1 answer block (57 words), then ST-6 |
| 2 | Version box with model version, dataset version, effective date and next refresh as `cost.*` tokens; one model version for widget, results view and carried values, with a test | Current version |
| 3 | Inputs: ZIP codes (distance between ZIP centers; local, in-state long distance, interstate); home size; services; move month only if seasonal data passes [Data]; nothing preselected | What do you enter, and how is each answer used? |
| 4 | How the range is built, as the v1 proposal [Data: data owner to confirm before launch]: per-mover rate cards; local and long-distance formulas; 25th to 75th percentile (middle half), rounded outward; medians for typical hours and weights | How is the range built? (all five H3s) |
| 5 | Thresholds: at least 5 distinct movers per geography and distance band; otherwise say there isn't enough data, say why, still offer the coverage check | When does the calculator show no range? |
| 6 | Data sources in order (site architecture §6.3 rule 2), with competitor figures never our data | Where does the data come from? |
| 7 | What the range includes and excludes | What does a range include? |
| 8 | Safeguards, with the rate-card onboarding [Owner] marker | Can a mover pay to change a range? |
| 9 | Updates: at least every 6 months or on a source change; a changelog entry per change; one-row changelog | How is the method updated? |
| 10 | Limitations | What can't a planning range tell you? |
| 11 | Privacy, with the tag-policy [Build] marker | What happens to the answers you enter? |
| 12 | Counsel note on range wording | Why do we call it a planning range? |
| 13 | Reporting an error; links to the calculator, How movers charge and the cost hub | Found an error?; Related pages |
| 14 | Page rule: a page status note saying the method is a proposal until data exists | Page status note under ST-6 |
| 15 | Page rule: every parameter value as a token | Throughout; see the `tokens` list in front matter. Token values must render as words that read in context (for example `cost.method.percentile_low` renders "25th") |
| 16 | Page rule: a formula block in plain notation for each move type, then words | Local moves; Long-distance moves (plus one block for the range ends) |
| 17 | Stored text ST-7 | How do I read the label on a range? |

## 7. Internal links

**Out.** No target is published yet; the publish check holds or removes links to unpublished pages (`content/README.md` §8 item 5).

| URL | Anchor text | Section | Status |
|---|---|---|---|
| `/moving-cost-calculator/` | Moving cost calculator | Related pages | Planned (Wave 1, site architecture §5.3) |
| `/moving-costs/how-movers-charge/` | How movers charge; Our guide to how movers charge; hourly and weight-based pricing | What does a range include?; Why do we call it a planning range?; What can't a planning range tell you?; Related pages | Planned |
| `/moving-costs/` | Moving costs | Related pages | Planned |
| `/advertising-disclosure/` | How AMC makes money | Can a mover pay to change a range?; Related pages | Planned |
| `/which-companies-receive-my-request/` | Which companies receive my request | What happens to the answers you enter? | Planned |
| `/editorial-policy/` | editorial policy | Found an error? | Planned |
| `/get-quotes/` | request quotes from them | When does the calculator show no range? | Planned |
| `#how-is-the-method-updated` | how the method is updated | When does the calculator show no range? | On this page |
| `https://www.fmcsa.dot.gov/protect-your-move/red-flags` | Protect Your Move | Why do we call it a planning range? | External; carries a [Verify] marker |

**In (expected).** Site architecture §3.3 rule 1 needs at least 3 contextual links from indexable pages; the first three rows meet it.

| From | Why it links here | Status |
|---|---|---|
| `/moving-cost-calculator/` | The ST-7 label link on every range, and a method link beside the tool (site architecture §1.2, §6.3 rule 5) | Planned |
| `/moving-costs/` | The gated ranges table; every number links to its source or method page (site architecture §3.2) | Planned |
| `/moving-costs/how-movers-charge/` | A one-line pointer on how planning ranges differ from estimates | Planned |
| `/moving-costs/local/`, `/moving-costs/long-distance/` | Their ranges link to the method | Planned |
| Geo, route and state-hub cost blocks | Site architecture §3.2, "Every number" row | Planned; each waits at its gate |
| `/editorial-policy/` | Its numbers-and-dates section | Planned |
| Calculator results view; the "What we found" step of `/get-quotes/` | The ST-7 label link (implications §2.2). Both are `noindex`, so they don't count toward §3.3 rule 1 | Planned |

## 8. Decision dependencies

| Statement | Depends on | Default used in the draft | What changes if decided otherwise |
|---|---|---|---|
| "A range isn't a quote or an estimate"; the label "Planning range, not a quote"; the section "Why do we call it a planning range?" | Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate"; stored-text notes on ST-1 | Ranges allowed and labeled "planning range" | The answer block, the label section and the planning-range section are reworded. If counsel rules ranges out, the calculator is withdrawn and this page says so |
| ST-6 and ST-7 wording | Counsel (site architecture §6.3 rules 3 and 5) | The drafts in `content/stored-texts.md` | The page re-renders from the records; the label-parts table changes if ST-7's fields change |
| Rate-card format; both formulas; "What a rate card holds" | Data owner (site architecture §6.3; implications §11 Q17 asks for named data owners) | The v1 proposal from the drafting task | The five H3s under "How is the range built?" and the formula blocks are rewritten |
| Percentiles and "the middle half of movers" | Data owner | 25th and 75th, as tokens | Tokens change. "The middle half of movers" is true only for 25th to 75th and must be rewritten; the answer's "the middle of the results" holds for any band centered on the median |
| Rounding unit; distance bands | Data owner | Tokens with no value yet | Tokens only, unless in-state and interstate bands differ, which the long-distance paragraph would then say |
| The area used for thresholds and for contributing movers | Data owner ([Data] marker in "Which movers count") | Undefined; the marker gives examples | The threshold and "Which movers count" copy name the area. The county sentence in the inputs section goes if the area is a state |
| Typical crew size for each home size | Data owner ([Data] marker) | Undefined. Hours and weights are medians, per the task; crew size is left open | The local formula's "typical crew size" wording |
| At least 5 movers per area | Site architecture §6.3 rule 2(a), already a rule; the owner may change it | 5, as `cost.method.min_movers` | The token changes; the meta description and the "How stable it is" bullet render the new number |
| Threshold set per move type and distance band as well as area | Data owner (v1 proposal) | Per area, move type and band | A coarser cut shows more ranges; the no-range section's wording changes |
| A corporate family counts as one mover | Owner: implications §11 Q12 and §9.5 | Yes | Delete the sentence. Related brands could then meet the threshold together |
| Rate cards required at onboarding | Owner: new question, not yet in implications §11 | Required for movers in markets with a published range | Rewrite or delete the third safeguard bullet. Note the bootstrap problem: a market has a published range only after 5 movers give rate cards (open item 3) |
| What a mover pays never changes a range; a rate card earns no placement | Owner (the implications D13 and §9.2 principle, applied to the cost model by this draft), plus the build tests | Both stated as rules | If either is not adopted, "Can a mover pay to change a range?" can't publish as written |
| Request data as a source | Counsel (site architecture §6.3 rule 7, §7.5) | Allowed for non-price facts above the thresholds, if the privacy policy permits | Source 2 is removed or narrowed, with its "recent request mix" sentence |
| A range stops showing after 12 months | Owner or data owner. Site architecture §4.3 sets the cost-data age limit; this draft applies it to the calculator | 12 months, as `cost.method.max_data_age_months` | Delete the sentences in the no-range and update sections, or change the token |
| Move month input | Data owner (v1 proposal) | Asked only where seasonal rates pass the thresholds | The move-month paragraph and the season line in the label section |
| Privacy statements | Build, and counsel on the tag policy (site architecture §8.8; implications §3.5 wiretap question) | Site architecture §8.8 covers the calculator | If it doesn't, the privacy section must say what is collected and where |
| Named people | Owner: brief §11 Q9; implications §11 Q17 | `page.*` tokens | The page can't publish without them (site architecture §7.2) |
| URL, breadcrumb, indexation | Owner: `content/README.md` §10 proposal; site architecture §2.1 | `/moving-cost-calculator/method/`; index once approved | URL, breadcrumb and inbound links change |
| Distance measure | Engineering (lead lifecycle §3) | "The distance between their centers", with a [Build] marker | The inputs paragraph names straight-line or road distance |
| Valuation and extra charges | How movers charge, which owns them, and counsel on valuation wording (implications §7.1) | Listed and linked, not explained | The exclusion wording follows that page |

## 9. Source record

Fields follow site architecture §6.2, plus the "AMC policy" source type (`content/README.md` §7). Every `intended_page` is on `/moving-cost-calculator/method/`. Rows whose only basis is the v1 proposal in the 2026-10-28 drafting task have no AMC document to cite yet (open item 1), so they stay "to verify".

| id | question_or_claim | source_url | source_type | accessed_date | intent | answer_evidence | intended_page | status | verified_by / recheck_due |
|---|---|---|---|---|---|---|---|---|---|
| SR-01 | The calculator shows a planning range for a household move, built from rate cards that movers in the network give AMC | `docs/seo/site-architecture.md` §6.3 rule 2(a); §1.2 Cost calculator row | AMC policy | 2026-10-28 | informational | Rule 2(a): "member-reported rate cards with ≥5 distinct movers per geography"; §1.2: a range estimator that shows a labeled range before any contact field | `/moving-cost-calculator/method/` (answer block) | verified | drafting agent; human check pending / 2027-04-28 |
| SR-02 | A range isn't a quote or an estimate; AMC gives no quotes or estimates | `docs/00-discovery-brief.md` §1; `docs/seo/site-architecture.md` §6.3 rule 3; `content/stored-texts.md` ST-1a | AMC policy | 2026-10-28 | informational | Brief §1: "we don't give estimates on movers' behalf"; rule 3: every cost block says AMC does not provide quotes or binding estimates. Counsel wording pending | `/moving-cost-calculator/method/` (answer block); `#why-do-we-call-it-a-planning-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-03 | ST-6 text | `content/stored-texts.md` ST-6 | AMC policy | 2026-10-28 | informational | Inserted verbatim; counsel approval pending (site architecture §6.3 rule 3) | `/moving-cost-calculator/method/` (answer block) | verified | drafting agent; human check pending / 2027-04-28 |
| SR-04 | No rate-card data exists yet, so the calculator can't show ranges | `content/README.md` §3 (`{{cost.*}}` row); `docs/seo/site-architecture.md` §11 | AMC data | 2026-10-28 | informational | README §3: `cost.*` "No data yet"; §11 lists the cost-data store as a product dependency | `/moving-cost-calculator/method/` (page status note) | verified | drafting agent; human check pending / 2027-04-28 |
| SR-05 | One model version feeds the calculator, the results view and the request-form prefill; a test fails on any difference | `docs/seo/site-architecture.md` §1.2, §6.3 rules 5 and 6; implications §2.7 | AMC policy | 2026-10-28 | informational | Rule 5: the widget, results view and survey prefill use one model version; rule 6: a calculator test fails if widget and results ranges differ. Extending the test to the prefill is this draft's reading of rule 5 | `#current-version` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-06 | The version box shows model version, dataset version, effective date and next refresh | `docs/seo/site-architecture.md` §6.3 rules 5 and 6; implications §4.5 | AMC policy | 2026-10-28 | informational | A versioned formula and changelog; every public number has an as-of date | `#current-version` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-07 | Every input starts empty; nothing is preselected; location is used only on request | implications §2.1 step 2, §2.7 (Presets) | AMC policy | 2026-10-28 | informational | "Every AMC input starts empty, and a scripted submit of defaults fails"; "location is used only on request, then confirmed" | `#what-do-you-enter-and-how-is-each-answer-used` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-08 | Distance is measured between the centers of the two ZIP codes, the same measure used for every move request | `docs/business-rules/lead-lifecycle-and-purchase-rules.md` §3 | AMC policy | 2026-10-28 | informational | "Distances come from geocoded ZIP centroids." Straight-line or road distance is not stated | `#what-do-you-enter-and-how-is-each-answer-used` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-09 | Local: same state and no more than the local radius; in-state long distance: same state and beyond it; interstate: different states | lead lifecycle §3; `content/README.md` §3 (`setting.local_radius_miles` = 50) | AMC policy | 2026-10-28 | informational | "interstate if the states differ; otherwise local up to an admin-configured distance (default 50 miles), else intrastate"; "Long-distance" means intrastate beyond the radius plus interstate | `#what-do-you-enter-and-how-is-each-answer-used` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-10 | The calculator shows the distance and move type once both ZIP codes resolve, never a zero distance before input | implications §8.1 | AMC policy | 2026-10-28 | informational | "A route summary appears once both ends resolve"; "Never show … '0 miles' before input" | `#what-do-you-enter-and-how-is-each-answer-used` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-11 | A ZIP code spanning counties uses the county with the largest share of its homes; ZIP and county data come from the Census Gazetteer files and the HUD-USPS crosswalk, refreshed quarterly | lead lifecycle §3, Geography data rules | AMC policy | 2026-10-28 | informational | "primary county (largest residential share from the HUD-USPS ZIP–county crosswalk)"; "US Census Gazetteer and county FIPS + HUD-USPS ZIP crosswalk, refreshed quarterly" | `#what-do-you-enter-and-how-is-each-answer-used` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-12 | Home size uses the same list as the request form's "Size and services" step | lead lifecycle §2 step 4; implications §2.1 step 4, §2.2 (carried values) | AMC policy | 2026-10-28 | informational | The survey asks move size, and carried values are confirmed; a shared size list is not stated anywhere | `#what-do-you-enter-and-how-is-each-answer-used` | to verify | — / before publish |
| SR-13 | Services are packing, storage and specialty items | lead lifecycle §2 step 5 | AMC policy | 2026-10-28 | informational | "Services needed (packing, storage, specialty items, etc.)" | `#what-do-you-enter-and-how-is-each-answer-used` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-14 | A mover counts only if its rate card prices every selected service and covers the move type, band and home size | lead lifecycle §3 item 2, by analogy; v1 proposal | AMC policy | 2026-10-28 | informational | Matching requires the profile to offer the move type, size and every requested service; no AMC document sets the cost-model rule | `#which-movers-count` | to verify | — / before publish |
| SR-15 | The move month is asked only where seasonal rates pass the thresholds | v1 proposal; `docs/seo/site-architecture.md` §6.3 rule 1 (season is a stated assumption) | AMC policy | 2026-10-28 | informational | No AMC document sets the rule | `#what-do-you-enter-and-how-is-each-answer-used` | to verify | — / before publish |
| SR-16 | What a rate card holds | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | No AMC document; `docs/architecture/data-model.md` has no rate-card table | `#what-a-rate-card-holds` | to verify | — / before publish |
| SR-17 | Only movers currently in the network count | `docs/seo/site-architecture.md` §2.5 (a suspended company is "not currently part of the American Moving Choice network"); v1 proposal | AMC policy | 2026-10-28 | informational | Network status is defined; applying it to the cost model is this draft's proposal | `#which-movers-count` | to verify | — / before publish |
| SR-18 | Movers under common ownership count as one | implications §9.5, §11 Q12 | AMC policy | 2026-10-28 | informational | Q12: "Does a corporate family count as one company? Yes", recommended for purchases; applying it to range thresholds is this draft's extension | `#which-movers-count` | to verify | — / before publish |
| SR-19 | Local formula: typical crew hours × hourly rate for the crew size, plus any truck or travel fee, plus selected services | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | The task text adds services only to the long-distance formula; the draft adds them to both, because services are an input for every move | `#local-moves` | to verify | — / before publish |
| SR-20 | Long-distance formula: typical weight × rate for the distance band, plus selected services, for in-state long distance and interstate alike | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | No AMC document | `#long-distance-moves` | to verify | — / before publish |
| SR-21 | Distance bands | None yet (v1 proposal; `cost.method.distance_bands` has no value) | AMC policy | 2026-10-28 | informational | Undecided | `#long-distance-moves` | to verify | — / before publish |
| SR-22 | The range runs from the 25th to the 75th percentile of contributing movers' results, the middle half | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | No AMC document. The percentile method for small samples is also undecided (open item 13) | `#from-many-results-to-one-range` | to verify | — / before publish |
| SR-23 | Range ends are rounded outward to a rounding unit | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | No AMC document; the unit is undecided | `#from-many-results-to-one-range` | to verify | — / before publish |
| SR-24 | Typical crew hours and shipment weights are the medians of what contributing movers state | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | No AMC document | `#from-many-results-to-one-range` | to verify | — / before publish |
| SR-25 | A range needs rate cards from at least 5 distinct movers per geography | `docs/seo/site-architecture.md` §6.3 rule 2(a) | AMC policy | 2026-10-28 | informational | "member-reported rate cards with ≥5 distinct movers per geography" | `#when-does-the-calculator-show-no-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-26 | The threshold also applies per move type and distance band | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | Rule 2(a) says "per geography" only | `#when-does-the-calculator-show-no-range` | to verify | — / before publish |
| SR-27 | With no range, the calculator gives the reason and still offers the coverage check; "What we found" shows a range or the count with the reason | implications §2.2 (Range bullet); `docs/seo/site-architecture.md` §6.3 rule 4; `docs/design/visual-direction.md` §3 principle 5 | AMC policy | 2026-10-28 | informational | "Otherwise show the count alone, with the reason"; "If data is insufficient, omit the block"; "Honest empty states" | `#when-does-the-calculator-show-no-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-28 | Sources in order of preference: rate cards, request data, public data, third-party studies | `docs/seo/site-architecture.md` §6.3 rule 2 | AMC policy | 2026-10-28 | informational | Rule 2(a) to (d), "in order of preference" | `#where-does-the-data-come-from` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-29 | Only rate cards set a calculator range | `docs/seo/site-architecture.md` §6.3 rule 2; v1 proposal | AMC policy | 2026-10-28 | informational | (b) is for non-price facts and (c) is context only; that cited studies (d) never set a calculator range is this draft's reading of the v1 threshold | `#where-does-the-data-come-from` | to verify | — / before publish |
| SR-30 | Request data is used for non-price facts only, with at least 30 requests per area and groups under 10 hidden | `docs/seo/site-architecture.md` §6.3 rule 2(b) | AMC policy | 2026-10-28 | informational | "AMC aggregated, consented lead data, for non-price facts only (n ≥ 30 per geography, cells under 10 suppressed)" | `#where-does-the-data-come-from` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-31 | Request data covers periods of at least 90 days, and only where the privacy policy permits aggregate use | `docs/seo/site-architecture.md` §7.5 | AMC policy | 2026-10-28 | informational | "periods of 90 days or more"; "Counsel must confirm the privacy policy permits aggregate use." Set for reports; applied here to the cost model | `#where-does-the-data-come-from` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-32 | Figures built from requests are called "recent request mix by route and size", never "recent estimates" | `docs/seo/site-architecture.md` §6.3 rule 7 | AMC policy | 2026-10-28 | informational | Rule 7, sent to counsel with the other range questions | `#where-does-the-data-come-from` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-33 | BLS wage data (SOC 53-7062) is labor-cost context only | `docs/seo/site-architecture.md` §6.3 rule 2(c) | AMC policy | 2026-10-28 | informational | "BLS OEWS metro wages for SOC 53-7062, as labor-cost context only" | `#where-does-the-data-come-from` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-34 | SOC 53-7062 covers hand laborers and material movers | `https://www.bls.gov/oes/current/oes537062.htm` (URL not opened; confirm it) | official | not accessed | informational | None yet; check before publishing | `#where-does-the-data-come-from` | to verify | — / before publish |
| SR-35 | Third-party studies need a published method and are cited; figures from other companies are never AMC's data | `docs/seo/site-architecture.md` §6.3 rule 2(d); `content/README.md` §5 (no competitor names in consumer copy) | AMC policy | 2026-10-28 | informational | "third-party studies with a published method, cited. Competitor figures appear only as cited context, never as our data" | `#where-does-the-data-come-from` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-36 | What a range includes and leaves out (valuation beyond the basic level, survey-set charges, tips, extra storage, parking permits, services not picked) | `docs/seo/site-architecture.md` §6.3 rule 1; exclusion list from the drafting task | AMC policy | 2026-10-28 | informational | Rule 1 requires included and excluded services to be stated; the list itself is in no AMC document | `#what-does-a-range-include` | to verify | — / before publish |
| SR-37 | ST-7 label text | `content/stored-texts.md` ST-7 | AMC policy | 2026-10-28 | informational | Inserted verbatim; counsel pending | `#how-do-i-read-the-label-on-a-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-38 | The label's scope gives home size, move type and distance band; its basis gives source and sample | `content/stored-texts.md` ST-7 notes | AMC policy | 2026-10-28 | informational | The notes define `cost.result.scope` and `cost.result.basis` | `#how-do-i-read-the-label-on-a-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-39 | The results view lists the assumptions; no range appears without scope, source, date and a method link | `docs/seo/site-architecture.md` §6.3 rule 1; implications §7.2, §8.3 | AMC policy | 2026-10-28 | informational | "Ranges render only with assumptions, source, date and method" | `#how-do-i-read-the-label-on-a-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-40 | FMCSA's Protect Your Move lists estimates given by phone or online, sight unseen, as a red flag | `https://www.fmcsa.dot.gov/protect-your-move/red-flags` | official | 2026-10-27 (search excerpt, per `docs/research/compliance-and-platform-facts.md` §2) | informational | Search excerpt only: red flags include estimates given by phone or online "sight unseen" without an onsite inspection | `#why-do-we-call-it-a-planning-range` | to verify | — / before publish |
| SR-41 | AMC labels every range "Planning range, not a quote" and never calls it an estimate | `content/stored-texts.md` ST-7; `content/README.md` §5 | AMC policy | 2026-10-28 | informational | ST-7 opens with the label; README §5 bans "instant estimate" and similar | `#why-do-we-call-it-a-planning-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-42 | Movers pay AMC for the requests they buy; consumers pay nothing | `docs/00-discovery-brief.md` §1; lead lifecycle §6 | AMC policy | 2026-10-28 | informational | "Consumers use the site for free. Approved movers pay American Moving Choice for the move requests they choose to buy" | `#can-a-mover-pay-to-change-a-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-43 | What a mover pays never changes a range | implications D13, §9.2; applied to the cost model by this draft | AMC policy | 2026-10-28 | informational | D13 and §9.2 keep payment out of order and editorial outcomes; neither names the cost model | `#can-a-mover-pay-to-change-a-range` | to verify | — / before publish |
| SR-44 | A rate card earns a mover no placement in the directory, on location pages or in the pre-send list | implications §9.2 | AMC policy | 2026-10-28 | informational | Order uses only published inputs; rate cards are not mentioned | `#can-a-mover-pay-to-change-a-range` | to verify | — / before publish |
| SR-45 | Movers in markets with ranges give a rate card when they join | None (new owner question; default from the drafting task) | AMC policy | 2026-10-28 | informational | Owner decision pending | `#can-a-mover-pay-to-change-a-range` | to verify | — / before publish |
| SR-46 | AMC doesn't raise or lower movers' figures, apart from rounding the range outward | None yet (v1 proposal) | AMC policy | 2026-10-28 | informational | No AMC document | `#can-a-mover-pay-to-change-a-range` | to verify | — / before publish |
| SR-47 | No claims that you'll pay less; movers set their own prices | `docs/seo/site-architecture.md` §6.3 rules 3 and 6; implications §4.5, §7.2 | AMC policy | 2026-10-28 | informational | Rule 6: "Make no savings … claims"; rule 3: movers set their own prices | `#can-a-mover-pay-to-change-a-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-48 | Ranges only, never a single price | `docs/seo/site-architecture.md` §6.3 rule 1 | AMC policy | 2026-10-28 | informational | "Publish ranges, never point prices" | `#can-a-mover-pay-to-change-a-range` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-49 | Ranges are rebuilt at least every 6 months, or sooner when a source changes | `docs/seo/site-architecture.md` §6.3 rule 4 | AMC policy | 2026-10-28 | informational | "Refresh every 6 months or when a source updates" | `#how-is-the-method-updated` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-50 | A range stops showing when its data is more than 12 months old | `docs/seo/site-architecture.md` §4.3; applied to the calculator by this draft | AMC policy | 2026-10-28 | informational | "Cost data must be at most 12 months old, with the source date shown", set among the programmatic guardrails | `#how-is-the-method-updated` | to verify | — / before publish |
| SR-51 | Every change gets a new version and a dated changelog entry | `docs/seo/site-architecture.md` §6.3 rule 5 | AMC policy | 2026-10-28 | informational | "a versioned formula, a public method page and a changelog" | `#how-is-the-method-updated` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-52 | Changelog v0: draft method; no data; not live | `content/README.md` §3; this draft | AMC data | 2026-10-28 | informational | `cost.*` "No data yet"; the calculator is not built | `#how-is-the-method-updated` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-53 | A range can rest on as few as 5 movers | `docs/seo/site-architecture.md` §6.3 rule 2(a) | AMC policy | 2026-10-28 | informational | Follows from the threshold | `#what-cant-a-planning-range-tell-you` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-54 | Prices vary within an area; belongings and access can change the price; a mover may price differently from the model | Drafting task (limitations); `docs/seo/site-architecture.md` §6.3 rule 1 | AMC policy | 2026-10-28 | informational | Editorial limitation statements, not data claims | `#what-cant-a-planning-range-tell-you` | to review | — / before publish |
| SR-55 | Ranges don't use the quotes movers send or what consumers pay | `docs/seo/site-architecture.md` §6.3 rule 2; implications §9.7 | AMC policy | 2026-10-28 | informational | The allowed sources exclude quotes and payments; CRM outcomes "never [feed] matching, order, price or badges" | `#what-cant-a-planning-range-tell-you` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-56 | No contact details are needed to see a range | `docs/seo/site-architecture.md` §1.2; `docs/product/mvp-scope.md` S6; `docs/product/backlog.md` 7.7 | AMC policy | 2026-10-28 | informational | "shows a labeled range before any contact field"; "Ungated cost estimator"; "no contact details are required" | `#what-happens-to-the-answers-you-enter` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-57 | Answers never go into URLs and aren't sent to analytics | `docs/seo/site-architecture.md` §8.8 | AMC policy | 2026-10-28 | informational | §8.8 covers quote pages and survey entry modules; whether it covers the calculator is open | `#what-happens-to-the-answers-you-enter` | to verify | — / before publish |
| SR-58 | Answers aren't stored unless you continue; the form shows them for confirmation and keeps progress | lead lifecycle §1 (`survey_in_progress`); implications §2.2 (carried values) | AMC policy | 2026-10-28 | informational | "Progress is kept in session storage plus a server draft keyed by an anonymous ID"; "Carried values … are confirmed, never silently accepted". The calculator's own storage is not specified | `#what-happens-to-the-answers-you-enter` | to verify | — / before publish |
| SR-59 | Calculator results are never indexed | `docs/seo/site-architecture.md` §1.2, §8.3 | AMC policy | 2026-10-28 | informational | "results never indexable (no parameter URLs)"; tool results are `noindex` | `#what-happens-to-the-answers-you-enter` | verified | drafting agent; human check pending / 2027-04-28 |
| SR-60 | Errors go to the editorial contact; the editorial policy covers corrections | `content/README.md` §3 (`org.editorial_email`), §9 | AMC policy | 2026-10-28 | informational | The editorial policy owns corrections | `#found-an-error` | verified | drafting agent; human check pending / 2027-04-28 |

## 10. Open items

1. **Record the method in a repository document.** The rate-card format, both formulas, the percentiles, rounding, medians and seasonal rule exist only as the v1 proposal in the drafting task. A cost-model spec, or an addition to site architecture §6.3, would let the source record cite them (SR-14 to SR-24, SR-26, SR-29, SR-36, SR-46). The data owner confirms each value before launch.
2. **Facts-registry entries for every `cost.method.*` token,** each with a definition, owner and as-of date (site architecture §6.3 rule 6). Values must read in context: the percentile tokens render "25th" and "75th"; the rounding unit renders with its currency sign; the distance bands render as a list.
3. **The onboarding default is circular.** "Required for movers in markets with a published range" means no market can reach 5 rate cards through the requirement alone. The owner should say how the first cards are collected, or set the requirement by market launch instead.
4. **Define the "area"** used for thresholds and contributing movers for each move type, and the typical crew size for each home size.
5. **Distance measure and ZIP centers.** Lead lifecycle §3 says only "geocoded ZIP centroids", and its geography rules use ZCTAs only for maps and area statistics. Engineering should name the centroid source and say whether the distance is straight-line or by road.
6. **ST-7 scope versus site architecture §6.3 rule 1.** ST-7's scope names home size, move type and distance band; rule 1 also wants included and excluded services and season stated. The draft puts these in the results view. If counsel wants them in the label, propose an ST-7 variant in `content/stored-texts.md` rather than editing the text.
7. **ST-7 on this page.** The label renders as a specimen with each part named, and its "How this range is calculated" link should point to `#how-is-the-range-built`, not back to the page top. Both need build support.
8. **"AMC never sees bookings" conflicts with the CRM.** Site architecture §6.3 rule 6 and implications §4.5 say AMC never sees bookings, yet the free CRM records mover-entered "Booked" and "Completed" stages (mvp-scope §5; mover verification §6, as cited in implications §4.4) and a deal value (`crm_records.estimated_value_cents`, data model). The page avoids the claim and says only that ranges don't use quotes or payments. The owner should reconcile the documents.
9. **Tag policy scope.** Site architecture §8.8 names quote pages and survey entry modules, not the calculator. Confirm it covers the calculator and its results view. Route pages link to the calculator "with prefilled parameters" (site architecture §3.2); those parameters must carry only the page's route, never a visitor's answers.
10. **Add the method page to site architecture §2.1 and §1.2,** with its indexation rule (`content/README.md` §10).
11. **Counsel items:** range wording (compliance facts §2); ST-6 and ST-7 approval; aggregate use of request data and the "recent request mix" block (site architecture §6.3 rule 7, §7.5).
12. **Verify before publishing:** the FMCSA red-flag wording (SR-40) and the BLS occupation title and URL for SOC 53-7062 (SR-34).
13. **Percentile method for small samples.** With 5 movers, the interpolation method decides which results set the ends. The data owner should fix it in the spec.
14. **Build tests to write:** widget, results and prefill agree; a scripted submit of defaults fails; ranges don't change when a mover's spending changes; rate-card status changes no list order; no distance shows before both ZIP codes resolve; no raw tokens render.
15. **Named author, reviewer and data owner** (brief §11 Q9; implications §11 Q17).
16. **Twelve-month age limit.** The draft applies site architecture §4.3's cost-data limit to the calculator. Confirm, or drop the two sentences.
17. **Schema choice.** The draft uses `WebPage` and `BreadcrumbList`, treating the page as a method page. If editorial treats it as a cost guide, site architecture §8.5 points to `Article` with an author `Person`.
18. **Changelog date.** `cost.changelog.v0.date` needs its registry value: the date the v0 draft method is recorded.
