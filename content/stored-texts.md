# Stored texts

**Status:** working drafts, 2026-10-28. Counsel writes and approves the final wording (site architecture §7.1; implications §3.4). Each text becomes one versioned record that every surface renders, so a page quotes it by key and never paraphrases it. The consent screen hashes the version it showed into the consent record (lead lifecycle §6).

When a page needs different wording, don't edit the text in place. Propose a variant here, with the reason, so counsel reviews one list.

---

## ST-1 Role-and-money statement

It replaces the three role wordings in consent draft §1, site architecture §7.1 and brief §1, and drops the bare "licensed" in consent draft §1 (implications D4, §3.4). It has three lengths, all one record.

### ST-1a Full statement

Renders on "How AMC makes money", inside the consent block, on the confirmation page, in the footer and in the Organization `description`.

> American Moving Choice is an online service that connects people planning a move with moving companies in our network. We are not a moving company or a moving broker. We don't transport belongings, give estimates, or arrange or book moves. Movers in our network pay us for the move requests they choose to buy. What a mover pays never changes its screening result, its ratings, how its reviews are shown, or where it appears in our directory, on our location pages or in the list of movers you see before you send a request.

### ST-1b Money line

The one line allowed between the lede and the first survey field, and under the first screen's call to action (implications §3.4, §8.2, §8.4). It links to `/advertising-disclosure/`.

> Free to use. Movers in our network pay us for the requests they buy, and payment never changes their screening, ratings or order. [How AMC makes money]

### ST-1c Meta description

Only for the home, About and "How AMC makes money" pages (site architecture §8.2). 151 characters.

> American Moving Choice is a service, not a mover or broker. Movers pay us for the requests they buy; payment never changes screening, ratings or order.

**Notes for counsel**
- "Estimates": the cost calculator shows planning ranges built from movers' rate cards. Does ST-1a's "don't … give estimates" hold with the calculator live, and is "planning range" the right label (compliance facts §2)?
- "Free to use" rests on consumers paying AMC nothing (brief §1).
- "Where it appears" covers order. Whether a mover appears at all also depends on an active account in good standing (lead lifecycle §3 item 1), which "How AMC makes money" states.

---

## ST-2 Movers-only statement

Renders on survey entry modules, the directory, profiles, `/how-we-verify-movers/` and `/for-movers/`. It replaces consent draft §2.

> **Movers only, no brokers.** Every company in our network must show active household-goods carrier authority and no broker authority on its federal (FMCSA) record, give us its USDOT and MC numbers, and agree not to resell your request or hand your move to another company. We recheck federal records every week. [How we verify movers]

**Notes**
- The MC number is a platform rule behind the `require_mc_number` setting, on by default. Some legitimate local movers hold only state credentials, and FMCSA has proposed ending MC numbers (mover verification §1; compliance facts §1). If the setting turns off, the text drops "and MC". [Counsel: confirm phrasing, as consent draft §2 already asks.]
- On profiles and lists, the "no brokers" claim renders only while the latest authority check passed (implications §4.1). [Build: hide the claim if the weekly check fails to run.]

---

## ST-3 Paid-relationship line for lists

Sits inside the list block on directory, location (geo) and comparison pages, so a quoted list keeps it (implications §3.4; site architecture §7.4).

> Every mover listed here pays American Moving Choice for the move requests it buys, and only movers with active accounts are listed. How much a mover buys or spends never affects whether or where it appears. [How this list is ordered]

**Notes**
- "How this list is ordered" links to the published sort rule (site architecture §1.2, directory row).
- Implications §9.2 records that billing standing already decides who can be named, so the line says only active accounts are listed.

---

## ST-4 The count question explained

### ST-4a Count-screen helper text

Sits under "How many moving companies would you like to hear from?" It extends consent draft §4 with implications §2.3 and §3.3.

> This is the most movers who can receive your details. Choose 1 and only one mover can ever receive them. Choose 2 or more and up to that many can. It's a maximum, not a promise that you'll hear from that many. Numbers higher than the movers available for your move are shown but can't be chosen.

### ST-4b Short form

For the review screen, the confirmation page and "Which companies receive my request".

> Choose 1 and only one mover can ever receive your details; choose more and up to that many can. Only movers named on the review screen can buy your request, and it's never resold.

**Notes**
- No option is preselected, and every option gets equal weight (implications §2.3 item 4).
- "Never resold" follows shared pricing §1 and implications §3.3. It is not the "never sell" line that waits on counsel (implications §3.7).
- [Counsel: implications §3.3 asks whether choosing 1 means (a) the consumer also picks the mover, or (b) any listed mover may buy and the first to buy gets it. ST-4b holds under both; the review screen copy differs.]

---

## ST-5 Badge explainer

Sits next to every badge, in an adjacent `<details>` (implications §4.3, §8.4). It replaces consent draft §8. The name is a token until counsel clears it (implications §5).

> **{{badge.name}}** means this mover passed our screening on {{company.verified_date}}: an active USDOT registration, active household-goods carrier authority, no broker authority, the insurance filings federal rules require, and agreement to our movers-only terms. Those insurance filings are minimum amounts, not full coverage for your belongings. We recheck federal records every week, and the badge comes off if a check fails. The badge doesn't rate work quality, prices or crews, and it isn't a government endorsement or a guarantee. Every mover in our network pays us for the requests it buys, but the badge isn't sold, and buying more never earns or keeps it. Customer reviews are shown separately. [Official FMCSA record] · [How we verify movers]

**Notes**
- Every approved mover gets the badge, and it takes no review, rating, tenure or spend input (implications §4.3; mover verification §4).
- [Counsel: implications §5.4 Q5 asks whether the badge needs a material-connection disclosure. The "pays us" sentence is the draft answer.]

---

## ST-6 Cost-block disclaimer

Every cost range, table and calculator result carries it (site architecture §6.3 rule 3; implications §7.2).

> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

**Notes**
- [Counsel: approve the wording, as site architecture §6.3 rule 3 asks.]
- No cost block says "instant", "best rate" or "save" (implications §7.2).

---

## ST-7 Calculator result label

Labels every range the calculator shows, in the widget and the results view alike, from one model version (site architecture §6.3 rules 5 and 6).

> **Planning range, not a quote:** {{cost.result.range}} for {{cost.result.scope}}. Based on {{cost.result.basis}}; data as of {{cost.result.as_of}}; model {{cost.model.version}}. [How this range is calculated]

**Notes**
- `{{cost.result.scope}}` states home size, move type and distance band, for example "a 2-bedroom home, interstate, 500 to 1,000 miles".
- `{{cost.result.basis}}` states the source and sample, for example "rate cards from 7 movers serving Texas".
- [Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate".]

---

## Default sentence for `{{pricing.revenue_relationship}}`

Implications §11 Q8 recommends a precise line on "How AMC makes money". The owner and counsel approve the final sentence after pilot pricing; until then, the draft uses this default, built from the sample prices in shared pricing §5:

> Our revenue from a request rises with each mover that buys it, up to the number you chose. With the sample prices we're testing, a request that only one mover can buy earns us more than a shared one unless four or five movers buy the shared one.

[Owner: replace with the real relationship once pilot prices are set — default shown (implications §11 Q8).]
