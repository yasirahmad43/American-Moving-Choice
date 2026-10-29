# Immersive public experience — verification

Application candidate: `87b16f02f53caf8a1bd84d643e3dfdd4a559b31b`, with the follow-up browser
assertions in the same review branch. PR: https://github.com/yasirahmad43/American-Moving-Choice/pull/8.
The production release and final public checks are recorded in HANDOFF once confirmed.

## Visual review

Three preserved reviews against all six owner-supplied reference sites scored the local redesign
6.1, 7.9 and 8.9 out of 10. The final critique uses the owner's approximately 5/10 reference
anchor and judges local imagery, sourced context, graphics, motion and task clarity within the
explicitly requested common homepage/video/right-survey framework. It does not penalize that
framework itself. No concrete P1, P2 or P3 finding remained in the final sampled pages.

These are subjective visual and visible-entry-flow assessments, not performance certification,
verification of competitors' claims, or a promise of a perfect owner rating:

| Site | Final visual assessment |
|---|---:|
| American Moving Choice | 8.9 |
| Freedom Healthcare Savings | 5.7 |
| Sacramento Home Selling preview | 5.6 |
| InjurySage | 5.5 |
| AS Home Solutions | 5.5 |
| Smooth Relocation | 5.3 |
| A Plus Moving | 3.3 — low confidence; limited captured rendering |

The complete review and its captures live in the task proof's `immersive-redesign-review/`
directory. Pass 1 and pass 2 remain alongside the final `pass-3-final.html` and score JSON.

## Functional and content checks

- Both optimized production builds and every package's TypeScript check passed locally.
- **527 unit/content/database tests passed:** core 84, UI 8, database 58, server 332,
  public content/media 45. `pnpm test:content` is now part of CI as well as local verification.
- **22 focused hero/tool cases passed:** desktop/mobile layout and touch controls, relevant
  imagery, household prefill, carrier orientation, calculator results, direct tool anchors,
  no-JavaScript fallback, answers absent from URLs, background-video pause and reduced motion.
- **60 executable full browser scenarios passed:** the complete run passed 58 and exposed two
  obsolete copy/hidden-selector assertions; their focused rerun passed 2/2. No business logic
  was changed to make these assertions pass. One pre-existing empty admin-approval `test.fixme`
  remains skipped; it must not be counted as a successful browser scenario.
- On the optimized populated build, **30 core-page checks and 30 guide/hub desktop/mobile
  views passed**. All checked pages returned 200 with one H1, one video hero, a real hero form,
  at least five distinct body photos and no horizontal document overflow. Affected SEO scopes
  had no serious/critical axe, company-disclosure or consumer-funding-copy findings.
- The complete local public projection preserved all 2,467 published records and their table
  cells/data points. The production baseline has one additional published city (2,468 total);
  local counts do not establish current production counts or search-engine indexing.
- Austin retained all 113 table rows while its mobile page fell from 58,403 to 19,872 pixels.
  The 60-row ZIP table uses a 448px keyboard-scrollable viewport. Its 13 main image slots now
  use 13 different source assets, including 12 commissioned editorial photographs.
- Seven planning cards have seven distinct topic-matched scenes; pet imagery is reserved for
  actual pet topics. Hawaii's unsupported road assumptions remain explicitly not modeled.
- Final optimized Austin/Costs desktop/mobile captures passed zero breadcrumb/control overlap,
  zero document overflow and zero serious/critical axe findings. Short introductory paragraphs
  use a shorter photo treatment instead of leaving a portrait-sized empty reading column.

The state map links to 51 actually published state/district guides. Native links, keyboard focus
and no-JavaScript navigation were checked. State search supplies a compact alternative for tiny
map targets. State outlines come from real Census-derived geometry, with source/ISC attribution
retained in the repository. They are guide navigation, not a mover-coverage claim.

The supplied logo's original SHA-256 is identical in both apps:
`502267aea04b02c713222a29ba2405852a6be34b3ce8676f0de4ba53811712cd`.
All 418 manifest assets pass the media checker; editorial reuse is documented separately from
exclusive assignments and uploads. Four existing licensed video scenes supply the backgrounds.

## Release boundaries

This visual pass does not regenerate published content or add database migrations. Historical
consent texts and evidence remain immutable. Consumer company identities remain private until
companies introduce themselves through contact. Operator pricing and screening policies retain
their factual billing details, while consumer AMC funding promotion is removed.

The live system remains a demo with public search indexing disabled until the separate launch
requirements in HANDOFF are completed. Supabase Storage's server key is still absent from both
Vercel environments; bucket/URL configuration alone does not enable or prove live uploads.
