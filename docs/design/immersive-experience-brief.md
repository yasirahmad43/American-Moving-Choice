# Owner-directed immersive redesign

## New owner review — 2026-10-29 (active follow-up)

The owner does not accept the earlier 8.9 self-assessment as completion: other pages are about
6/10 and SEO/content about 5/10 in their judgment. Continue improving the actual site and content;
do not manufacture a perfect score or present technical checks as search-ranking guarantees.

- Every guide/catalog result card needs a relevant image, including all state/city/route/service/
  cost/question/planning/tool cards. Do not limit imagery to the five feature cards.
- `/routes/` must expose thousands of quality route guides, rather than the eight starter routes.
  Keep all existing quality, attribution, privacy, transport and uniqueness gates. Build useful
  origin/destination comparisons from real sourced data; do not publish thin name-swapped pages.
- A survey in the hero AND a survey immediately before the footer is a shared rule across the
  public site. They must function independently with unique IDs and preserve explicit permissions.
- The national state map must show visible state labels, with readable treatment for small states
  and mobile, rather than requiring visitors to identify blank outlines.
- Audit content and search/AI visibility against current Google/OpenAI guidance and established
  moving resources. The current demo/noindex configuration blocks ordinary search discovery;
  page volume is not proof of eligibility, usefulness, rankings or AI citations.
- The real business name is **American Moving Choice**. The owner explicitly deferred address,
  phone, email and other identity details until later. Do not ask again or invent these values.
- The owner signed into Supabase on 2026-10-29 so Storage setup can continue. Parent IAB browser2
  has signed-in tab6 on the organization/project dashboard; child-agent tab handles may differ.
  The owner explicitly approved secure transfer of the existing server key into Vercel `amc-app`
  Production and Preview. Both sensitive entries are saved; a rebuild of the tested live release
  verified real Storage write/public-read/cleanup. No new key was created and no credential was
  saved in source, local files or chat. See `docs/media/storage.md` for the exact deployment.

Follow-up branch: `codex/complete-moving-experience`, based on live release `5b276b2` (PR #8).
The old release/gallery/crawl is historical baseline evidence for the newly expanded brief.

## Earlier implementation brief

Current owner instructions supersede the earlier editorial pass. The deployed `bbbdfb9` release
is a functional baseline, not an accepted visual result. The owner rated it 2/10.

- Every public landing/guide/service/help page follows the same homepage framework: a cinematic
  video hero with the survey on the right, followed by image-led, varied reading sections.
- Keep the facts, explanations, lists, tables, FAQ, sources and substantive content. Present them
  as alternating photo/text chapters, illustrated bullet lists, data cards, bento layouts and
  timelines. Do not turn long pages into one plain prose column or delete sections to shorten them.
- Each page has at least five different relevant photographs. Editorial pictures may be reused
  across pages; selections within a page are distinct, deterministic and appropriate to its topic.
  Existing exclusive hero/upload ownership stays intact. General illustrations are not labeled
  as photographs of a specific city.
- Vary icons, video choice, graphics and motion by topic/page where useful. The shared framework
  is consistent; page content and media selections are specific. Respect reduced motion and
  keyboard controls, and keep content visible if animation scripts do not load.
- All public destinations belong in a clear menu/footer discovery system. Expose standalone
  pages, all seven published guide families, state/city navigation and a searchable full catalog.
  Actual production has 2,468 published guides; surface them prominently rather than hiding them.
- Remove public marketing about AMC being paid or how it makes money. Keep contact permissions
  clear. Historical stored texts/consent records and internal mover billing are not rewritten.
- Company names remain absent from consumer browsing, the request and confirmations. Companies
  identify themselves when contacting the consumer.
- Use the exact owner-supplied national-map/red-truck logo. Original SHA-256:
  `502267aea04b02c713222a29ba2405852a6be34b3ce8676f0de4ba53811712cd`.
  The unchanged PNG is in both apps' `public/brand/american-moving-choice-logo.png`.

Reference sites supplied by the owner (benchmarks rated about 5/10, not an instruction to copy):

- https://injurysage.com/
- https://sac-preview-cdd8e23d.vercel.app/
- https://smoothrelocationvanlines.com/
- https://ashomesolutionsmd.com/
- https://aplusmovingandstorage.co/
- https://freedomhealthcaresavings.com/

Implementation branch: `codex/immersive-site-redesign`, starting from `bbbdfb9`. The current
production database/bootstrap is complete: 17 migrations, 2,468 passing published guides, zero
requested quality/privacy violations. This visual pass should not regenerate or replace them.

Verification must include the real rendered home, cost guide, planning hub, each SEO family and
all standalone public routes, desktop/mobile hero placement, five distinct body photographs,
navigation discovery, retained content, motion controls, privacy and the quote flow. The older
pass-2 proof is baseline evidence and must not be presented as proof of this new design.

Review against all six references using the same visual/entry-flow rubric, with the owner's
approximately 5/10 reference rating as context. Keep earlier critique captures and document
each iteration's concrete fixes. Evaluate local identity, useful media, icons and motion within
the required shared homepage framework; the common right-side survey itself is intentional.
Do not substitute a perfect numerical claim for inspecting actual rendered desktop/mobile pages.

The home state-guide map and place-guide state outlines use real Census-derived geometry from
`us-atlas` 3, simplified by 0.4 projected pixels. They navigate published state guides rather
than making mover-coverage claims. Geometry attribution/ISC permission are retained alongside
the shape data, and native state search remains available for small map targets.
