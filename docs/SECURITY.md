# Public website and customer-data safeguards

The public website accepts valid moving requests without requiring a participating company
to cover the route. Anti-abuse checks do not disclose company availability or company names.

## Public submissions

`BOT_PROTECTION_ENABLED=true` enables Vercel BotID on quote preparation, final quote submission
and valid concern reports. The client initializes before hydration and attaches the invisible
challenge to same-origin POST requests. Both client and server explicitly select `basic`;
this does not enable paid Deep Analysis. No visible CAPTCHA or owner MFA is added.

Only a successful human check or an explicit platform bypass is accepted. Verified read-only
crawlers cannot submit a form. Missing challenges and provider failures never create a lead,
set a confirmation cookie or create a report. The visitor receives a generic retry message.
No challenge data or provider error payload is logged. Local development works without a
live Vercel challenge; an enabled production check fails closed on an unsupported host.

BotID requires the project's Secure Backend Access with OIDC setting. Its SDK reads the
platform-injected `x-vercel-oidc-token` request header, with a `VERCEL_OIDC_TOKEN` fallback.
Verify the project setting and real-browser quote preparation before enabling enforcement;
do not copy or print token values. Vercel documents the runtime header in its
[system variables](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_oidc_token)
and [OIDC federation](https://vercel.com/docs/oidc) references.

Quote and report services additionally enforce database-backed, HMAC-keyed limits. Public
metadata trusts Vercel's validated client-IP header on Vercel, bounds missing-IP traffic and
groups IPv6 addresses by /64 for rate limits. Invalid attempts count. Postal lookups are
limited and return only city/state labels. Signed, expiring survey tickets, honeypots,
server-side validation and same-origin protections remain active. These layers reduce abuse;
they do not claim to eliminate every automated or fraudulent submission.

## Request capabilities

Every new anonymous submission has an independent reference, management link and contact
limit. Knowing a previous request's phone, email or route never grants access to it. Possible
duplicates are flagged privately for admin review, without merging public capabilities.
Legacy combined requests cannot be managed through a shared public link; their records and
authorized admin access remain intact.

## Internal access and measurement

Admin actions recheck database-backed roles. Company CRM access also requires active
membership and the relevant purchase/company/agent assignment. Customer tokens do not grant
admin or company access. Private pages are not indexed and do not load Google measurement.
Optional attribution is stored with the accepted lead for authorized admins; analytics uses
only fixed event names and sanitized public page paths, never contact details or move answers.

Media uploads are validated and re-encoded images, separate from customer records. Server
credentials remain server-only. These changes preserve the owner's existing sign-in method.

## Verification and operations

Run `pnpm typecheck`, `pnpm test`, `pnpm test:content` and both application builds before
release. Security regressions cover rejected challenges, replay/rate-limit boundaries,
cross-request withdrawal isolation, legacy capability rejection and country/crawler policy.
Verify a real browser can prepare a quote with analytics off, without submitting personal data.
Use the existing deployment rollback if a newly enabled protection interrupts genuine traffic.

See [country access](COUNTRY-ACCESS.md) for the US/Pakistan policy and crawler-range refresh.
See [analytics setup](ANALYTICS.md) for consent and event configuration.

Primary implementation references: [Vercel BotID](https://vercel.com/docs/botid),
[current setup](https://vercel.com/docs/botid/get-started),
[explicit Basic mode](https://vercel.com/docs/botid/advanced-configuration),
[form submissions](https://vercel.com/docs/botid/form-submissions), and
[trusted request metadata](https://vercel.com/docs/headers/request-headers).
