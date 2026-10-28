# Deploy runbook: preview environment

**Status:** working runbook for the preview deployment described in `build-plan.md` §10. Secrets never go in this repository.

## 1. Database (Supabase)

1. Create the project (`american-moving-choice`, region `us-east-1`). Wait until it reports healthy.
2. Generate a password for the `amc_app` role and run `db/supabase/bootstrap.sql` once as `postgres`, with the password filled in. Use the SQL editor or the connector's `execute_sql`, never a recorded migration.
3. Build the bundles locally: `pnpm db:bundle:supabase`. It writes `db/out/supabase/NNN_name.sql` for each migration and `999_seed.sql` for the demo seed, each wrapped in `set local role amc_app; set local search_path = amc, public, extensions;`.
4. Apply each migration bundle in filename order as a migration. Load the seed bundle once, after the last migration.
5. Check the security advisors. AMC objects live in schema `amc`, which the Data API does not expose.

**Connection string.** The app connects through the Supabase connection pooler in transaction mode, as `amc_app`:

```
postgres://amc_app.<project-ref>:<password>@<pooler-host>:6543/postgres
```

The pooler host is shown in the project's connection settings (for example `aws-0-us-east-1.pooler.supabase.com`). Set `DATABASE_SSL=require`. Prepared statements are not used, so transaction mode is safe.

## 2. Hosting (Vercel)

Two projects linked to the GitHub repository, both building with pnpm from the repository root:

| Project | Root directory | Serves |
|---|---|---|
| `amc-web` | `apps/web` | Public site |
| `amc-app` | `apps/app` | Company portal, admin portal, auth pages, cron and webhook routes |

Environment variables (preview and production):

| Variable | `amc-web` | `amc-app` |
|---|---|---|
| `DATABASE_URL`, `DATABASE_SSL` | yes | yes |
| `WEB_URL`, `APP_URL` | yes | yes |
| `DEMO_MODE=true` | yes | yes |
| `SITE_INDEXABLE=false` | yes | — |
| `SESSION_SECRET`, `APP_ENCRYPTION_KEY`, `CRON_SECRET` | — | yes |
| Optional provider keys (Stripe, Postmark, Twilio, FMCSA, Turnstile) | as needed | as needed |

Cron jobs are declared in `apps/app/vercel.json` and call `/api/cron/*` with `Authorization: Bearer $CRON_SECRET`.

## 3. Smoke test after each deploy

1. `GET {APP_URL}/api/health` reports the database reachable and the migration count.
2. The public home page, a trust page and `/directory/` render with the preview banner and `noindex`.
3. A survey from 75201 to 77002 reaches "What we found" with demo movers.
4. The seeded admin can sign in and is sent to TOTP enrollment.
5. The seeded mover owner can sign in and sees the marketplace.

## 4. Demo accounts

The seed creates one admin and one demo mover owner from `SEED_*` environment variables at build time. Share their credentials only with the owner, and rotate them before anyone else gets access.
