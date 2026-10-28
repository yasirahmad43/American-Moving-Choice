# HireAHelper (company profile and marketplace): reference review

A marketplace for booking hourly moving crews and local full-service moves, paid through its own checkout [capture /services/, /how-it-works/]; it is on the list because the owner named its A-1 Moving profile, a structure AMC's discovery brief calls "the best model" (00-discovery-brief.md §3 item 4).

**Reviewed:** 2026-10-27. **Evidence:** 13 of 14 pages captured (/affiliate/ blocked by Cloudflare); an automated walk from the profile reached the mover list before any contact details, with email optional; Semrush US, October 2026; standard WebSearch, not re-checked, so search-only claims are hedged or left out. **Confidence:** medium, because booking, checkout consent, terms and provider fees were not seen.

## At a glance
- Consumers compare providers, pick one team, then book and pay through HireAHelper [capture /how-it-works/; walk].
- Two short screens from a profile reach a mover list with no contact details and no consent wording [walk].
- Its best trust signals (paid-move reviews, booked-move counts, the $1,000 guarantee) rest on running the booking and taking payment, which AMC does not do, so the discovery brief's "best model" view needs revising [inference].
- Captured vetting text names no USDOT, MC or state-license check and no last-checked date [capture /how-it-works/].
- Counts and ratings differ between pages and carry no date [capture].
- About 125,334 organic visits a month, with city pages the largest family in its top 15, yet it is absent from six measured long-distance and interstate top 10s [semrush].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 0. Profile form | Loading, unloading or both; ZIP and date for each end | Rating, reviews, "Booked on 22 moves through HireAHelper" | [walk; capture /movers/dalton_ga/a-1-moving/] |
| 1. /checkoutv2/moveitems/ | "Any stairs or heavy items?": stairs, heavy items, packing | Nothing new | [walk] |
| 2. /checkoutv2/helperlist/ | Optional email, or "Skip, let me see Movers & Prices first" | Mover names and a sort by match, rating, reviews or price; price values not recorded | [walk] |
| 3. Booking | Not walked | Not observed | [walk] |

- **Pre-filled date.** No date was typed, yet 11/3/2026 reached the list; since pages promise movers "actually available on your date" (/services/moving-companies/), an unchosen date shapes the list [walk; capture].
- **One chosen team.** "Choose the team that fits and book online" (/how-it-works/) implies no broadcast [capture; inference]. "Best Match" comes first, and the "How the match works" block was cut off, so whether fees shape the order is unknown [walk; capture].
- **Test limits.** The Georgia-to-Florida test ran "No Truck, Labor Only" and listed other companies first; the labor-only form and out-of-area ZIPs make both results inconclusive [walk].

## Mover side
Footer links invite movers to get listed, sign up and use provider software and "Movers Academy" training [capture footer]. Each booking goes to one chosen provider, so no sharing cap applies [inference]. Providers "advertise on HireAHelper" (/), but no captured page says what they pay, and search-only fee figures were not re-checked [capture; search: https://sidehusl.com/hireahelper/, third party]. Crews without USDOT and MC cannot join AMC, so its labor-only requests depend on approved carriers that also sell labor (mvp-scope §6) [inference]. AMC should publish lead prices and credit rules on /for-movers/ and treat portal tools and training as retention (shared-pricing-and-credits.md) [inference].

## Trust, verification and reviews
- **Vetting.** A "five-point vetting process" precedes the first booking; the three captured points are an owner background check, verified business and payment details, and "10+ reviews and a 4-star rating" [capture /how-it-works/]. Full-service bookings also need an active insurance certificate [capture /movers/].
- **Credentials.** No USDOT, MC or state-license check or last-checked date appears, though two points and the "License & Insurance" page were not captured; v1 reported license checks for full-service jobs [capture; v1 §2.4]. Profile "Credentials" list only a self-declared uniformed-crew attribute, and "Licensed & insured crews" names no license [capture profiles, /services/moving-companies/].
- **Badge.** The review threshold sits inside "Vetted & Verified", so a new business cannot qualify, and since reviews come only from paid bookings, the source of those first reviews is unstated [capture /how-it-works/, /movers/].
- **Reviews.** "Every review on HireAHelper comes from a real, paid move" (/movers/) [capture]. Profiles show unedited reviews with mover replies, even to critical ones [capture /movers/los-angeles_ca/excellent-movers-los-angeles/]. The excerpts do not say how featured city-page reviews are picked, and review dates were not captured [capture /movers/dalton_ga/].
- **Guarantees.** The same $1,000 is "damage coverage" on / and a "Service Guarantee" on /services/moving-companies/; "The lowest price on your move, guaranteed" (/services/) narrows to the same mover and date "on our platform" (/moving-cost-calculator/) [capture].
- **Numbers.** Network size reads "1,700+" (/) and "1848" (/movers/); ratings cite "9,100+" or "13k" Trustpilot reviews and an unsourced "4.8/5" (/about/); one mover's counts differ between profile and city page [capture].
- **Profiles and city pages.** A-1 shows "Up to 0 miles"; both profiles share a "top-rated" meta template in the mover's voice and a "Moving with with" heading; city cards print mover claims unedited [capture profiles, /movers/los-angeles_ca/]. "Compare the Best 10 Vetted Movers in Tallahassee, FL" counts movers based in Orlando and Georgia [capture /movers/tallahassee_fl/]. v1 saw 7 Dalton movers; the capture shows 20 [v1 §2.4; capture].

## Disclosure and consent
- **Role.** The clearest role line is body text: "a national marketplace for booking local, vetted movers online" (/services/) [capture]. None appeared in the flow, and no footer link explains how HireAHelper makes money [walk; capture].
- **Consent.** Up to the list there was no consent box, call or text consent, automated-dialing wording, "not a condition of purchase" line or named seller [walk]. No consent-certificate script was detected; Terms and Privacy were not captured [capture].
- **Data and phone.** Captured pages load FullStory session replay, MNTN retargeting and Optimizely beside a footer "Do not sell my information" link; whether they run in checkout is unknown, and the first checkout URL carries ZIPs and dates [capture; walk]. A phone link leads all six recorded mobile screens and varies by page and session, which suggests call tracking [capture].
- **Payment timing.** Pages say "pay only when the job is done" (/how-it-works/), while v1 said the card is charged a day before [capture; v1 §2.4].

## SEO and content
- **Scale.** About 125,334 visits and 80,203 keywords a month, at about $10.45 per visit site-wide, with 11,736 referring domains and 96% of backlinks nofollow [semrush domain_rank, backlinks_overview]. It is a benchmark, not a near-term target [inference].
- **City pages.** Ten of the top 15 pages are city pages, with 30,820 visits (24.6%), and the Dallas page reaches page one beside Yelp and Thumbtack [semrush top_pages, phrase_organic_top10]. keyword-research §1 says city pages "drive most traffic", but with 57% of traffic outside the top 15, a majority cannot be shown [semrush].
- **Few-keyword pages.** Tallahassee, Beckley and Oshkosh earn about 140-160 visits per keyword, against about 7 for Los Angeles, so check their queries before citing small metros as "achievable" (keyword-research §2) [semrush top_pages; inference].
- **Template.** The three captured city pages share 11 of their first 12 H2s, a meta template and repeated intros; the mover inventory clearly differs, and the rest of the body was not captured [capture].
- **Misfiled pages.** The #2 page, /services/moving-companies/ (7,969 visits), is a service pillar, not the "best of" guide keyword-research §2 calls it; DIY cost and container guides are the only content pages in the top 15 [semrush top_pages; capture].
- **Long distance.** No route, state or long-distance URL is in the top 15, and its long-distance offer is labor at both ends, which supports AMC's long-distance and route waves (site-architecture §5) [semrush; capture /services/; inference].
- **Markup and content.** Profile MovingCompany ratings match the page; markup on its own pages is only partly visible [capture]. /advice/ shows bylines, dates and answer-first excerpts [capture /advice/]. The ungated calculator says "not estimates" under an "Accurate Moving Estimate" title [capture /moving-cost-calculator/].

## Design and UX
On mobile, the homepage leads with phone, logo and Trustpilot rating, then the H1 and two service buttons, under a promo banner [capture /]. Mobile profiles show no quote form among the first recorded elements [capture]. City cards stack rating, reviews, base city, moves booked and the mover's text, then hourly terms [capture /movers/dalton_ga/]. The homepage chooser is a custom widget the walker could not operate [walk /].

## What AMC should adopt or adapt
- **Value before contact** [walk]. Better: after move details and the coverage pre-check, preview the Approved movers (names, USDOT, verification dates, reviews) without prices; ask for a date or range, never pre-filled; keep any save-progress email apart from consent; reword the planned "See available movers" button, which echoes HireAHelper. Serves: the quote survey (lead-lifecycle §2; visual-direction §5.3).
- **Consumer choice** [capture /how-it-works/]. Better: name the eligible movers and allow deselection before consent, within the company-count limit; explain the order; label paid placement. Serves: named-mover consent (consent copy §5; compliance facts §2-§4).
- **Role line** [capture /services/]. Better: AMC's role statement beside the hero button and in the survey, a footer "How we make money" link, and "compare", never "book". Serves: trust pages (consent copy §1, §7).
- **Vetting checklist** [capture /how-it-works/]. Better: one page listing AMC's checks and recheck cadence, linked from every badge, with "verified on {date}" and FMCSA links on profiles, and every "licensed" claim, including the draft role statement's, tied to what was checked. Serves: movers-only and Preferred Movers (mover-verification §3-§5) and "usdot number lookup" demand (4,400 a month) [semrush phrase_these].
- **Reviews with replies** [capture]. Better: AMC's evidence labels, never "paid move" or a mover-confirmed label; platform-sent invitations; a portal reply tool; neutral featuring rules. Serves: reviews (mover-verification §6).
- **Profile and card anatomy** [capture]. Better: evidenced fields only, job counts only with AMC evidence, review dates and honest empty states; "based in" apart from "serves"; "Company says" apart from verified facts; neutral meta; prices only from mover-published rate cards after counsel review; a request button naming that mover first under normal sharing rules. Serves: profiles (mover-verification §5; site-architecture §6.3, §8.2).
- **Inventory-led city pages** [capture]. Better: count only Approved movers with explicit coverage, publish only past G1, keep shared explainers on one page, use attributed and moderated mover tips, and define how repeated mover cards count toward G7. Serves: the no-doorway rule (site-architecture §4.1).
- **Pillars, calculator and bylines** [capture]. Better: service pillars on this structure; ranges, never estimates, with a dated method; named reviewers and sources. Serves: SEO (site-architecture §1.2, §6.3, §7.2-§7.4).
- **One source of truth** [capture]. Better: dated, sourced counts from one data service, and one support number in the footer and markup. Serves: trust and entity consistency (site-architecture §7.1).

## What AMC should avoid
- Booking, payment, "book" wording and claims built on them (compliance facts §2) [capture].
- Guarantees and price promises; explain valuation neutrally (compliance facts §1) [capture].
- Review thresholds inside the badge (mover-verification §4) [capture].
- Phone-first headers, promo banners, no-spam absolutes and a line that helps pick a mover (consent copy §6; compliance facts §2) [capture].
- "Best" headings and out-of-area movers in city counts (site-architecture §4.1) [capture].
- Template superlatives, mover-voice meta, "review of" titles and unedited mover claims (mover-verification §5) [capture].
- Availability claims and pre-filled dates (lead-lifecycle §2-§3) [walk].
- Replay and ad scripts on survey and consent screens, and move details in URLs (site-architecture §1.2) [capture; inference].
- Sharing survey data with partner brands without separate consent (consent copy §3) [capture footer].
- DIY cost guides in Wave 1, and FAQPage or self-rating markup (keyword-research §3; compliance facts §5) [semrush; capture].

## Gaps and open questions
- Booking and checkout: the contact, payment and consent steps [walk].
- Terms, Privacy, guarantee and license pages, and /affiliate/ [capture].
- Provider fees, and whether fees shape "Best Match" or featured slots [capture].
- HireAHelper's own FMCSA status: a third-party review lists USDOT 3214531, unchecked [search: goodmigrations.com, third party].
- Ownership: a reported 2019 Porch Group purchase, unchecked; the evidence pack's "sister brands" wording, which the capture (headed "PARTNERS") does not support [search: geekwire.com, third party; capture].
- BBB and regulator records, full JSON-LD, canonicals, state hubs, keyword lists and AI-engine answers [search; capture; semrush].
- Owner decisions: pricing requests from a mover's own profile; matching labor-only requests between two areas (lead-lifecycle §3); the state crumb when a state hub fails its gate (site-architecture §3.3) [inference].

## Sources
- Evidence: `docs/research/reference-review/captures/hireahelper.md`, `_provenance.md`; private raw pack; v1 `docs/research/reference-matrix.md` §2.4.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/` (domain_rank, top_pages, phrase_organic_top10, phrase_these, backlinks_overview); `docs/seo/raw/semrush_phrase_organic_top10_2026-10-27.csv`; `docs/research/keyword-research.md` §1-§2.
- AMC: `docs/00-discovery-brief.md`, `docs/business-rules/` (consent copy is `consent-and-disclosure-copy-draft.md`), `docs/research/compliance-and-platform-facts.md` (compliance facts), `docs/seo/site-architecture.md`, `docs/design/visual-direction.md`, `docs/product/mvp-scope.md`.
- Pages: https://www.hireahelper.com/movers/dalton_ga/a-1-moving/ and the paths cited.
- Search, not re-checked: https://sidehusl.com/hireahelper/, https://www.geekwire.com/2019/home-improvement-marketplace-porch-acquires-hireahelper-doubling-moving-services/, goodmigrations.com (all third party).
