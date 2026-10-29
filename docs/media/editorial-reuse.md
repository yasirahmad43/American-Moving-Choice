# Editorial imagery and exclusive media

The owner's current visual brief requires a video background and at least five different
relevant images on every public page. The original one-asset/one-page rule still governs
exclusive media slots and runtime uploads. A second, explicit presentation role now permits
commissioned editorial illustrations to appear on more than one page.

`apps/web/lib/page-media.ts` exports the synchronous server helper:

```ts
pageMediaPlan(url, { family?, topic?, stateCode? })
// { video: MediaAsset, images: MediaAsset[5] }
```

The planner reads `mediaManifest()` and does not mutate `usedOn`, `seo_media_usage`, uploaded
media or any database record. It never calls the exclusive claim functions. The pure selection
logic lives in `page-media-plan.ts` so it can be tested without a server or database.

Reusable images must be non-placeholder, commissioned Higgsfield illustrations with a
recorded license and source URL. Eligible subjects are moving services, routes, states,
planning, questions, costs, trust, the moving process, home sizes, seasons and mover business
operations. Exclusive `hero` images and runtime uploads are excluded. State-tagged scenes
are eligible only when that state matches the page's supplied state or an actual state name
in its URL. Remaining slots use relevant general moving illustrations; a generic scene is
never relabelled as a specific city or actual customer.

The four existing licensed commissioned videos are approved for editorial background reuse:

- `home-hero-crew-loading-golden-hour`
- `long-distance-hero-aerial-highway-dawn`
- `local-hero-sofa-apartment-door`
- `how-it-works-laptop-boxes`

Their original ownership records stay intact. The planner chooses a context-appropriate
clip, retains its poster and licensing data, and returns five distinct image IDs. Subject
scores are computed before sorting, with URL/ID hashing to vary equal-scoring choices.
Selection is independent of request order, manifest order and tracking query parameters;
there is no pool that can be exhausted by visiting thousands of pages.

`pageCardImage(url, options, usedIds)` chooses a subject-matched thumbnail. Its optional ID set
belongs to one hub or page render, so seven planning cards get seven different relevant
illustrations without recording ownership. Delivery, choosing a mover, packing, moving day,
interstate travel, an eight-week timeline and arrival have explicit editorial subjects. Pet
imagery is excluded unless the title or URL actually concerns pets. The same per-page set
prevents feature, FAQ and related-card photos from repeating the five primary illustrations.
TOC links, individual facts, checklist utilities and the reading rail use semantic SVG icons
instead of repeating photographs as decoration.

Cost, price and calculator pages use the highway video; home uses the loading crew; exploration
uses the local sofa scene; planning and questions use the laptop scene. City hero ZIP examples
come from their saved quote-entry values and remain placeholders, never hidden preselected
answers. Dense SEO tables retain all rows in a keyboard-accessible, labelled scroll area with
a visible all-records hint and a 28rem height limit on phones as well as desktop.

SEO pages preserve their assigned exclusive asset in the first section when one is available,
including approved upload overlays. Every stored fact, table row, source, FAQ, date and quote
prefill remains part of the public projection. The visual redesign does not regenerate
content, change publication gates or claim illustrations as source evidence.

The public content projection continues to remove retired company listings and now replaces
the owner's retired funding promotion with neutral screening/contact-choice information.
Only funding-specific marketing sections and links change; historical stored records and
all moving-price facts, Census figures and other evidence remain intact.

Visible page credits describe images and video as editorial illustrations rather than
photographs of a named city, customer or moving company. `MediaFrame` retains asset alt text,
responsive tiers and required attribution. `AmbientVideo` and the shared motion components
retain reduced-motion, pause and lazy-loading behavior.

Regression coverage in `apps/web/lib/page-media-plan.test.mjs` checks deterministic selection,
non-mutation, five distinct licensed images over 2,500 pages, state exclusion, topic relevance
and context-appropriate video/fallbacks. Run it with the other web presentation tests:

```sh
node packages/server/node_modules/vitest/vitest.mjs run --root apps/web --globals lib/page-media-plan.test.mjs
```
