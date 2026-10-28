# Media library inventory

Branch `media/library`, generated 2026-10-28. Everything in this library was produced through the
Higgsfield MCP tools (stills: `gpt_image_2_5`, videos: `seedance_2_5`). Nothing here is stock
photography.

- Manifest: `apps/web/content/media/manifest.json` (418 assets: 414 stills + 4 videos)
- Assets: `apps/web/public/media/images/<id>-1600.webp`, `<id>-800.webp`; `apps/web/public/media/videos/<id>-1080.mp4`, `<id>-720.mp4`, `<id>-1080.webm`, `<id>-poster.webp`
- Prompt matrix: `docs/media/prompt-matrix.csv` (404 rows; the 12 stills generated before this pass are described in the manifest's `generator.prompt`)
- Validator: `pnpm media:check` (`apps/web/scripts/media-check.ts`)

## Counts

Every asset carries a family tag (first tag), an orientation tag (`landscape` 16:9, `standard` 4:3,
`square` 1:1) and, where relevant, `state:XX`, `season:*`, `service:*`, `size:*`, `theme:*`, `step:*`.

### By page family

| Family | Assets | Notes |
| --- | ---: | --- |
| home | 14 | includes the home hero video |
| services | 70 | local 13 · long-distance 12 · interstate 7 · packing 12 · storage 9 · specialty 11 · labor-only 8 (two are videos) |
| how-it-works | 13 | 4 steps × 3 orientations + the laptop video |
| costs | 10 | |
| questions | 8 | |
| planning | 11 | |
| for-movers | 17 | dispatch, crew briefing, fleet, tablet-with-blurred-map, warehouse, owner |
| directory | 10 | company profile / card imagery |
| survey | 8 | survey + confirmation |
| trust | 8 | |
| state | 155 | 50 states + DC: one 16:9 hero, one 4:3 card and one 1:1 detail tile each (TX, FL, CA have a fourth from the earlier pass) |
| season | 32 | spring 8 · summer 8 · autumn 8 · winter 8 (plus season tags on other families) |
| size | 31 | studio 5 · 1br 5 · 2br 5 · 3br 5 · 4br 5 · townhouse 3 · condo 3 |
| route | 31 | long-distance / route themes (desert, plains, mountain, coast, night, arrival, departure, …) |
| **Total** | **418** | 414 stills + 4 videos |

### By state (code → assets)

Every state and DC has exactly 3 (hero 16:9, card 4:3, tile 1:1) except TX, FL and CA, which have 4.
AL AK AZ AR CO CT DE DC GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN UT VT VA WA WV WI WY = 3 each; CA FL TX = 4 each. State scenes describe climate, housing style and landscape only; no landmarks, signs or text, so nothing can be mislabeled.

### By season tag

spring 8 · summer 9 · autumn 8 · winter 9 (the season family plus seasonal home/route assets).

### By orientation

landscape (16:9) 190 · standard (4:3) 137 · square (1:1) 91.

## Video vs still

| Kind | Count | Model | Format on disk |
| --- | ---: | --- | --- |
| Higgsfield video | 4 | `seedance_2_5`, 8 s, 1080p 16:9, muted | H.264 MP4 1080p (CRF 23) + 720p (CRF 23), VP9 WebM 1080p (CRF 33), WebP poster (first frame), blur data URL |
| Higgsfield still | 414 | `gpt_image_2_5` | WebP q72 at native width (1344 for 16:9, 1168 for 4:3, 1024 for 1:1) + WebP q70 at 800 px, 24 px blurred WebP data URL in the manifest |

Videos: `home-hero-crew-loading-golden-hour` (home hero), `long-distance-hero-aerial-highway-dawn`
(long-distance hero), `local-hero-sofa-apartment-door` (local moving hero),
`how-it-works-laptop-boxes` (how it works). All four first submissions completed; none had to be
regenerated. The source files are HEVC; the transcodes above are what ships.

Note on tiers: the brief asked for 1600 / 800 / 400 px tiers. `gpt_image_2_5` outputs 1344×752 for
16:9, so the top tier is the native width (no upscaling). The 400 px tier was dropped to stay
within the ~80 MB size budget (`apps/web/public/media` is 82 MB: 61 MB images, 21 MB videos);
`next/image` can downscale the 800 px tier for thumbnails.

## Licensing statement

All assets were generated for American Moving Choice under the account's Higgsfield plan through
the Higgsfield MCP tools. They are not stock photography, carry no third-party attribution
requirement, and are recorded in each manifest entry as:

```
credit: {
  creator: "American Moving Choice (AI-generated via Higgsfield)",
  source_url: <the Higgsfield result URL on d8j0ntlcm91z4.cloudfront.net>,
  license: "Generated for AMC under the account's Higgsfield plan; not stock",
  attribution_required: false
}
generator: { provider: "higgsfield", model, prompt, job_id, generated_at }
```

Every prompt ends with "editorial photo, natural light, no text, no logos, no legible signs" and
avoids faces in close-up. Assets are synthetic depictions; none shows a real company, person,
address or landmark.

## QA

All 404 new stills were reviewed on labelled contact sheets (12 per sheet), plus the 12 earlier
stills and the first frame of each video. Rejected (not converted, not in the manifest):

| Matrix key | Job id | Reason |
| --- | --- | --- |
| `services-040` (index 39, interstate: "moving van on an elevated highway approaching a generic city skyline at dusk") | 69128975-add7-44ae-8156-09e862afbe89 | recognizable real-city skyline (Chicago-like tower silhouette); violates the no-landmark rule |
| `season-335` (index 334, "unloading a truck at a farmhouse in golden hour with corn stubble fields behind") | e5b5ab00-ab6f-4f6f-be9b-bd2c99f29e37 | rendered a grain truck unloading grain, not a household move |

Generation failures retried once with the same prompt (both succeeded on retry): index 292
(Utah detail tile, first job 3d5febec-9251-46ee-83ab-4ee9e7601a3d) and index 302 (how-it-works
walkthrough, first job bf1b912a-7f35-4f00-861c-75a85e6eaa55).

Observations that were kept but are worth knowing: a few 1:1 "detail" tiles rendered the prompted
box as a wooden crate or a wall-mounted utility box rather than a cardboard box (e.g. `state-nv-tile`,
`state-pa-tile`, `state-ga-tile`); `svc-specialty-pool-table-slate-wrapped-in` shows blanket-wrapped
slate panels; `for-movers-mover-scanning-an-inventory-tag` shows a barcode label with no legible text.
Several people-in-frame shots show a face at medium distance (no close-ups).

## Credits spent

| Item | Count | Credits |
| --- | ---: | ---: |
| Stills, `gpt_image_2_5` (404 matrix prompts + 2 retries; 2 failed jobs were not charged) | 404 charged | 101.0 |
| Videos, `seedance_2_5` (submitted before this pass; no regeneration needed) | 4 | 0 in this pass |
| **Total this pass** | | **101.0 of the 150-credit still budget** |

Balance: 4162.15 before, 4061.15 after.

## What was not possible

Real stock footage and photography of specific cities (skylines, named neighbourhoods, landmarks)
could not be sourced: the sandbox's network policy blocks the stock hosts. To add licensed stock
later, these hosts need allowlisting:

- `api.pexels.com`, `images.pexels.com`, `videos.pexels.com`
- `pixabay.com`, `cdn.pixabay.com`

Until then every regional asset is a synthetic, landmark-free scene, and the manifest's
`placeholder` flag stays `false` because these are final, licensed-for-use assets rather than stubs.

## Manifest notes for consumers

- Required schema fields are exactly as agreed: `id, kind, src, poster?, width, height, alt, credit{creator, source_url, license, attribution_required}, tags[], usedOn[], placeholder:false, generator?`.
- Additive fields: `srcset` (`[{src, width}]`, the WebP tiers), `blurDataURL` (24 px blurred WebP data URL for `next/image placeholder="blur"`), and for videos `sources` (`[{src, type, width?}]`, WebM first), `autoplay: true`, `duration: 8`. The `design/premium` branch's `manifest.schema.json` has `additionalProperties: false` and `usedOn.minItems: 1`; it needs these fields added (and `minItems` relaxed to 0 for unassigned assets) when the branches merge, or the integrator strips them.
- `usedOn` is empty for every asset. A page that adopts an asset writes its single route there; `pnpm media:check` fails when an id is listed on more than one page or the same page twice, and reports how many assets are still unassigned.
- Ids are stable and human-readable: `state-<code>-hero|card|tile`, `svc-<service>-<slug>`, `<family>-<slug>`, plus the four video ids above.
- The manifest is ~700 KB because of the inline blur data URLs; it is imported server-side only.
