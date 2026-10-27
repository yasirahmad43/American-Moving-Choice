# Consumer Moving Reviews: reference review

An editorial site that ranks long-distance movers, publishes route guides and runs a quote-matching form [capture /, /request-a-quote/]. It is on the list as the closest model for a published ranking method and badge explainers, and as a warning about ownership conflicts [inference].

**Reviewed:** 2026-10-27. **Evidence:** 10 of 10 pages captured; guided walk of `/request-a-quote/` to the contact step (step 2 of 2), with no contact details entered and nothing submitted; automated walk of the homepage estimator (one input); Semrush US (domain summary, top 15 pages); six single-run WebSearch queries, with unconfirmed results marked or left out. **Confidence:** medium, because nothing after submit, and no profile, review, legal or mover-facing page, was seen.

## At a glance
- CMR says it is "an editorial review site, not a mover", yet collects contact details for "a vetted moving specialist" [capture, walk /request-a-quote/].
- No captured text says how CMR earns money. Only a meta description mentions "advertiser compensation", which the page body denies [capture /advertiser-disclosure/].
- CMR names its owner, Preferred Movers Network Inc., and two "related companies" that lead the quick answer on both captured best-of pages [capture /best-interstate-moving-companies/, /best-movers-for-small-long-distance-moves/].
- Contact details come on screen 2, before any price, mover name or company count [walk /request-a-quote/].
- Consent is one "By submitting" line, with no checkbox and no named seller [capture, walk /request-a-quote/].
- Worth adapting: dated FMCSA checks, USDOT and carrier or broker labels per row, explained badges and a published method [capture /best-interstate-moving-companies/, /how-we-rank-movers/].
- About 191 estimated organic visits a month, 85% of them to one company profile [semrush domain_rank, top_pages_more].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 1. "Where are you moving?" | From and to, state lists only; "Continue →" | Trust row; below the button, "LONG DISTANCE MOVES OVER 250 MILES ONLY" and the consent line | [walk; capture /request-a-quote/] |
| 2. "How can we reach you?" | Name, email, phone, move size, date; a hidden "Company website" field (likely a spam trap); "Get my matches" | No price, mover name or company count; "A specialist will call to discuss your move" | [walk /request-a-quote/] |
| After submit | Not observed | Not observed | [walk] |
| Side path: homepage estimator | States, road miles, weight or cubic feet, add-ons; no contact fields | Output not recorded | [capture /; walk /] |

- The hero promises "two quick questions", but screen 2 adds five fields; the form's own "Two quick questions to start" is closer [capture /request-a-quote/; walk].
- Copy says both "the right carrier" and "your carriers" [capture /request-a-quote/]. v1's profile CTA of "up to 4 quotes" is unconfirmed [v1 §2.1].
- Step 2 says "We'll need to speak with you to give an accurate quote", while an H2 promises "Know your number before you talk to anyone"; that section was not captured [walk; capture /request-a-quote/].
- One estimator walk (Arizona → Arizona, "Find Movers") landed on the interstate ranking. The header has a "Find Movers" link too, so one input proves little [walk /].

## Mover side
No "for movers", "advertise" or "list your company" link, join path, lead price or sharing rule appeared [capture, navigation]. The interstate page says "No mover pays to be listed or ranked." and discloses consulting ties, the owner and two related movers, but no paid relationship [capture /best-interstate-moving-companies/]. AMC should publish its mover path, pricing rules and factors, sharing cap and credit policy, and keep a conflicts register in the admin portal (shared-pricing §3).

## Trust, verification and reviews
- **Conflict.** "CMR is owned by Preferred Movers Network Inc.", and A Plus Moving and Storage and Jacob and Sons are "related companies", in a sentence the capture cuts off [capture /best-interstate-moving-companies/]. It adds "Each holds its own USDOT number and is scored on its own record." [capture]. Just below, the quick answer puts A Plus first at 10.0, the only 10.0 seen, and Jacob and Sons (9.4) ahead of MC Movers (9.6) [capture]. The small-moves page leads with the same two and shows Jacob and Sons "quotes from $1,799.99", with no related-company line captured [capture /best-movers-for-small-long-distance-moves/].
- **Badges and licensing.** A gold "Certified Approved seal" and a teal "Verified mark" each get a one-line meaning, and CMR says neither is paid [capture /how-we-rank-movers/, /advertiser-disclosure/]. Lists state an FMCSA authority check "on Oct 23, 2026", rows show "Carrier · USDOT 3006268", brokers are labeled, and lower scorers stay listed so readers can look up a mover they were quoted [capture /best-interstate-moving-companies/, /best-movers-for-small-long-distance-moves/]. CMR says featured movers show a BBB grade; no MC numbers appeared [capture /how-we-rank-movers/].
- **Method.** Five pillars, re-checks "every 3 to 6 months" and a "No invented data" rule are published [capture /editorial-methodology/, /, /about/]. Bylines name teams, not people, and /about/ words the criteria differently [capture /best-interstate-moving-companies/, /about/].
- **Numbers.** Home counters (8,200+ moves tracked, 900+ profiles) carry no captured source or date [capture /]. The interstate list covers 29 verified interstate movers, about 3% of the profiles [capture /best-interstate-moving-companies/; inference: arithmetic]. The quote form says "OVER 250 MILES"; the interstate page says "about 400 miles", citing a mover (E.E. Ward), and recommends only scores of 7.0 or higher. The small-moves page states no threshold and gives Bekins (6.9) a "Best" pick [capture]. v1's score and BBB-grade conflicts were not re-confirmed [v1 §2.1].
- **Reviews.** A sitewide "Write a Review" link exists, but the form was not captured. Third-party feedback feeds an editorial 1-to-10 score, and no Review or AggregateRating type was among top-level JSON-LD [capture /how-we-rank-movers/, /editorial-methodology/].

## Disclosure and consent
- **Role and money.** The role line sits under the fourth H2, below the form [capture /request-a-quote/]. /advertiser-disclosure/ says "There are no paid placements on CMR." and treats referral fees as hypothetical ("If we ever earn a referral fee…"), where v1 had "may earn" [capture; v1 §2.1].
- **Consent.** "By submitting, you agree to be contacted by a vetted moving specialist. We never sell your info." sits under the step-1 button [capture /request-a-quote/]. Step 2 had no checkbox and no call or text wording, and no arbitration wording was seen [walk]. The line lacks the written-consent elements in compliance facts §3; whether they applied depends on how the specialist calls, which was not observed [inference].
- **Sharing.** "We never sell your info" and "Private by default" stand without a captured privacy policy, so recipients are unknown [capture /request-a-quote/, /advertiser-disclosure/].
- **Broker-like wording.** The "accurate quote" line, moves "booked through the CMR network" and "2,046 BOOKED MOVES PRICED" describe pricing and booking [walk; capture /best-movers-for-small-long-distance-moves/, /]. Matching to "the top-rated carriers" is framed as CMR's judgment [capture /request-a-quote/]. No USDOT or MC number for CMR appeared [capture]. Compliance facts §2 lists such activities as broker risks; this is a risk pattern, not a finding that CMR is a broker.
- **Tracking.** Tag Manager, Clarity session replay, Bing, Facebook, Google Ads and a bzrcdn.openai.com script load; no consent-certificate script was detected [capture].

## SEO and content
- **Traffic.** CMR gets 191 visits a month from 879 keywords, worth $187, with no paid keywords [semrush domain_rank]. That is a tenth of Budget Van Lines' 1,934 visits, though BVL has only 178 keywords [semrush; keyword-research §1].
- **Profiles.** /companies/jason-jasons-relocations/ brings 162 visits (84.81%) from 2 keywords, and profiles take 177 of 191 [semrush top_pages_more]. The keywords were not pulled; they are most likely the company's name [inference].
- **Routes.** Four ZIP-to-ZIP lanes earn 1 to 3 visits each [semrush top_pages_more]. /routes/state/ca/ lists title-cased anchors such as "Fresno Ca 93722 To Inman Sc 29349" under generic H2s, while /routes/ promises data "for that exact move" [capture]. No lane page was captured.
- **Best-of pages.** The home menu lists at least 10, including Interstate, Long Distance, Nationwide and Cross-Country, confirming v1's overlap concern [capture /; v1 §2.1]. The two captured run 9,708 and 12,344 words and miss the top 15, which reaches 0-visit rows [capture; semrush].
- **Shapes and markup.** The interstate page opens with a quick answer, jump index and plain definition, but its disclosure is a separate block a quote can drop [capture /best-interstate-moving-companies/; inference]. FAQPage stays on 4 of 10 pages, and Article marks up hubs [capture].
- **Other.** Families (best-of lists, route hubs and lanes, a /companies/ directory, shipping pages, tools, a six-link trust group) sit in a grouped footer [capture; semrush]. An "of the month" label clashes with 3-to-6-month re-checks [capture /]. URLs include a 2-letter state hub, a "-3" slug suffix and a HireAHelper profile [capture /routes/state/ca/; semrush]. Car-shipping URLs and the "2026 Moving Cost Report" earn little or nothing measurable [semrush; capture /].
- **For AMC.** Treat CMR as a model for trust patterns, not SEO, and start with low-difficulty families such as "usdot number lookup" (KD 18) and state routes (KD 10–25) [semrush keyword-research §3].

## Design and UX
On mobile, /request-a-quote/ opens on the form with no H1 above the fold [capture]. On the four desktop pages recorded, "(888) 695-0663" precedes "Get a Quote", and best-of pages pair "Get free quotes" with a call line [capture /, /best-interstate-moving-companies/]. Best-of pages repeat inline ZIP forms, and one table says "Scroll sideways on a phone." [capture /best-movers-for-small-long-distance-moves/].

## What AMC should adopt or adapt
- **Dated licensing rows.** Better: USDOT (and MC where held), an FMCSA link and a verified-on date on every listing, rechecked weekly; exclude brokers and offer a lookup tool instead. Serves movers-only (mover-verification §3, §5).
- **Badge explainer.** Better: one "Preferred Mover — American Moving Choice" badge with a clipboard-check glyph and date, never a seal or "certified". Serves the badge rules (copy draft §8; visual-direction §3, §8).
- **Published method.** Better: one versioned method page with criteria named identically everywhere, "data as of" dates, "insufficient data" labels, an FMCSA data-sources page and named authors. Serves trust pages (site-architecture §7.2–§7.3; reference-matrix §3).
- **Short first screen and honeypot.** Better: ZIP or city, date, size and services first, the coverage pre-check, then contact, with honest step copy. Serves the survey order (lead-lifecycle §2).
- **Value before contact.** Better: a labeled range and matched-mover preview inside the survey, before contact, pre-filled from the calculator, whose users go to the survey, not a ranking. Serves the value-before-contact goal (site-architecture §6.3; compliance facts §2).
- **Inventory step.** Better: frame it as preparation for the mover's own survey, never a sight-unseen estimate. Serves lead quality (compliance facts §2).
- **Answer-first rankings.** Better: quick answer, jump index, mover-check sections and FMCSA-sourced definitions, with the material-connection line inside the ranking block and stacked cards on phones. Serves SEO and AI visibility (site-architecture §4.6, §7.4; visual-direction §12).
- **Profiles as early traffic.** Better: prioritize the completeness gate; a profile-started request names that company first while the consumer picks the count. Serves profiles (mover-verification §5; copy draft §4) [inference].

## What AMC should avoid
- Ranking or featuring companies tied to AMC or its staff by ownership, family or consulting. Add a related-party check in Admin review and disclose ties on profiles; badge eligibility is an owner decision, and the FTC question is for counsel (mover-verification §4; compliance facts §4).
- Role and money lines kept to trust pages, or "independent" claims. Show both at survey step 1, consent and confirmation, from one text that also feeds meta descriptions (copy draft §1, §7).
- "By submitting" consent. Use the unticked named-mover box (calls, texts, automated technology, not a condition, STOP, no arbitration), AMC's own consent record and masked replay on contact fields (copy draft §5; compliance facts §3, §8).
- Absolute "never sell" promises. Flag copy draft §3's no-sale sentence for counsel with the state-law "sale" question.
- Quote, booking or "right carrier" wording, staff sales calls and a sales phone CTA. Describe rule-based eligibility instead (compliance facts §2; lead-lifecycle §3).
- Hidden company counts and speed promises (lead-lifecycle §2; visual-direction §13.8).
- ZIP lane pages, parallel best-of lists and shipping verticals (site-architecture §0, §3.1, §4.1).
- Drifting numbers. Keep one record per score, count and threshold for body, meta and JSON-LD, and one "long distance" definition; no unsourced counters, member "from" prices, fake freshness or FAQPage markup (site-architecture §6.3, §7.3, §8.5, §9).
- Open review buttons. Invite only consumers whose request a mover bought (mover-verification §6).
- An unchecked "Preferred" name. CMR's owner and Move.org's paid "Preferred Partner" label [capture moveorg.md] blur it, so clear the trademark first (site-architecture §1.2; counsel).

## Gaps and open questions
- After "Get my matches": what appears, how many companies, who calls and how often.
- Who the "specialist" and phone line are, and whether leads reach the related movers.
- The full ownership sentence, privacy policy and terms.
- Profiles, reviews, nested JSON-LD, lane and city pages, estimator output, the AI inventory tool and the OpenAI-hosted script.
- Sources of the counters and the 419 "booked" moves; the whole mover side.
- Registries and trademarks for "Preferred Movers"; other firms using the name [search, not re-checked].
- BBB, complaint and court records.
- Owner decision: whether AMC profiles show third-party grades such as BBB (mover-verification §5).
- No CMR keyword list, backlinks or answer-engine tests.

## Sources
- Evidence: `docs/research/reference-review/captures/consumermovingreviews.md`, `_provenance.md`, `moveorg.md`; private raw pack (not in the repository).
- v1: `docs/research/reference-matrix.md` §2.1, §2.4, §3.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/domain_rank_2026-10-27.json`, `top_pages_more_2026-10-27.csv`; `docs/research/keyword-research.md` §1, §3.
- AMC docs: `docs/business-rules/` (copy draft, lead-lifecycle, mover-verification, shared-pricing), `docs/research/compliance-and-platform-facts.md` (compliance facts), `docs/seo/site-architecture.md`, `docs/design/visual-direction.md`.
- Pages: https://www.consumermovingreviews.com/ and the ten captured paths cited.
- WebSearch (standard, 2026-10-27): six single-run queries; third-party "Preferred Movers" results were not re-checked or relied on.
