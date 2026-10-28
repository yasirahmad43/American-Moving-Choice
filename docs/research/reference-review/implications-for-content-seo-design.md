# What the reference review means for AMC

**Status:** proposals for the owner, 2026-10-28. SA-1 to SA-20 (site architecture), B-1 to B-8 (brief §3) and the brief §8 note were applied on 2026-10-28 in this PR, with a few related edits that §10 marks applied. Every other change is proposed. §10 lists every change and its status.

This document turns the 11 reference-site reviews into decisions and document changes for American Moving Choice (AMC). Read §1 for the decisions, §2 to §9 for the detail, §10 for the change list and §11 for the owner's open questions. The evidence is in the site reviews ([sites/](sites/)), the method in the [README](README.md) and the requirement view in the [v2 matrix](../reference-matrix.md). Recommendations describe patterns for AMC to build in its own words. Legal points are questions for counsel, not conclusions.

**Short names.** All paths are under `docs/`.
- AMC documents:
  - brief (`00-discovery-brief.md`) and site architecture (`seo/site-architecture.md`);
  - consent draft, lead lifecycle, mover verification and shared pricing (`business-rules/`);
  - VD (`design/visual-direction.md`) and tile (`design/style-tile.html`);
  - JTBD, MVP scope and backlog (`product/`);
  - data model, and stack and architecture (`architecture/`);
  - compliance facts and keyword research (`research/`);
  - matrix (`research/reference-matrix.md`, v2). v1 is the earlier search-only matrix.
- Sites: CMR (Consumer Moving Reviews), MGM (MyGoodMovers), BVL (Budget Van Lines).
- Labels follow the [README](README.md). [cross-site analysis] marks a synthesis with no single site source. Captures and walks: 2026-10-27. Semrush: US estimates, October 2026. Semrush files are in `research/raw/semrush/` unless the path starts with `seo/`.

## 1. Decisions this review supports

**D1. Show live coverage before any contact field.** After size and services, show how many eligible movers serve the move. Showing their names too is recommended, pending the owner. *Evidence:* moveBuddha and HireAHelper gave value before contact, and CMR and MGM asked for contact first. No reference showed a live count of eligible movers before contact [walk; cross-site analysis; §2.2]. *Confidence:* high for the count, medium for names. *Changes:* lead lifecycle §2; backlog 4.1.6; JTBD §4 J1; VD §13.7.

**D2. Ask the count question after contact details, bounded by real coverage.** Offer 1 up to the smaller of the admin maximum and the live eligible count, with nothing preselected. *Evidence:* no reference was seen asking it. Three state a fixed number, and four let the consumer pick one company [capture; walk; search; §2.3]. *Confidence:* medium. Test it in usability rounds 1 and 2 (JTBD §6.3), which answer L6 (JTBD §6.1). *Changes:* lead lifecycle §2; consent draft §4, §5; shared pricing §1; VD §13.7.

**D3. Name every eligible mover at consent, allow removal, and keep the box for contact consent only.** *Evidence:* MGM's box bundles Terms with unnamed "moving companies" (/moving-cost-calculator), and CMR relies on "By submitting" (/request-a-quote/). No consent seen in a walk names a mover [walk; §3.1]. Consent draft §5 also bundles the Terms. *Confidence:* high; counsel owns the wording. *Changes:* consent draft §4 to §6; lead lifecycle §2, §6; VD §13.7, §13.8; data model §5.

**D4. Show one role-and-money statement at every quote entry, inside consent and on confirmation.** *Evidence:* none of the seven walked flows showed how the site is paid [walk; cross-site analysis]. Move.org's disclosure covers clicks and calls, not requests (/disclosure/). moveBuddha's covers webform submissions but names no payer (/advertising-disclosure/) [capture; sites/moveorg.md; sites/movebuddha.md; §3.4]. AMC has three role wordings (consent draft §1, site architecture §7.1, brief §1). *Confidence:* high. *Changes:* consent draft §1, §5 to §7; site architecture §7.1; VD §12, §13.

**D5. Stay a lead marketplace in features and words.** That means no booking, pricing, guarantees or move money, and no calls to qualify or transfer consumers. The review recommends removing the "Booking deposits and payments" add-on from MVP scope §5, with any reintroduction needing owner and counsel sign-off (compliance facts §2). *Evidence:* Unpakt holds payments, HireAHelper runs a checkout, and CMR and moveBuddha promise specialist calls [capture; walk; §2.6]. How FMCSA's 2023 guidance on money handling and involvement applies to AMC is for counsel (compliance facts §2). *Confidence:* high. *Changes:* MVP scope §5; brief §4; lead lifecycle §2; consent draft §1, §3, §6.

**D6. Show credentials as dated, sourced fields, and issue one badge only from verification checks.** *Evidence:* only CMR dated its FMCSA check in what was captured. Move.org's "no brokers" list contradicts its own review. HireAHelper's badge needs reviews, and CMR and moveBuddha stack badges [capture; §4.1 to §4.3]. *Confidence:* high. *Changes:* mover verification §1, §4, §5; consent draft §2, §8; VD §9.4, §9.5; data model §3.

**D7. Clear or replace the "Preferred Movers" name before Phase 3 design sign-off, after counsel clearance and usability round 1.** *Evidence:* Move.org's sponsored slots include "Preferred Partner" (/disclosure/), and CMR's owner is Preferred Movers Network Inc. Several movers use the name, and six searches surfaced no federal registration [capture; search; §5]. *Confidence:* medium; a web search is not a clearance. *Changes:* §5.3.

**D8. Keep one record per public number, with no savings, booked-move or "people helped" claims.** *Evidence:* figures drift at eight of 11 sites, and rating or review-count drift appears at four of nine captured sites. moveBuddha priced one move two ways [capture; walk; search; cross-site analysis; §4.5]. *Confidence:* high. *Changes:* site architecture §6.3, §9; mover verification §5; VD §3.

**D9. Make reviews invitation-only, labeled, dated and unblended, with a minimum sample before any "top" claim.** *Evidence:* HireAHelper ties reviews to paid moves. CMR and MGM run open review links, and moveBuddha imports reviews. MGM calls a two-review mover "BEST LOCAL MOVER" (/movers/al) [capture; §4.4]. *Confidence:* high. *Changes:* mover verification §6; compliance facts §4; JTBD §4 J1 and J6, §6.3; site architecture §1.2, §4.6, §8.5.

**D10. Gate geo and route pages on real coverage, with the local answer first.** *Evidence:* captured geo templates repeat most headings. Move.org's Houston page opens with a widget and a national partner card. No reference showed a coverage gate, and HireAHelper's lists count movers based outside the city [capture; cross-site analysis; §6.2]. *Confidence:* high. *Changes:* site architecture §3.3, §4.1, §7.4.

**D11. Build in this order: tools and cost pages; national pillars, long-distance pages, routes and moving-to guides; trust and B2B pages; then the hub, directory and profiles.** Publish state hubs and city pages as each passes G1 (§6.1). This is the build and KPI order; trust pages are written first because badges, consent and lists link to them (§7.1). *Evidence:* calculators top Moving.com and moveBuddha, and moveBuddha's city long-distance pages earn 460 to 956 visits each [semrush top_pages_2026-10-27.csv]. Forums and social sites hold four of the NY→FL top 10, and van lines and big publishers hold the head terms [semrush phrase_organic_top10_2026-10-27.csv; seo/raw/semrush_phrase_organic_top10_2026-10-27.csv]. *Confidence:* medium (estimates; top pages only). *Changes:* site architecture §5; keyword research §1, §2, §5.

**D12. Adopt a tag policy for survey, contact, consent and confirmation pages.** *Evidence:* at least seven of nine captured sites load replay-capable tools, all nine load ad tags, and two put move details in URLs [capture; walk; cross-site analysis; §3.5]. *Confidence:* high for presence; whether tools run on forms is unknown. *Changes:* site architecture §8.8, added by SA-18; stack and architecture §1; a proposed new compliance facts §9.

**D13. Publish the mover-side buying rules, and keep payment out of order and editorial outcomes.** *Evidence:* no captured provider page shows prices, caps and refunds together. MGM's Terms let plans affect listing order. Move.org's partner page lists rankings and awards under "Editorial opportunities" (/partnership/) [capture; search; §9]. *Confidence:* high for the gap; mover interviews have not started. *Changes:* shared pricing §9; site architecture §1.1; mover verification §4, §9.

## 2. Quote survey and lead flow

### 2.1 Recommended step order
Lead lifecycle §2, VD §13.7 and JTBD §4 J1 list 9, 6 and 13 steps. Make lead lifecycle §2 the only numbered list, and number every other document's steps to match it:
1. **What you need:** household move, loading help only, vehicle only or truck rental (backlog 4.1.1), with nothing selected. Vehicle-only and truck rental go to information paths (MVP scope §6). Entry points whose page is about a household move (home, geo, route, cost and profile pages) open on step 2, with a "Not a household move?" link back to step 1.
2. **Where:** ZIP or city. Nothing is prefilled; location is used only on request, then confirmed.
3. **When:** a date or a flexible range, with no default.
4. **Size and services:** nothing preselected.
5. **What we found** (§2.2). With no coverage, there is no contact step.
6. **Your details:** "why we ask", the channel choice (§3.1), then name, email and phone.
7. **How many moving companies would you like to hear from?** (§2.3)
8. **Review and consent** (§2.4, §3).
9. **Confirmation** (§2.5).

The stepper counts the screens each entry point shows (VD §9.3).

### 2.2 Value before contact
- **Count.** It comes from the matcher for this route, size and services, never from a fixed maximum. The date is not a matching input (lead lifecycle §3). Moving.com's calculator page holds a fixed "found up to 4 … movers" prompt, captured with no input entered [capture /movers/moving-cost-calculator.asp; sites/movingcom.md]. Test: a `coverage_shown` event precedes the first contact field and matches the pre-check log.
- **Names (recommended; owner decision).** For each eligible mover, show name, USDOT number and check date, in the consent-list order, with no prices or phone numbers. This is the set consent will name. Three site reviews recommend this preview (sites/hireahelper.md, sites/consumermovingreviews.md, sites/homeguide.md). JTBD §4 J1 stage 5 allows a count only today. Counsel confirms it does not read as AMC picking "your mover" (compliance facts §2).
- **Range, when data allows.** It comes from the calculator's model (MVP scope S6), labeled a range, with assumptions, source, date and method link. Otherwise show the count alone, with the reason. MGM labels its tool "Planning estimate, not a final quote" (/moving-cost-calculator) but shows the result only after contact [walk; captures/mygoodmovers.md]. Counsel approves the wording.
- **Carried values** from the calculator or a route page are confirmed, never silently accepted.

### 2.3 The count question
No reference was seen asking it [cross-site analysis]. Three state a fixed maximum:
- Moving.com, "up to 4" [capture /leads/; sites/movingcom.md];
- MGM, "Up to three moving companies may also contact you", only in an FAQ (/moving-cost-calculator) [capture; sites/mygoodmovers.md];
- HomeGuide, five pros for the phone number, per a 2023 help article [search; sites/homeguide.md].

Four let the consumer pick one company: HireAHelper, moveBuddha's partner cards, HomeGuide's "Direct Lead" and Unpakt [walk; capture; search; sites/hireahelper.md; sites/movebuddha.md; sites/homeguide.md; sites/unpakt.md]. CMR, Move.org, EnergySage, BVL, ConsumerAffairs and moveBuddha's bid path gave no number where observed [capture; walk; search; sites/consumermovingreviews.md; sites/moveorg.md; sites/energysage.md; sites/budgetvanlines.md; sites/consumeraffairs.md; sites/movebuddha.md]. MGM asks for a channel, but the consent text seen names calls, texts and email. Whether it changes with the choice is unknown [walk; sites/mygoodmovers.md].

What AMC should learn and do:
1. Put the chosen number in the consent text and on confirmation, never only in an FAQ. Let it cap every channel, not only the phone.
2. Offer 1 up to the smaller of the admin maximum (DEP-02) and the live eligible count. Show higher numbers disabled, with the reason. Only named movers can buy (lead lifecycle §3 item 4), so a higher number could never fill. This replaces VD §13.7's warn-only wording.
3. On profile-origin requests, offer "only this company". If that mover does not buy within the sale window, tell the consumer. This is a business-rule change. Today the profile company is named first, but any listed mover can buy, even when the consumer chooses 1 (mover verification §5; lead lifecycle §2 step 8, §3 item 4). Before adopting it, measure how often a different mover buys profile-origin requests, as JTBD §4 J2 asks.
4. Keep the question neutral: equal weight for every option, no helper text that promotes more companies, and no revenue-judged experiment. AMC's revenue per request depends on the number chosen and on how many movers buy (shared pricing §5) [inference].
5. Test "maximum, not a guarantee" in usability rounds 1 and 2 (JTBD §6.3), which answer L6 (JTBD §6.1). Record the mix of choices.

Ask the question on its own screen right after the contact details, worded per consent draft §4, with the live count beside the options. If removals at consent leave fewer named movers than the number chosen, show the count question again with only the remaining options. With one mover left, the only option is 1, an exclusive request. Lead type is still fixed at submission (shared pricing §1), and consent shows the new "up to N" (consent draft §4, §5). This adds a rule to both documents. Tests: with 2 eligible movers and a maximum of 5, options 3 to 5 are disabled. Choosing 2 and then removing one of two named movers brings the question back.

### 2.4 The consent screen
It holds:
- the request summary;
- the named movers, each with USDOT number, profile link and a remove control;
- the chosen maximum;
- the role-and-money and movers-only lines;
- the unticked contact box and a separate Terms acceptance;
- "Send my request".

At 360px the box, the chosen maximum and the money line stay visible without expanding. The named list follows consent draft §5: rows up to a display cap, then a labeled "Show all {n} movers" control. Counsel decides whether movers behind that control count as named. The alternative is to cap how many eligible movers consent names, which also caps who can buy (lead lifecycle §3 item 4; compliance facts §3). This refines consent draft §5. Usability round 1 tests list length (JTBD §6.3).

**Declined consent.** If the box stays unticked, nothing is shared (backlog 4.2.4; JTBD §4 J1). The screen then offers the named movers' profiles. Each shows its official FMCSA record link and, if the owner allows (§11 Q7), the mover's website or phone. An email-only channel choice (§3.1) is the other path for consumers who want no calls (compliance facts §3 implication 1).

### 2.5 After submit
Confirmation shows the reference number, the maximum and the movers named at consent, matching the consent record. It says movers who buy will make contact and that AMC emails each buyer's name (MVP scope M12). It links to manage the request (MVP scope S2) and to report contact from an unlisted company. It promises no timing unless measured, so consent draft §6's `{typical_window}` stays out until AMC measures it (VD §13.8). No walk reached a reference's confirmation page [walk].

### 2.6 Follow-up rules
- AMC never phones consumers to qualify, transfer or recommend movers, and has no outbound-call state. No copy says AMC sends quotes, finds "your" mover or has a specialist call, as CMR and moveBuddha do [walk; sites/consumermovingreviews.md; sites/movebuddha.md]. A live transfer could change the broker and consent analysis (sites/mygoodmovers.md), so none is built.
- Each purchase triggers one notice. It names the mover, its USDOT number and profile, and says the mover paid AMC.
- STOP or a withdrawal reaches every buyer and blocks CRM calls and texts, with per-mover and per-channel stops (backlog 4.4.2, 4.4.3; compliance facts §3 implication 4). The owner sets the target time, no slower than any deadline counsel names. Test: a STOP flags every buyer's CRM record "do not contact" within that target.
- Review invitations come from AMC only.

### 2.7 Failure modes seen in the walks
- **Presets.** Unpakt preset size and date, HireAHelper sent an untyped date to its list, and EnergySage filled the ZIP from location [walk; sites/unpakt.md; sites/hireahelper.md; sites/energysage.md]. Every AMC input starts empty, and a scripted submit of defaults fails.
- **Broken entries.** MGM's named page showed raw form code, and Unpakt failed into a sign-in page. Custom widgets stopped the walker at BVL and EnergySage [walk; sites/mygoodmovers.md; sites/unpakt.md; sites/budgetvanlines.md; sites/energysage.md]. Use native inputs, and run every entry module to the contact step daily. Fail releases on raw template tokens.
- **Two prices.** For one move, moveBuddha's widget topped out at $7,814 for freight and its results page at $1,761 [walk; sites/movebuddha.md]. Use one model version and a CI consistency test.

## 3. Consent, disclosure and data

### 3.1 Named movers, removal and channels
- Always name every eligible mover, and drop "when known" from VD §13.7's consent step. The pre-check guarantees at least one.
- Each row shows display name, USDOT number and profile link. A profile-origin company comes first (mover verification §5). The rest follow a published neutral order, such as random rotation, never price, spend or purchase history. Store the order shown.
- Each mover has a remove control (compliance facts §3 implication 1), and removed movers can never buy.
- The channel choice (calls, texts, email) sits on the contact screen. It scopes the consent text, travels with the lead and binds movers (consent draft §11 item 2). Choosing email only removes the call and text wording.
- A consumer who declines consent follows the path in §2.4.
- Counsel: is naming several movers enough, and how many is too many (compliance facts §3)? Unverified search copies of Move.org's brand quote pages, outside the verified record (sites/moveorg.md), named one brand plus Clearlink, Move.org's operator [search: move.org/quote-allied/, /quote-mayzlin/, site's own pages, indexed copies possibly about 400 days old; v1 §2.11].

### 3.2 A separate box for contact consent only
- The box covers contact by the listed movers in the chosen channels. It also covers automated technology, if counsel keeps it. It says consent is not a condition of purchase, and it gives frequency, rates, HELP and STOP.
- Terms acceptance and the privacy acknowledgment move to a separate control. Consent draft §5 bundles them; compliance facts §3 implication 1 separates them.
- No arbitration or class waiver goes in the box, the button or the confirmation. An unverified search copy of Move.org's /quote-mayzlin/, outside the verified record, tied mandatory arbitration to "Get My Quotes" [search: https://www.move.org/quote-mayzlin/, site's own page, possibly stale]. v1 saw similar wording on /quote-allied/ [v1 §2.11]. Neither was re-confirmed, and sites/moveorg.md records the same for a test-page excerpt.
- No Do-Not-Call override wording, unless counsel asks for it. Move.org's test-page consent (/generic-form-test/, site's own page, via search) covers numbers on Do-Not-Call lists, and per v1 only, so did /quote-allied/ (not re-confirmed; brand-page search copies are outside the verified record). The live tool's consent was not seen [search; v1 §2.11; sites/moveorg.md].
- Test: a copy check fails on Terms or arbitration text in the box, the box is unticked on load, and both states are stored.

### 3.3 Exclusive and shared, explained
- The count screen, consent, confirmation and "Which companies receive my request" all say four things. 1 means only one mover can ever receive the details. 2 or more means up to that many. The number is a maximum, not a promise. Requests are never resold (shared pricing §1; consent draft §2, §11 item 2).
- For a count of 1, consent draft §5 lists every eligible mover, while compliance facts §3 implication 1 names one. Counsel picks between two options:
  - (a) the consumer also picks the mover;
  - (b) any listed mover may make contact, and the first to buy gets it.

  Use (a) for "only this company" (§2.3), and decide before DEP-07 sign-off. Option (a) changes mover verification §5 and lead lifecycle §3 item 4.

### 3.4 The role-and-money statement
- Use one counsel-approved, versioned text. It says that:
  - AMC is a platform, not a mover or broker;
  - it does not transport, estimate, arrange or book;
  - participating movers pay for the requests they buy;
  - payment never changes verification, ratings, review display, or order in the directory, geo pages or consent list.
- Name what AMC checks instead of "licensed". BVL and Moving.com use "licensed" with no method (/pricing; /movers/moving-cost-calculator.asp). MGM's /movers "License lookup" is only a USDOT match, and its privacy policy disclaims verifying licensing [capture; sites/budgetvanlines.md; sites/movingcom.md; sites/mygoodmovers.md].
- The statement appears:
  - beside the first survey screen on every entry module, phones included;
  - inside the consent block, so it is hashed;
  - on confirmation and in the footer;
  - in the meta descriptions of the home, About and "How AMC makes money" pages only, because other metas stay page-specific (site architecture §8.2);
  - in the Organization `description`;
  - behind a header "How AMC makes money" link that, unlike Move.org's strip, cannot be closed [capture /; sites/moveorg.md].
- On directory, geo and comparison pages, the paid-relationship line sits inside the list block. CMR's separate block is easy for a quote to drop [capture /best-interstate-moving-companies/; inference; sites/consumermovingreviews.md].
- Test: a build check matches body, meta, JSON-LD and consent text to the record.

### 3.5 Tag policy
The new site architecture §8.8 (SA-18) covers the `/get-quotes/` steps, contact, consent and confirmation:
- no ad, retargeting or social pixels, and no chat widgets;
- no session replay or heatmaps (PostHog recordings off), unless counsel approves full masking;
- first-party analytics only, with no field values before submit, and no ZIPs, dates, sizes or contact details in URLs, event names or payloads;
- a consent certificate, if DEP-20 adopts one, only on the consent step and named in the privacy notice. Move.org loads TrustedForm, the only certificate script seen [capture, script list; sites/moveorg.md];
- a CI script inventory per step against an allowlist, with the tag-manifest version stored in the consent record.

Name a consent tool that reads Global Privacy Control; stack and architecture §1 has none. Counsel: do replay tools or pixels on forms create wiretap-law exposure, for example under California's CIPA? Five site reviews point this question to compliance facts §8 or site architecture §8.6 or §8.7. None of those sections covers it.

### 3.6 Consent evidence fields
`consent_records` (data model §5) lacks fields that AMC's own documents require (lead lifecycle §6; backlog 4.2.5; compliance facts §3 implication 2). Add:
- the full rendered text, with mover names in the order shown;
- `removed_company_ids` and `channel_scope`;
- `form_state_sha256` and `ab_variant`;
- phone and email hashes;
- Terms and privacy-notice version IDs and states;
- the tag-manifest version.

Test: no consented lead can be created with any of these empty.

### 3.7 "Sale" language: a question for counsel
Consent draft §3 says "We don't sell your details to anyone else", yet movers pay to receive them (§1, §7). CMR prints "We never sell your info" beside its quote-matching form (/request-a-quote/) [capture; sites/consumermovingreviews.md]. BVL's Terms allow sharing with "other moving companies", while its privacy policy says no mobile information is shared for marketing. The two are hard to reconcile, though the second reads like standard texting wording [capture /terms-of-use, /privacy-policy; inference; sites/budgetvanlines.md].

Publish no "never sell" line until counsel decides whether paid delivery to named movers is a "sale" or a "share". Then say plainly who receives the details and that they pay. A new compliance facts §9 should also put these to counsel:
- notice at collection;
- Global Privacy Control, which EnergySage honors [capture /editorial-guidelines/; sites/energysage.md];
- text-opt-in wording;
- risk scoring versus "no profiling" claims;
- conversion uploads tied to click IDs.

## 4. Trust, verification and reviews

### 4.1 Movers-only enforcement
- Movers-only statements, the "No brokers" overline and profile claims render only from the latest `authority_records`. A company found with broker authority, alone or beside carrier authority, leaves the directory, geo pages and consent lists within one weekly recheck. The claims hide if the check fails to run.
- Dual registrations stay excluded (mover verification §1 item 3; lead lifecycle §3 item 1). Align compliance facts §1 implication 2, which still says "flag for manual review".
- Large van lines may hold both authorities. Move.org's review of its #1 pick says "Allied is a broker and a carrier" (/allied-moving-reviews/), and ConsumerAffairs calls its top pick a hybrid [capture; search; sites/moveorg.md; sites/consumeraffairs.md]. Backlog 1.6 should count them per market.
- Agents: before recruiting, the owner decides whether agents with their own carrier authority qualify when their brand holds broker authority. Agent profiles show the legal name first and the brand tie as a disclosed fact. Backlog 6.1.2 adds fixtures.
- Identify movers by USDOT number and authority type, with names only as a cross-check. BBB lists firms named much like BVL [search; sites/budgetvanlines.md].

### 4.2 Credential rows
Cards and profiles show these fields, each with a source link and an absolute check date:
- USDOT number, and MC number (required while `require_mc_number` is on);
- authority type, household-goods scope and "no broker authority on record";
- insurance filings and any verified state credential.

Company-provided facts sit in a separate block, never under an FMCSA credit line, where Move.org puts GPS tracking [capture /allied-moving-reviews/; sites/moveorg.md]. No captured reference showed MC, authority type and a date together [cross-site analysis]. Test: a credential without `verified_at` and a source will not render.

Replace bare "licensed", "vetted", "verified" and "certified" with the checks or a method link. At least seven references use "licensed", "vetted" or "verified" with no method beside them, the same count as matrix §3.4 [capture; sites/movingcom.md; sites/budgetvanlines.md; sites/unpakt.md; sites/energysage.md; sites/moveorg.md; sites/mygoodmovers.md; sites/movebuddha.md]. The 49 CFR 375.207 advertising question stays with counsel (compliance facts §1).

### 4.3 One badge tier
- Issue the badge only from verification results (`badges.evidence_check_ids`, data model §3). It takes no review, rating, tenure or spend input, and has no second tier. HireAHelper's badge needs "10+ reviews and a 4-star rating" (/how-it-works/), and CMR and moveBuddha stack badges [capture; sites/hireahelper.md; sites/consumermovingreviews.md; sites/movebuddha.md]. Test: zero reviews plus passing checks earn the badge.
- The explainer adds:
  - what is not checked (work quality, prices, crews);
  - the weekly recheck and the lapse rule;
  - that insurance filings are carrier minimums;
  - the money relation: holders pay AMC for requests, the badge is not sold, and buying more never earns or keeps it.
- One versioned "how we verify" text feeds every surface, with a changelog.
- Related parties: the application asks about ties to AMC's people, and admin review checks them. A related mover may be listed with a disclosure, but it is never featured, ranked or compared. Its badge is for the owner and counsel to decide. At CMR, two movers that its own disclosure calls "related companies" (the sentence is cut off in the capture) lead its lists [capture /best-interstate-moving-companies/; sites/consumermovingreviews.md].

### 4.4 Reviews
- **Labels.** Use mover verification §6's three labels everywhere, and rename compliance facts §4's "Verified quote request" to "Verified platform inquiry". Never show a bare "verified review". EnergySage, moveBuddha and MGM say "verified" without saying what was proved [capture; sites/energysage.md; sites/movebuddha.md; sites/mygoodmovers.md]. Test: add the three labels to JTBD §6.3's comprehension checks, with a target of 8 of 10 participants explaining each one.
- **Invitation only.** The review form opens only with a single-use token. There are no open "Write a review" links like CMR's and MGM's [capture, header navigation; sites/consumermovingreviews.md; sites/mygoodmovers.md]. Keep mover verification §6's quote-experience invitation, sent about 7 days after purchase. In addition, AMC sends a second, post-move invitation 21 days after the stated move date (proposed), whatever the CRM stage. This is a rule change. Today move-experience invitations go only to customers a company marks Booked or Completed (mover verification §6; JTBD §4 J1 stage 13, J6 1a and 1b). The change keeps move reviews from depending on which customers a company marks (compliance facts §4).
- **Replies, dates, one rating.** Owners and managers reply publicly, and are warned before posting details the reviewer did not share (consent draft §11 item 5). HireAHelper's profiles show mover replies [capture /movers/dalton_ga/a-1-moving/; sites/hireahelper.md]. Reviews carry full dates, and the summary shows the latest date and a 12-month count. No captured review showed a full date; EnergySage's testimonials show only relative dates [capture /; sites/energysage.md]. One record per experience type feeds every surface and JSON-LD, with a CI drift check.
- **Minimum sample.** Show the mean from the first review. Allow no "top", "best", rank or rating-sort priority under 5 eligible reviews of that type. MGM gives "BEST LOCAL MOVER" to a mover with two (/movers/al) [capture; sites/mygoodmovers.md]. No "best" chips or awards at launch.
- **No import or blend.** No Google, Yelp, BBB or Trustpilot reviews go into AMC ratings or markup, unlike moveBuddha's imported counts [capture /; sites/movebuddha.md]. Reword mover verification §6's "genuine third-party reviews". No editorial composite, and no rating on AMC's own tools.
- **Featuring and disclosure.** Excerpts follow a published neutral rule with no star filter. The methodology says invitations follow purchases, so review count stays out of default sorts [inference from mover verification §6]. AI summaries need a written policy and at least 10 reviews.

### 4.5 Facts registry and claims
Every public number is a registry entry with a definition, query, owner and as-of date. Titles, meta, body and JSON-LD read from it. CI fails on two values for one key or on a missing date. This extends site architecture §11's facts registry to counts.

Make no savings, "people helped", booked-move or job-count claims, since AMC never sees bookings. Unpakt's "save 45%" (/), BVL's "Up to 50%" (/how-it-works) and CMR's "8,200+ REAL MOVES TRACKED" (/) are unsourced [capture; sites/unpakt.md; sites/budgetvanlines.md; sites/consumermovingreviews.md]. AMC offers no guarantee or coverage. A mover's guarantee shows only as company-provided, with its terms uploaded.

## 5. Preferred Movers: naming and trademark risk

### 5.1 Evidence
- **AMC's meaning.** A screening status every approved mover gets (mover verification §4; consent draft §8). The v1 matrix called it "Preferred (paid)" (v1 §3, §4 item 9). The business rules win, as the v2 matrix records.
- **In the reference set.** Move.org's "Preferred Partner" placements are sponsored (/disclosure/), and "CMR is owned by Preferred Movers Network Inc." (/best-interstate-moving-companies/) [capture; sites/moveorg.md; sites/consumermovingreviews.md].
- **Six standard web searches, 2026-10-28.** Their exact query strings are not recorded in this repository. The results below show what they covered.
  - No USPTO registration or application for "Preferred Movers" or "Preferred Mover" surfaced. That includes a search limited to trademark-record sites (Justia, Trademarkia, Trademark Elite, uspto.gov) [search].
  - Movers use the name:
    - Preferred Movers LLC of Merrimac, MA, USDOT 1381627 per a directory [search: [localmovers.com](https://www.localmovers.com/preferred-movers), third party];
    - a "Preferred Movers" in Nashua, NH [search: [movebuddha.com](https://movebuddha.com/movers/nh/preferred-movers-2502), a reference site's own page];
    - Preferred Movers of TN, Inc., a Wheaton agent and its 2023 Agent of the Year [search: [wheatonworldwide.com](https://www.wheatonworldwide.com/2024/03/11/2023-agent-of-the-year/), the van line's own page];
    - PNW Preferred Movers in Washington [search: [greatguysmoving.com](https://greatguysmoving.com/movers/washington/lynnwood/pnw-preferred-movers), third party];
    - Preferred Moving & Storage in Michigan [search: [localmovers.com](https://www.localmovers.com/mover/preferred-moving-and-storage-mi), third party];
    - Canadian Preferred Moving, a 2024 rebrand [search: [newswire.ca](https://newswire.ca/news-releases/mackie-moving-rebrands-to-canadian-preferred-moving-823356112.html), press release].
  - No result mentioned Preferred Movers Network Inc. [search].
  - "Preferred" vendor programs are common: an employer relocation list, a senior-living move program, and a brokerage's "Preferred Moving Partner" with client perks [search: [slu.edu](https://www.slu.edu/business-finance/departments-and-offices/business-services/-pdf/uemployeerelocationupdated.pdf), [ericksonseniorliving.com](https://www.ericksonseniorliving.com/node/14850), [olympiamoving.com](https://olympiamoving.com/lf/), own pages]. The word often signals a selected or negotiated vendor [inference].
- **Not confirmed:**
  - USPTO status (no database access);
  - state and common-law rights, and whether any company claims rights;
  - whether the Massachusetts and New Hampshire listings are one firm;
  - anything about Preferred Movers Network Inc. beyond CMR's page;
  - how consumers read the word.

### 5.2 Options
- **A. Keep "Preferred Mover · American Moving Choice"**, always with the house name, after clearance, with the money relation in the explainer. It matches the brief. But Move.org uses the word for sponsored slots, CMR's owner carries it, other movers use it, and a laudatory word may be hard to protect [inference].
- **B. A descriptive name built from the checks**, with the house name. It explains itself, but it costs rework and needs its own clearance.
- **C. No program name**, only credential rows. There is nothing to clear, but it drops the badge and directory the brief asks for.

Any name avoids "Partner", "Featured", "Certified", seals and stacked labels.

### 5.3 Recommendation
Decide before Phase 3 design sign-off, while change is cheapest. The name runs through a dozen sections, from mover verification §4 and consent draft §8 to site architecture §4.1, data model §3 and backlog 6.6.6.
1. Counsel clears the name (USPTO, states, common law, domains) and answers §5.4.
2. Usability round 1 asks what the badge means and whether it was paid for. Keep option A only if counsel clears it and at least 4 of 5 participants say "screening" and "not paid" (the 80% bar in MVP scope §1 G1). Otherwise adopt option B.
3. Either way, never use "Preferred" for a paid product or without the house name. Use a neutral directory slug and badge code, so a rename needs no redirects. The directory's mapped keyword is "moving company reviews", 880/mo [semrush seo/keyword-to-page-map.csv]. Check "preferred movers" search results and AI answers before fixing the slug.

### 5.4 Questions for counsel
1. Does a full clearance search find conflicting marks or earlier users in moving or lead services?
2. Is "preferred" too descriptive or laudatory for AMC to protect?
3. Could the badge be treated like a certification mark, and would that change how AMC presents or registers it?
4. Does the name of CMR's owner create confusion in either direction?
5. Every badge holder pays AMC for requests. Must the badge carry a material-connection disclosure (compliance facts §4)?
6. Could "preferred" read as AMC recommending movers in a way that matters for the broker analysis (compliance facts §2)?

## 6. SEO architecture

### 6.1 Page families to build first
One order serves D11, this section and SA-13:
1. **Tools and cost pages.**
   - Moving.com's calculator earns 19,426 visits (29.97%) and ranks #1 for "moving cost calculator" (5,400/mo, KD 49). moveBuddha's earns 4,399 (11.47%) [semrush top_pages_2026-10-27.csv, phrase_these_2026-10-27.csv, phrase_organic_top10_2026-10-27.csv; sites/movingcom.md; sites/movebuddha.md]. Build it for users and links; ranking takes longer.
   - "how do moving companies charge" has 1,900/mo at KD 19 [semrush seo/keyword-to-page-map.csv]. MGM's Pennsylvania cost page is #8 for "how much do movers cost" (9,900/mo, KD 32), where four of the top 10 are single-place cost pages [semrush seo/raw/semrush_phrase_organic_top10_2026-10-27.csv, seo/raw/semrush_phrase_these_questions_cost_2026-10-27.csv; sites/homeguide.md].
   - `/verify-a-mover/`: freight tools led "usdot number lookup" (4,400/mo, KD 18) in one search run, so forecast it conservatively [semrush phrase_these_2026-10-27.csv; search; sites/movebuddha.md].
2. **National pillars, long-distance pages, routes and the two moving-to guides.**
   - moveBuddha's city long-distance pages earn 460–956 visits and its state routes 133–156 [semrush top_pages_2026-10-27.csv; sites/movebuddha.md]. Its San Francisco page is #9 for "best long distance moving companies" (49,500/mo, KD 36) [semrush seo/raw/semrush_phrase_organic_top10_2026-10-27.csv, seo/raw/semrush_phrase_these_questions_cost_2026-10-27.csv].
   - HireAHelper's service pillar is its #2 page [semrush top_pages_2026-10-27.csv; sites/hireahelper.md].
   - Forums or social sites hold four of the NY→FL top 10 [semrush seo/raw/semrush_phrase_organic_top10_2026-10-27.csv]. Reddit, Facebook and Quora rank for "moving to florida" (2,400/mo, KD 27) [semrush phrase_organic_top10_2026-10-27.csv, phrase_these_2026-10-27.csv].
3. **Trust and B2B pages.** Moving.com's 241-word `/leads/` ranks #9 for "buy moving leads" (720/mo, KD 18) [semrush phrase_these_2026-10-27.csv, phrase_organic_top10_2026-10-27.csv; sites/movingcom.md]. "movers vs brokers" has 110/mo at KD 6 [semrush seo/keyword-to-page-map.csv; sites/moveorg.md].
4. **The `/movers/` hub, the directory and profiles.** Move.org's `/movers/` hub is its #4 page [semrush top_pages_2026-10-27.csv; sites/moveorg.md]. One CMR profile brings 162 of the site's 191 visits [semrush top_pages_more_2026-10-27.csv; sites/consumermovingreviews.md].
5. **State hubs and city pages, each when it passes G1.** They stay in the proposed Wave 1 (site-architecture §5.3), pending brief §11 Q3: three state hubs and nine city pages, one of them a reserve. Ten of HireAHelper's top 15 pages are city pages (24.6% of visits), but city pages lead at no other reference [semrush top_pages_2026-10-27.csv; sites/hireahelper.md; cross-site analysis].
6. **Not first:** "moving companies" (KD 62), "long distance moving companies" (KD 63) and best-of terms. They wait for Wave 2 and the comparison gate [semrush phrase_these_2026-10-27.csv].

### 6.2 Gating rules
Keep the site architecture §4.1 gate as written, refined by SA-11 and SA-12. G1 needs at least 3 covering movers for city, city long-distance and route pages, and 5 for state pages. G7 needs 40% unique content and fails below 30%. Hysteresis, "unpublished, not noindex", unindexed city routes in Wave 1 and no ZIP pages all stay.

### 6.3 URL patterns
Confirmed: full state slugs, lowercase hyphens, no extensions, `/companies/{slug}/` profiles, directional routes and one `www` host. MGM mixes state codes with company slugs, and Unpakt uses uppercase states and a second blog host [semrush top_pages_more_2026-10-27.csv; capture; sites/mygoodmovers.md; sites/unpakt.md]. A copy of Moving.com's calculator ranks on a subdomain [semrush phrase_organic_top10_2026-10-27.csv; sites/movingcom.md]. Changes are in SA-7, SA-8 and SA-10.

### 6.4 Templates and unique data
- **State hub:** a dated mover count, a regulator section, Census flows, published cities and routes, and a cost block once data exists.
- **City:** mover cards that keep "based in" apart from "serves", verified local facts, a scoped cost block, FAQs answered from page evidence, and neutral review excerpts.
- **City long-distance and route:** top destinations or directional coverage (Census or AMC data, n ≥ 30), ranges by home size, and interstate or arrival rules. Each must differ from the parent or reverse page. moveBuddha's route page cites "847 real-time quotes" over 90 days (/popular-routes/ca/fl/) [capture; sites/movebuddha.md].
- **Moving-to:** sourced arrival requirements and migration data, with no neighborhood advice.
- Profiles, the calculator and the hub follow §4.2, §7.2 and SA-4.

### 6.5 Structured data
Keep site architecture §8.5, and add a schema lint. It fails on the items below, most of them seen at references [capture; sites/movingcom.md; sites/consumermovingreviews.md; sites/mygoodmovers.md; sites/unpakt.md]:
- FAQPage or HowTo markup (FAQPage is still on Moving.com, CMR and MGM pages; HowTo was not seen);
- self-rating on AMC's own entities, as Unpakt does sitewide;
- duplicate Organization nodes, as on Moving.com's quote page;
- MovingCompany outside approved movers;
- ratings in geo lists;
- values that differ from visible text.

Profiles mark up one named rating type (move experience by default) that matches the visible count. HireAHelper's profile markup matches its page [capture /movers/dalton_ga/a-1-moving/; sites/hireahelper.md].

### 6.6 Internal links
Site architecture §3.2 and §3.3 hold. Add:
- source links on numbers;
- no header links to single movers (Move.org links five [capture /; sites/moveorg.md]);
- no mover phones in lists;
- a cannibalization alert when `/compare/` and a city long-distance page rank for the same query (site architecture §4.4, §9).

### 6.7 E-E-A-T
Each guide, cost, route and geo page names an author, a different reviewer and a data owner (brief §11 Q9). No team bylines or unnamed "fact-checked" stamps, as at CMR and MGM [capture; sites/consumermovingreviews.md; sites/mygoodmovers.md]. Earn every date. moveBuddha shows a capture-day "Last Updated" (/movers/ca/) and a templated "decade" of experience (/movers/ca/los-angeles/long-distance/) [capture; sites/movebuddha.md].

### 6.8 Content shapes for AI answers
Put a 40–60-word answer under a question heading in the first screen (site architecture §6.1 step 4). Geo pages give the local answer first. Then come definitions, tables and dated data blocks, with the paid line inside. Keep one record per figure, since a search tool already repeats moveBuddha figures that differ from its live pages [search; sites/movebuddha.md]. Challenge bots only at quote submission; one engine quoted ConsumerAffairs despite its block [search; sites/consumeraffairs.md]. FAQ rich results are retired, and llms.txt has no effect on Google Search (compliance facts §5, §6).

### 6.9 Site architecture: what is confirmed and what changes
**Confirmed** (the approach is kept; SA items refine some):
- §0: geo, profile, route and ZIP decisions; gate first; no FAQ or HowTo rich results; answer agents allowed.
- §1.1 and §1.2.
- §2.1 to §2.5. §2.5 bans IP-based content swapping, which EnergySage's location-filled ZIP shows is needed [walk; sites/energysage.md].
- §3.1 to §3.3.
- §4.1 to §4.4, §4.6 and §4.7, which are stricter than any reference [cross-site analysis].
- §5.2 and §5.3, including New York entering through routes; "movers nyc" is KD 72 [semrush phrase_these_2026-10-27.csv; sites/unpakt.md].
- §6.1 to §6.3; §7.1 to §7.5; §8.1, §8.3, §8.4, §8.6 and §8.7; §10.

**Changes (SA-1 to SA-20, applied on 2026-10-28 in this PR):**
- **SA-1** (header; §0 to §2 headings): drop "provisional", link this document, and keep decision-dependent items marked pending. Applied together with the brief §8 note (§10).
- **SA-2** (§0): item 4, no mover phone numbers on cards, lists or geo pages, with profiles per §11 Q7 and a note on the profile if contact details are hidden. Item 5, sponsored slots stay out of ranked lists, consent lists, awards and comparisons, and never use "Preferred", "Featured" or "Partner". New item 9, the badge name awaits counsel (§5).
- **SA-3** (§1.1): self-serve "Apply" comes first. `/for-movers/` publishes price basis, cap, credits and claim reasons, and offers no rankings, awards, placement or editorial coverage.
- **SA-4** (§1.2 Quote survey, Geo index): one survey on `www` under AMC's name, with no third-party form hosts, and a confirmation naming the consent-list movers. `/movers/` adds dated per-state counts, a matching explanation and method links.
- **SA-5** (§1.2 Cost calculator): replace "The top 10 are all working tools". Move.org's /moving-costs/, #3 for "moving cost calculator", showed no calculator fields, though the capture skips iframes [capture /moving-costs/; semrush phrase_organic_top10_2026-10-27.csv; sites/moveorg.md]. Add a range before contact, an H1, a method page and one model for widget and results.
- **SA-6** (§1.2 Verify a mover): aim it at checking a mover before hiring, and forecast below 4,400.
- **SA-7** (§1.2 directory, §2.1, §2.3, §3.1, §8.2): the name and slug wait for §5. Publish the sort rule, and keep sponsored items outside ranked order.
- **SA-8** (§1.2 Company profile, Utility): `/reviews/` appears only at 10 eligible reviews. Add sourced, dated credentials, a company-provided block, related-party disclosure and a token-gated review form.
- **SA-9** (§1.2 Comparison, §4.6): no editorial-consumer composite, no related-party picks, the paid line inside the list, no rating-based rank under 5 reviews, and no awards.
- **SA-10** (§1.2 Trust pages, §2.1, §2.2, §2.4): add "Which companies receive my request" (MVP scope M11), and call `/advertising-disclosure/` "How AMC makes money". Keep partner forms on `www`, with widgets noindex. Rating sorts apply the minimum sample.
- **SA-11** (§3.3 rule 4, §7.4): each geo and route page opens with the H1 and an answer holding at least two dated, page-specific data points. National, sponsored and quote modules sit below. A staging crawl checks the first 150 words.
- **SA-12** (§4.1): G1 becomes "approved movers with explicit coverage". It equals the count shown and never counts non-movers. G4 becomes required for state hubs once data exists. G7 treats mover cards shared with a sibling page as template. G10 adds a working survey entry with no raw tokens.
- **SA-13** (§4.5, §5.1, §5.3): prioritize profiles with brand demand, and add forum-and-social counts to market selection. Set Wave 1 KPIs in §6.1's order, and measure state hubs and city pages once they pass G1 [semrush top_pages_more_2026-10-27.csv; seo/raw/semrush_phrase_organic_top10_2026-10-27.csv; inference]. The "smaller metros are achievable" line is in keyword research §2, so its fix sits in that row of §10.
- **SA-14** (§6.3, §6.4): state the scope wherever a range appears, titles included. Test widget-results consistency, and feed every render from one dataset by metric ID. A block built from consented requests is called "recent request mix by route and size", never "recent estimates"; Moving.com's undated "Recent Estimates" block is the pattern to avoid [capture /movers/moving-cost-calculator.asp; sites/movingcom.md]. It uses only requests above §7.5 thresholds, and shows only labeled typical ranges from the versioned cost model, never a price per request. AMC's role statement says AMC does not give moving estimates (consent draft §1), so the block goes to counsel with the other range questions (compliance facts §2). Lift §6.4's deferral of sample briefs.
- **SA-15** (§7.1 to §7.3): one stored role statement with the money line, for body, meta, Organization and consent (§3.4). Name the legal entity, owner and ties (brief §11 Q1). Every page gets an author, a different reviewer and a data owner. The methodology covers labels, invitations, minimum samples and AI summaries. Dates are earned only.
- **SA-16** (§7.6, §7.7): add OAI-AdsBot as a business decision (compliance facts §6). Challenge bots only at submission, and check verified-bot responses monthly. The AI baseline tracks six moving references (ConsumerAffairs, Moving.com, Move.org, moveBuddha, HireAHelper and MGM), stale figures and missing paid disclosures. It adds per-state prompts and AMC's review profiles.
- **SA-17** (§8.2, §8.5, §8.7): no "best", "top {n}" or fixed counts in geo and route titles. Metas read the page record. The B2B H1 drops "licensed". §8.5 adds the §6.5 lint, and §8.7 points to §8.8.
- **SA-18** (new §8.8): the §3.5 tag policy. §8.6 stays portal-only.
- **SA-19** (§9): drift checks cover metric-ID figures, ratings and the role text. A daily synthetic walk covers every survey entry. Logs add the verified-bot check.
- **SA-20** (§11): pull Wave 1 state cost keywords, a "preferred movers" search and AI check, and reference keyword lists.

## 7. Content plan

### 7.1 First pieces to write
1. **Trust pages:**
   - How we verify movers;
   - Movers vs brokers: definitions, a carrier-or-broker table, how to read FMCSA authority, AMC's dual-registration rule, and why AMC holds no operating authority, in counsel's words;
   - How AMC makes money;
   - Which companies receive my request;
   - Review methodology;
   - an Editorial policy that covers AI use.
2. **Cost hub, calculator and method page**, then `/moving-costs/how-movers-charge/`.
3. **`/verify-a-mover/`**, written for consumers checking a mover.
4. **Guides:** choosing a mover; avoiding scams; rights when moving interstate; estimates explained, with the 110% rule worded with counsel; moving out of state.
5. **`/for-movers/`**, with the buying rules (§9.1).
6. **Gated pages** as coverage allows (site architecture §5.3).

### 7.2 Cost guides and the calculator
Publish ranges only, from site architecture §6.3 rule 2 sources. Each range gives scope, source or sample, date and method link, titles included. Moving.com gives two unsourced averages for one distance [capture /movers/moving-cost-calculator.asp, /tips/cheap-ways-to-move-cross-country/; sites/movingcom.md]. Use a question heading and a scoped range with unit, minimum and assumptions, the shape of HomeGuide's cost guides [search; sites/homeguide.md]. Every block says movers set their own prices, in counsel's words. None says "instant", "best rate" or "save". The calculator is server-rendered, labeled a range, and prefills the survey. Skip brand-cost and DIY guides in Wave 1; they bring traffic with weak lead fit [semrush top_pages_2026-10-27.csv; sites/hireahelper.md; sites/movebuddha.md].

### 7.3 Policy on best-of lists
None at launch. Later, build one comparison page per measured intent, behind the extended §4.6 gate (SA-9). Each has a published method, inclusion independent of payment, and low scorers kept visible, as CMR and moveBuddha keep them [capture /best-interstate-moving-companies/, /movers/ca/; sites/consumermovingreviews.md; sites/movebuddha.md]. No awards, and no rankings offered to movers; Move.org lists rankings and awards as partner "Editorial opportunities" (/partnership/) [capture; sites/moveorg.md]. No overlapping best-of URLs; CMR's menu lists ten or more [capture /; sites/consumermovingreviews.md].

### 7.4 Comparison pages and the glossary
"Movers vs brokers" comes first: a table plus how to check any company's FMCSA record. A glossary is a could. It gives short definitions (broker, carrier, operating authority, USDOT and MC numbers, estimate types, the 110% rule, valuation, bill of lading) citing FMCSA and 49 CFR 375. MGM's 7,541-word glossary is not in its top 25 pages, so build it for clarity and links, not traffic [capture /moving-guide/moving-glossary; semrush top_pages_more_2026-10-27.csv; sites/mygoodmovers.md].

### 7.5 State hubs
Publish the TX, FL and CA hubs when G1 (5 movers) passes. Each has the regulator section (TxDMV, FDACS, BHGS), flows, cities, routes and, once data exists, a cost block. MGM's state cost pages earn about twice its state mover pages (1,489 against 782 visits) [semrush top_pages_more_2026-10-27.csv, computed; sites/mygoodmovers.md]. So pull state cost keywords (SA-20) before choosing between a hub section and a `/moving-costs/{state}/` spoke. Moving-to guides stay separate (site architecture §3.1).

### 7.6 What not to write
- Lifestyle and relocation lists, storage, change-of-address and how-to pages. Together they hold about 44% of ConsumerAffairs' /movers/ folder (about 10.4k of about 23.8k visits) [semrush top_pages_more_2026-10-27.csv, computed; sites/consumeraffairs.md]. MGM's top page is a where-to-move guide, and lifestyle lists earn most of Unpakt's blog visits [semrush top_pages_more_2026-10-27.csv; sites/mygoodmovers.md; sites/unpakt.md].
- Container rankings, and car-shipping pages beyond the information path.
- ZIP lanes and city × service grids. CMR's lanes earn 1 to 3 visits each, and HomeGuide's grid pages 36 or fewer, with one exception [semrush top_pages_more_2026-10-27.csv; sites/consumermovingreviews.md; sites/homeguide.md].
- "Best movers in {city}" posts beside city pages.
- First-person template claims, savings claims, year titles and FAQ blocks written for markup [capture; sites/movebuddha.md; sites/unpakt.md; sites/homeguide.md].

## 8. Design

### 8.1 Patterns to adopt, and how they fit Route Ledger
- A "what we found" ledger row (count, route, check date) and credential rows with type, source and absolute date fit VD §3's "Show the route" and "Evidence on the surface". They extend CMR's dated rows [capture /best-interstate-moving-companies/; sites/consumermovingreviews.md].
- A route summary appears once both ends resolve, like MGM's "662 miles" (/moving-cost-calculator) [walk; sites/mygoodmovers.md]. Never show Moving.com's "0 miles" before input (/movers/moving-cost-calculator.asp) [capture; sites/movingcom.md].
- Progress hints that list the missing fields, as on moveBuddha's calculator ("Still needed", /moving-cost-calculator/) [capture; captures/movebuddha.md], suit VD §9.3's stepper. VD §13.7's focused shell holds.
- A one-line badge meaning, as CMR gives [capture /how-we-rank-movers/; sites/consumermovingreviews.md], fits VD §9.4's rectangular badge, not CMR's seal.

### 8.2 Mobile
- On household-move entry points, the hero holds step 2 of §2.1 (from and to) and the CTA. The tile's first screen also asks date, size and a flexible-date checkbox. Move date and the checkbox to step 3, and size to step 4.
- Nothing sits between the lede and the first field except the money line. Unpakt and HireAHelper put an app link or promo banner above the H1, and Moving.com puts share links before the first field [capture /; sites/unpakt.md; sites/hireahelper.md; sites/movingcom.md].
- Trust statements precede the video on phones (VD §12), though the tile puts the video first. At 360px the consent box, the chosen maximum and the money line need no expanding (§2.4).
- Public comparison tables become stacked cards below 768px. A CMR table says "Scroll sideways on a phone." (/best-movers-for-small-long-distance-moves/) [capture; sites/consumermovingreviews.md].

### 8.3 Data presentation
Use absolute dates everywhere, reviews included. Ranges render only with assumptions, source, date and method. Ratings show mean, count, label and latest date, with a "fewer than 5 reviews" marker. Add a review card to VD §9.5: first name and initial, states, experience type, label, the reviewer's own stars, date and any dated reply.

### 8.4 Disclosure placement
The money line follows §3.4's placements, starting under the first screen's CTA. The paid line sits inside list blocks. The badge explainer stays adjacent (`<details>`). Any Sponsored chip sits on its card, outside ordered lists.

### 8.5 What to avoid
- CTAs that overpromise.
- Phone-first headers, and mover phones on cards.
- Trust rows of unsourced counters, press strips or rating widgets. At least eight references show one or more of these [capture; sites/unpakt.md; sites/mygoodmovers.md; sites/consumermovingreviews.md; sites/moveorg.md; sites/movebuddha.md; sites/hireahelper.md; sites/budgetvanlines.md; sites/energysage.md].
- Closable disclosures, seals, stacked badges and relative dates.
- Custom widgets without native inputs.
- Accessibility overlays, as at EnergySage [capture /solar/calculator/; sites/energysage.md].
- Separate form hosts, chat personas, exit-intent pop-ups and promo banners, as at moveBuddha and HireAHelper [walk /moving-cost-calculator-tool/, my.bestinterstatemoving.com; capture /; sites/movebuddha.md; sites/hireahelper.md].

### 8.6 Changes to visual-direction.md and the style tile
- **§3:** ban undated press strips, rating widgets in the hero or survey, neutrality claims while movers pay, booking words ("our movers", "a specialist will call") and bare "licensed", "vetted", "verified" or "certified".
- **§5.3, §13.1:** reword "See available movers" in AMC's own words, tied to the coverage result, whether or not the named preview ships. It echoes HireAHelper's "See Movers" step [walk /checkoutv2/moveitems/; captures/hireahelper.md; sites/hireahelper.md].
- **§9.2 to §9.5:**
  - no location ZIP or default answers;
  - the stepper counts every screen shown, "What we found" included (§2.1);
  - the explainer adds unchecked items, cadence, lapse, the insurance note and the money relation;
  - Sponsored stays out of ordered lists and never says "Preferred", "Featured" or "Partner";
  - absolute dates cover reviews;
  - cards add authority type, the official link, a company-provided block and the review card.
- **§9.8, §9.10, §12:** stacked public tables; no phone in the header; a header "How AMC makes money" link that cannot be closed (§3.4); only the money line between the lede and the first field.
- **§13.2, §13.3, §13.5, §13.6:**
  - the local answer first, and counts that equal G1;
  - "based in" apart from "serves";
  - a published sort rule with no money input, the minimum sample and no review-count default;
  - sourced, dated credential fields, a related-party chip and dated reviews.
- **§13.4:** use `/moving-routes/{origin}-to-{destination}/`, per site architecture §2.1 (matrix §6).
- **§13.7, §13.8:** number the steps to match §2.1.
  - Add "What you need" (step 1, skipped on household-move entry points) and "What we found" (step 5).
  - Put the channel choice on the contact screen (step 6), and cap options at coverage (step 7).
  - The consent step (step 8) always names movers, with remove controls, the money line and separate Terms. It keeps the box, the maximum and the money line visible on phones (§2.4).
  - Confirmation (step 9) lists the consent-list names, a manage link and an unlisted-company report link.
  - Apply the §8.8 tag policy.
- **§14, §15:** axe and keyboard checks on every entry module. Item 2's trademark check covers the badge name. Item 7 adds the role statement and range wording.
- **Tile:**
  - the first screen holds from and to only (step 2 of §2.1);
  - the trust row precedes the video on phones;
  - add a "What we found" demo;
  - the consent demo lists sample movers (USDOT 000000) with remove controls, separate Terms and the money line;
  - options above sample coverage are disabled;
  - add a credential row and a review card;
  - reword the "See available movers" CTA in AMC's own words, tied to the coverage result (the §5.3 and §13.1 item above).

## 9. Mover side: portal, pricing and admin

### 9.1 Published buying rules
Before sign-up, `/for-movers/pricing/` states:
- what a buyer sees before and after purchase;
- how prices are set: per company, and per move category if brief §11 Q6 is approved;
- the consumer-set cap and exclusivity;
- the credit schedule, with a worked three-buyer example (shared pricing §3 to §5);
- claim reasons, evidence and window, and reasons that never qualify (no answer yet; the consumer chose another mover);
- card charging at purchase;
- suspension triggers.

Company prices stay private. No captured provider page shows prices or refund terms; only HomeGuide's help pages state a refund trigger [capture; search; sites/movingcom.md; sites/homeguide.md]. Test: at least 80% of L2 interviewees compute a three-buyer net cost from the page alone (JTBD §6.1). Also set a remedy for a consumer who withdraws soon after a purchase, which shared pricing §6 lacks [inference from AMC documents].

### 9.2 Payment never changes order
Inclusion and order in the directory, on geo and comparison pages and in the consent list use only published inputs. They never use purchases, balances, budgets or plans, and a fixture test proves it. `/for-movers/` sells no ranking, award, placement or review product. Billing standing already decides who can be named (lead lifecycle §3 item 1), so "How AMC makes money" says only active accounts are listed [inference]. At the references, Move.org sells placements, MGM's Terms let plans affect order, and HomeGuide drops out-of-budget pros from results until Monday [capture: Move.org /disclosure/, MGM /terms-and-conditions; search: help.homeguide.com article 486, own page; sites/moveorg.md; sites/mygoodmovers.md; sites/homeguide.md].

### 9.3 Buyer-side checks
List the lead lifecycle §4 checks on `/for-movers/moving-leads/`, as Moving.com names its verification [capture /leads/; sites/movingcom.md]. Add pass flags (phone and email validated, consent stored) and the channel choice to the preview (lead lifecycle §5), with no contact data. Test: a preview snapshot test shows the new flags and still no contact data. Make no reach, booked-job or close-rate claim until measured. The FTC's 2022 complaint against HomeAdvisor alleged misrepresented leads; a consent order became final in April 2023 [search: ftc.gov, regulator; sites/homeguide.md].

### 9.4 Van-line and agent eligibility
Record the §4.1 decisions in mover verification §9 before recruiting.

### 9.5 Corporate-family counting
Add owners, parents and affiliates to the application (mover verification §2), and have admin link companies under common control. Allow one purchase per family per lead group. Then a consumer who picks 2 hears from two different firms, and related brands appear together at consent. Change shared pricing §1 and data model §2 and §11 invariant 1 before the first shared sale. Move.org asks whether Allied and North American count as one company, and HireAHelper's footer heads its brands "PARTNERS" [capture /allied-moving-reviews/, footer; sites/moveorg.md; sites/hireahelper.md].

### 9.6 Certificate-of-insurance tracking
Mover verification §2 and §3 already require expiry capture at application, alerts at 30, 14, 7 and 0 days, and suspension of purchases and Preferred status with an honest profile status. Add two things:
- a portal credential page that shows the last check and the next expiry;
- a renewal upload that enters a pending check, so a mover can renew before day 0.

The owner still sets minimums beyond federal filings (mover verification §9 decision 3). HireAHelper requires certificates for full-service bookings and tracks their expiry [capture /movers/; captures/hireahelper.md; sites/hireahelper.md].

### 9.7 Monitoring, spend and CRM
- Admin sees open cases, claim rates, unwanted-contact complaints and invitation coverage. Each metric has a threshold that opens a case (backlog 6.6.7). The owner sets the thresholds before launch. JTBD §6.4's pilot bar, disputes at most 10% of purchases, is a starting point for claim rates.
- Report a problem adds "contact from a company I was not told about", and confirmed resale suspends the company (data model §8).
- Spend caps per company and per agent (daily, weekly, monthly), enforced by `reserve_purchase`, move from Could (MVP scope C2; backlog 6.2.4) to Should, pending JTBD L4. Moving.com and HomeGuide offer budgets [capture /leads/; search: help.homeguide.com articles 306 and 486, own pages; sites/movingcom.md; sites/homeguide.md]. Any later auto-buy is mover-set, first-come and capped, after counsel review (compliance facts §2).
- CRM outcomes feed quality reports and company-requested invitations, never matching, order, price or badges (consent draft §11).
- Any paid CRM add-on is priced on `/for-movers/pricing/` before it bills. The FTC's HomeAdvisor complaint alleged a falsely free add-on [search: ftc.gov, regulator; sites/homeguide.md]. The review recommends removing the "Booking deposits and payments" add-on from MVP scope §5, with any reintroduction needing owner and counsel sign-off (compliance facts §2; D5).

### 9.8 Partner page
`/for-movers/` is self-serve. A USDOT entry says, before an account exists, whether the record looks eligible and why not, with "talk to us" second. Moving.com and HireAHelper run self-serve sign-up, and Move.org appears to sell through its partner team [capture /leads/, /partnership/; sites/movingcom.md; sites/hireahelper.md; sites/moveorg.md]. FMCSA's API terms must allow the check (MVP scope S7).

A later referral program differs from Unpakt's per-booking fee [capture /partnership/; sites/unpakt.md]. It:
- routes partners into AMC's survey and consent;
- pays per qualified request;
- tags traffic as Referral;
- gives partners no consumer data. Any future data-sharing with a partner would need its own unticked box naming the partner. That would change consent draft §3 and §5, so it goes to counsel.

Counsel also reviews the partner disclosure.

## 10. Changes to existing documents

SA-1 to SA-20, B-1 to B-8 and the brief §8 note were applied on 2026-10-28 in this PR, with SA-1 and the brief §8 note in one change so the two documents never disagree. The Status column marks these and a few related edits from the same PR as applied. Every other item is a proposal for the owner and the document owners. In the table, "see §x" points to this document; every other section number belongs to the file in that row.

**Brief §3 corrections (applied on 2026-10-28 in this PR; item numbers refer to the earlier seven-item §3, before the rewrite):**
- **B-1** (opening line): add ConsumerAffairs' `/movers/` folder (about 23.8k visits, about 5.6% of the domain) and HomeGuide's measured moving URLs (at least 1,239 visits, about 0.4%) beside their domain totals, which are no benchmark [semrush top_pages_more_2026-10-27.csv, domain_rank_2026-10-27.json; sites/consumeraffairs.md; sites/homeguide.md]. Link this document.
- **B-2** (item 1): contact-first flows were seen at CMR and MGM. BVL's contact step was never reached. HireAHelper's walk recorded names and a price sort, not prices.
- **B-3** (item 2): three references state a fixed number (Moving.com 4; MGM 3, FAQ only; HomeGuide 5, phone only, 2023). None seen lets the consumer choose; four let them pick one company.
- **B-4** (item 3): the weaknesses seen are consent by submit or site use, Terms in the box, unnamed recipients, and missing automated-call and not-a-condition wording. Arbitration tied to submit appears in an unverified search copy of Move.org's /quote-mayzlin/, outside the verified record, and in an earlier, unconfirmed test-page excerpt (sites/moveorg.md); v1 saw similar wording on /quote-allied/. None was re-confirmed [search: https://www.move.org/quote-mayzlin/, site's own page, possibly stale; v1 §2.11]. ConsumerAffairs' sitewide Terms hold both call consent and binding arbitration [search; sites/consumeraffairs.md]. Claim a separate box only after consent draft §5 is split.
- **B-5** (item 4): HireAHelper is a model only for fields that do not depend on booking and payment.
- **B-6** (item 5): four of nine captured sites show rating or review-count drift, and eight of 11 show figure drift.
- **B-7** (item 6): city pages lead only at HireAHelper (10 of its top 15, 24.6% of visits; 57% of its traffic sits outside the top 15). State cost pages earn at MGM, so "state hubs are a gap" holds for directories only. CMR also runs ZIP-lane route pages earning 1–3 visits [semrush top_pages_2026-10-27.csv, top_pages_more_2026-10-27.csv].
- **B-8** (item 7): AMC's risk is drift into broker-like features and words, not concealment. Add tied companies in rankings, drifting numbers, tags on forms and "preferred" as a paid label.

| File | Section | Change | Priority | Status |
|---|---|---|---|---|
| seo/site-architecture.md | Header; §0 to §8 | SA-1, SA-2, SA-4 to SA-12, SA-14, SA-15, SA-17, SA-18 (see §6.9) | must | applied |
| seo/site-architecture.md | §1.1, §4.5, §5, §7.6, §7.7, §9, §11 | SA-3, SA-13, SA-16, SA-19, SA-20 | should | applied |
| 00-discovery-brief.md | §3; §8; §11 Q4; date line | B-1 to B-8; §3 item 6 naming timing per D7; the §8 "provisional" note replaced in the same change as SA-1; the §8 gate list aligned with SA-12 G1, §4.1 G4, G6 and G9; the §11 Q4 default aligned with G1 (3 per city or route page, 5 per state page); the date line | must | applied |
| 00-discovery-brief.md | Phase 1 report; §2 | The "Not done" row says reference quote flows were seen only up to the contact step; §2 says walks stopped at or before the contact step, that the review of all 11 sites is complete, and that the ConsumerAffairs and HomeGuide reviews have low confidence | should | applied |
| 00-discovery-brief.md | §4 | MVP trust-page list aligned with site architecture §1.2, including "How AMC makes money" and "Which companies receive my request" (SA-10); the directory called "the mover directory (name pending)" (see §5) | should | applied |
| 00-discovery-brief.md | §4 | Booking and deposits stay out of scope; a short note says the review recommends a standing exclusion. The note is applied; the exclusion itself is the owner's decision (see D5) | should | note applied; decision pending |
| 00-discovery-brief.md | §1, §9 | One role wording without bare "licensed"; badge name per §5 | should | proposed |
| business-rules/consent-and-disclosure-copy-draft.md | §1 to §8, §11 | Role-and-money statement; no-sale line out until counsel decides; capped, neutral options; contact-only box with separate Terms; named movers with removal; in §5, the 360px rule and a labeled "show all" (see §2.4); in §4 and §5, the count asked again after removals (see §2.3); an "only this company" variant (see §2.3, §3.3); in §6, `{typical_window}` out until measured (see §2.5); confirmation names; badge money relation (see §3, §4.3); in §3 and §5, a separate box for any partner data-sharing (see §9.8) | must | proposed |
| business-rules/lead-lifecycle-and-purchase-rules.md | §1 to §3, §5, §6 | Canonical steps (see §2.1); no presets; no AMC calls; declined-consent path (see §2.4); in §2 step 8 and §3 item 4, "only this company" (see §2.3); consent-list order; preview flags; evidence fields (see §2, §3.6) | must | proposed |
| business-rules/shared-pricing-and-credits.md | §1, §6, §9 | Family counting (see §9.5); in §1, lead type when removals lower the count (see §2.3); in §6, a withdrawal remedy (see §9.1); claim reasons; published buying rules (see §9) | should | proposed |
| business-rules/mover-verification-and-reviews.md | §1 to §7, §9 | Dual registration stays out; agent and badge-name decisions; ownership fields; related-party check; badge from checks only; credential display; in §5, "only this company", a rule change made only after the JTBD J2 sell-through check (see §2.3); in §6 Collection, a second, post-move invitation, also a rule change (see §4.4); other review rules (see §4, §9.5) | must | proposed |
| research/compliance-and-platform-facts.md | §1 to §4; new §9 | Dual-registration wording; in §2, the recent-request-mix block as a counsel question (see SA-14); certificate as backup; label name; privacy and tracking questions | must | proposed |
| design/visual-direction.md; design/style-tile.html | §3 to §15; hero, survey, trust row | See §8.6, including §9.10's header link, §13.4's route URL and the step numbers (see §2.1) | must | proposed |
| product/mvp-scope.md | §3, §5, §6 | Remove the "Booking deposits and payments" add-on from §5, with any reintroduction needing owner and counsel sign-off (see D5); tie S6 to M1; S7 forecast; spend caps to Should; remove or park C5 (ZIP pages), since site architecture §0 plans none; §6 survey entry (see §2.1) | must | proposed |
| product/jtbd-and-journeys.md | §3.1 pain 3; §4 J1 (stage 5, stage 13, failure modes), J2, J6 (1a, 1b); §6.1 L6; §6.3 | BVL claim unverified; names-before-contact decision; "only this company" and its sell-through check; declined-consent path; post-move invitation; label comprehension and list length in the usability rounds; new tests | should | proposed |
| product/backlog.md | 1.6; 4.1.1 to 4.2.6; 4.4.2; 4.4.3; 4.5.1; 6.1.1; 6.1.2; 6.2.4; 6.5.1; 6.5.2; 6.6.7; 7.3; 7.6; §13 | Matching criteria for §2 to §4 and §9; 4.1.1 skipped on household-move entry points; 4.1.6 confirmed P0; 4.2.4's declined-consent path offers the named movers' profiles (see §2.4); per-mover and per-channel stops in 4.4.2 and 4.4.3 (see §2.6); a post-move invitation in 6.5.1 and 6.5.2 (see §4.4); case thresholds in 6.6.7 (see §9.7); 7.3 keeps below-gate pages unpublished, per site architecture §4.2 | should | proposed |
| architecture/data-model.md; architecture/stack-and-architecture.md | §2, §3, §5, §6, §8, §11 invariant 1; §1 | Family key, with invariant 1 counting families (see §9.5); badge evidence; consent and channel fields; `move_category`; case type; GPC-aware consent tool; no survey recordings | should | proposed |
| research/reference-matrix.md | §1, §3.6, §3.7, §6 | "Provisional" dropped from §1 and §6, now that SA-1 is applied; §3.6's ConsumerAffairs share corrected to about 44% of the folder (about 66% of its top 25) [semrush top_pages_more_2026-10-27.csv, computed]; §3.7's MGM "See Your Price Instantly" cell replaced with captured wording; §3.7's call-to-action bullet reworded per the HireAHelper review; §5 item 6 (booking recommendation) and item 15 (page paths) | should | applied |
| research/reference-matrix.md | §8, §9 | Keep v2's corrections to v1 ("Preferred (paid)"; Move.org "one-to-one"); update the naming gap after §5's decision | should | proposed |
| research/keyword-research.md; seo/keyword-to-page-map.csv | §1, §2, §5; USDOT and brand rows | §1: "city pages drive most traffic" is unproven (see B-7). §2: "smaller metros are achievable" is unproven until the Tallahassee, Beckley and Oshkosh queries are checked; HireAHelper's /services/moving-companies/ is a service pillar, not a best-of guide; state pages do earn at MGM. §5: ConsumerAffairs' and HomeGuide's pages were pulled. Add a mixed-intent note to the USDOT rows, and read brand rows as profile demand | should | proposed |
| research/reference-review/sites/ (five reviews) | Section pointers | Repoint "compliance facts §8" and "site architecture §8.6" or "§8.7" to the tag policy in site architecture §8.8 (SA-18; see §3.5) | could | proposed |

## 11. Open questions for the owner

Each question gives the recommended default and any overlap with brief §11; the rest are new.
1. Show mover names before contact, or a count only? Names with USDOT number and check date, no prices, tested in round 1.
2. If a consumer picks 1, must they also pick the mover? Give counsel both options (§3.3), and use "only this company" on profile requests. Overlaps Q2(a).
3. Offer "only this company" on profile requests? Yes, with a notice if that mover does not buy. It changes mover verification §5, so first measure how often a different mover buys profile-origin requests (JTBD §4 J2).
4. Cap count options at live coverage? Yes, with a maximum of 5. Overlaps Q5.
5. Ask for a contact channel, and price email-only requests differently? Ask; set prices after L1 and L7. Overlaps Q6.
6. Keep "Preferred Mover"? Decide before Phase 3 design sign-off, after counsel clearance and usability round 1 (§5).
7. Mover phone numbers and websites? Never on cards, lists or geo pages. On profiles, your call (site architecture §0 item 4), with a note if hidden. Show at least the website, so a consumer who declines consent can still reach a mover (§2.4).
8. What should "How AMC makes money" say about sharing? A precise line: AMC's revenue rises with each mover that buys a shared request. With the sample prices, an exclusive request earns more than a shared one unless four or five movers buy it (shared pricing §5). The real ratio is set from pilot data. Owner and counsel approve the wording.
9. Third-party grades such as BBB on profiles? Not at launch. BVL's A+ grade sits beside a 1.68/5 BBB review average [search; sites/budgetvanlines.md].
10. Ties between AMC's people and movers, brokers or lead buyers, and badges for related movers? Disclose them, never feature them, and decide badges with counsel. Overlaps Q1.
11. Van-line brands with broker authority, and their agents? Brands stay out; agents with their own carrier authority may qualify. Overlaps Q4.
12. Does a corporate family count as one company? Yes. Overlaps Q5.
13. Remedy for a withdrawal soon after purchase? Credit within a short window set from pilot data. Overlaps Q7.
14. Spend caps per company and per agent at launch? Yes.
15. Which rating goes into markup, and how many reviews before a "top" claim? Move experience; 5.
16. Which consent tool, and any session recording? A GPC-aware tool, and no recordings on survey routes.
17. Named data owners for data blocks? Before cost and geo pages publish. Overlaps Q9.
18. OAI-AdsBot or paid AI presence? Decide with any ChatGPT advertising plan. Overlaps Q12.
