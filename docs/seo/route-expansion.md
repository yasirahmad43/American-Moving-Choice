# Census-backed city-route expansion

The protected local bootstrap verified **2,220 published route guides: all eight incumbent guides plus 2,212 new guides**. The original state-heavy bootstrap had selected only six city routes among its first 1,000 candidates. Increasing that limit alone failed the existing uniqueness gate; those experiments were never deployed.

The new cohort selects one origin per Census place with complete attributed facts and usable ZIP data. Each is paired with the nearest out-of-state city among the 100 largest eligible mainland places, using centroid geometry. This is a geographic coverage selection, not evidence of route popularity, traffic or measured search demand. Alaska/Hawaii are excluded until mode-specific transport data exists. Duplicate Census-place aliases use a stable semantic choice, independent of database IDs or input row order.

New guides contain endpoint population/housing/geography, historical Census rent/value/income comparisons with published MOEs, housing structure/tenure comparisons, geographically spread ZIP-to-ZIP centroid samples and a short sourced moving-planning brief. They claim no verified truck road mileage or delivery duration. ZIP and centroid geometry is explicitly distinguished from a highway itinerary or municipal boundary. Repeated factual recitations were removed from the new format; the comparison records and source links remain visible. Existing saved guides are not rewritten into the new format.

## Protected bootstrap verification

The fresh `amc_routes_verify_test` was copied logically from the local golden catalogue while golden remained read-only and its active preview connections remained open. Its starting corpus included all 4,782 saved pages and all 1,000 previously generated route pages, including held drafts. The real bootstrap then added the new cohort and assessed uniqueness against the complete resulting route family.

| Check | Actual result |
| --- | --- |
| Complete source-backed cohort | 3,141 routes |
| Missing page records generated | 3,140 |
| New published routes | 2,212 |
| Incumbent published routes retained | 8 of 8 |
| Total published routes | 2,220 |
| Held new drafts | 928, below unchanged uniqueness threshold |
| Minimum published unique share | 0.4 |
| Minimum main-content words | 613 |
| Failed published gates | 0 |
| Published AK/HI routes | 0 |
| New numeric road/day predictions, including metadata | 0 |
| Original saved content/metadata hashes changed | 0 of 4,782 |
| Second bootstrap page rows changed | 0 |
| First local run / second run | 89.387 seconds / 25 milliseconds |
| Database / page relations / compact cache | 217,177,111 / 91,963,392 / 40,689,664 bytes |

The local total is 4,679 published guides across all families. Production previously had one additional city guide; production counts must be verified after deployment rather than inferred from this local result. No production write was part of this verification.

The 300-word, evidence, duplicate-content, duplicate-intent, **whole-family 40% five-word uniqueness**, and transport gates are unchanged. The packed per-page shingle cache remains in use; no per-shingle table is recreated. Earlier experimental city routes were confined to `amc_routes_test`, not used as an empty-corpus shortcut for this proof.

## Deployment and recovery

`vercel-deploy.ts` calls the existing catalogue bootstrap and then `bootstrapRoutes` with the same resolved app-role client. Both share a 25-minute SEO budget. Preview/local builds retain the existing production-only guard. Storage verification remains after both bootstraps.

The route version is `census-distinct-city-routes-v1`, stored in the existing `seo_bootstrap_runs` table; no new migration is needed. A ten-minute row lease works through transaction poolers. Candidate insertion, content/quality, publication, links and media have durable checkpoints. Heartbeats occur between bounded chunks. Existing candidate rows and every saved guide's content are preserved, including drafts saved by an interrupted build. A resume repairs missing derived cache rows and refreshes whole-family quality even when no page content remains to be generated. Completion requires at least 2,000 published, indexable route records with valid evidence, uniqueness and transport gates. Another completed build only validates the result and performs no content writes.

Runtime source tests cover suppressed/missing Census observations, denominator and directional-difference units, actual snapshot provenance/limits, deterministic geography, alias and row-order independence, preserved authored content, interrupted-draft scoring, competing leases, minimum-route enforcement and legacy candidate reasons using the new brief in both body and metadata.

The independent real interrupted-run proof used a second fresh golden copy, `amc_routes_resume_test`. It deliberately stopped after 99 new page drafts were saved. None was public; the candidate checkpoint survived and the deployment lease was released. Resumption preserved every original and partial page's content, completed in 86.202 seconds locally, and produced the same complete content catalogue as the uninterrupted run: 2,220 published routes, minimum unique share 0.4, zero invalid published gates. The output is `outputs/route-expansion/resume-verification.json`.

After the optimized application build, verify that its `*.nft.json` trace includes `packages/server/data/seo-route-census/places-2023.json`. The source helper reads it through a constant `new URL` path, but the application requires explicit tracing for the admin content generation routes. The public web application renders stored facts and never invokes the generator, so it does not need this runtime file. Census numeric content is bundled; the build/runtime never needs Census credentials.

Nonsecret JSON evidence is saved in the task's `outputs/route-expansion/` directory. The earlier full production crawl under revision `5b276b260d8e7707c45096e8a967c7740fb6aca0` is a historical baseline and does not verify the newly expanded release. Publication counts and a crawl of the actual new production revision remain release checks. Automated eligibility does not imply search-engine or AI placement.
