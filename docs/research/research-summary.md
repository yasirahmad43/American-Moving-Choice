# SEO research summary: keyword inventory, competitor gaps, questions and B2B (2026-10-28)

This extends `docs/research/keyword-research.md` (2026-10-27) and the keyword assignments in `docs/seo/keyword-to-page-map.csv`. Nothing measured on 2026-10-27 was re-pulled; the new pulls fill the gaps that document listed (all 50 states, the B2B set, competitor organic keyword lists, question seeds) and the WebSearch question research.

## 1. Method

| Step | Tool / report | Parameters | Raw file | API units |
|---|---|---|---|---:|
| Competitor organic keywords | Semrush `resource_organic`, db `us` | movebuddha.com, hireahelper.com, moving.com: keyword contains "mov", volume > 90, position < 21, limit 200, sorted by volume. homeguide.com/moving-companies/ (subfolder): volume > 90, position < 21 (only 24 rows exist). budgetvanlines.com and consumermovingreviews.com: position < 31, limit 100 | `docs/research/raw/semrush/resource_organic_competitors_2026-10-28.csv` | 108,480 |
| B2B keyword metrics | `phrase_these` | 100 phrases (moving leads, buy moving leads, exclusive/shared/long-distance/local leads, lead sellers, mover marketing, adjacent verticals) | `docs/research/raw/semrush/phrase_these_b2b_leads_2026-10-28.csv` | 18,900 |
| State demand, all 50 states + DC | `phrase_these` x2 | "moving companies {state}", "movers {state}", "long distance movers {state}", "moving to {state}" | `docs/research/raw/semrush/phrase_these_states_all50_2026-10-28.csv` | 34,500 |
| Question seeds | `phrase_questions`, volume desc | "moving leads", "moving broker", "moving quote", "moving insurance", "moving out of state" | `docs/research/raw/semrush/phrase_questions_b2b_trust_2026-10-28.csv` | 96,440 |
| Forum / FAQ / regulator question research | WebSearch (14 queries) | movingscam.com, city-data.com, FMCSA, Florida AG, NJ Consumer Affairs, WI DATCP, BBB, ATA-MSC arbitration brochure, Two Men and a Truck FAQ, cost guides, lead-vendor pages | cited per row in `question-library.csv` | n/a |
| Assembly | `scratchpad/build_research.py` (not committed; deterministic joins over the raw files) | classifies each keyword into cluster / page family / geo, joins competitor positions, marks primary vs supporting by highest volume per mapped URL or (cluster, geo) | the four CSVs below | n/a |

Intent codes follow Semrush: commercial, informational, navigational, transactional; blank = "unknown (Semrush blank)". Volume = average monthly US searches; KD 0-100; CPC USD. Every row carries `source`, `database` (`us`) and `research_date`.

**Calls that failed (recorded, not retried):**
- `phrase_these` for 51 additional metros ("movers X" + "moving companies X" for Boston, Philadelphia, DC, San Diego, San Francisco, San Jose, Sacramento, Portland, Minneapolis, Detroit, St Louis, Kansas City, Indianapolis, Cincinnati, Cleveland, Pittsburgh, Baltimore, Richmond, Virginia Beach, Louisville, Memphis, Oklahoma City, Tulsa, Albuquerque, Salt Lake City, Boise, Fort Worth, El Paso, Tucson, Fort Lauderdale, West Palm Beach, Sarasota, Fort Myers, Naples, Tallahassee, Milwaukee, Omaha, Birmingham, New Orleans, Greenville, Charleston, Savannah, Knoxville, Chattanooga, Honolulu, Hartford, Providence, Long Island, Brooklyn, Queens, Jersey City) and for 100 extra route / long-distance-variant phrases: first attempt rejected for exceeding the 100-phrase cap (ERROR 612), the trimmed retry returned **ERROR 132 API UNITS BALANCE IS ZERO**.
- `phrase_questions` for seeds "moving", "long distance", "moving estimate": **API UNITS BALANCE IS ZERO**.
- WebSearch cannot retrieve reddit.com (domain blocked for the crawler); Reddit-sourced questions are therefore absent. Forum coverage comes from movingscam.com and city-data.com instead.

## 2. Deliverables and counts

| File | Rows | What it holds |
|---|---:|---|
| `docs/research/competitor-gaps.csv` | 52 | Keywords where at least two of the six named competitors rank in the organic top 20 (or top 10 from the 2026-10-27 SERP pulls). 40 are reachable (KD <= 50); 43 are not yet in `keyword-to-page-map.csv`. Each row has volume, KD, CPC, intent, the competitor URLs with positions, and the proposed AMC page family. |
| `docs/research/keyword-inventory.csv` | 804 | Master list: 298 keywords carried from the 2026-10-27 page map (family and URL preserved) plus 506 new measured keywords. Columns: cluster, page family, mapped URL, primary/supporting, intent, geo type and ID, audience (consumer vs mover-leads B2B), volume, KD, CPC, reachability, number of competitors ranking, status, origin, source. 74 rows are B2B. 307 primaries. |
| `docs/research/question-library.csv` | 208 | 174 consumer and 34 mover (B2B) questions. 123 are real Semrush question queries with measured volume; 85 are paraphrased from forums, regulator FAQs, consumer organisations, competitor FAQs and lead-vendor pages (status `hypothesis`, no volume). Each has intent, location/service, assigned page family and a supporting factual reference URL. |
| `docs/research/mover-leads-b2b.csv` | 108 | 74 measured B2B keywords and 34 phrases that Semrush returned no data for (kept as copy/FAQ variants, marked hypothesis). Sub-clustered into lead purchase, lead type, lead segment, DIY lead generation, marketing, software, starting a company, adjacent verticals. |

## 3. Measured vs hypothesised

**Measured (Semrush, db us, 2026-10-27 or 2026-10-28):** every volume, KD, CPC and intent in the four CSVs; every competitor position and URL; the state demand table below; the 20-metro scores already in `docs/seo/site-architecture.md` 5.2.

**Hypothesis (explicitly labelled in the files):**
- Page-family and cluster assignments, primary/supporting roles, and "reachable" thresholds (KD <= 50) are editorial rules, not data.
- Demand for the 51 unmeasured metros and the 100 extra route phrases (API units exhausted).
- Any traffic forecast. None is given; Semrush traffic estimates for competitor pages are quoted only as competitor evidence.
- The 85 forum/FAQ questions carry no volume. Their reference URLs are evidence that the question is asked and where a factual answer lives, not evidence of search demand.
- All lead-price benchmarks in the B2B questions come from vendors or adjacent industries and are unaudited.

## 4. Top 25 priority markets by measured demand

### 4.1 State demand index (all 50 states + DC, Semrush 2026-10-28)

`D = max("moving companies X", "movers X") + "long distance movers X" + 0.5 x "moving to X"` (the same formula as site-architecture 5.1, so the numbers are comparable with the metro table there). KD and CPC shown are for the stronger local term. CPC 0.00 means Semrush returned no CPC.

| # | State | Local term vol | KD | CPC $ | LD movers vol | KD | CPC $ | Moving-to vol | KD | D |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | NY New York | 1,600 | 68 | 25.46 | 880 | 39 | 31.92 | 1,300 | 25 | 3,130 |
| 2 | FL Florida | 1,300 | 30 | 22.71 | 390 | 20 | 45.11 | 2,400 | 27 | 2,890 |
| 3 | MN Minnesota | 1,300 | 44 | 17.86 | 40 | 9 | 52.23 | 1,000 | 34 | 1,840 |
| 4 | CA California | 590 | 27 | 19.17 | 480 | 25 | 27.00 | 1,300 | 16 | 1,720 |
| 5 | TX Texas | 590 | 27 | 22.71 | 260 | 20 | 50.63 | 1,300 | 12 | 1,500 |
| 6 | NH New Hampshire | 480 | 21 | 19.53 | 590 | 17 | 0.00 | 720 | 9 | 1,430 |
| 7 | NJ New Jersey | 720 | 34 | 20.38 | 320 | 8 | 31.75 | 720 | 10 | 1,400 |
| 8 | CO Colorado | 720 | 33 | 24.97 | 90 | 12 | 28.35 | 1,000 | 14 | 1,310 |
| 9 | DC Washington DC | 1,300 | 41 | 21.33 | not pulled | - | - | not pulled | - | 1,300 |
| 10 | MA Massachusetts | 720 | 45 | 20.30 | 70 | 18 | 38.86 | 880 | 11 | 1,230 |
| 11 | MD Maryland | 720 | 24 | 18.22 | 140 | 12 | 35.45 | 720 | 32 | 1,220 |
| 12 | HI Hawaii | 260 | 42 | 16.52 | 0 | 0 | 0.00 | 1,900 | 17 | 1,210 |
| 13 | MI Michigan | 720 | 40 | 19.65 | 40 | 10 | 20.39 | 720 | 15 | 1,120 |
| 14 | VA Virginia | 480 | 29 | 18.40 | 170 | 10 | 0.00 | 880 | 15 | 1,090 |
| 15 | UT Utah | 720 | 54 | 20.89 | 50 | 15 | 18.61 | 590 | 20 | 1,065 |
| 16 | OK Oklahoma | 590 | 51 | 19.43 | 30 | 0 | 0.00 | 880 | 21 | 1,060 |
| 17 | AK Alaska | 170 | 45 | 21.50 | 20 | 0 | 0.00 | 1,600 | 17 | 990 |
| 18 | WA Washington | 720 | 36 | 20.10 | 10 | 0 | 0.00 | 480 | 17 | 970 |
| 19 | NC North Carolina | 390 | 16 | 21.13 | 70 | 19 | 0.00 | 1,000 | 18 | 960 |
| 20 | ME Maine | 390 | 38 | 14.98 | 40 | 15 | 47.46 | 1,000 | 29 | 930 |
| 21 | AL Alabama | 590 | 24 | 14.46 | 20 | 0 | 0.00 | 590 | 13 | 905 |
| 22 | CT Connecticut | 480 | 28 | 19.36 | 170 | 15 | 29.07 | 480 | 21 | 890 |
| 23 | AZ Arizona | 390 | 39 | 15.06 | 50 | 6 | 0.00 | 880 | 14 | 880 |
| 24 | OH Ohio | 390 | 34 | 21.11 | 50 | 8 | 49.82 | 880 | 6 | 880 |
| 25 | VT Vermont | 480 | 30 | 19.35 | 40 | 21 | 21.96 | 720 | 17 | 880 |
| 26 | IN Indiana | 390 | 32 | 18.57 | 30 | 0 | 0.00 | 880 | 21 | 860 |
| 27 | TN Tennessee | 320 | 38 | 18.51 | 20 | 0 | 0.00 | 1,000 | 6 | 840 |
| 28 | IL Illinois | 390 | 18 | 14.97 | 70 | 15 | 51.48 | 720 | 20 | 820 |
| 29 | RI Rhode Island | 590 | 31 | 16.11 | 50 | 8 | 39.84 | 320 | 13 | 800 |
| 30 | WI Wisconsin | 390 | 11 | 25.50 | 40 | 0 | 0.00 | 720 | 24 | 790 |

The full 51-row table is reproducible from `phrase_these_states_all50_2026-10-28.csv`; rows 31-51 all have D < 790.

Caveats: the state-level index measures *state-named* queries only. City-named queries are far larger (Dallas alone is 5,990 in the metro table) and were measured for 20 metros on 2026-10-27; the other 51 metros are a data gap. Hawaii and Alaska rank on "moving to X" (relocation research), not on mover demand, and are not launch candidates.

### 4.2 Combined priority list (states and metros)

Metros use the measured scores in site-architecture 5.2 (Semrush 2026-10-27). States use the table above plus attainability (KD) and value (CPC). Ordering within the list is a judgement call on demand x value x attainability, not a formula.

| Rank | Market | Type | Evidence (measured) | Why here |
|---|---|---|---|---|
| 1 | Texas (Dallas, Houston, Austin, San Antonio) | state + 4 metros | Metro demand 18,410; "long distance movers texas" KD 20 / $50.63; "moving to texas" 1,300 KD 12; state hub KD 27 | Largest measured metro cluster; every state-level term is reachable |
| 2 | Florida (Orlando, Miami, Tampa, Jacksonville) | state + 4 metros | D 2,890 (#2); "moving companies florida" 1,300 KD 30; "long distance movers florida" KD 20 / $45.11; "moving to florida" 2,400; top inbound route state (NY, NJ, CA, OH, PA, MI, MA, IL, TX routes all measured) | Highest state-level demand with reachable KD; inbound routes are low-KD, high-CPC |
| 3 | New York (NYC via long-distance and routes) | state + metro | D 3,130 (#1) but "moving companies new york" KD 68 and "movers nyc" KD 72; "long distance movers new york" 880 KD 39 / $31.92; "long distance movers nyc" 1,600 KD 39 (movebuddha #9); NY->FL 480 KD 10 / $38.60; NY->CA 720 KD 21 | Enter through long-distance and route pages, not the local head term |
| 4 | California (Los Angeles, San Diego, San Francisco) | state + metros | LA score #3; state hub KD 27; "long distance movers california" 480 KD 25; dominant origin for 11 measured routes | Origin market for the route family |
| 5 | Dallas-Fort Worth | metro | Score 74.3 (#2 metro); "moving companies dallas" 4,400 KD 42; LD Dallas KD 17 / $38.22 | |
| 6 | Los Angeles | metro | Score 70.8; "movers los angeles" 4,400 KD 36 / $22.80; hireahelper's #1 page | |
| 7 | Chicago | metro | Score 69.9; LD Chicago KD 15 / $51.48; "long distance movers illinois" KD 15 / $51.48; IL state hub KD 18 | Long-distance entry first |
| 8 | Denver / Colorado | metro + state | Score 65.8, highest metro CPC $26.04, KD 34; CO state D 1,310, state hub KD 33 / $24.97; "moving to colorado" 1,000 KD 14 | |
| 9 | Atlanta / Georgia | metro | Score 65.5; "moving companies atlanta" 4,400 KD 45; GA state hub KD 47 (weak) | Target the city, not the state term |
| 10 | Houston | metro | Score 63.3; LD Houston KD 23 / $35.03 | |
| 11 | Austin | metro | Score 66.5; KD 52 local | Stretch locally; "moving to austin" 1,000 KD 22 |
| 12 | New Jersey | state | D 1,400; "moving companies new jersey" 720 KD 34; "long distance movers new jersey" 320 **KD 8** / $31.75; NJ->FL and NJ->NC routes measured | Cheapest high-value long-distance state term in the set |
| 13 | Minnesota (Minneapolis) | state | D 1,840 (#3); "moving companies minnesota" 1,300 KD 44; LD MN KD 9 / $52.23 (40/mo) | State hub volume is unusually high; metro unmeasured |
| 14 | Washington DC / Maryland / Virginia | state cluster | "moving companies washington dc" 1,300 KD 41; MD 720 KD 24 and LD MD 140 KD 12 / $35.45; VA 480 KD 29, LD VA 170 KD 10; hireahelper ranks "dc movers" 3,600 #9 | Three reachable state hubs around one metro; metro terms unmeasured |
| 15 | Nashville / Tennessee | metro + state | Score 58.7; "moving to tennessee" 1,000 KD 6; CA->TN route KD 6 | Inbound Southeast cluster |
| 16 | Seattle / Washington | metro + state | Score 58.2; WA state hub 720 KD 36; CA->WA route 140 KD 15 | |
| 17 | Phoenix / Arizona | metro + state | Score 51.6; "moving to arizona" 880 KD 14; CA->AZ route 140 KD 11; hireahelper earns on AZ suburbs | |
| 18 | North Carolina (Charlotte, Raleigh) | state + metros | State hub 390 **KD 16** / $21.13; "moving to north carolina" 1,000 KD 18; Charlotte KD 28, hireahelper #13 for "moving companies charlotte nc" 3,600 | Low-KD state hub |
| 19 | Massachusetts (Boston) | state | D 1,230; state hub 720 KD 45; LD MA KD 18 / $38.86; MA->FL route 110 KD 21 | Metro unmeasured |
| 20 | New Hampshire | state | D 1,430; "long distance movers new hampshire" **590 KD 17**; "moving to new hampshire" 720 KD 9; state hub 480 KD 21 | Highest long-distance state volume outside NY/CA/FL/NJ/TX |
| 21 | Orlando / Tampa / Miami | metros | Scores 54.8 / 46.0 / 49.6; "tampa movers" 1,900 KD 16 (movebuddha #2) | Already in Wave 1 under Florida |
| 22 | Ohio (Columbus) | state + metro | Columbus score 48.7, KD 30; "moving to ohio" 880 **KD 6**; LD OH KD 8 / $49.82; OH->FL route 210 KD 6 | Cheap inbound/outbound pair |
| 23 | Michigan | state | D 1,120; state hub 720 KD 40; MI->FL route 70 KD 14 | |
| 24 | Utah / Salt Lake City | state | D 1,065; state hub KD 54 (hard); "utah moving company" 1,300 KD 49 (movebuddha #10); CA->UT route unmeasured | Hold until metro data exists |
| 25 | Las Vegas / Nevada | metro + state | Score 43.4; NV state hub 260 KD 12; "moving to nevada" 720 KD 13; CA->NV route 110 KD 14 | Low-KD state hub attached to a measured metro |

Alabama (590, KD 24), Oklahoma (590, KD 51), Rhode Island (590, KD 31), Delaware (480, KD 13), Wisconsin (390, KD 11), Connecticut (480, KD 28) and Vermont (480, KD 30) are reachable state hubs just outside the 25 and should enter the programmatic state roll-out once the coverage gate (site-architecture 4) passes for them.

## 5. Recommended page-family production targets (with evidence)

| Family | Target | Evidence |
|---|---|---|
| **State hubs** `/movers/{state}/` | All 50 + DC are now measured. Produce the 15 with KD <= 25 and vol >= 260 first (NH, MD, NC, AL, IL, WI, DE, NV, NM, OR, AR, MO, MT, PA, LA) after the Wave 1 states (TX, FL, CA) and the high-volume mid-KD set (NY, MN, DC, NJ, CO, MA, MI, WA). Gate every page on approved-mover coverage. | `phrase_these_states_all50_2026-10-28.csv`; competitors are thin here: movebuddha ranks only #6-#20 for "moving companies in florida/maryland/pennsylvania/south carolina/michigan" and #12 for "moving companies florida" |
| **State long-distance** `/movers/{state}/long-distance/` | 11 states with CPC >= $35 and KD <= 20: FL, TX, MD, IL, OH, MA, ME, RI, MN, NE, WY, plus NH (590, KD 17) and NJ (320, KD 8). Volumes are small (30-590) but CPCs of $35-$52 are the highest in the entire dataset. | same file; `long distance movers new hampshire` 590 KD 17 is the single largest reachable LD state term |
| **Moving-to guides** `/moving-to/{state}/` | 15 states with KD <= 15 and vol >= 720: TX, NH, NJ, CO, MA, MI, VA, AZ, OH, TN, IA, SC, NV, NM, MO. Add FL (2,400, KD 27), CA (1,300), NY (1,300), HI (1,900) and AK (1,600) for volume. | same file; SERPs for "moving to florida" are forum-heavy (3 of 10 UGC on 2026-10-27) |
| **City pages** | Keep Wave 1 (TX, FL, LA metros). New reachable city gaps from competitor data: Brooklyn ("brooklyn movers" 3,600 KD 39, movebuddha #13 and hireahelper #14), Tampa ("tampa movers" 1,900 KD 16), Charlotte ("moving companies charlotte nc" 3,600 KD 28), Marietta GA (1,900 KD 39), Omaha (1,300 KD 42), San Diego ("san diego moving company" 1,600 KD 47). The 51 metros in the failed batch remain unmeasured. | `competitor-gaps.csv`; `resource_organic_competitors_2026-10-28.csv` |
| **Near-me / local service** | Not a separate URL family. hireahelper takes "moving company near me" (74,000, KD 18) at #1-#9 with *dozens of small-city pages*, and "local movers near me" (22,200, KD 16) at #1 with Carmel IN. The lesson is that small, well-covered city pages rank for national near-me terms; "long distance moving company near me" (1,900, **KD 12**, $35.33) is held by movebuddha #5 and moving.com #6 with national pages. Build the long-distance pillar and city long-distance pages to answer it. | hireahelper rows in the competitor file; gap rows `long distance moving company near me`, `long distance movers near me` (9,900 KD 37), `interstate movers near me` (1,300 KD 28) |
| **Service pillars** | Add "full service" and "residential" language to the pillars: "full service moving company/companies" (9,900 each, KD 42/35), "residential moving companies" (6,600, KD 22), "full service long distance moving companies" (1,900, KD 26, $34.73), "state to state moving companies" (4,400, KD 47, $37.37), "moving services out of state" (2,400, KD 42, $39.44), "moving company across states" (1,900, KD 34, $38.84). All are held by hireahelper's single `/services/moving-companies/` page or moving.com's best-of list, i.e. by one URL each. | `competitor-gaps.csv` rows with family `service` |
| **Cost** `/moving-costs/` + calculator | The cost family is the most contested: moving.com, movebuddha and hireahelper all rank for "moving costs", "moving cost calculator", "moving cost estimator", "moving estimate" (3 of 6 competitors each). Reachable sub-terms not yet mapped: "moving cost estimate" (2,400 KD 45), "estimating moving costs" (1,600 KD 44), "movers cost estimate" (1,300 KD 43), "how much does it cost to move home" (1,300 KD 25), "cheapest moving company" (2,900 KD 39). | `competitor-gaps.csv` |
| **Comparison** `/compare/` (gated) | "best long distance moving companies" 49,500 KD 36 $27.44 (moving.com #6, movebuddha #9 with a *city* long-distance page), "best moving companies near me" 5,400 KD 25, "top moving companies" 2,900 KD 48, "top long distance moving companies" 1,900 KD 34, "reputable moving companies" 1,300 KD 42. Highest-volume reachable cluster in the file, but it stays behind the 4.6 comparison gate. | `competitor-gaps.csv` |
| **Questions / guides** | 123 measured question queries. Production order by volume: cost questions (33 queries, 9,900 down to 260), tipping (24 queries, 12,100 down to 260; one guide), quote questions (15 queries, mostly 10-50/mo; one FAQ block on `/get-quotes/`), insurance/valuation (13 queries; "how to choose moving insurance" 880 KD 40), broker checks (12 "is {brand} a broker" queries at 10-40/mo each; answer only from FMCSA authority records on the verify tool), moving-out-of-state (8 queries). | `question-library.csv` |
| **Trust** | "how much security bond does a moving broker need", "how to tell if a moving company is a broker" and similar returned 0-20/mo; the broker cluster is small in search but central to positioning. Keep one trust page, no spokes. | `phrase_questions_b2b_trust_2026-10-28.csv` |
| **Mover-leads B2B** `/for-movers/` | Total measured B2B demand is about 15,000 searches/mo across 74 terms, almost all KD <= 20. Core: "buy moving leads" 720 KD 18 (transactional), "moving leads" 480, "exclusive moving leads" 480 KD 9, "long distance moving leads" 390 KD 4, "moving company leads" 320 KD 11, "local moving leads" 260 KD 18, "moving leads provider(s)" 260+260, "free moving leads" 260 KD 3, "moving broker leads" 260, "live transfer moving leads" 210 KD 8, "commercial moving leads" 210, "best moving leads" 210. Question: "how much do moving leads cost" 880 KD 10 is the largest B2B query and should be answered on the pricing page. Adjacent marketing terms ("moving company seo" 1,000, "moving company marketing" 720, "moving company software" 720) are not AMC pages. | `mover-leads-b2b.csv` |

## 6. Top findings

1. **The B2B set is cheap and transactional.** 74 measured terms, roughly 15,000 searches/mo, nearly all KD 3-20; "how much do moving leads cost" (880/mo, KD 10) alone is bigger than "buy moving leads". moving.com is the only named competitor with a lead page in the top 10 (#9 for "buy moving leads").
2. **"Near me" long-distance terms are reachable with national pages.** "long distance moving company near me" is KD 12 at $35.33 CPC; "interstate movers near me" KD 28; "long distance movers near me" 9,900/mo KD 37. Competitors win these with one pillar URL each.
3. **hireahelper's model is many small city pages, not big metros.** Its top rankings for 74,000-110,000/mo near-me terms come from pages like Beckley WV, Oshkosh WI, Central SC and Carmel IN. The AMC coverage gate should not block small markets where approved movers exist.
4. **State hubs are under-served by every competitor.** Only movebuddha ranks for state terms, mostly at #6-#20, and only in a handful of states. All 51 state terms are now measured; 15 have KD <= 25.
5. **State long-distance terms have the highest CPCs in the dataset** ($35-$52 in FL, TX, MN, OH, IL, ME, MD, MA, RI, NE, WY) at KD 8-20, but low volume (30-590). They justify a template, not bespoke content.
6. **New Hampshire and New Jersey are surprise long-distance states.** "long distance movers new hampshire" 590/mo KD 17 and "long distance movers new jersey" 320/mo KD 8 / $31.75 outrank most Sun Belt states.
7. **Minnesota, DC, Maryland and Massachusetts have more state-named demand than Georgia, Arizona or Tennessee**, none of which were in the 20-metro scoring. The metro data for Minneapolis, DC, Baltimore and Boston is the most valuable next pull.
8. **The comparison intent is the largest reachable gap** ("best long distance moving companies" 49,500 KD 36; "best moving companies near me" 5,400 KD 25) but the 4.6 gate (methodology, no paid placement, counsel review) stands. movebuddha ranks for it with a *city* long-distance page (Indianapolis), which shows the SERP accepts non-listicle formats.
9. **Question demand is dominated by cost and tipping**, not by trust topics. Broker and scam questions are 10-90/mo each; cost and tipping questions are 700-12,100/mo. The trust angle is positioning, not a traffic play.
10. **Consumer questions from forums cluster around five moments**: the phone quote without a survey, the deposit, the price jump after loading, the delivery window, and the claim deadline. All five have official references (FMCSA, 49 CFR 375, state AGs, ATA-MSC arbitration) and belong in the long-distance pillar, route pages and the guides, with the verify tool as the call to action.

## 7. Data gaps

- **51 metros unmeasured** (list in section 1). Priority for the next Semrush budget: Minneapolis, Washington DC, Baltimore, Boston, Philadelphia, San Diego, San Francisco, Portland, Salt Lake City, Detroit, Indianapolis, Kansas City, St Louis, Fort Lauderdale, Fort Myers, Sarasota, New Orleans, Charleston, Greenville, Brooklyn, Queens, Long Island, Jersey City.
- **Route expansion unmeasured**: FL->TX, TX->CO, CA->UT, NY->TX, NY->GA, IL->AZ, WA->TX, PA->FL, VA->FL, MD->FL, GA->FL, FL->GA, CA->GA, CT->FL, MN->FL, WI->FL, CO->TX, AZ->TX, NY->NJ, NJ->NY, CA->HI, TX->TN, and the "movers from X to Y" / "X to Y movers" variants.
- **Question seeds "moving", "long distance", "moving estimate" not pulled** (units exhausted). The cost and tipping questions come from the 2026-10-27 "movers"/"moving company" seeds only.
- **Reddit unavailable** to the search tool. Reddit threads dominate several "moving to {state}" SERPs, so paraphrased Reddit questions should be collected manually before writing those guides.
- **homeguide.com/moving-companies** is a single page with 24 ranking keywords (all "near me" variants at positions 11-20); HomeGuide's moving cost pages live under `/costs/` and were not pulled.
- **consumermovingreviews.com and budgetvanlines.com** rank almost only for their own brand and for company-name navigational queries; they are not keyword competitors and were dropped from the gap analysis after inspection.
- **Competitor exports are capped at 200 rows per domain with position < 21 and volume > 90.** Long-tail city terms below 90/mo (hireahelper's bulk) are not in the file.
- **No SERP pulls (`phrase_organic`) for the new gap keywords**; competitor presence comes from each competitor's own ranking export, so other ranking domains (van lines, Yelp, Forbes) are not listed.
- **Intent is blank** in Semrush for a number of terms (marked "unknown (Semrush blank)").
- **Zero-volume B2B phrases** (34) are listed as hypothesis only.
- **Lead-price benchmarks** are vendor claims; AMC's own lead price and sell-through remain the missing input for the value weighting.
