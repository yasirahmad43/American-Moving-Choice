---
id: costs-calculator-method
url: /moving-cost-calculator/method/
family: Cost calculator
title: "How the Moving Cost Calculator Works | American Moving Choice"
meta_description: "How we turn rate cards from at least {{cost.method.min_movers}} movers into a planning range, not a quote: inputs, formulas, data sources, thresholds and versions."
h1: "How the moving cost calculator works"
breadcrumb: "Home › Moving cost calculator › How the calculator works"
indexation: index once approved
schema: [WebPage, BreadcrumbList]
primary_queries: []
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: "{{page.data_owner}}"
ai_assisted: true
stored_texts: [ST-6, ST-7]
tokens: [setting.local_radius_miles, cost.model.version, cost.dataset.version, cost.model.effective_date, cost.dataset.next_refresh, cost.method.min_movers, cost.method.percentile_low, cost.method.percentile_high, cost.method.middle_share, cost.method.rounding_unit_local, cost.method.rounding_unit_long_distance, cost.method.distance_bands, cost.method.storage_assumption, cost.method.specialty_items, cost.method.request_min_n, cost.method.request_min_days, cost.method.request_suppress_below, cost.method.refresh_months, cost.method.max_data_age_months, cost.changelog.v0.date, cost.result.range, cost.result.scope, cost.result.basis, cost.result.as_of, org.editorial_email, page.author, page.reviewer, page.data_owner]
depends_on:
  - "Counsel: range wording, including whether ranges or calculators count as providing an estimate; covers the answer block, the meta description and the planning-range section (compliance facts §2; stored-text notes on ST-1, ST-6 and ST-7)"
  - "Counsel: approve ST-6 and ST-7 (site architecture §6.3 rules 3 and 5)"
  - "Counsel: the consent basis and privacy-policy coverage for aggregate use of request data, and the 'recent request mix' block (site architecture §6.3 rule 7, §7.5, §11)"
  - "Counsel and build: whether the tag policy covers the calculator and its results view, for the privacy statements (site architecture §8.8)"
  - "Data owner: confirm the v1 method before launch: rate-card format, both formulas (including short interstate moves and distance within the local radius), which movers count (including the every-service rule), the storage period and the specialty-item list, how typical hours, weights and crew sizes are set, percentiles, rounding units, distance bands, the area used for thresholds, the seasonal rule, the definition of the 'data as of' date and the role of each data source (site architecture §6.3; build plan §7.3 gives the v1 defaults the page shows, see brief §8)"
  - "Owner: whether rate-card submission is required at onboarding; default shown: required for movers in markets with a published range (new question)"
  - "Owner: extend implications §11 Q12 (one purchase per corporate family) to range counting; default shown: yes"
  - "Owner: apply site architecture §4.3's 12-month cost-data limit to the calculator, rate card by rate card; default shown: yes (new question)"
  - "Owner: apply site architecture §7.5's 90-day period to request data in the cost model; default shown: yes (new question)"
  - "Owner and engineering: the production ZIP dataset and distance measure (lead lifecycle §3 and build plan §7.1 differ)"
  - "Owner: the URL and breadcrumb (content/README.md §10; site architecture §2.1)"
  - "Owner or editorial: the schema type, WebPage or Article (brief open item 17; site architecture §8.5)"
  - "Owner: name the author, the reviewer and the data owner (brief §11 Q9; implications §11 Q17)"
  - "Owner: the review note's AI line and the author's 'Edited by' label; default shown: the editorial policy's defaults (content/pages/trust/editorial-policy.md, 'How we tell you')"
  - "Owner: whether and how a route page hands its route to the calculator (site architecture §3.2 vs §1.2, §8.8; calculator brief §10 item 11)"
  - "Owner: the calculator runs the coverage check after every result; default shown (implications §2.2; backlog 4.1.6; build plan §7.3)"
  - "Owner and counsel: a planning range from the cost model at What we found, when data allows; default shown (implications §2.2; build plan §7.2 lists only the count and names; consumer-moving-rules note, counsel item 1; compliance facts §2). If declined, the What we found sentences in 'When does the calculator show no range?' and 'How do I read the label on a range?' go, as on Which companies receive my request"
last_updated: null
---

# How the moving cost calculator works

The moving cost calculator on American Moving Choice shows a planning range for a household move, wherever enough movers in our network give us rate cards that cover it. We apply each mover's own rates to a typical move like yours and show the middle of the results. A range isn't a quote or an estimate.

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

**Page status: a proposed method, with no data yet.** This page describes the method we propose for the calculator's first live version. We don't have any rate-card data yet, so the calculator can't show ranges. This method, including values such as how many movers a range needs, stays a proposal until rate-card data exists. When the first ranges pass the thresholds below, we'll replace this note and record the change in the changelog. [Build: the CMS shows this note until the first dataset passes the thresholds (site architecture §6.3 rules 4 and 5); its removal gets a changelog entry]

Edited by {{page.author}} · Reviewed by {{page.reviewer}} · Data owner: {{page.data_owner}} · First drafted with AI

[Build: this review note renders from the page record, as the editorial policy specifies: the author's "Edited by" label and the AI line appear because AI drafted this page (`ai_assisted: true`). Show the published and last-updated dates from the CMS record beside it, and mark up the reviewer as `WebPage.reviewedBy` (content/pages/trust/editorial-policy.md, "How we tell you"; content/README.md §2; site architecture §7.3, §8.5)] [Owner: the AI disclosure form and the author's label on an AI-drafted page — default shown: a review-note AI line and "Edited by", as the editorial policy drafts them (new questions; editorial policy, "How we tell you")]

## Current version

| Version detail | Value |
|---|---|
| Model version | {{cost.model.version}} |
| Dataset version | {{cost.dataset.version}} |
| Effective date | {{cost.model.effective_date}} |
| Next scheduled refresh | {{cost.dataset.next_refresh}} |

[Build: while cost-model-v1 is a proposal, the Dataset version row reads "No data yet" and the Effective date and Next scheduled refresh rows read "Not live yet", never raw tokens (site architecture §4.1 G10; brief open item 2)]

One model version feeds the calculator wherever it appears on our site, its results view and the answers we carry into our quote survey. An automated test sends the same answers to all three and fails if they disagree, so the same answers get the same range everywhere. [Build: one model version for the calculator, the results view and the quote-survey prefill; a CI test fails on any difference in ranges or carried values (site architecture §6.3 rules 5 and 6; implications §2.7)]

## What do you enter, and how is each answer used?

Every answer starts empty. We don't preselect a home size or any services, and we never fill in a ZIP code from your location. [Build: every input starts empty; a scripted submit of defaults fails (implications §2.7); location never fills in an answer. If the owner adds a "use my location" control later, its strings go on the calculator page in the same edit] [Owner: whether and how a route page hands its route to the calculator, since route pages name states and the calculator takes ZIP codes (site architecture §3.2 vs §1.2, §8.8; calculator brief §10 item 11). If adopted, both calculator pages add the same sentence in one edit]

**Where you're moving from and to.** You enter two ZIP codes, and we measure the straight-line distance between their centers, using GeoNames postal code data. We use the same ZIP code data and distance measure as our quote survey, so the calculator and the survey agree on your move type. [Owner: confirm the production ZIP dataset. The build uses GeoNames postal data (CC BY 4.0, via the zipcodes-us package; build plan §7.1); lead lifecycle §3 named the US Census Gazetteer files and the HUD-USPS ZIP crosswalk] The two states and the distance set the move type:

| Move type | When it applies |
|---|---|
| Local | Both ZIP codes are in the same state and no more than {{setting.local_radius_miles}} miles apart |
| In-state long distance | Both ZIP codes are in the same state and more than {{setting.local_radius_miles}} miles apart |
| Interstate | The ZIP codes are in different states, whatever the distance |

[Counsel: how to label local, in-state long-distance and interstate moves so readers don't infer which rules apply (consumer-moving-rules note, counsel item 6)]

For a long-distance move, the distance also sets the distance band. Once you've entered both ZIP codes, the calculator shows the distance and move type it will use, so you can check them. [Build: show the distance only after both ZIP codes resolve, never a zero distance before input (implications §8.1)]

**Home size.** You choose your home's size: a studio, or a home with 1, 2, 3, or 4 or more bedrooms. It sets the typical job the range describes: the crew size and crew hours for a local move, or the shipment weight for a long-distance move. Office moves and moves of only a few items get no range in this version, because rate cards don't price them. [Build: these five sizes match the household sizes in the "Size and services" step of the quote survey; the survey's office and partial-move options show the no-range state with this reason]

**Services.** You can add packing, storage and specialty items. Each mover's prices for the services you pick go into that mover's result, and a mover counts toward your range only if its rate card prices every service you pick. Storage is priced for {{cost.method.storage_assumption}}, and "specialty items" means {{cost.method.specialty_items}}.

**Move month.** This version doesn't ask for a month. Every range uses each mover's standard rates, and the range's list of assumptions says so. A later version may ask for a month where enough movers give seasonal rates to pass the same thresholds as the range itself. [Data: add seasonal rates only where they pass the site architecture §6.3 thresholds]

<a id="how-is-the-range-built"></a>

## How is the range built?

[Data: v1 proposal; the defaults below match build plan §7.3, and the data owner confirms them before launch: the rate-card format; both formulas (every interstate move uses the long-distance formula, however short; local ranges don't change with distance); which movers count, including the every-service rule; the storage period and the specialty-item definition; how typical hours, weights and crew sizes are set; the percentiles; the rounding units; and the distance bands]

Each range comes from rate cards: what movers in our network tell us they charge. We apply each mover's stated rates to the same typical job, then take the middle of the results.

### What a rate card holds

Under the proposed format, a mover's rate card lists:

- its hourly rate for each crew size it sends;
- any truck or travel fee it charges on local moves;
- its rate for each distance band on long-distance moves;
- its prices for packing, storage and specialty items;
- the crew size, crew hours and shipment weight it expects for each home size.

<a id="which-movers-count"></a>

### Which movers count

A mover's rate card goes into your range only if the mover is currently in our network, its rate card covers the state you're moving from, and it has rates for your move type, distance band, home size and every service you pick. We call these movers the contributing movers. A range needs at least {{cost.method.min_movers}} of them. Movers under common ownership count as one. [Build: rate cards count only while the mover's account is active: approved and not suspended] [Data: the area is the origin state for every move type in v1 (build plan §7.3); a later version may narrow it to counties for local moves] [Owner: extend implications §11 Q12 (one purchase per corporate family) to range counting — default shown: yes; the data owner says which brand's rate card counts] [Build: counting a corporate family as one mover needs family data (implications §9.5); until it exists, each company counts separately, so this sentence waits for that data]

Under our proposed rules, movers who serve a market where the calculator shows ranges give us a rate card when they join. [Owner: whether rate-card submission is required at onboarding — default shown: required for movers in markets with a published range (new question; not in implications §11)]

### Local moves

```
Result for one mover =
    typical crew hours for your home size
      × that mover's hourly rate for the typical crew size
  + that mover's truck or travel fee, if it charges one
  + that mover's prices for the services you pick
```

In words: we take the crew size and crew hours that are typical for your home size, and multiply the hours by the mover's hourly rate for that crew size. Then we add the mover's truck or travel fee, if it charges one, and its prices for any services you pick.

### Long-distance moves

```
Result for one mover =
    typical shipment weight for your home size
      × that mover's rate for your distance band
  + that mover's prices for the services you pick
```

In words: we take the shipment weight that's typical for your home size and multiply it by the mover's rate for your distance band. Then we add the mover's prices for any services you pick. This applies to in-state long-distance and interstate moves alike. The proposed distance bands are {{cost.method.distance_bands}}.

### From many results to one range

```
Low end  = lower percentile of the contributing movers' results, rounded down
High end = upper percentile of the contributing movers' results, rounded up
```

We line up the contributing movers' results from lowest to highest. The range runs from the {{cost.method.percentile_low}} percentile to the {{cost.method.percentile_high}} percentile of those results: the middle {{cost.method.middle_share}} of movers. A percentile marks the share of results that fall below a point. For example, half the results fall below the 50th percentile, the median. Results at either end fall outside the range, so one unusually high or low rate card has little effect on it.

We round the low end down and the high end up, to whole multiples of {{cost.method.rounding_unit_local}} for a local move or {{cost.method.rounding_unit_long_distance}} for a long-distance move. That way, rounding never makes the range narrower than the span from the {{cost.method.percentile_low}} to the {{cost.method.percentile_high}} percentile.

The typical crew size, crew hours and shipment weight for each home size are the medians of what movers state on their rate cards: half state more and half state less. We take these medians across every mover whose rate card covers your area, move type and home size, whatever services you pick, so adding a service never changes the typical job. Because every mover's rates are applied to the same typical job, the range shows how movers' rates differ, not how each mover sizes a job. We find each percentile by linear interpolation between the two nearest results. [Data: the crew-size median rounds to a whole crew size the mover's card prices; confirm with the rate-card format]

We don't raise or lower any mover's figures; rounding the range outward is the only change we make. The calculator shows ranges only, never one figure, and we never claim you'll pay less by using us: movers, not American Moving Choice, set prices.

## When does the calculator show no range?

A range shows only when at least {{cost.method.min_movers}} contributing movers price your move (see [Which movers count](#which-movers-count)). With fewer, the calculator shows no range, because a range resting on too few movers could mislead you. A range also stops showing when too few of its rate cards are recent enough; see [how the method is updated](#how-is-the-method-updated).

When there's no range, the calculator says it doesn't have enough data for this move yet and names the cause: for example, too few movers' rate cards cover your area, move type and home size, or too few movers price a service you picked, which you can remove to see a range. The calculator still tells you how many movers in our network serve your move. [Owner: the calculator runs the coverage check after every result — default shown, as on the calculator page (implications §2.2; backlog 4.1.6; build plan §7.3 says "offered")] [Owner: names or a count before contact (implications §11 Q1); matches the calculator's cta.button] If any do, you can [request quotes from them](/get-quotes/); if none does, the calculator tells you so.

The "What we found" step of the quote survey follows the same rule. It always shows how many movers serve your move, and adds a range from this model, with the same label, when the data allows. Otherwise it says why there's no range. [Owner: a planning range at What we found — default shown (implications §2.2); build plan §7.2 lists only the count and names. If declined, this paragraph keeps only the count and the mentions of What we found under "How do I read the label on a range?" go] [Counsel: a planning range inside the request flow, before contact details (consumer-moving-rules note, counsel item 1; compliance facts §2)] [Build: the no-range state names its cause, such as too few rate cards for the area and move or too few that price a picked service, and still offers the coverage check; with no coverage it says no mover serves the move and offers no request (lead lifecycle §2 coverage pre-check); the "What we found" step uses the same model and thresholds (implications §2.2)]

## Where does the data come from?

We use these sources in this order of preference. Only the first one sets a calculator range. [Data: the role of each source; site architecture §6.3 rule 2(d) also allows cited studies as a range source, so limiting calculator ranges to rate cards is this draft's proposal]

1. **Rate cards from movers in our network.** The source of every calculator range, including the typical hours and weights. A range needs at least {{cost.method.min_movers}} contributing movers (see [Which movers count](#which-movers-count)).
2. **Totals from consented move requests sent through our site**, combined so no single request shows. Only for facts that aren't prices, and never for prices. We use them only with at least {{cost.method.request_min_n}} requests per area over at least {{cost.method.request_min_days}} days, and we hide any group of fewer than {{cost.method.request_suppress_below}} requests. If we show figures built from requests, we call them "recent request mix by route and size", never "recent estimates". [Owner: apply site architecture §7.5's 90-day period to request data in the cost model — default shown (new question)] [Counsel: confirm the consent basis for aggregate use of request data and that the privacy policy permits it, and review the "recent request mix" block (site architecture §6.3 rule 7, §7.5, §11)]
3. **Public data**, such as Bureau of Labor Statistics wage data for the occupation "Laborers and Freight, Stock, and Material Movers, Hand" (SOC 53-7062). We use it only as context on labor costs. It never sets or changes a range. [Verify: confirm the occupation title against the BLS occupational profile and link it before publishing; docs/research/content-claims/consumer-moving-rules.md C20 gives this title]
4. **Third-party studies that publish their method**, cited by name and date, but never figures from other moving-request or review sites. They give context and never set a calculator range. [Owner: README §5 bars naming competitors in consumer copy, while site architecture §6.3 rule 2 allows competitor figures as cited context — default shown, as in the editorial policy ("Where our facts come from")]

Figures published by other companies are never treated as our data.

<a id="what-does-a-range-include"></a>

## What does a range include?

A range includes these, as each contributing mover's rate card prices them:

- the crew's time on a local move, or the shipment's weight and distance on a long-distance move;
- a truck or travel fee on a local move, where the mover charges one;
- the services you pick: packing, storage for {{cost.method.storage_assumption}}, and specialty items ({{cost.method.specialty_items}}).

A range leaves out:

- charges for valuation coverage;
- charges a mover sets after surveying your home, such as for stairs, long carries or a shuttle;
- tips;
- storage beyond {{cost.method.storage_assumption}};
- specialty items other than {{cost.method.specialty_items}};
- parking permits;
- any service you don't pick.

[How movers charge](/moving-costs/how-movers-charge/) explains valuation and these extra charges.

## How are the ranges on Moving costs built?

They use this model and its exclusions. Each row names its area, the distance band for a long-distance row, and whether the range includes a minimum charge.

[Data: the data owner defines each row's area (for example several named states, at least {{cost.method.min_movers}} movers in each, never labeled national), band and unit before the Moving costs table publishes (moving costs brief §10 items 2–3)]

## How do I read the label on a range?

Every range from this model carries this label, wherever it appears: in the calculator, in its results view and, if a range is adopted there, in the "What we found" step of the quote survey (see the [Owner] marker under "When does the calculator show no range?").

<!-- ST-7 -->
> **Planning range, not a quote:** {{cost.result.range}} for {{cost.result.scope}}. Based on {{cost.result.basis}}; data as of {{cost.result.as_of}}; model {{cost.model.version}}. [How this range is calculated]

[Build: on this page the label renders as a specimen with each part named, using placeholders such as [low] to [high] and never sample figures or raw tokens (site architecture §4.1 G10; content/README.md §5), and its link points to "How is the range built?" above]

| Part of the label | What it tells you |
|---|---|
| The range | The low and high ends, built as this page describes |
| "for …" | The home size, move type and distance band the range covers |
| "Based on …" | The source of the range and how many movers' rate cards it uses |
| "data as of …" | The date of the oldest rate card behind the range, so every rate card in it is at least that recent |
| "model …" | The model version, the same one shown in the Current version table on this page |

Wherever a range appears, it also lists the services and season it assumes and what it leaves out. A range never appears without them, or without its scope, source, date and a link to this page. [Build: the calculator, its results view and, if adopted, the "What we found" step show the site architecture §6.3 rule 1 assumptions beside the label (implications §8.3, §2.2)]

## Why do we call it a planning range?

An estimate comes from a mover, for your move. [Our guide to how movers charge](/moving-costs/how-movers-charge/) explains the kinds of estimates movers give. A planning range comes from many movers' rate cards, for a typical move like yours, and it doesn't reflect your belongings or your home.

[Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate". The stored-text notes on ST-1 also ask whether ST-1a's "don't … give estimates" holds with the calculator live and whether "planning range" is the right label. Counsel words or approves the answer block, the meta description, "How is the range built?", this section, ST-6 and ST-7. The same review covers site architecture §8.2's calculator title, "Moving Cost Calculator: Estimate Your Moving Cost Range", and the tool's "estimator" wording (site architecture §1.2; MVP scope S6).]

<a id="can-a-mover-pay-to-change-a-range"></a>

## Can a mover pay to change a range?

No. Our income comes from movers, who pay us for the requests they buy ([How AMC makes money](/advertising-disclosure/) has the details). What movers spend with us never goes into the cost model.

- **How much a mover buys or spends never changes a range.** As in our directory and on our location pages, only movers with active accounts count, so a suspended mover's rate card drops out until the mover is reinstated. [Build: the cost model reads no purchase, spend, balance, budget or plan data, and account status is its only account input; a fixture test shows ranges don't change when a mover's spending does (implications §9.2)]
- **Giving us a rate card earns a mover no placement.** It doesn't change where the mover appears in our directory, on our location pages or in the list of movers you see before you send a request. [Build: rate-card status is not an input to any order; under the onboarding default it affects only whether a mover can join (implications §9.2)]

<a id="how-is-the-method-updated"></a>

## How is the method updated?

We rebuild the ranges from the latest rate cards at least every {{cost.method.refresh_months}} months, and sooner when a source changes: for example, when a mover updates its rate card, or joins or leaves our network. A rate card more than {{cost.method.max_data_age_months}} months old stops counting toward any range until the mover updates it. If that leaves too few contributing movers, the range stops showing. [Owner: apply site architecture §4.3's 12-month cost-data limit to the calculator, rate card by rate card — default shown (new question)]

Every change to the method or its values gets a new model version, and every rebuild of the data gets a new dataset version. Each new version gets a dated entry in this changelog. [Build: version each dataset rebuild, log it in the changelog, and rebuild at least every {{cost.method.refresh_months}} months and whenever a rate card changes (not in build plan §7.3, which computes from active rate cards)]

| Date | Change |
|---|---|
| {{cost.changelog.v0.date}} | cost-model-v1 proposed as a draft method; no data; not live |

## What can't a planning range tell you?

- **What you'll pay.** A range isn't a price, and a mover's price for your move can fall outside it. Only a mover can price your move, in a written estimate made after surveying what you're moving. Some estimates can still change; [How movers charge](/moving-costs/how-movers-charge/) explains which. [Verify: non-binding estimates (49 CFR 375.401(b)(2), 375.405, 375.407); compliance facts §2 and docs/research/content-claims/consumer-moving-rules.md C3, C5 and C6 rest on search excerpts]
- **How stable it is.** A range can rest on as few as {{cost.method.min_movers}} movers, so one mover joining, leaving or changing its rates can shift it.
- **What your street costs.** Prices vary within an area, and a range covers the area, not your street or building.
- **What your belongings and access add.** How much you're moving, stairs, elevators, parking and the walk from your door to the truck can all change the price.
- **What distance adds to a local move.** A local range doesn't change with distance within {{setting.local_radius_miles}} miles. It uses the same typical job, plus any truck or travel fee, however far you're moving.
- **How a mover will price your move.** A mover may price it differently from the model. See [hourly and weight-based pricing](/moving-costs/how-movers-charge/) in How movers charge.
- **What movers actually charge.** Rate cards are what movers tell us they charge. Ranges don't use the quotes movers send you or what you end up paying.

The Federal Motor Carrier Safety Administration (FMCSA) lists estimates given by phone or online, sight unseen, among the red flags on its [Protect Your Move](https://www.fmcsa.dot.gov/protect-your-move/red-flags) site, so ask movers for a written estimate after a survey. [Verify: confirm this against the FMCSA page; compliance facts §2 and docs/research/content-claims/consumer-moving-rules.md C14 rest on search excerpts]

## What happens to the answers you enter?

- You don't need to give any contact details to see a range.
- Your ZIP codes, home size and other answers never go into the page's web address, and we don't send them to analytics tools.
- We use your answers only to work out the range and how many movers in our network serve your move. We don't store them unless you continue to the quote survey. There, the survey shows your answers for you to confirm or change, and keeps your progress as you go.
- Calculator results are never indexed by search engines.

If you continue, [Which companies receive my request](/which-companies-receive-my-request/) explains who can receive your details.

[Build: verify each statement against the tag policy (site architecture §8.8), which names quote pages and survey entry modules; confirm it covers the calculator and its results view. If the owner adopts route handover (see the [Owner] marker under "What do you enter"), links from route pages carry only that page's route, never a visitor's answers (site architecture §3.2)]

## Found an error?

If a range, or anything on this page, looks wrong, email {{org.editorial_email}}. Tell us the ZIP codes, home size and services you entered, and the model version and "data as of" date on the label. Our [editorial policy](/editorial-policy/) explains how we handle corrections, and any fix to the method or data appears in the changelog above.

## Related pages

- [Moving cost calculator](/moving-cost-calculator/): see a planning range for your move.
- [How movers charge](/moving-costs/how-movers-charge/): hourly and weight-based pricing, estimate types, valuation and extra charges.
- [Moving costs](/moving-costs/): what affects the cost of a move, with ranges where the data allows.
- [How AMC makes money](/advertising-disclosure/): who pays us, and what payment never changes.
