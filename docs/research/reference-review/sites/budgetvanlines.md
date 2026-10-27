# Budget Van Lines: reference review

A self-declared household-goods broker that arranges interstate moves on affiliated carriers' unfilled trucks [capture /about-us, /terms-of-use]. It is on the list as the counter-example: the broker model AMC's movers-only rule excludes [v1 §2.3].

**Reviewed:** 2026-10-27. **Evidence:** 6 of 6 pages captured; an automated walk from the origin ZIP to `/999moving`, a custom calculator the walker could not operate; Semrush US; standard WebSearch. **Confidence:** medium. All pages were captured, but nothing past the calculator's first screen was seen, including contact and consent.

## At a glance
- BVL says it is "a federally licensed full service moving broker" and "not a motor carrier"; its agents "coordinate your move" [capture /terms-of-use, /about-us].
- The home page, whose two URLs take about 99.7% of estimated organic visits, showed no broker line in the capture; inner pages state it [capture /; semrush top_pages_more].
- The quote flow asks for the origin ZIP, then opens a widget the walker could not operate [walk /999moving].
- The Terms allow sharing with "other moving companies" [capture /terms-of-use]. No captured page gives a number or says how BVL is paid [capture].
- BBB grades BVL A+, but its BBB reviews average 1.68/5 and Trustpilot shows 1/5 [search: bbb.org, trustpilot.com, third party].
- About 1,934 estimated organic visits a month, no geo, route or profile pages, and no JSON-LD [semrush domain_rank; capture].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 1. Home hero | Origin ZIP only | "Starting as low as $1,250", with no move size, distance or date | [capture /; walk /] |
| 1a. Inner pages | Origin ZIP ("Enter ZIP to Get Quotes") | No number of companies | [capture /how-it-works] |
| 2. `/999moving` | "Select Move Type:" in a custom "Moving Cost Calculator™" | No standard fields or next button; no contact fields yet | [walk /999moving] |
| 3. Rest, contact, consent | Not observed | Not observed | [walk] |

- The walker's failure on the custom widget warns of accessibility problems [inference].
- Whether contact comes before any price is unknown, so jtbd-and-journeys line 89 ("asks for contact info up front") and v1's estimate-by-phone claim stay unconfirmed [walk; v1 §2.3].
- `/999moving` is indexed but draws about 3 visits, against 4,399 for moveBuddha's calculator [semrush top_pages_more; keyword-research §2]. A search, not re-checked, found a copy with `device=`, `network=` and `qs=` parameters [search, site's own URL], which look like ad tracking [inference].
- BVL describes agent-run service ("booking agent", "dispatch department") [capture /about-us]; follow-up was not observed [walk].

## Mover side
Carriers join an "affiliate program" and report their unfilled trucks [capture /about-us]. No join page, fees, vetting steps, sharing limits or exclusivity terms appeared in the capture or Semrush's top 15 pages [capture; semrush]. Nothing here suits AMC's company portal [inference].

## Trust, verification and reviews
- **Vetting.** "All the moving companies in our network are insured and licensed by the FMCSA" gives no method, date or carrier names [capture /pricing]. v1's `/carrier-list` was not captured, so it is unconfirmed, not missing [v1 §2.3].
- **Claims.** "Up to 50%" savings and "hundreds of motor carriers and thousands of trucks" have no source [capture /how-it-works, /about-us]. The H1, "Arranging Full-Service Moves at Self-Service Rates", is an unsourced price comparison that opens with "Arranging" [capture /].
- **Reviews.** A "Shopper Approved" logo image sits above the fold [capture /]. In excerpts dated 2026-10-27, BBB shows A+, accreditation since 4/12/2013 and 3 complaints in 3 years, but its reviews page shows 1.68/5 from 47 [search: bbb.org, third party]. Trustpilot shows 1/5 from 95 with no company replies, and MoveAdvisor 2.3 from 157 [search: nz.trustpilot.com, moveadvisor.com, third party].
- **Complaints.** Unverified posts describe price increases at pickup, lost, damaged or late goods, unwanted calls and moves handled by other carriers [search: bbb.org, complaintsboard.com, third party]. A 2011 post alleges goods were held for more than double a binding estimate [search: complaintsboard.com, third party]. Web searches, not re-run, found no lawsuits or regulator actions; court, enforcement and FTC records were not checked [search].
- **Details.** /terms-of-use gives two Las Vegas addresses and "Last Updated: June 2, 2016" above "© 2026" [capture /terms-of-use].

## Disclosure and consent
- **Role.** The role is worded at least five ways on /how-it-works (above the fold), /about-us, /pricing and /terms-of-use, the only page with USDOT and MC numbers [capture]. No role line was found on the home page, but the capture did not scroll [capture /; walk /]. v1 put the disclosure in the footer and legal pages [v1 §2.3]. This review draws no legal conclusion about BVL.
- **Payment.** The nearest line says the carrier's "charges will be determined by its published tariff" [capture /about-us]. A deposit testimonial, a "broker fee" review and v1's claim that movers pay are unconfirmed [search: site's own page, trustpilot.com; v1 §2.3]. A BBB complaint reply reportedly calls BVL a lead-matching service [search: bbb.org, third party; summary only].
- **Sharing.** The Terms say BVL "may provide your information to other moving companies" [capture /terms-of-use]. The privacy policy says "No mobile information will be shared with third parties/affiliates for marketing/promotional purposes" [capture /privacy-policy]. These are hard to reconcile; the second reads like standard texting wording [inference]. v1 placed the sharing clause in the privacy policy [v1 §2.3].
- **Consent.** No consent wording at the point of contact was seen [walk]. The privacy policy relies on "By using this website, you consent to the data practices" [capture /privacy-policy]. The Terms add a short-code SMS clause with STOP [capture /terms-of-use]. Captured excerpts show no autodialer or "not a condition of purchase" wording [capture].
- **Terms.** Users "irrevocably waive" consequential and punitive damages, and BVL "and its authorized third parties" may contact customers after booking; no captured heading mentions arbitration [capture /terms-of-use].
- **Scripts.** TikTok, Google Ads, Bing, Google Tag Manager, Hotjar and bzrcdn.openai.com load; no consent-certificate script was detected [capture].

## SEO and content
- **Traffic.** About 1,934 estimated organic visits a month come from 178 keywords, valued at $19,344 [semrush domain_rank]. The two home URLs hold 99.68%, and no other page gets more than 3 [semrush top_pages_more]. That suggests brand searches, with almost nothing earned by content pages [inference].
- **Structure.** No state, city, route, profile, cost-guide or best-of family appears [capture; semrush; v1 §5]. A "Moving 101" heading hints at a guide section that was not captured [walk /].
- **URLs.** The http and https home URLs both rank, and `/Moving_Pods` and `/landing_page1` mix case and underscores [semrush]. Semrush's small paid estimate covers Google ads only, so v1's paid landing variants are neither confirmed nor refuted [semrush; v1 §2.3].
- **Thin pages.** The home page has 106 words and the other marketing pages 251 to 380, all built around one ZIP form [capture].
- **Answer shape.** /pricing gives one heading per cost factor, without numbers or sources, and draws about 1 visit a month [capture /pricing; semrush]. No captured page names an author or has JSON-LD [capture].
- **AI search** (one tool). Brand searches did not list budgetvanlines.com, though the domain is indexed; answers cited CB Insights and review sites and still called BVL a broker [search, third party]. Review answers relied on Trustpilot and MoveAdvisor, including reviews from 2011 to 2014 [search, third party].

## Design and UX
- On desktop, "Any Questions?" and a phone icon come before the H1 [capture /]. The pack lists ten elements, so the desktop ZIP position is unknown; on mobile the field is above the fold [capture /].
- Footer icon links read "fCreated with Sketch.", likely leftover design-tool text, and /pricing has three images with empty alt text [capture footer, /pricing; inference].

## What AMC should adopt or adapt
- **One-field start** [walk /]. Better: labeled, standard controls at every step and one canonical survey URL that stores the campaign source. Serves lead-lifecycle §2 and site-architecture §2.4.
- **Role statement** [capture /how-it-works]. Better: one counsel-approved line beside the first survey field on the home page, reused word for word sitewide and in Organization markup. Serves consent draft §1 and site-architecture §7.1.
- **Cost-factor explainer** [capture /pricing]. Better: AMC's own words on /moving-costs/how-movers-charge/ (1,900/mo, KD 19) [semrush], with ranges only from sources site-architecture §6.3 allows, after counsel review (compliance facts §2). Serves value before contact.
- **Vetting claim** [capture /pricing]. Better: a How We Verify Movers page, USDOT and MC numbers with an FMCSA link and a dated "Last checked", never "licensed by the DOT". Serves mover-verification §3 and §5.
- **Number-first checks.** BBB lists separate profiles for American Budget Van Lines LLC and Budd Van Lines [search: bbb.org, third party]. Better: verify on USDOT number and authority type, with names only as a cross-check; /verify-a-mover/ (4,400/mo, KD 18) [semrush] flags similar names. Serves mover-verification §3.
- **Broker-vs-carrier explainer** [search, not re-checked]. Better: /movers-vs-brokers/ (110/mo, KD 6) [semrush] with a comparison table and an FMCSA check, defining AMC by what it does, not "lead matching". Serves mover-verification §7.
- **Privacy-request link** [capture]. Better: one sharing statement everywhere and an admin request queue [inference]; counsel tests "We don't sell your details" against state "sale" definitions. Serves consent draft §3.

## What AMC should avoid
- Arranging moves: truck matching, passed-on discounts, "booking agent" wording or a price-comparison H1 (compliance facts §2).
- Silence on payment. Show "how we make money" near quote buttons and at consent (consent draft §7).
- Open-ended sharing. Use the consumer's chosen number and named movers (lead-lifecycle §2).
- Consent through site use or the Terms. AMC's own checkbox draft bundles the Terms, which compliance facts §3 asks to separate (consent draft §5).
- Texting wording that says SMS data is never shared while AMC sends numbers to named movers (compliance facts §3).
- "As low as" prices, unsourced claims, and vendor logos or grades as the main trust signal (mover-verification §6).
- Form-only home pages, mixed-case URLs, stale legal pages and unmasked replay on forms (site-architecture §2.2, §3.3, §8.6).

## Gaps and open questions
- `/999moving` past its first screen: any price, the contact step, consent and named sellers. Mark jtbd line 89 unverified until someone walks it by hand.
- How many companies receive a request, who pays BVL, and whether the broker footer shows on the home page.
- BVL's FMCSA record; `/carrier-list` and the review pages; the Shopper Approved and eKomi terms.
- Ownership, and who runs budgetvan.carrd.co, which reuses BVL's H1 wording [search, third party].
- Live ratings, calls after submitting, court and enforcement records, canonicals. pack.js caps excerpts and drops repeats, so absence claims need a recheck [capture].

## Sources
- Evidence: `docs/research/reference-review/captures/budgetvanlines.md`, `_provenance.md`; `tools/reference-capture/capture.js`, `pack.js`; private raw pack outside the repository.
- v1: `docs/research/reference-matrix.md` §2.3, §5.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/domain_rank_2026-10-27.json`, `top_pages_more_2026-10-27.csv`; `docs/research/keyword-research.md` §1–2; `docs/seo/keyword-to-page-map.csv`.
- AMC docs: `docs/business-rules/` (consent draft, lead-lifecycle, mover-verification), `docs/research/compliance-and-platform-facts.md`, `docs/seo/site-architecture.md`, `docs/product/jtbd-and-journeys.md`.
- Pages: https://www.budgetvanlines.com/ plus the paths cited. Via search (site's own): `/budget-van-lines-reviews`, `/999moving?device=c&network=g&placement=&qs=transport+quote`.
- Third party: https://www.bbb.org/us/nv/las-vegas/profile/moving-brokers/budget-van-lines-inc-1086-90021612 (also `/customer-reviews`, `/complaints`); https://nz.trustpilot.com/review/budgetvanlines.com?page=3; https://moveadvisor.com/movers/budget-van-lines-124?page=2; https://www.complaintsboard.com/budget-van-lines-binding-estimate-c404525; https://www.bbb.org/us/nj/north-bergen/profile/house-movers/american-budget-van-lines-llc-0221-90185370; https://www.bbb.org/us/nj/somerset/profile/moving-companies/budd-van-lines-0221-16000141; https://www.cbinsights.com/compare/budget-van-lines-vs-move-advisor; https://budgetvan.carrd.co (owner not verified).
- WebSearch (standard, 2026-10-27), six runs: "Budget Van Lines", plus "reviews", "is … a moving broker or a moving company" and "USDOT 2233611 MC 512534"; "moving broker vs carrier"; "cheap long distance movers".
