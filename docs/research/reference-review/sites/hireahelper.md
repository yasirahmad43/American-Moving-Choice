# HireAHelper (company profile and marketplace): reference review

A marketplace for booking hourly moving crews and local full-service moves, paid through its own checkout [capture /services/, /how-it-works/]; the owner named its A-1 Moving profile, a structure AMC's discovery brief calls "the best model" (00-discovery-brief.md §3 item 4).

**Reviewed:** 2026-10-27. **Evidence:** 13 of 14 pages captured (/affiliate/ blocked by Cloudflare); an automated walk from the profile to the mover list, before any contact step; Semrush US, October 2026; standard WebSearch (search-only claims not re-checked, so hedged or omitted). **Confidence:** medium, because booking, checkout consent, terms and provider fees were not seen.

## At a glance
- Consumers compare providers, pick one team, then book and pay through HireAHelper [capture /how-it-works/; walk].
- Two short screens from a profile reach a mover list with no contact details or consent wording [walk].
- Its best trust signals (paid-move reviews, booked-move counts, the $1,000 guarantee) depend on taking payment, which AMC does not do; the discovery brief's "best model" view needs revising [inference].
- Captured vetting text names no USDOT, MC or license check and no last-checked date [capture /how-it-works/].
- Counts and ratings differ between pages and carry no date [capture].
- About 125,334 organic visits a month; city pages lead its top 15, but it misses all six measured long-distance and interstate top 10s [semrush].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 0. Profile form | Loading, unloading or both; ZIP and date for each end | Rating, reviews, "Booked on 22 moves through HireAHelper" | [walk; capture /movers/dalton_ga/a-1-moving/] |
| 1. /checkoutv2/moveitems/ | "Any stairs or heavy items?": stairs, heavy items, packing | Nothing new | [walk] |
| 2. /checkoutv2/helperlist/ | Optional email, or "Skip, let me see Movers & Prices first" | Mover names; a sort by match, rating, reviews or price; no price values recorded | [walk] |
| 3. Booking | Not walked | Not observed | [walk] |

- **Pre-filled date.** No date was typed, yet 11/3/2026 reached the list; with movers promised as "actually available on your date" (/services/moving-companies/), an unchosen date shapes results [walk; capture].
- **One chosen team.** "Choose the team that fits and book online" (/how-it-works/) implies no broadcast; whether fees shape the first-listed "Best Match" order is unknown, as the match explainer was cut off [capture; walk; inference].
- **Test limits.** The Georgia-to-Florida test ran "No Truck, Labor Only" and listed other companies first; the labor-only form and out-of-area ZIPs make this inconclusive [walk].

## Mover side
Footer links invite movers to get listed, sign up and use provider software [capture footer]. Each booking goes to one chosen provider, so no sharing cap applies [inference]. Providers "advertise on HireAHelper" (/), but no captured page says what they pay, and search-only fee figures went unchecked [capture; search: https://sidehusl.com/hireahelper/, third party]. For AMC, labor-only requests depend on approved carriers that also sell labor (mvp-scope §6), and /for-movers/ should publish lead prices and credit rules (shared-pricing-and-credits.md) [inference].

## Trust, verification and reviews
- **Vetting.** A "five-point vetting process" precedes the first booking; the captured points are an owner background check, verified business and payment details, and "10+ reviews and a 4-star rating" [capture /how-it-works/]. Full-service bookings also need an insurance certificate [capture /movers/].
- **Credentials.** No USDOT, MC or license check appears in the excerpts, though two points and the "License & Insurance" page were not captured, and v1 reported full-service license checks [capture; v1 §2.4]. Profile "Credentials" list only a self-declared uniformed-crew attribute [capture profiles].
- **Badge.** The review threshold sits inside "Vetted & Verified", so a business with no reviews cannot qualify; with reviews only from paid bookings, the source of those first reviews is unstated [capture /how-it-works/, /movers/].
- **Reviews.** "Every review on HireAHelper comes from a real, paid move" (/movers/), and profiles show unedited reviews with mover replies, even to critical ones [capture]. Review dates and the choice of featured city-page reviews were not captured [capture].
- **Guarantees.** The same $1,000 is "damage coverage" (/) and a "Service Guarantee" (/services/moving-companies/), and the price guarantee narrows to the same mover and date "on our platform" (/moving-cost-calculator/) [capture].
- **Numbers.** Network size reads "1,700+" (/) and "1848" (/movers/); ratings cite "9,100+" or "13k" Trustpilot reviews and an unsourced "4.8/5" (/about/) [capture].
- **Profiles and city pages.** A-1 shows "Up to 0 miles", profiles share a "top-rated" meta template in the mover's voice, and city cards print mover claims unedited [capture profiles, /movers/los-angeles_ca/]. The Tallahassee "Compare the Best 10" list counts movers based in Orlando and Georgia; v1 saw 7 Dalton movers, the capture 20 [capture /movers/tallahassee_fl/, /movers/dalton_ga/; v1 §2.4].

## Disclosure and consent
- **Role.** The clearest role line is body text, "a national marketplace for booking local, vetted movers online" (/services/); none appeared in the flow, and no footer link explains how HireAHelper makes money [capture; walk].
- **Consent.** Up to the list there was no consent box, call or text consent, automated-dialing wording, "not a condition of purchase" line or named seller [walk]. No consent-certificate script was detected, and Terms and Privacy were not captured [capture].
- **Data and phone.** Pages load FullStory session replay, MNTN retargeting and Optimizely beside a "Do not sell my information" footer link; checkout use is unknown, and the first checkout URL carries ZIPs and dates [capture; walk]. A phone link leads all six recorded mobile screens and varies by page and session, suggesting call tracking [capture].

## SEO and content
- **Scale.** About 125,334 visits a month, valued at about $10.45 each, with 11,736 referring domains (96% of backlinks nofollow): a benchmark, not a near-term target [semrush domain_rank, backlinks_overview; inference].
- **City pages.** Ten of the top 15 pages are city pages (30,820 visits, 24.6%), and the Dallas page reaches page one beside Yelp and Thumbtack [semrush top_pages, phrase_organic_top10]. keyword-research §1's "drive most traffic" cannot be shown, since 57% of traffic sits outside the top 15 [semrush]. The three captured city pages share 11 of their first 12 H2s and a meta template; what clearly differs is the mover inventory [capture].
- **Few-keyword pages.** Tallahassee, Beckley and Oshkosh draw about 140-160 visits per keyword (Los Angeles: 7); check their queries before citing small metros as "achievable" (keyword-research §2) [semrush top_pages; inference].
- **Misfiled pages.** The #2 page, /services/moving-companies/ (7,969 visits), is a service pillar, not the "best of" guide keyword-research §2 calls it; DIY cost and container guides are the only top-15 content pages [semrush top_pages; capture].
- **Long distance.** No route, state or long-distance URL is in the top 15, and the stated long-distance offer is labor at both ends (a long-distance link was not followed), supporting AMC's long-distance and route waves (site-architecture §5) [semrush; capture /services/; inference].
- **Markup and content.** Profile MovingCompany ratings match the page; /advice/ shows bylines, dates and answer-first excerpts; the ungated calculator says "not estimates" under an "Accurate Moving Estimate" title [capture].

## Design and UX
On mobile, the homepage leads with phone, logo and Trustpilot rating, then the H1 and two service buttons, under a promo banner [capture /]. Mobile profiles show no quote form among the first recorded elements [capture]. The homepage chooser is a custom widget the walker could not operate [walk /].

## What AMC should adopt or adapt
- **Value before contact** [walk]. Better: after move details and the coverage check, preview Approved movers (names, USDOT, verification dates) without prices; ask for a date or flexible range, never pre-filled; keep any save-progress email apart from consent; reword AMC's planned "See available movers" button, which echoes HireAHelper. Serves: the quote survey (lead-lifecycle §2; visual-direction §5.3).
- **Consumer choice** [capture /how-it-works/]. Better: name the eligible movers and allow deselection before consent, within the company-count limit; explain the order; label paid placement. Serves: named-mover consent (consent copy §5; compliance facts §2-§4).
- **Role line** [capture /services/]. Better: AMC's role statement beside the hero button and in the survey, a footer "How we make money" link, and "compare", never "book". Serves: trust pages (consent copy §1, §7).
- **Vetting checklist** [capture /how-it-works/]. Better: one page of AMC's checks and recheck cadence, linked from every badge, with "verified on {date}" and FMCSA links on profiles; tie every "licensed" claim, the draft role statement's included, to what was checked. Serves: movers-only and Preferred Movers (mover-verification §3-§5).
- **Reviews with replies** [capture]. Better: AMC's evidence labels, never "paid move" or a mover-confirmed label; platform-sent invitations; a portal reply tool; neutral featuring rules. Serves: reviews (mover-verification §6).
- **Profile and card anatomy** [capture]. Better: evidenced fields only (review dates, AMC-evidenced job counts, no placeholders); "based in" apart from "serves"; "Company says" apart from verified facts; prices only from mover-published rate cards after counsel review; a request button naming that mover first under normal sharing rules. Serves: profiles (mover-verification §5; site-architecture §6.3, §8.2).
- **Inventory-led city pages** [capture]. Better: count only Approved movers with explicit coverage, publish only past G1, keep shared explainers on one page, and define how repeated mover cards count toward G7. Serves: no doorway pages (site-architecture §4.1).
- **Pillars, calculator and sources** [capture]. Better: service pillars on this structure; ranges, never estimates, with a dated method; named reviewers; one data service for every dated count; one support number in the footer and markup. Serves: SEO and entity consistency (site-architecture §1.2, §6.3, §7.1-§7.4).

## What AMC should avoid
- Booking, payment, "book" wording and claims built on them (compliance facts §2) [capture].
- Guarantees and price promises (compliance facts §1) [capture].
- Review thresholds inside the badge (mover-verification §4) [capture].
- Phone-first headers, promo banners, no-spam absolutes and an advice line for picking movers (consent copy §6; compliance facts §2) [capture].
- "Best" headings, out-of-area city counts, mover-voice superlatives and unedited mover claims (site-architecture §4.1; mover-verification §5) [capture].
- Availability claims and pre-filled dates (lead-lifecycle §2-§3) [capture; walk].
- Replay and ad scripts on survey and consent screens, and move details in URLs (site-architecture §1.2) [capture; inference].
- Sharing survey data with partner brands without separate consent (consent copy §3) [capture footer].
- DIY cost guides in Wave 1, and FAQPage or self-rating markup (keyword-research §3; compliance facts §5) [semrush; capture].

## Gaps and open questions
- Booking and checkout steps; Terms, Privacy, guarantee and license pages; /affiliate/ [walk; capture].
- Provider fees, and whether fees shape "Best Match" or featured slots [capture].
- HireAHelper's own FMCSA status: a third-party review lists USDOT 3214531, unchecked [search: goodmigrations.com, third party].
- Ownership: a reported 2019 Porch Group purchase, unchecked; the footer heads its brands "PARTNERS", not "sister brands" as the evidence pack says [search: geekwire.com, third party; capture].
- Payment timing: "pay only when the job is done" (/how-it-works/) against v1's card charge a day before [capture; v1 §2.4].
- BBB and regulator records, full JSON-LD, canonicals, state hubs, keyword lists and AI-engine answers [search; capture; semrush].
- Owner decisions: pricing requests from a mover's own profile; matching labor-only requests between two areas (lead-lifecycle §3); the state crumb when a state hub fails its gate (site-architecture §3.3) [inference].

## Sources
- Evidence: `docs/research/reference-review/captures/hireahelper.md`, `_provenance.md`; private raw pack; v1 `docs/research/reference-matrix.md` §2.4.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/` (domain_rank, top_pages, phrase_organic_top10, backlinks_overview); `docs/seo/raw/semrush_phrase_organic_top10_2026-10-27.csv`; `docs/research/keyword-research.md` §1-§3.
- AMC: `docs/00-discovery-brief.md`, `docs/business-rules/` (consent copy is `consent-and-disclosure-copy-draft.md`), `docs/research/compliance-and-platform-facts.md` (compliance facts), `docs/seo/site-architecture.md`, `docs/design/visual-direction.md`, `docs/product/mvp-scope.md`.
- Pages: https://www.hireahelper.com/movers/dalton_ga/a-1-moving/ and the paths cited.
- Search, not re-checked: https://sidehusl.com/hireahelper/, https://www.geekwire.com/2019/home-improvement-marketplace-porch-acquires-hireahelper-doubling-moving-services/, goodmigrations.com (all third party).
