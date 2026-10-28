# American Moving Choice — handoff

Written 2026-10-28 for whoever (or whatever tool) continues this project. Everything below is
verifiable from the repository; nothing here depends on the previous assistant's chat history.

## 1. What this is

AMC is a movers-only lead marketplace: consumers request quotes from verified moving carriers
(no brokers), choose how many movers may contact them, and the named movers buy those requests.
Three surfaces, one monorepo:

| Surface | App | Production | Notes |
|---|---|---|---|
| Public website (SEO site, quote survey, directory, calculator) | `apps/web` | https://amc-web-three.vercel.app | Vercel project `amc-web`, root `apps/web` |
| Mover portal + admin + API/cron | `apps/app` | https://amc-app-sable.vercel.app | Vercel project `amc-app`, root `apps/app` |
| Database | Supabase project `american-moving-choice` (ref `ctpqgtststuxabtvejyi`, us-east-1) | schema `amc`, role `amc_app` | Dedicated IPv4 pooler, port 6543 |

Production currently runs `main` (the state before the redesign). The redesign and everything
since are on branch `claude/fervent-bohr-u9rg4y`, open as **PR #5** (draft, CI green):
https://github.com/yasirahmad43/American-Moving-Choice/pull/5

## 2. Branches

| Branch | State | What it holds |
|---|---|---|
| `main` | deployed | MVP: survey, marketplace, portal, admin, billing, ops jobs (PRs #3, #4) |
| `claude/fervent-bohr-u9rg4y` | **CI green, not deployed** | + premium redesign pass 1, media library, SEO research, programmatic SEO system, marketplace audit + fixes, admin content/media/publication management, purchase retry fix |
| `design/pass-2` | **WIP, stopped mid-run** | motion provider (GSAP), pinned how-it-works, home rework, depth tokens, tilt/flip lighting, data table, floating labels, 3D icon set (3dicons, CC0), line-icon sprite, SEO data tables, app shell icons, marketplace list view. Not verified; last message from the worker: "Now the marketplace list view and the admin filter inputs." |
| `seo/expand` | **WIP, stopped mid-run** | Census facts dataset, migration `190_seo_expand.sql`, chunked generator with persisted shingle index, transit model. Last WIP commit is untested. The production bootstrap (populating SEO tables from the Vercel build) was requested but **not yet written**. |

Historical slice branches (`slice/s1`…`s7`, `slice/e2e`, `research/*`, `audit/*`, `media/*`,
`admin/*`, `fix/*`) are all merged into `claude/fervent-bohr-u9rg4y`.

## 3. Read these first

- `docs/architecture/build-plan.md` — the build spec; §12 lists deliberate departures.
- `docs/architecture/deploy-runbook.md` — Supabase + Vercel setup, env vars, smoke test.
- `docs/design/visual-direction.md` — brand, tokens, motion rules, page blueprints.
- `docs/seo/site-architecture.md`, `docs/seo/programmatic-pipeline.md` — URL families, gates, how to run the SEO pipeline.
- `docs/audit/marketplace-rules-audit.md` — rules vs implementation, with evidence and the fix list.
- `docs/media/inventory.md` — the media library, licensing, what stock hosts would need allowlisting.
- `docs/research/research-summary.md` + the CSVs beside it — keyword/competitor/question research.
- `content/README.md` — content rules; `content/pages/**` are the editorial pages (Markdown).

## 4. Running it locally

```
pnpm install
# local Postgres 16 on 5432 with superuser amc/amc (CI uses the same)
pnpm db:seed:build       # needs SEED_ADMIN_EMAIL/PASSWORD, SEED_MOVER_EMAIL/PASSWORD, SEED_ADMIN_TOTP_SECRET,
                         # APP_ENCRYPTION_KEY, HMAC_SECRET, WEB_URL (see .env.example); random values are fine
pnpm db:reset            # creates amc_dev, applies db/migrations/*.sql, loads the seed
pnpm seo:import-geo && pnpm seo:import-research docs/research/*.csv && pnpm seo:generate state && pnpm seo:publish --status ready && pnpm seo:media-sync
pnpm -r typecheck && pnpm -r test     # core 76, ui 4, db 58, server 296
pnpm build:web && pnpm build:app
pnpm e2e                 # Playwright, see e2e/tests/env.ts for env
pnpm media:check         # manifest validity, no asset used on two pages
pnpm seo:crawl -- --base http://localhost:3000 --out docs/seo/crawl-report.md
```

## 5. Deploying

- Production deploys on push to `main` (both Vercel projects are linked to the repo).
- `apps/app`'s build command runs `db/scripts/vercel-deploy.ts` first: it applies pending
  migrations and loads the demo seed once (only when `VERCEL_ENV=production`). Migrations 170
  (SEO content) and 180 (audit fixes) have **not** run in production yet; merging PR #5 to `main`
  runs them.
- Env vars on both Vercel projects: `DATABASE_URL` (secret), `DATABASE_HOST/PORT/USER` overrides
  (dedicated pooler host, 6543, `amc_app`), `DATABASE_SSL=verify`, `DATABASE_SSL_CA`,
  `HMAC_SECRET`, `APP_ENCRYPTION_KEY`, `WEB_URL`, `APP_URL`, `DEMO_MODE=true`; web also
  `SITE_INDEXABLE=false`; app also `SESSION_SECRET`, `CRON_SECRET`, `SEED_*`.
- The SEO tables in production are empty until something runs the pipeline against the
  production DB. The sandbox could not reach it; the intended path is a bootstrap step in
  `vercel-deploy.ts` (import-geo, import-research, generate, publish, media-sync when
  `seo_pages` is empty), chunked to stay within Vercel's build time. **Not written yet.**

## 6. Demo accounts (production and previews)

- Admin: `admin@demo.americanmovingchoice.test` + TOTP (secret is `SEED_ADMIN_TOTP_SECRET` in
  the amc-app Vercel env).
- Mover owner: `owner@demo-lonestar.test`.
- Both passwords were set by the owner on 2026-10-28 (the same simple password for both; ask the
  owner). They are not the `SEED_*` values any more, so re-running the seed will not restore them.
- Payments, email and FMCSA checks run in demo mode (`DEMO_MODE=true`): nothing real is charged,
  sent or looked up. USDOT fixtures 9000001–9000099.

## 7. What is still open (in priority order)

1. **Finish design pass 2** (`design/pass-2`): owner feedback was "still looks sloppy and AI; more
   animations; better tables; 3D icons; 3D cards; jaw-dropping". Scope given to the worker:
   GSAP ScrollTrigger choreography (pinned/scrubbed how-it-works, split-text hero, parallax,
   counters, staggered grids, magnetic CTAs), 3dicons set across site/apps, TiltCard with glare,
   deeper FlipCard, a real data table (sticky header, sort, chips, inline bars, card mode <720px)
   applied to every portal/admin/SEO table, and removal of generic layouts. Verify: typecheck,
   tests, both builds, axe 0 serious/critical at 1440/390, no horizontal scroll at 360, e2e.
2. **Finish SEO expansion** (`seo/expand`): first run published 342 pages; 625 drafts were held
   by the ≥40%-unique-shingle gate. The worker added Census facts and a chunked generator; it
   must still add per-page distinct sections (nearby cities with distances, ZIP coverage table,
   routes-from-here table, housing/climate facts where sourced), generate cities ≥10k pop and the
   route sets, publish ≥2,000 pages, rebuild links, update `docs/seo/crawl-report.md`, and write
   the production bootstrap in `vercel-deploy.ts`. Decisions already made: routes stay at
   `/routes/…` (+ redirect from `/moving-routes/…`), FAQPage JSON-LD off, ZIP pages stay
   unpublished unless ≥2 network movers name the ZIP.
3. **Admin media uploads on Vercel**: `packages/server/src/admin/content-media.ts` writes the
   manifest and uploads to the filesystem; move to Supabase Storage + a DB-backed manifest.
4. Merge PR #5 to `main`, let the production build run migrations 170/180, smoke test
   (`/api/health` → `{"status":"ok","migrations":12}`), run `pnpm e2e` against the deployed URLs.
5. Proof package: desktop/mobile screenshots per page family (`docs/design/screenshots/`),
   media inventory, research inventory, page counts by family/status (`pnpm seo:report`),
   crawl report, test evidence, requirement checklist.
6. Security housekeeping: rotate the secrets that appeared in chat screenshots
   (`DATABASE_URL`, `HMAC_SECRET`, `APP_ENCRYPTION_KEY`, `SESSION_SECRET`) before real users;
   the owner pasted an Anthropic API key into chat and should revoke it; Semrush API units are
   exhausted (51 metros / ~100 routes unmeasured, marked "hypothesis" in the data).
7. Supabase security advisor: 16 "function search_path mutable" warnings on `amc.*` functions
   (low risk, schema not exposed via Data API); set `search_path` on those functions.

## 8. Things that will bite you

- Several agents shared one checkout earlier; always check `git branch --show-current` before
  committing in the repo root. Worktrees live under `.claude/worktrees/` and `.worktrees/`.
- `pkill -f "next start"` kills the invoking shell in the cloud sandbox; use `fuser -k <port>/tcp`.
- The db package tests reset `DATABASE_URL`'s database; run `pnpm db:reset` again before starting apps.
- `WEB_URL`/`APP_URL` are baked into static pages at build time; rebuild after changing them.
- The media manifest (`apps/web/content/media/manifest.json`) is ~700 KB because of inline blur
  placeholders; `pnpm media:check` must pass before any commit that touches media.
- Migrations are append-only and hash-checked; never edit an applied migration — add a new one.
