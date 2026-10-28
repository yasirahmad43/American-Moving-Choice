# SEO expansion verification — 2026-10-28

The expansion was generated and published in an isolated local PostgreSQL 16 database. This is local evidence; production must be checked after its deployment. No production credentials or customer records were used.

## Actual counts

| Family | Generated | Published and indexable | Held drafts |
|---|---:|---:|---:|
| State | 51 | 51 | 0 |
| City | 3,165 | 2,377 | 788 |
| Route | 1,000 | 8 | 992 |
| Service | 6 | 6 | 0 |
| Cost | 5 | 5 | 0 |
| Question | 34 | 13 | 21 |
| Planning | 21 | 7 | 14 |
| ZIP | 500 | 0 | 500 |
| **Total** | **4,782** | **2,467** | **2,315** |

The imported candidate pool has 29,639 city records, 3,165 cities with population at least 10,000 and attached ZIP codes, 40,977 ZIP records, 43,196 route candidates and 24 sourced regulatory facts. Generating candidates does not make them public.

The minimum published unique share is **0.4**. The 40% family uniqueness threshold was preserved. All 788 held city drafts and 902 held route drafts fail that threshold. Another 90 route drafts have unsupported transport modes because an endpoint is Alaska or Hawaii. The 21 question and 14 planning drafts are shorter than 300 words. Their existing word-count flag now blocks automatic publication; content was not padded to reach a target. All 500 sampled ZIP drafts fail the handoff's requirement for at least two eligible companies explicitly naming the **exact ZIP**; a county-wide rule alone does not satisfy that publication gate.

Database checks found **0** failed published gates, **0** mismatched self-canonicals, **0** public company-list blocks/company-profile links and **0** city pages without inbound links. The final graph has **56,394** internal links, **8** compatibility route redirects, and **228** distinct SEO media claims. Human-review counts remain zero; these are automated publication checks, not a claim of human review or search-engine indexing. `SITE_INDEXABLE=false` continues to control site-level crawler access.

## Sources and content boundaries

The Census distribution is pinned to [`bdurand/us_geo` commit b83ccde80d59d578df083df83fbecb1475841055](https://github.com/bdurand/us_geo/tree/b83ccde80d59d578df083df83fbecb1475841055/data/2020_dist). The publisher's source constants identify **2023 ACS 5-year estimates** for population/housing units and the **2025 Census Gazetteer** for land area. The stopped WIP's 2022/2023 vintage labels were incorrect and have been corrected. County time zones are attributed separately to the publisher's county mapping. Input checksums, row counts, the full MIT notice and matching limitations live in `packages/server/data/seo-geo/{facts-sources.json,US_GEO_LICENSE.txt,ATTRIBUTION.md}`. The builder rejects different input hashes.

Pages show sourced population/housing facts, actual ZIP coverage counts, exact centroid-distance ordering, nearby places and directional routes. Road miles and driving days are explicitly labelled model assumptions, never delivery promises. Housing style, parking, climate and access are not inferred from density. Postal delivery areas, ZCTAs and cities are not assumed to share boundaries. Generated coverage is count-only: no mover names, preferred-company lists or company-specific quote buttons.

### Transport-mode scope

The generic road model now requires **both endpoints in the contiguous United States or DC**. Alaska/Hawaii route guides remain draft until mode-specific transport/routing data exists. All state, city, nearby-place, ZIP-to-destination and route-table calculations use the same endpoint-aware helper, including reverse directions and same-state Alaska/Hawaii pairs. Unsupported cells say **Not modeled; ask mover**; they contain no invented road miles or delivery days. Candidate records also store `null` for unsupported road estimates.

The isolated database audit found **0** published Alaska/Hawaii route pages, **0** non-null unsupported candidate road estimates, and **0** incorrect values across **1,155** road/day cells on the 18 generated Alaska/Hawaii state/city records. Hawaii's state guide and Honolulu's city guide remain published with their valid Census and straight-line information; other geography guides still obey the unchanged uniqueness gate. This evidence is saved in `outputs/design-pass-2/seo-transport-report.json`.

## Production bootstrap

`db/scripts/vercel-deploy.ts` still runs only with `VERCEL_ENV=production` and a database URL. It applies pending migrations, seeds demo data only when needed, then calls `bootstrapSeo` **even when admin accounts already exist**. Migration `220_seo_bootstrap.sql` stores an atomic deployment lease and durable phase checkpoints; session advisory locks are avoided because production uses a transaction pooler.

An empty catalogue imports only bundled data/research, generates bounded families in chunks of 100, publishes passing pages, rebuilds links and syncs media ownership to the database. The lease renews between chunks/phases, expires after ten minutes without renewal, and releases on handled failures. A 25-minute budget stops work with completed phases retained. Changed page content remains draft/nonindexable while its gates are pending, including after interruption. Existing family pages participate in the persisted shingle corpus, and adding pages rechecks earlier pages' uniqueness too.

Validation exercised a saved-phase resume, a complete bootstrap with an existing demo admin, and the real Vercel entrypoint against the isolated database. The initial catalogue had 2,674 published/indexable pages; a subsequent transport-accuracy audit added the fail-closed scope described above and regenerated state/city/route families against the same corpus. Current bootstrap minimum/idempotence checks pass at **2,467** published/indexable pages. Existing editorial catalogues without an incomplete bootstrap record are left alone. The runtime depends on database latency; the final local city draft pass took about 102 seconds plus about 24 seconds for uniqueness, and the 1,000-route draft pass about 14 seconds plus 3 seconds for uniqueness. Those measurements are local, not a production timing guarantee.

The local checkpoint's historical `published_count=2674` records that initial completed run; it was not rewritten to disguise the later regeneration. The idempotent caller queries the current catalogue and returns 2,467. A first production bootstrap with the corrected generator records its own actual final count and requires at least 2,000 passing pages.

## Reproduction and deployment checks

On a fresh disposable database, apply all migrations and the demo seed, then invoke the production build entrypoint with `VERCEL_ENV=production` and that disposable URL. Regular preview/local builds do not mutate a database. The normal CLI can reproduce individual families:

```text
pnpm seo:import-geo
pnpm seo:import-research docs/research/competitor-gaps.csv docs/research/keyword-inventory.csv docs/research/mover-leads-b2b.csv docs/research/question-library.csv
pnpm seo:generate state --limit 51
pnpm seo:generate city --limit 10000
pnpm seo:publish --status ready
pnpm seo:report
```

Focused regressions passed: four SEO integration cases (whole-family uniqueness, interrupted generation/count-only content, failed-flag publication refusal, deployment lease/resume, and noncontiguous transport scope) and six transit-model cases. Server, database and web TypeScript checks passed. Full application builds/browser validation are recorded separately by the parent integration pass.

After production deployment, `/api/health` should report all **16 migrations** including 190, 200, 210 and 220. Verify the actual production counts; do not substitute the local counts for production evidence:

```sql
select family, status, count(*) from seo_pages group by family, status order by family, status;
select version, completed_at, completed_steps, published_count from seo_bootstrap_runs;
select count(*) from seo_pages p where status = 'published' and
  (blocked_reason is not null or unique_share < 0.4 or
   exists(select 1 from jsonb_each(gate_results) g where g.value->>'passed' = 'false'));
```

The non-secret local proof is saved as `outputs/design-pass-2/seo-local-report.json` in this task's workspace. Production deployment still requires its own smoke checks and actual page-count verification.

## Populated-page browser and crawl verification

A separate local production server on port 3002 used the populated SEO database without submitting forms or changing database records. Eighteen browser cases passed: state, city, route, service, cost, question and planning pages at both 1440px and 390px, plus Hawaii and Honolulu at both widths. The additional Hawaii checks verified 52 state-table and 69 city-table road/day cells per viewport as Not modeled, with Census facts still visible. Every case returned 200, had exactly one H1, zero serious/critical axe violations, zero horizontal document overflow, and zero company names or company-profile/directory links. Current results and screenshots are in `outputs/design-pass-2/seo-browser-report.json` and `seo-{family}-{desktop|mobile}.png`.

These populated screens exposed issues that empty catalogue previews could not: definition-list terms nested through decorative card wrappers, and a wide nine-column ZIP table expanding an implicit grid track. Fact cards now contain valid definition lists; explicit bounded content tracks and a shared `.dt-shell` `minmax(0, 1fr)` track keep wide data inside its existing scroll area. Document overflow is not clipped to conceal the issue.

The final HTML crawl fetched **2,497 public pages** and all ten sitemap files: every target returned 200. It found zero broken links, duplicate titles/descriptions, missing descriptions, invalid H1 counts, orphans, pages deeper than three clicks, invalid JSON-LD blocks, or FAQPage markup without visible FAQ content. Eight obsolete links found in the initial crawl were corrected to the actual published service/question/planning routes before the successful recrawl. The report is saved in `docs/seo/crawl-report.md` and `outputs/design-pass-2/seo-local-crawl.md`.

The crawler explicitly ran with `--preview`: all 2,497 HTML responses intentionally carry `noindex`, and the report records this separately from content/link failures. Duplicate metadata, orphan and depth checks still examined all public HTML, rather than reporting a vacuous zero over an empty indexable subset. HTTP canonical eligibility is inapplicable while global noindex is enabled; the database's stored self-canonicals were independently checked above. Visible FAQs are valid without FAQPage markup, which AMC deliberately disables.
