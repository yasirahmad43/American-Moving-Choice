# EnergySage (inspiration: solar marketplace): reference review

A solar and home-energy marketplace where homeowners compare installer quotes, listed as inspiration for marketplace clarity, not as a moving competitor [capture: /; v1 §2.9].

**Reviewed:** 2026-10-27. **Evidence:** captured 10 of 10 pages (9 unique; the privacy policy twice); an automated walk through four onboarding screens, stopped before any contact step; Semrush US, October 2026; earlier search excerpts, many not rechecked because the search budget ran out; v1 §2.9. **Confidence:** medium, because the pages were fully captured but the contact step, the installer side and the payment model were not observed.

## At a glance
- "Free" and "unbiased" lead the copy, but no captured excerpt says who pays [capture: /, /solar/how-to-pay-for-solar/].
- One ZIP field, then one question per screen; after four screens no contact details had been requested [walk].
- The cost page (#1, 18,689 estimated visits) and the calculator (#3, 8,780) lead money-adjacent traffic of 238,617 a month [semrush: top_pages_more, domain_rank].
- A dated editorial policy with an AI-use section, named writers and editors, and published ranking criteria [capture: /editorial-guidelines/, articles].
- Customer counts, founding year and cost figures drift across pages and between meta and body [capture].
- Vetting words and superlatives are never defined or sourced [capture].
- The privacy policy uses browse-to-consent wording [capture: /privacy-policy/].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 0. / | ZIP (prefilled 20147), "Get started" | Value line; "Your information is safe with us." | [walk; capture: /] |
| 1. PropertyType | Home, Business or Nonprofit; one option preselected (which, unrecorded) | Nothing beyond the question was recorded | [walk] |
| 2. OwnsProperty | Own or rent | Nothing recorded | [walk] |
| 3. ElectricityBill | Monthly bill (custom widget); advanced with no input | Nothing recorded | [walk; inference: preset or optional] |
| 4. EnergyInterest | Appliance plans (custom widget) | Did not advance; the walk stopped | [walk] |
| After | Not observed | v1: about 3 quotes within a week, up to 7 | [v1 §2.9] |
| Side: /solar/calculator/ | Address, property type, monthly bill | Not run, so whether an estimate comes before contact is unknown | [capture] |

- Each step has its own URL, `/onboarding/start/{Step}/?zip_code=20147&product=solar-pv`; robots and canonical tags were not recorded [walk].
- 20147 is Ashburn VA, where the capture sandbox runs, so the test ZIP was never typed, and no screen asked to confirm the location [walk; inference: an IP-based lookup].
- The hero promises "multiple quotes" with no number, and no installer count appeared [capture: /; walk]. v1 says shoppers choose whether installers may phone them [v1 §2.9].
- "See solar prices" and "Check battery prices" buttons promise prices, but the walked homepage entry showed only questions [capture: articles, /; walk].

## Mover side
No installer-facing page was captured, so fees, lead rules, exclusivity and caps are unknown [capture]. v1 says installers pay and consumers use it free [v1 §2.9]. A help-center excerpt says installers "pay a small fee to join our marketplace, but only after we vet them" [search: help.energysage.com, own page, not rechecked]. Excerpts from 2018 and 2022 describe in-platform messaging, with the shopper's number shared only after they pick an installer [search: info.energysage.com, own; solarpowerworldonline.com, electrek.co, third party; not rechecked]. Corporate partners may "link to or embed" content, guides and calculators [capture: /partners/corporations/].

## Trust, verification and reviews
- **Advisor.** The H1 "Compare solar quotes. Choose with an expert." and "a free, unbiased Energy Advisor by your side" put a person up front, but no captured page says how advisors are paid [capture: /]. That is more prominent than v1 recorded, though /about-us/ still offers "as much help as you want" [capture; v1 §2.9].
- **Vetting.** "Pre-screened, certified installers" (/) and "vetted installers" (/about-us/) are never defined, and no guarantee goes beyond "we have your back" [capture]. Published criteria are search-only [search: help.energysage.com, own page, not rechecked].
- **Claims.** The / meta says "over 50,000 homeowners"; H2s say 60,000 [capture: /, /about-us/]. /editorial-guidelines/ says "since our founding in 2009", /about-us/ "Twelve years ago" [capture; inference: about 2014]. "The nation's most trusted solar marketplace", "America's largest clean energy marketplace" and "Save 20 to 30%" show no basis [capture: /, /about-us/, /partners/corporations/].
- **Backers.** Schneider Electric backing, DOE funding and the founder are named; whether logos link anywhere was not recorded [capture: /partners/corporations/, /, /about-us/]. The 2022 controlling-stake purchase is search-only [search: pv-magazine.com, third party, not rechecked].
- **Testimonials.** Nine reviews.io "Verified Customer" quotes review the platform, not installers; all are positive, and the five with dates read "1 year ago" [capture: /, /partners/corporations/]. One praises "a neutral, knowledgeable advisor" [capture: /]. No negatives, replies or review markup were captured, nor the installer reviews two quotes mention [capture].
- **Ranking.** The best-panels page publishes criteria and says EnergySage "is not paid to review brands or products", with an affiliate clause limited to "this article" [capture: /solar/best-solar-panels-complete-ranking/]. It is silent on installer payments, though "Popularity reflects how often installers quote this equipment" [capture; v1 §2.9]. Whether equipment makers with supplier pages pay is unknown [capture; semrush].

## Disclosure and consent
- **Who pays.** A quote box says "Unbiased advice · Completely free" (/solar/how-to-pay-for-solar/), and the /about-us/ section "Good for shoppers. Good for installers." has no captured body [capture].
- **Partner.** "EnergySage partners with Qmerit to connect you with certified installers" sits above "Check battery prices" [capture: /].
- **Consent.** The only contact or sharing text captured at entry points is "Your information is safe with us." (/, /solar/calculator/) [capture]. The policy says "By visiting energysage.com … you are consenting to the practices described in this Privacy Policy" [capture: /privacy-policy/]. Screens 1 to 4 showed no checkbox or consent wording [walk]. No consent-certificate script was detected on captured pages; onboarding scripts were not recorded [capture].
- **Sharing.** The policy allows sharing with "corporate affiliates that are subject to this policy" and ad partners, promises not to share text opt-ins, and says no profiling is used [capture: /privacy-policy/]. The cookie center offers a "Share or sale" opt-out and honors Global Privacy Control; Facebook, Google Ads, Heap and HubSpot scripts were detected across the capture [capture].
- **Conflicts.** Marketing cookies "identify your interests" for outside ads, yet the policy says "We do not monitor or profile visitors", perhaps meaning sensitive data only [capture: /editorial-guidelines/, /privacy-policy/]. The policy also takes others' data on the submitter's "authority" and calls the tool an "Instant Estimate" [capture: /privacy-policy/].

## SEO and content
- **Traffic.** The top 25 pages hold 42.3% of visits. Cost and incentive pages plus the calculator take 33,520 (14% of the site), and 14 informational pages 46,116 (19.3%) [semrush: top_pages_more]. No backlink data was pulled [semrush].
- **Geo.** /local-data/solar-panel-cost/va/ is #6 (4,305 visits, 55 keywords), the only state cost page in the top 25; none was captured [semrush; capture].
- **IA.** A product-led menu and a /local-data/ geo namespace; whether the cost page's state section links to state pages was not recorded [capture; semrush].
- **Best-of and profiles.** The ranking is not in the top 25, one supplier profile is (1,899), and family totals were not pulled [semrush].
- **Templates.** All three articles (2,618 to 3,320 words) carry writer, editor, "Updated" date, table of contents, question H2s, related links, BreadcrumbList and two ZIP boxes; bylines show no credentials [capture]. Years sit in titles; URLs stay evergreen [capture].
- **Tool page.** The calculator has no H1, no JSON-LD and 86 words, yet is the #3 traffic page (1,160 keywords) [capture; semrush].
- **Numbers.** The cost page's meta says "about $30,500" and "$37,000 to $154,000"; its body says $31,135 and $41,000 to $155,000 [capture: /local-data/solar-panel-cost/]. The About meta is just "About us" [capture].
- **Markup.** Only WebSite, WebPage, Article and BreadcrumbList were recorded, with no FAQPage or AggregateRating; nested objects were not inspected [capture].

## Design and UX
- The mobile first screen runs menu, logo, image, H1, value line, ZIP field, "Get started" and Privacy Policy link [capture: /].
- Each captured article has two "See solar prices" ZIP boxes; one adds a three-item reassurance line [capture].
- The calculator uses a focused shell with no menu, a loading checklist of factors, and an accessiBe overlay [capture: /solar/calculator/].
- A financing example turns a $200 bill into a 25-year cost "accounting for inflation", naming no rate [capture: /solar/how-to-pay-for-solar/].

## What AMC should adopt or adapt
- **"Free" beside the pay model** [capture: /]. Better: every component that says free also says movers pay for the requests they buy, from one counsel-approved role statement. Serves consent draft §1, §7; visual-direction §13.7.
- **A short start and single-topic screens** [capture: /; walk]. Better: from and to in the first mobile screen; questions and the coverage pre-check before contact, tracked by events; no personal data in URLs; no presets on matching, the sharing limit or consent. Serves lead-lifecycle §2 steps 1 to 5; site-architecture §9; consent draft §4, §5.
- **A focused calculator with a stated basis** [capture: /solar/calculator/]. Better: ungated, with an H1, named inputs and sources, a "data as of" date, a range that is not a quote, a method link and no "actual offers" claim; inputs carry into step 1. Serves value before contact; site-architecture §6.3; compliance facts §2.
- **Cost data as a product** [semrush; capture]. Better: ranges with source, sample size and dates, priced from member rate cards or cited data; meta, body and schema from one dataset; a "costs by state" module once state demand is measured. Serves site-architecture §3.2, §6.3, G4, §9.
- **Article template** [capture]. Better: question H2s, one-sentence definitions, a credentialed "Reviewed by" line on cost pages, and title years tied to data refreshes. Serves site-architecture §3.3, §4.3, §7.2, §7.4.
- **Ranking criteria** [capture]. Better: disclose that listed movers may pay AMC and that payment does not change order, or rank no paying movers; never score on leads bought. Serves site-architecture §4.6; compliance facts §4.
- **Named owner and one facts record** [capture]. Better: name AMC's owner, disclose any tie to a mover, broker or lead buyer, link every logo to its item, and date every count. Serves site-architecture §7.1, §7.2; discovery brief §11 Q1.
- **Privacy controls** [capture]. Better: GPC, a share-or-sale opt-out, a text-opt-in non-sharing clause and named affiliates. Serves compliance facts §3, where 10DLC wording is still open.
- **Partner named at the hand-off** [capture: /]. Better: name any referral partner there and in consent; a car-shipping partner must first clear the movers-only rule. Serves consent draft §5; site-architecture §0; mvp-scope.
- **Contact preference** [v1 §2.9; search]. Better: capture it, send it with each lead, bind movers to it, and promise only "up to {N} movers". Serves consent draft §6, §11; compliance facts §3.
- **Embeddable partner tools** [capture: /partners/corporations/]. Better: a verify-a-mover or cost-range widget for realtors and HR teams, linking to canonical pages from a /partners/ path. Serves link earning (keyword-research §1); site-architecture §1.1.

## What AMC should avoid
- A vague "multiple"; state the maximum and ask 1 to N, nothing preselected (lead-lifecycle §2 step 7; consent draft §4) [capture: /].
- "Unbiased" or "neutral" claims, even in testimonials, while movers pay, and undefined "vetted" or "certified" (compliance facts §4; mover-verification §4, §7) [capture].
- Browse-to-consent. AMC's own consent draft §5 box also accepts the Terms, so split it (compliance facts §3) [capture].
- Price-promising buttons and "instant estimate" names (compliance facts §2) [capture].
- A blanket "no profiling" line, since AMC risk-scores leads (lead-lifecycle §4) [capture].
- Undated counters, relative dates, unsourced superlatives, government-approval hints and drifting meta figures (site-architecture §1.2, §6.3, §7.1) [capture].
- An automatic IP-based origin (site-architecture §2.5) [walk].
- Relying on a submitter's "authority" for someone else's phone; consent must come from the person called (compliance facts §3) [capture; inference].
- Accessibility overlays (visual-direction §14) [capture].
- All-positive, relative-dated testimonials (mover-verification §6) [capture].

## Gaps and open questions
- The contact step: consent wording, named installers, call and text language, arbitration.
- Whether a phone number is optional today; that evidence dates from 2018 to 2022.
- Installers per request, shopper control, and /market-process/.
- Whether the calculator shows an estimate before contact.
- Installer fees, terms and caps; how advisors are paid.
- Installer profiles, installer reviews and the "Verified Customer" label.
- Full Terms of Use; the basis for savings and superlative claims.
- Ownership facts (two pv magazine items differ); BBB and court records.
- Onboarding scripts, canonicals, internal links, backlinks and uncaptured templates.
- Every [search] item needs a live check before citing.

## Sources
- Evidence pack `docs/research/reference-review/captures/energysage.md` (method: `_provenance.md`); private raw pack `packs/energysage.md`, outside the repository.
- v1: `docs/research/reference-matrix.md` §2.9.
- Semrush (US, 2026-10-27, estimates): `docs/research/raw/semrush/top_pages_more_2026-10-27.csv`, `domain_rank_2026-10-27.json`.
- Pages: https://www.energysage.com/ and /about-us/, /partners/corporations/, /editorial-guidelines/, /privacy-policy/, /solar/calculator/, /solar/how-to-pay-for-solar/, /local-data/solar-panel-cost/, /solar/best-solar-panels-complete-ranking/, four /onboarding/start/ screens.
- Search, own pages: https://help.energysage.com/article/60-how-energysage-gets-paid, https://help.energysage.com/article/59-installer-partner-vetting, https://info.energysage.com/shopper-help/how-to-message-your-installers.
- Search, third party: https://www.solarpowerworldonline.com/2018/03/online-selling-growing-pains-solar-installers/, https://electrek.co/?p=370072, https://www.pv-magazine.com/2022/02/21/schneider-electric-purchases-controlling-stake-in-energysage/, https://pv-magazine-usa.com/2022/02/18/schneider-electric-purchases-controlling-stake-in-energysage/.
- AMC docs: `docs/business-rules/consent-and-disclosure-copy-draft.md` (consent draft), `lead-lifecycle-and-purchase-rules.md`, `mover-verification-and-reviews.md`; `docs/research/compliance-and-platform-facts.md`; `docs/research/keyword-research.md`; `docs/seo/site-architecture.md`; `docs/design/visual-direction.md`; `docs/product/mvp-scope.md`; `docs/00-discovery-brief.md`.
