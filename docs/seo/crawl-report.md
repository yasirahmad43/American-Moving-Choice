# Crawl report: http://localhost:3002

Generated 2026-10-28T19:22:37.935Z by `pnpm seo:crawl` (tools/seo-crawl.ts). Plain HTTP fetch of the server-rendered HTML, starting from the home page and the sitemap index, following every same-origin link.

**Intentional preview indexing policy:** this run explicitly used `--preview`. Global noindex and noindex sitemap entries are expected demo observations, listed separately below. Title, description, H1, link, orphan and depth checks still assess public HTML pages. HTTP canonical eligibility applies only to indexable responses; stored self-canonicals are checked separately in the database proof. FAQPage markup is optional; only markup without visible FAQ content is an error.

## Summary

| Check | Result |
|---|---|
| URLs fetched | 2497 |
| 200 HTML pages | 2497 |
| Indexable pages (no noindex) | 0 |
| noindex pages | 2497 |
| Broken links (non-200 targets) | 0 |
| Redirects followed | 0 (chains > 1 hop: 0) |
| Duplicate titles (groups) | 0 |
| Duplicate descriptions (groups) | 0 |
| HTML pages without a description | 0 |
| Pages without exactly one H1 | 0 |
| Canonical mismatches (indexable pages) | 0 |
| Orphans (public preview, no inbound link) | 0 |
| Public preview pages deeper than 3 clicks from home | 0 |
| Sitemap files | 10 |
| Sitemap URLs | 2497 (non-200: 0; noindex: 2497, expected in preview) |
| Indexable pages missing from the sitemap | 0 |
| Invalid JSON-LD blocks | 0 |
| FAQPage markup without visible FAQ content | 0 |
| Pages over 2 MB of HTML | 0 |

### Indexable pages by first path segment



## Broken links

- none

## Redirect chains

- none

## Duplicate titles

- none

## Duplicate descriptions

- none

## Pages without exactly one H1

- none

## Canonical mismatches

- none

## Orphans

- none

## Deeper than 3 clicks

- none

## Sitemap issues

- none

## Structured data

- none

## noindex pages (expected demo policy)

- http://localhost:3002/ (noindex, nofollow)
- http://localhost:3002/about/ (noindex, nofollow)
- http://localhost:3002/contact/ (noindex, nofollow)
- http://localhost:3002/complaints/ (noindex, nofollow)
- http://localhost:3002/report-a-concern/ (noindex, nofollow)
- http://localhost:3002/privacy/ (noindex, nofollow)
- http://localhost:3002/terms/ (noindex, nofollow)
- http://localhost:3002/mover-terms/ (noindex, nofollow)
- http://localhost:3002/for-movers/ (noindex, nofollow)
- http://localhost:3002/for-movers/eligibility/ (noindex, nofollow)
- http://localhost:3002/for-movers/moving-leads/ (noindex, nofollow)
- http://localhost:3002/for-movers/pricing/ (noindex, nofollow)
- http://localhost:3002/for-movers/reviews-and-reputation/ (noindex, nofollow)
- http://localhost:3002/get-quotes/ (noindex, nofollow)
- http://localhost:3002/moving-cost-calculator/ (noindex, nofollow)
- http://localhost:3002/verify-a-mover/ (noindex, nofollow)
- http://localhost:3002/movers/ (noindex, nofollow)
- http://localhost:3002/routes/ (noindex, nofollow)
- http://localhost:3002/services/ (noindex, nofollow)
- http://localhost:3002/questions/ (noindex, nofollow)
- http://localhost:3002/planning/ (noindex, nofollow)
- http://localhost:3002/moving-cost-calculator/method/ (noindex, nofollow)
- http://localhost:3002/moving-costs/how-movers-charge/ (noindex, nofollow)
- http://localhost:3002/moving-costs/ (noindex, nofollow)
- http://localhost:3002/editorial-policy/ (noindex, nofollow)
- … and 2472 more
