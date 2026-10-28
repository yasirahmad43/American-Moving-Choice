# American Moving Choice — handoff

Written 2026-10-28 for whoever (or whatever tool) continues this project. Everything below is
verifiable from the repository; nothing here depends on the previous assistant's chat history.

### 2026-10-28 Codex continuation

The owner's latest instruction supersedes the earlier named-mover acquisition flow:
consumers send one central request, choose a contact limit and contact channels, and only learn
company names when those companies contact them. Public company profiles and the directory now
redirect to the central quote form. Survey responses, confirmations, management links, SEO content,
and consumer notification templates do not publish the eligible company identities. Internal
eligibility snapshots remain recorded, explicitly marked as internal rather than names displayed.
See `docs/product/contact-introduction-flow.md`. Apply migration 200 before deploying this flow;
historical consent text and evidence remain unchanged. Reviews require recorded contact evidence.

Design pass 2 now has an editorial, quote-first home page, responsive portal/admin navigation,
sortable React-managed tables with mobile cards, keyboard-accessible depth cards, and background
video controls that respect reduced motion. **PR #6 merged the design/contact-flow work into
`claude/fervent-bohr-u9rg4y`. Production still runs the previous `main` version.** See
`docs/design/pass-2-verification.md` for the design proof.

The SEO expansion and persistent media upload implementation are also complete in the integration
checkout and await release. Local SEO validation published **2,467 pages** with all publication
gates passing; the production bootstrap, saved-phase resume and repeat-run behavior were exercised
locally. The local counts do not establish production counts or search-engine indexing. See
`docs/seo/expansion-verification.md`.

Current verification: **497 unique automated checks passed** across full suites and focused follow-ups (core 84, UI 8, DB 58, server 318, web content
29), and all package TypeScript checks passed. The focused media run passed **23 tests** against
an isolated local database with mocked Storage; it is a focused subset, not 23 additional tests.
Both final local application builds passed. The expanded browser suite is running at this update;
post-deployment smoke/browser checks remain release steps. Six additional deployment storage-probe
unit cases passed separately (12 protocol/probe cases total); these are six new unique checks beyond
the 487-test complete integration run, for 493 distinct checks verified across those runs.

The Supabase `amc-media` bucket was created and verified empty, public, WebP-only, with a
**4 MiB (4,194,304-byte)** object limit. `SUPABASE_URL` and `SUPABASE_MEDIA_BUCKET` are configured
on `amc-app` for Production and Preview. **Only the server key remains missing:** the owner has
been asked to add `SUPABASE_SECRET_KEY` directly in Vercel, without sending it through chat.
Uploads stay unavailable until that credential is configured and the application is redeployed.
No live upload has been verified; do not describe production media uploads as enabled. See
`docs/media/storage.md`.

## 1. What this is

AMC is a movers-only lead marketplace: consumers request quotes from verified moving carriers
(no brokers), choose how many movers may contact them, and matched movers buy those requests internally, identifying themselves when they contact a consumer.
Three surfaces, one monorepo:

| Surface | App | Production | Notes |
|---|---|---|---|
| Public website (SEO site, quote survey, directory, calculator) | `apps/web` | https://amc-web-three.vercel.app | Vercel project `amc-web`, root `apps/web` |
| Mover portal + admin + API/cron | `apps/app` | https://amc-app-sable.vercel.app | Vercel project `amc-app`, root `apps/app` |
| Database | Supabase project `american-moving-choice` (ref `ctpqgtststuxabtvejyi`, us-east-1) | schema `amc`, role `amc_app` | Dedicated IPv4 pooler, port 6543 |

Production currently runs `main` (the state before the redesign). The unreleased integration
continues through `claude/fervent-bohr-u9rg4y` and **PR #5**; its earlier CI-green status predates
the final SEO/media integration and must not substitute for final release checks:
https://github.com/yasirahmad43/American-Moving-Choice/pull/5

## 2. Branches

| Branch | State | What it holds |
|---|---|---|
| `main` | deployed previous version | MVP: survey, marketplace, portal, admin, billing, ops jobs (PRs #3, #4); redesign/SEO/media release still pending |
| `claude/fervent-bohr-u9rg4y` | unreleased integration; PR #5 | Original redesign/library/SEO/admin work plus design/contact-flow PR #6, now merged; final SEO/media integration awaits release |
| `design/pass-2` | design completed and merged via PR #6 | Current shared integration checkout also holds the completed SEO expansion and Storage implementation; check the working tree before switching or committing |
| `seo/expand` | historical stopped WIP source | Its Census/chunked-generation work was ported, corrected and verified in the integration checkout; use the integrated implementation and bootstrap, not a fresh blind merge of this old branch |

Historical slice branches (`slice/s1`…`s7`, `slice/e2e`, `research/*`, `audit/*`, `media/*`,
`admin/*`, `fix/*`) are all merged into `claude/fervent-bohr-u9rg4y`.

## 3. Read these first

- `docs/architecture/build-plan.md` — the build spec; §12 lists deliberate departures.
- `docs/architecture/deploy-runbook.md` — Supabase + Vercel setup, env vars, smoke test.
- `docs/design/visual-direction.md` — brand, tokens, motion rules, page blueprints.
- `docs/seo/site-architecture.md`, `docs/seo/programmatic-pipeline.md` — URL families, gates, how to run the SEO pipeline.
- `docs/audit/marketplace-rules-audit.md` — rules vs implementation, with evidence and the fix list.
- `docs/media/inventory.md` — the bundled media library and licensing.
- `docs/media/storage.md` — durable uploads, required server configuration and verified setup status.
- `docs/seo/expansion-verification.md` and `docs/design/pass-2-verification.md` — current local proof and release boundaries.
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
pnpm -r typecheck && pnpm -r test     # latest: core 81, ui 8, db 58, server 311, web content 29
pnpm build:web && pnpm build:app
pnpm e2e                 # Playwright, see e2e/tests/env.ts for env
pnpm media:check         # manifest validity, no asset used on two pages
pnpm seo:crawl -- --base http://localhost:3000 --out docs/seo/crawl-report.md
```

## 5. Deploying

- Production deploys on push to `main` (both Vercel projects are linked to the repo).
- `apps/app`'s build command runs `db/scripts/vercel-deploy.ts` first in production: it applies
  pending migrations, loads the demo seed only when needed, then calls the resumable SEO bootstrap
  even if admin accounts already exist. New release migrations include 170/180 plus 190 (SEO
  expansion), 200 (contact disclosure evidence), 210 (DB media manifest) and 220 (bootstrap leases).
  Confirm the actual production `schema_migrations` after release; no production application of
  these integration migrations has been claimed here.
- Env vars on both Vercel projects: `DATABASE_URL` (secret), `DATABASE_HOST/PORT/USER` overrides
  (dedicated pooler host, 6543, `amc_app`), `DATABASE_SSL=verify`, `DATABASE_SSL_CA`,
  `HMAC_SECRET`, `APP_ENCRYPTION_KEY`, `WEB_URL`, `APP_URL`, `DEMO_MODE=true`; web also
  `SITE_INDEXABLE=false`; app also `SESSION_SECRET`, `CRON_SECRET`, `SEED_*`.
- `SUPABASE_URL` and `SUPABASE_MEDIA_BUCKET=amc-media` are configured on `amc-app` for Production
  and Preview. The owner must add `SUPABASE_SECRET_KEY` directly to those Vercel environments;
  a legacy `SUPABASE_SERVICE_ROLE_KEY` is supported as a fallback. Never send the key through chat
  or put it in `NEXT_PUBLIC_`, Git, the public web project, or deployment logs. Redeploy after
  configuration. The public web app only needs its existing DB connection to resolve uploaded media.
- The completed production bootstrap imports bundled geo/research data, generates bounded chunks,
  publishes only passing pages, rebuilds links and syncs media ownership into the DB. Migration
  220 supplies a renewable deployment lease and durable phase checkpoints for the transaction
  pooler. An initialized editorial catalogue is left alone; incomplete bootstrap phases resume.
  Local validation retained 2,467 published/indexable pages on a repeat complete call. Verify
  production counts and gates after deployment; local counts are not production evidence.

## 6. Demo accounts (production and previews)

- Admin: `admin@demo.americanmovingchoice.test` + TOTP (secret is `SEED_ADMIN_TOTP_SECRET` in
  the amc-app Vercel env).
- Mover owner: `owner@demo-lonestar.test`.
- Both passwords were set by the owner on 2026-10-28 (the same simple password for both; ask the
  owner). They are not the `SEED_*` values any more, so re-running the seed will not restore them.
- Payments, email and FMCSA checks run in demo mode (`DEMO_MODE=true`): nothing real is charged,
  sent or looked up. USDOT fixtures 9000001–9000099.

## 7. What is still open (in priority order)

The original implementation priorities are code-complete locally: design/contact flow merged
through PR #6, SEO expansion exceeded 2,000 published pages with the bootstrap verified locally,
and uploads now use Storage plus a DB manifest. Remaining work is release/configuration and proof:

1. **Complete final integration checks and release PR #5 to `main`.** Both Vercel projects deploy
   from `main`. Preserve the current branch's local integration changes until committed/reviewed;
   do not lose them by switching to the old WIP branches. Final local web/app builds passed; the
   expanded browser suite is running at this update. Verify the production migrator/bootstrap
   instead of assuming local results apply.
2. **Finish the sole media credential step.** Add `SUPABASE_SECRET_KEY` directly in Vercel on
   `amc-app` Production and Preview, then redeploy. Bucket creation and URL/bucket variables are
   already verified. Run a small live editorial upload only after configuration and migration 210;
   verify its durable DB entry, public variants, assignment and failed-upload behavior. No live
   upload has yet been verified, and the integrated form stays unavailable without the key. An
   optional production-build probe can verify Storage without an admin login or downloading the key:
   set `AMC_VERIFY_MEDIA_STORAGE=true` in Vercel after adding the key. It writes, publicly reads and
   removes one fresh test image; see the exact success log in `docs/media/storage.md`. No successful
   live probe has been recorded at this update.
3. **Verify the deployed applications.** Check `/api/health` reports success and all 16 migrations
   for this release, verify the actual production SEO counts/quality gates, and run production smoke
   and browser tests. Check central quote submission, consent evidence, anonymous confirmations,
   contact-gated reviews, admin/portal access, and representative SEO pages on desktop/mobile.
   Keep `DEMO_MODE=true` and `SITE_INDEXABLE=false` until intentionally changed.
4. **Finish the proof package.** Assemble desktop/mobile page-family screenshots, media/research
   inventories, actual counts by family/status, crawl evidence, test/build output and a requirement
   checklist. Local design/SEO/media reports exist; final production proof still depends on release.
5. **Retain the demo/legal boundary.** Contact-introduction consent remains a draft/demo workflow,
   not a claim of approved legal wording. Payments, messaging and FMCSA verification stay in demo
   mode. Any approved consent changes must use a new version and preserve historical evidence.
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
- The bundled media manifest (`apps/web/content/media/manifest.json`) is ~700 KB because of inline
  blur placeholders; `pnpm media:check` validates that read-only library. Runtime upload metadata
  and editorial overrides live in `media_assets`; `media-sync` now reconciles the DB rather than
  writing files in a running deployment. Back up DB metadata and Storage objects together.
- Migrations are append-only and hash-checked; never edit an applied migration — add a new one.
