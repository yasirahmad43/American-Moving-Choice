# SEO expansion verification — 2026-10-28

The expansion was generated and published in an isolated local PostgreSQL 16 database. This is local evidence; production must be checked after its deployment. No production credentials or customer records were used.

## Actual counts

| Family | Generated | Published and indexable | Held drafts |
|---|---:|---:|---:|
| State | 51 | 51 | 0 |
| City | 3,165 | 2,539 | 626 |
| Route | 1,000 | 53 | 947 |
| Service | 6 | 6 | 0 |
| Cost | 5 | 5 | 0 |
| Question | 34 | 13 | 21 |
| Planning | 21 | 7 | 14 |
| ZIP | 500 | 0 | 500 |
| **Total** | **4,782** | **2,674** | **2,108** |

The imported candidate pool has 29,639 city records, 3,165 cities with population at least 10,000 and attached ZIP codes, 40,977 ZIP records, 43,196 route candidates and 24 sourced regulatory facts. Generating candidates does not make them public.

The minimum published unique share is **0.4**. The 40% family uniqueness threshold was preserved. All 626 held city drafts and 947 held route drafts fail that threshold. The 21 question and 14 planning drafts are shorter than 300 words. Their existing word-count flag now blocks automatic publication; content was not padded to reach a target. All 500 sampled ZIP drafts fail the handoff's requirement for at least two eligible companies explicitly naming the **exact ZIP**; a county-wide rule alone does not satisfy that publication gate.

Database checks found **0** failed published gates, **0** mismatched self-canonicals, **0** public company-list blocks/company-profile links and **0** city pages without inbound links. The final graph has **63,871** internal links, **53** compatibility route redirects, and **228** distinct SEO media claims. Human-review counts remain zero; these are automated publication checks, not a claim of human review or search-engine indexing. `SITE_INDEXABLE=false` continues to control site-level crawler access.

## Sources and content boundaries

The Census distribution is pinned to [`bdurand/us_geo` commit b83ccde80d59d578df083df83fbecb1475841055](https://github.com/bdurand/us_geo/tree/b83ccde80d59d578df083df83fbecb1475841055/data/2020_dist). The publisher's source constants identify **2023 ACS 5-year estimates** for population/housing units and the **2025 Census Gazetteer** for land area. The stopped WIP's 2022/2023 vintage labels were incorrect and have been corrected. County time zones are attributed separately to the publisher's county mapping. Input checksums, row counts, the full MIT notice and matching limitations live in `packages/server/data/seo-geo/{facts-sources.json,US_GEO_LICENSE.txt,ATTRIBUTION.md}`. The builder rejects different input hashes.

Pages show sourced population/housing facts, actual ZIP coverage counts, exact centroid-distance ordering, nearby places and directional routes. Road miles and driving days are explicitly labelled model assumptions, never delivery promises. Housing style, parking, climate and access are not inferred from density. Postal delivery areas, ZCTAs and cities are not assumed to share boundaries. Generated coverage is count-only: no mover names, preferred-company lists or company-specific quote buttons.

## Production bootstrap

`db/scripts/vercel-deploy.ts` still runs only with `VERCEL_ENV=production` and a database URL. It applies pending migrations, seeds demo data only when needed, then calls `bootstrapSeo` **even when admin accounts already exist**. Migration `220_seo_bootstrap.sql` stores an atomic deployment lease and durable phase checkpoints; session advisory locks are avoided because production uses a transaction pooler.

An empty catalogue imports only bundled data/research, generates bounded families in chunks of 100, publishes passing pages, rebuilds links and syncs media ownership to the database. The lease renews between chunks/phases, expires after ten minutes without renewal, and releases on handled failures. A 25-minute budget stops work with completed phases retained. Changed page content remains draft/nonindexable while its gates are pending, including after interruption. Existing family pages participate in the persisted shingle corpus, and adding pages rechecks earlier pages' uniqueness too.

Validation exercised a saved-phase resume, a complete bootstrap with an existing demo admin, and the real Vercel entrypoint against the isolated database. A second complete call skipped generation and retained **2,674** published/indexable pages. Existing editorial catalogues without an incomplete bootstrap record are left alone. The runtime depends on database latency; the local city draft pass took about 75 seconds plus about 28 seconds for uniqueness, and the 1,000-route draft pass about 16 seconds plus 3 seconds for uniqueness. Those measurements are local, not a production timing guarantee.

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

Focused regressions passed: three SEO integration cases (whole-family uniqueness, interrupted generation/count-only content, failed-flag publication refusal, deployment lease/resume) and three transit-model cases. Server, database and web TypeScript checks passed. Full application builds/browser validation are recorded separately by the parent integration pass.

After production deployment, `/api/health` should report all **16 migrations** including 190, 200, 210 and 220. Verify the actual production counts; do not substitute the local counts for production evidence:

```sql
select family, status, count(*) from seo_pages group by family, status order by family, status;
select version, completed_at, completed_steps, published_count from seo_bootstrap_runs;
select count(*) from seo_pages p where status = 'published' and
  (blocked_reason is not null or unique_share < 0.4 or
   exists(select 1 from jsonb_each(gate_results) g where g.value->>'passed' = 'false'));
```

The non-secret local proof is saved as `outputs/design-pass-2/seo-local-report.json` in this task's workspace. Production smoke checks, representative page crawls and rendered desktop/mobile checks remain deployment verification steps.
