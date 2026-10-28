# Reference matrix v2: moving marketplaces and lead-generation sites

This matrix maps what 11 reference sites do to the requirements of American Moving Choice (AMC): what to adopt, adapt or avoid in the quote flow, consent, trust features, SEO and design. The sites were reviewed on 2026-10-27. This version supersedes v1, the search-only matrix of the same date. v1 is kept in git at commit `871e813` (`git show 871e813:docs/research/reference-matrix.md`), and the site reviews' "v1 §2.x" citations point there. Section 8 records every correction and maps v1's section numbers to this version. The sites are references, not templates: never copy their wording, layouts or data.

- Review overview: [reference-review/README.md](reference-review/README.md)
- The 11 site reviews, the source for most rows here: [reference-review/sites/](reference-review/sites/)
- What the review means for AMC's content, SEO and design: [reference-review/implications-for-content-seo-design.md](reference-review/implications-for-content-seo-design.md)

## 1. Method and evidence

**Sources, in order of authority.**
1. The 11 site reviews in `reference-review/sites/`, the verified record, cited as [sites/movebuddha.md].
2. Evidence packs from a headless-browser capture on 2026-10-27 (`reference-review/captures/`; method in [_provenance.md](reference-review/captures/_provenance.md)). Public pages only, and no bot protection was bypassed. Walks used test ZIPs (30303 to 33101), entered no personal data and submitted nothing once a screen asked for contact details.
3. Semrush US data pulled 2026-10-27 (`raw/semrush/`, `../seo/raw/`, `../seo/keyword-to-page-map.csv`; [keyword-research.md](keyword-research.md) §1 and §2). These are estimates, not analytics.
4. Web searches for owners, complaints and regulators. Each site review lists the URLs and says which are the site's own pages.
5. v1, labeled [v1] where not re-confirmed.

**Labels.** [capture] seen in the capture; [walk] seen in a quote-flow walk; [semrush: file] a Semrush estimate, naming its file without the date (domain_rank is `raw/semrush/domain_rank_2026-10-27.json`); [search] a web-search result; [v1] only in v1, not re-confirmed; [inference] reasoning, not observation; [cross-site analysis] a synthesis across reviews with no single site source. In section 3 tables, the site name links to its review, the source for the row; some cells also draw on that site's evidence pack.

**Limits.** ConsumerAffairs and HomeGuide blocked the capture, and Moving.com loaded 6 of 13 pages. Only the CMR and MyGoodMovers walks reached a consent step. moveBuddha's partner form and HireAHelper's mover list reached an email field. No walk went past contact, so who calls, how many and how fast is unknown at every site. Screenshots were taken but not reviewed, so color, type and spacing were not assessed. "Not observed" means unknown, not absent.

**AMC positions** come from the business rules: [lead lifecycle](../business-rules/lead-lifecycle-and-purchase-rules.md), [mover verification](../business-rules/mover-verification-and-reviews.md), [shared pricing](../business-rules/shared-pricing-and-credits.md) and the [consent draft](../business-rules/consent-and-disclosure-copy-draft.md). They win wherever v1 disagreed. Other short names: compliance facts ([compliance-and-platform-facts.md](compliance-and-platform-facts.md)), site-architecture (`../seo/site-architecture.md`, revised after the review), visual-direction (`../design/visual-direction.md`) and mvp-scope (`../product/mvp-scope.md`). Legal points are questions for counsel, never conclusions.

## 2. Coverage and confidence

| site | what it is | capture | quote-flow walk | Semrush est. monthly organic visits (US, Oct 2026) [semrush: domain_rank; folders: top_pages_more] | review confidence | review file |
|---|---|---|---|---|---|---|
| ConsumerAffairs | Multi-industry review publisher with a paid partner program [search] | Blocked (HTTP 403) | None | 420,319 domain; /movers/ folder about 23.8k | Low | [consumeraffairs.md](reference-review/sites/consumeraffairs.md) |
| HomeGuide | Pay-per-lead directory for many home trades [search] | Blocked (Cloudflare) | None | 326,101 domain; measured moving URLs at least 1,239 | Low | [homeguide.md](reference-review/sites/homeguide.md) |
| EnergySage | Solar quote marketplace, inspiration only [capture] | 10 of 10 pages | Automated, 4 screens, stopped before contact | 238,617 | Medium | [energysage.md](reference-review/sites/energysage.md) |
| HireAHelper | Booking marketplace for hourly crews and local moves; takes payment [capture] | 13 of 14 | Automated, profile to mover list | 125,334 | Medium | [hireahelper.md](reference-review/sites/hireahelper.md) |
| Move.org | Clearlink's editorial review site; earns on clicks, calls and sponsored spots [capture; search] | 14 of 14 | No form found; Find-a-Mover tool not walked | 107,657 | Medium | [moveorg.md](reference-review/sites/moveorg.md) |
| Moving.com | Lead seller in the Realtor.com network [capture] | Partial, 6 of 13 | None | 64,797 | Low | [movingcom.md](reference-review/sites/movingcom.md) |
| moveBuddha | Research and review site that runs lead paths [capture; walk] | 14 of 14 | Guided: calculator, results, marketplace, one partner form | 38,335 | Medium | [movebuddha.md](reference-review/sites/movebuddha.md) |
| MyGoodMovers | Comparison and lead site; movers buy plans [capture] | 14 of 14 | Guided calculator walk to the contact step | 25,778 | Medium | [mygoodmovers.md](reference-review/sites/mygoodmovers.md) |
| Unpakt | Book-and-pay marketplace that holds the consumer's payment [capture] | 9 of 9 | Automated and guided; failed at first submit | 5,976 | Medium | [unpakt.md](reference-review/sites/unpakt.md) |
| Budget Van Lines | Self-declared household-goods broker [capture] | 6 of 6 | Automated; stopped at /999moving | 1,934 | Medium | [budgetvanlines.md](reference-review/sites/budgetvanlines.md) |
| Consumer Moving Reviews (CMR) | Editorial ranking site with a quote form [capture] | 10 of 10 | Guided to the contact step (screen 2 of 2) | 191 | Medium | [consumermovingreviews.md](reference-review/sites/consumermovingreviews.md) |

- Medium means pages were captured but contact, consent and after-submit steps were mostly unseen. Low means no page was captured (ConsumerAffairs, HomeGuide), or the homepage, legal pages and the contact and consent steps were not observed (Moving.com).

## 3. Cross-site comparison

### 3.1 Role and money disclosure

| site | role it states | who pays it, and where that is said | ties and conflicts |
|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | Review publisher [search] | Partners pay to join; also clicks, forms and calls. Guides and FAQ disagree on whether pay affects order [search] | Best-of and award pages reward the same firms [search] |
| [HomeGuide](reference-review/sites/homeguide.md) | A booking platform, per its Terms [search] | Pros pay per lead; found only on pro and help pages in search [search] | Out-of-budget pros drop from results [search] |
| [EnergySage](reference-review/sites/energysage.md) | Solar marketplace, sold as "free" and "unbiased" (/) [capture] | Unstated on captured pages; installers pay a fee, per a help article [capture; search] | Backer named [capture] |
| [HireAHelper](reference-review/sites/hireahelper.md) | Booking marketplace (/services/) [capture] | Consumers pay it at checkout; no money line in the flow [capture; walk] | Porch Group link; brands listed as "PARTNERS" (footer) [capture] |
| [Move.org](reference-review/sites/moveorg.md) | Editorial review site [capture] | Clicks, calls, sponsored "Preferred Partner" spots (/disclosure/); a closable top strip; no mention of leads in captured text [capture] | Its partner page lists rankings and awards under "Editorial opportunities" (/partnership/); whether partners can influence rankings is not shown [capture] |
| [Moving.com](reference-review/sites/movingcom.md) | Not observed [capture] | On the six captured pages, only /leads/ says movers buy leads [capture] | Realtor.com network [capture] |
| [moveBuddha](reference-review/sites/movebuddha.md) | "research and review platform" (/moving-cost-calculator/) [capture] | May be paid for clicks, webforms or calls; payer unnamed; the link heads every page [capture] | Same partner cards on every captured geo page [capture] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | "a comparison platform" (/long-distance-moving/) [capture] | Paid plans can change order; Terms only; no label seen [capture] | Operator named only in legal pages [capture] |
| [Unpakt](reference-review/sites/unpakt.md) | Unstated; "our movers" (/) [capture] | Consumer pays Unpakt, which pays the mover [capture] | Rates itself in markup [capture] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | Broker, on inner pages; none found on the home page [capture] | Unstated [capture] | Owner unknown [capture] |
| [CMR](reference-review/sites/consumermovingreviews.md) | "not a mover", below the form (/request-a-quote/) [capture] | "There are no paid placements on CMR." (/advertiser-disclosure/) [capture] | Two movers CMR calls "related companies" (the sentence is cut off) lead both captured lists [capture] |

- No observed flow said how the site itself is paid. Stated models sit on mover, legal or help pages, and publishers disclose clicks and calls, not the consumer's own request [cross-site analysis].
- Paid or tied companies sit inside rankings at CMR, moveBuddha and Move.org [sites/consumermovingreviews.md; sites/movebuddha.md; sites/moveorg.md].
- The one broker, Budget Van Lines, states its role on inner pages [sites/budgetvanlines.md]. Captured pages at moveBuddha, Moving.com and Move.org were not seen to say whether the site is a mover or broker. CMR and MyGoodMovers pair a not-a-mover line with booking or quote words [capture; walk; sites/consumermovingreviews.md; sites/mygoodmovers.md]. Whether that matters legally is a question for counsel (compliance facts §2). For AMC, the risk is that its own copy drifts, not that it hides its role [inference]. Use one role-and-money statement at every quote entry, in consent and on confirmation (consent draft §1, §7).

### 3.2 Quote flow, value before contact and company count

| site | steps before contact | value before contact | companies that get it | what happens next |
|---|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | ZIP, then a questionnaire [search] | Not observed | No number found [search] | Calls from it or the matched brand [v1; search] |
| [HomeGuide](reference-review/sites/homeguide.md) | About a dozen questions [search] | Not observed | Phone to up to five pros, per a 2023 article [search] | Pros call or message [search] |
| [EnergySage](reference-review/sites/energysage.md) | Prefilled ZIP, then one question per screen [walk] | None in four screens [walk] | "multiple quotes" (/), no number [capture] | Not observed |
| [HireAHelper](reference-review/sites/hireahelper.md) | Two screens from a profile [walk] | Mover names and a price sort; no price values recorded [walk] | One team the consumer picks [capture] | Books and pays in-platform [capture] |
| [Move.org](reference-review/sites/moveorg.md) | No form; tool not walked [capture] | Not observed | No number [capture] | Not observed |
| [Moving.com](reference-review/sites/movingcom.md) | One screen of move details [capture] | Undated "Recent Estimates" [capture] | "up to 4" (/movers/moving-cost-calculator.asp), no choice [capture] | Likely mover calls [inference] |
| [moveBuddha](reference-review/sites/movebuddha.md) | Calculator: one screen. Partner form: nine, then email [walk] | Price ranges; the results page disagrees [walk] | No number [walk] | A "relocation specialist" call (/moving-cost-calculator-tool/) [walk] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | Route; date and size; channel [walk] | Distance only [walk] | "Up to three" (/moving-cost-calculator), FAQ only [capture] | Not observed; the consent seen covers call, text and email [walk], though an FAQ says movers use the chosen channel [capture] |
| [Unpakt](reference-review/sites/unpakt.md) | One screen with presets; submit failed [walk] | None seen [walk] | Consumer books one mover (/how-it-works/); who receives contact details is not stated [capture; inference] | Unpakt holds payment [capture] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | Origin ZIP, then a widget the walker couldn't operate [walk] | "Starting as low as $1,250" (/) [capture] | "other moving companies" (/terms-of-use) [capture] | Agent-run, per /about-us; not observed [capture; walk] |
| [CMR](reference-review/sites/consumermovingreviews.md) | States, then contact on screen 2 [walk] | None [walk] | No number [walk] | "A specialist will call" (/request-a-quote/) [walk] |

- In the walks, only moveBuddha (ranges) and HireAHelper (names) gave move-specific value before contact. CMR and MyGoodMovers take contact details first [sites/movebuddha.md; sites/hireahelper.md; sites/consumermovingreviews.md; sites/mygoodmovers.md].
- No captured or walked flow asks how many companies the consumer wants. Three state a fixed number, and four let the consumer pick one company [cross-site analysis].
- Walks hit presets, custom widgets, a broken form and a site error [sites/unpakt.md; sites/energysage.md; sites/mygoodmovers.md]. AMC's count question has no outside benchmark, so usability tests must supply the evidence [inference].

### 3.3 Consent and data sharing

| site | consent seen | who it covers | notable terms and scripts |
|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | In sitewide Terms [search] | It or the matched brand [v1; search] | Automated calls, call recording; binding arbitration and a class-action bar [search] |
| [HomeGuide](reference-review/sites/homeguide.md) | Using the service, per its Terms [search] | "Liaison" and unnamed "Partners" (/terms-of-service) [search] | STOP and HELP, in the Terms [search] |
| [EnergySage](reference-review/sites/energysage.md) | Visiting the site, per its privacy policy [capture] | Contact step not reached [walk] | Honors Global Privacy Control; ad tags [capture] |
| [HireAHelper](reference-review/sites/hireahelper.md) | None before the mover list [walk] | The one team picked [capture] | ZIPs and dates in URLs; FullStory replay [walk; capture] |
| [Move.org](reference-review/sites/moveorg.md) | A test page only (/generic-form-test/) [search] | Clearlink "and partners" [search] | Do-Not-Call override [search]; the set's only consent certificate, TrustedForm [capture] |
| [Moving.com](reference-review/sites/movingcom.md) | Wording not captured; a script builds a disclaimer from the button text [capture; inference] | Requests go to up to 4 movers, unnamed [capture] | Replay tools; retargeting pixels [capture] |
| [moveBuddha](reference-review/sites/movebuddha.md) | Not reached [walk] | One mover named on its partner form [walk] | Form on a separate host [walk]; replay tools [capture] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | One unticked box that also accepts the Terms [walk] | "moving companies" (/moving-cost-calculator) [walk] | No automated-technology or not-a-condition wording [walk]; replay tools [capture] |
| [Unpakt](reference-review/sites/unpakt.md) | Not reached [walk] | Not observed | "its affiliates" count as "we" (/privacy/) [capture] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | Site use, per its privacy policy [capture] | "other moving companies" (/terms-of-use) [capture] | Privacy policy and Terms conflict on sharing; Hotjar [capture] |
| [CMR](reference-review/sites/consumermovingreviews.md) | A "By submitting" line; no box [walk] | "a vetted moving specialist" [walk] | "We never sell your info." (/request-a-quote/); Clarity [capture] |

- No observed consent names a mover. Only CMR's and MyGoodMovers' consent steps were seen [sites/consumermovingreviews.md; sites/mygoodmovers.md].
- At least 7 of 9 captured sites load replay-capable tools, and all 9 load ad tags. Whether they run on form steps is unknown [cross-site analysis].
- AMC's consent draft §5 bundles Terms acceptance into the box, as MyGoodMovers does; compliance facts §3 asks to separate them. Counsel should also test draft §3's no-sale sentence against state "sale" definitions [sites/mygoodmovers.md; sites/consumermovingreviews.md].

### 3.4 Verification, licensing and badges

| site | vetting claim | credentials shown | brokers | badges |
|---|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | Not observed for movers [search] | Not observed | Top pick labeled a broker and carrier hybrid [search] | Paid partner program; blue check unconfirmed [search; v1] |
| [HomeGuide](reference-review/sites/homeguide.md) | "Every pro on HomeGuide is reviewed" (/safety), unexplained [search] | None seen [search] | Not observed | Paid status of badges unstated [search] |
| [EnergySage](reference-review/sites/energysage.md) | "pre-screened, certified" (/), undefined [capture] | Not applicable | Not applicable | Unexplained "Verified Customer" label (/) [capture] |
| [HireAHelper](reference-review/sites/hireahelper.md) | Five points, including a review minimum (/how-it-works/) [capture] | No USDOT, MC or date [capture] | Not observed | The badge contains the review threshold [capture] |
| [Move.org](reference-review/sites/moveorg.md) | FMCSA "federal standing" check (/disclosure/) [capture] | MC, USDOT, "Hybrid" and GPS under one FMCSA credit [capture] | The list says none of its picks are brokers "reselling your job to a company you've never heard of" (/best-interstate-moving-companies/); its review of the #1 pick says "Allied is a broker and a carrier" (/allied-moving-reviews/) [capture] | Sponsored "Preferred Partner" spots [capture] |
| [Moving.com](reference-review/sites/movingcom.md) | "licensed and insured" (/movers/moving-cost-calculator.asp), no method [capture] | None [capture] | Not observed | Not observed |
| [moveBuddha](reference-review/sites/movebuddha.md) | Method weights cite FMCSA checks [capture] | USDOT on three picks; no date [capture] | No type on cards [capture] | Overlapping Certified and Verified programs [capture] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | "1200+ FMCSA Verified Movers" (/), disclaimed in its privacy policy [capture] | USDOT and "FMCSA Active" (/movers/al); no type or date [capture] | No type [capture] | "BEST LOCAL MOVER" on two reviews (/movers/al) [capture] |
| [Unpakt](reference-review/sites/unpakt.md) | "pre screened" (/partnership/), no method [capture] | None [capture] | Not stated | A price and service guarantee [capture] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | "insured and licensed by the FMCSA" (/pricing) [capture] | Own numbers, on /terms-of-use only [capture] | Is a broker [capture] | Review-vendor logo [capture] |
| [CMR](reference-review/sites/consumermovingreviews.md) | Five pillars; 3-to-6-month re-checks [capture] | Carrier label and USDOT in rows; one dated check per list [capture] | Says brokers are labeled; none seen in captured rows [capture] | A seal and a mark; says neither is paid [capture] |

- No captured page dates each credential (CMR says every fact is dated; one dated check per list was seen). No captured page showed a state credential, and at least seven sites say "licensed", "vetted" or "verified" with no method [cross-site analysis].
- Move.org's "no brokers" line and its review of the #1 pick are hard to reconcile, though the list adds that "'Carrier' doesn't always mean one crew start to finish" (/best-interstate-moving-companies/) [capture; sites/moveorg.md]. AMC's claim holds only while weekly checks find no broker authority on any listed company (mover verification §1, §3).
- "Preferred" already signals paid or affiliated status here: Move.org's sponsored spots and CMR's owner's name [sites/moveorg.md; sites/consumermovingreviews.md]. AMC's badge is a screening status every approved mover gets, not a paid one (mover verification §4). Say it cannot be bought, and have counsel clear the name.

### 3.5 Reviews and ratings

| site | source and proof | negatives and replies | consistency and markup |
|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | Own; confirms a person, not a move [search] | Not observed | Figures differ by page [search] |
| [HomeGuide](reference-review/sites/homeguide.md) | Own; pros ask their customers [search] | Not observed | Listings on 0 to 5 reviews [v1; search] |
| [EnergySage](reference-review/sites/energysage.md) | Testimonials about itself [capture] | All positive; dated "1 year ago" (/) [capture] | No rating markup [capture] |
| [HireAHelper](reference-review/sites/hireahelper.md) | Only after "a real, paid move" (/movers/) [capture] | Unedited, with mover replies [capture] | Markup matches the page; counts drift [capture] |
| [Move.org](reference-review/sites/moveorg.md) | Editorial ratings [capture] | Editorial cons only [capture] | Card and list disagree on Allied [capture] |
| [Moving.com](reference-review/sites/movingcom.md) | Pages blocked [capture] | Not observed | No rating markup seen [capture] |
| [moveBuddha](reference-review/sites/movebuddha.md) | Imported from "25+ sources" (/movers/) [capture] | Low scorers kept [capture] | Counts drift; blends in its own score [capture] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | Own plus "third-party sources" (/long-distance-moving/) [capture] | Negatives on the home page [capture] | One mover at 4.9 and 4.8 [capture] |
| [Unpakt](reference-review/sites/unpakt.md) | Unexplained [capture] | Not observed | Rates itself 4.2 from 36 [capture] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | None; a vendor logo [capture] | As indexed 2026-10-27: BBB grade A+, BBB reviews 1.68/5 (47), Trustpilot 1/5 (95) [search, third party] | No JSON-LD [capture] |
| [CMR](reference-review/sites/consumermovingreviews.md) | Feeds an editorial 1-to-10 score [capture] | 17 low scorers kept [capture] | No conflicting scores seen on the two captured lists [capture] |

- HireAHelper alone says every review comes from a paid move, which it can check because it takes payment. AMC's proof is its purchase record plus uploaded documents (mover verification §6) [sites/hireahelper.md].
- Ratings or counts drift at four of nine captured sites (v1 saw one). No captured review shows a full date; EnergySage's show only relative dates. Replies were seen only at HireAHelper [cross-site analysis].

### 3.6 SEO page families and traffic drivers

| site | main page families | top traffic driver [semrush: top_pages, top_pages_more; ranks: phrase_organic_top10] | markup and answer shapes |
|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | Best-of, fixed-count geo lists, cost guide, relocation pages [search; semrush: top_pages_more] | /movers/ about 23.8k; relocation, storage, address-change and how-to pages hold about 44% of the folder's estimated visits (about two-thirds of its top 25) [semrush: top_pages_more, computed] | A dated review window; quoted by an engine despite the block [search] |
| [HomeGuide](reference-review/sites/homeguide.md) | City × service grid, /costs/ guides [semrush: top_pages_more] | One city page, 464; the moving cost guide, 10 | Question titles with a year [search] |
| [EnergySage](reference-review/sites/energysage.md) | Cost pages, calculator, state cost pages [semrush: top_pages_more] | Cost page #1 (18,689); calculator #3 | Named writers; AI policy; no FAQPage [capture] |
| [HireAHelper](reference-review/sites/hireahelper.md) | City pages, profiles, service pillars [capture] | City pages: 24.6%, from 10 of the top 15 | City pages share 11 of 12 H2s [capture] |
| [Move.org](reference-review/sites/moveorg.md) | Best-of, brand reviews, adjacent services, reference [capture] | Best container companies, 12,002; mover hiring about 15% | Named authors and reviewers [capture] |
| [Moving.com](reference-review/sites/movingcom.md) | .asp tools, blog, best-of [capture] | Calculator, 29.97%; #1 for "moving cost calculator" | FAQPage on 3 of 6 pages [capture] |
| [moveBuddha](reference-review/sites/movebuddha.md) | Calculators, state and city long-distance pages, routes [capture] | Calculators, about 13.4% | Quick answers; templated headings [capture] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | Directory, state and state cost pages, guides [semrush: top_pages_more] | Where-to-move guide, 36.94%; /movers, 4,496 | FAQPage on 2 pages [capture] |
| [Unpakt](reference-review/sites/unpakt.md) | Home, city pages, profiles, blog host [semrush: top_pages_more] | Home 65.72%; NYC page 19.29% | Self-rating markup [capture] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | Six pages [capture] | Two home URLs, 99.68% | No JSON-LD [capture] |
| [CMR](reference-review/sites/consumermovingreviews.md) | Best-of lists, ZIP lanes, profiles [capture] | One profile, 84.81% of 191 | FAQPage on 4 of 10 pages [capture] |

- Tools and cost pages lead: calculators at Moving.com and moveBuddha; at EnergySage (solar), a cost page (#1) and the calculator (#3). City pages lead only at HireAHelper [sites/movingcom.md; sites/movebuddha.md; sites/energysage.md; sites/hireahelper.md].
- Captured geo templates repeat most headings, no captured site shows a coverage gate, and figures drift between title, meta, body and tools at eight sites. AMC's publishing gate (site-architecture §4.1) has no precedent here [cross-site analysis].
- FAQPage markup lingers at Moving.com, CMR and MyGoodMovers after FAQ rich results ended on 2026-05-07 (compliance facts §5) [sites/movingcom.md; sites/consumermovingreviews.md; sites/mygoodmovers.md].

### 3.7 Design patterns

| site | first phone screen | form and progress | confidence breakers |
|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | Blocked [capture] | ZIP with a time promise [search] | Two disclosure versions [search] |
| [HomeGuide](reference-review/sites/homeguide.md) | Blocked [capture] | Not observed | One-review ratings [v1; search] |
| [EnergySage](reference-review/sites/energysage.md) | H1, ZIP field, button [capture] | One question per screen [walk] | Price buttons lead to questions [capture; walk] |
| [HireAHelper](reference-review/sites/hireahelper.md) | Banner, phone and rating before the H1 [capture] | Two screens; optional email with a skip link [walk] | Phone number changes by page [capture] |
| [Move.org](reference-review/sites/moveorg.md) | Money strip, H1, one button [capture] | No form [capture] | Phones and offers on ranking cards [capture] |
| [Moving.com](reference-review/sites/movingcom.md) | H1, share links, form [capture] | A zero distance before input [capture] | Two unexplained buttons [capture] |
| [moveBuddha](reference-review/sites/movebuddha.md) | Disclosure link first [capture] | Live ranges; names missing fields [capture; walk] | Separate form host; a chat persona [walk] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | H1, two-field starter [capture] | Four numbered steps [walk] | Calculator estimate only after contact: "Your rough estimate appears after you submit the form" (/moving-cost-calculator) [capture; walk] |
| [Unpakt](reference-review/sites/unpakt.md) | App link before the H1 [capture] | Presets [walk] | Lost answers; forced sign-in [walk] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | H1, phone, ZIP field [capture] | Custom widget [walk] | Stray link text; empty alt text [capture] |
| [CMR](reference-review/sites/consumermovingreviews.md) | Form, no H1 [capture] | "Two quick questions" (/request-a-quote/), then five fields [walk] | A sideways-scrolling table [capture] |

- Looks effective: the form right after the H1, move details first, one question per screen, labeled ranges and credential rows. Likely to hurt trust: labels that promise what the next screen lacks, phone-first headers and unsourced counters [cross-site analysis; inference].
- AMC's planned hero button, "See available movers" (visual-direction §13.1), echoes HireAHelper's "See Movers" step [walk: /checkoutv2/moveitems/; sites/hireahelper.md]. Without the named preview, it also promises a list the next screen does not show [inference]. Reword it in AMC's own words, tied to the coverage result (§4), whether or not the named preview ships.

### 3.8 Mover side

| site | how providers join and pay | cap or exclusivity | checks, tools, refunds |
|---|---|---|---|
| [ConsumerAffairs](reference-review/sites/consumeraffairs.md) | Sales-led partner program; clicks, forms, calls [search] | Not observed | Conversion reports by API [search] |
| [HomeGuide](reference-review/sites/homeguide.md) | Free profile; exact-match leads auto-billed within a weekly budget, others on acceptance [search] | Phone to up to five pros; a "Direct Lead" (/pro) if picked [search] | A refund claim if the customer first says a clear no [search] |
| [EnergySage](reference-review/sites/energysage.md) | Joining fee, per a help article [search] | Not stated [capture] | Messaging, per older sources [search] |
| [HireAHelper](reference-review/sites/hireahelper.md) | Self-serve; fees not shown [capture] | One booked team [capture] | Provider software; monitoring claimed [capture] |
| [Move.org](reference-review/sites/moveorg.md) | Sales-led; clicks, calls, sponsored spots [capture] | Not observed | Promises "ready-to-book leads" (/partnership/) [capture] |
| [Moving.com](reference-review/sites/movingcom.md) | Self-serve campaigns with daily and monthly budgets; no prices [capture] | Up to 4 buyers [capture] | Third-party phone and email checks [capture] |
| [moveBuddha](reference-review/sites/movebuddha.md) | No mover page; payer unnamed [capture] | Not observed | Partner forms on another host [walk] |
| [MyGoodMovers](reference-review/sites/mygoodmovers.md) | Plans that can change order [capture] | Up to 3, FAQ only [capture] | Not observed |
| [Unpakt](reference-review/sites/unpakt.md) | Fees not on captured pages [capture] | Consumer books one mover (/how-it-works/); who receives contact details is not stated [capture; inference] | Movers set their unit cost [capture] |
| [Budget Van Lines](reference-review/sites/budgetvanlines.md) | Carrier "affiliate program" (/about-us) [capture] | No cap stated [capture] | Not observed |
| [CMR](reference-review/sites/consumermovingreviews.md) | No path; says no mover pays to be listed [capture] | Not observed | Spam-trap field [walk] |

- No captured provider page states a price, refund terms or an exclusive-lead product. Only HomeGuide's help pages, seen in search, describe a refund claim [cross-site analysis; sites/homeguide.md].
- Caps are fixed by the site (3, 4 or 5). None observed lets the consumer set the number or shows anything like AMC's shared-lead credits [cross-site analysis].
- AMC's edge is narrower than "capped leads": the consumer sets the cap, buyers are named at consent, every buyer is a carrier, and credits follow sharing [inference].

## 4. Reference-to-requirement matrix

| pattern | seen at | user need | how AMC should do it better | AMC requirement and document | data or functionality AMC needs |
|---|---|---|---|---|---|
| Ungated cost range | [moveBuddha](reference-review/sites/movebuddha.md) [walk]; [HireAHelper](reference-review/sites/hireahelper.md) [capture]; [Moving.com](reference-review/sites/movingcom.md): calculator with no contact fields, result not observed [capture; inference]; gated at [MyGoodMovers](reference-review/sites/mygoodmovers.md) [walk] | A price idea before giving a phone number | One versioned model; a labeled range, never a quote; identical in widget, results and survey | Value before contact; site-architecture §6.3; compliance facts §2 (counsel words it) | Method page, changelog, consistency test |
| Coverage result before contact | Names at [HireAHelper](reference-review/sites/hireahelper.md) [walk]; no live count observed [cross-site analysis] | Know who serves the move | Show the live count of eligible movers; optionally names, USDOT and check dates; never prices or a fixed maximum | Lead lifecycle §2 step 5; owner decides names or count | Pre-contact matcher call |
| Consumer-chosen count | Fixed at [Moving.com](reference-review/sites/movingcom.md) (4), [MyGoodMovers](reference-review/sites/mygoodmovers.md) (3) [capture], [HomeGuide](reference-review/sites/homeguide.md) (5) [search] | Control over who calls | 1 to the admin maximum, nothing preselected; numbers above live coverage disabled; repeated at consent and confirmation | Lead lifecycle §2 step 7; shared pricing §1; consent draft §4 | Live eligible count; stored limit |
| Pick one named company | [HireAHelper](reference-review/sites/hireahelper.md) [capture], [moveBuddha](reference-review/sites/movebuddha.md) [walk], [HomeGuide](reference-review/sites/homeguide.md) [search], [Unpakt](reference-review/sites/unpakt.md) books one mover [capture] | "I want this company" | Profile requests name that company first; offer an explicit "only this company" choice | Mover verification §5; lead lifecycle §3; owner and counsel | Single-mover consent variant |
| Channel choice | [MyGoodMovers](reference-review/sites/mygoodmovers.md) [walk]; [EnergySage](reference-review/sites/energysage.md) [v1; search] | Fewer unwanted calls | Consent text changes with the choice; buyers see it and are bound by it | Compliance facts §3; lead lifecycle §5, §6 | Channel scope in consent, preview and mover terms |
| Separate, unticked box | [MyGoodMovers](reference-review/sites/mygoodmovers.md) [walk] | Know what you agree to | Contact consent only; each mover named with USDOT and removable; no Terms or arbitration in the box | Consent draft §5; lead lifecycle §6 | Versioned text; movers shown and removed stored; a certificate as backup only |
| One role-and-money statement | [Move.org](reference-review/sites/moveorg.md), [moveBuddha](reference-review/sites/movebuddha.md) money links; [MyGoodMovers](reference-review/sites/mygoodmovers.md), [CMR](reference-review/sites/consumermovingreviews.md) role lines [capture] | Know who pays and what AMC is | One counsel-approved wording at step 1, inside the consent text and on confirmation; never closable | Consent draft §1, §7; site-architecture §7.1 | One stored text for page, meta, JSON-LD and consent |
| Dated credential rows | One dated check per list at [CMR](reference-review/sites/consumermovingreviews.md); undated at [MyGoodMovers](reference-review/sites/mygoodmovers.md), [Move.org](reference-review/sites/moveorg.md), [moveBuddha](reference-review/sites/movebuddha.md) [capture] | "Is this a real carrier?" | USDOT, MC, authority type, no broker authority, filings, an absolute check date and an FMCSA link; company claims kept apart | Mover verification §3, §5; visual-direction §9.5 | Weekly FMCSA recheck; a source per field |
| "No brokers" tied to records | Hard to reconcile on [Move.org](reference-review/sites/moveorg.md)'s own pages [capture] | Trust the movers-only promise | Show the claim only while no listed company has broker authority; settle van-line agents first | Mover verification §1; add a van-line agent decision to mover verification §9; consent draft §2 | Authority records; auto-hide |
| One explained badge | [CMR](reference-review/sites/consumermovingreviews.md) [capture]; [HomeGuide](reference-review/sites/homeguide.md) [search] | Know what a badge means | What it checks and doesn't, the date, and that it cannot be bought; no seals or tiers | Mover verification §4; consent draft §8 | Badge from checks only; trademark clearance |
| Published vetting method | [HireAHelper](reference-review/sites/hireahelper.md), [CMR](reference-review/sites/consumermovingreviews.md), [moveBuddha](reference-review/sites/movebuddha.md) [capture] | How companies are checked | Each check, its source and the weekly cadence | Mover verification §3, §7 | One versioned "how we verify" block |
| Teach mover checks | [moveBuddha](reference-review/sites/movebuddha.md), [Moving.com](reference-review/sites/movingcom.md), [CMR](reference-review/sites/consumermovingreviews.md) [capture] | Check a quoted mover | /verify-a-mover/ and /movers-vs-brokers/ from FMCSA sources; forecast traffic conservatively | Site-architecture §1.2; mover verification §7 | Timestamped FMCSA lookup |
| Evidence-based reviews | Only [HireAHelper](reference-review/sites/hireahelper.md) says its reviews come from paid moves [capture] | Trust the reviews | Evidence labels; AMC sends every invitation; full dates; replies; nothing imported | Mover verification §6 | Purchase record; document checks; token-only form |
| One rating record | Drift at [HireAHelper](reference-review/sites/hireahelper.md), [MyGoodMovers](reference-review/sites/mygoodmovers.md), [moveBuddha](reference-review/sites/movebuddha.md), [Move.org](reference-review/sites/moveorg.md) [capture] | Ratings that look real | One record per experience type for pages and JSON-LD | Mover verification §6; site-architecture §8.5 | Drift check; schema lint |
| No "best" on thin samples | Low scorers kept at [CMR](reference-review/sites/consumermovingreviews.md), [moveBuddha](reference-review/sites/movebuddha.md); "best" on two reviews at [MyGoodMovers](reference-review/sites/mygoodmovers.md) [capture] | Fair comparison | A count beside every rating; no rank below a minimum sample (5 proposed) | Mover verification §6; site-architecture §4.6 | Admin threshold |
| Answer-first geo and hub pages | [moveBuddha](reference-review/sites/movebuddha.md), [CMR](reference-review/sites/consumermovingreviews.md), [MyGoodMovers](reference-review/sites/mygoodmovers.md) [capture]; hubs rank at [Move.org](reference-review/sites/moveorg.md) [semrush: top_pages] | A quick local answer | Dated page facts (approved-mover count, a sourced cost) before national or quote modules | Site-architecture §1.2, §3.3, §7.4 | Facts registry; nightly counts |
| Sourced ranges | [moveBuddha](reference-review/sites/movebuddha.md) route page; [HireAHelper](reference-review/sites/hireahelper.md) calculator [capture] | Believable numbers | Assumptions, source, sample and date on every range; one record behind title, meta and body | Site-architecture §6.3 | Rate cards (5+ movers) or cited studies; lead data for non-price facts |
| State cost content | [MyGoodMovers](reference-review/sites/mygoodmovers.md), [EnergySage](reference-review/sites/energysage.md) state cost pages [semrush: top_pages_more] | Costs for my state | Require the state cost block once data exists | Site-architecture §4.1 G4 | State cost keyword pull |
| Named people, AI policy | Named people at [EnergySage](reference-review/sites/energysage.md), [Move.org](reference-review/sites/moveorg.md) and [moveBuddha](reference-review/sites/movebuddha.md); an AI policy at [EnergySage](reference-review/sites/energysage.md) and [Move.org](reference-review/sites/moveorg.md); team bylines at [CMR](reference-review/sites/consumermovingreviews.md) [capture] | Know who wrote it | Named author, separate reviewer, data owner; a written AI policy | Site-architecture §7.2 | Author pages; publish check |
| Crawlers let in | Captures blocked at [ConsumerAffairs](reference-review/sites/consumeraffairs.md), [HomeGuide](reference-review/sites/homeguide.md), [Moving.com](reference-review/sites/movingcom.md) [capture] | Findable in AI answers | Allowlist verified agents; challenge only the quote form | Site-architecture §7.6 | WAF rules; log checks |
| Form after the H1 | [EnergySage](reference-review/sites/energysage.md), [MyGoodMovers](reference-review/sites/mygoodmovers.md), [Moving.com](reference-review/sites/movingcom.md) [capture]; broken at [MyGoodMovers](reference-review/sites/mygoodmovers.md), [Unpakt](reference-review/sites/unpakt.md) [walk] | Start fast, lose nothing | From and to on the first phone screen; native inputs; nothing prefilled | Lead lifecycle §2; visual-direction §13.7 | Daily synthetic walk of every entry point |
| Mover rules in public | [Moving.com](reference-review/sites/movingcom.md) [capture]; [HomeGuide](reference-review/sites/homeguide.md) [search] | (Movers) predictable cost | Price basis, cap, credits with a worked example, claim reasons | Shared pricing §1 to §6, §9 | One configuration for all pages |
| Spend controls | [Moving.com](reference-review/sites/movingcom.md) [capture]; [HomeGuide](reference-review/sites/homeguide.md) [search] | (Movers) control spend | Company caps at reservation; no platform pacing | Lead lifecycle §7; mvp-scope §3 | Caps in the purchase check |
| Lead checks shown | [Moving.com](reference-review/sites/movingcom.md) [capture] | (Movers) trust lead quality | Pass flags in the preview; no unmeasured outcome claims | Lead lifecycle §4, §5 | Preview fields |
| One family, one slot | Related brands at [Move.org](reference-review/sites/moveorg.md), [CMR](reference-review/sites/consumermovingreviews.md) [capture] | Choosing 2 means two firms | One purchase per company family per lead; ties disclosed | Shared pricing §1; mover verification §2, §3 | Family links; related-party check |

## 5. Patterns to avoid

1. **Contact before value.** CMR asks for contact details on screen 2 [walk]. MyGoodMovers' FAQ says the estimate appears after submit [capture: /moving-cost-calculator]; the walk saw none before contact [walk]. v1 pinned this on Budget Van Lines, which is unconfirmed [sites/consumermovingreviews.md; sites/mygoodmovers.md].
2. **Consent by submitting, browsing or Terms.** CMR's "By submitting" line (/request-a-quote/) [walk], Moving.com's script-built disclaimer, whose wording was not captured [capture; inference], site-use consent at Budget Van Lines and EnergySage [capture], and Terms consent at ConsumerAffairs and HomeGuide [search]. Whether these meet written-consent rules is for counsel (compliance facts §3) [sites/movingcom.md; sites/energysage.md].
3. **Unnamed recipients and hidden counts.** "partners" at Move.org (/generic-form-test/) and HomeGuide (/terms-of-service) [search], "moving companies" at MyGoodMovers (/moving-cost-calculator) [walk], "a vetted moving specialist" at CMR (/request-a-quote/) [walk]. MyGoodMovers' limit sits only in an FAQ [capture] [sites/moveorg.md; sites/homeguide.md].
4. **Money told only to payers, or told two ways.** Moving.com's captured consumer pages never say movers pay [capture]. ConsumerAffairs' guides and FAQ disagree [search], as do CMR's disclosure meta and body [capture] [sites/movingcom.md; sites/consumeraffairs.md].
5. **Paid or tied companies in rankings.** Two movers CMR calls "related companies" lead its lists, and moveBuddha's partner cards recur [capture]. Move.org's partner page lists rankings and awards under "Editorial opportunities" (/partnership/); whether partners can influence rankings is not shown [capture]. Whether lead fees must be disclosed beside ratings is for counsel (compliance facts §4) [sites/consumermovingreviews.md; sites/movebuddha.md; sites/moveorg.md].
6. **Booking, payment and broker-like words.** Unpakt holds payment, HireAHelper runs a checkout and moveBuddha adds coverage on bookings [capture]. CMR must speak to the consumer "to give an accurate quote" (/request-a-quote/) [walk]. FMCSA's 2023 guidance weighs money handling and involvement (compliance facts §2). This is a risk pattern, not a finding about any site. The review recommends removing the "Booking deposits and payments" add-on from mvp-scope §5, because AMC does not take deposits or book moves (discovery brief §1; consent draft §1). Any reintroduction needs owner and counsel sign-off (compliance facts §2). This is a recommendation that awaits the owner's decision (implications D5) [sites/unpakt.md; sites/hireahelper.md].
7. **Phone paths around the flow.** Specialist calls at CMR and moveBuddha [walk]; phone numbers on ranking cards at Move.org and moveBuddha [capture]. A direct call skips the count and named consent [inference].
8. **Vetting words without backing.** MyGoodMovers' verified-movers claim is disclaimed in its privacy policy [capture]. Moving.com, Budget Van Lines and Unpakt give no method [capture] [sites/mygoodmovers.md; sites/budgetvanlines.md].
9. **"No brokers" claims that need qualifying.** Move.org's list says none of its picks are brokers "reselling your job to a company you've never heard of" (/best-interstate-moving-companies/). Its review of the #1 pick says "Allied is a broker and a carrier" (/allied-moving-reviews/) [capture]. The two are hard to reconcile [sites/moveorg.md].
10. **Drifting figures and unearned dates.** One move priced two ways (moveBuddha) [walk]; two averages for one distance (Moving.com) [capture]; update stamps that match the capture day (moveBuddha, MyGoodMovers) and relative dates (Move.org) [capture] [sites/movebuddha.md; sites/movingcom.md].
11. **Status mixed with sentiment.** HireAHelper's badge needs a review minimum [capture]. HomeGuide's "Best of" badge (/safety) rests on positive reviews, and pros are coached to ask their own customers [search]; together that rewards asking only happy ones [inference]. Open review links (CMR, MyGoodMovers), imported reviews (moveBuddha) and self-rating (Unpakt) [capture] [sites/hireahelper.md; sites/homeguide.md; sites/unpakt.md].
12. **Presets.** Size and date at Unpakt, an untyped date at HireAHelper, a location ZIP at EnergySage [walk] [sites/unpakt.md; sites/energysage.md].
13. **Thin permutation pages and padded lists.** CMR's ZIP lanes earn 1 to 3 visits, and most HomeGuide city × service pages 36 or fewer [semrush: top_pages_more]. HireAHelper counts out-of-area movers, and moveBuddha lists PODS among movers [capture] [sites/consumermovingreviews.md; sites/homeguide.md]. For AMC, pages like these would raise doorway risk under its own rules (site-architecture §3.3, §4) [inference].
14. **Tracking on forms.** Replay-capable tools at seven of nine sites [cross-site analysis]; ZIPs and dates in HireAHelper's URLs [walk]; moveBuddha's form on another host [walk]. Wiretap exposure is a question for counsel [sites/movebuddha.md].
15. **Absolute or unsourced claims.** CMR's no-sale promise and Unpakt's no-calls promise [capture]. "Up to 50%" (Budget Van Lines, /how-it-works), "45% … on average" (Unpakt, /) and "up to 30%" (moveBuddha, /moving-cost-calculator-tool/) savings claims carry no method [capture; walk] [sites/budgetvanlines.md; sites/unpakt.md; sites/movebuddha.md].
16. **Crawler blocks.** ConsumerAffairs, HomeGuide and Moving.com blocked the capture [capture]. Engines may then cite them through third parties [inference] [sites/movingcom.md].

## 6. URL patterns observed

| site | state | city | route | profile | cost or calculator | notes |
|---|---|---|---|---|---|---|
| ConsumerAffairs | `/movers/{state-name}/` [search] | `/movers/{state-name}/{city}/`; flat `/movers/{city}.html` [search] | None observed | `/movers/{slug}.html`, also `.htm` and `/homeowners/` [semrush: top_pages_more; search] | `/movers/how-much-do-movers-cost.html` [semrush: top_pages_more] | Mixed extensions; `?page=` pagination [search] |
| HomeGuide | None observed [semrush: top_pages_more] | `/{st}/{city}/{service}/` [semrush: top_pages_more] | None observed | `/{st}/{city}/{service}/{slug}` [semrush: top_pages_more] | `/costs/{topic}` [semrush: top_pages_more] | Root hubs such as `/moving-companies` [semrush: top_pages_more] |
| EnergySage | `/local-data/solar-panel-cost/{st}/` [semrush: top_pages_more] | Lists on state pages [v1] | Not applicable | Not applicable | `/solar/calculator/` [capture] | ZIP in onboarding step URLs [walk] |
| HireAHelper | `/{state-name}-moving-companies/` [v1] | `/movers/{city}_{st}/` [capture] | None in top 15 [semrush: top_pages] | `/movers/{city}_{st}/{slug}/` [capture] | `/moving-cost-calculator/` [capture] | Underscores; ZIPs in checkout URLs [walk] |
| Move.org | `/movers/{state-name}/` [v1] | `/movers/{state-name}/{city}/` [capture] | None observed | `/{brand}-moving-reviews/` [capture]; `/quote-{brand}/` [v1] | `/moving-costs/`, no calculator fields [capture] | Find-a-Mover at `/moving-options-lp/` [v1] |
| Moving.com | Not observed | Not observed | Not observed | Brand reviews in `.asp` [capture] | `/movers/moving-cost-calculator.asp` [capture] | Copy on realtor.moving.com [semrush: top_pages] |
| moveBuddha | `/movers/{st}/` [capture] | `/movers/{st}/{city}/long-distance/` [capture]; `/movers/{st}/{city}/` [v1] | `/popular-routes/{st}/{st}/` [capture]; city pairs [v1] | `/movers/{st}/{slug}-{id}/` [v1] | `/moving-cost-calculator/` [walk]; city variants [v1] | Tools under `/blog/` [semrush: top_pages] |
| MyGoodMovers | `/movers/{st}` [capture] | `/movers/{st}/{city}` [v1] | Hub only [capture] | `/movers/{slug}`, beside states [semrush: top_pages_more] | `/moving-cost/{state-name}` [semrush: top_pages_more] | No trailing slash; quote host [capture] |
| Unpakt | None observed | `/moving-companies/{ST}/{city}/` [semrush: top_pages_more] | None observed | `/movers/{company}-{city}-{st}/` [semrush: top_pages_more] | Blog posts only [capture] | Uppercase states; blog host [semrush: top_pages_more] |
| Budget Van Lines | None | None | None | None | `/pricing`; `/999moving` [capture; walk] | Mixed case; http and https both rank [semrush: top_pages_more] |
| CMR | Route hub `/routes/state/{st}/` [capture] | Not observed | `/routes/movers-from-{city}-{st}-{zip}-to-{city}-{st}-{zip}/` [semrush: top_pages_more] | `/companies/{slug}/` [semrush: top_pages_more] | `/moving-cost-calculator/` [v1] | Best-of at `/best-{topic}/` [capture] |

- AMC's patterns are in site-architecture §2.1 (confirmed by the review): full state names, profiles under `/companies/` and directional state routes under `/moving-routes/`. They replace v1's suggested patterns. visual-direction §13.4 still shows `/routes/{origin}-to-{destination}/` and should be aligned.

## 7. Traffic and what it implies

All figures are Semrush US estimates for October 2026, from the files named in each label: models, not analytics. Saved page data covers 15 to 25 top pages per domain. There are no keyword lists, only 14 SERP snapshots, and backlinks for four domains.

- **Size moving demand by folder.** ConsumerAffairs' /movers/ folder is about 23.8k of 420,319 visits, and HomeGuide's measured moving URLs at least 1,239 of 326,101 [semrush: domain_rank, top_pages_more; sites/consumeraffairs.md; sites/homeguide.md]. Benchmark against HireAHelper (125,334), Move.org (107,657), Moving.com (64,797) and moveBuddha (38,335) [semrush: domain_rank].
- **Much leading traffic is not mover hiring.** Of Move.org's total estimated visits, the 15 kept rows (70.6%) split into mover hiring about 15%, adjacent services 21% and reference 34% [semrush: top_pages, computed; sites/moveorg.md]. MyGoodMovers' top page is a where-to-move guide [semrush: top_pages_more; sites/mygoodmovers.md].
- **Tools lead.** Moving.com's calculator holds 29.97% of visits and ranks #1 for "moving cost calculator" (5,400 a month, KD 49); moveBuddha's calculators hold about 13.4% [semrush: top_pages, phrase_these, phrase_organic_top10; sites/movingcom.md; sites/movebuddha.md].
- **City pages lead only at HireAHelper** (10 of its top 15, 24.6%). With 57% of its traffic outside the top 15, keyword-research §1's claim that city pages drive most traffic cannot be shown [semrush: top_pages; sites/hireahelper.md].
- **The authority gap is wide.** Leaders hold Authority Score 44 to 48 and 9k to 20k referring domains [semrush: backlinks_overview], so head terms (KD 62 to 63) are long-horizon goals (keyword-research §1).
- **Where a new domain can start:** directional state routes ("moving from new york to florida", 480 a month, KD 10, with forums in the top 10), several state and city long-distance terms (KD 15 to 25; New York and Los Angeles near 40), the trust cluster ("movers vs brokers", KD 6) and B2B ("buy moving leads", KD 18), where Moving.com's thin page ranks #9 [semrush: phrase_these, keyword-to-page-map.csv and SERP files; sites/movingcom.md]. Profiles may catch brand searches: one CMR profile brings 84.81% of the site's visits from two keywords, probably the company's name (keywords not pulled) [semrush: top_pages_more; inference].
- **Value per visit** (traffic cost ÷ visits) is highest at Unpakt ($22.94), then HireAHelper ($10.45) and Budget Van Lines ($10.00). Then come moveBuddha ($7.87), HomeGuide ($7.64), MyGoodMovers ($7.40), Moving.com ($6.24), Move.org ($5.60), ConsumerAffairs ($4.76), EnergySage ($3.39) and CMR ($0.98) [semrush: domain_rank, computed]. That signals commercial terms, not working pages [inference].
- **Fix keyword-research.** §2 calls small metros "achievable", but HireAHelper's Tallahassee, Beckley and Oshkosh pages draw about 140 to 160 visits per keyword, so check their queries first [semrush: top_pages]. §2 also calls HireAHelper's /services/moving-companies/ a best-of guide; it is a service pillar [sites/hireahelper.md]. §2 says competitors under-invest in state pages, yet MyGoodMovers' eight state pages, led by state cost pages, hold 8.8% of its visits [semrush: top_pages_more; sites/mygoodmovers.md]. §5 says ConsumerAffairs' and HomeGuide's moving pages were not pulled, but `top_pages_more` holds them [sites/consumeraffairs.md; sites/homeguide.md].

## 8. What changed since v1

v1 is at commit `871e813`. The last two rows map its section numbers to this version.

| v1 claim | what the direct evidence shows | source |
|---|---|---|
| No traffic data (§1, §6) | Semrush estimates for all 11 sites | [semrush: domain_rank] |
| No page seen as rendered (§1) | Nine sites captured, two blocked; walks at eight | [_provenance.md](reference-review/captures/_provenance.md) |
| Consent seen only at Move.org and ConsumerAffairs (§1) | Consent steps seen at CMR and MyGoodMovers; site-use consent in Budget Van Lines' and EnergySage's privacy policies; at Moving.com, only a script that builds a disclaimer (wording not captured) [capture; inference] | [sites/consumermovingreviews.md; sites/mygoodmovers.md; sites/movingcom.md] |
| CMR "may earn a referral fee" (§2.1) | "There are no paid placements on CMR." (/advertiser-disclosure/); the conflict is ownership | [sites/consumermovingreviews.md] |
| CMR offers "up to 4 quotes" (§2.1) | Not re-seen: the call to action was on profiles, which were not captured. The walked quote form gives no count, takes contact on screen 2 and says a specialist calls | [sites/consumermovingreviews.md] |
| CMR score and markup conflicts; an implausible 10.0 (§2.1, §4) | Not re-seen; the only 10.0 seen is one of the two companies CMR calls related; drift found at four other sites | [sites/consumermovingreviews.md] |
| CMR's named broker labels and "Authority not verified" flag (§2.1) | Not re-seen; captured rows show carriers under a dated check | [sites/consumermovingreviews.md] |
| moveBuddha: no mover pays for ranking (§2.2) | Not re-confirmed; ties "may influence" placement (/advertising-disclosure/) | [sites/movebuddha.md] |
| moveBuddha's calculator and price-in-title as models (§2.2, §3) | Ranges confirmed, but one move priced two ways, and a route's title and meta disagree | [sites/movebuddha.md] |
| moveBuddha: "1,500+" monthly data points; "save 30%+" (§2.2, §4) | The route range cites 847 quotes over 90 days; the line is "Save up to 30%" (/moving-cost-calculator-tool/) | [sites/movebuddha.md] |
| Budget Van Lines' role sits in footer and legal pages (§2.3, §4) | On inner pages, above the fold on /how-it-works; not found on the home page, which the capture did not scroll (the home page gets about 99.7% of visits) | [sites/budgetvanlines.md] |
| Budget Van Lines is paid by movers; its privacy policy allows sharing (§2.3) | Payment unstated; sharing is in the Terms, and the privacy policy says mobile data isn't shared | [sites/budgetvanlines.md] |
| Budget Van Lines takes contact before any price (§2.3, §4) | Unconfirmed; the walk stopped at /999moving | [sites/budgetvanlines.md] |
| Budget Van Lines' carrier list and paid landing pages (§2.3) | Not captured: unconfirmed, not refuted | [sites/budgetvanlines.md] |
| HireAHelper shows prices before contact (§2.4) | Names and a price sort; no price values recorded | [sites/hireahelper.md] |
| HireAHelper charges the card a day early (§2.4) | "pay only when the job is done" (/how-it-works/); an open conflict | [sites/hireahelper.md] |
| HireAHelper checks state licenses (§2.4) | Not re-confirmed: the captured points include an insurance certificate but no license check; two points and the License & Insurance page were not captured | [sites/hireahelper.md] |
| HireAHelper: 7 Dalton movers, 2015 reviews, a state hub (§2.4, §5) | 20 movers; review dates not recorded; hub not captured | [sites/hireahelper.md] |
| HireAHelper's job counts as a profile model (§3) | They need booking and payment, which AMC rules out (consent draft §1; compliance facts §2). Mover verification §5 also bars move counts without evidence | [sites/hireahelper.md] |
| Moving.com unobservable; "up to six" movers (§2.5) | Partial capture; "up to 4" (/leads/); the calculator holds 29.97% of visits | [sites/movingcom.md] |
| HomeGuide's cost guides are "the strongest pattern"; pros pay only for leads they want (§2.6) | The moving cost guide earns about 10 visits a month; exact matches are billed automatically | [sites/homeguide.md] |
| Unpakt geo pages not observed (§2.7, §5) | City pages and profiles exist; the NYC page holds 19.29% | [sites/unpakt.md] |
| Unpakt disclaims the transaction; checks licenses; 18 quotes in 7 minutes; 45% from a 2015 study (§2.7) | Agreement not captured; holding the payment sits uneasily with that wording. Movers are "pre screened" (/partnership/) and "licensed" (/faq/), with no method given. The walk failed; the study is unconfirmed | [sites/unpakt.md] |
| MyGoodMovers: flow unknown; no role line (§2.8) | A role line above the fold; its FAQ says the estimate comes after submit; the named page is broken | [sites/mygoodmovers.md] |
| EnergySage: installers pay; phone optional; about 3 quotes (§2.9) | Not on captured pages or in the walk; an advisor leads the H1 | [sites/energysage.md] |
| ConsumerAffairs' blue check for paid partners (§2.10, §3) | Not re-confirmed; don't cite it | [sites/consumeraffairs.md] |
| Move.org's consent names the companies, a "one-to-one" model (§2.11, §3) | Brand-page consent not re-confirmed; the test page (/generic-form-test/) covers Clearlink "and partners", with a Do-Not-Call override [search]. The FCC one-to-one rule was vacated; AMC names movers as policy | [sites/moveorg.md]; compliance facts summary |
| Move.org: mystery shopping, quote pages, a HireAHelper tie; city pages not observed (§2.11, §5) | First three not re-confirmed; a city page captured; sponsored "Preferred Partner" spots found (/disclosure/) | [sites/moveorg.md] |
| Several references never say how many companies will call (§4) | True of most, but three state a fixed number, and none observed lets the consumer choose | [sites/movingcom.md; sites/mygoodmovers.md; sites/homeguide.md] |
| AMC's Preferred badge is paid (§3, §4) | A screening status for every approved mover; any paid slot is labeled "Sponsored", and none is recommended at launch | Mover verification §4, §9; consent draft §8 |
| Price ranges from AMC lead data (§3) | Rate cards (5+ movers) or cited studies; lead data for non-price facts only | Site-architecture §6.3 |
| Suggested AMC URL patterns (§5) | Replaced | Site-architecture §2.1 |
| v1 section numbers, cited across the docs | v1's §2.x became the 11 site reviews; its §3 is now §4, §4 is now §5, §5 is now §6 and §6 is now §7 | `git show 871e813:docs/research/reference-matrix.md` |
| Pointers to repoint: JTBD §1 ("reference matrix §4, patterns 1, 4, 11"), JTBD §3.1 ("pattern 7"), the Moving.com and Unpakt reviews ("reference-matrix §4 item 7") and the Unpakt, Moving.com and CMR reviews ("reference-matrix §3") | v1 patterns 4 and 11 are now §5 items 2 and 3; pattern 7 and "§4 item 7" are now §5 item 15; "§3" is now §4. Pattern 1, a buried broker role, is corrected by the Budget Van Lines role row above (see §3.1). JTBD's [R] source note still calls the matrix search-based | `../product/jtbd-and-journeys.md`; [sites/movingcom.md; sites/unpakt.md; sites/consumermovingreviews.md] |

## 9. Evidence gaps and how to close them

| gap | why it matters | how to close it |
|---|---|---|
| After submit, at all 11 sites: who calls, how many, how fast | AMC's main point of difference | Walks may not enter personal data; use complaint records, interviews and AMC pilot data |
| Unwalked flows: Move.org's tool, Moving.com's form, /999moving past its first screen, moveBuddha's bid path and marketplace, HireAHelper's booking and checkout, CMR's inventory tool, EnergySage's solar calculator, later Unpakt and EnergySage screens | Consent text and company counts | Hand walks to the contact step with test data only |
| Consent wording seen at two sites | No benchmark for AMC's box | Record exact text during those walks |
| ConsumerAffairs and HomeGuide blocked; Moving.com partial | Low-confidence rows | Manual sessions; never bypass bot protection |
| Scripts on form steps | Tag policy; wiretap questions for counsel | A network capture of each form step |
| Legal pages at Moving.com, moveBuddha, HireAHelper, CMR, Unpakt | Sharing and arbitration facts | Capture them |
| Mover prices, refunds, exclusivity, broker access | Pricing and credit decisions | Mover interviews (`../product/jtbd-and-journeys.md` §6.2) |
| Van lines with carrier and broker authority | Supply under AMC's strict rule | Live FMCSA checks; an owner decision on agents |
| The "Preferred" name | Badge, URL and data model | A counsel trademark search; a comprehension test |
| Semrush limits | Traffic sizing | Keyword lists for outlier pages; a Wave 1 state cost pull |
| AI answers seen in single searches only | AI visibility | Run the site-architecture §7.7 baseline with the references |
| Uncaptured templates: profiles, Move.org state pages, CMR lanes, Unpakt and MyGoodMovers cities | Template comparisons | Targeted captures |
| Screenshots not reviewed; nested JSON-LD unread | Design and markup claims | Review the private screenshots; parse nested JSON-LD |
| Outcomes of cases naming Clear Link, ConsumerAffairs and Move, Inc. | Risk context | Check dockets before citing |
