# American Moving Choice

A nationwide moving comparison and lead marketplace. Consumers request quotes, and approved, FMCSA-verified **moving carriers (no brokers)** buy those requests exclusively or shared, then follow up in a built-in CRM.

> **Status: MVP preview in progress.** The foundation (database, server modules, design system, app shells, auth) is built; the feature slices in [docs/architecture/build-plan.md](docs/architecture/build-plan.md) §11 fill in the rest. Not production-ready: financial and consent rules await owner/counsel approval, and no live money or real consumer data is involved.

Start with **[docs/00-discovery-brief.md](docs/00-discovery-brief.md)** and the **[build plan](docs/architecture/build-plan.md)**.

## Repository layout

| Path | Contents |
|---|---|
| `apps/web` | `@amc/web`: public site (Next.js 16). Port 3000 |
| `apps/app` | `@amc/app`: company portal (`/portal`), admin (`/admin`), auth pages, API routes. Port 3001 |
| `packages/core` | `@amc/core`: pure domain logic (matching, shared-lead pricing, preview redaction, geography, dedupe) |
| `packages/server` | `@amc/server`: server-only modules imported as `@amc/server/<module>` (env, db, auth, audit, settings, outbox, geo, verification, …) |
| `packages/ui` | `@amc/ui`: Route Ledger tokens, Tailwind theme, self-hosted fonts and shared React components |
| `db` | `@amc/db`: SQL migrations, demo seed builder, database tests |
| `e2e` | `@amc/e2e`: Playwright scenarios across both apps |
| `content` | Page drafts and stored texts rendered by the public site |
| `docs` | Discovery brief, business rules, architecture, data model, SEO, product, design, research |

## Running locally

Requirements: Node 22, pnpm 10, PostgreSQL 16 (`postgres://amc:amc@localhost:5432`). Environment variables are listed in [.env.example](.env.example).

```bash
pnpm install

# Database: build the demo seed (fictional data) with your own generated passwords, then create
# amc_dev. db:reset uses the superuser amc only to create the database and the non-superuser owner
# role amc_app; migrations, the seed and the apps all run as amc_app, so row-level security applies
# locally exactly as on Supabase.
SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… SEED_MOVER_EMAIL=… SEED_MOVER_PASSWORD=… pnpm db:seed:build
pnpm db:reset   # amc_dev; prints the DATABASE_URL for the apps (postgres://amc_app:amc_app@localhost:5432/amc_dev)

pnpm dev:web    # http://localhost:3000
pnpm dev:app    # http://localhost:3001 (a local seed without SEED_ADMIN_TOTP_SECRET has the admin enroll two-step verification at first sign-in)
```

Checks (the database tests drop and recreate schemas, so `DATABASE_URL` must name a local database ending in `_test`; it is a superuser connection, and `packages/server` creates its own `<name>_server` database owned by `amc_app` next to it):

```bash
pnpm typecheck
DATABASE_URL=postgres://amc:amc@localhost:5432/amc_test pnpm test
pnpm build      # both apps
pnpm e2e        # Playwright, against running apps and a seeded database named *_e2e (see e2e/playwright.config.ts)
```

CI (`.github/workflows/ci.yml`) installs, typechecks, runs the tests with a Postgres 16 service and builds both apps.
