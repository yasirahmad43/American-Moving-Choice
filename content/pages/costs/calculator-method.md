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
tokens: [setting.local_radius_miles, cost.model.version, cost.dataset.version, cost.model.effective_date, cost.dataset.next_refresh, cost.method.min_movers, cost.method.percentile_low, cost.method.percentile_high, cost.method.rounding_unit, cost.method.distance_bands, cost.method.request_min_n, cost.method.request_min_days, cost.method.request_suppress_below, cost.method.refresh_months, cost.method.max_data_age_months, cost.changelog.v0.date, cost.result.range, cost.result.scope, cost.result.basis, cost.result.as_of, org.editorial_email, page.author, page.reviewer, page.data_owner]
depends_on:
  - "Counsel: range wording, including whether ranges or calculators count as providing an estimate (compliance facts §2; stored-text notes on ST-1, ST-6 and ST-7)"
  - "Counsel: approve ST-6 and ST-7 (site architecture §6.3 rules 3 and 5)"
  - "Counsel: aggregate use of request data and the 'recent request mix' block (site architecture §6.3 rule 7, §7.5)"
  - "Data owner: confirm the v1 method before launch: rate-card format, formulas, percentiles, rounding unit, distance bands, the area used for thresholds, the crew-size rule and the seasonal rule (site architecture §6.3)"
  - "Owner: whether rate-card submission is required at onboarding; default shown: required for movers in markets with a published range (new question)"
  - "Owner: whether a corporate family counts as one mover; default shown: yes (implications §11 Q12)"
  - "Owner: name the author, the reviewer and the data owner (brief §11 Q9; implications §11 Q17)"
last_updated: null
---

# How the moving cost calculator works

The moving cost calculator on American Moving Choice shows a planning range for a household move. We build each range from rate cards that movers in our network give us: we apply each mover's own rates to a typical move like yours and show the middle of the results. A range isn't a quote or an estimate.

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

**Page status: a proposed method, with no data yet.** This page describes the method we propose for the calculator's first live version. We don't have any rate-card data yet, so the calculator can't show ranges. The values on this page, such as how many movers a range needs, are proposals that our data owner will confirm before launch. When the first ranges pass the thresholds below, we'll replace this note and record the change in the changelog. [Data: replace this note when the first dataset passes the thresholds (site architecture §6.3 rules 4 and 5)]

Written by {{page.author}} · Reviewed by {{page.reviewer}} · Data owner: {{page.data_owner}}

## Current version

| Version detail | Value |
|---|---|
| Model version | {{cost.model.version}} |
| Dataset version | {{cost.dataset.version}} |
| Effective date | {{cost.model.effective_date}} |
| Next scheduled refresh | {{cost.dataset.next_refresh}} |

One model version feeds the calculator wherever it appears on our site, its results view and the answers we carry into the request form. An automated test sends the same answers to all three and fails if they disagree, so the same answers get the same range everywhere. [Build: one model version for the calculator, the results view and the request-form prefill; a CI test fails on any difference in ranges or carried values (site architecture §6.3 rules 5 and 6; implications §2.7)]

## What do you enter, and how is each answer used?

Every answer starts empty. We don't preselect a home size or any services, and we don't fill in a ZIP code from your location unless you ask us to. [Build: every input starts empty and a scripted submit of defaults fails (implications §2.7); location is used only on request, then confirmed (implications §2.1)]

**Where you're moving from and to.** You enter two ZIP codes, and we measure the distance between their centers. We use the same measure for every move request, so the calculator and the request form agree on your move type. [Build: say whether the distance is straight-line or by road; lead lifecycle §3 says only that distances come from geocoded ZIP centroids] The two states and the distance set the move type:

| Move type | When it applies |
|---|---|
| Local | Both ZIP codes are in the same state and no more than {{setting.local_radius_miles}} miles apart |
| In-state long distance | Both ZIP codes are in the same state and more than {{setting.local_radius_miles}} miles apart |
| Interstate | The ZIP codes are in different states, whatever the distance |

For a long-distance move, the distance also sets the distance band. Once you've entered both ZIP codes, the calculator shows the distance and move type it will use, so you can check them. [Build: show the distance only after both ZIP codes resolve, never a zero distance before input (implications §8.1)]

To work out which movers serve your area, we use the same geography rules as we do for move requests. If a ZIP code spans more than one county, we use the county with the largest share of its homes. Our ZIP code and county data come from the US Census Bureau's Gazetteer files and the HUD-USPS ZIP crosswalk, refreshed every quarter. [Build: name the source of the ZIP center points; the geography rules in lead lifecycle §3 use Census ZCTAs only for maps and area statistics]

**Home size.** You choose your home's size from the same list the request form uses. It sets the typical job we price: the crew size and crew hours for a local move, or the shipment weight for a long-distance move. [Build: the same size options as the "Size and services" step of the request form]

**Services.** You can add packing, storage and specialty items. Each mover's prices for the services you pick go into that mover's result, and a mover counts toward your range only if its rate card prices every service you pick.

**Move month.** The calculator asks for a month only where enough movers give seasonal rates to pass the same thresholds as the range itself. Where it doesn't ask, the range doesn't adjust for the time of year. [Data: ask for a move month only where seasonal rates pass the site architecture §6.3 thresholds]

## How is the range built?

[Data: v1 proposal; data owner to confirm before launch: the rate-card format, both formulas, the percentiles, the rounding unit and the distance bands]

Each range comes from rate cards: what movers in our network tell us they charge. We price the same typical job with each mover's own rates, then take the middle of the results.

### What a rate card holds

Under the proposed format, a mover's rate card lists:

- its hourly rate for each crew size it sends;
- any truck or travel fee it charges on local moves;
- its rate for each distance band on long-distance moves;
- its prices for packing, storage and specialty items;
- the crew size, crew hours and shipment weight it expects for each home size;
- its seasonal rates, if it charges them.

### Which movers count

A mover's rate card goes into your range only if the mover is currently in our network, serves your move's area, and has rates for your move type, distance band, home size and every service you pick. We call these movers the contributing movers. Movers under common ownership count as one. [Build: rate cards count only while the mover is approved in our network] [Data: define "area" for each move type, for example the origin county or state for local moves and the origin and destination states for long-distance moves] [Owner: whether a corporate family counts as one mover — default shown (implications §11 Q12)]

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

We line up the contributing movers' results from lowest to highest. The range runs from the {{cost.method.percentile_low}} percentile to the {{cost.method.percentile_high}} percentile of those results: the middle half of movers. A percentile marks the share of results that fall below a point. For example, half the results fall below the 50th percentile, the median. Results at either end fall outside the range, so one unusually high or low rate card has little effect on it.

We round the low end down and the high end up, to whole multiples of {{cost.method.rounding_unit}}. That way, rounding never makes the range narrower than the results.

The typical crew hours and shipment weight for each home size are the medians of what contributing movers state on their rate cards: half state more and half state less. Because every mover is priced on the same typical job, the range shows how movers' rates differ, not how each mover sizes a job. [Data: how the typical crew size for each home size is set, to be fixed with the rate-card format]

## When does the calculator show no range?

A range shows only when rate cards from at least {{cost.method.min_movers}} different movers cover your move's area and move type and, for a long-distance move, its distance band. With fewer, the calculator shows no range, because a range resting on too few movers could mislead you. A range also stops showing when its data gets too old; see [how the method is updated](#how-is-the-method-updated).

When there's no range, the calculator says it doesn't have enough data for this move yet, and why: too few movers' rate cards cover it. You can still check how many movers in our network serve your move, and [request quotes from them](/get-quotes/). The "What we found" step of the request form follows the same rule: it shows a range from this model when the data allows, and otherwise shows the number of movers who serve your move, with the reason. [Build: the no-range state gives its reason and still offers the coverage check; the "What we found" step uses the same model and thresholds (implications §2.2)]

## Where does the data come from?

We use these sources in this order of preference. Only the first one sets a range.

1. **Rate cards from movers in our network.** The source of every range, including the typical hours and weights. We use them only where at least {{cost.method.min_movers}} different movers' rate cards cover the area and distance band.
2. **Totals from move requests sent through our site.** Only for facts that aren't prices, and never for prices. We use them only where our privacy policy allows it, with at least {{cost.method.request_min_n}} requests per area over at least {{cost.method.request_min_days}} days, and we hide any group of fewer than {{cost.method.request_suppress_below}} requests. If we show figures built from requests, we call them "recent request mix by route and size", never "recent estimates". [Counsel: confirm the privacy policy permits aggregate use of request data, and review the "recent request mix" block (site architecture §6.3 rule 7, §7.5)]
3. **Public data**, such as Bureau of Labor Statistics wage data for hand laborers and material movers (SOC 53-7062). We use it only as context on labor costs. It never sets or changes a range. [Verify: confirm the occupation title against the BLS occupational profile and link it before publishing]
4. **Third-party studies that publish their method**, cited by name and date, as context only.

Figures published by other companies are never treated as our data.

## What does a range include?

A range includes these, as each contributing mover's rate card prices them:

- the crew's time on a local move, or the shipment's weight and distance on a long-distance move;
- a truck or travel fee on a local move, where the mover charges one;
- the services you pick: packing, storage and specialty items.

A range leaves out:

- valuation coverage beyond the basic level;
- charges a mover sets after surveying your home, such as for stairs, long carries or a shuttle;
- tips;
- storage beyond what you pick;
- parking permits;
- any service you don't pick.

[How movers charge](/moving-costs/how-movers-charge/) explains valuation and these extra charges.

## How do I read the label on a range?

Every range the calculator shows carries this label, in the calculator and in the results view:

<!-- ST-7 -->
> **Planning range, not a quote:** {{cost.result.range}} for {{cost.result.scope}}. Based on {{cost.result.basis}}; data as of {{cost.result.as_of}}; model {{cost.model.version}}. [How this range is calculated]

[Build: on this page the label renders as a specimen with each part named, never as raw tokens (site architecture §4.1 G10), and its link points to "How is the range built?" above]

| Part of the label | What it tells you |
|---|---|
| The range | The low and high ends, built as this page describes |
| "for …" | The home size, move type and distance band the range covers |
| "Based on …" | The source of the range and how many movers' rate cards it uses |
| "data as of …" | The date of the rate cards behind the range |
| "model …" | The model version, the same one shown in the Current version table on this page |

The results view also lists the services and season the range assumes and what it leaves out. A range never appears without its scope, source, date and a link to this page. [Build: the results view shows the site architecture §6.3 rule 1 assumptions beside the label (implications §8.3)]

## Why do we call it a planning range?

An estimate comes from a mover, for your move. [Our guide to how movers charge](/moving-costs/how-movers-charge/) explains the kinds of estimates movers give. A planning range comes from many movers' rate cards, for a typical move like yours, and it doesn't reflect your belongings or your home.

The Federal Motor Carrier Safety Administration (FMCSA) lists estimates given by phone or online, sight unseen, among the red flags on its [Protect Your Move](https://www.fmcsa.dot.gov/protect-your-move/red-flags) site. [Verify: confirm this against the FMCSA page; compliance facts §2 took it from a search excerpt] We label every range "Planning range, not a quote", and we never call it an estimate.

[Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate". The stored-text notes on ST-1 also ask whether ST-1a's "don't … give estimates" holds with the calculator live and whether "planning range" is the right label. Counsel words or approves this section, ST-6 and ST-7.]

## Can a mover pay to change a range?

No. Our income comes from movers, who pay us for the requests they buy ([How AMC makes money](/advertising-disclosure/) has the details). That money never goes into the cost model.

- **What a mover pays us never changes a range.** [Build: the cost model reads no billing, purchase, balance or plan data, and a fixture test shows ranges don't change when a mover's spending does (implications §9.2)]
- **Giving us a rate card earns a mover no placement.** It doesn't change where the mover appears in our directory, on our location pages or in the list of movers you see before you send a request. [Build: rate-card status is not an input to any list or order (implications §9.2)]
- **Rate cards are part of joining in markets with ranges.** Under our proposed rules, movers who serve a market where the calculator shows ranges give us a rate card when they join. [Owner: whether rate-card submission is required at onboarding — default shown: required for movers in markets with a published range (new question; not in implications §11)]
- **We don't change movers' figures.** We don't raise or lower any mover's figures, other than rounding the range outward as described above. We never claim you'll pay less by using us: movers set their prices, not us.
- **No single prices.** The calculator shows ranges only, never one figure.

## How is the method updated?

We rebuild the ranges from the latest rate cards at least every {{cost.method.refresh_months}} months, and sooner when a source changes: for example, when a mover updates its rate card, or joins or leaves our network. If the data behind a range is more than {{cost.method.max_data_age_months}} months old, the range stops showing until it's refreshed. [Build: apply the site architecture §4.3 maximum age for cost data to the calculator]

Every change to the method, its values or its data gets a new model or dataset version and a dated entry in this changelog.

| Date | Change |
|---|---|
| {{cost.changelog.v0.date}} | v0 draft method; no data; not live |

## What can't a planning range tell you?

- **What you'll pay.** A range isn't a price, and a mover's price for your move can fall outside it. Only a mover can tell you what your move will cost, in a written estimate made after surveying what you're moving.
- **How stable it is.** A range can rest on as few as {{cost.method.min_movers}} movers, so one mover joining, leaving or changing its rates can shift it.
- **What your street costs.** Prices vary within an area, and a range covers the area, not your street or building.
- **What your belongings and access add.** How much you're moving, stairs, elevators, parking and the walk from your door to the truck can all change the price.
- **How a mover will price your move.** A mover may price it differently from the model. See [hourly and weight-based pricing](/moving-costs/how-movers-charge/) in How movers charge.
- **What movers actually charge.** Rate cards are what movers tell us they charge. Ranges don't use the quotes movers send you or what you end up paying.

## What happens to the answers you enter?

- You don't need to give any contact details to see a range.
- Your ZIP codes, home size and other answers never go into the page's web address, and we don't send them to analytics tools.
- We use your answers only to work out the range, and we don't store them unless you continue to the request form. There, the form shows your answers for you to confirm or change, and keeps your progress as you go.
- Calculator results are never indexed by search engines.

If you continue, [Which companies receive my request](/which-companies-receive-my-request/) explains who can receive your details.

[Build: verify each statement against the tag policy (site architecture §8.8), which names quote pages and survey entry modules; confirm it covers the calculator and its results view]

## Found an error?

If a range, or anything on this page, looks wrong, email {{org.editorial_email}}. Tell us the ZIP codes, home size and services you entered, and the model version on the label. Our [editorial policy](/editorial-policy/) explains how we handle corrections, and any fix to the method or data appears in the changelog above.

## Related pages

- [Moving cost calculator](/moving-cost-calculator/): see a planning range for your move.
- [How movers charge](/moving-costs/how-movers-charge/): hourly and weight-based pricing, estimate types, valuation and extra charges.
- [Moving costs](/moving-costs/): what affects the cost of a move, with ranges where the data allows.
- [How AMC makes money](/advertising-disclosure/): who pays us, and what payment never changes.
