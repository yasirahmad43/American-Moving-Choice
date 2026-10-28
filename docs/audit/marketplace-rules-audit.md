# Marketplace rules audit

**Date:** 2026-10-28 · **Branch audited:** `claude/fervent-bohr-u9rg4y` (commit `a630271`) · **Mode:** read-only code audit plus a local test run and SQL probes. No application code was changed.

**Sources of truth:** `docs/business-rules/lead-lifecycle-and-purchase-rules.md` (LL), `docs/business-rules/shared-pricing-and-credits.md` (SP), `docs/business-rules/mover-verification-and-reviews.md` (MV), `docs/business-rules/consent-and-disclosure-copy-draft.md` (CD), `docs/product/mvp-scope.md` (MVP), `docs/architecture/build-plan.md` (BP).

**Implementation audited:** `db/migrations/*.sql`, `packages/core/src`, `packages/server/src/{marketplace,payments,billing,crm,leads,admin,companies,team,auth,jobs,reviews-company}`, `apps/app/app/**`, `apps/web/components/survey/**`, `content/pages/trust/**`.

## How the evidence was gathered

| Method | What ran | Result |
|---|---|---|
| Full workspace tests | `DATABASE_URL=postgres://amc:amc@localhost:5432/amc_audit_test pnpm -r test` | **All green:** `@amc/core` 76/76, `@amc/ui` 4/4, `@amc/db` 58/58 (`purchase.test.ts` 17, `platform.test.ts` 30, `seed.test.ts` 11), `@amc/server` 263/263 across 21 files (incl. `marketplace.test.ts`, `payments.test.ts`, `crm-billing.test.ts`, `admin.test.ts`, `jobs.test.ts`). Exit 0. |
| SQL probes | Scratch DB `amc_probe_test` with every migration applied; probes in this document are reproduced inline | See §3 (formula), §4 (concurrency/idempotency), §5 (isolation) |
| Static review | Every file listed above, plus greps for contact columns, logging, realtime mechanisms, payouts and content-admin routes | Cited as `file:line` below |

Status key: **PASS** implemented and evidenced · **PARTIAL** implemented with a gap against the written rule · **FAIL** contradicts the written rule · **NOT IMPLEMENTED** absent.

## 1. Results table

| # | Requirement | Status | Key evidence |
|---|---|---|---|
| C1 | Consumer survey collects origin, destination, date, size, services, contact, requested quote count | PASS | `packages/core/src/survey/types.ts:8` (`SURVEY_STEPS` = need, where, when, size, found, details, count, review); server re-validates every step in `packages/server/src/leads/submit.ts:142-149`; `schemas.ts:29-59` |
| C2 | Explains which companies may receive the request | PASS | Coverage pre-check before contact fields `leads/coverage.ts:235`, `submit.ts:153-163`; consent heading names every mover with USDOT `packages/core/src/survey/consent.ts:117-121`; confirmation lists movers `apps/web/components/survey/confirmation-view.tsx:64-70`; email `leads/messages.ts:53-56`; per-purchase notice names the buyer `marketplace/purchase.ts:259-280` |
| C3 | Preserves the chosen contact-sharing limit | PASS | `leads.selected_limit`, `lead_groups.sharing_limit` (`001:79,89`); `attach_duplicate` keeps the lowest limit `001:113-121`; `isSelectableCount` `submit.ts:186`; `consent_records.selected_limit` append-only `002:528-566,881`; tests *duplicate consumer submission cannot widen the sharing limit* (db), *joins a repeat request … keeps the lowest limit* (server) |
| C4 | Participating companies are approved movers with verified USDOT and MC | PASS | `company_can_purchase` `002:179-186` (approved, billing good, no broker, USDOT not null, MC unless `require_mc_number` off, credentials unexpired) used by the matcher `coverage.ts:107`, the listing `listing.ts:106` and `reserve_purchase` `001:239`; approval refuses unless every check incl. `usdot_active`, `authority_type` passes `admin/companies.ts:573-577`, `verification/eligibility.ts:57-65`; weekly recheck and auto-suspend `jobs/jobs.ts:201-220,307-341` |
| C5 | Brokers excluded (broker authority ⇒ rejected) | PASS | `has_broker_authority` blocks purchase `001:44`; application rejects the broker fixture (test *rejects the broker fixture (USDOT 9000090)*); directory hides brokers `profiles/queries.ts:94`; recheck suspends on broker authority `jobs.ts:324`; db test *brokers, unapproved and expired-credential companies cannot purchase* |
| P1 | Eligible leads filterable nationwide / state / ZIP / directional origin→destination | PARTIAL | Filters: origin state, destination state (directional when both set), dates, size, type, source `marketplace/listing.ts:25-33,119-127`; UI `apps/app/app/(portal)/portal/marketplace/page.tsx:22-90`. **No ZIP filter; "nationwide" is only the absence of a filter.** |
| P2 | Pre-purchase preview shows only first name, origin, destination, move date, size, source, lead type, price, availability; no surname/email/phone leak in HTML, JSON, logs | PASS | Allow-list `packages/core/src/preview.ts:46-65`; `LISTING_SQL` selects no contact column `listing.ts:88-110`; card `apps/app/components/portal/marketplace/lead-card.tsx`; client props `buyer.ts:dialogProps` carry first name + route only; mover notice has no name at all `leads/messages.ts:76-92`; DB errors stripped of row values `db/pool.ts:96-128` (test *never carry row values*); `console.error` calls log names/codes only; test *never contains contact details, surname, address or notes* (`core/test/misc.test.ts`). Note: the card also shows move type and requested services, which LL §5 lists neither as allowed nor forbidden. |
| P3 | Availability and purchase status update in real time | NOT IMPLEMENTED | Mechanism is **page load / manual "Refresh" link** (`marketplace/page.tsx:106-109,136`); no polling, SSE or websocket anywhere in `apps/app` (grep). BP §12 records this as a deliberate departure ("Refresh and server re-checks on purchase"). The server stays authoritative: a stale Buy fails cleanly (`messages.ts:32-35`, `purchase_in_progress` retry `purchase.ts:96-100`). |
| P4 | Protected contact revealed only after a successful, authorized purchase | PASS | `lead_contact_for_company` joins `purchases` + `disclosures` `001:380-387`; `disclosures` row is written only inside `complete_purchase` `001:354`; CRM reads only through that function and logs `contact_access_log` `crm/records.ts:329-340`; role check `permissions.ts:34-54`; tests *failed payment releases the slot and reveals nothing*, *withdrawal during an in-flight payment prevents disclosure*; probe §5 |
| P5 | Purchased-lead history, notes, stages, pipeline, team access | PASS | `crm/records.ts` (stages `CRM_STAGES:12`, notes, activities, assignment, follow-up, value, lost reason); pipeline `groupByStage:537`; agents see only assigned records `records.ts:101,266`; team roles and purchase toggle `team/team.ts`, `companies/permissions.ts`; tests in `crm-billing.test.ts`, `team.test.ts` |
| B1 | Company-specific exclusive and shared prices | PASS | Append-only `company_prices` + `current_price` `001:51-64`; admin `setCompanyPrice` `admin/companies.ts:710-733`; snapshot on purchase `001:280-284,330-331`; test *historical purchases keep their pricing after admin price changes* |
| B2 | Two companies cannot buy the same exclusive lead (concurrency) | PASS | `lead_groups … for update` `001:241`; partial unique index `one_active_attempt_per_group` `001:152`; `unique (group_id, company_id)` and `unique (group_id, position)` on `purchases` `001:167-168`; race tests *two companies race for one exclusive lead: exactly one succeeds* and *many concurrent buyers never exceed the cap* passed in this run |
| B3 | Exclusive lead removed from others' inventory after purchase | PASS | `complete_purchase` sets `sold_out` at the cap `001:356-358`; listing requires `status='available'` and `count < sharing_limit` `listing.ts:107-110`; server test *a second company finds it sold out* |
| B4 | Shared lead buyer/contact limit enforced | PASS | `n_sold >= sharing_limit ⇒ sold_out` `001:259-260`; `complete_purchase` re-checks `position > sharing_limit` after a duplicate lowered it `001:313`; distinct companies, not seats `001:167`; 8-buyer race test |
| B5 | Credit-back policy when another company buys a shared lead — formula identical to SP §4 | PASS | See §3. SQL `001:272` and `001:345-346` are exactly `E_i(n)=round_half_up(P_i·f(n))`, charge `E_k(k)`, credit `E_i(k−1)−E_i(k)`; factors seeded 100/80/65/55/50 `002:1012`; probe reproduces SP §5 rounding example cent-for-cent. No divergence found. |
| B6 | Accurate charges / credits / receipts / ledger | PASS | Append-only `ledger_entries` with unique `dedupe_key` `001:185-195,002:887`; balance view `001:197-201`; receipts and ledger in portal `billing/billing.ts:116-188`; admin ledger, adjustments, refunds capped at net paid (`refund_purchase` `001:364-376`, `finance.ts:155-158`); reconciliation views `finance.ts:469-508,596-623` |
| B7 | Saved billing methods distinguished from payout accounts | PASS (N/A) | Only `payment_methods` exist (`002:659-676`) with authorization text/hash (`150:53-58`); movers only buy, so there are no payout accounts by design (MVP §1 non-goal; grep for payout/Connect: none). UI labels them "Payment method" `portal/billing/page.tsx:34-37`. |
| B8 | Duplicate charge / repeated payment-event protection | PASS | `unique (company_id, idempotency_key)` and early return `001:148,235-236`; Stripe idempotency key per attempt `payments/stripe.ts:89-90,131,157`; `payment_ref unique` `001:145`; `complete_purchase` idempotent `001:305-306`; `record_payment_event` `001:209-215` + dedupe row removed on failure for retry `payments/webhook.ts:135-138`; webhook verifies amount/currency/company/known ref `webhook.ts:42-58`; tests *repeated clicks and repeated payment notifications create no duplicate effects*, *completes a processing purchase … once*. Minor gap: key not scoped to the lead (§4.2). |
| A1 | Admin receives/manages leads | PASS | `admin/leads.ts` list (no contact columns `:50-78`), detail with consent/validation/eligibility (audited view `:188`), approve/reject/withdraw/expire `:223-308`; held leads cannot be reserved `115_hold_review_leads.sql` |
| A2 | Admin approves/manages companies | PASS | Verification queue, check decisions, callback check, approve/reject/suspend/reinstate, price set, description moderation `admin/companies.ts`; one approved company per USDOT (test) |
| A3 | Admin: coverage, pricing, distribution, purchases, billing, credits, disputes | PARTIAL | Pricing ✓ (`companies.ts:710`, `/admin/pricing`), purchases ✓ (`/admin/purchases`), billing/credits/refunds/claims/disputes ✓ (`finance.ts`, `/admin/billing`). **Coverage is read-only** in the company detail (`companies.ts:300-305`); there is no admin control over distribution (which movers a lead is offered to is matcher + consent only, no admin override/re-match). Daily reconciliation *report* (LL §7.7, MVP M7) is an on-demand page, not a job. |
| A4 | Preferred-mover listing criteria documented and enforced | PASS | Documented: `content/pages/trust/how-we-verify-movers.md` §"What does the badge mean?" (lines 212-225), explainer component on every profile `apps/web/components/directory/badge-explainer`. Enforced: badge issued only when every check type passed `admin/companies.ts:499-510`, DB trigger `badges_check_evidence` `002:402-415`, revoked on suspension `companies.ts:650-654`, listing requires approved + live + not suspended + no broker `profiles/queries.ts:94`. Badge *name* still pending owner (`{{badge.name}}`). |
| A5 | Genuine reviews; review requests not selectively solicited | PARTIAL | Platform sends every invitation (`jobs.ts:72-99,133-196`); company requests are logged and sent by AMC (`reviews-company/reviews.ts:174-209`); evidence labels enforced (`admin/reviews.ts:49-66`, DB check *publishes move-experience reviews only with completed-move evidence*); companies cannot edit/delete; moderation append-only. **Missing:** monitoring of selective-invitation patterns / per-company invitation coverage and audit trigger (MV §6 "Collection"; the methodology page itself carries a `[Build: …]` marker at line 91). |
| A6 | Access permissions and company data separation (RLS / membership checks); cross-company read attempt | PASS | Every service resolves membership from the DB (`marketplace/permissions.ts:71-83`); CRM runs inside `withCompany` with forced RLS (`002:620-645`, `001:398-403`); probe §5: company B sees 0 of A's `crm_records`/`crm_notes`, cannot insert against A's purchase, and `lead_contact_for_company` returns nothing for a non-buyer. No cross-company read found via `/portal/leads/[purchaseId]` (filtered by `company_id` `records.ts:260`), `/portal/marketplace/[groupId]` (`listing.ts:253-256`), billing (`billing.ts:116-119`), reviews (`reviews.ts:36-38`). Caveat in §5.2 (superuser bypasses RLS). |
| X1 | Content / media / research / publication-status admin features | NOT IMPLEMENTED | See §7 |

## 2. Consumer side: notes

- The sharing-limit question offers 1…`max_sharing_limit` with options above the eligible count disabled and nothing preselected (`packages/core/src/survey/count-options.ts`, test *offers 1 to the admin maximum and disables numbers above the movers available*).
- The consent record stores the rendered text (movers named in order), its sha256, named and removed company IDs, limit, channels, checkbox states, IP, UA, page URL, form version/state hash, A/B variant, hashes (`002:528-566`); the server re-renders and compares the hash before accepting (`submit.ts:191-195`, test *asks again when the consent text the consumer saw no longer matches*).
- Eligibility snapshot: removed movers get `named_in_consent=false` and can never buy (`submit.ts:340-365`; db test *only movers named to the consumer at submission can buy*).
- Owner decision flagged in code: a repeat submission's consent **replaces** the group's named list (`submit.ts:341-350`). Not a rule violation, but LL §4 does not state this behaviour.
- Standalone vehicle-only and truck-rental intents never reach the contact step (`submit.ts:141`), per MVP §6.

## 3. Shared-pricing formula: spec vs implementation

| Element | SP §4 (spec) | Implementation | Match |
|---|---|---|---|
| Effective cost | `Eᵢ(n) = round_half_up(Pᵢ × f(n))` in integer cents / basis points | `floor((price::bigint * factors[pos] + 5000) / 10000)` `db/migrations/001_marketplace_core.sql:272`; TS `applyBasisPoints` `packages/core/src/money.ts:9` is the same expression | ✓ |
| k-th buyer's charge | `E_k(k)` | `charge := …factors[pos]…` with `pos = n_sold + 1` `001:261,272` (refunded purchases still count toward position, SP §6 "slot never reopened") | ✓ |
| Credits on purchase k | every earlier buyer i<k gets `Eᵢ(k−1) − Eᵢ(k)` from its **own snapshotted** price | loop over `purchases … position < a.position and refunded_at is null`, `credit := E(prior.list_price_cents, factors[a.position−1]) − E(…, factors[a.position])` `001:344-351`; `list_price_cents` is the snapshot, never `current_price` | ✓ |
| Factor schedule | 100 / 80 / 65 / 55 / 50 % (proposal) | `sharing_policies('share-stepdown-v1-proposal', {10000,8000,6500,5500,5000})` `002:1012-1013`; `LAUNCH_POLICY_PROPOSAL` `sharing.ts:21-24` | ✓ |
| Posted atomically with the triggering purchase; failed attempts post nothing | yes | inside `complete_purchase`'s transaction; `fail_purchase` writes no ledger rows `001:289-292` | ✓ |
| Refunded buyer stops accruing | yes | `refunded_at is null` filter `001:344`; db test *a refunded buyer stops accruing sharing credits* | ✓ |
| Policy pinned per lead at creation | yes | `lead_groups.policy_version` set from the active setting at submission `submit.ts:270-273`; purchases record `policy_version` `001:331` | ✓ |
| Credits never exceed charge | yes | guaranteed by non-increasing factors (`validatePolicy` `sharing.ts:26-34` on the admin path); SQL only checks `factors_bp[1]=10000` `001:68` (see fix F9) | ✓ (soft) |

**Probe (odd prices from SP §5 "Rounding example", policy 100/80/65):**

```
X $33.33  charged 3333  credits 1167  net 2166   (exact 65% = 2166.45)
Y $29.99  charged 2399  credits  450  net 1949   (exact 65% = 1949.35)
Z $40.01  charged 2601  credits    0  net 2601   (exact 65% = 2600.65)
```

Identical to the document's table. The db test *credits follow the approved formula with different company prices and rounding* and core `sharing.test.ts` (8 tests) also pass. **Verdict: no divergence; B5 is PASS.**

## 4. Concurrency and idempotency

### 4.1 Exclusive race (proven)
`reserve_purchase` takes `select … from lead_groups where id = $1 for update` (`001:241`) so reservations on one lead serialize; a second in-flight reservation is refused with `purchase_in_progress` (`001:255-257`) and structurally impossible via the partial unique index `one_active_attempt_per_group` (`001:152`). Completion is protected again by `unique (group_id, position)` and `unique (group_id, company_id)` (`001:167-168`). The race tests in `db/test/purchase.test.ts:63-100` (`Promise.allSettled` of 2 and 8 concurrent buyers) passed in this run.

### 4.2 Idempotency key is not scoped to the lead (probe)
`reserve_purchase` returns an existing attempt by `(company_id, idempotency_key)` only (`001:235-236`). Probe: company X reserved group A with key `same-key`, then called `reserve_purchase(X, group B, 'same-key')` and received **group A's attempt**. `purchase()` in `marketplace/purchase.ts:85-121` does not check `attempt.group_id === input.groupId`. The client generates a fresh UUID per dialog opening (`purchase-dialog.tsx:58-61`), so this is not reachable from the shipped UI, but a client bug or API reuse would report success for the wrong lead. Severity: Low (no double charge; wrong-lead confusion only).

### 4.3 Webhook replay
`record_payment_event` returns false on redelivery (`001:209-215`); on a processing error the row is deleted so Stripe's retry re-runs idempotent steps (`webhook.ts:135-138`). The handler refuses intents whose amount, currency, company or known reference disagree with the attempt (`webhook.ts:42-58`). Tests: *completes a processing purchase from payment_intent.succeeded, once*; *refuses an intent whose amount or company doesn't match*.

### 4.4 Sale window at completion (probe, informational)
`complete_purchase` does not re-check `lead_groups.expires_at`: a reservation made 1 s before the window closed was honoured 1.2 s later. This is consistent with "reserve inside the window", but LL §7 does not state it. No fix required; documented for the owner.

## 5. Data separation: cross-company read attempts

### 5.1 Probe as the application role (non-superuser, like `amc_app`)
With `set local role amc_probe_app` and `set_config('app.company_id', B)`: `select count(*) from crm_records` → **0** (A's record hidden); `crm_notes` → **0**; inserting a `crm_records` row for A's purchase as B → **`new row violates row-level security policy`**; with no company context → 0 rows; `lead_contact_for_company(group, random uuid)` → 0 rows; for the real buyer B → 1 row. The server always wraps CRM access in `withCompany` (`db/pool.ts:196-206`) after `resolveActor`.

### 5.2 Caveat found while probing
Run as the local superuser `amc`, the same probe returned A's rows to B: **superusers bypass RLS**. The deployed role must be the non-superuser table owner (`amc_app`, BP §4) — FORCE RLS then applies — and must never be given `BYPASSRLS`. Recommend a startup assertion (fix F8).

### 5.3 Other company-scoped tables
`payment_methods`, `ledger_entries`, `purchases`, `lead_quality_claims`, `review_*` have no RLS; isolation relies on the explicit `company_id = actor.companyId` filters in the services (all verified present). This matches BP §4 ("RLS only where forced") but is single-layer. See F10.

## 6. Payments: additional notes

- Charge path: `reserve_purchase → provider.charge(idempotencyKey = attempt id) → complete_purchase → finalizePurchase`, refund via `refundUnhonoured` when completion returns null (`purchase.ts:70-216`). Fully credit-funded purchases skip the provider (`:174-176`).
- `release_expired_attempts` (`001:218-225`) does **not** ask Stripe whether a PaymentIntent is still processing (LL §7.4 says the production sweeper should). The late-success path (`001:318-326`) mitigates it by honouring a late success when the slot is still free and refunding otherwise; `payments.test.ts` covers the refund. Severity Low (F5).
- Cron jobs run once a day (`apps/app/vercel.json`); `deliver-outbox` therefore sends queued mover "new request available" notices up to 24 h late unless a request handler happens to call `deliverPending` (only the purchase action and auth actions do: `portal/marketplace/actions.ts:23-29`). In demo mode nothing leaves the system, so this only matters for a live deployment (F6).
- Disputes from Stripe pause purchasing (`billing_status='past_due'`, `webhook.ts:104`) per SP §6; admin-recorded disputes can suspend and auto-restore (`finance.ts:368-442`).

## 7. Content / media / research / publication-status admin features

Expected to be missing and confirmed missing:

| Feature | Status | Evidence |
|---|---|---|
| Content page editing / CMS in admin | NOT IMPLEMENTED | Content is Markdown in `content/pages/**` rendered at build (BP §12 "Payload CMS → Markdown"); no `/admin/content*` route (`apps/app/lib/nav/admin.ts` lists none) |
| Publication-status workflow (draft → review → published) in admin | NOT IMPLEMENTED | Status lives in front matter; `e2e/tests/content.spec.ts:44` checks unpublished pages 404; no admin UI |
| Media library / asset management | NOT IMPLEMENTED | No routes, tables or server module (`grep -ri "media library"` empty); `docs/media/` is an untracked docs folder |
| Research / editorial-review tooling (authors, reviewers, sources) | NOT IMPLEMENTED | Tokens `page.author`, `page.reviewer` are unresolved placeholders in `content/pages/trust/*.md`; no admin feature |
| `content_editor` admin role | Role exists, no pages | `admin/platform.ts:192-202`, `admin_users` check `160:72-73`; `adminNavFor('content_editor')` yields only the dashboard |

## 8. Prioritized fix list

| # | Severity | Finding | File(s) | Suggested change |
|---|---|---|---|---|
| F1 | **Medium** | P3: no real-time availability/purchase-status updates (LL §5 "Real-time updates carry only lead ID, status and buyer count"; MVP M5 "realtime availability") | `apps/app/app/(portal)/portal/marketplace/page.tsx`, `packages/server/src/marketplace/listing.ts` | Add a minimal route handler `GET /api/portal/marketplace/status?groupIds=…` returning `{groupId, status, buyerCount, inProgress}` only (membership-checked), and a client island that polls every 10–15 s (or SSE) and marks cards sold/in-progress. Keep `reserve_purchase` authoritative. |
| F2 | **Medium** | P1: no ZIP filter and no explicit "nationwide" filter | `marketplace/listing.ts:25-33,119-127`, `marketplace/page.tsx:22-90` | Add `originZip`/`destZip` (5-digit, validated) and an explicit scope selector (Nationwide / State / ZIP / Route) that maps onto the existing state/ZIP predicates; add a listing test. |
| F3 | **Medium** | A5: no monitoring of selective review-invitation requests (MV §6; `review-methodology.md:91` `[Build: …]`) | `packages/server/src/admin/reviews.ts`, `jobs/jobs.ts` | Add an admin "invitation coverage" view per company: booked/completed CRM records vs company-requested `review_invitations`; open a `cases` row when coverage < threshold; audit it. |
| F4 | **Medium** | A3: admin cannot manage coverage or lead distribution (MVP M10 "coverage…distribution") | `packages/server/src/admin/companies.ts`, `apps/app/app/(admin)/admin/companies/[id]/page.tsx` | Add audited admin actions to pause/unpause a company's coverage rules and to re-run the matcher for a lead group (`refreshEligibility` per named company). Document that consent scope never widens. |
| F5 | Low | `release_expired_attempts` does not consult Stripe before expiring a reservation (LL §7.4) | `db/migrations/001:218-225`, `packages/server/src/jobs/jobs.ts:53-56` | In `releaseExpiredAttempts`, for attempts with a `payment_charges.status='processing'` Stripe row, retrieve the PaymentIntent first; expire only if not `processing`. |
| F6 | Low | Outbox delivery is daily; mover "new request" notices and consumer confirmations can lag up to 24 h in a live deployment | `apps/app/vercel.json`, `apps/web/app/(site)/get-quotes/actions.ts`, `packages/server/src/admin/leads.ts:315-341` | Call `deliverPending` via `after()` from the survey submit action and the admin approve action (as the purchase action already does), or raise the cron cadence when the plan allows. |
| F7 | Low | §4.2: idempotency key not scoped to the lead; `purchase()` does not verify the returned attempt belongs to the requested group | `db/migrations/001:235-236`, `packages/server/src/marketplace/purchase.ts:85-121` | In `purchase()`, after `reserve`, `if (attempt.group_id !== input.groupId) return fail("unknown")`; optionally raise `idempotency_key_reused` in SQL when the stored attempt's `group_id` differs. |
| F8 | Low | §5.2: RLS is silently bypassed when the app connects as a superuser/BYPASSRLS role (true for the local `amc` user) | `packages/server/src/db/pool.ts`, `db/scripts/reset.ts` | On pool creation in production, assert `select rolsuper or rolbypassrls from pg_roles where rolname = current_user` is false and refuse to start; create a non-superuser `amc_app` locally in `pnpm db:reset`. |
| F9 | Low | `sharing_policies` only checks `factors_bp[1]=10000`; a non-increasing schedule (SP §4 "credits can never exceed what the buyer was charged") is enforced only in TS | `db/migrations/001:66-70` | New migration: `check (… every factor ≤ previous and ≤ 10000)` via a small immutable SQL function. |
| F10 | Low | Isolation of `payment_methods`, `ledger_entries`, `purchases`, `lead_quality_claims` relies solely on service-layer filters (no RLS) | `db/migrations/002`, `packages/server/src/{billing,payments}` | Either extend forced RLS keyed on `app.company_id` to these tables and run billing/payment reads inside `withCompany`, or add a security test that each service refuses a foreign `companyId`. |
| F11 | Low | No scheduled daily reconciliation report (LL §7.7, MVP M7); reconciliation exists only as admin pages | `packages/server/src/jobs/jobs.ts`, `admin/finance.ts:469-623` | Add a `reconciliation_report` job that runs `reconciliation({onlyIssues:true})` and `chargeReconciliation` daily and enqueues a summary email to finance admins; record in `job_runs`. |
| F12 | Info | Preview shows move type and requested services, which LL §5 does not list | `apps/app/components/portal/marketplace/lead-card.tsx:62-72` | Either add "move type, requested services" to LL §5's allowed list or drop them from the card. Recommend documenting (they are not sensitive). |
| F13 | Info | Repeat submission's consent replaces the group's named list (owner decision pending in code) | `packages/server/src/leads/submit.ts:340-350` | Record the owner's decision in LL §4 and keep or change the behaviour accordingly. |
| F14 | Info | `complete_purchase` does not re-check the sale window (§4.4) | `db/migrations/001:297-360` | State in LL §7 that a reservation made inside the window may complete after it closes; otherwise add `g.expires_at < now()` to the refusal branch and refund. |

## 9. Items verified PASS with no action

Lead type fixed at submission (`preview.ts:60`, `001:282`); withdrawal removes inventory and blocks in-flight completion with automatic refund (`001:124-127,313-316`, `leads/manage.ts:214-298`, admin `leads.ts:253-293`); refunds never reopen a disclosed slot and are capped at net paid (`001:364-376`, tests); quality-claim window and non-qualifying reasons (`billing.ts:25-33,195-239`); saved card requires the authorization text, version, hash, user, IP (`payments/methods.ts:144-184`, `150:53-58`); admin MFA and role guards (`auth/guards.ts:72-78`, `_lib/action.ts`); append-only consent/audit/ledger/moderation tables (`002:879-898`); every admin decision writes `audit_log` (all `admin/*.ts`); `company_prices` append-only history; badge evidence trigger; one approved company per USDOT.
