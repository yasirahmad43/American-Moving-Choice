# Programmatic SEO pipeline

**Status:** built 2026-10-28 on branch `seo/programmatic` · **Owner:** SEO / content · **Companion:** `site-architecture.md` (the plan), `crawl-report.md` (the latest staging crawl), `packages/server/data/seo-geo/ATTRIBUTION.md` (dataset licences).

The pipeline turns geo data, the facts registry, network coverage, rate cards and the research CSVs into the page families under `/movers/`, `/routes/`, `/services/`, `/moving-costs/`, `/questions/` and `/planning/`. Every figure on a page is read from a table or computed from one; nothing is typed by hand at render time, and a page whose brief lacks enough distinct facts is stored as `draft`, `indexable = false`, with `blocked_reason` set.

The persisted uniqueness corpus uses one packed `integer[]` per page after migration 230, with bounded repair from saved content and checked two-pass scoring. The original hash semantics and 40% threshold are unchanged. See [compact-corpus verification and interrupted-bootstrap recovery](compact-corpus.md).

## Where things live

| Piece | Path |
|---|---|
| Migration (geo entities, content store, links, research, redirects, media claims) | `db/migrations/170_seo_content.sql` |
| Committed geo dataset (states, 29,639 cities) and its build script | `packages/server/data/seo-geo/`, `packages/server/scripts/build-seo-geo.ts` |
| Facts registry seed (FMCSA Part 375 claims, state regulators, each with source and read date) | `packages/server/src/seo/facts.ts` |
| Editorial catalog (6 services, 34 questions, 21 planning pages) | `packages/server/src/seo/catalog.ts` |
| Generator, gates, network coverage, cost blocks, research lookups, publish, reads | `packages/server/src/seo/*.ts` |
| CLI | `packages/server/scripts/seo.ts` |
| Templates | `apps/web/components/seo/*`, `apps/web/app/(site)/{movers,routes,services,moving-costs,questions,planning}/` |
| Sitemaps and robots | `apps/web/lib/sitemaps.ts`, `apps/web/app/sitemap.xml/route.ts`, `apps/web/app/sitemaps/[name]/route.ts`, `apps/web/app/robots.ts` |
| Media loader and manifest | `apps/web/lib/media.ts`, `apps/web/content/media/manifest.json` |
| Crawler | `tools/seo-crawl.ts` |

## Running it

```sh
# 0. A migrated dev database with the demo seed (see .env.example)
SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… SEED_MOVER_EMAIL=… SEED_MOVER_PASSWORD=… pnpm db:seed:build
pnpm db:reset                      # recreates amc_dev, applies 001…180, loads the seed

# 1. Geo entities, route candidates and the facts registry (idempotent)
pnpm seo:import-geo                # 51 states, 29,639 cities, 40,977 ZIPs, 7,046 route candidates, 24 facts

# 2. Research (any of the research CSVs; rows marked "hypothesis" keep volume null)
pnpm seo:import-research docs/research/keyword-inventory.csv docs/research/question-library.csv \
  docs/research/competitor-gaps.csv docs/research/mover-leads-b2b.csv docs/seo/keyword-to-page-map.csv

# 3. Generate a family (writes draft or ready rows; reruns are idempotent and keep media claims)
pnpm seo:generate state --limit 51
pnpm seo:generate city --limit 300          # by population; --only texas/dallas,florida/miami
pnpm seo:generate route --limit 150         # measured routes first, then metro pairs by population
pnpm seo:generate service --limit 10
pnpm seo:generate cost --limit 10           # only states with ≥5 movers' active rate cards
pnpm seo:generate question --limit 60
pnpm seo:generate planning --limit 40
pnpm seo:generate zip --limit 400           # only ZIPs of published cities; gate: ≥3 movers naming the ZIP or county

# 4. Publish what passed every automated gate, record a reviewer, sync media claims
pnpm seo:publish --status ready [--family city] [--limit 50]
pnpm seo:review --reviewer "Name" [--family state]
pnpm seo:media-sync && pnpm media:check

# 5. Report and crawl
pnpm seo:report
pnpm build:web && (cd apps/web && SITE_INDEXABLE=true WEB_URL=http://localhost:3500 next start --port 3500)
pnpm seo:crawl -- --base http://localhost:3500 --out docs/seo/crawl-report.md
```

The CLI connects to `DATABASE_URL` (default `postgres://amc_app:amc_app@localhost:5432/amc_dev`) with `pg` directly, so it needs none of the app's secrets.

## Gates (automated, per page)

| Gate | Rule | Stored in |
|---|---|---|
| evidence | data-backed facts ≥ minimum (state 6, city 6, route 6, ZIP 5, cost 4, editorial 1) | `evidence_count`, `gate_results.evidence` |
| unique | ≥40% of 5-word shingles of the main content appear on no other page of the family (site architecture §4.1 G7); measured against the batch and the family's existing rows | `unique_share`, `gate_results.unique` |
| duplicate_content | SHA-256 of the main text is unique (unique index `seo_pages_content_hash_idx`) | `content_hash` |
| duplicate_intent | normalized primary keyword + intent is unique (unique index `seo_pages_keyword_intent_idx`) | `primary_keyword_normalized`, `intent` |
| keyword | measured (Semrush row) or hypothesis; never an invented volume | `gate_results.keyword.detail` |
| zip gate | ≥2 eligible movers name the exact ZIP for local moves, parent city published (HANDOFF decision) | `blocked_reason` |
| words | ≥300 words of main content; shorter pages remain draft | `gate_results.words`, `blocked_reason` |

A page that fails any blocking gate is written as `draft`, `indexable = false`, `blocked_reason = "blocked: …"`. `seo:publish` sets `published`, `indexable = (blocked_reason is null)`, `canonical_url = url`, and rebuilds `seo_links` from every published page's related modules and inline links, keeping only published targets. Human review (G9) is recorded separately with `seo:review`; the preview publishes without it and the report says so.

## What the templates render

Breadcrumbs (published ancestors only) + `BreadcrumbList`; H1; the first-screen answer with dated data points; sections (paragraphs, lists, tables, sourced facts, cost blocks labelled "planning range, not a quote", and count-only coverage); the central quote entry (sessionStorage `amc.survey.prefill`, no ZIPs in URLs); visible FAQ; related links filtered to published pages; sources, credits and `WebPage`/`CollectionPage`/`Article` JSON-LD. FAQPage and public MovingCompany lists are disabled. Names are introduced when a company contacts the customer. Published-but-not-indexable pages carry `noindex` and no canonical; indexable pages carry a self-canonical once `SITE_INDEXABLE=true`. Unknown/unpublished URLs are 404; two-letter state codes and uppercase slugs redirect (308); recorded `/moving-routes/` compatibility URLs redirect to published `/routes/` guides.

## Known limits and decisions

- Route URLs are `/routes/{origin}-to-{destination}/`; `/moving-routes/` compatibility redirects are generated at publication. Route hubs paginate at 400 guides per page with distinct canonical metadata and sitemap entries.
- ZIP pages exist in the store but none passes the gate with the demo network, matching the plan's "no indexable ZIP pages".
- Climate/season facts have no sourced provider yet, so no page states them.
- State regulator facts exist for TX, CA, FL and NY only; every other state page says the regulator has not been verified.
- Cost ranges depend on ≥5 movers' active rate cards per origin state (TX, FL, CA in the demo seed).
- Research keywords mark pages "researched" only where a measured Semrush row maps to the page; unmeasured metros and routes carry a hypothesis keyword, never an invented volume.
