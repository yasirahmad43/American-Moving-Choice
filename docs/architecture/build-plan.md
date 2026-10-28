# Build plan: MVP preview (public site, company portal, admin portal)

**Status:** working build specification, 2026-10-28. It turns the stack recommendation (`stack-and-architecture.md`), the data model (`data-model.md`), the business rules (`docs/business-rules/`), the MVP scope (`docs/product/mvp-scope.md`) and the reference-review implications into one buildable plan. Every implementation agent follows it. Where it departs from the stack document, §12 says why.

**Goal.** A deployed, working preview of all three parts: the public site with the quote survey, the company portal with the marketplace and CRM, and the admin portal. It runs on real infrastructure (Vercel and Supabase Postgres) with demo data. Integrations without credentials run in clearly labeled demo modes (§9).

**Not a launch.** Nothing here is approved for the public. The preview is `noindex`, carries a preview banner, labels every demo company as fictional, and shows content drafts with their review markers.

---

## 1. Repository layout

```
apps/
  web/        @amc/web     Public site (Next.js 16, App Router). Port 3000 locally.
  app/        @amc/app     Company portal (/portal), admin portal (/admin), auth pages, API routes. Port 3001 locally.
packages/
  core/       @amc/core    Pure domain logic (exists): matching, sharing, money, geo types, preview. Adds the cost model, survey schemas, count-option logic and consent rendering.
  server/     @amc/server  Server-only code: env, database access, auth, domain services, adapters (payments, email, FMCSA), jobs.
  ui/         @amc/ui      Design tokens (CSS), Tailwind theme and shared React components.
db/           @amc/db      SQL migrations, seed builder, database tests.
content/                   Markdown drafts rendered by apps/web (see content/README.md).
e2e/          @amc/e2e     Playwright end-to-end tests across both apps.
```

- pnpm workspaces (`pnpm-workspace.yaml` lists `apps/*`, `packages/*`, `db`, `e2e`).
- TypeScript 5.9 (not 7), strict, `noUncheckedIndexedAccess`. Node 22.
- `packages/server` exposes subpath modules through `package.json` `exports` (`"./*": "./src/*/index.ts"`), so code imports `@amc/server/auth`, `@amc/server/leads` and so on. There is no barrel file. Every server module starts with `import "server-only"` except code that tests import directly; those modules keep pure logic in a separate file.
- Next.js apps list `transpilePackages: ["@amc/core", "@amc/server", "@amc/ui"]`.

## 2. Next.js 16 rules

- Read the bundled docs in `node_modules/next/dist/docs/` before using an API you are unsure of. Next 16 changed several conventions.
- `proxy.ts` replaces `middleware.ts`. Use it only for cheap redirects (for example, no session cookie → `/login`). Authorization happens on the server in layouts, pages, server actions and route handlers.
- `params`, `searchParams`, `cookies()` and `headers()` are async.
- Server Components by default. Client Components only for interactive islands (survey stepper, calculator, coverage editor, kanban).
- Mutations use Server Actions with zod validation and `useActionState`. Route handlers (`app/api/**`) are for cron, webhooks, health and the few JSON endpoints a client island needs. They check `Origin` on POST.
- Every page exports metadata. Public pages are server-rendered.

## 3. Styling and UI

- Tailwind CSS 4 with the tokens in `docs/design/visual-direction.md` §5 to §7 as CSS variables (light and dark), mapped into a Tailwind `@theme` in `packages/ui/src/theme.css`. Apps import it and add `@source` for `packages/ui`.
- Fonts: Archivo (variable, width axis) for display and Source Sans 3 for body, self-hosted from the `@fontsource-variable/*` npm packages. No runtime or build-time Google Fonts requests.
- `packages/ui` components (server-safe unless marked client): Button (primary, cta, secondary, ghost, danger), LinkButton, Field (label, help, error), Input, Textarea, Select, Checkbox, RadioCardGroup (client), Card, Badge, Chip, Alert (info, success, warning, error), StatusPill, Table, EmptyState, PageHeader, Container, Section, Breadcrumbs, Stepper, Money (tabular figures, cents in), AbsoluteDate, CredentialRow, Pagination, Dialog (client, native `<dialog>`), Tabs (client), SkipLink, Wordmark.
- VD rules that matter most: CTA red only for starting or sending a quote request; everything else navy or neutral; inputs 16px or larger; 44px touch targets; visible focus rings; tabular figures for money, counts, dates and USDOT numbers; absolute dates; sentence-case headings; no government look-alike imagery.
- Accessibility: WCAG 2.2 AA. Labels on every input, errors linked with `aria-describedby`, keyboard-operable everything, `prefers-reduced-motion` respected.

## 4. Data and database

- Postgres 16 locally, Supabase Postgres 17 in the cloud. Migrations in `db/migrations/NNN_name.sql`, applied in filename order. `001_marketplace_core.sql` exists and stays unchanged.
- **002_platform.sql** adds the tables in §4.1. Later migrations come from slices, in their assigned number ranges (§11).
- Money is integer cents. ZIP codes and FIPS codes are text. Times are `timestamptz`.
- Append-only tables (`verification_checks`, `consent_records`, `audit_log`, `moderation_actions`, `ledger_entries`) get a trigger that rejects UPDATE and DELETE.
- CRM tables use forced row-level security keyed on `current_setting('app.company_id', true)`, like `crm_notes` in 001.
- The app connects as the role that owns the tables, so RLS applies only where it is forced. In Supabase that role is `amc_app` and the objects live in schema `amc`, which the Supabase Data API does not expose (§10).

### 4.1 Tables added in 002

Identity and access:
- `users` (id, email unique lowercased, password_hash, full_name, phone, email_verified_at, mfa_secret_enc, mfa_enabled_at, failed_logins, locked_until, last_login_at, created_at, updated_at)
- `sessions` (id = sha256 hex of the cookie token, user_id, created_at, expires_at, last_seen_at, ip, user_agent, mfa_passed_at, revoked_at)
- `admin_users` (user_id, admin_role in super_admin | ops | verification | finance | content_editor | moderator | support, created_at, created_by)
- `company_memberships` (id, company_id, user_id, role in owner | manager | agent | billing, status active | disabled, can_purchase, invited_by, created_at; unique company_id + user_id)
- `invitations` (id, company_id, email, role, token_hash unique, invited_by, expires_at, accepted_at, revoked_at, created_at)
- `auth_tokens` (id, user_id, purpose in password_reset | email_verify, token_hash unique, expires_at, used_at, created_at)
- `rate_limits` (key, window_start, count; primary key key + window_start)

Companies, verification and coverage:
- `companies` gains address fields, phone, website, billing_status (good | past_due | suspended), stripe_customer_id, is_demo, approved_at, suspended_at, status_reason, updated_at. `company_can_purchase` gains `billing_status = 'good'`.
- `company_status_history`, `company_profiles` (company_id, slug unique, display_name, description, logo_url, website, public_status live | under_review | hidden, network_joined_at, updated_at), `company_capabilities` (move_types, move_sizes, services arrays)
- `coverage_rules` (id, company_id, kind include | exclude, move_types, move_sizes, services, paused, label, timestamps) and `coverage_rule_locations` (rule_id, side origin | destination, level state | county | zip, value). A trigger bumps `companies.coverage_version` on any change to rules, rule locations or capabilities.
- `credentials`, `authority_records`, `verification_checks` (append-only), `badges` (company_id, badge_type, issued_at, revoked_at, reason, evidence_check_ids)
- `rate_cards` (id, company_id, states text[], local jsonb, long_distance jsonb, status active | superseded, submitted_by, created_at). Shapes in §7.3.
- `states` (code, name, slug, fips), seeded with the 50 states and DC.

Leads and consent:
- `leads` gains reference_code unique, status (submitted | rejected | needs_review | qualified | unmatched), move_date, move_date_flexible, move_size, services, origin_city, origin_state, origin_county_fips, dest_city, dest_state, dest_county_fips, distance_miles, move_type, channel_scope, email_hash, phone_hash, risk_score, source_category, manage_token_hash unique, withdrawn_at, profile_company_id.
- `lead_validation_results`, `consent_text_versions` (id, body, sha256, status draft | approved | retired, effective_from, approved_by), `consent_records` (append-only; every field in implications §3.6: rendered text with mover names in order, its sha256, named and removed company IDs, selected limit, channel scope, checkbox state, Terms and privacy versions and states, IP, user agent, page URL, form version, form-state sha256, A/B variant, phone and email hashes, tag-manifest version, submitted_at), `consumer_contact_preferences`, `attribution_touches`.

Marketplace, CRM and billing:
- `crm_records` (id, purchase_id unique, company_id, stage in new | contacted | qualified | quote_sent | follow_up | booked | completed | lost, assignee_user_id, estimated_value_cents, follow_up_at, lost_reason, timestamps) and `crm_activities` (record_id, company_id, type, body, actor_user_id, created_at), both with forced RLS. Notes keep using `crm_notes`.
- `contact_access_log`, `payment_methods` (company_id, provider demo | stripe, provider_pm_id, brand, last4, exp_month, exp_year, authorization_text_version, authorized_by, authorized_at, authorized_ip, is_default, removed_at), `lead_quality_claims`, `disputes`.

Reviews, cases, messages and audit:
- `review_invitations` (purchase_id, company_id, review_type quote_experience | move_experience, requested_by system | company, requested_by_user, token_hash unique, send_after, sent_at, opened_at, completed_at, expires_at), `reviews` (company_id, purchase_id, invitation_id unique, review_type, rating 1–5, title, body, reviewer_display_name, origin_state, dest_state, evidence_level platform_inquiry | verified_customer | completed_move, status pending | published | rejected | removed, incentive_disclosure, rejection_reason, published_at), `review_evidence`, `review_responses`, `review_reports`, `moderation_actions` (append-only).
- `cases` (case_type broker_activity | credential | misconduct | review | privacy | billing | unlisted_contact | other, company_id, reporter contact fields, description, status, assignee, sla_due_at, outcome, timestamps).
- `messages` (outbox: channel email | sms, to_address, template, subject, body_text, related_type, related_id, status queued | sent | demo | failed, provider, provider_ref, error, attempts, created_at, sent_at) and `job_runs`.
- `audit_log` (append-only: actor_type, actor_id, company_id, action, entity, entity_id, before, after, ip, created_at).

Settings and policies seeded by 002: `max_sharing_limit` 5, `sale_window_hours` 72, `local_max_miles` 50, `quote_invite_delay_days` 7, `post_move_invite_days` 21, `rank_min_reviews` 5, `duplicate_window_days` 30, `new_to_network_days` 90, `claim_window_hours` 72, `show_zip_in_preview` false, `active_policy_version` "share-stepdown-v1-proposal" (factors 10000, 8000, 6500, 5500, 5000), `active_consent_version` "consent-v0-draft" (body from consent draft §5, marked draft).

## 5. Server modules (`@amc/server/*`)

| Module | Owns |
|---|---|
| `env` | zod-validated environment (§10) with demo-mode defaults |
| `db` | `pool`, `query`, `one`, `many`, `tx(fn)`, `withCompany(companyId, fn)` (transaction plus `set_config('app.company_id', id, true)`) |
| `auth` | Passwords (bcryptjs, cost 12), sessions (random 32-byte token in an httpOnly, Secure, SameSite=Lax cookie; sha256 stored), current user, guards `requireUser`, `requireMembership({ roles })`, `requireAdmin({ roles })` with MFA enforced for admins, TOTP enrollment and verification (otpauth; secret encrypted with AES-256-GCM using `APP_ENCRYPTION_KEY`), login lockout and rate limits, password reset and invitation tokens, company signup |
| `audit` | `audit({ actorType, actorId, companyId, action, entity, entityId, before, after, ip })` |
| `settings` | Typed getters with defaults; `setSetting` writes the audit log |
| `outbox` | `enqueueEmail`, `enqueueSms`, `deliverPending`. With no provider key, messages are stored with status `demo` and appear in the admin mailbox |
| `geo` | ZIP lookup from the bundled GeoNames dataset (§7.1), haversine distance, state list, counties by state |
| `verification` | FMCSA adapters (fixture and live), `runAutomatedChecks(companyId)`, credential and authority records, eligibility evaluation |
| `leads` | Survey submission, quality checks, duplicate grouping, matching snapshot, consent records, manage-request tokens, withdrawal |
| `marketplace` | Previews (allow-list via `@amc/core` `toPreview`), purchase orchestration around `reserve_purchase` and `complete_purchase`, disclosure, notices |
| `payments` | Provider interface; `demo` and `stripe` providers |
| `crm`, `billing`, `companies`, `coverage`, `profiles`, `rates`, `reviews`, `cases`, `admin`, `jobs` | As named; owned by the slices in §11 |

Rules for all server code:
- Every action that reads or changes company data resolves the user's membership and role on the server and checks the permission matrix in data-model.md §2. Admin actions check the admin role. Never trust IDs from the client without that check.
- Contact details are read only through `lead_contact_for_company`, and each view writes `contact_access_log`.
- No contact data or other personal data in logs, analytics payloads, URLs or error messages.
- Money changes go through the database functions in 001. Never compute a charge in TypeScript and write it directly.
- Every admin decision and settings change writes `audit_log`.

## 6. Auth and roles

- Own auth module (§12). Login by email and password. Sessions last 30 days, rolling, revocable. Logout revokes the session row.
- Admin users must enroll TOTP at first login and pass it on each new session. Company users may enroll; the owner, manager and billing roles see a reminder.
- Lockout: 5 failed logins in 15 minutes locks the account for 15 minutes. Rate limits on login, signup, survey submission, password reset and review submission.
- Company roles follow data-model.md §2. Owners invite members by email link (the invitation email goes to the outbox).
- Password reset by emailed link (outbox). In demo mode the admin mailbox shows it.

## 7. Domain specifics

### 7.1 Geography
- The ZIP dataset comes from the `zipcodes-us` npm package (GeoNames postal code data, CC BY 4.0). A script converts it to `packages/server/data/zip5.json` with `zip → [city, stateCode, countyFips, lat, lng]`. Commit the generated file and record the source and date in `packages/server/data/README.md`. The site footer credits GeoNames.
- Distance is haversine between ZIP centroids. Move type follows `@amc/core` `classifyMove` with `local_max_miles`.

### 7.2 Quote survey
- Steps and order: implications §2.1 (What you need, Where, When, Size and services, What we found, Your details, How many movers, Review and send, Confirmation). Household-move entry points start at Where.
- Nothing preselected. Native inputs. Answers survive back navigation and reloads (session storage plus a server draft is optional).
- What we found: the server runs the matcher before any contact field. It shows the count and, as the recommended default, each mover's name, USDOT number and check date (marked as an owner decision in the copy). With no coverage, it says so and asks for nothing more.
- Count question: options 1 up to min(`max_sharing_limit`, eligible count); higher options shown disabled with the reason; nothing preselected; ST-4a helper text.
- Review and send: request summary, every eligible mover named with USDOT and profile link and a remove control, the chosen maximum, ST-1a, an unticked contact-consent checkbox separate from a Terms and privacy checkbox, and "Send my request". If removals leave fewer movers than the chosen number, the count question returns.
- Submission stores the lead, its group (sale window from settings), the validation results, the consent record and `lead_eligibility` rows with `named_in_consent` true only for the movers shown and not removed. Duplicates within `duplicate_window_days` join the original group (`attach_duplicate`).
- Confirmation: reference code, movers named, maximum, what happens next, the manage-request link and a report link. No timing promise.
- Notices: each eligible company gets a "new request available" email (outbox). Each purchase sends the consumer one email naming the mover, its USDOT number and profile, and saying it paid AMC.

### 7.3 Cost calculator
- Model per the method page (`content/pages/costs/calculator-method.md` once drafted). Local: crew hours by home size × the mover's hourly rate for that crew size + travel fee. Long distance: weight by home size × the mover's rate per hundred pounds for the distance band + packing if selected. Range = 25th to 75th percentile across contributing movers' rate cards, rounded outward (local to $50, long distance to $100). Shown only when at least 5 distinct movers' active rate cards cover the origin state (and the band). Otherwise "not enough data", with the coverage check still offered.
- `rate_cards.local`: `{ "crew_hourly_cents": {"2": n, "3": n, "4": n}, "travel_fee_cents": n, "hours_by_size": {"studio": n, "1br": n, "2br": n, "3br": n, "4br_plus": n}, "crew_by_size": {"studio": 2, …} }`. `rate_cards.long_distance`: `{ "cwt_cents_by_band": {"0_250": n, "250_500": n, "500_1000": n, "1000_1500": n, "1500_plus": n}, "weight_lbs_by_size": {…}, "packing_cents_by_size": {…} }`.
- One model version (`cost-model-v1`) in `@amc/core` feeds the widget, the results view and the survey prefill. A test sends the same inputs through each path and compares.

### 7.4 Marketplace and purchase
- Previews follow lead lifecycle §5 exactly (allow-list; never contact data before purchase).
- Purchase: `reserve_purchase` → if `card_amount_cents > 0`, charge through the payments provider with the attempt ID as the idempotency key → `complete_purchase` → on null, refund through the provider and record it. Then create the `crm_records` row (stage new), log disclosure, and send the consumer notice. A stale snapshot (`eligibility_stale`) re-runs the matcher for that lead and retries once.
- Demo payments: a saved "demo card" with the authorization text from consent draft §9 and its version, charged instantly with reference `demo_<attempt_id>`.

### 7.5 Reviews
- Rules in `content/pages/trust/review-methodology.md` and mover verification §6. Invitations are created by the system (quote experience, `quote_invite_delay_days` after purchase) or by a company request for customers it marks booked or completed (sent by AMC). The form opens only with a valid single-use token. Moderation publishes or rejects with a reason. Ratings are a simple mean per experience type.

## 8. Public site rules

- Preview banner on every page: "Preview build. Not launched; drafts await owner and counsel review. Companies shown are fictional demo data."
- `noindex, nofollow` meta and `X-Robots-Tag` on every response unless `SITE_INDEXABLE=true`. `robots.txt` disallows everything in preview.
- Content pages render from `content/pages/**` by their `url` front matter. Markers render as visible review notes; tokens render from settings or show a clear "pending" placeholder; stored-text comments render nothing. A banner on each content page shows its draft status.
- Demo companies show a "Demo company: fictional" chip on cards and profiles.
- Mover directory slug: `/directory/` (neutral placeholder; site architecture §0 item 9). Badge name renders from `{{badge.name}}`, currently "Preferred Mover · American Moving Choice (name pending)".
- Geo pages publish only when the site-architecture §4.1 gates pass. In the preview none do, so `/movers/` explains coverage and lists no hubs.

## 9. Integrations and demo modes

| Integration | With credentials | Without (preview default) |
|---|---|---|
| Payments | Stripe SetupIntents, off-session PaymentIntents, signed webhooks | Demo card, instant success, `demo_` references |
| Email and SMS | Postmark and Twilio | Stored in `messages` with status `demo`; readable in the admin mailbox |
| FMCSA | QCMobile API with `FMCSA_WEBKEY` | Fixture adapter: fictional USDOT numbers 9000001–9000099 return recorded records; any other number returns "needs manual review" |
| Bot defense | Cloudflare Turnstile | Honeypot, minimum completion time and rate limits |
| Jobs | Vercel Cron calling `/api/cron/*` with `CRON_SECRET` | Same; also run lazily on relevant requests |

## 10. Environments and configuration

Environment variables (both apps unless noted):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (Supabase pooler in the cloud) |
| `DATABASE_SSL` | `require` in the cloud |
| `SESSION_SECRET`, `APP_ENCRYPTION_KEY` | 32-byte secrets (app only) |
| `WEB_URL`, `APP_URL` | Cross-links between the apps |
| `CRON_SECRET` | Protects cron routes (app only) |
| `DEMO_MODE` | `true` in the preview |
| `SITE_INDEXABLE` | `false` in the preview (web) |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `POSTMARK_SERVER_TOKEN`, `TWILIO_*`, `FMCSA_WEBKEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional; their absence selects demo modes |

- Local: Postgres 16 on `localhost:5432` (user `amc`, password `amc`). `pnpm db:reset` recreates `amc_dev` and applies migrations and the seed; tests use their own databases.
- Supabase: project in `us-east-1`; role `amc_app` owns schema `amc`; `ALTER ROLE amc_app SET search_path = amc, public, extensions`. Migrations run as `amc_app` with that search path. The seed SQL is generated locally by `db/seed/build.ts` with demo passwords from environment variables and never committed with real secrets.
- Vercel: projects `amc-web` (root `apps/web`) and `amc-app` (root `apps/app`), linked to the GitHub repository.

## 11. Work split and ownership

| Slice | Owns (directories) | Migration numbers |
|---|---|---|
| F Foundation | Monorepo config, `apps/*` shells (layouts, header, footer, nav, auth pages), `packages/ui`, `packages/server/src/{env,db,auth,audit,settings,outbox,geo,verification}`, `db/migrations/002_platform.sql`, `db/seed/`, `db/test/` additions, CI | 002 to 009 |
| S1 Public shell and content | `apps/web/app/(site)/**` except routes below, content rendering, legal and B2B pages, SEO files | 100s |
| S2 Survey and lead intake | `apps/web/app/(site)/get-quotes/**`, `apps/web/app/(site)/my-request/**`, `packages/server/src/leads/**`, survey schemas in `packages/core/src/survey/**` | 110s |
| S3 Calculator and rate cards | `packages/core/src/cost/**`, `packages/server/src/rates/**`, `apps/web/app/(site)/moving-cost-calculator/**`, `apps/app/app/(portal)/portal/rates/**` | 120s |
| S4 Directory, profiles, public reviews, geo, verify-a-mover | `apps/web/app/(site)/{directory,companies,movers,verify-a-mover}/**`, `packages/server/src/{profiles,reviews,geo-pages}/**` | 130s |
| S5 Company onboarding | `apps/app/app/(portal)/portal/{application,verification,profile,coverage,team,settings}/**`, the portal dashboard, `packages/server/src/{companies,coverage,team}/**` | 140s |
| S6 Marketplace, CRM and billing | `apps/app/app/(portal)/portal/{marketplace,leads,pipeline,billing,reviews}/**`, `packages/server/src/{marketplace,payments,crm,billing}/**`, review responses and company review requests | 150s |
| S7 Admin and operations | `apps/app/app/(admin)/**`, `packages/server/src/{admin,cases,jobs}/**`, `apps/app/app/api/{cron,webhooks,health}/**`, `apps/app/vercel.json` | 160s |

- Each slice works in its own git worktree and branch, edits only its directories, and adds migrations only in its range. If it needs a change elsewhere, it says so in its report instead of making it.
- Navigation for the portal and admin areas is a config file written by F listing every route above, so slices add pages without touching shared layouts.
- Each slice adds tests: unit tests for logic, database tests for SQL, and at least one Playwright scenario for its main flow.

## 12. Departures from the stack document

| Stack document | This build | Why |
|---|---|---|
| Supabase Auth | Own session auth in `@amc/server/auth` | Supabase's default mailer only sends to organization members, so arbitrary signups can't confirm their email without a custom SMTP provider; auth settings can't be changed from this environment. The tables follow data-model.md §2, so moving to Supabase Auth later remains possible |
| Payload CMS | Markdown in `content/` rendered at build time | The drafts are not approved, and the editorial workflow is review in git for now. `content/` stays the import source for Payload |
| Inngest | Vercel Cron plus lazy sweeps | No account yet; the outbox table keeps "commit, then notify" reliable |
| Realtime availability | Refresh and server re-checks on purchase | The server stays authoritative either way (lead lifecycle §5) |
| Postmark, Twilio, Stripe, Turnstile, FMCSA live | Demo modes (§9) | No credentials in this environment; adapters switch on with keys |

## 13. Definition of done

- `pnpm -r typecheck`, `pnpm test` and both app builds pass locally; CI green.
- The Playwright suite passes against a local seeded database: survey to confirmation, no-coverage path, company signup to admin approval (with TOTP), purchase with the demo card revealing contact details and sending the consumer notice, CRM note, review invitation to published review, withdrawal.
- Deployed: both Vercel projects build and serve; the database is migrated and seeded; a smoke test passes on the deployed URLs.
- A final adversarial review (security, privacy, business rules, accessibility, preview safety) finds no open blocker.
