# Design pass 2 verification

Verified locally on 2026-10-28 against production builds of both Next.js apps and a disposable
PostgreSQL 16 database. No real payments, messages, or company verification requests were made.

## Result

- Public home rebuilt around one quote request: responsive editorial typography, real moving
  photography/video, a clear ZIP entry form, route narrative, service cards, and practical FAQs.
- Portal and admin navigation, dashboards, request lists, and filters share the same visual system.
- Tables sort keyed React rows, expose sorting state, and switch to readable cards on small screens.
- Tilt/flip/motion components support keyboard interaction and reduced motion. Video has explicit
  pause/play controls and preserves a deliberate pause when the viewport or tab visibility changes.
- The owner-selected contact-introduction flow removes public preferred-mover/profile selection.
  Public legacy URLs redirect, including their metadata/sitemap exposure. Request payloads and
  confirmation/management/email views retain counts and permissions without company names.
- Migration 200 records the actual disclosure mode without rewriting historical consent records.
  A purchased request alone cannot trigger a company-branded review invitation before contact.

## Checks

Both production builds and package typechecks passed. Tests passed: core 78, UI 8, database 58,
server 300, and public content/projection 29. The browser suite has 56 passing scenarios and one
pre-existing intentionally skipped admin-approval scenario. The final full run passed 55 scenarios;
one assertion expected superseded wording, then passed on its corrected targeted rerun, including
the persisted `contact_introduction` consent record and anonymous rendered permission text.

Browser coverage includes the complete quote request and withdrawal flow, purchase/CRM, review
tokens, authentication/MFA, calculator, onboarding, and portal tables. Axe reported zero serious or
critical issues on the checked public, quote, portal, marketplace, and admin screens at desktop and
mobile sizes. The home page also has a 320px horizontal-overflow check.

Screenshots were captured at 1440px and 390px, covering home, quote entry, portal, purchased requests,
marketplace, and admin. Proof files are saved in the task's `outputs/design-pass-2` directory; they
contain only fictional local demo data. The media inventory check passed for all 418 bundled assets.

## Deployment boundary

The public and company apps must receive the matching flow code and migration 200. These checks
do not assert that production was migrated, that the SEO expansion has published 2,000 pages, or
that runtime media uploads use persistent storage. Those have separate verification requirements.
