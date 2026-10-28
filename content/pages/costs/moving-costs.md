---
id: costs-moving-costs
url: /moving-costs/
family: Cost guide
title: "How Much Do Movers Cost? Ranges and What Drives the Price"   # 57 characters, so no brand suffix (site architecture §8.2)
meta_description: "What decides the cost of hiring movers: distance, home size, services, access and timing. Ranges by home size and move type, each with its source and date."   # 155 characters. Page-specific facts, no figure: the page rule bars hand-typed figures (brief §8)
h1: "How much do movers cost?"
breadcrumb: "Home › Moving costs"
indexation: index once it passes editorial review and the ranges table passes its data gate   # site architecture §1.2, Cost guide row; §6.3 rule 4
schema: [Article, WebPage, BreadcrumbList]   # Article.author = Person ({{page.author}}, url = author page); the WebPage node carries reviewedBy = Person ({{page.reviewer}}); dates match the visible dates (site architecture §8.5). Never FAQPage, HowTo or Dataset
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
stored_texts: [ST-6, ST-7]               # ST-6 twice: inside the ranges block and in "Why we show ranges, not prices". ST-7 as a specimen in the calculator section. The role line is ST-1e, now held in content/stored-texts.md as proposed; it joins this list once counsel approves it (brief open item 15)
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
  - "Owner + data owner: the area each row covers. The calculator counts movers by origin state (build plan §7.3; method page, 'Which movers count'), single-state rows never appear on this page, and a row labeled national could rest on 5 movers anywhere. Default shown: undecided, so no row can pass yet; one option is an area of several states that the scope names, with at least 5 movers in each, never labeled national (site architecture §6.3 rules 1 and 2(a), §1.2, §11; implications §7.5; brief §8)"
  - "Owner: publish the page without the table until a row passes, as site architecture §4.1 G4 lets a state hub do; default shown: the page waits at the gate (site architecture §6.3 rule 4). Publishing first changes the answer, the title, the meta description, the second ST-6 and the target for keyword map line 56 (brief §8)"
  - "Data owner: the distance band behind each long-distance row, the unit and any minimum charge in each range, and a section on the method page that says how these rows are built (site architecture §6.3 rules 1 and 5; implications §7.2)"
  - "Data owner: the exclusions these rows share with the calculator ('Like the calculator's ranges, these leave out …'); default shown: the method page's v1 list, itself a proposal (brief §8)"
  - "Counsel: approve ST-6 and ST-7, including ST-6's closing clause, since a non-binding estimate's final charges can be higher than the estimate (site architecture §6.3 rules 3 and 5; stored-texts notes; method brief open item 21)"
  - "Counsel: whether ranges, tables or calculators count as providing an estimate, and 'planning range' as the label, covering the answer block, the calculator section and the ranges table (compliance facts §2; consumer-moving-rules note, counsel item 1)"
  - "Counsel: labels for local, in-state long-distance and interstate moves (consumer-moving-rules note, counsel item 6)"
  - "Counsel: FMCSA's on-site red-flag wording against video surveys under 49 CFR 375.103 (consumer-moving-rules note, counsel item 3)"
  - "Counsel: the role line, which restates ST-1a outside the stored record; held in content/stored-texts.md as the proposed ST-1 variant ST-1e, which also replaces How movers charge's first two sentences under 'Where does American Moving Choice fit?', and rendered by key once approved (stored-texts.md header and ST-1e; site architecture §7.1; implications §3.4; brief open item 15)"
  - "Reviewer: the practice statements (local moves priced by the hour, longer moves by weight or volume and distance, home size as a shorthand, services usually adding to the price, seasonal rates), reworded or cut where the reviewer disagrees; each also needs a primary source before publishing (site architecture §6.2, §7.2; brief §8; open item 8)"
  - "Editorial: whether a distance rendered from setting.local_radius_miles may appear outside the gated block under the page rule (brief open item 6)"
  - "Owner: the review note's AI line and the author's 'Edited by' label; default shown: the editorial policy's defaults (content/pages/trust/editorial-policy.md, 'How we tell you')"
  - "Owner: name the author, a different reviewer and the data owner (brief §11 Q9; implications §11 Q17)"
  - "Owner + editorial: a meta description with no figure, against site architecture §8.2's data-point rule (page rule: no hand-typed figures)"
last_updated: null
---

# How much do movers cost?

What movers charge depends mainly on distance, move type, home size and services. Local moves are usually priced by the hour, longer moves mainly by weight or volume and distance. American Moving Choice doesn't publish cost ranges yet. With enough movers' rates, our calculator shows a planning range; only a mover can price your move, in a written estimate.

[Build: the third sentence renders from the state of the whole cost dataset, and every version keeps the answer within 40 to 60 words, counting hyphenated words as one (site architecture §6.3 rule 4, §7.4). While no range in the dataset passes, the calculator's included, it reads "American Moving Choice doesn't publish cost ranges yet." (59 words). Once a row of the ranges table passes, it reads "Some ranges from American Moving Choice are below." (59 words). If calculator ranges pass while no row here does, which only a page published without the table can show (brief §8), it reads "American Moving Choice shows no ranges on this page." (60 words)]

[Counsel: the answer's range and estimate wording: whether a planning range counts as providing an estimate, and "only a mover can price your move, in a written estimate", which the method brief proposes as ST-6's closing clause (compliance facts §2; consumer-moving-rules note, counsel item 1; method brief open item 21)]

[Verify: "usually priced by the hour" and "mainly by weight or volume and distance" summarize practice, and no primary source supports either as a national statement. C19 is California's rule for moves within that state (by the hour under 100 miles, by weight and mileage beyond), and C5 and C9 cover interstate estimates (weight or volume, and services). Before publishing, find primary sources, such as state tariff rules on hourly pricing for local moves and Part 375 Appendix A on weight or volume, and narrow the sentence to what they show. The reviewer, who needs relevant moving experience (site architecture §7.2), also confirms it (brief SR-02, SR-03; open item 8)]

Edited by {{page.author}} · Reviewed by {{page.reviewer}} · Data owner: {{page.data_owner}} · First drafted with AI

[Build: this review note renders from the page record, as the editorial policy specifies: the author's "Edited by" label and the AI line appear because AI drafted this page (`ai_assisted: true`). Show the published and last-updated dates from the CMS record beside it, and render the same dates in Article `datePublished` and `dateModified`; mark up the reviewer as `WebPage.reviewedBy` (content/pages/trust/editorial-policy.md, "How we tell you"; content/README.md §2; site architecture §7.3, §8.5)] [Owner: the AI disclosure form and the author's label on an AI-drafted page — default shown: a review-note AI line and "Edited by", as the editorial policy drafts them (new questions; editorial policy, "How we tell you")]

[Build: a sentence built around a link to a page that isn't published yet, such as a cost spoke, a guide or Verify a mover, renders only once that page is published, so no sentence sends readers to a page they can't open. Each such sentence stands alone so it can drop cleanly (site architecture §3.3 rule 2; content/README.md §8 item 5)]

<a id="by-home-size"></a>

## Typical ranges by home size and move type

[Data: omitted at publish unless rate cards from at least 5 movers per geography support it (site architecture §6.3); the page waits at the gate until then]

These ranges come from rate cards: what movers in our network tell us they charge. Each row says what it covers, where its data comes from, how many movers it rests on and how recent its data is. A row appears only when rate cards from at least {{cost.method.min_movers}} different movers in the area the row names support it. Each range is for the whole typical move its row describes, not a rate per hour or per pound.

[Data: the data owner defines the area behind each row, the distance band for long-distance rows, the unit (the whole typical move) and whether a range includes any minimum charge, and the method page adds how these rows are built before the table publishes. The rows assume the calculator's model and its list of what a range leaves out. Single-state rows never appear on this page: after the Wave 1 state cost keyword pull, state cost content goes to state hub sections or /moving-costs/{state}/ spokes (site architecture §1.2, §11; implications §7.5). The calculator counts movers by origin state (build plan §7.3), and a row labeled national could rest on 5 movers anywhere, so the owner and data owner choose each row's area: for example, several states that its scope names, with at least 5 movers in each and never labeled national. They also decide whether the page publishes without the table until a row passes (brief §8)]

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

[Build: rows render from the versioned cost dataset by metric ID (`cost.hub.<size>.<move_type>.<field>`, with the home-size keys of build plan §7.3 and the move types of lead lifecycle §3), using the calculator's model version. Each scope starts with the home size and move type, as ST-7's scope does, then names the area (every state it covers), the distance band for a long-distance row, the services included, the season and any minimum charge the range includes, so rows scan by home size. A row whose range doesn't pass is left out, never shown empty. If no row passes, this whole section, the anchor and ST-6 included, is omitted (site architecture §6.3 rules 1, 4 and 6). Each range links to the method page (site architecture §3.2, "Every number"). CI fails on two values for one metric ID or on a missing date (site architecture §6.3 rule 6). Below 768px the table becomes stacked cards (implications §8.2)]

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

[Counsel: approve ST-6, including its closing clause, since a non-binding estimate's final charges can be higher than the estimate; the method brief proposes "only a mover can price your move, in a written estimate" as a variant (site architecture §6.3 rule 3; method brief open item 21)]

Like the calculator's ranges, these leave out charges a mover sets after seeing your home, such as for stairs or a long carry, charges for valuation coverage, and tips. [What a range includes](/moving-cost-calculator/method/#what-does-a-range-include) lists everything.

## What affects the price of a move?

Movers, not American Moving Choice, set prices, and each one prices a move from what the job will take. These are the main things that change the price:

- **Distance and move type.** How far you're moving changes how movers price the job; see [local versus long-distance moves](#local-versus-long-distance-moves).
- **Home size and weight.** Home size is a shorthand for how much you're moving. More belongings mean more crew time on an hourly move, and a heavier or larger shipment on a move priced by weight or volume.
- **Services.** Packing, packing materials, storage and specialty items (things that need special handling) usually add to the price.
- **Access.** Stairs, elevators, a long carry between your door and the truck, or a smaller shuttle truck when the main truck can't reach your home can each add charges.
- **Timing and season.** Some movers charge different rates at different times of year, so ask whether your moving date changes the price.
- **Valuation.** On a move between states, full value protection, the mover's default level of liability for loss or damage, is priced in the mover's tariff. The lower, released level costs nothing extra but can pay far less ([49 U.S.C. 14706](https://www.law.cornell.edu/uscode/text/49/14706); [13702](https://www.law.cornell.edu/uscode/text/49/13702); [FMCSA: valuation](https://www.fmcsa.dot.gov/protect-your-move/valuation-insurance)).
- **Extra charges.** On a move between states, some charges can be added to a binding or non-binding estimate, such as for services you ask for after the bill of lading (the contract for the move) is issued, and a non-binding estimate's final charges can come out higher ([49 CFR 375.403](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.403); [375.405](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.405)). Ask each mover to put every charge in writing; How movers charge explains [what a mover can add](/moving-costs/how-movers-charge/#what-extra-charges-can-a-mover-add).

[Verify: practice statements with no primary source: home size as a shorthand, services usually adding to the price, and seasonal rates. The method page's first version uses standard rates and may add seasonal rates later where enough movers give them (content/pages/costs/calculator-method.md, "Move month"), which is a proposal, not evidence of practice. The reviewer confirms each. C18 (verified-excerpt) for packing, stair, elevator, long-carry and shuttle charges as extra services priced in the tariff on interstate moves; 49 U.S.C. 13702; 49 CFR 375.401(f); Part 375 Appendix A glossary. C10 (verified-excerpt) for valuation; 49 U.S.C. 14706(f); 49 CFR 375.201; FMCSA valuation page. C3, C5, C6 and A2 (verified-excerpt) for charges added to either kind of estimate and for non-binding final charges above the estimate; 49 CFR 375.403, 375.405, 375.407. The bullet doesn't claim these are the only additions: impracticable-operations charges (A2) and extra charges a mover didn't settle before the bill of lading, billed after 30 days (C18), are on How movers charge.]

[How movers charge](/moving-costs/how-movers-charge/) covers the detail. It explains how hourly and weight-based prices are built, the binding and non-binding estimates an interstate mover can give and how far each lets the final bill move, and how valuation, extra charges and deposits work. It also lists the documents to expect on a move between states.

<a id="local-versus-long-distance-moves"></a>

## Local versus long-distance moves

Our ranges and our calculator sort moves into these types:

| Move type | When it applies |
|---|---|
| Local | Same state, no more than {{setting.local_radius_miles}} miles apart |
| In-state long distance | Same state, more than {{setting.local_radius_miles}} miles apart |
| Interstate | Different states, whatever the distance |

These types don't decide which rules apply. Federal rules cover moves between states, with some exceptions, and also some moves within one state ([FMCSA: What is an interstate move?](https://www.fmcsa.dot.gov/consumer-protection/protect-your-move/are-you-moving/what-interstate-move); [FMCSA handbook, October 2023](https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2023-10/FMCSA_R&R_Handbook_Web_v1.pdf)). How movers charge explains [which rules apply to your move](/moving-costs/how-movers-charge/#which-rules-apply-to-your-move).

[Counsel: how to label local, in-state long-distance and interstate moves so readers don't infer which rules apply from our move types (consumer-moving-rules note, counsel item 6). The labels and help text match the calculator's route summary and the method page; lead lifecycle §3 sets the local radius behind the setting] [Owner: editorial confirms that a distance rendered from setting.local_radius_miles may appear outside the gated block, although the page rule keeps numbers to cost.* tokens inside it — default shown (new question; brief open item 6). If not, the Local row says "a short move within one state" and How the calculator works gives the distance] [Verify: C16 (verified-excerpt). FMCSA "What is an interstate move?": Part 375 covers interstate moves, including a move between two places in one state that passes through another state, and states regulate moves within their borders. FMCSA booklet, 2013 edition (no longer cited, since it predates the 2022 rule): Part 375 doesn't apply within a commercial zone, even one that crosses a state line (FMCSA's example is a move from Brooklyn, New York, to Hackensack, New Jersey), or between two places in one state. Confirm both in the October 2023 handbook now linked; if it lacks the commercial-zone exception, drop "with some exceptions" and the handbook link rather than cite the 2013 edition (counsel item 3).]

### Local moves

Local moves are usually charged by the hour. [Costs for local moves](/moving-costs/local/) goes into local prices in more detail. How movers charge explains [hourly pricing](/moving-costs/how-movers-charge/#how-do-movers-charge-for-local-moves) and what to ask about it.

[Verify: a practice statement with no primary source (brief SR-02; How movers charge brief SR-02). The reviewer confirms it, and it needs a primary source before publishing.]

### Long-distance moves

In our terms, long-distance moves are in-state long-distance and interstate moves. Longer moves are mainly charged by the shipment's weight or volume and the distance, plus services such as packing. A move across a state line can be short, though, so ask each mover how it will price yours. A long move within one state follows that state's rules, unless the shipment passes through another state ([FMCSA: What is an interstate move?](https://www.fmcsa.dot.gov/consumer-protection/protect-your-move/are-you-moving/what-interstate-move)). [Costs for long-distance moves](/moving-costs/long-distance/) goes into long-distance prices in more detail. How movers charge explains [weight-based pricing](/moving-costs/how-movers-charge/#how-do-movers-charge-for-interstate-moves) and the estimates an interstate mover can give.

[Verify: "mainly by weight or volume and the distance" summarizes practice. C5 and C9 cover interstate estimates (weight or volume, and services) and C19 California's longer in-state moves (weight and mileage); no source covers every long-distance move, and none covers short interstate moves, whose formula the method page leaves to the data owner ([Data] marker under "How is the range built?"). The reviewer confirms it, and it needs a primary source before publishing (brief SR-03, SR-23). C16 (verified-excerpt) for moves within one state and the routing rule; FMCSA "What is an interstate move?". Lead lifecycle §3 defines "long-distance" in marketing copy as in-state beyond the local radius plus interstate, and an interstate move as one between states, whatever the distance.]

## How do you get an accurate price?

Get written estimates from more than one mover, each made after the mover sees your belongings in person or by video, and compare them like for like.

### Get written estimates after a survey

Only a mover can price your move, and it can price it accurately only once it knows what you're moving. For a move between states, the mover must survey your belongings before it gives you a written estimate, in person or by live or recorded video, unless you waive the survey in writing. The estimate must say whether it's binding or non-binding, and you both sign it ([49 CFR 375.103](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-A/section-375.103); [375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401); [87 FR 24431](https://www.federalregister.gov/documents/2022/04/26/2022-08808/implementation-of-household-goods-working-group-recommendations)). For a local move, ask each mover to see your home, in person or by video, before it puts a price in writing.

How movers charge explains [why a survey comes first](/moving-costs/how-movers-charge/#why-should-a-survey-come-before-the-estimate). [How to compare moving estimates](/questions/how-to-compare-moving-estimates/) explains what to check in written quotes.

[Verify: C1 (verified-excerpt); 49 CFR 375.401(a), (b), (h). C2 is contradicted as first worded (the 50-mile rule); this copy follows the claim as corrected, from 49 CFR 375.103 ("physical survey") and 375.401(a), as revised by 87 FR 24431 (April 26, 2022).] [Counsel: FMCSA's red-flag page speaks of an on-site inspection, while 49 CFR 375.103 counts video surveys as physical surveys. Decide how to word the survey here, in the answer under "How do you get an accurate price?" and in "Red flags around price", and how to note the difference (consumer-moving-rules note, counsel item 3)]

### Compare estimates like for like

Estimates compare only when they price the same move. Check that each one covers the same belongings, services and valuation, says whether it's binding or non-binding, and says how the mover saw your home. When one estimate is far below the others, ask that mover why. How movers charge has a table for [comparing quotes like for like](/moving-costs/how-movers-charge/#how-do-you-compare-quotes-like-for-like).

### Questions to ask movers about price

- Will you see my belongings, in person or by video, before you give me a written estimate?
- Is your estimate binding or non-binding, and what could make my final bill different from it?
- How are you pricing my move: by the hour, or by weight or volume and distance?
- What does the price include, and what would cost extra at either home?
- What valuation does the price assume, and what would more coverage cost?
- Do you want a deposit, and how can I pay at delivery?

To compare written estimates from more than one mover, [request quotes from movers](/get-quotes/) who serve your move. Movers that buy your request contact you directly, and [Which companies receive my request](/which-companies-receive-my-request/) explains who can receive your details.

## Red flags around price

The Federal Motor Carrier Safety Administration (FMCSA) lists warning signs on its Protect Your Move site. The ones below touch on price ([FMCSA: Spot the red flags](https://www.fmcsa.dot.gov/protect-your-move/red-flags)):

- an estimate given over the phone or online, sight unseen, without an on-site inspection of your belongings;
- no written estimate, or a price set only after your belongings are loaded;
- a demand for cash, or for a large deposit, before the move;
- a claim that you have more goods than the mover estimated.

FMCSA doesn't say how large a deposit is too large. Its [tips for a successful move](https://www.fmcsa.dot.gov/protect-your-move/tips-for-success) also advise avoiding movers whose ads don't show a USDOT number. You can [check a mover's federal record](/verify-a-mover/) before you pay anything. [How to spot a moving scam](/questions/how-to-spot-a-moving-scam/) covers other warning signs.

[Verify: C14 (verified-excerpt); the four items are paraphrased from search excerpts of FMCSA's "Spot the Red Flags", so check each against the live page before quoting. The USDOT advice sits on FMCSA's tips page, not in the red-flag list (C14 notes). C17 (verified-excerpt): FMCSA gives no deposit threshold.] [Counsel: the same on-site wording question as in "Get written estimates after a survey" (consumer-moving-rules note, counsel item 3)]

## See a planning range for a move like yours

Our [cost calculator](/moving-cost-calculator/) shows a planning range for a move like yours, built from rate cards that movers in our network give us. You enter your home size and the ZIP codes you're moving from and to, and you can add packing, storage or specialty items. It shows the range before asking for any contact details; you give those only if you go on to request quotes from movers. Where too few movers' rate cards cover your move, it says so instead of showing a range.

Every range the calculator shows carries this label:

<!-- ST-7 -->
> **Planning range, not a quote:** {{cost.result.range}} for {{cost.result.scope}}. Based on {{cost.result.basis}}; data as of {{cost.result.as_of}}; model {{cost.model.version}}. [How this range is calculated]

[Build: on this page ST-7 renders as a specimen, with placeholders such as [low] to [high] and never sample figures or raw tokens, as on the method page (site architecture §4.1 G10). Its link opens /moving-cost-calculator/method/#how-is-the-range-built] [Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate", and the ST-1 notes ask whether "planning range" is the right label. Counsel approves this section, ST-7 and the ranges table's wording (consumer-moving-rules note, counsel item 1)]

[How the calculator works](/moving-cost-calculator/method/) explains how each range is built, where the data comes from and when it's updated.

## Why we show ranges, not prices

A mover prices your move from what it sees and what you ask for, so a figure from anyone else can only be a guide. A range shows how movers' stated rates differ for a typical move like yours, with its source and date, instead of one figure that looks more certain than it is.

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

[Counsel: approve ST-6, including its closing clause, since a non-binding estimate's final charges can be higher than the estimate; the method brief proposes "only a mover can price your move, in a written estimate" as a variant (site architecture §6.3 rule 3; stored-texts ST-6 notes; method brief open item 21). It renders here and inside the ranges block, so a quoted table keeps it]

American Moving Choice isn't a moving company or a moving broker: movers in our network pay us for the requests they buy, you pay us nothing, and [How AMC makes money](/advertising-disclosure/) explains what their payment never changes.

[Counsel: this line restates ST-1a's role and money facts outside the stored record. The stored-texts header says a page quotes a stored text by key and never paraphrases it, and a free sentence can't pass the build check that matches body text to the record (site architecture §7.1; implications §3.4). So the line, worded as above, is held in content/stored-texts.md as the proposed ST-1 variant ST-1e, beside the proposed ST-1d; ST-1e also replaces the first two sentences of How movers charge's "Where does American Moving Choice fit?", which carry the same marker. Once counsel approves the variant, the line renders from the record after an `<!-- ST-1e -->` key comment and joins stored_texts; until then counsel reviews it with ST-1a in one pass. "Isn't … a moving broker" is a legal conclusion about AMC (stored-texts ST-1 notes; carrier-vs-broker note, counsel items 1 to 4; brief open item 15)]

## Sources and data notes

[Verify: every official page below was found through search excerpts on October 28, 2026; none was opened directly (consumer-moving-rules note, "Fetching"). Open each page, confirm the wording this page relies on, and update its access date before publishing. Replace the Cornell copies with uscode.house.gov links once checked.]

**FMCSA guidance**

- [Spot the red flags](https://www.fmcsa.dot.gov/protect-your-move/red-flags), Protect Your Move. Accessed October 28, 2026.
- [Tips for a successful move](https://www.fmcsa.dot.gov/protect-your-move/tips-for-success), Protect Your Move. Accessed October 28, 2026.
- [What is an interstate move?](https://www.fmcsa.dot.gov/consumer-protection/protect-your-move/are-you-moving/what-interstate-move) Accessed October 28, 2026.
- [Your Rights and Responsibilities When You Move](https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2023-10/FMCSA_R&R_Handbook_Web_v1.pdf), handbook, October 2023 (PDF): the commercial-zone exception and moves within one state, to confirm before publishing. Accessed October 28, 2026.
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
- **What each row tells you.** What it covers, its source, how many movers it rests on and the date of its data. A range that rests on too few movers in its area isn't shown.
- **Who's responsible.** {{page.data_owner}}, this page's data owner, is responsible for the ranges, their sources and keeping them current.
- **How they're built and updated.** [How the calculator works](/moving-cost-calculator/method/) has the method, the thresholds, the current version and the changelog.
- **Move types.** Local, in-state long distance and interstate are the categories our ranges and calculator use, not legal categories. How movers charge explains which rules apply to a move.
