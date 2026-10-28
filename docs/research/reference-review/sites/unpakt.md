# Unpakt: reference review

A moving marketplace where consumers compare "guaranteed" prices, book a mover and pay Unpakt, which pays the mover after the move [capture /, /how-it-works/]; it is on the list as the clearest case of the book-and-pay model AMC rules out [inference].

**Reviewed:** 2026-10-27. **Evidence:** 9 of 9 pages captured (www, and blog.unpakt.com marked "blog"); automated and guided walks of the home form, both stopped at the first screen; Semrush US, October 2026; earlier-stage WebSearch, not re-verified. **Confidence:** medium, because nothing past the first form screen, and no profile or city page, was observed.

## At a glance
- Prices come from a formula on each mover's "cost per unit of stuff", and consumers pay Unpakt, not the mover [capture /how-it-works/, /].
- No captured page says how Unpakt is paid or how it checks movers, and none shows a USDOT or MC number [capture].
- All six captured www pages mark Unpakt up as a MovingCompany rated 4.2 from 36 ratings; no visible rating was recorded [capture].
- The first screen presets size and date; the guided walk then failed twice and landed on /sign-in/ [walk /].
- About 5,976 estimated organic visits a month, 85% on two URLs, and no top-10 rank for 14 AMC terms [semrush domain_rank, top_pages_more, phrase_organic_top10].
- The model mirrors the "Booking deposits and payments" add-on still listed in AMC's mvp-scope §5 [capture /; inference].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 1. Home form | From, To; size preset "1 Bedroom, Small (600-800 sq ft)"; date prefilled "Nov 06"; extra stop; storage. No contact fields | No price; "No Phone Calls. Get Real Prices Now."; unsourced "save 45%" | [walk /; capture /] |
| 1a. Explainers | From, To ("Start!") | Price formula; "1. Plan", "2. Compare" | [capture /how-it-works/, /faq/] |
| 2. Submit | "Get Prices & Compare Movers" | "Something went wrong creating your move plan", then /sign-in/, twice | [walk /] |
| 3. Inventory to booking | Not observed | Not observed | [walk] |

- The walk sent the presets and the site tried to create a move plan, so unchosen values pass; no later confirmation step was observed [walk /].
- No captured page says whether, or how many, movers receive contact details [capture].
- The redirect suggests an account is needed at some point [inference]; the failure may be sandbox-only [walk].

## Mover side
Movers set their own unit cost [capture /how-it-works/]. No captured page covers mover fees, joining rules or screening; the For Service Providers, Agreement and Terms pages were not captured [capture], and search leads on fees (a 13% cut in 2012 press, help-center tiers) were not re-verified [search: betakit.com, third party; unpakt-mover-faq.groovehq.com, site's own]. Referral partners, including real estate agents, earn a fee per booked move, "paid monthly", and may offer clients "an exclusive discount for any moving company th…" (cut off) [capture /partnership/, footer]. One blog page loads an affiliates.unpakt.com widget loader, which suggests a partner widget; none was observed [capture blog /category/how-to-before-moving/; inference].

## Trust, verification and reviews
- **Vetting.** Movers are "pre screened" (/partnership/) and "licensed" (/faq/), with no method given, and v1's license, insurance and BBB checks are unconfirmed [capture; v1 §2.7].
- **Guarantee.** The home page offers a "100% price and service guarantee", says quotes are "not based on estimates" and promises "no hidden fees" [capture /]. The price comes instantly from the online inventory, before anyone sees the goods; later surveys were not observed [capture /how-it-works/].
- **Claims.** "800,000+ moves booked", "save 45%", "the only place" and "the the biggest online resource" have no source or date [capture /, /partnership/, blog / meta]; v1's 2015 commissioned-study origin for the 45% is unconfirmed [v1 §2.7].
- **Ratings.** The 4.2 / 36 markup describes Unpakt itself, even on /sign-in/ [capture]; 36 ratings beside 800,000+ bookings looks hard-coded [inference]. Off-site scores were not re-verified and are not repeated [search, third party].
- **Reviews.** "Real customer reviews" are promised with no explanation of collection or checks [capture / meta]; v1 said some profile reviews come from other portals [v1 §2.7].

## Disclosure and consent
- **Role.** The copy says "our movers" but otherwise presents a booking platform, and no captured page says whether Unpakt is a mover, broker or neither [capture /]. Holding payments sits uneasily with v1's report that the Agreement disclaims "involvement or control over the actual transaction" [inference; v1 §2.7].
- **Payment.** "You don't pay the movers directly" [capture /]; FMCSA's 2023 guidance weighs who handles money between shipper and carrier (compliance facts §2).
- **Consent and tags.** No consent wording or consent-certificate script was seen, but the contact step was never reached [walk; capture]. An "I want to connect utilities" option sits by the main button, type and default unrecorded [capture /]. Google Ads, Tag Manager, Facebook, Zoho PageSense and Cloudflare load, with no cookie-consent host, though one could be self-hosted [capture].
- **Privacy.** The "Unpakt, LLC" policy counts "its affiliates" as "we", calls "item or shipment values" non-personal and may obtain data from "commercially available sources"; the excerpts do not say what movers receive [capture /privacy/].

## SEO and content
- **Footprint.** Home takes 65.72% of estimated visits and /moving-companies/NY/new-york/ 19.29%, with the reference set's highest value per visit ($22.94, about twice hireahelper.com's) [semrush top_pages_more, domain_rank]; it is no Wave 1 rival [semrush phrase_organic_top10].
- **City pages.** NYC earns 1,153 visits; five other cities earn 9 to 48 each, even at KD 37 (Miami) and KD 30 (Columbus), and profiles and service pages 9 to 73 [semrush top_pages_more, phrase_these]. NYC has about 4 times Miami's demand but 24 times its visits, for reasons not shown [semrush top_pages_more; site-architecture §5.2].
- **URLs.** Uppercase states mix with lowercase cities (/moving-companies/FL/miami/), and profiles sit at /movers/{company}-{city}-{st}/, correcting v1, which saw no geo URLs [semrush top_pages_more; v1 §2.7].
- **Two hosts.** www (MovingCompany markup) and a WordPress blog (Organization markup) have separate navs, and NYC intent overlaps: the city page and a blog "Best Moving Companies in New York City" post [capture blog /; semrush top_pages_more].
- **Blog.** Seven blog URLs earn 473 visits, about 330 on population, museum, restaurant and home-type lists [semrush top_pages_more]. Dates are relative ("2 years ago" to "4 years ago"), a title says "in 2023", and cost posts show no method or source [capture blog].
- **Markup.** /faq/ is 212 words of "READ MORE" links; no captured page has FAQPage, BreadcrumbList, Article or Person markup, or an author or methodology page [capture].
- **Hygiene.** /sign-in/ copies the home title and meta, the blog H1 is an image, four typos appear, and robots directives were not captured [capture].

## Design and UX
- On mobile, "The Moving App" link precedes the H1 on all four www pages with a recorded order; the home "Moving From" field and a support link sit above the fold [capture /, /partnership/, /how-it-works/, /sign-in/].
- On desktop, promo, provider and login links precede the H1; the form's position was not recorded [capture /].
- Both home address inputs share one element id [walk /].

## What AMC should adopt or adapt
- **Move details first, from any page** [walk /; capture /how-it-works/]. Better: route fields after the H1 and lede on mobile and every explainer; required size choices pairing bedrooms with square feet, never preset; a flexible-date option; stops and storage early; unique field ids and labels. Serves: quote survey (lead-lifecycle §2 steps 1-5; shared-pricing §6; visual-direction §12).
- **Price explainer** [capture /how-it-works/]. Better: a plain formula of the estimator's inputs on a versioned method page, shown as a range, with steps stating the exclusive and shared rule; an optional inventory step can sharpen the lead spec. Serves: value before contact (site-architecture §6.3 rule 5; reference-matrix §3).
- **Control, not a no-calls promise** [capture /; walk /]. Better: the consumer picks how many movers and sees who they are, with verification dates, before agreeing; benefit blocks claim only that. Serves: quote survey (lead-lifecycle §2 steps 7-8; visual-direction §12).
- **Payment reassurance, turned around** [capture /]. Better: "How AMC makes money" and "Movers vs Brokers" pages (movers pay for requests; AMC never prices, books or takes payment), echoed by quote buttons and at confirmation, plus estimate and safe-payment education (110% rule, Protect Your Move). Serves: trust pages (consent draft §1, §7; compliance facts §1 implication 7, §2).
- **Real reviews** [capture / meta]. Better: evidence labels, separate quote and move ratings, a public methodology, and negative reviews with replies. Serves: reviews (mover-verification §6; compliance facts §4).
- **City cost posts and an NYC building rule** (certificates of insurance for co-ops and condos) [capture blog /category/moving-cost/, blog /]. Better: cost ranges only from mover rate cards (5+ movers) or cited studies, dated, on the page they describe, plus sourced, dated building-access facts. Serves: real-data rule (site-architecture §4.1 G3-G5, §6.3 rule 2).
- **Joining-rule options** [inference]. Own trucks, which screens out brokers, and a minimum operating history, which screens out new or reincarnated carriers. Serves: movers only (mover-verification §1, §3).
- **Partner channel, later** [capture /partnership/]. Better: the same survey, named-mover consent and sharing limit; counsel on partner disclosure; reward emails kept apart from quote consent; plain, sponsored-marked widget links [verify]. Serves: lead-lifecycle §2; compliance facts §3-§4; mvp-scope §5.

## What AMC should avoid
- Pricing, booking, payments, guaranteeing or discounting movers' prices, and copy that sets their prices apart from estimates or promises "no hidden fees"; flag the mvp-scope §5 payments add-on for removal or counsel sign-off (discovery brief §1, §4; compliance facts §2, §7 implication 4; consent draft §6) [capture /, /partnership/].
- Mover-type markup, "our movers" and self-ratings; use one Organization @id, mover types only for movers, rating markup only on profiles, and a schema lint (site-architecture §7.1, §8.5, §9; compliance facts §5) [capture].
- Silence on who pays; publish mover terms at /for-movers/, and never call reviews "independent" without saying movers pay (compliance facts §4) [capture].
- Unsourced counts, savings and "best", "only", "biggest" or "guaranteed" claims; date every count and ask counsel about substantiation (reference-matrix §4 item 7; site-architecture §4.6) [capture /].
- Unexplained vetting; show USDOT and MC with FMCSA links, and link badges to a dated method page (compliance facts §1 implication 6; mover-verification §4, §7) [capture].
- Calling move details non-personal or sharing with unnamed "affiliates"; name the buying movers and what they get (lead-lifecycle §5; backlog line 79) [capture /privacy/].
- Unapproved cross-sells (consent draft §3; lead-lifecycle §1), tags that read form fields (site-architecture §8.6) and commercial lead enrichment [capture].
- Errors that drop answers or force a login (lead-lifecycle §1-2) [walk].
- City pages without coverage and data; enter New York through routes and long distance, not "movers nyc" (KD 72) (site-architecture §4.1, §5.3) [semrush].
- A second host, uppercase states, lifestyle posts, link-only FAQs, relative dates, years in titles, duplicate titles, image H1s and app links on the mobile first screen (site-architecture §2.1-§2.2, §7.3-§7.4, §8.2, §9; visual-direction §12) [capture; semrush].

## Gaps and open questions
- After the first screen: contact step, account rules, mover count, consent and named sellers [walk].
- Agreement, Terms and For Service Providers pages: arbitration, refunds, card timing, commission disclosure [capture].
- How Unpakt is paid; FMCSA or state registration (one search found none, which proves nothing); BBB and complaint records [search].
- Profile and city templates; sources of the rating, scale and 45% claims; the utilities partner; the full privacy policy; tag access to form values [capture].
- Ownership links: what "our Move affiliates" means, and whether founder-linked movers (FlatRate Moving, per unverified search summaries) appear in comparisons [capture /privacy/; search].
- Robots, sitemaps, keyword lists, backlinks and AI answers [capture; semrush].
- Owner questions: merge "best movers in {city}" into city pages, against site-architecture §2.4 rule 6? Add a guide review interval tied to "Last reviewed" (§4.4, §7.3)? [inference]

## Sources
- Evidence: `docs/research/reference-review/captures/unpakt.md`, `_provenance.md`; private raw pack (not in the repository).
- v1: `docs/research/reference-matrix.md` §2.7, §3, §4 item 7.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/` domain_rank, top_pages_more, phrase_these, phrase_organic_top10, backlinks_overview; `docs/seo/raw/semrush_phrase_organic_top10_2026-10-27.csv`.
- AMC docs as cited: discovery brief, business rules, compliance facts, site architecture, visual direction, mvp-scope, backlog.
- Pages: https://www.unpakt.com/ (`/`, `/how-it-works/`, `/faq/`, `/partnership/`, `/sign-in/`, `/privacy/`); https://blog.unpakt.com/ (`/`, `/category/how-to-before-moving/`, `/category/moving-cost/`).
- Search, not re-verified. Site's own: https://unpakt-mover-faq.groovehq.com/help/what-percentage-of-commission-is-unpakt-charging-me. Third party: https://betakit.com/unpakt-launches-platform-to-help-homeowners-compare-and-book-movers/; https://uk.trustpilot.com/review/unpakt.com; https://www.consumersadvocate.org/moving-companies/c/unpakt-moving-companies-review.
