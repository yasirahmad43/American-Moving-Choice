# Budget Van Lines: reference review

A self-declared household-goods broker that arranges interstate moves on affiliated carriers' unfilled trucks [capture /about-us, /terms-of-use]. It is on the list as the counter-example: the broker model AMC's movers-only rule excludes [v1 §2.3].

**Reviewed:** 2026-10-27. **Evidence:** 6 of 6 pages captured; one automated walk, from the origin ZIP to `/999moving`, a custom calculator the walker could not operate; Semrush US; standard WebSearch. **Confidence:** medium. Every page was captured, but nothing past the calculator's first screen was seen, including the contact and consent steps.

## At a glance
- BVL calls itself "a federally licensed full service moving broker" and says it is "not a motor carrier" [capture /terms-of-use, /about-us]. Its agents "coordinate your move" on affiliates' unfilled trucks [capture /about-us].
- Inner pages state the broker role, but the home page's captured text does not. The two home URLs take about 99.7% of estimated organic visits [capture /; semrush top_pages_more].
- The quote flow asks for the origin ZIP, then hands off to a widget the walker could not operate [walk /, /999moving].
- The Terms allow sharing details with "other moving companies" and give no number. No captured excerpt says how BVL is paid [capture /terms-of-use].
- BBB grades BVL A+, but its BBB reviews average 1.68/5 and Trustpilot shows 1/5 [search: bbb.org, trustpilot.com, third party].
- About 1,934 estimated organic visits a month, no page families and no JSON-LD [semrush domain_rank; capture].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 1. Home hero | Origin ZIP only | "Starting as low as $1,250", with no basis given | [capture /; walk /] |
| 1a. Inner pages | Origin ZIP ("Enter ZIP to Get Quotes") | No number of companies | [capture /how-it-works] |
| 2. `/999moving` | "Select Move Type:" in a custom "Moving Cost Calculator™" | No standard fields or next button; no contact fields yet | [walk /999moving] |
| 3. Rest of flow, contact, consent | Not observed | Not observed | [walk] |

- The one-field start matches how AMC's survey opens [walk /]. The walker's failure on the widget is a warning about keyboard and screen-reader access [inference].
- Whether BVL asks for contact details before any price is unknown. So `docs/product/jtbd-and-journeys.md` line 89 ("asks for contact info up front") and v1's estimate-by-phone claim stay unconfirmed [walk; v1 §2.3].
- `/999moving` is indexed, with 25 keywords and about 3 visits [semrush top_pages_more]. A search found a copy with `device=`, `network=` and `qs=` parameters [search: budgetvanlines.com, site's own URL], which look like ad tracking [inference].
- BVL describes agent-run service, "From the booking agent to the dispatch department" [capture /about-us]. How follow-up starts was not observed.

## Mover side
Carriers join an "affiliate program" and tell BVL where their unfilled trucks are [capture /about-us]. No join page, fees, vetting steps, sharing limits or exclusivity terms appeared in the capture or in Semrush's top 15 pages [capture; semrush top_pages_more]. Nothing here suits AMC's company portal [inference].

## Trust, verification and reviews
- **Vetting.** "All the moving companies in our network are insured and licensed by the FMCSA" comes with no method, date or carrier names [capture /pricing]. v1's carrier list at `/carrier-list` was not captured, so it is unconfirmed, not missing [v1 §2.3].
- **Claims.** "Up to 50%" savings and "hundreds of motor carriers and thousands of trucks" have no source [capture /how-it-works, /about-us]. The H1, "Arranging Full-Service Moves at Self-Service Rates", is itself an unsourced price comparison that opens with "Arranging" [capture /].
- **Names.** BBB lists separate profiles for American Budget Van Lines LLC and Budd Van Lines [search: bbb.org, third party]. Name-only checks mislead in this category [inference].
- **Reviews.** A "Shopper Approved" logo image sits above the fold on the home page [capture /]. The review pages hold keywords but were not captured [semrush]. Search excerpts show an A+ BBB grade, accreditation since 4/12/2013 and 3 complaints in 3 years, but 1.68/5 from 47 BBB reviews [search: bbb.org, third party]. Trustpilot shows 1/5 from 95 with no replies to negative reviews, and MoveAdvisor 2.3 from 157 [search: nz.trustpilot.com, moveadvisor.com, third party].
- **Complaints.** Unverified posts describe price increases at pickup, lost, damaged or late goods, unwanted calls and moves handled by other carriers [search: bbb.org, complaintsboard.com, third party]. One 2011 post says goods were held until the customer paid more than double a binding estimate [search: complaintsboard.com, third party]. The reviewer's web searches, not re-run, found no lawsuits or regulator actions; court, enforcement and FTC records were not checked [search].
- **Company details.** /terms-of-use gives two Las Vegas addresses, and "Last Updated: June 2, 2016" sits above "© 2026" [capture /terms-of-use]. /privacy-policy cites a Verisign seal, and the broker note has a typo, "whos charges" [capture /privacy-policy, /about-us]. The owners and officers of BUDGET VAN LINES® Inc. were not established [search].

## Disclosure and consent
- **Role.** The broker role is worded at least five ways on /how-it-works (above the fold), /about-us, /pricing and /terms-of-use, the only page with USDOT and MC numbers [capture]. Neither the page capture nor the walk's scan found a role line on the home page, but the capture did not scroll [capture /; walk /]. v1 put the disclosure in the footer and legal pages [v1 §2.3]. This review draws no legal conclusion about BVL.
- **Payment.** The nearest line says the carrier's "charges will be determined by its published tariff" [capture /about-us]. A deposit testimonial, a "broker fee" review and v1's "movers pay" were not re-confirmed [search, site's own page and third party; v1 §2.3]. A search summary says a BVL reply to a BBB complaint called it a lead-matching service [search: bbb.org, third party; page not opened].
- **Sharing.** The Terms say BVL "may provide your information to other moving companies" [capture /terms-of-use]. The privacy policy says "No mobile information will be shared with third parties/affiliates for marketing/promotional purposes" [capture /privacy-policy]. The two are hard to reconcile, and the second reads like standard texting-program wording [inference].
- **Consent.** No consent wording at the point of contact was seen [walk]. The privacy policy relies on "By using this website, you consent to the data practices described in this statement" [capture /privacy-policy]. The Terms add a short-code SMS clause with a STOP opt-out [capture /terms-of-use]. Captured excerpts hold no autodialer or "not a condition of purchase" wording [capture].
- **Other terms.** Users "irrevocably waive any claim to consequential, punitive or exemplary damages", and BVL "and its authorized third parties" may contact customers after booking [capture /terms-of-use]. No captured heading mentions arbitration [capture /terms-of-use].
- **Scripts.** TikTok, Google Ads and Bing tags, Google Tag Manager, Hotjar and bzrcdn.openai.com load; no consent-certificate script was detected [capture].

## SEO and content
- **Traffic.** About 1,934 estimated organic visits a month come from 178 keywords, worth $19,344 [semrush domain_rank]. The two home URLs hold 99.68%, and no other page gets more than 3 visits [semrush top_pages_more]. That points to brand demand, though no keyword list was exported [inference]. moveBuddha, by contrast, draws 38,335, led by its calculator at 4,399 [semrush; keyword-research §1–2].
- **Structure.** No state, city, route, profile, cost-guide or best-of family appears in the capture, Semrush's top 15 or v1 [capture; semrush; v1 §5]. A "Moving 101" heading hints at a guide section that was not captured [walk /].
- **URLs.** The http and https home URLs both rank, and `/Moving_Pods` and `/landing_page1` mix case and underscores [semrush]. Semrush's paid figures cover Google only, while Bing and TikTok tags load too, so v1's paid landing variants stay unconfirmed [semrush; capture; v1 §2.3].
- **Thin pages.** The home page has 106 words and the other marketing pages 251 to 380, each built around the same ZIP form [capture]. Titles are the brand alone or a page label plus the brand, and one meta reads "How are moving process works." [capture /how-it-works].
- **Answer shape.** /pricing gives one heading per cost factor, with no numbers or sources [capture /pricing], and draws about 1 visit a month [semrush]. No captured page names an author, and none has JSON-LD [capture].
- **AI search** (one tool only). Brand searches did not list budgetvanlines.com; answers cited CB Insights and review sites and still called BVL a broker [search, third party]. Review answers leaned on Trustpilot and MoveAdvisor, where some reviews date from 2011 to 2014 [search, third party].

## Design and UX
- On desktop, "Any Questions?" and a phone icon come before the H1 [capture /]. The pack lists only ten elements, so the desktop ZIP position is unknown; on mobile the ZIP field is above the fold [capture /].
- Footer icon links read "fCreated with Sketch.", most likely leftover design-tool text, and /pricing shows three images with empty alt text [capture, footer, /pricing; inference].

## What AMC should adopt or adapt
- **One-field start** [walk /]. Better: standard, labeled controls at every step and one canonical survey URL that stores the campaign source. Serves the survey order (lead-lifecycle §2) and canonical rules (site-architecture §2.4).
- **Role statement** [capture /how-it-works]. Better: one counsel-approved line beside the first survey field on the home page, reused word for word in the footer, /about/ and Organization markup. Serves consent draft §1 (add the hero) and site-architecture §7.1.
- **Cost-factor explainer** [capture /pricing]. Better: AMC's own words on /moving-costs/how-movers-charge/ (1,900/mo, KD 19) [semrush], with ranges only from sources site-architecture §6.3 allows, after counsel review. Serves value before contact (compliance facts §2).
- **Vetting claim** [capture /pricing]. Better: a How We Verify Movers page, each mover's USDOT and MC with an FMCSA link and a dated "Last checked", never "licensed by the DOT". Serves mover-verification §3 and §5.
- **Number-first checks** [search: bbb.org]. Better: verify on USDOT number and authority type, with names only as a cross-check; /verify-a-mover/ (4,400/mo, KD 18) [semrush] warns about similar names. Serves mover-verification §3.
- **Broker-vs-carrier explainer** [search]. Better: /movers-vs-brokers/ (110/mo, KD 6) [semrush] with a comparison table, an FMCSA check and a note that "Van Lines" proves nothing, defining AMC by what it does, not "lead matching". Serves movers-only (mover-verification §7).
- **Carrier lane data** [capture /about-us]. Better: route pages show a dated count of approved movers serving the route, and AMC never coordinates loads or discounts. Serves the route gate (site-architecture §4.1).
- **Privacy-request link** [capture]. Better: one sharing statement used everywhere and an admin request queue [inference]; counsel tests "We don't sell your details" against state "sale" definitions. Serves consent draft §3.

## What AMC should avoid
- Arranging moves: truck matching, passed-on discounts, "booking agent" wording or a price-comparison H1 (compliance facts §2; consent draft §1).
- Silence on payment. Show "how we make money" near quote buttons and at consent (consent draft §7).
- Open-ended sharing. Use the consumer's chosen number and named movers (lead-lifecycle §2; consent draft §6).
- Consent through site use or the Terms. AMC's own checkbox draft bundles Terms acceptance, which compliance facts §3 asks to separate (consent draft §5).
- Texting wording that says SMS data is never shared while AMC sends numbers to named movers. Counsel should separate the two (compliance facts §3).
- "As low as" prices, unsourced claims and vendor logos as the main trust signal (mover-verification §6).
- Form-only home pages, mixed-case URLs, stale legal pages, and unmasked replay or ad pixels on forms (site-architecture §2.2, §3.3, §8.6).

## Gaps and open questions
- `/999moving` past the first screen: any price, the contact step, consent wording and named sellers. Mark jtbd line 89 unverified until someone walks it by hand.
- How many companies receive a request, who pays BVL, and whether the broker footer shows on the home page.
- BVL's FMCSA record; uncaptured pages such as `/carrier-list` and the review pages; the Shopper Approved and eKomi terms.
- Ownership, and who runs budgetvan.carrd.co, which reuses BVL's H1 wording [search, third party].
- Live ratings, calls after submitting, court and enforcement records, canonicals and redirects.
- Evidence caps: pack.js keeps six snippets, six key lines and ten above-the-fold elements per page and drops repeats, so absence claims need a recheck.
- v1 put data sharing in the privacy policy; the capture found it in the Terms.

## Sources
- Evidence: `docs/research/reference-review/captures/budgetvanlines.md`, `_provenance.md`; `tools/reference-capture/capture.js`, `pack.js`; private raw pack outside the repository.
- v1: `docs/research/reference-matrix.md` §2.3, §5.
- Semrush (US, 2026-10-27): `docs/research/raw/semrush/domain_rank_2026-10-27.json`, `top_pages_more_2026-10-27.csv`; `docs/research/keyword-research.md` §1–2; `docs/seo/keyword-to-page-map.csv`.
- AMC docs: `docs/business-rules/` (consent draft, lead-lifecycle, mover-verification); `docs/research/compliance-and-platform-facts.md`; `docs/seo/site-architecture.md`; `docs/product/jtbd-and-journeys.md`.
- Pages: https://www.budgetvanlines.com/ plus the paths cited. Via search (site's own): `/budget-van-lines-reviews`, `/999moving?device=c&network=g&placement=&qs=transport+quote`.
- Third party: https://www.bbb.org/us/nv/las-vegas/profile/moving-brokers/budget-van-lines-inc-1086-90021612 (also `/customer-reviews`, `/complaints`); https://nz.trustpilot.com/review/budgetvanlines.com?page=3; https://moveadvisor.com/movers/budget-van-lines-124?page=2; https://www.complaintsboard.com/budget-van-lines-binding-estimate-c404525; https://www.bbb.org/us/nj/north-bergen/profile/house-movers/american-budget-van-lines-llc-0221-90185370; https://www.bbb.org/us/nj/somerset/profile/moving-companies/budd-van-lines-0221-16000141; https://www.cbinsights.com/compare/budget-van-lines-vs-move-advisor; https://budgetvan.carrd.co (owner not verified).
- WebSearch (standard, 2026-10-27), six runs: "Budget Van Lines"; "… reviews"; "is Budget Van Lines a moving broker or a moving company"; "moving broker vs carrier"; "cheap long distance movers"; "Budget Van Lines USDOT 2233611 MC 512534".
