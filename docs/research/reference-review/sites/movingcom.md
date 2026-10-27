# Moving.com: reference review

A lead site in the Realtor.com network that sells moving requests to movers; it is on the list as the lead seller whose cost calculator ranks #1 for "moving cost calculator" [capture /leads/; semrush phrase_organic_top10].

**Reviewed:** 2026-10-27. **Evidence:** partial capture, 6 of 13 pages (calculator, quote page, mover page, three guides); the homepage, About, privacy policy and four other pages showed a bot interstitial; no quote walk; Semrush US (October 2026); standard WebSearch, which refuses moving.com itself. **Confidence:** low, because the homepage, legal pages and the contact and consent steps were not observed.

## At a glance
- Moving.com sells "real time leads" to movers, who set campaigns by route, size and daily and monthly budget; no prices are shown [capture /leads/].
- It shows Realtor.com network logos [capture /leads/]. News Corp bought Realtor.com's operator, Move, Inc., in 2014 [search: rismedia.com, wavgroup.com, third party].
- In the captured text, the consumer tool pages promise free quotes but never say that movers pay or that the details go to them [capture /movers/moving-cost-calculator.asp, /movers/moving-company-quotes.asp].
- Each request goes to "up to 4" movers; the captured form gives no choice of number and names no movers [capture /movers/moving-cost-calculator.asp, /leads/].
- The calculator brings about 30% of estimated organic traffic [semrush top_pages].
- Two pages give different unsourced averages for a 1,000-mile move: $5,450 and $4,890 [capture].

## Consumer journey

| Step | What it asks | What it shows before contact | Evidence |
|---|---|---|---|
| 1. Calculator | From ZIP, to, size (Studio to 4 Bedroom), packing, date | "Recent Estimates" ranges; "0 miles" before input | [capture /movers/moving-cost-calculator.asp] |
| 1. Quote page (alternative) | Move type (six), from, to, size, date; "Get Quotes" or "Compare Movers" | Trust line with a Privacy Notice link | [capture /movers/moving-company-quotes.asp] |
| 1. Guide form (alternative) | Embedded "billboard" form; fields not captured | Script-built disclaimer | [capture /tips/cheap-ways-to-move-cross-country/] |
| 2. Result, contact, consent | Not observed | Unknown; the page holds a prompt for quotes from "up to 4" movers | [capture; no walk] |
| 3. After submit | Not observed | Steps end "Compare quotes, select the best mover, and save" | [capture /movers/moving-company-quotes.asp] |

- Neither first step has a contact field [capture]. The quote page says visitors give "move details and contact information", but that step was not seen [capture /movers/moving-company-quotes.asp].
- Move types mix household moves with truck rental, auto transport, labor and international; only "Full Service (They Load - They Drive)" was captured in full [capture /movers/moving-company-quotes.asp].
- Size options overlap (2 Bedroom, 2-3 Bedroom, 3 Bedroom) and no placeholder was captured, so the first option may be preselected [capture; inference].
- Follow-up looks like direct mover calls, since /leads/ sells "real time leads" and no booking was seen [inference].

## Mover side
Movers create a profile (company, phone, services, certifications) and set campaigns by route, weight, size, lead type and daily and monthly budget [capture /leads/]. Moving.com says requests are verified "using third party email and phone verification services" and go to at most four movers [capture /leads/, its own claims]. Its network claim, "over 80 million unique users a month", has no source or date [capture /leads/]. The 241-word page shows no prices, refund or credit terms, or exclusive option, yet ranks #9 for "buy moving leads" (720/mo, KD 18) [capture /leads/; semrush phrase_organic_top10]. The header carries an "Advertise" link, target not captured [capture].

## Trust, verification and reviews
- **Licensing.** Both tool pages say "We require our movers to be licensed and insured" with no stated method [capture /movers/moving-cost-calculator.asp, /movers/moving-company-quotes.asp]. The captured text mentions no FMCSA check or broker exclusion and shows no USDOT or MC numbers; the quote page asks consumers to check USDOT numbers themselves [capture /movers/moving-company-quotes.asp].
- **Advice.** The quote page explains three estimate types and getting at least three quotes, and the calculator advises an in-person or video survey [capture]. The non-binding definition breaks off at "may deviate slightly", so whether it gives the 110% limit is unknown [capture /movers/moving-company-quotes.asp].
- **Role wording.** A guide says "our network of reputable and reliable movers makes it easy to find and book" movers, and the quote page title promises "Compare and Save" with no figure [capture /tips/cheap-ways-to-move-cross-country/, /movers/moving-company-quotes.asp].
- **Reviews.** None observable: review and best-of pages were blocked, and no captured page lists a top-level Review or AggregateRating type [capture].
- **Records.** No FMCSA, FTC or state attorney general action naming Moving.com came up within the search budget; that does not prove none exists [search].

## Disclosure and consent
- **Who pays.** Only /leads/ shows movers buying leads, and the trust line beside both forms links only to a Privacy Notice [capture]. Footers were not captured and the homepage, About and privacy policy were blocked, so a disclosure elsewhere cannot be ruled out [capture].
- **Consent.** The wording was not captured. The guide form builds its disclaimer in script from the submit-button text (`getTcpa(sSubmitText, …)`) [capture /tips/cheap-ways-to-move-cross-country/], which usually means a "by clicking" notice, not a checkbox [inference]. No consent-certificate script, named sellers, texting language, "not a condition of purchase" or arbitration was observed [capture].
- **Scripts.** 28 hosts load across the captured pages, including Facebook, TikTok and Pinterest pixels, Criteo and RTB House retargeting, and Hotjar and Clarity session replay; per-page loading was not recorded [capture]. A Google publisher ad tag suggests display ads [inference].

## SEO and content
- **Scale.** About 64,797 estimated visits a month, no paid keywords, Authority Score 48 and the most referring domains of the four measured (19,777), but only about 3.3 visits per referring domain, against 10.7 for HireAHelper [semrush domain_rank, backlinks_overview; ratio computed].
- **Calculator.** /movers/moving-cost-calculator.asp gets about 19,426 visits (29.97%) and ranks #1 for "moving cost calculator" (5,400/mo, KD 49) and #3 for "how much do movers cost" (9,900/mo) [semrush top_pages, phrase_organic_top10]. It is the only URL in both top 10s, the whole 1/10 overlap behind AMC's tool and cost-guide split [semrush; site-architecture §3.1]. A realtor.moving.com copy ranks #5; it was not captured, so its canonical tag is unknown [semrush].
- **Page mix.** The 15 kept pages hold 68.4% of traffic: tools 34.2%, relocation lists 16.5%, home 11.4%, best-of pages 4.2% [semrush top_pages, computed]. The quote page and the tipping and cheap-ways guides are not among them, and no geo or profile template was observed [semrush top_pages; capture].
- **Best-of.** /best-long-distance-moving-companies/ ranks #6 for "best long distance moving companies" (49,500/mo, KD 36), where five of ten results are van-line or mover pages; a separate out-of-state page gets about 1,700 visits [semrush].
- **Structure.** Legacy .asp tools sit beside a /tips/ blog, root best-of pages and the subdomain [capture; semrush]. BreadcrumbList is on 5 of 6 pages and FAQPage on 3, months after FAQ rich results ended; the quote page has two Organization nodes [capture].
- **Quality.** Neither average cost has a source or date, and the tipping guide cites "the consensus" [capture /tips/tipping-movers/]. Only the car-trailer guide shows an author box and a method (three rental quotes on one route), and no reviewer or editorial policy was seen [capture /tips/car-trailer-rental-cost-and-tips/].
- **Answer formats.** A question heading with a one-line answer, estimate-type definitions, a cost table and a rule of thumb [capture].
- **AI crawlers.** Anthropic's web search refused moving.com as "not accessible to our user agent", in v1 and again now; other engines were not tested [search; v1 §1].

## Design and UX
On mobile, the form follows the H1 on both tool pages, after two share links on the calculator [capture]. The origin ZIP field brings up a number pad, and a short trust line sits with each form [capture]. Weak spots: share links before the first field, "Moving Distance: 0 miles" before input, and two submit buttons the captured text never explains [capture]. The calculator page runs 4,977 words, with cost sections and an FAQ below the tool [capture /movers/moving-cost-calculator.asp]. Its "Recent Estimates" block shows city pairs, sizes and ranges with no date, source or sign that entries are real requests [capture /movers/moving-cost-calculator.asp].

## What AMC should adopt or adapt
AMC cannot match this reach, so it should compete on what the captured pages lack: movers only, the consumer's choice of how many movers, and named-mover consent [inference].
- **Details-first opening** [capture]. Follow it with a labeled range from AMC's versioned cost model and the coverage pre-check, both before contact. Serves value before contact (lead-lifecycle §2 steps 1 to 5).
- **One stated maximum** [capture]. Read the admin-set maximum at render time, let the consumer pick 1 to it, name the movers at consent, and say "we found N movers" only when the pre-check did. Serves the company-count question (lead-lifecycle §2 steps 5, 7, 8; shared-pricing-and-credits §1).
- **Tool-first calculator** [capture; semrush]. Add a sourced method note, a versioned method page and a link to /moving-costs/; call the result a cost range, not a quote, and state the 110% rule precisely after counsel review. Serves W1 SEO and estimate rules (site-architecture §1.2, §3.1, §6.3; compliance facts §2).
- **Service-type notes** [capture /movers/moving-company-quotes.asp]. Say in AMC's words who does the work. Sell household moves (vehicle add-on only through movers that ship cars themselves) and labor-only requests; send standalone vehicle shipping and truck rental to information pages. Serves MVP scope (mvp-scope §6).
- **Consumer-protection topics** [capture]. Cover USDOT checks, estimate types and surveys in original words citing FMCSA's Rights and Responsibilities booklet, and explain fewer calls versus more comparison [inference]. Serves trust pages (compliance facts §1; consent draft §6).
- **Stated price method** [capture /tips/car-trailer-rental-cost-and-tips/]. Add the collection date, inputs, a recheck date and a named reviewer; never call one set of quotes an average. Serves editorial rules (site-architecture §6.3, §7.2).
- **Recent estimates** [capture]. Show a dated route and size mix from consented requests above the thresholds (n of 30 or more, cells under 10 suppressed), with prices only from the cost model, labeled as calculator ranges. Serves data rules (site-architecture §6.3, §7.5).
- **Answer-first formats** [capture]. Add a source and date beside each number and cite 49 CFR Part 375. Serves AI answers (site-architecture §6.1, §7.4).
- **Form-first mobile hero** [capture]. Keep the number pad and trust line, and link the line to AMC's verification method and "how we make money". Serves the survey and trust pages.
- **Guide entry points** [capture]. Every entry point should open the same survey and versioned consent component, with the rendered text hashed into the record. Serves consent evidence (lead-lifecycle §6).
- **Mover terms in public** [capture /leads/]. Publish the price basis, shared-lead credits and quality-claim process on /for-movers/, and log budget controls as input to discovery question L4. Serves the company portal (shared-pricing-and-credits §3, §6; jtbd-and-journeys).

## What AMC should avoid
- Tool pages that never say who pays; put "how we make money" beside every quote button, at consent and in the header (site-architecture §7.1, §7.2; consent draft §1, §3, §7).
- Consent tied to the submit button; use a separate unticked box naming the movers, covering calls and texts, with "not a condition of purchase" and no arbitration (consent draft §5; compliance facts §3, §8).
- A bare "licensed and insured"; state USDOT registration, carrier authority, no broker authority and insurance on file, with a check date. Tighten AMC's own "licensed" draft, since movers hold operating authority, not one license [inference] (mover-verification §3, §4; consent draft §1, §2).
- "Our movers", "book" and "we'll send you quotes" wording that implies AMC arranges moves (compliance facts §2).
- Unsourced reach, savings and cost claims; one versioned cost store should feed every page, checked by drift CI (site-architecture §6.3, §7.1, §9; reference-matrix §4 item 7).
- Overlapping or preselected size options (lead-lifecycle §3; shared-pricing-and-credits §6).
- Placeholder values and share links before the first field (reference-matrix §3).
- Display ads on money pages, and pixels or session replay on the survey, contact and consent steps; add wiretap-law (CIPA) exposure as a question for counsel (site-architecture §8.7; compliance facts §8).
- Crawlable tool copies on other hosts, FAQPage markup and more than one Organization node (site-architecture §2.4, §8.5; compliance facts §5).
- Bot settings that block answer engines; allowlist verified bots and test fetches monthly (site-architecture §7.6).

## Gaps and open questions
- The contact step, the consent text (checkbox or "by clicking", named sellers, texting, arbitration) and follow-up calls. Walk the form by hand to the contact step, entering no personal data.
- Whether movers are named, whether fewer than four can be chosen, and what "Compare Movers" does.
- Homepage, About, privacy, terms and the "National Holding Company" footer block [capture]. A Move, Inc. privacy notice covering affiliates is on zenlist.com, not confirmed as Moving.com's [search: https://www.zenlist.com/privacy, third party].
- Review and best-of pages, how "licensed and insured" is checked, and whether brokers can buy leads.
- Mover prices, refund rules, exclusivity and what movers see before buying.
- Lawsuits naming Move, Inc. (Faucett v. Move; Apaydin v. Move) surfaced in search but were not re-verified; check the dockets before citing them [search].
- Sources and dates behind the cost figures and "Recent Estimates"; JSON-LD properties; robots.txt; AI answer surfaces (add Moving.com to the §7.7 baseline).
- v1 cited 2012 press saying "up to six licensed movers"; the capture shows "up to 4" [v1 §2.5; capture].

## Sources
- Evidence: `docs/research/reference-review/captures/movingcom.md`, `_provenance.md`; private raw pack `packs/movingcom.md`.
- v1: `docs/research/reference-matrix.md` §1, §2.5, §3, §4.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/` (domain_rank, top_pages, phrase_organic_top10, backlinks_overview); `docs/seo/raw/semrush_phrase_organic_top10_2026-10-27.csv`; `docs/research/keyword-research.md` §3.
- AMC docs: `docs/business-rules/*.md` (consent draft = consent-and-disclosure-copy-draft), `docs/product/mvp-scope.md`, `jtbd-and-journeys.md`; `docs/research/compliance-and-platform-facts.md` (compliance facts); `docs/seo/site-architecture.md`.
- Pages: https://www.moving.com/ and the paths cited. Third party: https://www.rismedia.com/2014/11/14/move-inc-officially-acquired-by-news-corp/, https://www.wavgroup.com/2014/09/30/news-corp-buys-move-operators-of-realtor-com/, https://www.zenlist.com/privacy.
- WebSearch (standard, 2026-10-27), 12-search budget; site-limited queries were refused.
