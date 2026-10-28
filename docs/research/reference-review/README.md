# Reference-site review

American Moving Choice (AMC) reviewed the 11 reference sites the owner named, because content work waits until the full reference-site review is complete ([discovery brief](../../00-discovery-brief.md) §8). The review says what AMC should adopt, adapt or avoid in content, SEO, the quote flow, trust and design. AMC borrows patterns, never wording, layouts or data.

**Date:** captures, walks, Semrush pulls and site reviews 2026-10-27; cross-site synthesis 2026-10-28.

## Scope

The 11 sites, at the URLs the owner gave, are in the coverage table. EnergySage, a solar marketplace, is inspiration only.

## Method

1. **Direct capture.** `capture.js` ran headless Chromium in a Vercel Sandbox in the owner's Vercel account, rendering up to 14 public pages per site. `pack.js` condensed each capture into an evidence pack.
2. **Quote-flow walks.** `capture.js` tried automated walks; `runplan.js` ran guided ones in a browser kept open by `browserd.js`.
3. **Semrush** (US): domain and top-page estimates for all 11 sites, backlinks for four, and 14 search-result snapshots.
4. **Web search** for owners, regulators, complaints and press.
5. **Two review lenses per site:** separate product and SEO passes.
6. **Adversarial verification** tried to refute the lens findings against the evidence. Unconfirmed claims are marked or cut.
7. **Cross-site synthesis** in eight themes fed the v2 matrix and implications doc. Its notes are not in the repository.

## Safety rules

- Public pages only; robots.txt respected.
- Test ZIPs (30303 to 33101) and test dates only.
- No contact details entered, no consent box ticked, nothing submitted once a screen asked for contact details. The scripts enforce this.
- No bot protection bypassed.
- Only short quotes are committed; raw captures stay outside the repository.

## Coverage

|site (URL the owner gave)|capture|walk|review confidence|review file|evidence pack|
|---|---|---|---|---|---|
|ConsumerAffairs (`consumeraffairs.com/movers/best-long-distance-moving-companies.html`)|Blocked (HTTP 403)|None|Low|[sites/consumeraffairs.md](sites/consumeraffairs.md)|[captures/consumeraffairs.md](captures/consumeraffairs.md)|
|HomeGuide (`homeguide.com/moving-companies`)|Blocked (Cloudflare challenge)|None|Low|[sites/homeguide.md](sites/homeguide.md)|[captures/homeguide.md](captures/homeguide.md)|
|Budget Van Lines (`budgetvanlines.com`)|6 of 6 pages|Automated, stopped at `/999moving`|Medium|[sites/budgetvanlines.md](sites/budgetvanlines.md)|[captures/budgetvanlines.md](captures/budgetvanlines.md)|
|Moving.com (`moving.com`)|Partial: 6 of 13|None|Low|[sites/movingcom.md](sites/movingcom.md)|[captures/movingcom.md](captures/movingcom.md)|
|Unpakt (`unpakt.com`)|9 of 9|Automated and guided; site error after the first screen|Medium|[sites/unpakt.md](sites/unpakt.md)|[captures/unpakt.md](captures/unpakt.md)|
|Consumer Moving Reviews (`consumermovingreviews.com`)|10 of 10|Guided, to the contact step|Medium|[sites/consumermovingreviews.md](sites/consumermovingreviews.md)|[captures/consumermovingreviews.md](captures/consumermovingreviews.md)|
|EnergySage (`energysage.com`)|10 of 10|Automated, four screens|Medium|[sites/energysage.md](sites/energysage.md)|[captures/energysage.md](captures/energysage.md)|
|HireAHelper (`hireahelper.com/movers/dalton_ga/a-1-moving/`)|13 of 14|Automated, profile to mover list|Medium|[sites/hireahelper.md](sites/hireahelper.md)|[captures/hireahelper.md](captures/hireahelper.md)|
|moveBuddha (`movebuddha.com`)|14 of 14|Guided: calculator, results, marketplace, partner form|Medium|[sites/movebuddha.md](sites/movebuddha.md)|[captures/movebuddha.md](captures/movebuddha.md)|
|Move.org (`move.org`)|14 of 14|Find-a-Mover tool not walked|Medium|[sites/moveorg.md](sites/moveorg.md)|[captures/moveorg.md](captures/moveorg.md)|
|MyGoodMovers (`quote.mygoodmovers.com/long-distance-moving/`, `mygoodmovers.com`)|14 of 14|Guided, calculator to the contact step|Medium|[sites/mygoodmovers.md](sites/mygoodmovers.md)|[captures/mygoodmovers.md](captures/mygoodmovers.md)|

## Reading the evidence labels

- **[capture]** seen in the capture, with the page path.
- **[walk]** seen in a quote-flow walk.
- **[semrush]** a Semrush estimate, with the file.
- **[search]** a web-search result, marked own page or third party.
- **[v1]** only in the search-only v1 matrix, not re-confirmed. v2 replaced v1 in the same file, so v1 is kept in git at commit `871e813` (`git show 871e813:docs/research/reference-matrix.md`).
- **[inference]** reasoning, not observation.
- **[cross-site analysis]** a synthesis with no single site source.

"Not observed" means unknown, not absent. Legal points are questions for counsel ([compliance facts](../compliance-and-platform-facts.md)). AMC's [business rules](../../business-rules/) win over v1. For example, Preferred is a screening status, not a paid badge ([mover verification](../../business-rules/mover-verification-and-reviews.md) §4).

## Key limitations

- **Blocked sites.** The ConsumerAffairs and HomeGuide reviews rest on search, Semrush and v1. Moving.com's homepage, About and privacy pages were blocked [capture; sites/consumeraffairs.md; sites/homeguide.md; sites/movingcom.md].
- **Flows not walked.** These were not walked: Move.org's Find-a-Mover tool, Moving.com's quote form, Budget Van Lines' `/999moving` past its first screen, EnergySage past four automated screens and its solar calculator, moveBuddha's bid path and marketplace past the first screen, HireAHelper's booking and checkout, and CMR's inventory tool [captures/_provenance.md; sites/moveorg.md; sites/movingcom.md; sites/budgetvanlines.md; sites/energysage.md; sites/movebuddha.md; sites/hireahelper.md; sites/consumermovingreviews.md]. Matrix §9 lists them with how to close each gap.
- **Nothing past contact.** Only the Consumer Moving Reviews and MyGoodMovers walks reached a consent step. moveBuddha's partner form and HireAHelper's mover list reached an email field. No walk went past contact, so what happens after submit is unknown at every site [walk; sites/consumermovingreviews.md; sites/mygoodmovers.md; sites/movebuddha.md; sites/hireahelper.md; cross-site analysis].
- **The Unpakt error.** Submitting Unpakt's first screen twice returned "Something went wrong creating your move plan", so pricing and booking were not seen. The fault may be sandbox-only [walk /; sites/unpakt.md].
- **Semrush caveats.** US estimates, not analytics: top 15 to 25 pages per domain, backlinks for four domains, no per-page keyword lists [semrush: top_pages, top_pages_more, backlinks_overview].
- **One date.** Everything describes the sites on 2026-10-27. Re-check a fact before it shapes AMC copy.
- **Text only.** No screenshots were reviewed, so color, type and spacing were not assessed.

## Where the outputs are

- [sites/](sites/): the 11 reviews, the verified record.
- [captures/](captures/): evidence packs. Start with [_provenance.md](captures/_provenance.md).
- [Reference matrix v2](../reference-matrix.md): the cross-site comparison. §8 corrects v1 and maps v1's section numbers to v2; §9 lists evidence gaps.
- [Implications for content, SEO and design](implications-for-content-seo-design.md): decisions and document changes.
- Semrush files: [raw/semrush/](../raw/semrush/) and [seo/raw/](../../seo/raw/).

## Refreshing the review

Refresh before each major content push, and at least yearly, starting with the matrix §9 gaps. The tools are in [tools/reference-capture/](../../../tools/reference-capture/), with setup in each file's header:

- `capture.js` captures pages and runs automated walks. Edit its `SITES` and `TEST` values first.
- `pack.js` turns captures into evidence packs.
- `browserd.js` keeps a browser open for guided walks.
- `runplan.js` runs guided walks, with the safety guards built in.

Then copy the packs into `captures/`, update `_provenance.md` (date, versions, commits), save Semrush pulls as new dated files, re-run the lenses, verification and synthesis, and log changes as matrix §8 does. Never bypass bot protection.

The review brief, the lens and verification prompts and the theme notes were working files and are not in the repository. These steps repeat the method:

1. **Brief.** Give every reviewer the same brief: AMC's requirements (move details first, then contact details, then the count question; named-mover consent in a separate unticked box; movers only; Preferred Movers kept apart from ratings; evidence-labeled reviews; no doorway pages), the evidence labels above, the safety rules above, and the writing rules (quotes of 25 words or fewer with page paths, patterns never wording, legal points as questions for counsel).
2. **Lenses.** For each site, run a product pass (journey, mover side, trust, consent, design) and an SEO pass (traffic, page families, templates, markup) over its evidence pack, raw pack, Semrush rows, searches and v1. Merge both into one review with the same sections as the current files in [sites/](sites/).
3. **Verification.** Have a separate pass try to refute every claim against the evidence. Mark what it cannot confirm, or cut it.
4. **Synthesis.** Compare the verified reviews across eight themes: business model and disclosure, quote flow, consent and data, verification and trust, reviews and ratings, SEO and content, design and UX, and the provider side. Update the matrix and the implications doc from them, citing the site reviews rather than the theme notes.
