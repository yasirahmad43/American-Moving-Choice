# Stored texts

**Status:** working drafts, 2026-10-28. Counsel writes and approves the final wording (site architecture §7.1; implications §3.4). Each text becomes one versioned record that every surface renders, so a page quotes it by key and never paraphrases it. The Review and send screen hashes the version it showed into the consent record (lead lifecycle §6).

When a page needs different wording, don't edit the text in place. Propose a variant here, with the reason, so counsel reviews one list. A correction to a record that only pages in the trust group render may be made in place, with a dated note saying what changed and why, and every page that renders it changes in the same edit.

---

## ST-1 Role-and-money statement

It replaces the three role wordings in consent draft §1, site architecture §7.1 and brief §1, and drops the bare "licensed" in consent draft §1 (implications D4, §3.4). It has three lengths, all one record, and two proposed variants (ST-1d and ST-1e) for pages that restate it.

### ST-1a Full statement

Renders on "How AMC makes money", inside the consent block, on the confirmation page, in the footer and in the Organization `description`.

> American Moving Choice is an online service that connects people planning a move with moving companies in our network. We are not a moving company or a moving broker. We don't transport belongings, give estimates, or arrange or book moves. Movers in our network pay us for the move requests they choose to buy. You choose the maximum number of movers who may contact you and the contact channels they may use. Companies introduce themselves when they contact you. A mover's spending doesn't change our screening standards or your chosen contact limit.

### ST-1b Money line

The one line allowed between the lede and the first survey field, and under the first screen's call to action (implications §3.4, §8.2, §8.4). It links to `/advertising-disclosure/`. It also renders under the answer on "Which companies receive my request" and directly under the moving cost calculator's call to action (README §9).

> Free to use. Movers in our network pay us for the requests they buy. You choose how many may contact you, and their spending doesn't change our screening standards or your contact limit. [How AMC makes money]

### ST-1c Meta description

Only for the home, About and "How AMC makes money" pages (site architecture §8.2). 151 characters.

> American Moving Choice is a service, not a mover or broker. Movers pay us for requests; you choose how many may contact you.

### ST-1d Role list for Movers vs brokers (proposed)

Rendered as the list under "American Moving Choice and operating authority" on Movers vs brokers, which today restates ST-1a's role sentence as free text (Movers vs brokers brief §10 item 21).

> American Moving Choice holds no FMCSA operating authority, as a mover or as a broker. We don't transport belongings; arrange or book moves, or choose a mover for you; take deposits or handle any payment for your move; negotiate prices or terms, for you or for any mover; or give estimates or quotes.

### ST-1e Role line for cost pages (proposed)

For Moving costs, whose role line is held for counsel as a proposed ST-1e (Moving costs brief §10 item 15). ST-1e also replaces the first two sentences of How movers charge's "Where does American Moving Choice fit?", which restate the role and money facts freely.

> American Moving Choice isn't a moving company or a moving broker: movers in our network pay us for the requests they buy, you pay us nothing, and [How AMC makes money] explains what their payment never changes.

Once counsel approves ST-1d and ST-1e, the pages render them under `<!-- ST-1d -->` and `<!-- ST-1e -->` and list them in `stored_texts`. Until then the pages keep their current wording with their [Counsel] markers.

**Notes for counsel**
- "Estimates": the cost calculator shows planning ranges built from movers' rate cards. Does ST-1a's "don't … give estimates" hold with the calculator live, and is "planning range" the right label (compliance facts §2)?
- "Free to use" rests on consumers paying AMC nothing (brief §1).
- "Where it appears" covers order. Whether a mover appears at all also depends on an active account in good standing (lead lifecycle §3 item 1), which "How AMC makes money" states.
- [Counsel: "We are not … a moving broker" (ST-1a), "not a mover or broker" (ST-1c) and "isn't … a moving broker" (ST-1e) are legal conclusions about AMC. Florida §507.01(10) (2025 text) counts anyone who, for compensation, refers a shipper to a registered mover as a moving broker. 49 U.S.C. 13102(2) and 49 CFR 371.103 reach anyone who holds itself out as arranging transportation. FMCSA's 2023 broker guidance has no force of law (carrier-vs-broker note B1, B4, B17, B19; counsel items 1 to 4). Confirm these phrases, and "connects people … with moving companies in our network" under item 3, or approve the factual variant "We hold no FMCSA operating authority, as a mover or as a broker, and we don't transport belongings, give estimates, or arrange or book moves." ST-1d already uses that factual form.]
- [Counsel: reviews and order. Only consumers whose request a mover bought can review it, so buying more requests brings more review invitations and can bring more reviews. That can move a mover's rating values and how soon it reaches {{setting.rank_min_reviews}} eligible reviews for rating-sort priority (mover verification §6; site architecture §2.4 rule 3; How AMC makes money, "Which movers are listed?"; Review methodology, "Does payment affect reviews?"). Confirm ST-1a's "never changes … its ratings … or where it appears", ST-1b's and ST-1c's "ratings or order" and ST-3's "never affects whether or where it appears". Or approve a variant: either "never changes how its ratings are calculated, which submitted reviews we publish, or where it appears" (Review methodology brief §10 item 21), or "never an input" wording. ST-1a: "What a mover pays is never an input to its screening result, how its ratings are calculated, how its reviews are shown, or the rules that order our directory, our location pages and the list of movers you see before you send a request." ST-1b: "…and payment is never an input to their screening, ratings or order." ST-3: "How much a mover buys or spends is never an input to whether or where it appears."]
- [Counsel: "pay": a mover can buy a request wholly with promotional or goodwill credit (shared pricing §2 kind 4; lead lifecycle §7 step 2). Confirm "pay us" in ST-1a, ST-1b, ST-1c, ST-3 and ST-5.]

---

## ST-2 Movers-only statement

Renders on survey entry modules, the directory, profiles, `/how-we-verify-movers/` and `/for-movers/`. It replaces consent draft §2.

> **Movers only, no brokers.** Every company in our network must show active household-goods carrier authority and no broker authority on its federal (FMCSA) record, give us its USDOT and MC numbers, and agree not to resell your request or hand your move to another company. We recheck federal records every week. [How we verify movers]

**Notes**
- The MC number is a platform rule behind the `require_mc_number` setting, on by default. Some legitimate local movers hold only state credentials, and FMCSA has said it is considering no longer assigning MC numbers, a change it would first publish as a proposed rule for comment; none was found through 2026-10-28 (mover verification §1; compliance facts §1; carrier-vs-broker note B16, counsel item 9). If the setting turns off, the text drops "and MC". [Counsel: confirm phrasing, as consent draft §2 already asks.]
- On profiles and lists, the "no brokers" claim renders only while the latest authority check passed (implications §4.1). [Build: hide the claim if the weekly check fails to run.]
- [Counsel: carrier-vs-broker item 8(c): "no broker authority on its federal (FMCSA) record" rests on the broker status reading None on every linked docket, and brokers get no "authorized" designation (carrier-vs-broker note A1, B14).]
- If the owner requires household-goods carrier authority only where interstate moves are offered (mover verification §1 item 2, §3), ST-2 and ST-5 need variants.
- Implications §2.4 and lead lifecycle §2 step 8 put this line on Review and send, beside ST-1a; add that placement if adopted (build plan §7.2 lists only ST-1a). "Which companies receive my request" says Review and send shows it, with a [Build] marker.

---

## ST-3 Paid-relationship line for lists

Sits inside the list block on directory, location (geo) and comparison pages, so a quoted list keeps it (implications §3.4; site architecture §7.4).

> Eligible movers pay American Moving Choice for the requests they buy. Your chosen maximum and contact permissions still apply. [How AMC makes money]

**Notes**
- "How this list is ordered" links to the published sort rule (site architecture §1.2, directory row).
- Implications §9.2 records that billing standing already decides who can be named, so the line says only active accounts are listed.
- [Counsel: reviews and order, as in the ST-1 notes. Buying more requests brings more review invitations, which can move rating values and how soon a mover reaches {{setting.rank_min_reviews}} eligible reviews for rating-sort priority. Confirm "never affects whether or where it appears", or approve "How much a mover buys or spends is never an input to whether or where it appears."]

---

## ST-4 The count question explained

### ST-4a Count-screen helper text

Sits under "How many moving companies would you like to hear from?" It extends consent draft §4 with implications §2.3 and §3.3.

> This is the most movers who can receive your details. Choose 1 and only one mover can ever receive them from us. Choose 2 or more and up to that many can. It's a maximum, not a promise that you'll hear from that many. Numbers higher than the movers available for your move are shown but can't be chosen.

### ST-4b Short form

For the Review and send screen, the confirmation page and "Which companies receive my request".

> Choose 1 and only one mover can receive your details from us; choose more and up to that many can. Only eligible movers recorded for your request may buy it, within your chosen limit and contact permissions. Company names aren't shown before contact. We never resell your request beyond that limit, and every mover in our network agrees not to resell it.

**Notes**
- No option is preselected, every option gets equal weight, and no helper text favors any number, fewer movers or more (implications §2.3 item 4).
- "We never resell it" follows shared pricing §1 and implications §3.3 and covers AMC only; resale by a mover breaches its terms (consent draft §11 item 2). It is not the "never sell" line that waits on counsel (implications §3.7).
- [Counsel: implications §3.3 asks whether choosing 1 means (a) the consumer also picks the mover, or (b) any listed mover may buy and the first to buy gets it. ST-4b holds under both; the Review and send copy differs.]
- Changed 2026-10-28, in place, because only "Which companies receive my request" renders ST-4: ST-4a and ST-4b add "from us", since AMC can promise only its own conduct; ST-4b's passive "it's never resold" becomes "We never resell it, and every mover in our network agrees not to"; "review screen" becomes the step name "Review and send" (README §4). [Counsel: the mover term against resale is a summary for counsel to draft (consent draft §11 item 2).]

---

## ST-5 Badge explainer

Sits next to every badge, in an adjacent `<details>` (implications §4.3, §8.4). It replaces consent draft §8. The name is a token until counsel clears it (implications §5).

> **{{badge.name}}** means this mover passed our screening on {{company.verified_date}}: an active USDOT registration, active household-goods carrier authority, no broker authority, the insurance filings federal rules require, and agreement to our movers-only terms. Those insurance filings are minimum amounts, not full coverage for your belongings. We recheck federal records every week, and the badge comes off if a check fails or the mover's account is suspended for any reason, including unpaid charges. The badge doesn't rate work quality, prices or crews, and it isn't a government endorsement or a guarantee. Every mover in our network pays us for the requests it buys, but the badge isn't sold, and buying more never earns or keeps it. Customer reviews are shown separately. [This mover's FMCSA record] · [How we verify movers]

**Notes**
- Every approved mover gets the badge, and it takes no review, rating, tenure or spend input (implications §4.3; mover verification §4).
- [Counsel: implications §5.4 Q5 asks whether the badge needs a material-connection disclosure. The "pays us" sentence is the draft answer.]
- [Counsel: carrier-vs-broker note item 8: (a) "the insurance filings federal rules require", since household-goods contract carriers file liability insurance only (B11, A6); (b) "an active USDOT registration", while FMCSA has paused inactivating USDOT numbers for missed biennial updates due on or after June 1, 2026 (A2); (c) "no broker authority" rests on the broker status reading None on every linked docket (A1, B14).]
- Changed 2026-10-28, in place, because only How we verify movers renders ST-5 in the drafts: the badge also needs an account in good standing, so any suspension, non-payment included, removes it (mover verification §3, §4); the added clause discloses that beside the material-connection sentence. The link label "[Official FMCSA record]" becomes "[This mover's FMCSA record]", because README §5 bars "official" next to AMC's badge.

### ST-5b Badge summary (proposed)

Placed on "How AMC makes money", under "What payment never changes" (How AMC makes money brief §10 item 14). It replaces the page's own badge summary, word for word, so counsel reviews it as a record.

> We issue our badge, {{badge.name}}, only from our screening checks, and it comes off if the mover's account is suspended for any reason, including unpaid charges. Every mover in our network pays us for the requests it buys, but the badge isn't sold, and buying more never earns or keeps it.

---

## ST-6 Cost-block disclaimer

Every cost range, table and calculator result carries it (site architecture §6.3 rule 3; implications §7.2).

> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

**Notes**
- [Counsel: approve the wording, as site architecture §6.3 rule 3 asks.]
- No cost block says "instant", "best rate" or "save" (implications §7.2).
- [Counsel: "Movers set their own prices": California Maximum Rate Tariff 4 and Texas filed maximum-rate tariffs cap some in-state rates (consumer-moving-rules C7, C19 citations); How movers charge uses "Movers, not American Moving Choice, set prices".]
- [Counsel: the closing clause overstates a non-binding estimate, whose final charges come from the mover's tariff and can be higher (consumer-moving-rules note C5, C6). The proposed revision below fixes it. A fuller variant is also on the table: "Movers, not American Moving Choice, set prices, and we don't give quotes or estimates. These ranges are for planning only. Only a mover can price your move, in a written estimate, and a non-binding estimate can still change."]
- "These ranges" has nothing to refer to on a page without a cost block, such as How movers charge or the editorial policy's quotation; ST-6b below is for those pages.
- Pages keep ST-6 verbatim until counsel approves a revision.

### ST-6 proposed revision

> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover can price your move, in a written estimate.

Reason: final charges under a non-binding estimate can exceed it (49 CFR 375.405, 375.407; consumer-moving-rules C5, C6). The Moving costs and calculator answers already say "only a mover can price your move".

### ST-6b For pages without a cost block (proposed)

> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. Our calculator's ranges are for planning only; only a mover can price your move, in a written estimate.

---

## ST-7 Calculator result label

Labels every range from the cost model: in the calculator widget, its results view and, if adopted, the What we found step of the quote survey (implications §2.2), all from one model version (site architecture §6.3 rules 5 and 6). On content pages it renders as a specimen with placeholders, never figures (calculator method page; site architecture §4.1 G10).

> **Planning range, not a quote:** {{cost.result.range}} for {{cost.result.scope}}. Based on {{cost.result.basis}}; data as of {{cost.result.as_of}}; model {{cost.model.version}}. [How this range is calculated]

**Notes**
- `{{cost.result.scope}}` states home size, move type and distance band, for example "a 2-bedroom home, interstate, 500 to 1,000 miles".
- `{{cost.result.basis}}` states the source and sample, for example "rate cards from 7 movers serving Texas".
- [Counsel: compliance facts §2 asks whether ranges or calculators count as "providing an estimate".]
- [Counsel: site architecture §6.3 rule 1 also wants services and season stated; the pages list them beside the label. Approve that, or propose an ST-7 variant that names them.]
- [Counsel: a planning range at What we found sits inside the request flow, before contact details (consumer-moving-rules note, counsel item 1; compliance facts §2). Build plan §7.2 lists only the count and the names for that step; the owner decides (implications §2.2).]

---

## ST-8 Van-line agents (proposed)

Renders on How we verify movers ("Van-line agents") and Movers vs brokers ("What about van lines and their agents?"), which carried the rule as free text in two wordings (Movers vs brokers brief §10 item 23).

> If a van line's brand holds broker authority, the brand can't join our network. An agent that holds its own household-goods carrier authority, and no broker authority, can qualify on its own record. We record its legal identity and van-line relationship during screening. The company must identify itself when it contacts you.

**Notes**
- [Owner: implications §11 Q11 — default shown] [Owner and Counsel: whether a qualifying agent must carry out a move bought through us under its own authority and bill of lading, given the term that the carrier that quotes your move is the carrier that does it (implications §4.1, §9.4, §11 Q11; consent draft §11 item 2; mover verification §1 item 5)]
- Both pages render `<!-- ST-8 -->` with this one marker.

---

## Default sentence for `{{pricing.revenue_relationship}}`

Implications §11 Q8 recommends a precise line on "How AMC makes money". The owner and counsel approve the final sentence after pilot pricing; until then, the draft uses this default, built from the illustrative prices in shared pricing §5 (policy B: four buyers $82.50, five $100.00, against a $90.00 exclusive sale). Four buyers out-earn an exclusive sale only where the exclusive price is lower ($80.00 or $75.00 in the same table); the sentence uses the table's own exclusive alternative.

> Our revenue from a request rises with each mover that buys it, up to the number you chose. With the illustrative prices in our pricing proposal, a request that only one mover can buy earns us more than a shared one unless five movers buy the shared one.

[Owner: replace with the real relationship once pilot prices are set — default shown (implications §11 Q8).]
