# Deploy runbook: preview environment

**Status:** working runbook for the preview deployment described in `build-plan.md` §10. Secrets never go in this repository.

## 1. Database (Supabase)

1. Create the project (`american-moving-choice`, region `us-east-1`). Wait until it reports healthy.
2. Make the `amc_app` password and its SCRAM verifier locally: `pnpm --filter @amc/db scram-verifier --generate`. Put the password only in the Vercel `DATABASE_URL` values. Run `db/supabase/bootstrap.sql` once as `postgres` with `:'amc_app_verifier'` replaced by the verifier (`SCRAM-SHA-256$4096:…`), never the password, so the password never appears in SQL history, tool transcripts or statement logs. Use the SQL editor or the connector's `execute_sql`, never a recorded migration.
3. Generate the deployment secrets and keep them in the deploy secret store (never in the repository): `HMAC_SECRET`, `SESSION_SECRET`, `APP_ENCRYPTION_KEY`, `CRON_SECRET`, the two demo passwords and the admin's TOTP secret (`SEED_ADMIN_TOTP_SECRET`, base32, at least 32 characters; see `.env.example`).
4. Build the seed with those values, then the bundles:
   ```
   SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… SEED_MOVER_EMAIL=… SEED_MOVER_PASSWORD=… \
   SEED_ADMIN_TOTP_SECRET=… APP_ENCRYPTION_KEY=… HMAC_SECRET=… WEB_URL=https://<public site> pnpm db:seed:build
   pnpm db:bundle:supabase
   ```
   `db:bundle:supabase` refuses a seed that was built by an older builder, has no admin TOTP enrolled, uses the development HMAC secret or a localhost `WEB_URL`, or contains a hash of any password written in the repository. It writes `db/out/supabase/NNN_name.sql` for each migration and `999_seed.sql` for the demo seed, each wrapped in `set local role amc_app; set local search_path = amc, public, extensions;`. Seeding the admin's TOTP closes the first-sign-in window: nobody who learns the password can bind their own authenticator.
5. Apply each migration bundle in filename order as a migration. Load the seed bundle once, after the last migration.
6. Check that `select email, mfa_enabled_at is not null from amc.users join amc.admin_users on user_id = id` shows the admin enrolled before the URL is shared with anyone.
7. Check the security advisors. AMC objects live in schema `amc`, which the Data API does not expose.

**Connection string.** The app connects through the Supabase connection pooler in transaction mode, as `amc_app`:

```
postgres://amc_app.<project-ref>:<password>@<pooler-host>:6543/postgres
```

The pooler host is shown in the project's connection settings (for example `aws-0-us-east-1.pooler.supabase.com`). Set `DATABASE_SSL=verify` and `DATABASE_SSL_CA` to Supabase's CA certificate (PEM, downloadable from the project's database settings; literal `\n` sequences are accepted), so the connection is encrypted and the server is authenticated. `require` encrypts without checking the certificate and is open to an active man-in-the-middle; production refuses `disable` for any host other than localhost. Prepared statements are not used, so transaction mode is safe.

## 2. Hosting (Vercel)

Two projects linked to the GitHub repository, both building with pnpm from the repository root:

| Project | Root directory | Serves |
|---|---|---|
| `amc-web` | `apps/web` | Public site |
| `amc-app` | `apps/app` | Company portal, admin portal, auth pages, cron and webhook routes |

Environment variables (preview and production):

| Variable | `amc-web` | `amc-app` |
|---|---|---|
| `DATABASE_URL`, `DATABASE_SSL`, `DATABASE_SSL_CA` | yes | yes |
| `HMAC_SECRET` (rate-limit keys and contact hashes; same value as the seed build) | yes | yes |
| `WEB_URL`, `APP_URL` | yes | yes |
| `DEMO_MODE=true` | yes | yes |
| `SITE_INDEXABLE=false` | yes | — |
| `APP_ENCRYPTION_KEY` (the web app seals the manage link in the confirmation email; same value in both) | yes | yes |
| `SESSION_SECRET`, `CRON_SECRET` | — | yes |
| Optional provider keys (Stripe, Postmark, Twilio, FMCSA, Turnstile) | as needed | as needed |

Cron jobs are declared in `apps/app/vercel.json` and call `/api/cron/*` with `Authorization: Bearer $CRON_SECRET`.

## 3. Smoke test after each deploy

1. `GET {APP_URL}/api/health` reports the database reachable and the migration count.
2. The public home page, a trust page and `/directory/` render with the preview banner and `noindex`.
3. A survey from 75201 to 77002 reaches "What we found" with demo movers.
4. The seeded admin can sign in and is asked for a TOTP code (`/mfa`, not `/mfa/setup`: the seed enrolled it), and passes with the owner's authenticator.
5. The seeded mover owner can sign in and sees the marketplace.

The Playwright suite can run as this smoke test against the deployed URLs (`E2E_WEB_URL`, `E2E_APP_URL`, the `SEED_*` values) with `DATABASE_URL` unset: its database steps (rate-limit resets, TOTP resets, mailbox reads) only ever run against a local `*_e2e` or `*_test` database.

## 4. Demo accounts

The seed creates one admin and one demo mover owner from `SEED_*` environment variables at build time. The passwords are generated for each deployment and kept in the deploy secret store; no password written in this repository is accepted by the seed builder. The admin's TOTP secret is enrolled by the seed, so only whoever holds that secret (the owner's authenticator) can pass the second step. Share the credentials only with the owner, and rotate the passwords (and re-enroll TOTP) before anyone else gets access. A lost authenticator is reset by a super admin (`resetUserMfa` in `@amc/server/auth`, which signs out every session and writes the audit log).
