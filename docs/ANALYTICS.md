# Public analytics and search ownership

The website sends Google measurement through one optional GTM container. It does not load a
separate `gtag.js` script. `ANALYTICS_ENABLED` defaults to false; a valid `GTM_CONTAINER_ID`
is also required. Configure these on the public web Production project only once the
container below has been reviewed and published. Do not install analytics on the portal.

## Consent

No Google request or measurement queue is created before analytics opt-in. The compact,
non-modal choice bar offers Allow analytics and Keep analytics off; the footer's Analytics
choices button reopens it. These choices also work before a Google container is configured:
optional first-party campaign capture can run after permission while Google stays off. The
bar explains optional campaign cookies and the scope of Google measurement.
The preference lasts 180 days. GPC or Do Not Track keeps both campaign capture and analytics
off. Consent withdrawal clears campaign attribution, updates the Google consent state, clears analytics cookies and reloads
the document to remove the already-executed tag runtime.

Consent Mode defaults to denied for analytics, ad storage, ad user data and ad personalization.
After opt-in only analytics storage is granted. Google signals, ad personalization and URL
passthrough are disabled. Attribution capture uses the same preference and never enters the
analytics event payload. This is basic consent mode: no pre-consent cookieless pings.

## Container configuration

Use one Google tag for the actual GA4 web-stream measurement ID:

The verified American Moving Choice account is `414235382`, property `561692313`, web
stream `16241880293`, measurement ID `G-7P7TKLBZXH`. Its GTM account is `6401413548`,
container `284497986` / `GTM-569KB26S`. These identifiers are public configuration, not
credentials. They do not by themselves prove that a container is published or that the
Production environment is enabled; verify both before reporting live measurement.

Use the sandboxed AMC consent template on Consent Initialization. It reads only the
`amc_analytics_consent` Data Layer marker and uses Tag Manager's consent APIs to grant
analytics storage only for the literal `granted`; all advertising consent stays denied.
The website queues that marker after its consent/public-page gates and before loading
GTM. Its internal `amc_analytics_consent_update` event applies denial before cleanup and
reload. Only the consent template listens to this control event; never forward it to GA4.
Queued `gtag` consent commands are retained as fallback, not used as the template bridge.
Set `ads_data_redaction=true` and `url_passthrough=false` through the sandbox template's
`gtagSet` API, with write access restricted to those two keys. Do not put these controls in
the Google tag's ordinary configuration table or the app's ordinary measurement defaults:
that serializes them as extra GA4 event parameters rather than applying their consent scope.

- Trigger: Initialization – All Pages (the container itself loads only after consent).
- Set `send_page_view` to false. Set `allow_google_signals` and
  `allow_ad_personalization_signals` to false.
- Set `page_location`, `page_referrer` and `page_title` from Data Layer Variables with
  those exact names. Never use built-in Page URL, Referrer or DOM/form variables.
- Require `analytics_storage` consent. Add no advertising or retargeting tags.

Turn **all enhanced measurement off** on the GA4 web stream, including page/history changes
and form interactions. Do not create GTM History Change, Form Submission, click, automatic
pageview or DOM-scraping triggers. Automatic pageviews would duplicate the app-controlled
pageview and could bypass its URL filtering.

Create four GA4 Event tags with matching Custom Event triggers:

| Custom event / GA4 event name | Parameters |
| --- | --- |
| `page_view` | `page_location`, `page_path`, `page_referrer`, `page_title` |
| `survey_start` | The four page fields plus `form_placement` |
| `survey_step` | The four page fields plus `form_placement`, `step_name` |
| `generate_lead` | The four page fields only |

Every parameter is the Data Layer Variable of the same name. Separate event tags prevent
stale step variables from being attached to unrelated events. Mark `generate_lead` as a key
event in GA4. Do not use a generic form-submit or confirmation-pageview conversion.

`form_placement` is only starter, hero_zip or survey. `step_name` is only move_type, route,
date, services, contact or review. These are interface labels, never a visitor's answers.
There are no request IDs, ZIP codes, dates, sizes, service choices, names, emails or phone
numbers in these events. Page titles are fixed text; URL queries/fragments are excluded and
referrers are origin-only. Private/token/report/review pages are not measured. Navigation
from a tagged document to a private page uses a fresh document so GTM cannot remain active.

The lead event is emitted once, only after the server accepts the submission. The normal
private confirmation opens after tag completion or a 400 ms fallback. Declining analytics,
blocking scripts or disabling browser storage does not prevent a moving request.

## Ownership verification

`GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` add ownership meta tags only on an
indexable public deployment. `INDEXNOW_KEY` exposes the public ownership proof at
`/indexnow-key.txt`; it is not an account credential. Account creation, sitemap submission,
container publication and IndexNow submission are separate authorized operations.

## Verification

Test a fresh browser without an analytics preference: no request to googletagmanager.com or
google-analytics.com should occur. With no container, footer choices must still open and
campaign attribution must only be saved after permission; no Google script may load.
After opt-in with a configured container there must be one `page_view` per public
route change, and no second automatic pageview. Confirm survey events have only the table's
parameters. A validation error or rejected submission must not emit `generate_lead`. An
accepted submission emits it once and opens a confirmation document with no Google script.
Open a tokenized management link directly and verify it also loads no Google script.

Official references: [Google consent implementation](https://developers.google.com/tag-platform/security/guides/consent),
[manual pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views),
[single-page application measurement](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications).
