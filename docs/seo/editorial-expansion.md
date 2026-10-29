# Moving questions and checklists: publication targets and first source batch

The owner requested **more than 100,000 Moving Questions pages** and **at least 500 checklist pages**
on 2026-10-29. The configured goals are 100,001 question pages and 500 planning/checklist pages.
These are targets, not published counts. Public menus, hubs and sitemaps continue to count only
actual eligible published records. The admin publication dashboard shows the gap explicitly.

## Current deliverable and remaining scope

This source batch adds **20 authored questions and 20 authored checklists**. The first final local
clone published all 40 with the unchanged evidence, duplicate-intent/content,300-word and40%
whole-family five-word-shingle gates. Its resulting totals were **33 question pages and 27 planning
pages**. All 7,922 previously saved local records retained their text, metadata and publication
status; the 20 previously published editorial pages remained eligible. Production counts require
separate post-deployment verification and must not be inferred from that clone.

**The 100,001/500 request is not fulfilled by this batch.** There are 54 authored question candidates
and 41 planning candidates in the integrated catalog; some original shorter records remain held.
No100,000-page manuscript or automated content source exists in this repository. The existing
registry has 20 national and four state facts. Multiplying those answers by city names would not
produce independently useful answers and would fail the existing uniqueness checks. The 300-word
floor is an internal product rule, not a Google requirement. At that floor, the requested catalog
would require at least 30,150,300 main-content words; the number alone says nothing about quality.

The next editorial cohorts need distinct reader decisions, sufficient primary evidence and
original actionable guidance before they can count toward the targets. Candidate ideas, research,
drafts, held records and published answers must remain separate. Do not change counters, lower
the gates, insert synthetic records, claim invented demand, or mass-publish geographic rewrites
to make this release appear complete. Google discusses both people-first value and scaled-content
abuse in its [helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
and [spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

## Sources and authored content

- `question-expansion-catalog.ts` contains 20 item/task questions: books, artwork, television,
  computer, dishes, mirror, refrigerator, washer, standing desk, mattress, clothing, records,
  photographs, tools, lamps, houseplants, guitar, rug, outdoor furniture and board games.
  Additional primary references are bound by slug in `QUESTION_EXPANSION_SOURCES`; manufacturer
  guidance is identified as model-specific. Practical worksheets do not falsely become federal
  packing rules. Sources include Library of Congress/Harvard preservation, manufacturers, EPA,
  USDA and the National Plant Board's state-law summaries. The real LG model manual is large;
  the web reader's full fetch exceeded its size limit, while its indexed manufacturer passage
  supported the cited handling instructions. No claim of a full PDF review is made.
- `planning-expansion-catalog.ts` contains 20 explicit task checklists, with 12 ordered steps,
  prerequisites, scope, completion criteria and a source-bound claim. It covers survey preparation,
  access, estimates, contracts, packing, storage, inventory, delivery, weighing and disputes.
  `planning-expansion-sources.ts` records the dated FMCSA/eCFR primary references. A carrier
  complaint, a written cargo claim and an arbitration request remain separate processes.
- The normal generator saves additional references and authored facts-block references in the
  page's source list, alongside the existing registry sources. No fake author, credential,
  business contact, current market price or mover identity is added.

## Bounded publication and preservation

`bootstrapEditorialBatch` processes the immutable40-entry cohort under a separate versioned
lease. It requires a pinned database client, runs generation/quality/publication/link changes in
one transaction and imposes a maximum 100 authored entries per atomic release. A failure rolls
back all new content and decisions. Fingerprints and eligibility checks protect existing live
editorial pages. Publication selects only the explicit cohort URLs, leaving unrelated ready
drafts alone. Missing/skipped candidates are counted as held, never omitted from the totals.
Completed batches are read-only on ordinary redeploys; original articles are not regenerated.

The production deployment invokes this bounded batch after the existing SEO/route bootstraps,
within their shared 25-minute limit. The measured final local batch took 9.4 seconds; its completed
rerun took 2 ms. This is not a benchmark for generating 100,000 articles. A future larger pipeline
needs separately versioned source cohorts, storage/quota preflight and a measured bounded scoring
and publication strategy. Current family-wide exact scoring still has memory proportional to
the family's total shingle count; pagination alone does not solve that generation constraint.

## Discovery and sitemap capacity

- Questions and Planning use 60 cards per hub page and native canonical `/page/N/` URLs.
- Questions, Planning and Routes have bounded numbered navigation and native page jumps.
  First/last and neighboring pages remain real links. All valid hub pages appear in core.xml.
- Question and planning XML uses 1,000-URL numbered files and SQL limit/offset reads. Legacy
  `questions.xml`/`planning.xml` endpoints remain complete sitemap-index aliases.
- Public and admin reporting share the same segment configuration. The retired company sitemap
  is excluded. Migration 240 adds derived partial family/URL indexes without rewriting content.
- A separate local synthetic fixture tested 100,005 added question records and 501 added planning
  records (100,018/508 totals including the original local catalog). The last question hub page,
  sitemap offsets beyond100,000 and literal discovery search were exercised. These fixtures
  never enter production and prove no editorial quality or real production quota. The observed
  query times were 62–281ms on this local machine; do not present them as production latency.

## Evidence and launch boundary

Focused tests cover authored scope/source bindings, whole-family lexical uniqueness, SQL bounds,
pagination, legacy sitemap completeness, scoped publication, real mid-write rollback, preservation,
missing-candidate accounting and idempotence. The final local source proof records a minimum 518
main-content words and 79.35% saved-family uniqueness among the40 new records. Source tests and
local browser/capacity proofs do not establish production counts or search rankings.

The site's existing demo/noindex policy is unchanged. Search indexing and ChatGPT citations are
not enabled or guaranteed by adding content. The prior verified release remains documented in
HANDOFF; post-deployment evidence for this batch is stored separately in the owner's outputs.
