---
id: costs-moving-cost-calculator
url: /moving-cost-calculator/
family: Cost calculator
title: "Moving Cost Calculator: Estimate Your Moving Cost Range"   # site architecture §8.2 template; 55 characters, so no suffix. [Counsel: 'Estimate' as a verb in the title; alternative 'See a typical cost range'] The same marker renders under the H1, because comments don't render
meta_description: "See a planning range for a local or long-distance move where rate cards from at least {{cost.method.min_movers}} movers cover it. Not a quote or an estimate. No contact details."   # 152 characters with the token rendered as "5"
h1: "Moving cost calculator"
breadcrumb: "Home › Moving cost calculator"
indexation: index once approved   # the tool page only (site architecture §1.2); the brief covers results
schema: [WebPage, BreadcrumbList]
primary_queries: ["moving cost calculator", "moving cost estimator", "moving estimate", "long distance moving cost calculator"]
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: "{{page.data_owner}}"
ai_assisted: true
stored_texts: [ST-7, ST-6, ST-1b]
tokens: [cost.result.range, cost.result.scope, cost.result.basis, cost.result.as_of, cost.model.version, cost.method.min_movers, cost.method.max_data_age_months, cost.method.storage_assumption, cost.method.specialty_items, setting.local_radius_miles, page.author, page.reviewer, page.data_owner]
depends_on:
  - "Counsel: 'Estimate' as a verb in the title; alternative 'See a typical cost range' (site architecture §8.2; compliance facts §2)"
  - "Counsel: range wording, including whether ranges or calculators count as providing an estimate (compliance facts §2; stored-text notes on ST-1, ST-6 and ST-7)"
  - "Counsel: approve ST-6, ST-7 and ST-1b, including ST-6's closing clause, since a non-binding estimate can be exceeded (site architecture §6.3 rules 3 and 5, §7.1; method brief open item 21)"
  - "Counsel: move-type labels and help lines, so readers don't infer which rules apply from AMC's distance rule (consumer-moving-rules note, counsel item 6)"
  - "Data owner: the v1 method on /moving-cost-calculator/method/, including the area used for thresholds, the seasonal rule, which sizes rate cards price (office moves and moves of a few items get no range), what packing covers, the storage period and the specialty-item list (site architecture §6.3; build plan §7.3)"
  - "Data owner and owner: at least one area passes the thresholds before this page publishes (site architecture §6.3 rules 4 and 5, §3.3 rule 4)"
  - "Owner: apply site architecture §4.3's 12-month cost-data limit to the calculator, rate card by rate card; default shown: yes (method page, 'How is the method updated?')"
  - "Owner decision 2026-10-29: Request moving quotes remains available after a valid calculation, including when no price range can be shown."
  - "Owner: which locations the calculator and the quote survey can't serve; default shown: PO-box-only ZIP codes, APO and FPO addresses and US territories (JTBD §4 J1; backlog 4.1.2)"
  - "Owner: no city lookup for unknown ZIP codes on the calculator, although VD §9.2 has one; default shown: none, since the method page takes two ZIP codes"
  - "Owner: the same ZIP code at both ends is accepted as a local move (lead lifecycle §4)"
  - "Build: request handoffs keep entered move details in browser session state, never the URL."
  - "Design and build: error.zip.non_us fires only on a non-US postal-code pattern, tested before VD §9.2's cleanup (lead lifecycle §2; VD §9.2, §14)"
  - "Build and counsel: the site architecture §8.8 tag policy covers this page and its results view"
  - "Owner: name the author, the reviewer and the data owner (brief §11 Q9; implications §11 Q17)"
  - "Owner: the review note's AI line and the author's 'Edited by' label; default shown: the editorial policy's defaults (content/pages/trust/editorial-policy.md, 'How we tell you')"
last_updated: null
---

# Moving cost calculator

The moving cost calculator from American Moving Choice shows a planning range for a move like yours wherever enough participating movers give us rate cards: what they tell us they charge. Enter two ZIP codes and your home size; no contact details needed. A range isn't a quote or an estimate: only a mover can price your move.

[Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate", and the ST-1 notes ask whether "planning range" is the right label. Counsel words or approves this answer, the results view, ST-6 and ST-7.]

[Counsel: "Estimate" as a verb in the title, "Moving Cost Calculator: Estimate Your Moving Cost Range"; alternative "Moving Cost Calculator: See a Typical Cost Range" (site architecture §8.2; compliance facts §2)]

Edited by {{page.author}} · Reviewed by {{page.reviewer}} · Data owner: {{page.data_owner}} · First drafted with AI

[Build: this review note renders from the page record, as the editorial policy specifies: the author's "Edited by" label and the AI line appear because AI drafted this page (`ai_assisted: true`). Show the published and last-updated dates from the CMS record beside it, and mark up the reviewer as `WebPage.reviewedBy` (content/pages/trust/editorial-policy.md, "How we tell you"; content/README.md §2; site architecture §7.3, §8.5)] [Owner: the AI disclosure form and the author's label on an AI-drafted page — default shown: a review-note AI line and "Edited by", as the editorial policy drafts them (new questions; editorial policy, "How we tell you")]

<!-- calculator-widget:start -->

**Calculator widget: interface copy.** The calculator component renders the strings below; they aren't page prose. Each string has an ID for engineers to map, and size, service and move-type IDs end in the keys `packages/core` uses. Single braces, such as `{zip}`, are values the calculator fills in from the reader's answers. Double braces are registry tokens (`content/README.md` §3). [Data: publish this page only once rate cards pass the thresholds in at least one area; until then every result is the "not enough data" state (site architecture §6.3 rules 4 and 5)] [Owner: hold the page until at least one area passes, rather than publish with a status note like the method page's — default shown (new question; site architecture §3.3 rule 4; brief open item 1)]

**Order on the page.**

1. The form: the two ZIP code fields, the route summary, move size, services, the "Still needed" hint, the button and the privacy line.
2. The result area, empty until the reader calculates: one result (the results view, or the not-enough-data, no-range-for-this-size, stale-data or error state), then a request call to action with ST-1b for valid move answers.

**Heading levels.** In the result area, `results.heading` and every `state.*.heading` render as H2, and `results.assume.heading`, `results.includes.heading` and `results.excludes.heading` as H3. The result area sits between the H1 and the H2s below the tool, so the outline stays in order (VD §14).

[Build: the result area sits below the form on the same page. Focus moves to the heading of whatever renders there, and the page address never changes]

[Build: native inputs only (text, radio, checkbox and select). Every input starts empty, and a scripted submit of defaults fails (implications §2.7; VD §9.2)]

**Placeholders.** No field has placeholder text. Format hints sit in the help line below each field, so nothing looks filled in before the reader types.

**Form**

| ID | Text | Notes |
|---|---|---|
| form.name | Moving cost calculator | Accessible name of the form; not shown |
| form.route.legend | Where are you moving? | Legend for the two ZIP code fields |
| form.origin.label | Moving from (ZIP) | Same label as the quote survey in the style tile |
| form.origin.help | 5-digit ZIP code | Replaced by form.origin.resolved once the ZIP code resolves |
| form.origin.resolved | {city}, {state} | Resolved city and two-letter state code (VD §9.2) |
| form.destination.label | Moving to (ZIP) | |
| form.destination.help | 5-digit ZIP code | Replaced by form.destination.resolved |
| form.destination.resolved | {city}, {state} | |
| form.size.legend | Move size | Same label as the quote survey in the style tile. [Build: radio choice cards with native inputs, none selected (VD §9.2). The seven options are the quote survey's list, in its order and with its labels, as the method page says ("Home size"; `MoveSize` in `packages/core/src/matching.ts`; style tile). Rate cards price only the five home sizes (build plan §7.3), so `office` and `partial` lead to state.size_unpriced] |
| form.size.help | The range uses movers' rates for a typical move of this size. | |
| form.size.studio | Studio | |
| form.size.1br | 1 bedroom | |
| form.size.2br | 2 bedrooms | |
| form.size.3br | 3 bedrooms | |
| form.size.4br_plus | 4+ bedrooms | |
| form.size.office | Office | |
| form.size.partial | A few items | |
| form.services.legend | Services (optional) | Checkboxes, none checked. [Data: data owner to confirm before launch, with the rate-card format: what packing covers (full or partial), and the values of `cost.method.storage_assumption` and `cost.method.specialty_items`, which the help lines and both results lists render (method page, "Services")] |
| form.services.help | Pick any you want included in the range. | |
| form.services.packing | Packing | |
| form.services.packing.help | The movers pack your belongings. | |
| form.services.storage | Storage | |
| form.services.storage.help | Storage for {{cost.method.storage_assumption}}. | The method page's storage period |
| form.services.specialty_items | Specialty items | |
| form.services.specialty_items.help | Covers {{cost.method.specialty_items}}. | The method page's list |
| form.month.label | Move month (optional) | [Build: not rendered in model v1, which has no seasonal rates (build plan §7.3; method page, "Move month"). This marker covers every form.month.* string, results.assume.month and results.assume.month.blank; they wait for a later model version] Native select, after services. A blank month uses each mover's standard rates, as where the field isn't asked (method page, "Move month"). [Data: show the field only after both ZIP codes resolve, and only where seasonal rates pass the site architecture §6.3 thresholds (method page, "Move month")] |
| form.month.help | Movers in this area price some months differently, so the month can change the range. If you're not sure yet, leave it blank. | |
| form.month.empty | Choose a month | First option, empty value |
| form.month.options | January to December | Twelve options: full month names in calendar order, no year |
| form.month.added | Move month added: movers in this area price some months differently. | Polite live-region message when the field appears |
| form.month.removed | Move month removed: the range here doesn't adjust for the time of year. | Polite live-region message when a ZIP code change hides the field |
| form.submit | Calculate the range | Navy primary button, never CTA red (VD §5.3) |
| form.submit.busy | Processing… | Busy label, with `aria-busy` (VD §9.1) |

[Build: ZIP code fields are text inputs with `inputmode="numeric"` and no `maxlength`. The script strips non-digits and keeps the first five, and ZIP codes stay strings with leading zeros kept (VD §9.2; lead lifecycle §3). The only test before that cleanup is the non-US pattern check under error.zip.non_us]

**Route summary** (under the two ZIP code fields, once both resolve)

| ID | Text | Notes |
|---|---|---|
| route.summary | {origin_city}, {origin_state} to {destination_city}, {destination_state} | |
| route.distance | {miles} miles in a straight line between ZIP code centers | Whole miles, with a thousands separator, from 2 miles up |
| route.distance.one | 1 mile in a straight line between ZIP code centers | When the distance rounds to 1 mile |
| route.distance.short | Less than 1 mile between ZIP code centers | When the distance rounds below 1 mile |
| route.distance.same | Within ZIP code {zip} | When both ZIP codes are the same |
| route.type.local | Local | Move-type labels and rules match the method page's table. [Counsel: how to label local, in-state long-distance and interstate moves, in all six route.type.* strings and wherever they render (results.assume.distance; ST-7's scope), so readers don't infer which rules apply from AMC's distance rule (consumer-moving-rules note, counsel item 6; How movers charge carries the same marker)] |
| route.type.intrastate | In-state long distance | Covered by the [Counsel] marker on route.type.local |
| route.type.interstate | Interstate | Covered by the [Counsel] marker on route.type.local |
| route.type.local.help | Same state, no more than {{setting.local_radius_miles}} miles apart | Shown beside the move type |
| route.type.intrastate.help | Same state, more than {{setting.local_radius_miles}} miles apart | |
| route.type.interstate.help | Different states, whatever the distance | |
| route.check | If this looks wrong, check the ZIP codes. | |

[Build: render nothing until both ZIP codes resolve, and never show "0 miles" (implications §8.1). Distance is haversine (straight-line) between ZIP centroids, as the method page now says (build plan §7.1, §7.3)]

**Progress hint and errors**

| ID | Text | Notes |
|---|---|---|
| form.progress | Still needed: {fields} | Missing required answers (the two ZIP codes and the move size) in form order, joined with commas and "and". Updates as answers resolve; not a live region, so screen readers aren't interrupted while typing |
| form.progress.origin | moving-from ZIP code | |
| form.progress.destination | moving-to ZIP code | |
| form.progress.size | move size | |
| form.progress.done | Nothing else needed. | Replaces the hint once every required answer is in |
| error.origin.required | Enter the ZIP code you're moving from. | |
| error.destination.required | Enter the ZIP code you're moving to. | |
| error.zip.short | Enter a 5-digit ZIP code. | Fewer than five digits after cleanup, as with a typo such as "0210O"; same text as the style tile |
| error.zip.unknown | We can't find ZIP code {zip}. Check the number. | Five digits that match no ZIP code in our data. [Owner: no city lookup on the calculator, although VD §9.2 has unknown ZIP codes prompt a city choice; the method page takes two ZIP codes — default shown (new question; brief open item 10)] |
| error.zip.non_us | That isn't a US ZIP code. We can show ranges only for moves within the US. | Only when the entry, before cleanup, matches a non-US postal code pattern, such as a Canadian code ("M5V 2T6") or a UK-style code ("SW1A 1AA"). [Build: test the raw entry against those patterns before VD §9.2's cleanup. Every other entry is cleaned as usual, so "02a108" and "ZIP 02108" still resolve to 02108 (VD §14)] |
| error.zip.unsupported | We can't show ranges for moves to or from ZIP code {zip} yet. | [Owner: which locations the calculator and the quote survey can't serve yet — default shown (JTBD §4 J1 lists PO-box-only ZIP codes, APO and FPO addresses and US territories; backlog 4.1.2)] |
| error.zip.lookup | We couldn't check this ZIP code just now. Try again in a moment. | The lookup failed |
| notice.zip.same | You entered the same ZIP code twice. That works for a move within one ZIP code; if not, check the moving-to ZIP code. | A notice, not an error, and it doesn't block. [Owner: accept the same ZIP code at both ends as a local move, with this notice — default shown (new question; lead lifecycle §4 allows the same origin and destination only for local moves, and a same-ZIP move is always local)] |
| error.size.required | Choose a move size. | Same text as the style tile |
| error.count.one | 1 answer needs attention. | Polite live region, on submit |
| error.count.other | {n} answers need attention. | |

[Build: each error sits below its field with an icon, `aria-invalid` and `aria-describedby`. On submit, focus moves to the first invalid field and the live region announces the count (VD §9.2)]

**Privacy line** (under the button)

| ID | Text | Notes |
|---|---|---|
| form.privacy | No contact details needed. Your answers never appear in the page address, and we don't keep them unless you continue to the quote survey. | [Build: answers stay out of URLs, analytics events and logs, and the calculator stores nothing, on the server or in the browser, until the reader chooses the call to action; then they go to the quote survey's draft (lead lifecycle §1). Confirm the site architecture §8.8 tag policy covers this page and its results view] |

**Results view** (below the form, after the reader calculates, when a range passes the thresholds)

| ID | Text | Notes |
|---|---|---|
| results.heading | Result for this move | H2. Receives focus when the result appears |

<!-- ST-7 -->
> **Planning range, not a quote:** {{cost.result.range}} for {{cost.result.scope}}. Based on {{cost.result.basis}}; data as of {{cost.result.as_of}}; model {{cost.model.version}}. [How this range is calculated]

[Build: the range may render large, but only inside this label, with its scope, basis, date, model version and link, and never as one figure (site architecture §6.3 rule 1). "How this range is calculated" opens /moving-cost-calculator/method/#how-is-the-range-built. One model version feeds this view, any calculator widget elsewhere and the answers carried into the quote survey; a CI test sends the same answers through each and fails on any difference (site architecture §6.3 rules 5 and 6; implications §2.7)]

| ID | Text | Notes |
|---|---|---|
| results.assume.heading | What this range assumes | H3 |
| results.assume.route | Route: {origin_city}, {origin_state} {origin_zip} to {destination_city}, {destination_state} {destination_zip} | |
| results.assume.distance | Distance: {distance} · {move_type} | {distance} is the route.distance string in use; {move_type} is the route.type label |
| results.assume.band | Distance band: {band} | Long-distance moves only |
| results.assume.size | Home size: {size} | Only the five home sizes reach a range |
| results.assume.services | Services: {services} | Picked services in lowercase, joined with commas and "and" |
| results.assume.services.none | Services: none | |
| results.assume.month | Move month: {month} | When a month is picked |
| results.assume.month.blank | Time of year: not adjusted, because you didn't pick a month | When the month is asked but left blank |
| results.assume.month.none | Time of year: not adjusted; this version uses each mover's standard rates | Every result in model v1 |
| results.includes.heading | What the range includes | H3 |
| results.includes.intro | As each mover's rate card prices them: | |
| results.includes.time | the crew's time | Local moves |
| results.includes.fee | a truck or travel fee, where the mover charges one | Local moves |
| results.includes.weight | the shipment's weight and distance | Long-distance moves |
| results.includes.services | the services you picked: {services} | Only when any are picked. Here {services} names them as the method page does: "packing", "storage for {{cost.method.storage_assumption}}" and "specialty items ({{cost.method.specialty_items}})" |
| results.excludes.heading | What the range leaves out | H3. Same items as the method page's list, with "pick" in the past tense |
| results.excludes.valuation | charges for valuation coverage | |
| results.excludes.survey | charges a mover sets after surveying your home, such as for stairs, long carries or a shuttle | |
| results.excludes.tips | tips | |
| results.excludes.storage | storage beyond {{cost.method.storage_assumption}} | Only when storage is picked; otherwise results.excludes.unpicked covers it |
| results.excludes.specialty_items | specialty items other than {{cost.method.specialty_items}} | Only when specialty items are picked; otherwise results.excludes.unpicked covers it |
| results.excludes.permits | parking permits | |
| results.excludes.unpicked | any service you didn't pick | |
| results.excludes.more | [How movers charge](/moving-costs/how-movers-charge/) explains valuation and these extra charges. | |

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

| ID | Text | Notes |
|---|---|---|
| results.changed | You changed an answer. Calculate the range again to update it. | [Build: when an answer changes after a result, the result dims and the call to action hides until the reader calculates again, so carried answers always match the range shown] |

**Call to action** (after any result with valid move answers, including an unavailable range or a calculation error)

| ID | Text | Notes |
|---|---|---|
| cta.button | Request moving quotes | CTA red (VD §5.3). Opens the request form with the entered move answers. |
| cta.help | Opens our quote survey with your ZIP codes, move size and services filled in for you to check. Nothing reaches a mover unless you send a request. | [Build: opens /get-quotes/ at the "Where" step, with the two ZIP codes, move size and services carried in session state, never the URL, and marked for the reader to confirm (implications §2.1, §2.2; site architecture §8.8). The month isn't carried, because the "When" step starts empty (implications §2.1 step 3)] |

<!-- ST-1b -->
> {{text.ST-1b}}

[Build: render the current ST-1b text directly under the call to action.]

**Other states**

| ID | Text | Notes |
|---|---|---|
| state.no_data.heading | Not enough data for a range yet | H2. Replaces the results view |
| state.no_data.body | A range needs rate cards from at least {{cost.method.min_movers}} different movers for a move like this in this area, and we have fewer. A range resting on too few movers could mislead you, so we don't show one. | |
| state.no_data.services | There's enough data for this move without services, but too few movers price every service you picked. Remove some or all of them to see a range. | Only when the picked services are the cause: without them, enough movers' rate cards cover the move. So the state names its cause (method page, "When does the calculator show no range?") |
| state.size_unpriced.heading | No range for this kind of move | H2. Replaces the results view when the move size is office or a few items |
| state.size_unpriced.body | Movers' rate cards cover homes from a studio to 4+ bedrooms. They don't cover office moves or moves of a few items, so there's no range for this move. | [Data: the proposed rate-card format prices the five home sizes only (build plan §7.3); the data owner confirms it with the format (method page, "How is the range built?"). If the format adds office or partial moves, delete this state; those sizes then get state.no_data while too few rate cards price them] |
| state.next.intro | Continue with your move details and choose your contact preferences. | Renders with cta.button after the not-enough-data, no-range-for-this-size, stale-data or error state. |
| state.stale.heading | No range for this area right now | H2. Replaces the results view |
| state.stale.body | Rate cards stop counting once they're more than {{cost.method.max_data_age_months}} months old, and too few recent ones cover this move. There's no range until enough movers send newer ones. | [Build: apply the method page's maximum data age to each rate card, and show this state, not state.no_data, when the move would have a range with the older rate cards] [Owner: apply site architecture §4.3's 12-month cost-data limit to the calculator, rate card by rate card — default shown (new question; the method page carries the same marker)] |
| state.error.heading | We couldn't load a range | H2. Inline, in the result area |
| state.error.body | Something went wrong. Nothing was shared with any mover, and your answers are still filled in. | |
| state.error.retry | Try again | Secondary button |
| state.noscript | The calculator needs JavaScript. You can turn it on in your browser, or read [Moving costs](/moving-costs/) to see what affects the price of a move. | [Build: show only if the calculator can't run without JavaScript. The quote survey's steps are client state, so this line doesn't send readers there (site architecture §1.2, Quote survey row; §8.1)] |

[Build: every completed result with valid move answers offers the request call to action. Pricing-data thresholds control the range only; they never control whether the request button is shown. The request form validates the move details and records contact preferences before saving the request.]

<!-- calculator-widget:end -->

## How is the range worked out?

Each range comes from rate cards: what participating movers tell us they charge. Where at least {{cost.method.min_movers}} movers' rate cards cover the move, we apply each mover's own rates to a typical move like yours and show the middle of the results.

[How the calculator works](/moving-cost-calculator/method/) has the formulas, data sources, thresholds, current version and changelog.

## What changes the price of a move?

The calculator works from the answers you give it: the route, the size of your move and the services you pick. A mover pricing your actual move also looks at things a range can't see, such as:

- how much you're moving;
- stairs, elevators, parking and the walk from your door to the truck;
- charges it sets after a survey, such as for long carries or a shuttle;
- the valuation coverage you choose;
- how it prices the move: by the hour, or by weight or volume and distance.

[How movers charge](/moving-costs/how-movers-charge/) explains hourly and weight-based pricing, estimate types, valuation and extra charges.

## Why get a written estimate after a survey?

A planning range can't see your home or belongings, so a mover's price can fall outside it. Ask movers for a written estimate after a survey; [How movers charge](/moving-costs/how-movers-charge/#why-should-a-survey-come-before-the-estimate) explains why.

## Related pages

- [Moving costs](/moving-costs/): what affects the cost of a move, with ranges where the data allows.
- [How the calculator works](/moving-cost-calculator/method/): the formulas, data sources, thresholds and changelog behind every range.
- [How movers charge](/moving-costs/how-movers-charge/): hourly and weight-based pricing, estimate types, valuation and extra charges.
- [Which companies receive my request](/which-companies-receive-my-request/): who can receive your details if you send a request.
- [How AMC makes money](/advertising-disclosure/): who pays us, and what payment never changes.
