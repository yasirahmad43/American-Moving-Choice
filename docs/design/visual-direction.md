# Visual Direction: "Route Ledger"

| | |
|---|---|
| Status | **Proposed** (Phase 1 discovery). Needs owner approval before Phase 3 design. |
| Date | 2026-10-27 |
| Companion file | [`style-tile.html`](./style-tile.html): tokens, components and a working survey demo. It is a single static file; open it in any browser. |
| Brand input | `brand/logo-source.webp` (raster, 1774×887). Sampled colors: navy `#063167`, red `#E0141C`. |
| Scope | Public website, quote survey, company portal, CRM and admin. One system with three density modes. |

---

## 1. The direction in one paragraph

**Route Ledger** pairs two ideas the product actually stands on. The **route** is the consumer's real move, origin to destination, and it is directional: Florida→Georgia is not Georgia→Florida. The **ledger** is the evidence: what we checked about a mover and when, who can receive a request, how many companies bought a lead, and what each one paid. Visually that means crisp white and cool-gray canvases, brand navy for structure, and a heavy condensed display face that echoes the wordmark. Brand red is a single, rationed accent. A thin dashed route line, with a navy origin ring and a red destination dot, is the signature motif. Data appears as ledger rows with tabular figures and absolute dates. The look aims to be confident and modern by being specific. It never uses borrowed authority, superlatives or invented numbers.

**Base archetype** (from `high-end-visual-design`): *Soft Structuralism*. White or silver canvases, bold grotesk display type, components that sit lightly on the page with diffused shadows tinted to navy. **Hero layout archetype:** *Editorial Split*. Message and video on the left, quote survey on the right, collapsing to message → survey → video on mobile.

**Taste dials** (from `design-taste-frontend-v1`, adapted to the brief):

| Surface | Design variance | Motion intensity | Visual density |
|---|---|---|---|
| Public site | 5 (offset, not chaotic: trust beats novelty) | 3 (CSS only, purposeful) | 4 |
| Quote survey | 3 | 2 | 3 |
| Company portal and CRM | 3 | 2 | 7 |
| Admin | 2 | 1 | 8 |

---

## 2. Skills record (design and motion)

| Skill | Verdict | How it was used, or why not |
|---|---|---|
| `ui-ux-pro-max` | **Not installed** | Named in the brief but not available here. `high-end-visual-design` and `design-taste-frontend-v1` served as the closest equivalents. |
| `high-end-visual-design` | Used selectively | Soft Structuralism vibe, Editorial Split hero, custom easing curves, motion limited to transform and opacity, blur only on fixed layers. Double-bezel nesting is used for the survey shell only. |
| `design-taste-frontend-v1` | Used | Taste dials (adapted above). Full interaction states (loading, empty, error, pressed). Labels above inputs. Anti-slop copy rules. Single accent color. Banned-font list. |
| `gpt-taste` | Used selectively, for motion | One GSAP storytelling moment per page family, trigger-once. H1 kept to 2–3 lines with wide containers. Button-contrast check. Pinning, scrubbing, card stacking and scroll-scaled images were rejected (see conflicts). |
| `minimalist-ui` | Partially adopted | Flat components, hairline dividers, label-above-input forms, restrained motion, crisp radii. **Rejected:** the warm monochrome palette and pastel accents, which conflict with the navy and red brand. |
| `brandkit` | Skip for now | A logo already exists, and generating a new mark would fragment the brand. Revisit for a guidelines board once a vector master of the existing logo exists. |
| `imagegen-frontend-web` | Skip in Phase 1 | Candidate for Phase 3 layout comps (one image per section). Never to be used for photography of people, crews, offices or moves. |
| `image-to-code` | Skip in Phase 1 | Its workflow requires generated comps first. Evaluate in Phase 3 if comps are approved. This direction is tokens-first with a coded style tile instead. |
| `stitch-design-taste` | Skip | Google Stitch is not part of the selected workflow. The brief limits this skill to a Stitch workflow. |

### Conflicts resolved in favor of accessibility, readability, conversion and performance

| Skill prescription | Problem | Decision |
|---|---|---|
| Ultra-light icons only (Phosphor Light/Thin) — *high-end* | Thin strokes lose legibility at 16–20px and for low-vision users | Phosphor **Regular** for UI; **Bold** at 16px |
| Floating glass-pill navbar, morphing hamburger, full-screen blurred menu with staggered link reveal — *high-end* | Backdrop blur costs frames on mid-range phones. A floating pill wastes width. Staggered reveals delay navigation. | Static full-width header, a simple disclosure menu, no stagger |
| Double-bezel nesting on every card — *high-end* | Box-in-box clutter (also banned by `image-to-code`). Loses width on mobile. | Survey shell only, at ≥1024px |
| `py-24`–`py-40` section padding; `py-32 md:py-48` — *high-end / gpt-taste* | Pushes the survey and answers below the fold on phones | Fluid `clamp(48px, 2rem + 5vw, 112px)` |
| Scroll-entry animation on every element, blur-in, perpetual micro-loops — *high-end / design-taste* | Distracting in forms and dashboards. Can conflict with WCAG 2.2.2 and 2.3.3, and costs INP and battery. The brief requires fast, predictable forms. | Entry fades only for editorial sections below the fold. No blur. No infinite loops (the skeleton shimmer runs only while loading, and is static under reduced motion). |
| Centered hero banned — *design-taste* vs. centered hero preferred — *gpt-taste* | The skills contradict each other | Split hero, because the survey must be visible in the first viewport |
| No three-column card rows — *design-taste* | Directories and guide grids are homogeneous collections, where three columns scan best | Allowed for homogeneous collections; avoided for marketing "feature" rows |
| Saturation under 80%, one accent — *design-taste* | The brand red is fully saturated | Keep brand red as the one accent, rationed (§5.3). Buttons use a darker `#C21018`. |
| Placeholder images from picsum; "messy organic numbers" — *design-taste* | The brief forbids hotlinked stock and invented trust statistics | Labeled placeholder blocks. Every sample number is labeled "Sample". Samples use zeros for USDOT/MC so they can't match a real carrier. |
| GSAP pinning, scrubbed text reveals, stacking cards, scroll-scaled images — *gpt-taste* | Optional per the brief. Risks motion sickness, scroll-jank and CLS. | One trigger-once route-draw moment; no pinning or scrubbing at launch |
| No pill primary buttons; 4–6px button radius — *minimalist-ui* | Neutral either way | 12px-radius buttons; pills only for chips and badges |

---

## 3. Principles

1. **Show the route.** Each public page anchors on a real move: origin, destination, distance class and which movers actually serve it. Routes are directional everywhere: in copy, URLs, cards and coverage editors.
2. **Evidence on the surface.** Every trust claim sits next to its evidence: what was checked, the source, the date, and a link to the official record. If we can't show the evidence, we don't make the claim.
3. **One job per screen.** On public pages the survey is the primary object. In portals, each screen serves one decision (buy, follow up, verify).
4. **Calm motion, fast tools.** Motion explains a change of state. It never decorates forms, purchases or dashboards.
5. **Honest empty states.** "New to our network", "No customer reviews yet" and "We don't have movers on this route yet" are designed states, not gaps to hide.
6. **Accessible by default.** WCAG 2.2 AA is the floor, and body text meets AAA. Touch targets are 44px or more. Color is never the only signal.
7. **Never borrow authority.** The brand's navy and red already read as American. We add nothing that suggests government endorsement.

### What we never do

- **No government look-alikes:** no eagles, seals, rosettes, ribbons, starred shields, Capitol or flag imagery, stars-and-stripes patterns, "official website" banners, and no USDOT or FMCSA logos. FMCSA is named only in text, linked to its public lookup.
- **No federal typeface:** we don't use Public Sans, the U.S. Web Design System font. It reads as federal government.
- **No unsupportable claims:** no "best movers", "top-rated" (unless backed by the published methodology), "guaranteed", "government approved", "certified" (unless a named certification), or "#1".
- **No invented trust data:** no fake counters ("10,000+ moves!"), invented ratings, years in business, completed moves or testimonials.
- **No red-to-navy reliance:** red is never placed directly on navy as the only distinguishing cue (2.61:1, see §5.4).
- **No AI-cliché copy:** no "Elevate", "Seamless", "Unleash", "Next-gen".

---

## 4. Brand assets

- **Vector master needed.** The supplied logo is a 1774×887 raster with soft, slightly noisy coastline edges. Before launch, commission or redraw a vector master (SVG and PDF) and run a trademark clearance check. This is outside design's control; flagged for the owner.
- **Variants:**
  - Full horizontal lockup (map + truck + wordmark).
  - Stacked wordmark only.
  - **Reversed version for dark and navy surfaces:** wordmark `#FFFFFF` with "CHOICE" in `#FF5A5F` (6.13:1 on `#0A1222`).
  - Small-size mark for favicon and app icon: the **box truck with red cab**, without the map. The map silhouette breaks down below about 48px.
- **Clear space and minimum size:**
  - Clear space equals the cap height of "MOVING" on all sides.
  - Full lockup at least 140px wide on screen. Mark-only at least 24px.
- **Logo color:** brand red `#E0141C` in the logo is exempt from text-contrast rules, but it is never recolored to the darker CTA red.
- **Style tile stand-in:** the tile uses a type-only lockup (Archivo) as a stand-in. Production uses the official artwork.

---

## 5. Color

### 5.1 Light tokens

| Token | Hex | Role |
|---|---|---|
| `--bg` / `--surface` | `#FFFFFF` | Page canvas, cards |
| `--surface-2` | `#F6F8FB` | Alternate sections, summaries, locked-data panel |
| `--surface-3` | `#EEF2F7` | Subtle fills, skeletons, disabled fills, survey-shell tray |
| `--text` | `#111C2E` | Primary text (navy-tinted ink, never pure black) |
| `--text-2` | `#3B4A61` | Secondary text, ledes |
| `--text-3` | `#55657D` | Meta text, captions, timestamps |
| `--border` | `#DFE5EE` | **Decorative** hairlines only (dividers, card edges) |
| `--border-strong` | `#74839A` | Boundaries of form controls and interactive cards (≥3:1) |
| `--brand-navy` / `--primary` | `#063167` | Primary buttons, headings accents, meters, badges |
| `--primary-hover` | `#04254F` | Primary hover and pressed state |
| `--brand-red` | `#E0141C` | Logo, display accents ≥24px bold, the route destination dot |
| `--cta` | `#C21018` | Conversion button fill (white text 6.21:1) |
| `--cta-hover` | `#A10D14` | CTA hover and pressed state (8.13:1) |
| `--link` / `--focus` | `#1F4C8C` | Links, 3px focus ring |
| `--info-bg` / `--info-text` | `#EEF3FA` / `#063167` | Info panels, "New to our network", selected choice tint |
| `--success` / `--success-bg` | `#146C35` / `#E7F4EC` | Approved, verified completed move, success toasts |
| `--warning` / `--warning-bg` | `#7A4A00` / `#FFF3DC` | Due today, document expiring, re-check pending |
| `--error` / `--error-bg` | `#B3261E` / `#FDECEA` | Errors, overdue, suspended |
| `--band` / `--on-band` / `--on-band-2` | `#063167` / `#FFFFFF` / `#DCE6F4` | Navy bands (company-facing CTA, footer) |
| `--focus-on-band` | `#9DC4FF` | Focus ring on navy surfaces |

### 5.2 Dark tokens

Dark mode applies through `prefers-color-scheme`, with a manual override via `data-theme`. It is recommended for the portals (long sessions) and supported on public pages. Photography must be checked in both modes.

| Token | Hex | Notes |
|---|---|---|
| `--bg` | `#0A1222` | Navy-black canvas |
| `--surface` / `--surface-2` / `--surface-3` | `#111B2E` / `#172338` / `#1D2A42` | Elevation is shown by surface steps, not heavy shadows |
| `--text` / `--text-2` / `--text-3` | `#E9EEF6` / `#B4BFD0` / `#8F9BB0` | |
| `--border` / `--border-strong` | `#2A3852` / `#5B6B86` | Same rule: hairline is decorative, strong is for controls |
| `--primary` / `--on-primary` | `#BFD3F2` / `#04254F` | Light-navy fill with dark text. Navy fill would fail on a dark canvas. |
| `--cta` / `--cta-hover` | `#E0141C` / `#C21018` | Brand red keeps the fill 3.51:1 against the surface |
| `--link` / `--focus` | `#9DBDF0` / `#8EC5FF` | |
| Display red | `#FF5A5F` | Wordmark "CHOICE" and large accents on dark |
| Info · success · warning · error (text on background) | `#BFD3F2` on `#14284A` · `#6FD394` on `#0F2A1B` · `#F5B95A` on `#2E2108` · `#FF8A80` on `#33140F` | |

### 5.3 Rules for red

- **Brand red `#E0141C` is not a text color** at body sizes. At 4.90:1 on white it passes AA, but only just, and thin strokes antialias below that. Use it only for the logo, display accents (24px or larger, bold) and decorative markers.
- **CTA red `#C21018` marks the one conversion action in view.** That means *starting* or *sending* a quote request:
  - The hero's first "See available movers" button.
  - The final "Send my request" button.
  - The header "Get quotes" button, but **only** on pages with no inline survey in the first viewport. Elsewhere the header CTA is secondary.
  - "Request a quote" on a company profile.
- **Everything else uses navy primary or neutral styles.** That includes survey "Continue", portal "Buy lead" and admin decisions. Destructive actions use the error style with a confirmation step, never red fill. This keeps red from reading as "danger" and avoids clashing with error states.
- **On navy bands**, the primary button is white with navy text (12.78:1). Red-on-navy fails (2.06–2.61:1).

### 5.4 Computed contrast (WCAG 2.x relative luminance)

Method: a Python script on 2026-10-27, applying the WCAG relative-luminance formula. Thresholds: body text needs 4.5:1 for AA and 7:1 for AAA. Large text (24px, or 18.66px bold) needs 3:1 for AA and 4.5:1 for AAA. UI boundaries, focus rings and icons need 3:1. **FAIL rows are combinations we prohibit or use only decoratively.**

| Pairing | Colors | Ratio | Result |
|---|---|---|---|
| L · Primary text on canvas | `#111C2E` on `#FFFFFF` | 17.08:1 | AAA |
| L · Primary text on surface-2 | `#111C2E` on `#F6F8FB` | 16.06:1 | AAA |
| L · Secondary text on canvas | `#3B4A61` on `#FFFFFF` | 8.98:1 | AAA |
| L · Secondary text on surface-2 | `#3B4A61` on `#F6F8FB` | 8.44:1 | AAA |
| L · Meta text on canvas | `#55657D` on `#FFFFFF` | 5.93:1 | AA |
| L · Meta text on surface-2 | `#55657D` on `#F6F8FB` | 5.57:1 | AA |
| L · Meta text on info/navy-50 | `#55657D` on `#EEF3FA` | 5.32:1 | AA |
| L · Link on canvas | `#1F4C8C` on `#FFFFFF` | 8.50:1 | AAA |
| L · Link on surface-2 | `#1F4C8C` on `#F6F8FB` | 7.99:1 | AAA |
| L · Brand navy text on canvas | `#063167` on `#FFFFFF` | 12.78:1 | AAA |
| L · White on primary button / navy band | `#FFFFFF` on `#063167` | 12.78:1 | AAA |
| L · navy-100 secondary text on navy band | `#DCE6F4` on `#063167` | 10.15:1 | AAA |
| L · White on CTA red | `#FFFFFF` on `#C21018` | 6.21:1 | AA |
| L · White on CTA hover | `#FFFFFF` on `#A10D14` | 8.13:1 | AAA |
| L · Brand red display (≥24px bold) on canvas | `#E0141C` on `#FFFFFF` | 4.90:1 | AAA (large) |
| L · Brand red as body text (**not allowed**) | `#E0141C` on `#FFFFFF` | 4.90:1 | AA, borderline |
| L · Navy on navy-50 chip | `#063167` on `#EEF3FA` | 11.46:1 | AAA |
| L · navy-700 on navy-50 (info panel) | `#123E7A` on `#EEF3FA` | 9.44:1 | AAA |
| L · text-2 on gray-100 chip (Sponsored) | `#3B4A61` on `#EEF2F7` | 7.99:1 | AAA |
| L · Success text on success-bg | `#146C35` on `#E7F4EC` | 5.75:1 | AA |
| L · Warning text on warning-bg | `#7A4A00` on `#FFF3DC` | 6.81:1 | AA |
| L · Error text on error-bg | `#B3261E` on `#FDECEA` | 5.72:1 | AA |
| L · Error text on canvas | `#B3261E` on `#FFFFFF` | 6.54:1 | AA |
| L · Navy text on white button (on band) | `#063167` on `#FFFFFF` | 12.78:1 | AAA |
| L · Control border on canvas | `#74839A` on `#FFFFFF` | 3.85:1 | ≥3:1 pass |
| L · Control border on surface-2 | `#74839A` on `#F6F8FB` | 3.62:1 | ≥3:1 pass |
| L · Focus ring on canvas | `#1F4C8C` on `#FFFFFF` | 8.50:1 | ≥3:1 pass |
| L · Focus ring on navy band | `#9DC4FF` on `#063167` | 7.17:1 | ≥3:1 pass |
| L · CTA fill vs canvas | `#C21018` on `#FFFFFF` | 6.21:1 | ≥3:1 pass |
| L · White button vs navy band | `#FFFFFF` on `#063167` | 12.78:1 | ≥3:1 pass |
| L · Filled meter segment vs canvas | `#063167` on `#FFFFFF` | 12.78:1 | ≥3:1 pass |
| L · Warning icon on canvas | `#C77700` on `#FFFFFF` | 3.46:1 | ≥3:1 pass |
| L · Success icon on canvas | `#1A7F40` on `#FFFFFF` | 5.06:1 | ≥3:1 pass |
| L · Brand red next to navy | `#E0141C` on `#063167` | 2.61:1 | **FAIL: never the only cue** |
| L · CTA red on navy band | `#C21018` on `#063167` | 2.06:1 | **FAIL: prohibited** |
| L · Decorative hairline | `#DFE5EE` on `#FFFFFF` | 1.27:1 | **FAIL: decorative only** |
| D · Primary text on canvas | `#E9EEF6` on `#0A1222` | 16.06:1 | AAA |
| D · Primary text on surface | `#E9EEF6` on `#111B2E` | 14.77:1 | AAA |
| D · Primary text on surface-2 | `#E9EEF6` on `#172338` | 13.51:1 | AAA |
| D · Secondary text on surface | `#B4BFD0` on `#111B2E` | 9.26:1 | AAA |
| D · Secondary text on surface-2 | `#B4BFD0` on `#172338` | 8.47:1 | AAA |
| D · Meta text on canvas | `#8F9BB0` on `#0A1222` | 6.67:1 | AA |
| D · Meta text on surface | `#8F9BB0` on `#111B2E` | 6.13:1 | AA |
| D · Meta text on surface-2 | `#8F9BB0` on `#172338` | 5.61:1 | AA |
| D · Link on surface | `#9DBDF0` on `#111B2E` | 8.99:1 | AAA |
| D · Link on canvas | `#9DBDF0` on `#0A1222` | 9.77:1 | AAA |
| D · Primary button text | `#04254F` on `#BFD3F2` | 9.99:1 | AAA |
| D · White on CTA | `#FFFFFF` on `#E0141C` | 4.90:1 | AA |
| D · White on CTA hover | `#FFFFFF` on `#C21018` | 6.21:1 | AA |
| D · Display red on canvas | `#FF5A5F` on `#0A1222` | 6.13:1 | AAA (large) |
| D · Info chip | `#BFD3F2` on `#14284A` | 9.65:1 | AAA |
| D · Success text on success-bg | `#6FD394` on `#0F2A1B` | 8.35:1 | AAA |
| D · Warning text on warning-bg | `#F5B95A` on `#2E2108` | 8.95:1 | AAA |
| D · Error text on error-bg | `#FF8A80` on `#33140F` | 7.37:1 | AAA |
| D · Error text on surface | `#FF8A80` on `#111B2E` | 7.54:1 | AAA |
| D · Control border on surface | `#5B6B86` on `#111B2E` | 3.19:1 | ≥3:1 pass |
| D · Control border on canvas | `#5B6B86` on `#0A1222` | 3.47:1 | ≥3:1 pass |
| D · Focus ring on canvas | `#8EC5FF` on `#0A1222` | 10.32:1 | ≥3:1 pass |
| D · Focus ring on surface | `#8EC5FF` on `#111B2E` | 9.49:1 | ≥3:1 pass |
| D · Primary fill vs surface | `#BFD3F2` on `#111B2E` | 11.32:1 | ≥3:1 pass |
| D · CTA fill vs surface | `#E0141C` on `#111B2E` | 3.51:1 | ≥3:1 pass |
| D · CTA fill vs canvas | `#E0141C` on `#0A1222` | 3.82:1 | ≥3:1 pass |
| D · Decorative hairline | `#2A3852` on `#111B2E` | 1.46:1 | **FAIL: decorative only** |

The automated audit (axe-core 4.10.2) of `style-tile.html` in light and dark mode at 360px and 1280px reported **0 violations**, including color contrast (see §13).

---

## 6. Typography

| Role | Family | License | Fallback stack |
|---|---|---|---|
| Display (H1–H3, overlines, wordmark echo) | **Archivo** (Omnibus-Type), variable: width 62–125, weight 100–900 | SIL OFL 1.1 | `"Archivo", "Arial Narrow", "Helvetica Neue", system-ui, sans-serif` |
| Body and UI | **Source Sans 3** (Adobe), variable weight | SIL OFL 1.1 | `"Source Sans 3", "Segoe UI", system-ui, -apple-system, sans-serif` |
| Monospace (admin IDs, audit logs only) | System `ui-monospace`, no webfont | — | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

**Why these fonts:**

- **Archivo** at 72–78% width and weight 800 echoes the heavy condensed "MOVING CHOICE" wordmark without copying it. At normal width and weight 700 it works for H3s and overlines. The tracked overline (0.12em) echoes the spaced "A M E R I C A N".
- **Source Sans 3** has a large x-height, open apertures, distinct I/l/1, and tabular figures for prices, counts and dates.
- **Neither is on the banned list** of the design skills (Inter, Roboto, Arial, Helvetica, Open Sans as primary). System fonts appear only as fallbacks; resilience beats taste.

**Loading:**

- Self-host through `next/font` at build time: no runtime requests to Google, latin subset, `display: swap` and automatic size-adjusted fallbacks to limit CLS.
- Budget: two font files on first load, ≤120KB woff2 combined. If the Archivo variable file is heavy, instance it to width 72–100 and weight 600–900.
- Preload only the display file used above the fold.
- The style tile loads Google Fonts for convenience. **This environment's network policy blocked the font requests, so the tile was verified in fallback fonts.** Re-check that Archivo's width axis is available before build.

**Scale** (fluid, about 1.25 ratio):

| Token | Font, weight, width | Size | Line height | Use |
|---|---|---|---|---|
| `display-xl` | Archivo 800, 75% | `clamp(2.25rem, 1.35rem + 3.6vw, 4rem)` | 1.02 | Home and route H1. Max 18ch, so 2–3 lines. |
| `display-l` | Archivo 800, 78% | `clamp(1.75rem, 1.3rem + 1.8vw, 2.5rem)` | 1.08 | Inner-page H1, section H2 |
| `h3` | Archivo 700, 100% | 1.375rem (22px) | 1.25 | Card and panel titles |
| `h4` | Source Sans 3 700 | 1.125rem (18px) | 1.3 | Step titles, portal headings |
| `lede` | Source Sans 3 400 | `clamp(1.125rem, 1rem + .4vw, 1.25rem)` | 1.55 | Intro paragraphs, max 56ch |
| `body` (public) | Source Sans 3 400 | 1.0625–1.125rem (17–18px) | 1.6 | Max 68ch |
| `body` (portal) | Source Sans 3 400 | 1rem (16px) | 1.5 | Inputs are always 16px or larger, which stops iOS zoom |
| `small` | Source Sans 3 400 | 0.875rem (14px) | 1.45 | Meta. Nothing smaller except legal footnotes at 13px. |
| `overline` | Archivo 700, 100%, tracked 0.12em, uppercase | 0.8125rem (13px) | 1.2 | Max 5 words |

**Rules:**

- Headlines are sentence case. Uppercase is only for overlines and chips.
- Use `text-wrap: balance` on headings.
- Use `font-variant-numeric: tabular-nums` for every money amount, count, date and USDOT/MC number.
- Money is never animated (no count-up effects).

---

## 7. Layout, spacing and surfaces

**Breakpoints:** 480 / 768 / 1024 / 1280 / 1536px. Design is mobile-first.

**Grid:**

- Mobile: 4 columns, 16px side gutters, 12px gaps.
- Tablet: 8 columns, 24px gutters.
- Desktop: 12 columns, 24px gaps; 32px gutters at 1280px and above.

**Containers:**

- Reading: 720px (about 68ch).
- Content: 1200px.
- Portal: fluid up to 1440px.

**Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Section padding is `clamp(48px, 2rem + 5vw, 112px)`.
- Separate sections by a background change *or* a hairline, not both.

**Radii:**

| Radius | Use |
|---|---|
| 4px | Tags |
| 8px | Badges, Preferred Mover badge |
| 12px | Buttons, inputs, choice cards, toasts |
| 16px | Cards, media frames |
| 24px | Survey shell, with an 18px inner radius |
| Pill | Chips and meters |

**Elevation** (navy-tinted, diffused, never harsh black):

| Level | Shadow | Use |
|---|---|---|
| e1 | `0 1px 2px rgba(6,49,103,.06), 0 2px 6px -2px rgba(6,49,103,.08)` | Cards at rest |
| e2 | `0 12px 28px -14px rgba(6,49,103,.22), 0 2px 6px rgba(6,49,103,.06)` | Survey, popovers, hovered interactive cards |
| e3 | `0 28px 56px -20px rgba(6,49,103,.32)` | Dialogs, toasts |

In dark mode, elevation comes from lighter surface steps, not shadows.

**Borders:**
- `--border` hairlines are decorative only.
- Anything a user must recognize as a control has a `--border-strong` edge (3:1 or better), or a filled shape with a text label.

**Z-index layers:** header 10, sticky mobile CTA bar 20, popover 30, dialog 40, toast 50. Nothing else gets a z-index.

---

## 8. Iconography

- **Library:** Phosphor Icons (MIT), Regular weight at 20–24px and Bold at 16px. Fill weight only for selected states.
- **Stroke:** the equivalent of 1.75px at 24px, with round caps and joins.
- **Labels:** icons always pair with text. Icon-only buttons need an `aria-label` and a visible tooltip on hover and focus.
- **Brand glyphs** (custom, never from a stock set):
  - **Route mark:** navy origin ring → dashed path → red destination dot. Used in route displays, the Preferred Mover badge, and the How-it-works line.
  - **Box truck with red cab:** brand moments, favicon and app icon.
- **Avoid shields, stars and seals** as verification icons. Use an ID-card or clipboard-check glyph instead.

---

## 9. Components

Each component is shown in `style-tile.html` unless noted otherwise.

### 9.1 Buttons

| Variant | Spec | Use |
|---|---|---|
| CTA | `--cta` fill, white text 6.21:1. A trailing arrow sits in a 30px translucent circle (the skill's "button-in-button" detail), which nudges 2px right on hover. | The one conversion action in view (§5.3) |
| Primary | Navy fill, white text | Continue, Buy lead, Save |
| Secondary | Surface fill, 1.5px `--border-strong` edge | Alternatives, filters |
| Ghost | Link color, underlined, 44px hit area | Tertiary actions ("Learn how credits work") |
| Destructive (portal) | Error-colored text and edge on surface fill, plus a confirmation dialog | Delete view, suspend company |

**Shared specs:**
- 48px tall (44px minimum), 12px radius, Source Sans 3 600 at 17px.
- Pressed state: `translateY(1px)`.
- Focus: 3px `--focus` outline at 2px offset.
- Disabled: `--surface-3` fill with `--text-3` text. Where possible, explain *why* the button is disabled in adjacent text.
- Loading: the label changes to "Processing…" with `aria-busy`. No spinner-only states.

### 9.2 Inputs and form rules

- **Layout:** label above the field, helper text below, error text below that.
  - Errors use an icon plus text, plus `aria-invalid` and `aria-describedby`.
  - On submit, focus moves to the first invalid field, and a polite live region announces the count of fields that need attention.
- **Fields:** 48px tall, 16px+ font, 1.5px `--border-strong` edge. Focus adds a 3px ring and a navy edge. Errors get a 2px error-colored edge.
- **ZIP code:**
  - Text field with `inputmode="numeric"` and **no `maxlength`**. The script strips non-digits and keeps the first five. A test showed `maxlength` truncates a pasted " 02108" or "02108-1234" before cleanup can run.
  - ZIP codes are always strings; leading zeros are preserved (02108 → Boston, MA).
  - The resolved city and state appear in the helper line.
  - Ambiguous or unknown ZIP codes prompt a city choice. Unsupported locations get a plain message.
- **Date:** native date input plus a "My dates are flexible" checkbox that reveals an earliest–latest range.
- **Choice cards** (move size, sharing limit):
  - At least 56px tall, with a native radio input inside.
  - Selected state uses three signals: 2px navy edge, info tint and the native check. Never color alone.
- **Checkboxes:** 20px, with the whole row clickable at 44px or more. **Consent checkboxes are never pre-checked** and are never combined with the submit button.

### 9.3 Survey stepper

- **Header:** "Step 2 of 4", plus a 4px progress track. The fill animates via `transform: scaleX`, and the bar is `aria-hidden` because the text carries the meaning.
- **Every step:**
  - Is a `fieldset` with a visible heading that receives focus on step change (`tabindex="-1"`).
  - Is announced through a polite live region.
  - Has Back available from step 2 onward, with all values preserved.
  - Has Continue as `type="submit"`, so Enter advances the form.
- **Persistence:**
  - **Move details** persist in `sessionStorage` while the visitor navigates.
  - **Contact details are never stored client-side.** In production they go to a server-side draft governed by the consent and retention rules.
- **Transitions:** 280ms fade with an 8px rise. They never block input; focus moves immediately. They are disabled under reduced motion.

### 9.4 Chips and badges

| Element | Style | Rule |
|---|---|---|
| **Preferred Mover · American Moving Choice** | Navy rectangular badge (8px radius) with the route mark. *Not* round, and not seal-like. | Always followed by a **"What 'Preferred Mover' means"** disclosure (`<details>`, never a hover-only tooltip). The text explains it is screened-network membership under published standards; what we checked (USDOT/MC matched to FMCSA records, active household-goods carrier authority, insurance filings on record, not a broker); the last-checked date; and that it is **not** a government endorsement, rating or guarantee. Links to "How we verify movers". |
| Verification date | ID-card glyph + "Last checked Oct 27, 2026" | Always an **absolute** date, never "3 days ago". Links to the official FMCSA SAFER record. States: *Active*, *Re-check in progress* (neutral, within grace period), and *Lapsed*. When lapsed, the badge is removed and the profile says it isn't accepting new requests. Never shown in red as a public shaming device. |
| New to our network | Info chip + calendar glyph + "Joined Oct 2026" | Neutral, not a warning |
| No customer reviews yet | Dashed-outline panel in the rating slot | **No stars and no "0.0".** Explains that reviews appear after verified customers share feedback. |
| Sponsored | Gray chip | Visually distinct from Preferred and verification styles. Never affects badges, ratings or verification. |
| Review evidence labels | "Verified platform inquiry" (gray) · "Verified customer" (info) · "Verified completed move" (success + check) | The **text** states what was verified. Each label links to the review methodology. |
| Lead type | "Exclusive" (navy fill) · "Shared" (outlined) | Shared leads also show the buyer meter and "2 of 3 buyers" text |
| Admin status | Approved (success) · In review (info) · Document expiring (warning) · Suspended (error) | |

### 9.5 Cards

- **Company card (directory):**
  - Logo (56px), name, then a badge row (Preferred, New, Sponsored if paid).
  - Verification line: USDOT · MC · last checked.
  - Rating summary, or "No customer reviews yet".
  - Up to 3 service chips plus "+N", a coverage summary in plain words, and "Request a quote".
  - One column on mobile.
- **Route card:**
  - Origin → destination with the route mark.
  - A cost range only when it has a cited, dated source. Otherwise omit the range rather than estimate it.
  - The reverse route links to its own page.
- **Content card (guides):** 16:9 image, title, two-line excerpt, updated date and reviewer.

### 9.6 Marketplace lead card (company portal)

- **Top row:**
  - Lead type chip.
  - Buyer meter: segments, filled = sold. `aria-hidden`, because the adjacent text "2 of 3 buyers" carries the meaning.
  - Relative age ("14 min ago"), with the absolute timestamp in the `datetime` and `title` attributes.
- **Body:**
  - **First name only**; origin and destination city, state and ZIP (where allowed).
  - Facts list: move date, size, move type, lead source category.
  - A locked panel: "Phone, email and last name unlock after purchase."
- **Price block:**
  - The price in tabular figures.
  - A plain explanation, e.g. "Your shared price $40.00 × 65% (3 buyers)".
  - A credit-policy hint. The style tile labels it as the *proposed* policy, pending approval.
- **Real-time states**, all stated in words:
  - **Updated:** one 1.2s background flash; under reduced motion, an "Updated" text tag instead.
  - **No longer available:** the card dims to 62% and Buy is disabled. The card **stays in place** until the next refresh or a user action, so the list never jumps under the cursor.
  - **Purchase in progress elsewhere:** inline retry message.
  - **Purchased:** "Contact details are now in your CRM".
  - **Payment failed:** inline alert that says no charge was made and nothing was shared.
- **Buy flow:** "Buy lead · $26.00" opens a confirmation sheet showing the amount, payment method, credit applied and policy link. Then "Processing…", then an inline success or error message. Never a toast alone.

### 9.7 CRM pipeline

- **Column header:** stage name, count and total estimated value (tabular figures).
- **Cards:**
  - Full name (after purchase), route, move date and estimated value.
  - Follow-up chip: due today (warning), overdue (error), scheduled (neutral).
  - Assignee initials in an avatar with an accessible name, and the lead type.
- **Moving cards:** drag-and-drop **plus** a keyboard and screen-reader alternative: a "Move to…" menu on each card.
- **Mobile:** columns become a stage selector with a single-column list.
- **Privacy:** the persistent note "Notes and activity are private to your company, even on shared leads" appears on the board and in the detail panel.

### 9.8 Tables (portal and admin)

- **Rows:** 48px (40px in compact mode), hairline dividers, no zebra striping. Sticky header; sortable headers use `aria-sort`.
- **Values:** numbers right-aligned in tabular figures. IDs in system monospace.
- **Actions:** the primary row action is visible; secondary actions go in a menu.
- **Mobile:** below 768px, rows become stacked cards (definition lists). No page-level horizontal scroll.

### 9.9 Feedback, empty, error and loading

- **Toasts:**
  - Bottom-left on desktop, full-width bottom on mobile. Success uses `role="status"`; errors use `role="alert"`.
  - Success toasts auto-dismiss after 6s, pausing on hover or focus. Errors persist until dismissed.
  - Toasts are **never** the only confirmation of a purchase, payment or consent.
- **Empty states:** a heading, one sentence on how to change it, and one action. No cute illustration is required; the route mark may appear.
- **Errors:** inline at the point of failure. Say what happened, what didn't happen, and what to do. Example: "Your card was declined. No charge was made and the lead's contact details weren't shared."
- **Loading:** skeletons sized to the final layout. The shimmer runs only while loading, and is static under reduced motion. No spinner-only screens.

### 9.10 Navigation

- **Public header:**
  - Static (not sticky), 64px.
  - Nav items: Find movers, Moving costs, Guides, How we verify, plus "For movers" as a secondary link.
  - CTA styled per §5.3. A skip link is always the first focusable element.
- **Mobile sticky CTA bar** ("Get quotes"):
  - Appears only after the inline survey scrolls out of view. Hidden on the survey page and while a text input has focus.
  - Respects `safe-area-inset-bottom`. Adds matching `scroll-padding-bottom` so focused elements are never hidden (WCAG 2.4.11).
- **Footer:** navy band. Includes the marketplace disclosure ("Movers pay us to receive requests"), editorial and review policies, advertising disclosure, privacy, the complaint and broker-report link, and contact.
- **Portal:** collapsible left sidebar at ≥1024px. Below that, a top bar with a drawer. The credit balance and payment status are always visible in the top bar.

---

## 10. Photography, illustration and video

### 10.1 Photography

- **Direction:** documentary and authentic:
  - Real crews carrying furniture.
  - Hands taping boxes in lived-in homes.
  - Trucks loading on residential streets.
  - People arriving in new homes (with model releases).
- **Treatment:**
  - Natural light, slightly cool white balance that sits with navy, moderate contrast, no heavy filters or duotones over people.
  - Avoid staged-stock clichés (thumbs-up movers, people jumping in empty rooms, handshake close-ups).
- **Local imagery:** licensed photos of the actual city: residential streets, neighborhoods, typical building types.
  - No landmarks that imply partnership or endorsement. Get property releases where needed.
  - Where we lack local images, reuse library photos honestly; never caption a generic photo as local.
- **Company media:** only photos and videos the company is authorized to publish, labeled "Photo provided by {company}".
- **Generated imagery:**
  - Allowed only for abstract, background or object illustration (e.g. a box texture or a stylized route map).
  - **Never** to depict staff, customers, offices, trucks of real companies, completed moves or testimonials.
  - Every asset carries `generated: true|false`, source, license, creator and release status in the media library. Generated assets are blocked from profile, review and "customer story" slots.
- **Alt text:**
  - Meaningful images get descriptive alt text: what it shows and why it matters on the page.
  - Decorative images get `alt=""`.
  - Never stuff keywords.
- **Delivery:**
  - AVIF with a WebP fallback via `next/image`, srcset widths 400–1920.
  - Explicit dimensions or `aspect-ratio` on every image (zero CLS).
  - Aspect ratios: 16:9 media, 4:3 cards, 3:2 editorial, 1:1 logos and avatars.
  - A hero LCP image, where one exists (city pages), uses priority and `fetchpriority="high"`, never lazy-loads, and stays at or under about 120KB at 1280w.
  - Everything below the fold lazy-loads.

### 10.2 Video module

- **Content:** 30–90s explainer ("How American Moving Choice works"); later, local or route explainers.
- **Behavior:**
  - **Click-to-play facade.** The player script loads only after the visitor presses play. `preload="none"`, **no autoplay, and never audio without a user action**.
  - The poster is AVIF/WebP at the same aspect ratio, ≤60KB.
  - The play button is 64px, with an accessible name that includes the title and duration.
- **Encoding:**
  - 720p H.264 MP4 plus VP9/AV1 WebM at about 1.5–2.5 Mbps.
  - Use adaptive streaming (e.g. HLS through a video host) for anything over about 2 minutes.
- **Accessibility:**
  - Human-reviewed captions (WebVTT).
  - A **crawlable transcript** on the page, expandable below the player.
  - Audio description, or a descriptive transcript, when visuals carry information the audio doesn't.
  - Native or fully keyboard-accessible controls.
- **SEO:** `VideoObject` markup that matches the visible title, description, thumbnail, upload date and duration.
- **Placement:**
  - Desktop hero: a compact 16:9 thumbnail (max 440px) under the lede, so it doesn't compete with the survey.
  - Mobile: below the survey.

---

## 11. Motion

**Tokens:**

| Token | Value | Use |
|---|---|---|
| `--d1` | 120ms | Hover and press color, button nudge |
| `--d2` | 200ms | Small reveals, toast in, play-button scale |
| `--d3` | 280ms | Survey step change, progress fill |
| editorial | ≤560ms | One-time section entry below the fold (12px rise + fade) |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | Entrances |
| `--ease-std` | `cubic-bezier(.32,.72,0,1)` | State changes |
| exit | `cubic-bezier(.7,0,.84,0)`, ≤120ms | Dismissals |

**What animates:**
- Hover and press feedback, the survey step transition, the progress bar and toasts.
- The one-time background flash on a lead card when its availability changes.
- Accordion content (opacity only).
- **One storytelling moment per page family:** the route line drawing itself across the three steps on "How it works". Implemented with SVG `stroke-dashoffset`, triggered once by IntersectionObserver.

**What never animates:**
- Prices and money (no count-ups).
- Purchase and payment results.
- Validation messages, which appear instantly.
- Table and dashboard data.
- The LCP element (H1 or hero image).
- Layout properties (`top`, `left`, `width`, `height`). Motion uses transform and opacity only.

**Also off the table:**
- Parallax, scroll-jacking, pinned sections and scrubbed reveals.
- Infinite loops (except the loading shimmer).
- Autoplaying motion video in the hero, and blur filters on scrolling content.

**GSAP policy:**
- Allowed only for an isolated storytelling moment, and only where CSS can't do the job.
- Dynamically imported on that page only, with cleanup on unmount, and never mixed with another animation library in the same component tree.
- Verify current GSAP license terms before adoption. Network access was blocked here, so they could not be checked.

**`prefers-reduced-motion: reduce`:**
- Transitions and animations drop to about 0ms.
- Storytelling moments render in their final state, and the shimmer is static.
- The lead-card flash becomes an "Updated" text tag.

**Real-time updates:** availability changes are announced through a polite live region scoped to the lead list. That region is throttled, so a busy marketplace doesn't flood screen readers.

---

## 12. Responsive rules

- **Order:** mobile first. On public pages, phones show **readable content and the quote flow first**: H1 → one-paragraph lede → survey step 1 → trust statements → video → content.
- **Desktop hero:** coordinates message, survey and video without crowding.
  - Left column (about 55%): overline, 2–3 line H1, lede, compact video thumbnail.
  - Right column (about 45%): survey in the double-bezel shell.
  - The trust statements run beneath, across the full width.
- **Reflow:** content reflows at 320 CSS px with no page-level horizontal scroll. The style tile was tested at 360px: `scrollWidth` equals the viewport width in light and dark.

**Card columns on mobile (from the brief):**

| Columns | When | Examples |
|---|---|---|
| **2** | Short, readable cards (title + up to about 3 lines), at least 152px wide at 360px | Trust statements, popular routes, service tiles, city links, guide categories |
| **3–4** | Only compact items that stay legible, each at least 44px tall | State-abbreviation grid (4 columns at 76px), icon-plus-one-word service toggles |
| **1** | Content that needs width or carries several facts | Company cards, marketplace lead cards, CRM cards, guides with excerpts, review cards, pricing and credit explanations, comparison content (tables become stacked cards) |

**Touch and input:**
- Interactive targets are **44×44px or larger**, which exceeds the WCAG 2.2 AA minimum of 24px. Adjacent targets have at least 8px spacing.
- Form fields are 16px or larger.
- Reading order matches visual order. Desktop grid areas are used only where DOM order still makes sense: survey before video.

---

## 13. Page blueprints

*Desktop layouts assume the 12-column grid. Every public page ends with related links and the footer disclosures.*

### 13.1 Home
- **Hero:** Editorial Split.
  - Overline "Verified movers only · No brokers".
  - H1 "Compare verified movers for your move".
  - Lede on choice, verification and no brokers.
  - Compact video thumbnail.
  - Survey step 1 on the right, with the red CTA "See available movers".
- **Trust statements** (4, factual): Movers only · Checked credentials · Your number, your call · Free to request ("Movers pay us to receive requests").
- **Sections:**
  - How it works: the route line with three stops, horizontal on desktop and vertical on mobile.
  - How we verify movers: a sample evidence ledger with dated checks.
  - Popular routes (2 columns on mobile).
  - Moving cost guides.
  - Explore by state (4-column compact state grid on mobile).
  - FAQ (accordion).
  - "For moving companies" navy band with a white button.
- **Header CTA** is secondary here, because the survey is visible.

### 13.2 State hub (`/movers/{state}/`)
- **Top:** breadcrumb, H1 "Movers in Georgia", a lede, and a compact survey entry (from ZIP, to ZIP, Continue) in the right column.
- **"Verified movers serving Georgia":** a directory subset with local and long-distance filters, shown **only when real coverage exists**. Otherwise: "We're building our Georgia network", plus honest guidance on what happens if they submit.
- **Content blocks:**
  - Cities (2-column links).
  - Popular directional routes in and out.
  - Cost factors with cited, dated data.
  - State rules and permits, verified and cited.
  - Seasonal considerations, FAQs and related guides.
- **Freshness footer:** "Updated {date} · Sources".
- **Indexing:** gated by the SEO publishing checklist. The design must render the no-index variant identically.

### 13.3 City page (`/movers/{state}/{city}/`)
- **Hero:** a licensed local photo as the LCP image, the H1 "Movers in Atlanta, GA" and a survey entry.
- **Movers serving the city:** sorted by a published, transparent rule; sponsored listings labeled and separated.
- **Local content:**
  - Parking and permit notes only where verified.
  - Building access and seasonality.
  - Cost section with sources.
- **Links:** routes from the city, nearby cities and FAQs.
- **Video:** the local video if one exists; otherwise the general explainer.

### 13.4 Route page (`/routes/{origin}-to-{destination}/`)
- **Top:** H1 "Moving from Miami to Atlanta" and the route visualization (origin ring → path → destination dot), with distance and typical drive time from a cited source.
- **Survey:** prefilled with origin and destination.
- **Movers:** only those with **directional** coverage for this route.
- **Content:**
  - Cost factors (distance, size, season) with sourced ranges.
  - Interstate delivery-window expectations.
  - Destination notes.
- **Reverse route:** links to its own page, never duplicated content.

### 13.5 Preferred Movers directory
- **"What Preferred Mover means":** a right rail on desktop; a collapsible panel on mobile.
- **Filters:** location (ZIP or city), move type, services.
- **Sort:** transparent, with a "How we sort" link. Default: coverage match for the visitor's route, then most recently verified.
- **Listings:** company cards (1 / 2 / 3 columns). Sponsored cards labeled.
- **Pagination:** crawlable links.
- **Empty state:** says how to widen the search and offers a quote request anyway.

### 13.6 Company profile (`/companies/{slug}/`)
- **Header card:**
  - Logo, name, Preferred badge with its explainer, "New to our network" if applicable.
  - Credentials ledger: USDOT, MC, carrier authority, last checked.
  - FMCSA SAFER link.
  - Reviews summary, or "No customer reviews yet".
  - Red CTA "Request a quote", with the note "Uses our standard request form. You choose how many movers can contact you."
- **Anchored sections:**
  - Overview (original description).
  - Services.
  - Coverage, as plain-language lists including directional routes.
  - Credentials and insurance checks with dates and official links.
  - Reviews: methodology link, distribution, cards with evidence labels and company responses. Sorted by *most recent* by default, so negatives aren't buried.
  - Photos and videos (authorized, labeled).
  - FAQ.
- **Mobile:** a sticky "Request a quote" bar.

### 13.7 Quote survey (`/get-quotes/`)
- **Shell:** a focused page: logo, help link, Exit. No site navigation.
- **Desktop layout:** steps in the left column (max 560px). The right column holds a live "Your move" summary card (route mark, date, size) and reassurance: movers only, you choose how many companies, how we make money.
- **Mobile layout:** a collapsible summary at the top ("Miami → Atlanta · Nov 14").
- **Steps (production):**
  1. **Where:** from and to, by ZIP or city. Ambiguity resolution. Honest unsupported-location messaging.
  2. **When:** a date, or a flexible range.
  3. **Size and services:** choice cards. Car shipping and truck rental go through separate flows; that is a product decision, flagged.
  4. **Your details:** first and last name, email, phone, with the "Why we ask" panel *before* the fields.
  5. **"How many moving companies would you like to hear from?"**
     - Choices run from 1 up to the admin-set maximum, with **nothing preselected**.
     - Explainer: this is the maximum number of companies that can receive your details, not a promise of quotes. Movers only; brokers can't buy requests.
     - When real-time coverage is known: "{n} verified movers currently serve this route". If coverage is below the chosen number, say so before submit.
  6. **Review and consent:**
     - An editable summary.
     - An **unchecked**, versioned consent checkbox that names the number (and, when known, the companies). Final wording comes from counsel.
     - Links to terms and privacy.
     - Red "Send my request".
- **Throughout:** Back on every step, with progress preserved. Inline errors. Nothing is distributed before consent.
- **Style tile demo:** condenses this to 4 steps (move details, contact, sharing limit, review and consent).

### 13.8 Confirmation page
- **Heading:** "Request sent", with a reference number.
- **Timeline** (route mark):
  1. Up to *N* verified movers can receive your request.
  2. Movers contact you by phone or email. No timing promises unless measured and published.
  3. Compare quotes. You're never obligated.
- **Who received the request:** the companies that received it as purchases happen, or "We'll email you the names of the companies that receive your request".
- **Help and safety:** how to change or withdraw the request, tips for comparing quotes, broker red flags, and how to report a problem.
- **Kept clean:** no upsells and no ads.

### 13.9 Company marketplace (portal)
- **Top bar:** credit balance, payment-method status, notifications.
- **Filters:** origin and destination, move-date window, size, exclusive or shared, source category. Saved views appear as tabs.
- **Live indicator:** "Live · updates automatically", shown as a static dot.
- **Lead list:**
  - Single-column cards below 1280px.
  - At 1280px and above: a dense list with a detail rail showing the price breakdown, credit-policy explainer and Buy.
- **Purchase:** confirmation sheet → processing → inline result.
- **Unavailable leads:** dim in place (§9.6).
- **Empty state:** offers "Edit coverage".

### 13.10 CRM pipeline
- **Toolbar:** List | Pipeline toggle, search, filters (assignee, stage, follow-up due, lead type) and saved views.
- **Desktop:** columns scroll horizontally *inside* the board region, with sticky stage headers.
- **Mobile:** a stage selector with a single-column list.
- **Detail view** (side panel on desktop, full screen on mobile):
  - Contact details, notes, activity, tasks and reminders, follow-up date.
  - Estimated value, lost reason, and a review-request action (later).
- **Privacy:** the note that notes and activity are private to the company stays visible.

### 13.11 Admin verification queue
- **Dense table:**
  - Columns: company, USDOT, MC, submitted date, stage (Application → Verification → Admin review → Approved / Rejected), age in tabular figures.
  - Flags: dual carrier/broker authority, name or address mismatch, insurance missing, document expiring.
  - Filtered by stage and flag.
- **Detail view:**
  - **Left:** an evidence checklist. Each check shows the source link, retrieved timestamp, result and reviewer.
  - **Right:** submitted data vs the official record snapshot, as a field-by-field diff.
  - **Decision panel:** Approve / Reject with reason / Request info, with a reviewer note required.
  - Audit trail at the bottom.
- **Style:** hairline dividers instead of cards, system monospace for IDs, compact 40px rows. No motion beyond state changes.

---

## 14. Accessibility checklist and evidence

**Standard:** WCAG 2.2 AA minimum, with AAA body-text contrast. Every page needs:
- Landmarks and a skip link.
- One H1 and an ordered heading hierarchy.
- Labels for every control, and errors identified in text.
- Status messages via live regions.
- A visible focus indicator (3px, at least 3:1) that is never obscured by sticky UI.
- 44px targets, 320px reflow, support for text-spacing overrides, and reduced-motion support.
- Color never the only signal.
- Captions and transcripts on video.

**Evidence from `style-tile.html`** (run 2026-10-27, Chromium via Playwright):

| Check | Result |
|---|---|
| axe-core 4.10.2 (WCAG 2.0, 2.1 and 2.2 A/AA plus best practice), at 360px light, 360px dark, 1280px light, and 1280px dark with reduced motion | **0 violations** in all four |
| Horizontal overflow at 360px and 1280px | None (`scrollWidth` equals viewport width) |
| Survey flow, scripted | Empty submit shows inline errors, focuses the first invalid field and sets `aria-invalid`. ZIP "02a108" sanitizes to "02108" and resolves to "Boston, MA". The Back button preserves the selection. The sharing limit is required, with nothing preselected. The consent box is required. The summary reflects the chosen number. |
| Persistence | After a reload, move details are restored and contact fields are empty (never stored client-side) |
| Real-time lead state | "Simulate" dims the card, disables Buy and states "You were not charged" |
| Keyboard | The first Tab reaches the skip link. Step headings receive focus on step change. |
| Page errors | None. The only console errors were the Google Fonts requests, which this environment's network policy blocked. |

**Not yet verified:**
- Rendering with Archivo and Source Sans 3 (fonts were blocked here).
- Screen-reader testing with NVDA, VoiceOver and TalkBack.
- Real-device touch testing.
- Testing with real photography and video.

---

## 15. Open decisions and dependencies

1. **Approve "Route Ledger"** as the single direction, or request changes. Phase 3 designs depend on this.
2. **Vector logo master** and trademark check (owner).
3. **Dark mode on public pages.** Recommended: follow the system setting. The portals get dark mode either way.
4. **Photography:** budget and source for documentary photos, and local photography for launch markets. Commissioned vs. licensed.
5. **Explainer video:** script, production, captions and transcript.
6. **Licenses:** verify the current GSAP license terms if the storytelling moment is kept (CSS-only is the fallback), and re-confirm Archivo's width axis and woff2 sizes at build.
7. **Copy that needs counsel:** the Preferred Mover explainer, consent wording and the marketplace disclosure. The tile uses clearly marked placeholders.
8. **Shared-lead credit hint:** the lead card shows the *proposed* step-down policy (65% at 3 buyers). Final copy depends on the approved credit policy.
