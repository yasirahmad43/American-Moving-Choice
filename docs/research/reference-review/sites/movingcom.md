# Moving.com: reference review

A Realtor.com-network site that sells moving leads to movers; it is on the list as the lead seller whose calculator ranks #1 for "moving cost calculator" [capture /leads/; semrush phrase_organic_top10].

**Reviewed:** 2026-10-27. **Evidence:** partial capture, 6 of 13 pages (calculator, quote page, mover page, three guides); the homepage, About, privacy policy and four other pages showed a bot interstitial; no quote walk; Semrush US (October 2026); standard WebSearch, whose tool refuses moving.com pages. **Confidence:** low, because the homepage, legal pages and the contact and consent steps were not observed.

## At a glance
- Moving.com sells "real time leads" to movers, who set campaigns by route, size and daily and monthly budget; no prices are shown [capture /leads/].
- It shows Realtor.com network logos [capture /leads/]. News Corp bought Realtor.com's operator, Move, Inc., in 2014 [search: rismedia.com, wavgroup.com, third party].
- In the captured text, the consumer tool pages promise free quotes but never say that movers pay or that the details go to them [capture /movers/moving-cost-calculator.asp, /movers/moving-company-quotes.asp].
- Each request goes to "up to 4" movers; the captured form gives no choice of number and names no movers [capture /movers/moving-cost-calculator.asp, /leads/].
- The calculator brings about 30% of estimated organic traffic [semrush top_pages].
- Two pages give different unsourced averages for a 1,000-mile move, $5,450 and $4,890 [capture /movers/moving-cost-calculator.asp, /tips/cheap-ways-to-move-cross-country/].

## Consumer journey

| Step | What it asks | What it shows before contact | Evidence |
|---|---|---|---|
| 1. Calculator | From ZIP, to, size (Studio to 4 Bedroom), packing, date | "Recent Estimates" ranges; "0 miles" before input | [capture /movers/moving-cost-calculator.asp] |
| 1. Quote page (alternative) | Move type (six), from, to, size, date; "Get Quotes" or "Compare Movers" | Trust line with a Privacy Notice link | [capture /movers/moving-company-quotes.asp] |
| 1. Guide form (alternative) | Embedded "billboard" form; fields not captured | Script-built disclaimer | [capture /tips/cheap-ways-to-move-cross-country/] |
| 2. Result, contact, consent | Not observed | Unknown; the page holds a prompt for quotes from "up to 4" movers | [capture; no walk] |
| 3. After submit | Not observed | Steps end "Compare quotes, select the best mover, and save"; follow-up is likely direct mover calls | [capture /movers/moving-company-quotes.asp; inference] |

- Neither first step asks for contact details [capture].
- Move types mix household moves with truck rental, auto transport, labor and international; only "Full Service (They Load - They Drive)" was captured in full [capture /movers/moving-company-quotes.asp].
- Size options overlap (2 Bedroom, 2-3 Bedroom, 3 Bedroom) and no placeholder was captured, so the first option may be preselected [capture; inference].

## Mover side
Movers create a profile (company, phone, services, certifications) and set campaigns by route, weight, size, lead type and daily and monthly budget [capture /leads/]. Moving.com says requests are verified "using third party email and phone verification services" and go to at most four movers [capture /leads/, its own claims]. Its "over 80 million unique users a month" network claim has no source or date [capture /leads/]. The 241-word page shows no prices, refund terms or exclusive option, yet ranks #9 for "buy moving leads" (720/mo, KD 18) [capture /leads/; semrush phrase_organic_top10].

## Trust, verification and reviews
- **Licensing.** Both tool pages say "We require our movers to be licensed and insured," but the captured text gives no method, FMCSA check, USDOT or MC number, or broker exclusion [capture /movers/moving-cost-calculator.asp, /movers/moving-company-quotes.asp]. The quote page tells consumers to check USDOT numbers themselves [capture /movers/moving-company-quotes.asp].
- **Advice.** The tool pages cover estimate types, getting at least three quotes and surveys [capture]. The non-binding definition breaks off at "may deviate slightly", so whether it states the 110% limit is unknown [capture /movers/moving-company-quotes.asp].
- **Role wording.** A guide says "our network of reputable and reliable movers makes it easy to find and book" movers; the quote page title promises "Compare and Save" with no figure [capture /tips/cheap-ways-to-move-cross-country/, /movers/moving-company-quotes.asp].
- **Reviews.** None observable: review and best-of pages were blocked, and no captured page lists a top-level Review or AggregateRating type [capture].

## Disclosure and consent
- **Who pays.** Only /leads/ shows movers buying leads; the trust line beside both forms links only to a Privacy Notice [capture]. Footers were not captured and the homepage, About and privacy policy were blocked, so a disclosure elsewhere cannot be ruled out [capture].
- **Consent.** The wording was not captured. The guide form builds its disclaimer in script from the submit-button text (`getTcpa(sSubmitText, …)`) [capture /tips/cheap-ways-to-move-cross-country/], which usually means a "by clicking" notice, not a checkbox [inference]. No consent-certificate script, named sellers, texting language, "not a condition of purchase" or arbitration was observed [capture].
- **Scripts.** 28 script hosts load across the captured pages, including Facebook, TikTok and Pinterest pixels, Criteo and RTB House retargeting, and Hotjar and Clarity session replay; per-page loading was not recorded [capture]. A Google publisher ad tag suggests display ads [inference].

## SEO and content
- **Scale.** About 64,797 estimated visits a month and no paid keywords; it has the most referring domains of the four measured (19,777) but only about 3.3 visits per referring domain, against 10.7 for HireAHelper [semrush domain_rank, backlinks_overview; ratio computed].
- **Calculator.** /movers/moving-cost-calculator.asp gets about 19,426 visits (29.97%) and ranks #1 for "moving cost calculator" (5,400/mo, KD 49) and #3 for "how much do movers cost" [semrush top_pages, phrase_organic_top10]. That URL is the whole 1/10 overlap behind AMC's tool and cost-guide split [semrush; site-architecture §3.1]. A realtor.moving.com copy ranks #5, canonical unknown [semrush].
- **Page mix.** The 15 kept pages hold 68.4% of traffic: tools 34.2%, relocation lists 16.5%, home 11.4%, best-of 4.2% [semrush top_pages, computed]. The quote page and the tipping and cheap-ways guides are absent, and no geo or profile template was observed [semrush; capture].
- **Best-of.** The long-distance list ranks #6 for "best long distance moving companies" (49,500/mo, KD 36), where half the top 10 is van-line or mover pages; a separate out-of-state page mirrors AMC's own split [semrush; site-architecture §3.1].
- **Structure.** Legacy .asp tools sit beside a /tips/ blog and the subdomain [capture; semrush]. FAQPage is on 3 of 6 pages, months after FAQ rich results ended, and the quote page has two Organization nodes [capture].
- **Quality.** Neither average cost has a source or date, and the tipping guide cites "the consensus" [capture /tips/tipping-movers/]. Only the car-trailer guide shows an author box and a method (three rental quotes on one route) [capture /tips/car-trailer-rental-cost-and-tips/]. Quotable formats include a question heading with a one-line answer, estimate-type definitions and a cost table [capture].
- **AI crawlers.** Anthropic's web search refused moving.com as "not accessible to our user agent", in v1 and again now; other engines were not tested [search; v1 §1].

## Design and UX
On mobile, the form follows the H1 on both tool pages, with a number pad for the origin ZIP and a trust line beside it [capture]. Weak spots: two share links before the calculator's first field, "Moving Distance: 0 miles" before input, and two submit buttons the captured text never explains [capture]. The 4,977-word calculator page puts cost sections and an FAQ below the tool; its "Recent Estimates" block has no date, source or sign that entries are real requests [capture /movers/moving-cost-calculator.asp].

## What AMC should adopt or adapt
AMC cannot match this reach, so it should compete on what the captured pages lack: movers only, the consumer's choice of how many movers, and named-mover consent [inference].
- **Details-first, form-first opening** [capture]. Add a labeled range from AMC's cost model and the coverage pre-check before contact, and link the trust line to AMC's verification method and "how we make money". Serves value before contact (lead-lifecycle §2 steps 1 to 5).
- **One stated maximum** [capture]. Read the admin-set maximum at render time, let the consumer pick 1 to it, name the movers at consent, and say "we found N movers" only when the pre-check did. Serves the company-count question (lead-lifecycle §2 steps 5, 7, 8; shared-pricing-and-credits §1).
- **Tool-first calculator** [capture; semrush]. Add a sourced method page and a link to /moving-costs/; call the result a cost range, not a quote, and state the 110% rule precisely after counsel review. Serves W1 SEO and estimate rules (site-architecture §1.2, §3.1, §6.3; compliance facts §2).
- **Service-type notes** [capture /movers/moving-company-quotes.asp]. Say in AMC's words who does the work; sell household moves (vehicle add-on only via movers that ship cars themselves) and labor-only requests, and send truck rental and standalone car shipping to information pages. Serves MVP scope (mvp-scope §6).
- **Sourced consumer guidance** [capture]. Keep answer-first headings, tables, stated price methods and topics like USDOT checks and estimate types, but date and source every number, cite FMCSA's Rights and Responsibilities booklet, name a reviewer, and explain fewer calls versus more comparison [inference]. Serves editorial rules, trust pages and AI answers (site-architecture §6.3, §7.2, §7.4; compliance facts §1).
- **Recent estimates** [capture]. Show a dated route and size mix from consented requests above the thresholds (n of 30 or more, cells under 10 suppressed), with prices only from the cost model. Serves data rules (site-architecture §6.3, §7.5).
- **Best-of pages by measured intent** [semrush]. Give each a published method and real review data, behind the comparison gate. Serves rankings and SEO (site-architecture §4.6).
- **Mover terms in public** [capture /leads/]. Publish the price basis, shared-lead credits and quality-claim process on /for-movers/, and log budget controls as input to discovery question L4. Serves the company portal (shared-pricing-and-credits §3, §6; jtbd-and-journeys).

## What AMC should avoid
- Tool pages that never say who pays; put "how we make money" by every quote button, at consent and in the header (site-architecture §7.1, §7.2; consent draft §1, §3, §7).
- Consent tied to the submit button; use one versioned, unticked box on every entry point that names the movers, covers calls and texts, says "not a condition of purchase" and omits arbitration (consent draft §5; compliance facts §3; lead-lifecycle §6).
- A bare "licensed and insured"; state USDOT registration, carrier authority, no broker authority, insurance on file and a check date, and tighten AMC's own "licensed" draft, since movers hold operating authority [inference] (mover-verification §3, §4; consent draft §1, §2).
- "Our movers", "book" and "we'll send you quotes" wording that implies AMC arranges moves (compliance facts §2).
- Unsourced reach, savings and cost claims; one versioned cost store should feed every page (site-architecture §6.3, §7.1, §9; reference-matrix §4 item 7).
- Overlapping or preselected size options, placeholder values and share links before the first field (lead-lifecycle §3; reference-matrix §3).
- Display ads on money pages, and pixels or session replay on the survey, contact and consent steps; ask counsel about wiretap-law (CIPA) exposure (site-architecture §8.7; compliance facts §8).
- Crawlable tool copies on other hosts, FAQPage markup and multiple Organization nodes (site-architecture §2.4, §8.5).
- Bot settings that block answer engines; allowlist verified bots and test fetches monthly (site-architecture §7.6).

## Gaps and open questions
- The contact step, consent text and follow-up calls; walk the form by hand to that step, entering no personal data.
- Whether movers are named, whether fewer than four can be chosen, and what "Compare Movers" does.
- Homepage, About, privacy, terms and the "National Holding Company" footer block [capture]. A Move, Inc. privacy notice covering affiliates is on zenlist.com, not confirmed as Moving.com's [search: https://www.zenlist.com/privacy, third party].
- Review pages, how "licensed and insured" is checked, whether brokers can buy, and mover prices and refund rules.
- Regulator records: none naming Moving.com came up in a limited search, which proves nothing either way [search].
- Lawsuits naming Move, Inc. (Faucett v. Move; Apaydin v. Move) surfaced in search but were not re-verified; check the dockets before citing them [search].
- Sources behind the cost figures and "Recent Estimates"; robots.txt; AI answer surfaces (add Moving.com to the §7.7 baseline).
- v1 cited 2012 press saying "up to six licensed movers"; the capture shows "up to 4" [v1 §2.5; capture].

## Sources
- Evidence: `docs/research/reference-review/captures/movingcom.md`, `_provenance.md`; private raw pack `packs/movingcom.md`.
- v1: `docs/research/reference-matrix.md` §1, §2.5, §3, §4.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/` (domain_rank, top_pages, phrase_organic_top10, backlinks_overview); `docs/seo/raw/semrush_phrase_organic_top10_2026-10-27.csv`; `docs/research/keyword-research.md` §3.
- AMC docs: `docs/business-rules/*.md` (consent draft = consent-and-disclosure-copy-draft), `docs/product/mvp-scope.md`, `jtbd-and-journeys.md`; `docs/research/compliance-and-platform-facts.md` (compliance facts); `docs/seo/site-architecture.md`.
- Pages: https://www.moving.com/ and the paths cited. Third party: https://www.rismedia.com/2014/11/14/move-inc-officially-acquired-by-news-corp/, https://www.wavgroup.com/2014/09/30/news-corp-buys-move-operators-of-realtor-com/, https://www.zenlist.com/privacy.
- WebSearch (standard, 2026-10-27), 12-search budget; site-limited queries were refused.
