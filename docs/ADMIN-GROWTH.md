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
zero metrics. Provider credentials belong only in the app project's server environment;
never use a `NEXT_PUBLIC_` variable or commit downloaded credential files.

Google uses a dedicated reporting service account with access limited to these resources:

- GA4 property `561692313`: Viewer, including Analytics Data API access.
- Search Console property `https://www.americanmovingchoice.com/`: read access.
- GTM account `6401413548`, container `284497986`: Read access.

Enable the Analytics Data, Search Console and Tag Manager APIs in its dedicated Cloud
project. Server variables: `GOOGLE_REPORTING_CLIENT_EMAIL`, `GOOGLE_REPORTING_PRIVATE_KEY`
(RSA PEM; escaped newlines accepted). Optional resource overrides are
`GOOGLE_REPORTING_PROPERTY_ID`, `GOOGLE_REPORTING_GTM_ACCOUNT_ID`,
`GOOGLE_REPORTING_GTM_CONTAINER_ID`, `GOOGLE_REPORTING_SITE_URL`. The site defaults to
`WEB_URL` with a trailing slash; Production must use the canonical public website.

OAuth JWT assertions request only `analytics.readonly`, `webmasters.readonly` and
`tagmanager.readonly`. The service account needs no general project/data-administration role
for reading these existing resources. Keep its private key server-side and rotate/revoke it
through the provider when needed.

Bing requires its own delegated `webmaster.read` OAuth connection, configured as
`BING_REPORTING_CLIENT_ID`, `BING_REPORTING_CLIENT_SECRET`, `BING_REPORTING_REFRESH_TOKEN`
and optional `BING_REPORTING_SITE_URL`. There is no broad API-key fallback. If Bing rotates
the refresh token, this initial adapter fails closed and requires secure reconnection;
durable encrypted rotation is not implemented. No mutation/submission methods are called.

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

API resource references: [GA4 Realtime](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runRealtimeReport),
[Search Console](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data),
[GTM live version](https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.versions/live),
[Bing OAuth](https://learn.microsoft.com/en-us/bingwebmaster/oauth2).
