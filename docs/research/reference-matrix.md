# Reference Matrix: Moving Marketplaces & Lead-Gen Sites

Prepared for American Moving Choice (AMC). This is research to guide our own design and content. Do not copy reference copy, layouts, or data. Quotes below are short and only there as evidence.

---

## 1. Method note

- **Date:** 2026-10-27.
- **Direct fetching was blocked.** Every direct page fetch failed. WebFetch returned DNS errors (`getaddrinfo ENOTFOUND`), and curl got an HTTP 403 when the egress proxy refused the CONNECT tunnel. So **I did not see any reference page as rendered**: no screenshots, no multi-step form walkthroughs, no DOM inspection.
- **What I used instead:** web-search results (titles, URLs and text excerpts that the search index holds for each site's own pages). Everything below is **search-index evidence**. Treat UI layout and the exact order of questions as *unverified* unless a finding says the step order appears in the site's own text.
- **Not observable at all:**
  - **moving.com.** The search tool refused the domain ("not accessible to our user agent"), and a direct fetch was blocked. The only evidence is third-party material on who owns it (Wikipedia, Inman and RISMedia items from 2012). Live page structure, the quote flow and URL patterns are **unknown**.
  - **quote.mygoodmovers.com/long-distance-moving/.** The quote subdomain was not indexed. Only the main domain (mygoodmovers.com) appeared in search, so the quote flow is **unknown**.
- **Live form wording.** I could not see TCPA/consent checkbox text on any live form. The only consent wording found came from Move.org's Allied quote page and ConsumerAffairs' sitewide Terms of Use.
- **Traffic.** I have **no traffic evidence** for any reference. Semrush and Similarweb were not queried: the Similarweb connector failed to connect, and no Semrush call was made. Relative traffic is **unknown for every reference**. No traffic numbers appear in this document.
- **Next step.** Before design sign-off, check this matrix by hand in a browser: walk each quote flow up to the contact step, screenshot it, and record the exact consent text.

---

## 2. Per-reference findings

### 2.1 Consumer Moving Reviews (consumermovingreviews.com)
- **IA.** Rankings and route guides are the core ("Mover Rankings & Route Guides" is in the homepage title). Other sections:
  - Directory: `/companies/`
  - Reviews: `/reviews/`
  - Buyer's guides: `/all-buyers-guides/`
  - Articles: `/articles/...`
  - Cost calculator: `/moving-cost-calculator/`
- **Rankings.** There are many overlapping "best" pages: `/best-interstate-movers/`, `/best-interstate-moving-companies/`, `/best-nationwide-movers/`, `/best-cross-country-movers/` and `/top-moving-companies/`.
- **Methodology pages.** `/cmr-score/`, `/how-we-rank-movers/`, `/editorial-methodology/` and `/certified-vs-verified/`.
  - The proprietary 1–10 "CMR Score" uses 5 areas: carrier verification, service breadth, protection/valuation, pricing transparency and customer feedback.
  - Each score is said to be "re-checked every 3 to 6 months".
  - Two badge tiers: "CMR Certified" and "CMR Verified".
- **Trust data.** State directories cite the FMCSA Company Census File for home city and truck count, and FMCSA SAFER for registration status, with a check date. Some entries carry an "Authority not verified" flag.
- **Carrier vs broker.** Profiles and rankings label each company as a carrier or a broker, with its USDOT number (e.g. Safe Ship, Moving APT and Vantage are listed as brokers).
- **Quote flow.** Profiles have a CTA to get "up to 4 quotes from CMR-vetted carriers in 90 seconds". I could not see the form steps or consent text. The calculator says it collects no personal data.
- **Role and disclosure.** The site says it "may earn a referral fee" and that this "never changes our rankings". There is an Advertiser Disclosure page. In effect it is a **review/affiliate lead source**, not a mover.
- **Problems seen in the index.**
  - The same company gets different scores and BBB grades on different pages (MC Movers 9.6 vs 9.8; Safeway BBB "B" vs "A+").
  - Visible ratings do not match the structured data (Wilson Bros 8.4 vs 8.9).
  - The same company holds a perfect 10.0 and is #1 on several lists.
- **Route URLs** carry ZIPs: `/routes/movers-from-seattle-wa-98109-to-west-hollywood-ca-90069/`. This suggests a very large, programmatically generated route set.

### 2.2 moveBuddha (movebuddha.com)
- **IA.**
  - Mover directory by state, city and service: `/movers/`, `/movers/ca/`, `/movers/or/portland/`, `/movers/tx/buda/long-distance/`
  - Company reviews: `/movers/ia/powell-express-moving-6219/`
  - Popular routes: `/popular-routes/mt/fl/billings-to-cape-coral/`
  - Calculator with city variants: `/moving-cost-calculator/ny/manhattan/`
  - A large blog
- **Calculator.** Marketed as "No Email Required". The steps appear in moveBuddha's own text: From/To ZIP or city → move size (from a few items up to 5+ bedrooms) → date. It then shows estimates for full-service, container, freight and truck rental. "Free Quote" CTAs follow.
- **Pricing methodology.** There is a public page (`/blog/moving-pricing-methodology/`) and the "Better Moves Project". Route pages state "1,500+ monthly pricing data points", updated monthly, and price is in the route page title ("($1,330+) Billings, MT to Cape Coral, FL Movers").
- **Profiles and listings.**
  - Each shows a score out of 5, a positive-review percentage, the review count (e.g. 2,328 reviews), the USDOT number and a "Get Free Quote" button.
  - State pages give scale figures (e.g. 231 NC movers scored across 87,646 reviews).
  - The site says "no mover pays to appear in these rankings".
- **Role and disclosure.** `/advertising-disclosure/` says it may be paid when users click links, "submit the webform, or call". It admits that affiliate relationships may shape which services are reviewed. So it is an **affiliate/lead seller**.
- **Not visible:** the quote form's phone/text consent wording, and how many movers each request goes to.

### 2.3 Budget Van Lines (budgetvanlines.com)
- **IA.**
  - `/how-it-works`, `/pricing`, `/about-us`, `/carrier-list`, `/Moving_Pods`, `/terms-of-use`
  - Many paid-search landing variants: `/moving?...&qs=`, `/999moving`, `/bmoving`, `/landing_page1`
- **Role, clearly disclosed on its own pages.** A "federally licensed moving broker". Its footer reads "Household Goods Transportation Broker for Interstate Moves" with **USDOT 2233611 / MC 512534**. The site says it does not own trucks and that it "could also be one of the companies competing for your business". Compensation comes from movers. The privacy policy allows sharing your data with other moving companies.
- **Quote flow.** After you submit, "multiple movers will be in touch". A rough estimate comes by phone and email, and an inventory is needed for a written estimate. In other words, **contact info is collected before you see any real price**.
- **Trust.** A public carrier list with DOT/MC numbers, and a link to FMCSA protectyourmove.gov. It markets "savings up to 50%", which it does not substantiate.
- **Relevance to AMC.** This is the **counter-example**: the broker model AMC excludes. Its disclosure is legally visible but sits in the footer and legal pages.

### 2.4 HireAHelper: company profile (hireahelper.com/movers/dalton_ga/a-1-moving/)
- **Profile contents** (from index text; layout order not verified):
  - Upfront hourly price ("$85/hr for 2 movers after 2 hr min")
  - Company policies (same-day surcharge, no refund for unused time)
  - Equipment list with per-item fees
  - Hours
  - Review count and average (10 reviews, 5 stars)
  - "Booked on 22 moves through HireAHelper" (a platform-verified job count)
- **Staleness and display problems.** The visible reviews date from 2015, and the service area shows as "0 miles", which looks like a rendering artifact. A profile with no freshness signal can mislead.
- **City hub** (`/movers/dalton_ga/`): a labor-cost range for the city, "7 vetted movers", the average rating, and the required $0.60/lb coverage stated.
- **State hub:** `/georgia-moving-companies/`.
- **Flow.** You enter ZIP(s), date and service type, then "see available movers and prices … without entering contact information". You **book and pay through the platform**: the card is charged about 1 day before, and payment is held until the job is confirmed.
- **Trust.**
  - "$1,000 Service Guarantee", with terms worded differently across pages
  - "Verified" reviews tied to completed bookings
  - COI and state-license checks for full-service jobs
  - Trustpilot and BBB claims on its own pages
- **Role.** A booking marketplace, not a broker of interstate household goods. Move.org says it partners with HireAHelper for local moves.

### 2.5 Moving.com
- **Could not observe** the live site (see the Method note).
- **Third-party evidence only:**
  - Wikipedia's article on Move, Inc. says Homestore (later Move, Inc., the Realtor.com operator, now majority-owned by News Corp) acquired Moving.com in 2006.
  - 2012 trade press described it as Move's "lead generation business for moving professionals". It offered quotes "from up to six licensed movers", and Relocation.com was folded into it.
- **Current state unknown:** quote flow, consent text, geo URL patterns and its current role.

### 2.6 HomeGuide (homeguide.com/moving-companies)
- **IA.**
  - National hub: `/moving-companies` ("The 10 Best Moving Companies Near Me (with Free Quotes)")
  - City × service pages: `/tx/grand-prairie/local-movers/`, `/fl/tampa/office-movers/`, `/fl/tampa/packing-services/`
  - Profiles nested under city/service: `/tx/irving/local-movers/easy-moving-company`
  - A deep cost-guide library: `/costs/moving-company-costs`, `/costs/cost-to-move-across-the-country`, `/costs/packing-cost` and others
- **Profiles.** Rating, review count, hires, employee count and years in business. The site says "Every pro on HomeGuide is reviewed".
- **Thin evidence.** Many listings have 0–5 reviews or a 5.0 from a single review. Some profiles show an address in a different city from the page.
- **Role.** A **pay-per-lead marketplace**. Pros have free profiles and "only pay for the leads you want". A "Direct Lead" is when a customer picks a pro. Lead price varies "by number of pros available, size of job". The ToS says the platform operates under the name "Liaison".
- **Educational content.** The cost guides are the strongest pattern here: ranges, drivers, and seasonality (peak season May–September, 20–30% higher).

### 2.7 Unpakt (unpakt.com)
- **Model.** An inventory-based marketplace. You build one inventory and get many quotes; Unpakt's own case study says 18 quotes in about 7 minutes. Each item is priced, and the "Guaranteed Price" holds unless the inventory, dates or services change.
- **Booking.** You book online with a card, charged 2 business days before the move. Users can change the move until 2 days before.
- **Role.** Its agreement says it has "no involvement or control over the actual transaction" once you pick a mover. That makes it a marketplace and booking facilitator.
- **Profiles.** Company info plus verified reviews, partly pulled from other review portals and shown inside the comparison view.
- **Vetting.** License, insurance, registration and BBB checks.
- **Weaknesses.**
  - Many blog pages are years old.
  - The "45% savings" claim comes from a 2015 study that Unpakt commissioned.
  - Coverage is uneven outside metro areas, as its own FAQ admits.
- **Not observed:** geo URL patterns on the main domain. The content lives on `blog.unpakt.com`.

### 2.8 MyGoodMovers (quote.mygoodmovers.com/long-distance-moving/)
- **Not observed:** the quote subdomain's flow.
- **What the main domain shows:**
  - "Best" lists: `/best-movers/long-distance-moving-companies`, `/best-movers/senior-moving-companies`
  - State and city pages: `/movers/fl`, `/movers/tx/houston`, `/movers/ca/los-angeles`, with "(October 2026)" freshness in the titles
  - A calculator: `/moving-cost-calculator`, showing a long-distance range of $1,186–$16,842 and stating that its result is a rough, non-binding estimate
- **Role.** Appears to be a review and lead-gen site (inferred from structure). I found no explicit role disclosure.

### 2.9 EnergySage (energysage.com), for marketplace clarity patterns
- **Process page** (`/market-process/`). You fill in a property profile, and pre-screened installers send quotes, typically about 3 within a week, up to 7. Quotes appear in a **standardized side-by-side view built on the same assumptions**.
- **Contact control.** The consumer chooses whether installers may phone them or contact them only through EnergySage. One page advertises no phone number required ("no calls unless you want them"). Energy Advisors are offered as optional help.
- **Geo data pages.** `/local-data/solar-panel-cost/{state}/` give market averages ($/W, typical system size) dated "as of October 2026", with city lists. This is **original marketplace data used as geo content**.
- **Revenue model.** Installers pay; consumers use it free. A partner program page exists.

### 2.10 ConsumerAffairs: Best Long-Distance Moving Companies
- **Methodology on the page.**
  - Verified reviews within a set window (2023-03-01 to 2026-02-28)
  - Three pillars: customer experience, services, affordability
  - Affordability uses one fixed price scenario (2BR Chicago → Kansas City)
  - Each metric is scored 0–10 relative to the leader, with per-award weighting and tie-breaking rules
- **City guides use a different model** (65% local reviews, 22% national track record), so the two methods do not compare like for like.
- **Geo URLs mix two styles:** `/movers/{state}/`, `/movers/{state}/{city}/` and also `/movers/honolulu.html`.
- **Disclosure.**
  - Paid "Authorized Partners" are marked with a blue check.
  - The FAQ says compensation "may influence which partners we feature and the order".
  - The Terms say that giving your information consents to contact by "automatic telephone dialing system" or prerecorded message, from ConsumerAffairs or the matched brand.
- **Role.** A review platform plus a **paid matching/lead program**.

### 2.11 Move.org
- **IA.**
  - Many "best" lists: `/best-moving-companies/`, `/best-interstate-moving-companies/`, `/best-cheap-moving-companies/` and others
  - A calculator: `/moving-costs/`
  - Guides: `/how-to-hire-mover/`, `/moving-guide`
  - State pages: `/movers/california/`
  - Brand quote pages: `/quote-allied/`
  - A "Find-a-Mover" tool: `/moving-options-lp/` ("Find your mover in less than a minute")
- **Methodology.** Mystery shopping (website review, calling as a customer, reading reviews) and FMCSA credential checks. The number of steps differs from guide to guide.
- **Consent (Allied quote page).**
  - Submitting accepts the privacy policy and terms, including **mandatory arbitration**.
  - A separate consent lets Clearlink (d/b/a Move.org) and Allied contact you by phone, text and email "even if on Do Not Call" lists.
  - It states that consent is "not a condition of purchase".
- **Role.** Operated by Clearlink. It earns referral revenue from partners (Allied, Colonial, United and others) and partners with HireAHelper for local moves.

---

## 3. Reference-to-requirement matrix

| Reference | Effective pattern | User need addressed | How AMC should improve | Original content/data/functionality AMC needs |
|---|---|---|---|---|
| Consumer Moving Reviews | Public scoring rubric (5 areas) + carrier/broker label + FMCSA source and check date on directory rows | "Is this company real, and does it actually do the move?" | Show one score per company everywhere (one source of truth, the same in schema and UI). Exclude brokers outright instead of labelling them. Put the date the data was last verified on every profile. | Nightly or weekly FMCSA sync (USDOT, MC, authority status, operating status, fleet size, insurance on file) with a stored "verified on" timestamp; a published AMC rating methodology page |
| Consumer Moving Reviews | Route pages with cost and top picks | "Who moves from A to B, and what does it cost?" | Publish route pages only where AMC has real coverage (approved movers serving both ends) and real price data. Do not generate ZIP-to-ZIP permutations. | Route-level price ranges from AMC's own quote and lead data (aggregated, privacy-safe, with a minimum sample size); a count of approved movers serving the route |
| moveBuddha | "No email required" calculator before any quote request | Get value before giving up contact info | Make the AMC estimator free and ungated. Pre-fill the quote form from the estimator inputs. | AMC cost model (distance × size × season) with the method shown; "last updated" date |
| moveBuddha | Price in title/H1 on route pages; monthly-updated data claim | Fast price expectation from search results | Same pattern, but state the sample size and date range and show "insufficient data" when it is thin | Pricing dataset with a refresh pipeline and a minimum-N display rule |
| moveBuddha | Advertising disclosure page that names the webform/call compensation | Understand how the site makes money | Plain-language "How AMC makes money" disclosure **in the quote flow** at the moment of consent, not only in the footer | Disclosure copy: movers pay per lead; exclusive vs shared; we never take a cut of the move or act as broker |
| Budget Van Lines | DOT/MC in footer; public carrier list | Regulatory verification | AMC itself is **not** a broker or carrier. Say so plainly. Give each listed mover's USDOT/MC with a link to FMCSA. | "Movers only, no brokers" eligibility policy and enforcement log (authority type check: carrier, not broker) |
| HireAHelper | Prices and movers shown before contact info; book online | Avoid sales-call flood; transparency | For local moves, consider showing indicative ranges or matched-mover previews before the contact step. For long distance, show who will receive the lead before submit. | Pre-submit "These N approved movers may contact you" preview, with consumer choice (exclusive = 1 mover, shared = up to N) |
| HireAHelper | Profile with upfront rate, policies, equipment fees, platform-verified job count | "What will I actually pay, and what are the rules?" | Structured profile fields; hide or flag stale reviews; never show "0 miles"-style placeholder data | Profile schema: services, service area (states/ZIPs), pricing basis, minimums, policies, valuation options, USDOT/MC, years active, AMC-verified review count + last-review date |
| HireAHelper | City hub with local cost range + count of vetted movers + minimum coverage statement | Local context | Publish a city page only when ≥ X approved movers serve it; show the count honestly | Coverage map from mover service-area data |
| HomeGuide | Deep cost-guide library (ranges, drivers, seasonality) | Budget planning | Original cost guides grounded in AMC data and federal rules (valuation, binding vs non-binding estimates) | Editorial program with sourced citations (FMCSA "Your Rights and Responsibilities", 49 CFR 375) |
| HomeGuide | Pay-per-lead, price varies by competition | (Mover-side) predictable lead cost | Publish mover-side pricing rules (exclusive vs shared, cap on shares, refund/credit policy for bad leads) | Lead-pricing engine + lead-quality dispute workflow |
| Unpakt | Inventory-based quoting; one inventory → many comparable quotes | Apples-to-apples comparison | Optional inventory step (rooms → items) that improves lead quality and lets movers quote consistently | Inventory builder producing estimated cubic feet / weight; shared lead spec movers receive |
| EnergySage | Standardized side-by-side quote comparison; contact via platform only option | Compare fairly; control who calls | Long term: in-platform messaging/quote return so the consumer can opt out of phone calls; short term: let consumer choose contact channel and number of movers | Consumer preference capture (channel, time window, max movers); quote-return format for movers |
| EnergySage | State "local data" pages built from marketplace data with a date | Trustworthy local benchmarks | AMC state pages lead with AMC's own data (price ranges, popular destinations, seasonality) rather than generic text | State/metro aggregates from AMC lead data with privacy thresholds |
| ConsumerAffairs | Detailed ranking methodology (review window, fixed price scenario, relative scoring, tie rules) | "Why is this company ranked here?" | One consistent methodology across national, state and city pages; never rank by payment; label "Preferred" membership separately from rating | Preferred Movers criteria page (what earns placement, what it does **not** affect) |
| ConsumerAffairs | Paid partners visibly marked (blue check) | Know who is paid | AMC: badge for Preferred (paid) status, clearly explained, kept apart from review score | Badge system + tooltip copy |
| Move.org | Separate, explicit TCPA consent naming the companies + "not a condition of purchase" | Legal clarity | Name the actual recipient movers at consent (one-to-one consent), keep the consent checkbox unchecked by default and separate from submit, avoid forced arbitration in the consent line, log the consent | Consent ledger (text version, timestamp, IP, page URL, named recipients, TrustedForm/Jornaya-style certificate if used) |
| Move.org | Mystery-shopping and FMCSA credential checks in methodology | Confidence in recommendations | Document AMC's vetting steps and re-verification cadence | Vetting checklist + audit trail per mover |

---

## 4. Patterns to avoid

1. **Undisclosed or buried broker role.** Budget Van Lines discloses broker status in its footer and legal pages. The visitor experience still reads like a moving company ("multiple movers will be in touch"). AMC must say what it is (a lead marketplace, not a mover or broker) above the fold and at consent.
2. **Inconsistent or implausible ratings.** One company shown with different scores or BBB grades on different pages, a visible rating that differs from the JSON-LD schema, and the same company at a perfect 10.0 on every "best" list (all seen on CMR in search excerpts). These look fake and may break Google review-snippet policies.
3. **Contact info demanded before any value.** Getting a "rough estimate by phone and email" after submitting puts the burden on the user (Budget Van Lines). AMC should show an estimate and the list of matched movers first.
4. **Blanket autodialer or "even if on DNC" consent hidden in Terms.** ConsumerAffairs puts this in sitewide Terms. Move.org uses it in a checkbox, alongside arbitration. AMC should use per-seller, named consent and keep arbitration out of the consent line.
5. **Doorway-style geo pages.** ZIP-to-ZIP route permutations (`movers-from-...-06042-to-...-29568`) and city × service pages with zero or one review. Publish only where there is real coverage and data, and noindex thin pages.
6. **Stale or broken profile data.** Reviews from 2015 with no recency marker, a service area of "0 miles", and an address in a different city from the page.
7. **Unsubstantiated savings claims.** "Up to 50%" (Budget Van Lines), "45%" from a self-commissioned 2015 study (Unpakt), and "save 30%+" (moveBuddha). AMC should make no savings claims unless it has its own measured data and states the method.
8. **Many near-duplicate "best" pages.** CMR runs `/best-interstate-movers/`, `/best-interstate-moving-companies/`, `/best-cross-country-movers/` and `/best-nationwide-movers/`. This invites cannibalization and conflicting rankings.
9. **Paid placement mixed into rankings.** "Promotional placements" inside editorial lists, and paid status affecting "the order in which they appear". AMC should keep Preferred (paid) placement visibly separate from the rating.
10. **Guarantee terms that change between pages.** HireAHelper's $1,000 guarantee is worded differently on different pages. AMC should have one canonical policy page and link to it everywhere.
11. **Forced lead sharing with no stated count.** Several references never say how many companies will call. AMC should state the exact maximum, and let the consumer choose exclusive (1) or shared (up to N).

---

## 5. Observed URL patterns: geo, route and profile pages

All patterns come from URLs in search results, not from crawling.

| Reference | State | City | Route | Company profile | Notes |
|---|---|---|---|---|---|
| Consumer Moving Reviews | State directories exist (exact path not captured) | Not observed | `/routes/movers-from-{city}-{st}-{zip}-to-{city}-{st}-{zip}/` | `/companies/{slug}/` | ZIP-level routes: very high page count |
| moveBuddha | `/movers/{st}/` | `/movers/{st}/{city}/`; service variant `/movers/{st}/{city}/long-distance/` | `/popular-routes/{st}/{st}/{city}-to-{city}/` | `/movers/{st}/{slug}-{id}/` | Calculator geo variant `/moving-cost-calculator/{st}/{city}/` |
| HireAHelper | `/{state-name}-moving-companies/` (e.g. `/georgia-moving-companies/`) | `/movers/{city}_{st}/` | Not observed | `/movers/{city}_{st}/{slug}/` | Underscore separator; also `/day-labor/{city}_{st}` |
| HomeGuide | Not observed | `/{st}/{city}/{service}/` (e.g. `/tx/grand-prairie/local-movers/`) | Not observed | `/{st}/{city}/{service}/{slug}` | Cost guides at `/costs/{topic}` |
| ConsumerAffairs | `/movers/{state-name}/` | `/movers/{state-name}/{city}/` and legacy `/movers/{city}.html` | Not observed | `/movers/{slug}.html` (also `/homeowners/{slug}.html`) | Mixed legacy and new patterns |
| Move.org | `/movers/{state-name}/` | Not observed | Not observed | Brand quote pages `/quote-{brand}/` | Editorial "best" lists dominate |
| MyGoodMovers | `/movers/{st}` | `/movers/{st}/{city}` | Not observed | Not observed | "Best" lists at `/best-movers/{topic}` |
| EnergySage (analog) | `/local-data/solar-panel-cost/{st}/` | City lists on state pages (path not captured) | n/a | n/a | Data-led geo pages |
| Budget Van Lines | None observed | None observed | None observed | n/a (is itself the broker) | PPC landing variants via query strings |
| Unpakt | Not observed | Not observed | Not observed | Not observed | Content on `blog.unpakt.com` |
| Moving.com | Unknown (blocked) | Unknown | Unknown | Unknown | Not observable |

**Suggested AMC pattern, for discussion only** (not taken from any one reference):
- `/movers/{state}/`
- `/movers/{state}/{city}/`
- `/routes/{origin-city-st}-to-{dest-city-st}/` (city-level, never ZIP-level, gated on real coverage)
- `/companies/{slug}/`

Use lowercase hyphenated slugs throughout, one canonical URL per page, and noindex any page below the coverage and data thresholds.

---

## 6. Traffic prioritization

Unknown for every reference. This research gathered no traffic evidence and estimated no numbers. If prioritization is needed, run a Semrush or Similarweb domain overview later and record the source and date next to each figure.
