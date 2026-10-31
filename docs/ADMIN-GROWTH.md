# Admin growth and reporting

The owner and operations admins can open `/admin/growth`. A compact request summary also
appears on `/admin`. Both use authenticated, same-origin JSON polling rather than refreshing
the operations dashboard and rerunning its lazy jobs.

## Saved requests

Request totals, 14 Eastern calendar days of activity, first/latest attribution, campaign
results, observed public landing paths and programmatic SEO publication counts refresh every
15 seconds while visible. Attribution uses exactly one selected touch per request over the
last 30 days. Direct / unattributed includes missing or unknown attribution. An unobserved
fallback landing path is not ranked as an observed acquisition page.

These are saved requests, not visits or conversion rates. Published and indexable counts
come from `seo_pages`; they are not search-engine indexed-page counts and exclude core routes
defined in source. The public sitemap remains the complete public URL inventory.

Every API request checks the current completed session and `super_admin`/`ops` role before
reading reports. Responses are private/no-store, rate-limited and contain aggregates only.
No contact details, capability tokens, click IDs, tag JavaScript or provider credentials are
returned. Either polling stream's 401/403 clears both reports and stops all polling. Hidden
tabs, manual pause and cleanup abort work; late results are ignored.

## Provider reporting

Website measurement and provider dashboard sign-in do **not** grant the backend API access.
Until a successful authorized API read is available, panels explicitly show API access not
connected, permission needed or provider unavailable, with null data rather than invented
zero metrics. Provider configuration and client secrets belong only in the app project's
server environment; Bing's delegated tokens use the encrypted database store described
below. No credentials belong in a `NEXT_PUBLIC_` variable, downloaded files in the repository
or reporting responses.

Google uses a dedicated reporting service account with access limited to these resources:

- GA4 property `561692313`: Viewer, including Analytics Data API access.
- Search Console property `https://www.americanmovingchoice.com/`: read access.
- GTM account `6401413548`, container `284497986`: Read access.

The preferred Production connection uses keyless Workload Identity Federation (WIF). Its
dedicated Google Cloud project is `amc-website-reporting-513311` / `652176198135`, with service
account `amc-reporting@amc-website-reporting-513311.iam.gserviceaccount.com`. Configure these
two server variables on **amc-app Production only**:

- `GOOGLE_REPORTING_CLIENT_EMAIL`: that service-account email.
- `GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE`:
  `//iam.googleapis.com/projects/652176198135/locations/global/workloadIdentityPools/amc-production-reporting/providers/vercel`.

The second value identifies the Google workload provider for STS; it is not the Vercel
token's audience. The runtime obtains a fresh request-scoped identity through `@vercel/oidc`
using Vercel's default team audience. The Google provider trusts issuer
`https://oidc.vercel.com/yasirahmad43s-projects` and allows audience
`https://vercel.com/yasirahmad43s-projects`, with this exact condition:

```text
assertion.owner_id == 'team_wqgzo2vAXEDvcnukphUOqtdP' &&
assertion.project_id == 'prj_bqwEmVfIYeWDPqtmh5aFRIZLoZb1' &&
assertion.environment == 'production' &&
assertion.sub == 'owner:yasirahmad43s-projects:project:amc-app:environment:production'
```

Service-account impersonation is granted to that exact subject, rather than a wildcard
pool, team or Preview deployment. The provider condition, subject grant and two Production
variables have been configured. **No Google private key was created or configured.**

Enable the Analytics Data, Search Console and Tag Manager APIs in the dedicated project,
and ensure the STS/IAM Service Account Credentials exchange is available. Optional resource overrides are
`GOOGLE_REPORTING_PROPERTY_ID`, `GOOGLE_REPORTING_GTM_ACCOUNT_ID`,
`GOOGLE_REPORTING_GTM_CONTAINER_ID`, `GOOGLE_REPORTING_SITE_URL`. The site defaults to
`WEB_URL` with a trailing slash; Production must use the canonical public website.

The request identity is exchanged through fixed Google STS and IAM Credentials endpoints.
The intermediate cloud-platform scope is used only for service-account impersonation;
the final token requests only `analytics.readonly`, `webmasters.readonly` and
`tagmanager.readonly`. Subject/intermediate tokens are not stored or returned. Short-lived
final tokens use expiry-aware singleflight caching. The service account needs the resource
read grants listed above, not project Owner/Editor or general data-administration roles.
Configured federation failures stay failed; they never fall back to a private key. Existing
PEM support is a legacy compatibility path, not the Production setup procedure.

Bing uses a separate delegated `webmaster.read` OAuth connection. Register its client in
Bing Webmaster Tools under Settings → API Access → OAuth Client. Configure
`BING_REPORTING_CLIENT_ID` and `BING_REPORTING_CLIENT_SECRET` on the app server, with optional
`BING_REPORTING_SITE_URL`; its default is the canonical `WEB_URL` with a trailing slash.
There is no broad API-key fallback.

Only a signed-in owner (`super_admin`) can start connection using
`POST /api/admin/growth/bing/connect`. Register the callback exactly as
`${APP_URL}/api/admin/growth/bing/callback`; Production uses the trusted app origin, with no
request-provided redirect target. The POST checks the configured origin and same-origin
request context. Both routes require the current completed owner session. Other permitted
admins can view aggregate reports but cannot connect a provider.

Apply additive migration `270_bing_reporting_connection.sql` before using this flow.
`reporting_oauth_states` stores only the SHA-256 hash of a random 256-bit state, bound to the
owner, exact session, site, client and callback, with a ten-minute expiry. Callback state is
consumed once and committed before exchanging the provider code. Failed exchanges require
a fresh connection attempt. Cancellation returns to a clean admin URL without exchanging
the code or changing credentials.

`reporting_oauth_connections` stores access and refresh tokens sealed with the existing
AES-256-GCM `APP_ENCRYPTION_KEY`. Authenticated associated data binds ciphertext to its
purpose, site, client and token kind. The migration grants only the backend `amc_app` role
and table owner access, enables RLS, and adds no public REST grants or realtime publication.
Audit records contain operation metadata, never token values, authorization codes or raw
provider errors. Tokens are not stored through generic platform settings.

Refreshes lock the connection row across serverless instances, validate the read-only scope,
and commit any rotated refresh token plus access token/expiry/version before the new access
token can be used for reporting. Revoked or broader grants fail closed. Local completion
invalidates the Bing report cache; other instances retry missing-grant results after 15
seconds. The environment-only refresh adapter remains legacy compatibility for fixtures;
the owner connection flow uses the durable store. Reporting calls use fixed read methods,
not submission or account-mutation methods.

As of 2026-10-31, native permission lists confirm the service account's GA4 Viewer,
Search Console Restricted and GTM container Read grants. Bing's dedicated client is
registered with the fixed Production callback. Its two credentials are saved as sensitive
app Production-only variables; deployment `dpl_8GR2KEde9htVgfiyN2ms3fb2dW7e` is READY on
the canonical app alias. The signed-in dashboard has returned actual Search Console and
Tag Manager reports, proving the deployed WIF exchange. Analytics currently reports
unavailable. The user approved Bing, but the app returned a connection-failed notice; no
stored grant or successful Bing report is verified. Configured trust, stored credentials
and successful report reads are separate states. Bounded server diagnostics are being
prepared to identify the remaining failures without exposing private provider data.

Failure diagnostics use server-only events `reporting_ga4_failure`,
`reporting_bing_connection_failure` and `reporting_bing_callback_failure`. Their fields are
fixed request/parser/connection stages and reason enums, optional bounded HTTP status,
and for Bing only two whitelisted SQLSTATE codes or a fixed scope category. They never
include callback values, provider payloads, errors/messages/stacks, URLs, credentials,
user identifiers or event/customer values. Success and cancellation stay silent; no
diagnostics are added to reporting responses. Scope/auth/state checks are unchanged.

The browser checks provider summaries every minute. Server process caches/singleflight use
30 seconds for GA4, 30 minutes for Search Console, 5 minutes for GTM and 6 hours for Bing.
Cold serverless instances may refetch sooner. Transport has fixed hosts, no redirects,
bounded response sizes and 5-second timeouts per provider HTTP request. Auth/quota failures
have explicit bounded retry states; an expired successful report is not returned as fresh.

- GA4 active users and events cover its rolling last 30 minutes; visitor consent means
  `generate_lead` counts can differ from saved requests. Unique active users are queried
  without event grouping. Realtime custom `step_name`/`form_placement` breakdowns are not
  supported and are not invented.
- Search Console uses 28 days ending at the latest returned final daily date, if available;
  otherwise it queries the historical window with no claim about a latest data date. Its
  dates are Pacific report dates. CTR/position are null when there are no impressions.
  Sitemap submitted URLs are not indexed URLs; deprecated indexed fields are ignored.
- Bing daily traffic and feed status are delayed provider reports. Their dates stay dates,
  without a UTC-to-Eastern day shift. URL counts and submission receipts are not indexing
  proof. Traffic combines Bing search verticals and is not labeled AI leads.
- GTM shows the published version and tag count only. Configuration does not prove firing.
- Security links target **amc-web**, not portal environment flags. Firewall/bot-block counts
  remain in Vercel until real telemetry is connected. BotID and country controls are unchanged.

## Validation

`pnpm test:admin-growth` runs database-free route/polling/coupled UI regressions.
The normal server test suite includes pure reporting adapter/cache/privacy tests, aggregate
DTO tests, and `test/admin-growth-sql.test.ts`, which executes the actual SQL against inline
synthetic PostgreSQL relations without inserting requests. CI runs these plus both app
typechecks/builds and the existing suites.

The connection changes add coverage for owner-only start/callback routes, exact origin and
redirect checks, malformed/duplicate callback fields, cancellation and clean status redirects.
The 56 mocked reporting tests include Google federation audience/token validation, request-scoped
SDK identity, fixed STS/IAM exchanges, final read scopes, token bounds, expiry/singleflight,
no private-key fallback after federation failure, and generic permission/quota handling.
Bing tests cover read-only scope, retained/replaced refresh tokens, stored-grant activation,
15-second missing-grant retries, local invalidation and credential-free DTOs.

`test/bing-connection.test.ts` adds 12 PostgreSQL regressions for state hashing/bindings/expiry,
committed consumption, callback replay and concurrent replay, owner/session revocation,
scope enforcement, AES-GCM purpose binding, metadata/audit redaction, serialized refresh
rotation across independent managers, and actual RLS/ACL/no-realtime migration checks.
Provider traffic is mocked. The disposable local PostgreSQL listener was unavailable, so
the database tests were verified in isolated CI: run `41208321418` passed all 12 new
regressions, the complete existing suite, typechecks and both builds. PR #39 is merged and
both Production projects are READY. No live grant/consent result is inferred from mocked tests.

API resource references: [GA4 Realtime](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runRealtimeReport),
[Search Console](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data),
[GTM live version](https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.versions/live),
[Bing OAuth](https://learn.microsoft.com/en-us/bingwebmaster/oauth2),
[Vercel OIDC](https://vercel.com/docs/oidc).
