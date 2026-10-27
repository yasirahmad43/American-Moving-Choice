# EnergySage (inspiration: solar marketplace): reference review

A solar and home-energy marketplace where homeowners compare installer quotes, listed as inspiration for marketplace clarity, not as a moving competitor [capture: /; v1 §2.9].

**Reviewed:** 2026-10-27. **Evidence:** captured 10 of 10 pages (9 unique); an automated walk of four onboarding screens, stopped before any contact step; Semrush US, October 2026; earlier search excerpts, many not rechecked; v1 §2.9. **Confidence:** medium, because the pages were fully captured but the contact step, the installer side and the payment model were not observed.

## At a glance
- "Free" and "unbiased" lead the copy, but no captured excerpt says who pays [capture: /, /solar/how-to-pay-for-solar/].
- One ZIP field, then one question per screen; after four screens no contact details had been requested [walk].
- Of about 238,617 estimated monthly visits, the cost page (#1, 18,689) and the calculator (#3, 8,780) lead the money-adjacent share [semrush: top_pages_more, domain_rank].
- A dated editorial policy with an AI-use section, named writers and editors, and published ranking criteria [capture: /editorial-guidelines/, articles].
- Customer counts, founding year and cost figures drift across pages and between meta and body [capture].
- Vetting words and superlatives are not defined or sourced on captured pages [capture].
- The privacy policy uses browse-to-consent wording [capture: /privacy-policy/].

## Consumer journey
| step | what it asks | what it shows before contact | evidence |
|---|---|---|---|
| 0. / | ZIP (prefilled 20147), "Get started" | Value line; "Your information is safe with us." | [walk; capture: /] |
| 1. PropertyType | Home, Business or Nonprofit; one option preselected | Nothing beyond the question recorded | [walk] |
| 2. OwnsProperty | Own or rent | Nothing recorded | [walk] |
| 3. ElectricityBill | Monthly bill (custom widget); advanced with no input | Nothing recorded | [walk; inference: preset or optional] |
| 4. EnergyInterest | Appliance plans (custom widget) | Did not advance; the walk stopped | [walk] |
| After | Not observed | Not observed; v1 reports about 3 quotes within a week, up to 7 | [v1 §2.9] |
| Side: /solar/calculator/ | Address, property type, monthly bill | Not run; whether an estimate precedes contact is unknown | [capture] |

- Each step has its own URL (`/onboarding/start/{Step}/?zip_code=20147&product=solar-pv`); robots and canonical tags were not recorded [walk].
- The ZIP field arrived filled with 20147 (Ashburn VA, where the capture sandbox runs), so the test ZIP was never typed; no screen asked to confirm the location [walk; inference: an IP-based lookup].
- The hero promises "multiple quotes" with no number, and no installer count appeared on screens 1 to 4 [capture: /; walk]. v1 says shoppers choose whether installers may phone them [v1 §2.9].
- Buttons promise prices ("See solar prices", "Check battery prices"), but the walked homepage entry showed only questions [capture: articles, /; walk].

## Mover side
No installer-facing page was captured, so fees, lead rules, exclusivity and caps are unknown [capture]. v1 says installers pay and consumers use it free [v1 §2.9]. A help-center excerpt says installers "pay a small fee to join our marketplace, but only after we vet them" [search: help.energysage.com, own page, not rechecked]. A help page and articles from 2018 and 2022 describe in-platform messaging, with the shopper's number shared only after they pick an installer [search: info.energysage.com, own; solarpowerworldonline.com, electrek.co, third party; not rechecked]. Corporate partners may "link to or embed" content, guides and calculators [capture: /partners/corporations/].

## Trust, verification and reviews
- **Advisor.** The homepage leads with "Choose with an expert" and "a free, unbiased Energy Advisor", but no captured page says how advisors are paid [capture: /]. That is more prominence than v1 recorded, though help stays optional ("as much help as you want") [capture: /about-us/; v1 §2.9].
- **Vetting.** "Pre-screened, certified installers" (/) and "vetted installers" (/about-us/) are not defined on captured pages, and no guarantee goes beyond "we have your back" [capture]. Published criteria are search-only [search: help.energysage.com, own page, not rechecked].
- **Claims.** The / meta says "over 50,000 homeowners" while H2s say 60,000, and /editorial-guidelines/ says "since our founding in 2009" while /about-us/ says "Twelve years ago" [capture; inference: about 2014]. "Most trusted", "largest" and "Save 20 to 30%" claims show no basis [capture: /, /about-us/, /partners/corporations/].
- **Backers.** Schneider Electric backing, DOE funding and the founder are named; whether logos link anywhere was not recorded [capture: /partners/corporations/, /, /about-us/]. The 2022 controlling-stake purchase is search-only [search: pv-magazine.com, third party, not rechecked].
- **Testimonials.** Nine reviews.io "Verified Customer" quotes review the platform, all positive; the five with dates read "1 year ago" [capture: /, /partners/corporations/]. One praises "a neutral, knowledgeable advisor" [capture: /]. The label is unexplained, and no negatives, replies or review markup were captured, nor the installer reviews that two quotes mention [capture].
- **Ranking.** The best-panels page publishes criteria and says EnergySage "is not paid to review brands or products", with an affiliate clause limited to "this article" [capture: /solar/best-solar-panels-complete-ranking/]. It is silent on installer payments, though "Popularity reflects how often installers quote this equipment", and whether equipment makers pay is unknown [capture; v1 §2.9; semrush].

## Disclosure and consent
- **Who pays.** "Unbiased advice · Completely free" (/solar/how-to-pay-for-solar/) sits with no pay statement, and the /about-us/ section "Good for shoppers. Good for installers." has no captured body [capture].
- **Partner.** "EnergySage partners with Qmerit to connect you with certified installers" sits just above "Check battery prices"; where the button leads was not captured [capture: /].
- **Consent.** The only contact or sharing text captured at entry points is "Your information is safe with us." [capture: /, /solar/calculator/]. The policy says "By visiting energysage.com … you are consenting to the practices described in this Privacy Policy" [capture: /privacy-policy/]. Screens 1 to 4 showed no checkbox or consent wording, and the contact step was not reached [walk]. No consent-certificate script was detected on captured pages [capture].
- **Sharing.** The policy shares with "corporate affiliates that are subject to this policy" and ad partners, promises not to share text opt-ins, and claims no profiling [capture: /privacy-policy/]. A cookie center offers a "Share or sale" opt-out and honors Global Privacy Control; Facebook and Google Ads scripts were detected across the capture [capture].
- **Conflicts.** Marketing cookies "identify your interests" for outside ads, yet the policy says "We do not monitor or profile visitors", perhaps meaning sensitive data only [capture: /editorial-guidelines/, /privacy-policy/]. It also accepts others' data on the submitter's "authority" and calls the tool an "Instant Estimate" [capture: /privacy-policy/].

## SEO and content
- **Traffic.** The top 25 pages hold 42.3% of visits; cost pages plus the calculator take 33,520 (14% of the site) and 14 informational pages 46,116 (19.3%) [semrush: top_pages_more]. No backlink data was pulled [semrush].
- **Geo.** /local-data/solar-panel-cost/va/ is #6 (4,305 visits, 55 keywords), the only state cost page in the top 25; none was captured [semrush; capture].
- **IA and best-of.** A product-led menu and a /local-data/ geo namespace [capture; semrush]. The ranking is not in the top 25, one supplier profile is (1,899), and family totals were not pulled [semrush].
- **Templates.** All three articles (2,618 to 3,320 words) carry writer, editor, "Updated" date, contents list, question H2s, related links and BreadcrumbList, without credentials; years sit in titles, not URLs [capture].
- **Tool page.** The calculator has no H1, no JSON-LD and 86 words, yet is the #3 page (1,160 keywords) [capture; semrush].
- **Numbers.** The cost page's meta says "about $30,500" and "$37,000 to $154,000", its body $31,135 and $41,000 to $155,000 [capture: /local-data/solar-panel-cost/]. The About meta is just "About us" [capture].
- **Markup.** Only WebSite, WebPage, Article and BreadcrumbList were recorded, with no FAQPage or AggregateRating; nested objects were not inspected [capture].

## Design and UX
- The mobile first screen holds the H1, value line, ZIP field, "Get started" and a Privacy Policy link [capture: /].
- Each captured article has two "See solar prices" ZIP boxes [capture].
- The calculator uses a focused shell with no menu, a loading checklist of factors and an accessiBe overlay [capture: /solar/calculator/].

## What AMC should adopt or adapt
- **"Free" beside the pay model** [capture: /]. Better: wherever AMC says free, the same component says movers pay for requests, in one counsel-approved statement. Serves consent draft §1, §7; visual-direction §13.7.
- **Short start, one question per screen** [capture: /; walk]. Better: from and to in the first mobile screen, a coverage pre-check before contact, step events instead of URLs, and no presets on matching, sharing limit or consent. Serves lead-lifecycle §2; site-architecture §9; consent draft §4, §5.
- **A calculator with a stated basis** [capture: /solar/calculator/]. Better: ungated, with an H1, named inputs and sources, a "data as of" date, a range that is not a quote and no "actual offers" claim; inputs carry into step 1. Serves value before contact; site-architecture §6.3; compliance facts §2.
- **Cost data as a product** [semrush; capture]. Better: dated ranges with source and sample, from member rate cards or cited data; one dataset for meta, body and schema; a credentialed "Reviewed by" line; a "costs by state" module once demand is measured. Serves site-architecture §3.2, §6.3, §7.2, G4.
- **Ranking criteria** [capture]. Better: disclose that movers may pay AMC without changing order, or rank no paying movers; never score on leads bought. Serves site-architecture §4.6; compliance facts §4.
- **Named owner and one facts record** [capture]. Better: name AMC's owner and any tie to a mover or lead buyer, link every logo to its item, and date every count. Serves site-architecture §7.1; discovery brief §11 Q1.
- **Privacy controls** [capture]. Better: GPC, a share-or-sale opt-out, a text-opt-in non-sharing clause and named affiliates. Serves compliance facts §3.
- **Partner named at the hand-off** [capture: /]. Better: name referral partners there and in consent; car shipping must first clear the movers-only rule. Serves consent draft §5; site-architecture §0; mvp-scope.
- **Contact preference** [v1 §2.9; search]. Better: capture it, send it with each lead, bind movers to it, and promise only "up to {N} movers". Serves consent draft §6, §11; compliance facts §3.
- **Partner embeds** [capture: /partners/corporations/]. Better: a verify-a-mover or cost widget for realtors and HR teams that links to canonical pages. Serves link earning (keyword-research §1); site-architecture §1.1.

## What AMC should avoid
- A vague "multiple"; state the maximum and ask 1 to N, nothing preselected (lead-lifecycle §2 step 7; consent draft §4) [capture: /].
- "Unbiased" or "neutral" claims, even in testimonials, while movers pay; undefined "vetted" or "certified" (compliance facts §4; mover-verification §4, §7) [capture].
- Browse-to-consent; AMC's own consent draft §5 box also accepts the Terms, so split it (compliance facts §3) [capture].
- Price-promising buttons and "instant estimate" names (compliance facts §2) [capture].
- A blanket "no profiling" line, since AMC risk-scores leads (lead-lifecycle §4) [capture].
- Undated counters, relative dates, unsourced superlatives, government-approval hints and drifting meta figures (site-architecture §1.2, §6.3, §7.1) [capture].
- Automatic IP-based origins (site-architecture §2.5) [walk].
- Consent for someone else's phone on a submitter's "authority" (compliance facts §3) [capture; inference].
- Accessibility overlays (visual-direction §14) [capture].
- All-positive, relative-dated testimonials (mover-verification §6) [capture].

## Gaps and open questions
- The contact step: consent wording, named installers, call and text language, arbitration.
- Whether a phone number is optional today (evidence from 2018 to 2022).
- Installers per request and shopper control; /market-process/.
- Whether the calculator shows an estimate before contact.
- Installer fees, terms and caps; advisor pay.
- Installer profiles and reviews; the "Verified Customer" label.
- Full Terms; the basis for savings and superlatives.
- Ownership (two pv magazine items differ); BBB and court records.
- Onboarding scripts, canonicals, internal links, backlinks, uncaptured templates.
- Every [search] item needs a live check before citing.

## Sources
- Evidence pack `docs/research/reference-review/captures/energysage.md` (method: `_provenance.md`); private raw pack `packs/energysage.md`, outside the repository.
- v1: `docs/research/reference-matrix.md` §2.9.
- Semrush (US, 2026-10-27, estimates): `docs/research/raw/semrush/top_pages_more_2026-10-27.csv`, `domain_rank_2026-10-27.json`.
- Pages: https://www.energysage.com/ and /about-us/, /partners/corporations/, /editorial-guidelines/, /privacy-policy/, /solar/calculator/, /solar/how-to-pay-for-solar/, /local-data/solar-panel-cost/, /solar/best-solar-panels-complete-ranking/, four /onboarding/start/ screens.
- Search, own pages: https://help.energysage.com/article/60-how-energysage-gets-paid, https://help.energysage.com/article/59-installer-partner-vetting, https://info.energysage.com/shopper-help/how-to-message-your-installers.
- Search, third party: https://www.solarpowerworldonline.com/2018/03/online-selling-growing-pains-solar-installers/, https://electrek.co/?p=370072, https://www.pv-magazine.com/2022/02/21/schneider-electric-purchases-controlling-stake-in-energysage/, https://pv-magazine-usa.com/2022/02/18/schneider-electric-purchases-controlling-stake-in-energysage/.
- AMC docs: `docs/business-rules/consent-and-disclosure-copy-draft.md` (consent draft), `lead-lifecycle-and-purchase-rules.md`, `mover-verification-and-reviews.md`; `docs/research/compliance-and-platform-facts.md`; `docs/research/keyword-research.md`; `docs/seo/site-architecture.md`; `docs/design/visual-direction.md`; `docs/product/mvp-scope.md`; `docs/00-discovery-brief.md`.
