# American Moving Choice — handoff

Updated 2026-10-29 for whoever (or whatever tool) continues this project. Everything below is
verifiable from the repository; nothing here depends on the previous assistant's chat history.

### Survey continuity and contained overlays — owner follow-up, 2026-10-29

The hero and closing starter are the first two steps of the same seven-step household journey.
They collect route, move size and an estimated date once, then open a fresh quote page at step 3
with an editable saved-move summary. A new starter replaces stale move intent and date flags;
non-contact draft checkpoints are written before advancing so cached navigation/reload cannot
silently restart the journey. Contact data and permission choices are never persisted in drafts.
The direct full-survey entry still supports other move needs. Run the dedicated
`e2e/survey-continuity.config.ts` regression against a local test instance before editing this flow.

The home planning image and callout occupy separate rows of an auto-height card. Captions/icons
on compact guide photos use separate horizontal lanes. Sticky quote bars yield to both the closing
survey and footer. New overlays must remain within their owning media/card and must not cover
unrelated copy or active form controls. The inset browser regression now uses real native
scrollbars, checks usable client width (including the 319px case), whole-word heading wraps and
contained overlays. Keep the logo flexible within the space left by the menu.

### Public content inset rule — owner follow-up, 2026-10-29

Every painted public text container must opt into `data-content-inset="card"` (16–24px on
all four sides) or `data-content-inset="compact"` (12–16px for compact records, fields and
controls). Mark the text-owning body; leave full-bleed image/split-card shells unmarked so
padding is not doubled. Unboxed editorial prose inherits its containing chapter inset.
`content-insets.css` is imported by the root layout and enforces literal padding floors that
survive missing/malformed tokens and ordinary later route styles. Section gutters retain
16/24/32px profiles. Text depth transforms must not project through the content inset.
Shared Card/TiltCard/ExpandableCard expose optional `contentInset` props; TiltCard targets its
inner body and ExpandableCard its summary/body, preserving existing private-app defaults.
Native editorial table cells use the compact floor in `prose.css`. On phones, the painted
row owns this gap and its unboxed inner cells retain zero padding to avoid doubling it.

Run `E2E_WEB_URL=<running public URL> pnpm --filter @amc/e2e exec playwright test --config
content-insets.config.ts` after changing these shared layouts. It measures visible text
geometry, calibrates failure detection, checks token/style-order failures and real client
navigation. The public spacing investigation also confirmed older already-loaded home tabs
were retaining pre-rule content/styles; fresh loads and current client navigation passed.

### Card spacing and working actions — owner follow-up, 2026-10-29

Keep readable inner padding on painted cards; do not zero the benefit-card body inset. Hero and
closing forms use their natural content height instead of stretching to match adjacent copy.
The quote introduction uses a readable width/title scale and responsive ZIP fields. Every
next-step card names its destination; on the quote page its own request action returns to
`#hero-survey` without reloading or discarding answers. Navigation wait feedback is scoped to
these action links; do not add a streaming boundary that can change missing-route HTTP status.

### Public audience — owner decision, 2026-10-29

The public website is for people planning moves. The owner handles moving-company business
discussions separately: do not restore public lead sales, lead pricing, buying rules, carrier
recruitment or their navigation. All `/for-movers/` pages and `/mover-terms/` are retired, including
their archived Markdown fallback, catalog and sitemap entries. Public request explanations use
accurate contact-permission and withdrawal language. Actual stored consent versions, private
company/admin functions and billing rules are unchanged; this is a public presentation decision.

### Search and conversion review — 2026-10-29

The owner's next visual brief supersedes deliberately scrollable public reference tables and
mobile carousels: public pages must fit every container without sideways scrolling or cut-off
text, use a compact shared spacing rhythm and balanced section/card edges, and show two or
three phone cards where their content remains readable. Branch `codex/compact-responsive-layouts`
implements adaptive records with native disclosures for wide tables, wrapped Markdown/JSX
tables, compact topic/result grids, a native regional mobile state atlas, full-width article
chapters and inline reading navigation. Complete authored values, links, headings and sources
stay available, including without JavaScript. Shared table adaptation is opt-in on public calls;
the admin's existing table API stays compatible. See `docs/design/compact-responsive-brief.md`.
The preceding deployed source is `2eee0b4038fe40ef7c8092a04fda4f32f2c1ed20`; current candidate
browser checks and any subsequent production proof must name their own actual source revision.
Neither this visual pass nor its tests enable indexing, publish extra pages or change consent.

Geographic-label follow-up (`codex/census-county-labels`): the full `67b2e82` inventory found
malformed equivalent names such as “Colonial Heights (city County”, “City of Richmond County”,
“Orleans County” in Louisiana, “Anchorage Municipality County” and “District of Columbia County”.
The shared formatter now uses 135 exact current-FIPS names from the official 2025 Census
national county Gazetteer: 41 independent cities plus 64 Louisiana parishes, 29 Alaska
equivalents and DC. Carson City retains its exact name. Retired source FIPS 02232 is deliberately
unmapped; its complete old literal is protected from accidentally matching the current
Hoonah-Angoon suffix. No boundary or FIPS reassignment is inferred.

Saved-label repair runs after private-company redaction. The 23 Louisiana aliases that also
name ordinary counties elsewhere require immediate explicit Louisiana wording or verified
structured context. Own-location fields use the page's primary County data point; mixed-state
County rows use their State/City marker or matching route-end Page-row link, including plain
below-threshold “City, LA” markers. A route's origin state never authorizes pagewide parish
replacement. Ordinary NY/VT Orleans County, TN Franklin County and MS Jackson/DeSoto County
are covered by preservation tests. URLs, IDs, hashes, dates, numbers, stored records, matching,
publication gates and bootstrap version remain unchanged. This is a display correction, not an
availability, demographic or market-data update. Focused validation: 141 core tests and 108 web
tests pass; core, server and web typechecks pass. Final release checks must use the complete
frozen `67b2e82` inventory plus fresh affected pages and reconcile the unchanged remainder.
The same batch removes a duplicated layout brand suffix from the `/explore/` document title;
its social metadata and page body remain intact.

Reader follow-up: the initial release `721ee96328689fd4ef9ea6736024f743e6291262` has a
preserved **partial** 584-page post-release crawl, not a final whole-site verification. The next
candidate uses complete authored metadata sentences for brief hero previews, with a complete
intro sentence as fallback; it never displays a clipped snippet or cuts a legal qualification
mid-sentence. Full answers stay in the body. A read-only local profile of all 4,719 published
authored guides found no unfinished previews and none over 60 words (maximum 50). This is a
local presentation check, not a production count or a usefulness/ranking score. The same reader
pass corrects the confusing blanket “no” in the estimate-increase opening and explicitly scopes
the long-distance 50-mile convention to this site. Follow-up branch:
`codex/complete-hero-summaries`. Final release/crawl evidence must identify its actual revision.

The owner requests a whole-site design, search/AI discovery and lead-conversion review. The
starting deployed release is `78f124a59ee0a96ca6b16366879f2cb0c6396c26` (caption repair PR #13).
The follow-up branch is `codex/search-conversion-readiness`. A subjective perfect rating or a
promise to outrank every mover is not a verification result. Source/content changes are separate
from production release and the fresh full-site audit; their exact revisions belong in the proof.

This pass compacts the mobile ZIP starter without changing its fields, consent or permissions;
uses complete, page-specific published guidance in guide heroes rather than repeated family
copy or truncated search snippets; and adds complete native mobile/tablet reading navigation.
Page structured data uses the actual visible headline/image, preserves the demo robots policy,
and no longer assumes the publisher authored an article without an author record.

Independent content review found overbroad same-state jurisdiction and delivery-payment
statements. The corrected source and exact legacy public projection retain the FMCSA interstate
route exception and the additional-service/impracticable-operation exceptions to the 110% rule.
Completed catalogues are not regenerated: bootstrap version and stored dates, facts, links and
publication gates remain intact. City ZIP tables must distinguish specifically named ZIP/county
rules from all coverage matches rather than printing a broader match count under a naming label.

The shared mobile quote bar now watches the real homepage hero and yields to focused forms and
the visible closing survey so it cannot cover Continue. Real desktop/mobile, keyboard and
JavaScript-disabled checks, plus retained before/after findings, are in the task's
`outputs/search-conversion-audit/` proof directory.

Live baseline checks confirm `robots.txt` disallows crawling and pages carry noindex/nofollow.
`DEMO_MODE=true` and `SITE_INDEXABLE=false` remain intentional. This review does not approve a
live marketplace launch, invent business contacts, convert fictional movers into verified real
coverage, supply unsupported prices, manufacture customer reviews or claim measured leads.
The deferred business/contact and policy work, real-market coverage, provider readiness and
post-launch search/conversion measurement remain material limits. The 100,001 question/500
checklist targets below are still in progress; this repair publishes no synthetic volume.

### Public caption and copy repair — 2026-10-29

The owner found the visible caption “Tablet with a blurred form on a sofa” on
`/which-companies-receive-my-request/`. The shared StoryPhoto component incorrectly used image
alt descriptions when a section had no heading. It now accepts only explicit editorial caption
text, and content wrappers pass page context. The request-page label is “You choose your contact
limit.” Contextless photos omit a caption. Accurate image alt text and required credits remain.

A before-release scout checked all 67 core sitemap pages plus the public application page and
found 11 affected pages: contact permissions, the concern form, four carrier pages, the three legal
pages and the Costs/calculator-method guides. Related cleanup removes empty review-note paragraph
wrappers, replaces internal “placeholder/counsel writes” wording with honest preview/legal-review
status, and turns a malformed missing-data range sentence into named explanatory fields. Original
substantive legal text, reference tables/rows/anchors, links and actual model/data values remain.
No policies, prices, provider identities or retention periods were invented.

The optimized public build and 89 public content/media tests passed, including 21 new regression
checks for caption/alt separation, rendered legal-preview copy, real-guide field preservation and
distinct accessible labels on formula/example regions.
The owner-requested full public visible-copy scan and affected-page desktop/mobile checks are
recorded separately under the caption-cleanup proof outputs, with exact deployed source revisions.
Image metadata and hydration JSON must be excluded from visible-copy findings; closed reader
disclosures and streamed Next content must remain in scope. Do not hide a finding by weakening
the detector or deleting substantive guidance.

### Editorial scale request — 2026-10-29, in progress

The owner now requests more than 100,000 Moving Questions pages and at least 500 checklist pages.
These targets are configured separately from actual published counts and are **not yet met**.
This bounded source release adds 20 substantive questions and 20 checklists, with protected original
content and unchanged publication gates. Its final local clone has 33 published questions and 27
planning pages, not 100,001/500. New public pagination, segmented SQL-backed sitemaps and explicit
admin target progress support continued sourcing. Synthetic 100k capacity fixtures are strictly
local and must never be copied into production or counted as authored content. See
`docs/seo/editorial-expansion.md` for sources, release/rollback behavior, proofs and remaining scope.

The preceding verified public/admin release is `5646d1a378311d777d89990e0fd5cac4aef65df3`
(PR #11); both aliases were Ready and active. It closed the one baseline sharing-image exception
and the sampled landmark-name warnings with eight fresh live desktop/mobile checks. The older
01ebe/dd5 proofs below retain their original revisions; they are not claims of a full crawl on 5646.

### Released owner follow-up — 2026-10-29

The owner rejected the earlier assessment: non-home design is about 6/10 and SEO/content about
5/10 in their judgment. PRs **#9 and #10** shipped the expanded brief from
`codex/complete-moving-experience`: images on every catalog result, thousands of useful route
guides, all 51 state/district names on the map (with callouts for small states), and a working
survey immediately before the footer as well as in every hero. Editorial pages retain their
substantive text, source links and tables in varied image-led chapters. The real business name is
**American Moving Choice**; the owner deferred phone, email, address and other details.

The public site at `https://amc-web-three.vercel.app` was verified active on
`01ebe1807fed89c2bcac9d413d3a0ce5010bd288`; the admin/portal at
`https://amc-app-sable.vercel.app/admin` was verified active on
`dd5a29e75f92bcdef77d1a37909b1a0790e6b4f8`. Their backend Git trees are identical;
the five-file #10 change is public presentation only. Production independently reports
**4,681 published guides, including 2,221 routes, plus 67 core/index pages: 4,748 sitemap URLs
across 12 files.** The route hub has 38 pages, 60 results per full page. These are production
content counts, not claims of search-engine indexing or ranking.

The full live crawl fetched **5,296 HTML responses** (4,748 primary pages and 548 deliberately
noindex catalog facets). It found zero broken links, framework failures, primary metadata
duplicates, H1 errors, orphaned primary pages, primary pages deeper than three links, JSON-LD
errors or FAQ mismatches. One special Costs page omitted its sharing image; the follow-up
patch adds the shared metadata helper and distinct accessible table/region labels. Keep the
baseline finding and subsequent targeted closure separate in the proof package. Local browser
checks cover all eight affected desktop/mobile views with zero axe violations in main content.
The full business browser suite passed **63 scenarios**, with one existing empty approval
walkthrough explicitly skipped. Live smoke passed **5/5**, including one fictional request
submitted and then withdrawn; do not rerun that mutating scenario unnecessarily.

The owner explicitly requested removal of the authenticator step. Demo administrators now
use password sign-in only when both `DEMO_MODE` and `DEMO_ADMIN_PASSWORD_ONLY` are true.
Both flags are configured in amc-app Production/Preview. Password checks, rate limits and roles
remain enforced; company and non-demo MFA policies remain intact. The owner signed in to the
live Super admin dashboard successfully without an authenticator. See
`docs/product/demo-admin-sign-in.md`.

The owner approved saving the Supabase server key securely. It is now a sensitive Vercel variable
in `amc-app` Production and Preview. An earlier production build verified live Storage write,
exact-byte public image read and deletion of its own temporary image; its one-time verification
flag is now false. The actual authenticated admin upload was also verified: the owner logo saved
as 800×400 and 1344×672 WebP variants, persisted after fresh navigation, and rejected an identical
duplicate. The library now contains 419 assets; this new unclaimed brand upload changes no page
assignment. Both public variants were fetched anonymously and their image dimensions checked.
No key was saved in source/chat/local files and no new key was created. See `docs/media/storage.md`.

`DEMO_MODE=true` and public `SITE_INDEXABLE=false` remain deliberate: the demo site currently
disallows crawling and uses noindex. Search and ChatGPT citation eligibility are not live-launch
proof. Do not enable indexing while fictional fixtures and the deferred business/launch details
remain. The independent comparison against all six owner examples is subjective **8.3/10**,
not owner acceptance, a perfect-score claim or a prediction of search results. The follow-up
evidence and final release provenance are in the owner proof package.

### Earlier immersive redesign (released 2026-10-29)

The owner rejected the earlier public design and requested a video hero with a right-side
survey on every public page, at least five different relevant images per page, engaging varied
reading layouts with all substantive content retained, topic-specific graphics/motion, the exact
supplied national-map/truck logo, and complete menu/footer discovery of the published catalog.
Public AMC funding promotion is retired; contact permissions and historical evidence remain intact.
The authoritative current visual brief is `docs/design/immersive-experience-brief.md`.

PR **#8** merged the `codex/immersive-site-redesign` framework and searchable `/explore/`
catalog. Home exposes the real published count, a native state-guide map and state/topic search.
Long reference tables keep every record in bounded keyboard-accessible scrollers. Place guides
use real state outlines; tool pages have direct calculator/USDOT entry actions as well as quotes.
Existing exclusively assigned media and uploads retain their ownership; licensed editorial
illustrations may repeat across pages under `docs/media/editorial-reuse.md`.

This is a new visual review, not the earlier deployed pass-2 proof. Comparison against all six
owner-supplied references is recorded separately: 6.1/10, then 7.9/10, then **8.9/10** after the
map, local-context, photo-deduplication, tool-priority and final spacing refinements. The sampled
review was a sample; the owner subsequently identified the issues listed above. Scores are
subjective, not proof of completion. See `docs/design/immersive-verification.md`.

Release candidate `87b16f0` passed both optimized builds, all package typechecks, **527 unit/content/
database checks**, 22 hero/tool browser checks, 30 main-page and 30 populated-guide views on the
optimized build, and all **60 executable full browser scenarios**. Two stale browser assertions
were updated and passed on a focused rerun. One existing empty `test.fixme` for the admin-approval
walkthrough remains explicitly skipped; admin authentication and portal/admin journeys do run.
**Historical application release `5b276b260d8e7707c45096e8a967c7740fb6aca0` was live in both apps.**
Both production targets were checked Ready and active on this exact commit: public
`dpl_7ex6bLPXjhU91zghx3gTkcALnn5f`, portal/admin `dpl_2tTiSrZa2r5jMkTnLWNEeieu1AQk`.
The merged tree exactly matches CI-green review head `333cfbf`; the merge commit's own CI is green.

**Production smoke is 5/5:** Home and full survey on desktop/mobile, health/retired redirects,
all seven published guide families on desktop/mobile, and one fictional request submitted then
withdrawn. The initial run had one old sidebar-selector assertion; its stronger right-side-survey
replacement passed a targeted read-only rerun, without a second request or application change.
**Eight fresh live visual views passed** with all existing image assets loaded, video ready,
no browser errors, no document overflow and no serious/critical axe findings. Both live apps serve
the exact supplied logo bytes. Public sitemaps and catalog independently agree on **2,468 guides
plus 30 core pages across ten sitemap files**, with no duplicate URLs or count mismatches.
The completed baseline crawl inspected 2,976 HTML responses: 2,498 primary pages and 478 noindex
catalog facets. All primary pages passed framework, metadata, link, sitemap and depth checks.
These results predate the active route/card/closing-survey work and do not verify it.

Build logs confirm migrations up to date, seed already loaded, and the completed 2,468-page
bootstrap reused without regeneration. `DEMO_MODE=true` on both apps and `SITE_INDEXABLE=false`
on the public app were checked directly as nonsecret flags. The subsequent approved server-key
configuration and live provider check are recorded in the active follow-up above.

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

**Earlier application release `bbbdfb9` was deployed to both production projects.** Its follow-up
fix makes wide plain-text tables keyboard accessible before hydration and removes redundant tab
stops in mobile card layouts. ZIP attachment now prefers matching GeoNames place/state and a stable
semantic fallback rather than database row order. No production reimport/regeneration was needed.

Baseline verification: **507 unique automated checks passed** (core 84, UI 8, DB 58, server 328,
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
on `amc-app` for Production and Preview. The server key was missing at that earlier checkpoint;
the active follow-up above supersedes it with the approved configuration and successful live
provider check. See `docs/media/storage.md` for its precise scope.

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
| `main` | deployed and verified | PR #8 immersive redesign `5b276b2`, following PR #5, compact repair `c8a3bc0` and table/import fix `bbbdfb9`; later evidence/test-only updates do not change application behavior |
| `codex/immersive-site-redesign` | merged through PR #8 | Video/survey framework, exact logo, illustrated readers, full catalog/map/navigation, privacy-preserving starter and calculator fallback; reviewed head `333cfbf` |
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
  and Preview, together with sensitive `SUPABASE_SECRET_KEY` entries approved by the owner;
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

The current work is the expanded owner brief on `codex/complete-moving-experience`. The baseline
release, compact recovery, production smoke and live Storage protocol check are complete; do not
repeat a repair or download secrets to verify them.

1. **Finish, integrate and release the owner follow-up.** Image-bearing catalog cards and the
   shared before-footer survey have focused verification. The map needs readable state labels,
   inner guides need the improved editorial layouts, and the route expansion must pass unchanged
   quality/evidence/privacy/transport gates before publication. Preserve all existing stored content.
2. **Verify the full admin media journey.** The credential is saved and real provider write/read/
   cleanup passed. A production admin upload, durable DB entry, variants and assignment have not
   yet been exercised in a browser. Do not conflate the provider probe with this remaining journey.
3. **Verify the new release in production.** Run exact-source builds/tests, route publication
   counts and a fresh crawl, then desktop/mobile checks across all page families and the central
   quote flow. Keep the demo/legal boundary until intentionally changed; current settings are
   `DEMO_MODE=true` and `SITE_INDEXABLE=false`, so search discovery remains disabled.
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
