---
id: costs-moving-costs
url: /moving-costs/
family: Cost guide
title: "How Much Do Movers Cost? Ranges and What Drives the Price"   # 57 characters, so no brand suffix (site architecture §8.2)
meta_description: "What decides the cost of hiring movers: distance, home size, services, access and timing. Ranges by home size and move type, each with its source and date."   # 155 characters. Page-specific facts, no figure: the page rule bars hand-typed figures (brief §8)
h1: "How much do movers cost?"
breadcrumb: "Home › Moving costs"
indexation: index once it passes editorial review and the ranges table passes its data gate   # site architecture §1.2, Cost guide row; §6.3 rule 4
schema: [Article, BreadcrumbList]        # Article.author = Person ({{page.author}}, url = author page); WebPage.reviewedBy = Person ({{page.reviewer}}); dates match the visible dates (site architecture §8.5). Never FAQPage, HowTo or Dataset
primary_queries:                         # keyword-to-page-map.csv lines 24 to 56 (Semrush US, 2026-10-27); volumes and KD in brief §3
  - "how much do movers cost"
  - "how much does it cost to move"
  - "cost to hire movers"
  - "average cost of movers"
  - "how much are movers"
  - "how much does a moving company cost"
  - "how much is a moving company"
  - "how much does it cost for movers to move"
  - "how much does it cost to hire movers"
  - "how much to hire movers"
  - "how much for movers"
  - "how much movers cost"
  - "how much do movers charge"
  - "how much does movers cost"
  - "how much to movers cost"
  - "how much is it to hire movers"
  - "how much is movers"
  - "how much do moving companies charge"
  - "how much do moving companies cost"
  - "how much does it cost to hire a moving company"
  - "how much would a moving company cost"
  - "how much a moving company cost"
  - "how much does moving company charge"
  - "how much are moving companies"
  - "how much does it cost for a moving company"
  - "how much moving company cost"
  - "how much a moving company charge"
  - "how much is a moving company cost"
  - "how much is moving company"
  - "how much to hire a moving company"
  - "how much does moving company cost"
  - "how much is it to hire a moving company"
  - "how much do movers cost for a 1 bedroom apartment"   # line 56: /moving-costs/#by-home-size
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: "{{page.data_owner}}"        # owns the ranges table
ai_assisted: true
stored_texts: [ST-6, ST-7]               # ST-6 twice: inside the ranges block and in "Why we show ranges, not prices". ST-7 as a specimen in the calculator section
tokens: [page.author, page.reviewer, page.data_owner, setting.local_radius_miles, cost.method.min_movers,
  cost.result.range, cost.result.scope, cost.result.basis, cost.result.as_of, cost.model.version,
  cost.hub.studio.local.scope, cost.hub.studio.local.range, cost.hub.studio.local.source, cost.hub.studio.local.sample, cost.hub.studio.local.as_of,
  cost.hub.studio.intrastate.scope, cost.hub.studio.intrastate.range, cost.hub.studio.intrastate.source, cost.hub.studio.intrastate.sample, cost.hub.studio.intrastate.as_of,
  cost.hub.studio.interstate.scope, cost.hub.studio.interstate.range, cost.hub.studio.interstate.source, cost.hub.studio.interstate.sample, cost.hub.studio.interstate.as_of,
  cost.hub.1br.local.scope, cost.hub.1br.local.range, cost.hub.1br.local.source, cost.hub.1br.local.sample, cost.hub.1br.local.as_of,
  cost.hub.1br.intrastate.scope, cost.hub.1br.intrastate.range, cost.hub.1br.intrastate.source, cost.hub.1br.intrastate.sample, cost.hub.1br.intrastate.as_of,
  cost.hub.1br.interstate.scope, cost.hub.1br.interstate.range, cost.hub.1br.interstate.source, cost.hub.1br.interstate.sample, cost.hub.1br.interstate.as_of,
  cost.hub.2br.local.scope, cost.hub.2br.local.range, cost.hub.2br.local.source, cost.hub.2br.local.sample, cost.hub.2br.local.as_of,
  cost.hub.2br.intrastate.scope, cost.hub.2br.intrastate.range, cost.hub.2br.intrastate.source, cost.hub.2br.intrastate.sample, cost.hub.2br.intrastate.as_of,
  cost.hub.2br.interstate.scope, cost.hub.2br.interstate.range, cost.hub.2br.interstate.source, cost.hub.2br.interstate.sample, cost.hub.2br.interstate.as_of,
  cost.hub.3br.local.scope, cost.hub.3br.local.range, cost.hub.3br.local.source, cost.hub.3br.local.sample, cost.hub.3br.local.as_of,
  cost.hub.3br.intrastate.scope, cost.hub.3br.intrastate.range, cost.hub.3br.intrastate.source, cost.hub.3br.intrastate.sample, cost.hub.3br.intrastate.as_of,
  cost.hub.3br.interstate.scope, cost.hub.3br.interstate.range, cost.hub.3br.interstate.source, cost.hub.3br.interstate.sample, cost.hub.3br.interstate.as_of,
  cost.hub.4br_plus.local.scope, cost.hub.4br_plus.local.range, cost.hub.4br_plus.local.source, cost.hub.4br_plus.local.sample, cost.hub.4br_plus.local.as_of,
  cost.hub.4br_plus.intrastate.scope, cost.hub.4br_plus.intrastate.range, cost.hub.4br_plus.intrastate.source, cost.hub.4br_plus.intrastate.sample, cost.hub.4br_plus.intrastate.as_of,
  cost.hub.4br_plus.interstate.scope, cost.hub.4br_plus.interstate.range, cost.hub.4br_plus.interstate.source, cost.hub.4br_plus.interstate.sample, cost.hub.4br_plus.interstate.as_of]
depends_on:
  - "Data owner + owner: rate cards from at least 5 distinct movers per geography before the ranges table can publish; until then the block is omitted and the page waits at the gate (site architecture §6.3 rules 2(a) and 4; content/README.md §3, cost.* 'No data yet')"
  - "Data owner: the area and distance band behind each row, and a section on the method page that says how these rows are built (site architecture §6.3 rules 1 and 5). No rows for single states before the Wave 1 state cost keyword pull (site architecture §1.2, §11; implications §7.5)"
  - "Counsel: approve ST-6 and ST-7 (site architecture §6.3 rules 3 and 5; stored-texts notes)"
  - "Counsel: whether ranges, tables or calculators count as providing an estimate, and 'planning range' as the label (compliance facts §2; consumer-moving-rules note, counsel item 1)"
  - "Counsel: labels for local, in-state long-distance and interstate moves (consumer-moving-rules note, counsel item 6)"
  - "Counsel: FMCSA's on-site red-flag wording against video surveys under 49 CFR 375.103 (consumer-moving-rules note, counsel item 3)"
  - "Counsel: the one-sentence role statement, condensed from ST-1a's facts (site architecture §7.1; implications §3.4; content/README.md §9)"
  - "Owner: name the author, a different reviewer and the data owner (brief §11 Q9; implications §11 Q17)"
  - "Owner + editorial: a meta description with no figure, against site architecture §8.2's data-point rule (page rule: no hand-typed figures)"
last_updated: null
---

# How much do movers cost?

What movers charge depends mainly on distance, move type, home size and services. Local moves are usually priced by the hour, long-distance moves mainly by weight and distance. American Moving Choice doesn't publish cost ranges yet. Where enough movers give us their rates, our calculator shows a planning range; a mover's written estimate prices your move.

[Build: "American Moving Choice doesn't publish cost ranges yet." is the no-data version of the third sentence. Once any row of the ranges table passes, the CMS renders "Typical ranges from American Moving Choice are below." in its place, from the cost dataset's state. Both versions keep the answer at 56 words (site architecture §6.3 rule 4, §7.4)]

[Verify: "usually priced by the hour" and "mainly by weight and distance" summarize practice, not a rule; How movers charge gives the rules behind them (consumer-moving-rules note C5, C9, C19; How movers charge brief SR-02, SR-03). The reviewer, who needs relevant moving experience (site architecture §7.2), confirms them.]

Written by {{page.author}} · Reviewed by {{page.reviewer}} · Data owner: {{page.data_owner}}

[Build: show the published and last-updated dates from the CMS record beside the byline, and render the same dates in Article `datePublished` and `dateModified`; mark up the reviewer as `WebPage.reviewedBy` (site architecture §7.3, §8.5)]

<a id="by-home-size"></a>

## Typical ranges by home size and move type

[Data: omitted at publish unless rate cards from at least 5 movers per geography support it (site architecture §6.3); the page waits at the gate until then]

These ranges come from rate cards: what movers in our network tell us they charge. Each row says what it covers, where its data comes from, how many movers it rests on and how recent its data is. A row appears only when rate cards from at least {{cost.method.min_movers}} different movers support it.

[Data: the data owner defines the area behind each row and the distance band for long-distance rows, and the method page adds how these rows are built before the table publishes. The rows assume the calculator's model and its list of what a range leaves out. This national page shows no rows for single states until the Wave 1 state cost keyword pull (site architecture §1.2, §11; implications §7.5)]

| What the range covers | Planning range | Source | Sample size | Data as of |
|---|---|---|---|---|
| {{cost.hub.studio.local.scope}} | {{cost.hub.studio.local.range}} | {{cost.hub.studio.local.source}} | {{cost.hub.studio.local.sample}} | {{cost.hub.studio.local.as_of}} |
| {{cost.hub.studio.intrastate.scope}} | {{cost.hub.studio.intrastate.range}} | {{cost.hub.studio.intrastate.source}} | {{cost.hub.studio.intrastate.sample}} | {{cost.hub.studio.intrastate.as_of}} |
| {{cost.hub.studio.interstate.scope}} | {{cost.hub.studio.interstate.range}} | {{cost.hub.studio.interstate.source}} | {{cost.hub.studio.interstate.sample}} | {{cost.hub.studio.interstate.as_of}} |
| {{cost.hub.1br.local.scope}} | {{cost.hub.1br.local.range}} | {{cost.hub.1br.local.source}} | {{cost.hub.1br.local.sample}} | {{cost.hub.1br.local.as_of}} |
| {{cost.hub.1br.intrastate.scope}} | {{cost.hub.1br.intrastate.range}} | {{cost.hub.1br.intrastate.source}} | {{cost.hub.1br.intrastate.sample}} | {{cost.hub.1br.intrastate.as_of}} |
| {{cost.hub.1br.interstate.scope}} | {{cost.hub.1br.interstate.range}} | {{cost.hub.1br.interstate.source}} | {{cost.hub.1br.interstate.sample}} | {{cost.hub.1br.interstate.as_of}} |
| {{cost.hub.2br.local.scope}} | {{cost.hub.2br.local.range}} | {{cost.hub.2br.local.source}} | {{cost.hub.2br.local.sample}} | {{cost.hub.2br.local.as_of}} |
| {{cost.hub.2br.intrastate.scope}} | {{cost.hub.2br.intrastate.range}} | {{cost.hub.2br.intrastate.source}} | {{cost.hub.2br.intrastate.sample}} | {{cost.hub.2br.intrastate.as_of}} |
| {{cost.hub.2br.interstate.scope}} | {{cost.hub.2br.interstate.range}} | {{cost.hub.2br.interstate.source}} | {{cost.hub.2br.interstate.sample}} | {{cost.hub.2br.interstate.as_of}} |
| {{cost.hub.3br.local.scope}} | {{cost.hub.3br.local.range}} | {{cost.hub.3br.local.source}} | {{cost.hub.3br.local.sample}} | {{cost.hub.3br.local.as_of}} |
| {{cost.hub.3br.intrastate.scope}} | {{cost.hub.3br.intrastate.range}} | {{cost.hub.3br.intrastate.source}} | {{cost.hub.3br.intrastate.sample}} | {{cost.hub.3br.intrastate.as_of}} |
| {{cost.hub.3br.interstate.scope}} | {{cost.hub.3br.interstate.range}} | {{cost.hub.3br.interstate.source}} | {{cost.hub.3br.interstate.sample}} | {{cost.hub.3br.interstate.as_of}} |
| {{cost.hub.4br_plus.local.scope}} | {{cost.hub.4br_plus.local.range}} | {{cost.hub.4br_plus.local.source}} | {{cost.hub.4br_plus.local.sample}} | {{cost.hub.4br_plus.local.as_of}} |
| {{cost.hub.4br_plus.intrastate.scope}} | {{cost.hub.4br_plus.intrastate.range}} | {{cost.hub.4br_plus.intrastate.source}} | {{cost.hub.4br_plus.intrastate.sample}} | {{cost.hub.4br_plus.intrastate.as_of}} |
| {{cost.hub.4br_plus.interstate.scope}} | {{cost.hub.4br_plus.interstate.range}} | {{cost.hub.4br_plus.interstate.source}} | {{cost.hub.4br_plus.interstate.sample}} | {{cost.hub.4br_plus.interstate.as_of}} |

[Build: rows render from the versioned cost dataset by metric ID (`cost.hub.<size>.<move_type>.<field>`, with the home-size keys of build plan §7.3 and the move types of lead lifecycle §3), using the calculator's model version. Each scope starts with the home size and move type, as ST-7's scope does, then names the area, the distance band for a long-distance row, the services included and the season, so rows scan by home size. A row whose range doesn't pass is left out, never shown empty. If no row passes, this whole section, the anchor and ST-6 included, is omitted (site architecture §6.3 rules 1, 4 and 6). Each range links to the method page (site architecture §3.2, "Every number"). CI fails on two values for one metric ID or on a missing date (site architecture §6.3 rule 6). Below 768px the table becomes stacked cards (implications §8.2)]

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

Like the calculator's ranges, these leave out charges a mover sets after seeing your home, such as for stairs or a long carry, charges for valuation coverage, and tips. [What a range includes](/moving-cost-calculator/method/#what-does-a-range-include) lists everything, and our guide to [tipping movers](/guides/how-much-to-tip-movers/) covers tips.

## What affects the price of a move?

Movers set their own prices, and each one prices a move from what the job will take. These are the main things that change the price:

- **Distance and move type.** How far you're moving shapes how a mover prices the job: usually by the crew's time for a short move within one state, and mainly by the shipment's weight and the distance for a longer one. See [local versus long-distance moves](#local-versus-long-distance-moves).
- **Home size and weight.** Home size is a shorthand for how much you're moving. More belongings mean more crew time on an hourly move and more weight on a weight-based one.
- **Services.** Packing, packing materials, storage and specialty items, the things that need special handling, usually add to the price.
- **Access.** Stairs, elevators, a long carry between your door and the truck, or a smaller shuttle truck when the main truck can't reach your home can each add charges.
- **Timing and season.** Some movers charge different rates at different times of year, so ask whether your moving date changes the price.
- **Valuation.** On a move between states, full value protection, the mover's default level of liability for loss or damage, is priced in the mover's tariff. The lower, released level costs nothing extra but can pay far less.
- **Extra charges.** Anything the written estimate doesn't list, such as a service you add later, can add to the bill. Ask each mover to put every charge in writing.

[Verify: practice statements with no primary source: the hourly and weight-based split, home size as a shorthand, services usually adding to the price, and seasonal rates. The rate-card fields proposed on the method page (content/pages/costs/calculator-method.md, "What a rate card holds") include seasonal rates, which is a proposal, not evidence of practice. The reviewer confirms each. C18 (verified-excerpt) for packing, stair, elevator, long-carry and shuttle charges as extra services priced in the tariff on interstate moves; 49 U.S.C. 13702; 49 CFR 375.401(f); Part 375 Appendix A glossary. C10 (verified-excerpt) for valuation; 49 U.S.C. 14706(f); 49 CFR 375.201; FMCSA valuation page. C3 and C5 (verified-excerpt) for charges beyond the estimate; 49 CFR 375.403, 375.405.]

[How movers charge](/moving-costs/how-movers-charge/) covers the detail. It explains how hourly and weight-based prices are built, the binding and non-binding estimates an interstate mover can give and how far each lets the final bill move, and how valuation, extra charges and deposits work. It also lists the documents to expect on a move between states.

## Local versus long-distance moves

Our ranges and our calculator sort moves into these types:

| Move type | When it applies |
|---|---|
| Local | Same state, no more than {{setting.local_radius_miles}} miles apart |
| In-state long distance | Same state, more than {{setting.local_radius_miles}} miles apart |
| Interstate | Different states, whatever the distance |

These types describe distance, not which rules apply. That depends on the route: moves between states follow federal rules, and moves within one state follow that state's rules. How movers charge explains [which rules apply to your move](/moving-costs/how-movers-charge/#which-rules-apply-to-your-move).

[Counsel: how to label local, in-state long-distance and interstate moves so readers don't infer which rules apply from distance (consumer-moving-rules note, counsel item 6). The labels and help text match the calculator's route summary and the method page; lead lifecycle §3 sets the local radius behind the setting] [Verify: C16 (verified-excerpt); FMCSA "What is an interstate move?": Part 375 covers interstate moves, including a move between two places in one state that passes through another state, and states regulate moves within their borders.]

### Local moves

Local moves are usually charged by the hour. The bill then depends on how many movers come, how long the job takes and any travel time or truck fee, so anything that slows the job, such as stairs or a long carry, raises the price. [Costs for local moves](/moving-costs/local/) goes into local prices in more detail, and How movers charge explains [hourly pricing](/moving-costs/how-movers-charge/#how-do-movers-charge-for-local-moves) and what to ask about it.

[Verify: practice statements with no primary source (How movers charge brief SR-02 and SR-11); "anything that slows the job raises the price" is an inference from hourly pricing. The reviewer confirms them.]

### Long-distance moves

In our terms, long-distance moves are in-state long-distance and interstate moves. They're mainly charged by the shipment's weight and the distance, plus services such as packing. On a move between states, the mover's rates are in its tariff, the published list of its rates and charges, and the kind of written estimate, binding or non-binding, decides how far the final bill can move from the estimate. Long moves within one state follow that state's rules instead. [Costs for long-distance moves](/moving-costs/long-distance/) goes into long-distance prices in more detail, and How movers charge explains [weight-based pricing](/moving-costs/how-movers-charge/#how-do-movers-charge-for-interstate-moves) and estimates.

[Verify: "mainly by weight and distance" summarizes practice (C5, C9; How movers charge brief SR-03). C18 (verified-excerpt) for the tariff; 49 U.S.C. 13702(a)(2). C1, C3 and C5 (verified-excerpt) for estimate types; 49 CFR 375.401, 375.403, 375.405. C16 (verified-excerpt) for moves within one state. Lead lifecycle §3 defines "long-distance" in marketing copy as in-state beyond the local radius plus interstate.]

## How do you get an accurate price?

### Get written estimates after a survey

Only a mover can price your move, and it can price it accurately only once it knows what you're moving. For a move between states, the mover must survey your belongings before it gives you a written estimate, in person or by live or recorded video, unless you waive the survey in writing. The estimate must say whether it's binding or non-binding, and you both sign it. For a local move, ask each mover to see your home, in person or by video, before it puts a price in writing.

How movers charge explains [why a survey comes first](/moving-costs/how-movers-charge/#why-should-a-survey-come-before-the-estimate), and [our guide to moving estimates](/guides/moving-estimates-explained/) goes further.

[Verify: C1 (verified-excerpt); 49 CFR 375.401(a), (b), (h). C2 is contradicted as first worded (the 50-mile rule); this copy follows the claim as corrected, from 49 CFR 375.103 ("physical survey") and 375.401(a), as revised by 87 FR 24431 (April 26, 2022).] [Counsel: FMCSA's red-flag page speaks of an on-site inspection, while 49 CFR 375.103 counts video surveys as physical surveys. Decide how to word the survey here and in "Red flags around price", and how to note the difference (consumer-moving-rules note, counsel item 3)]

### Compare estimates like for like

Estimates compare only when they price the same move. Check that each one covers the same belongings, services and valuation, says whether it's binding or non-binding, and says how the mover saw your home. When one estimate is far below the others, ask that mover why. How movers charge has a table for [comparing quotes like for like](/moving-costs/how-movers-charge/#how-do-you-compare-quotes-like-for-like).

### Questions to ask movers about price

- Will you see my belongings, in person or by video, before you give me a written estimate?
- Is your estimate binding or non-binding, and what could make my final bill different from it?
- How are you pricing my move: by the hour, or by weight and distance?
- What does the price include, and what would cost extra at either home?
- What valuation does the price assume, and what would more coverage cost?
- Do you want a deposit, and how can I pay on moving day?

To compare written estimates from more than one mover, [request quotes from movers](/get-quotes/) who serve your move. Movers contact you directly, and [Which companies receive my request](/which-companies-receive-my-request/) explains who can receive your details.

## Red flags around price

The Federal Motor Carrier Safety Administration (FMCSA) lists warning signs on its Protect Your Move site. These touch on price ([FMCSA: Spot the red flags](https://www.fmcsa.dot.gov/protect-your-move/red-flags)):

- an estimate given over the phone or online, sight unseen, without an on-site inspection of your belongings;
- no written estimate, or a price set only after your belongings are loaded;
- a demand for cash, or for a large deposit, before the move;
- a claim that you have more goods than the mover estimated.

FMCSA doesn't say how large a deposit is too large. Its [tips for a successful move](https://www.fmcsa.dot.gov/protect-your-move/tips-for-success) also advise avoiding movers whose ads don't show a USDOT number. You can [check a mover's federal record](/verify-a-mover/) before you pay anything, and [our guide to avoiding moving scams](/guides/how-to-avoid-moving-scams/) covers other warning signs.

[Verify: C14 (verified-excerpt); the four items are paraphrased from search excerpts of FMCSA's "Spot the Red Flags", so check each against the live page before quoting. The USDOT advice sits on FMCSA's tips page, not in the red-flag list (C14 notes). C17 (verified-excerpt): FMCSA gives no deposit threshold.] [Counsel: the same on-site wording question as in "Get written estimates after a survey" (consumer-moving-rules note, counsel item 3)]

## See a planning range for your move

Our [cost calculator](/moving-cost-calculator/) shows a planning range for a move like yours, built from rate cards that movers in our network give us. You enter your home size and the ZIP codes you're moving from and to, and you can add any services you want priced. It shows the range before asking for any contact details; you give those only if you go on to request quotes from movers. Where too few movers' rate cards cover your move, it says so instead of showing a range.

Every range the calculator shows carries this label:

<!-- ST-7 -->
> **Planning range, not a quote:** {{cost.result.range}} for {{cost.result.scope}}. Based on {{cost.result.basis}}; data as of {{cost.result.as_of}}; model {{cost.model.version}}. [How this range is calculated]

[Build: on this page ST-7 renders as a specimen, with placeholders such as [low] to [high] and never sample figures or raw tokens, as on the method page (site architecture §4.1 G10). Its link opens /moving-cost-calculator/method/#how-is-the-range-built] [Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate", and the ST-1 notes ask whether "planning range" is the right label. Counsel approves this section, ST-7 and the ranges table's wording (consumer-moving-rules note, counsel item 1)]

[How the calculator works](/moving-cost-calculator/method/) explains how each range is built, where the data comes from and when it's updated.

## Why we show ranges, not prices

A mover prices your move from what it sees and what you ask for, so a figure from anyone else can only be a guide. A range shows how movers' prices differ for a typical move like yours, with its source and date, instead of one figure that looks more certain than it is.

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

[Counsel: approve ST-6 (site architecture §6.3 rule 3; stored-texts ST-6 notes). It renders here and inside the ranges block, so a quoted table keeps it]

American Moving Choice isn't a mover or a broker: movers in our network pay us for the requests they buy, you pay us nothing, and [How AMC makes money](/advertising-disclosure/) explains what their payment never changes.

[Counsel: this sentence condenses ST-1a's role-and-money facts, as content/README.md §9 allows ("one sentence and a link"). Confirm it, or replace it with ST-1b (site architecture §7.1; implications §3.4)]

## Sources and data notes

[Verify: every official page below was found through search excerpts on October 28, 2026; none was opened directly (consumer-moving-rules note, "Fetching"). Open each page, confirm the wording this page relies on, and update its access date before publishing. Replace the Cornell copies with uscode.house.gov links once checked.]

**FMCSA guidance**

- [Spot the red flags](https://www.fmcsa.dot.gov/protect-your-move/red-flags), Protect Your Move. Accessed October 28, 2026.
- [Tips for a successful move](https://www.fmcsa.dot.gov/protect-your-move/tips-for-success), Protect Your Move. Accessed October 28, 2026.
- [What is an interstate move?](https://www.fmcsa.dot.gov/consumer-protection/protect-your-move/are-you-moving/what-interstate-move) Accessed October 28, 2026.
- [Valuation](https://www.fmcsa.dot.gov/protect-your-move/valuation-insurance), Protect Your Move. Accessed October 28, 2026.
- [Glossary](https://www.fmcsa.dot.gov/protect-your-move/glossary), Protect Your Move: stair (flight), long-carry and shuttle charges. Accessed October 28, 2026.

**Federal rules**

- [49 CFR 375.103](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-A/section-375.103): definitions, including "physical survey". Accessed October 28, 2026.
- [49 CFR 375.201](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-B/subject-group-ECFRaf957489d1c5963/section-375.201): the mover's liability for loss or damage. Accessed October 28, 2026.
- [49 CFR Part 375, subpart D](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D), including [375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401), [375.403](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.403) and [375.405](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.405): written estimates. Accessed October 28, 2026.
- [49 U.S.C. 13702](https://www.law.cornell.edu/uscode/text/49/13702) (Cornell Law School copy): tariffs. Accessed October 28, 2026.
- [49 U.S.C. 14706](https://www.law.cornell.edu/uscode/text/49/14706) (Cornell Law School copy): carrier liability. Accessed October 28, 2026.
- [FMCSA final rule, 87 FR 24431](https://www.federalregister.gov/documents/2022/04/26/2022-08808/implementation-of-household-goods-working-group-recommendations), April 26, 2022: surveys for every interstate shipment, in person or by video. Accessed October 28, 2026.

**About our ranges**

- **Where they come from.** Rate cards that movers in our network give us. We never treat figures that other companies publish as our data.
- **What each row tells you.** What it covers, its source, how many movers it rests on and the date of its data. A range that rests on too few movers isn't shown.
- **Who's responsible.** {{page.data_owner}}, this page's data owner, is responsible for the ranges, their sources and keeping them current.
- **How they're built and updated.** [How the calculator works](/moving-cost-calculator/method/) has the method, the thresholds, the current version and the changelog.
- **Move types.** Local, in-state long distance and interstate are distance labels from our calculator, not legal categories.
