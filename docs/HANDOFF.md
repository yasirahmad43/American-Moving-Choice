# American Moving Choice — handoff

Written 2026-10-28 for whoever (or whatever tool) continues this project. Everything below is
verifiable from the repository; nothing here depends on the previous assistant's chat history.

### Latest owner brief and immersive redesign (in review)

The owner rejected the earlier public design and requested a video hero with a right-side
survey on every public page, at least five different relevant images per page, engaging varied
reading layouts with all substantive content retained, topic-specific graphics/motion, the exact
supplied national-map/truck logo, and complete menu/footer discovery of the published catalog.
Public AMC funding promotion is retired; contact permissions and historical evidence remain intact.
The authoritative current visual brief is `docs/design/immersive-experience-brief.md`.

`codex/immersive-site-redesign` implements that new framework and a searchable `/explore/`
catalog. Home exposes the real published count, a native state-guide map and state/topic search.
Long reference tables keep every record in bounded keyboard-accessible scrollers. Place guides
use real state outlines; tool pages have direct calculator/USDOT entry actions as well as quotes.
Existing exclusively assigned media and uploads retain their ownership; licensed editorial
illustrations may repeat across pages under `docs/media/editorial-reuse.md`.

This is a new visual review, not the earlier deployed pass-2 proof. Comparison against all six
owner-supplied references is recorded separately; pass 1 was 6.1/10 and pass 2 was 7.9/10 before
the final map, local-context, photo-deduplication and tool-priority refinements. These are subjective
critiques, not an objective claim of perfection. Do not label an unfinished review 10/10.
Production remains `bbbdfb9` until this branch's final checks and release are recorded here.

### 2026-10-28 Codex continuation

The owner's latest instruction supersedes the earlier named-mover acquisition flow:
consumers send one central request, choose a contact limit and contact channels, and only learn
company names when those companies contact them. Public company profiles and the directory now
redirect to the central quote form. Survey responses, confirmations, management links, SEO content,
and consumer notification templates do not publish the eligible company identities. Internal
eligibility snapshots remain recorded, explicitly marked as internal rather than names displayed.
See `docs/product/contact-introduction-flow.md`. Apply migration 200 before deploying this flow;
historical consent text and evidence remain unchanged. Reviews require recorded contact evidence.

Design pass 2 has an editorial, quote-first home page, responsive portal/admin navigation,
sortable React-managed tables with mobile cards, keyboard-accessible depth cards, and background
video controls that respect reduced motion. **PRs #6 and #7 were integrated, and PR #5 merged to
`main` as `1c77e2e`.** The public redesign is deployed and was checked at 1440, 390 and 360 pixels.
See `docs/design/pass-2-verification.md` for design and browser evidence.

The first production app build applied migrations 170–220, then stopped during city generation
with a read-only transaction error. It retained 51 published state pages and 2,818 city drafts.
The old derived shingle index amplified database/WAL storage. **Repair `c8a3bc0` successfully
restored production through the normal migrator, without read-only overrides.** Migration 230 drops only the rebuildable cache,
then reconstructs compact records from saved content, including checkpointed families. All 4,782
local scores matched exactly, 2,467 published pages were retained, and cache storage fell from
1,125.56 to 27.11 MiB. See `docs/seo/compact-corpus.md`. Local counts do not establish production
counts or search-engine indexing.

**Current application release `bbbdfb9` is deployed to both production projects.** Its follow-up
fix makes wide plain-text tables keyboard accessible before hydration and removes redundant tab
stops in mobile card layouts. ZIP attachment now prefers matching GeoNames place/state and a stable
semantic fallback rather than database row order. No production reimport/regeneration was needed.

Current verification: **507 unique automated checks passed** (core 84, UI 8, DB 58, server 328,
web content 29), with exact-commit GitHub CI, both Vercel previews and both local builds passing.
The complete local browser suite passed **56 scenarios**, with one pre-existing intentional skip;
three additional table regressions passed. Eighteen populated local SEO screens and a 2,497-page
local crawl passed. **Production smoke passed 5/5**, including all seven SEO families at both
desktop/mobile widths and a fictional request submitted then withdrawn. **Production keyboard/table
tests passed 3/3**, including JavaScript-disabled access, with zero axe issues in the affected ZIP
section. Private portal/admin journeys were tested locally, without resetting production logins.

Independent production aggregates confirmed **17 migrations, 2,468 published/indexable pages**,
4,782 complete compact records and zero requested quality/privacy/unsupported-transport violations.
The full production crawl passed **2,498/2,498 HTML pages** and ten sitemap files, with zero broken
links or metadata/structure issues. The database measured 191.08 MiB and its compact cache 27.24 MiB.
`DEMO_MODE=true` on both projects and `SITE_INDEXABLE=false` on the web project were checked directly
as nonsecret flags. See the proof package's `production/` reports; this is not a search indexing claim.

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
| Public website (SEO guides, central quote survey, calculator) | `apps/web` | https://amc-web-three.vercel.app | Vercel project `amc-web`, root `apps/web` |
| Mover portal + admin + API/cron | `apps/app` | https://amc-app-sable.vercel.app | Vercel project `amc-app`, root `apps/app` |
| Database | Supabase project `american-moving-choice` (ref `ctpqgtststuxabtvejyi`, us-east-1) | schema `amc`, role `amc_app` | Dedicated IPv4 pooler, port 6543 |

The redesign/SEO/media release merged through **PR #5**. Both applications deploy from `main`;
the compact recovery and final table/import fixes are deployed, and the SEO bootstrap is complete:
https://github.com/yasirahmad43/American-Moving-Choice/pull/5

## 2. Branches

| Branch | State | What it holds |
|---|---|---|
| `main` | deployed and verified | PR #5, compact repair `c8a3bc0`, and final table/import fix `bbbdfb9`; later handoff-only updates do not change application behavior |
| `claude/fervent-bohr-u9rg4y` | merged integration; PR #5 complete | Original redesign/library/SEO/admin work plus PRs #6 and #7; use current main for continuation |
| `design/pass-2` | merged through PRs #6 and #7 | Completed design, private quote flow, expanded SEO and Storage implementation |
| `codex/compact-seo-index` | fast-forwarded to main | Exact CI-green repair; the GitHub connector could not create its PR, so a normal non-force fast-forward released the tested commit |
| `codex/table-keyboard-access` | fast-forwarded to main | Exact CI-green table accessibility, deterministic ZIP attachment, and demo-policy smoke checks |
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
pnpm -r typecheck && pnpm -r test     # latest: core 84, ui 8, db 58, server 328, web content 29
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
  expansion), 200 (contact disclosure evidence), 210 (DB media manifest), 220 (bootstrap leases),
  and 230 (compact rebuildable SEO corpus). All 17 migrations and completed bootstrap were verified
  in production; later completed builds preserve the initialized catalogue instead of regenerating it.
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
  Local validation retained 2,467 published/indexable pages on a repeat complete call. Actual
  production has 2,468, independently verified; the East Peoria ZIP-source difference is explained
  in `docs/seo/expansion-verification.md`. Do not replace actual production evidence with local counts.

## 6. Demo accounts (production and previews)

- Admin: `admin@demo.americanmovingchoice.test` + TOTP (secret is `SEED_ADMIN_TOTP_SECRET` in
  the amc-app Vercel env).
- Mover owner: `owner@demo-lonestar.test`.
- Both passwords were set by the owner on 2026-10-28 (the same simple password for both; ask the
  owner). They are not the `SEED_*` values any more, so re-running the seed will not restore them.
- Payments, email and FMCSA checks run in demo mode (`DEMO_MODE=true`): nothing real is charged,
  sent or looked up. USDOT fixtures 9000001–9000099.

## 7. What is still open (in priority order)

The implementation is on main: design/private quote flow, expanded SEO, compact bootstrap recovery
and Storage plus a DB manifest. Remaining work at this update is deployment verification and the
missing media credential:

1. **Verify the compact repair deployment and bootstrap.** PR #5 is already merged. Both projects
   deploy from main `c8a3bc0`; do not rerun the old row-per-shingle writer. Inspect the fresh app-role
   preflight and ordinary migration 230 result, then actual completed bootstrap/counts. No read-only
   override has been performed. Any recovery should follow `docs/seo/compact-corpus.md` and target
   only the verified rebuildable cache.
2. **Finish the sole media credential step.** Add `SUPABASE_SECRET_KEY` directly in Vercel on
   `amc-app` Production and Preview, then redeploy. Bucket creation and URL/bucket variables are
   already verified. Run a small live editorial upload only after configuration and migration 210;
   verify its durable DB entry, public variants, assignment and failed-upload behavior. No live
   upload has yet been verified, and the integrated form stays unavailable without the key. An
   optional production-build probe can verify Storage without an admin login or downloading the key:
   set `AMC_VERIFY_MEDIA_STORAGE=true` in Vercel after adding the key. It writes, publicly reads and
   removes one fresh test image; see the exact success log in `docs/media/storage.md`. No successful
   live probe has been recorded at this update.
3. **Verify the deployed applications.** Check `/api/health` reports success and all 17 migrations
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
