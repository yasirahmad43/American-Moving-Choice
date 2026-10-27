# Keyword & Competitor Research: American Moving Choice

## Method

- **Research date:** 2026-10-27
- **Source:** Semrush via MCP (`execute_report`), **US database** (`database=us`), latest snapshot (no `display_date`).
- **Reports used:**
  - `domain_rank` for organic keywords, organic traffic, traffic cost and Semrush Rank of 11 reference domains.
  - `resource_organic_unique` for the top 30 pages by organic traffic on move.org, moving.com, movebuddha.com and hireahelper.com.
  - `phrase_these` for volume, CPC, competitive density, intent and KD on 104 keywords, sent in 3 batches.
  - `phrase_organic` for the organic top 10 on 6 keywords.
  - `backlinks_overview` (root_domain) for Authority Score, backlinks and referring domains of 4 competitors.
- **Intent codes (Semrush):** 0 = commercial, 1 = informational, 2 = navigational, 3 = transactional, blank = unknown.
- **Caveats:**
  - "Traffic" is Semrush's estimated monthly US organic visits. It is a model, not analytics.
  - Volume is average monthly US searches.
  - KD is 0-100.
  - CPC is in USD.
- **Raw data:** `docs/research/raw/semrush/`, which holds the following files.
  - `domain_rank_2026-10-27.json`
  - `top_pages_2026-10-27.csv`
  - `phrase_these_2026-10-27.csv`
  - `phrase_organic_top10_2026-10-27.csv`
  - `backlinks_overview_2026-10-27.json`
- **Errors:** none. All calls returned data. There were no `no_subscription`, `no_api_units` or `no_data` responses.

## 1. Competitor / reference traffic (ranked by est. organic traffic)

| # | Domain | Est. organic traffic /mo | Organic keywords | Traffic value ($/mo) | Semrush Rank | Paid kw | Note |
|---|---|---:|---:|---:|---:|---:|---|
| 1 | consumeraffairs.com | 420,319 | 511,597 | 2,001,047 | 5,170 | 5 | Multi-vertical reviews; moving is only a slice |
| 2 | homeguide.com | 326,101 | 512,002 | 2,491,971 | 6,538 | 0 | Multi-vertical home-services cost guides |
| 3 | energysage.com | 238,617 | 140,569 | 808,601 | 8,801 | 2 | Solar marketplace: a model for the marketplace, not a competitor |
| 4 | hireahelper.com | 125,334 | 80,203 | 1,309,125 | 16,132 | 23 | Moving-focused; city pages drive most traffic |
| 5 | move.org | 107,657 | 42,652 | 602,738 | 18,747 | 0 | Moving-focused; "best X" guides and how-to content |
| 6 | moving.com | 64,797 | 58,017 | 404,282 | 30,390 | 0 | Moving-focused; the cost calculator is ~30% of traffic |
| 7 | movebuddha.com | 38,335 | 55,677 | 301,872 | 49,680 | 0 | Moving-focused; calculator plus city/long-distance and route pages |
| 8 | mygoodmovers.com | 25,778 | 23,986 | 190,722 | 72,368 | 0 | Moving-focused directory |
| 9 | unpakt.com | 5,976 | 8,387 | 137,111 | 272,903 | 0 | Moving marketplace; small but high value per visit |
| 10 | budgetvanlines.com | 1,934 | 178 | 19,344 | 685,657 | 3 | Broker; very small organic footprint |
| 11 | consumermovingreviews.com | 191 | 879 | 187 | 2,869,596 | 0 | Negligible organic presence |

### Backlink profiles (Semrush `backlinks_overview`, root domain)

| Domain | Authority Score | Total backlinks | Referring domains | Follow | Nofollow |
|---|---:|---:|---:|---:|---:|
| moving.com | 48 | 702,256 | **19,777** | 414,069 | 240,514 |
| hireahelper.com | 48 | 1,983,198 | **11,736** | 73,736 | 1,904,959 |
| movebuddha.com | 44 | 101,638 | **9,427** | 52,011 | 17,491 |
| move.org | 48 | 41,505 | **9,320** | 30,836 | 10,661 |

**Takeaway.** The moving-focused leaders sit at AS 44-48 with about 9k-20k referring domains each. A new domain will not rank for head terms such as "moving companies" (KD 62) or "long distance moving companies" (KD 63) for a long time. Early wins have to come from long-tail city, state and route pages and from tools.

## 2. Top page families (what drives competitor traffic)

The figures below come from the top 30 pages by traffic for each domain.

- **Cost calculator / cost tools (the strongest single family)**
  - moving.com `/movers/moving-cost-calculator.asp` = 19,426 visits (29.97% of the site). The realtor.moving.com copy adds 1,016 more.
  - movebuddha.com `/moving-cost-calculator/` = 4,399 (11.47%, its #1 page).
  - movebuddha.com car shipping calculator = 748.
  - move.org `/moving-costs/` = 4,176, `/storage-units-cost/` = 5,476 and `/linear-foot/` = 7,313.
  - The "moving cost calculator" SERP top 5 is moving.com, extraspace.com, move.org, movebuddha.com and realtor.moving.com.
- **City "movers" pages (the core HireAHelper model)**
  - LA `/movers/los-angeles_ca/` = 8,915.
  - Tallahassee = 6,930.
  - Oklahoma City = 1,735.
  - Gilbert, Chandler and Mesa AZ = about 1.1k-1.6k each.
  - Many small-market city pages (Beckley WV, Oshkosh WI, Central SC) pull 2k+ each. Smaller metros with weaker local SERPs are achievable.
  - movebuddha's city long-distance pages: `/movers/ca/los-angeles/long-distance/` = 825, Indianapolis long-distance = 956, Orlando long-distance = 460.
- **"Best X companies" commercial guides**
  - move.org best moving container companies = 12,002 (its #1 page).
  - move.org best interstate moving companies = 4,722.
  - move.org `/movers/` hub = 7,457.
  - moving.com best out-of-state moving companies = 1,700 and best long-distance = 1,024.
  - hireahelper `/services/moving-companies/` = 7,969.
- **Brand cost and review content (U-Haul, PODS, 1-800-GOT-JUNK, Lowe's, Extra Space)**
  - hireahelper U-Haul cost = 3,573 and PODS cost = 2,830.
  - movebuddha PODS cost = 1,204 and 1-800-GOT-JUNK cost = 910.
  - "pods cost" alone = 12,100 searches/mo.
- **Informational moving guides**
  - Change of address = 8,902 (move.org).
  - Printable checklist = 8,339 (move.org).
  - Largest cities = 6,189 (move.org).
  - Checklist for moving to another state = 1,639 (moving.com).
  - This family is high volume but low commercial value.
- **Route pages (`/popular-routes/fl/va/`, `/popular-routes/ca/fl/`)**
  - movebuddha only: 156 and 133 visits.
  - Route traffic is small per page but long-tail and high intent.
- **State pages:** only movebuddha `/movers/ri/` (222) appears in the top 30. Competitors under-invest in state pages.
- **Lead-buyer (B2B) page:** moving.com `/leads/` = 546 visits. It ranks #9 for "buy moving leads".
- **Trust / verification:** movebuddha `/blog/usdot-lookup/` = 509. "usdot number lookup" = 4,400/mo at KD 18. This fits a "verified movers, no brokers" positioning.

## 3. Keyword opportunity table

Semrush US, pulled 2026-10-27.

- **Proposed URLs** are suggestions only.
- **Competing URLs** appear only where SERP data was pulled (`phrase_organic`). Otherwise the cell reads "n/p" (not pulled).
- **Priority** weighs business value first: lead intent, CPC as a proxy for lead value, and fit with a "verified movers, no brokers" marketplace. KD and volume come second.

| Keyword | Intent | Geography | Proposed page/URL | Volume | KD | CPC | Competing URLs (top 1-3) | Source | Research date | Priority |
|---|---|---|---|---:|---:|---:|---|---|---|---|
| long distance moving companies | Commercial | National | /long-distance-movers/ | 74,000 | 63 | 44.63 | twomenandatruck.com/long-distance-moving; unitedvanlines.com/moving-services/long-distance; mayflower.com/moving-services/long-distance-movers | Semrush phrase_these + phrase_organic | 2026-10-27 | H: core money term, highest CPC; long-term pillar (KD 63) |
| long distance movers | Commercial | National | /long-distance-movers/ (same pillar) | 40,500 | 66 | 43.36 | n/p | Semrush phrase_these | 2026-10-27 | H: same cluster as above |
| moving companies | Commercial | National | / (home) or /moving-companies/ | 135,000 | 62 | 19.43 | n/p | Semrush phrase_these | 2026-10-27 | M: huge volume but mixed local/brand intent; long horizon |
| movers near me | Transactional | Local (geo) | /movers/ hub + city pages | 110,000 | 41 | 14.65 | n/p | Semrush phrase_these | 2026-10-27 | M: map-pack dominated; captured via city pages, not a single URL |
| moving companies near me | Transactional | Local (geo) | /movers/ hub + city pages | 90,500 | 43 | 14.65 | n/p | Semrush phrase_these | 2026-10-27 | M: as above |
| local movers | Unknown | Local | /local-movers/ | 74,000 | 45 | 10.49 | n/p | Semrush phrase_these | 2026-10-27 | M: lower ticket than long distance |
| best moving companies | Commercial | National | /best-moving-companies/ | 49,500 | 63 | 19.56 | n/p | Semrush phrase_these | 2026-10-27 | H: comparison intent = marketplace fit; competitors' "best" guides drive large traffic |
| cross country movers | Commercial | National | /cross-country-movers/ | 14,800 | 51 | 41.09 | n/p | Semrush phrase_these | 2026-10-27 | H: high CPC, mid KD |
| interstate movers | Commercial | National | /interstate-movers/ | 9,900 | 46 | 45.27 | moveinterstate.com/; realestate.usnews.com/.../best-interstate; twomenandatruck.com/long-distance-moving/expedited | Semrush phrase_these + phrase_organic | 2026-10-27 | H: highest CPC in set, KD 46 is attainable mid-term |
| interstate moving companies | Commercial | National | /interstate-movers/ | 9,900 | 50 | 45.27 | n/p | Semrush phrase_these | 2026-10-27 | H: same cluster |
| out of state movers | Commercial | National | /interstate-movers/ or /out-of-state-movers/ | 9,900 | 64 | 43.11 | n/p | Semrush phrase_these | 2026-10-27 | M: high value but KD 64 |
| moving quotes | Informational | National | /get-quotes/ | 12,100 | 52 | 28.70 | n/p | Semrush phrase_these | 2026-10-27 | H: direct lead-form intent |
| moving estimate | Informational | National | /get-quotes/ or calculator | 4,400 | 45 | 18.67 | n/p | Semrush phrase_these | 2026-10-27 | H: lead intent |
| moving cost calculator | Informational | National | /moving-cost-calculator/ | 5,400 | 49 | 6.72 | moving.com/movers/moving-cost-calculator.asp; extraspace.com/moving/tools/moving-cost-calculator/; move.org/moving-costs/ | Semrush phrase_these + phrase_organic | 2026-10-27 | H: #1 traffic page at moving.com and movebuddha; tool also captures leads |
| how much does it cost to move | Informational | National | /moving-costs/ | 3,600 | 51 | 4.40 | n/p | Semrush phrase_these | 2026-10-27 | M: supports calculator |
| cost to hire movers | Informational | National | /moving-costs/ | 1,000 | 32 | 5.15 | n/p | Semrush phrase_these | 2026-10-27 | M |
| usdot number lookup | Informational | National | /verify-a-mover/ (DOT/MC lookup tool) | 4,400 | 18 | 1.82 | n/p | Semrush phrase_these | 2026-10-27 | H: low KD, reinforces "verified movers, no brokers"; earns links |
| moving scams | Informational | National | /guides/avoid-moving-scams/ | 590 | 40 | 5.39 | n/p | Semrush phrase_these | 2026-10-27 | M: trust / brand positioning |
| how to choose a moving company | Informational | National | /guides/how-to-choose-a-mover/ | 390 | 25 | 12.19 | n/p | Semrush phrase_these | 2026-10-27 | M |
| moving broker vs carrier | Commercial | National | /guides/broker-vs-carrier/ | 40 | 14 | 11.03 | n/p | Semrush phrase_these | 2026-10-27 | M: tiny volume but it is our core differentiator |
| moving company reviews | Commercial | National | /reviews/ | 880 | 43 | 11.68 | n/p | Semrush phrase_these | 2026-10-27 | M |
| buy moving leads | Transactional | National (B2B) | /for-movers/ (lead program) | 720 | 18 | 8.00 | buymovingleads.co/; supermove.com/blog/7-sites-to-find-moving-leads-in-2025; moveadvisor.com/biz/leads | Semrush phrase_these + phrase_organic | 2026-10-27 | H: supply-side acquisition, KD 18 |
| moving leads | Informational | National (B2B) | /for-movers/ | 480 | 17 | 8.16 | n/p | Semrush phrase_these | 2026-10-27 | H: same cluster |
| moving companies dallas | Commercial | Dallas, TX | /movers/texas/dallas/ | 4,400 | 42 | 19.32 | einsteinmoving.com/.../dallas-movers/; abmoving.com/; yelp.com/search?...Dallas | Semrush phrase_these + phrase_organic | 2026-10-27 | H: top metro volume with mid KD; aggregators (Yelp, Thumbtack, Forbes, HireAHelper) rank, so a marketplace page can |
| movers dallas | Commercial | Dallas, TX | /movers/texas/dallas/ | 2,900 | 45 | 19.32 | n/p | Semrush phrase_these | 2026-10-27 | H |
| moving companies atlanta | Commercial | Atlanta, GA | /movers/georgia/atlanta/ | 4,400 | 45 | 16.06 | n/p | Semrush phrase_these | 2026-10-27 | H |
| movers los angeles | Commercial | Los Angeles, CA | /movers/california/los-angeles/ | 4,400 | 36 | 22.80 | n/p | Semrush phrase_these | 2026-10-27 | H: KD 36 with high CPC; hireahelper's top page is LA |
| movers austin | Commercial | Austin, TX | /movers/texas/austin/ | 4,400 | 52 | 21.57 | n/p | Semrush phrase_these | 2026-10-27 | M: KD 52 |
| movers chicago | Commercial | Chicago, IL | /movers/illinois/chicago/ | 4,400 | 49 | 21.03 | n/p | Semrush phrase_these | 2026-10-27 | M |
| movers nyc | Commercial | New York, NY | /movers/new-york/new-york-city/ | 5,400 | 72 | 26.83 | n/p | Semrush phrase_these | 2026-10-27 | M: high value but KD 72; target "moving companies nyc" (KD 51) first |
| moving companies houston | Commercial | Houston, TX | /movers/texas/houston/ | 2,900 | 45 | 14.70 | n/p | Semrush phrase_these | 2026-10-27 | H: plus "movers houston" 3,600 |
| moving companies denver | Commercial | Denver, CO | /movers/colorado/denver/ | 2,900 | 34 | 26.04 | n/p | Semrush phrase_these | 2026-10-27 | H: highest city CPC, low KD |
| moving companies orlando | Commercial | Orlando, FL | /movers/florida/orlando/ | 2,900 | 35 | 16.63 | n/p | Semrush phrase_these | 2026-10-27 | H: low KD; FL is the top inbound state |
| moving companies nashville | Commercial | Nashville, TN | /movers/tennessee/nashville/ | 2,900 | 38 | 19.52 | n/p | Semrush phrase_these | 2026-10-27 | H |
| movers seattle | Commercial | Seattle, WA | /movers/washington/seattle/ | 2,900 | 39 | 21.89 | n/p | Semrush phrase_these | 2026-10-27 | M |
| movers phoenix | Commercial | Phoenix, AZ | /movers/arizona/phoenix/ | 1,900 | 36 | 19.48 | n/p | Semrush phrase_these | 2026-10-27 | H: low KD; hireahelper earns well on AZ suburbs |
| moving companies columbus ohio | Commercial | Columbus, OH | /movers/ohio/columbus/ | 1,600 | 30 | 17.42 | n/p | Semrush phrase_these | 2026-10-27 | M: low KD, smaller market |
| moving companies charlotte | Commercial | Charlotte, NC | /movers/north-carolina/charlotte/ | 880 | 28 | 18.71 | n/p | Semrush phrase_these | 2026-10-27 | M: low KD, NC inbound demand |
| moving companies florida | Commercial | Florida | /movers/florida/ | 1,300 | 30 | 22.71 | n/p | Semrush phrase_these | 2026-10-27 | H: state hub; competitors under-invest in state pages |
| moving companies texas | Commercial | Texas | /movers/texas/ | 590 | 27 | 22.71 | n/p | Semrush phrase_these | 2026-10-27 | M |
| long distance movers new york | Commercial | New York | /long-distance-movers/new-york/ | 880 | 39 | 31.92 | n/p | Semrush phrase_these | 2026-10-27 | H: high CPC; NY is a top origin |
| long distance movers los angeles | Commercial | Los Angeles, CA | /movers/california/los-angeles/long-distance/ | 880 | 38 | 9.14 | n/p | Semrush phrase_these | 2026-10-27 | M: movebuddha's equivalent page = 825 visits |
| long distance movers chicago | Commercial | Chicago, IL | /movers/illinois/chicago/long-distance/ | 480 | 15 | 51.48 | n/p | Semrush phrase_these | 2026-10-27 | H: KD 15 with the highest CPC in the dataset |
| long distance movers dallas | Commercial | Dallas, TX | /movers/texas/dallas/long-distance/ | 390 | 17 | 38.22 | n/p | Semrush phrase_these | 2026-10-27 | H: low KD, high CPC |
| long distance movers florida | Commercial | Florida | /long-distance-movers/florida/ | 390 | 20 | 45.11 | n/p | Semrush phrase_these | 2026-10-27 | H: low KD, high CPC |
| long distance movers texas | Commercial | Texas | /long-distance-movers/texas/ | 260 | 20 | 50.63 | n/p | Semrush phrase_these | 2026-10-27 | H: low KD, high CPC |
| long distance movers houston | Commercial | Houston, TX | /movers/texas/houston/long-distance/ | 320 | 23 | 35.03 | n/p | Semrush phrase_these | 2026-10-27 | H |
| moving to florida | Informational | Florida (inbound) | /moving-to/florida/ | 2,400 | 27 | 4.21 | reddit.com/r/relocating/...; dreamfindershomes.com/blog/moving-to-florida/; facebook.com/groups/FloridaResidents/... | Semrush phrase_these + phrase_organic | 2026-10-27 | H: weak SERP (forums/UGC), highest inbound-state volume; funnel to FL movers |
| moving to texas | Informational | Texas (inbound) | /moving-to/texas/ | 1,300 | 12 | 4.20 | n/p | Semrush phrase_these | 2026-10-27 | H: KD 12 |
| moving to north carolina | Informational | NC (inbound) | /moving-to/north-carolina/ | 1,000 | 18 | 3.46 | n/p | Semrush phrase_these | 2026-10-27 | M |
| moving to tennessee | Informational | TN (inbound) | /moving-to/tennessee/ | 1,000 | 6 | 2.58 | n/p | Semrush phrase_these | 2026-10-27 | M: KD 6, quick win |
| moving to south carolina | Informational | SC (inbound) | /moving-to/south-carolina/ | 1,000 | 10 | 2.81 | n/p | Semrush phrase_these | 2026-10-27 | M |
| moving to colorado | Informational | CO (inbound) | /moving-to/colorado/ | 1,000 | 14 | 4.76 | n/p | Semrush phrase_these | 2026-10-27 | M |
| moving to arizona | Informational | AZ (inbound) | /moving-to/arizona/ | 880 | 14 | 3.26 | n/p | Semrush phrase_these | 2026-10-27 | M |
| moving from new york to florida | Informational | NY to FL route | /moving-routes/new-york-to-florida/ | 480 | 10 | 22.04 | n/p | Semrush phrase_these | 2026-10-27 | H: KD 10, route CPC 22 shows high lead value |
| new york to florida movers | Commercial | NY to FL route | /moving-routes/new-york-to-florida/ | 320 | 25 | 22.04 | n/p | Semrush phrase_these | 2026-10-27 | H: same page |
| moving from california to texas | Informational | CA to TX route | /moving-routes/california-to-texas/ | 480 | 15 | 17.47 | n/p | Semrush phrase_these | 2026-10-27 | H: KD 15 |
| moving from california to florida | Informational | CA to FL route | /moving-routes/california-to-florida/ | 320 | 19 | 23.82 | n/p | Semrush phrase_these | 2026-10-27 | M |
| moving from california to arizona | Informational | CA to AZ route | /moving-routes/california-to-arizona/ | 140 | 11 | 21.19 | n/p | Semrush phrase_these | 2026-10-27 | M |
| moving from new jersey to florida | Informational | NJ to FL route | /moving-routes/new-jersey-to-florida/ | 90 | 17 | 25.62 | n/p | Semrush phrase_these | 2026-10-27 | L: low volume; template page only |
| car shipping | Commercial | National | /car-shipping/ (partner) | 22,200 | 69 | 9.28 | n/p | Semrush phrase_these | 2026-10-27 | L: adjacent vertical, KD 69 |
| truck rental | Commercial | National | /guides/truck-rental/ | 60,500 | 59 | 1.77 | n/p | Semrush phrase_these | 2026-10-27 | L: DIY intent, low CPC, not mover leads |
| pods cost | Unknown | National | /guides/pods-cost/ | 12,100 | 46 | 4.32 | n/p | Semrush phrase_these | 2026-10-27 | L: competitor-brand content; traffic but weak lead fit |
| moving container companies | Commercial | National | /guides/moving-containers/ | 3,600 | 66 | 13.19 | n/p | Semrush phrase_these | 2026-10-27 | L: move.org #1 page, but container (not mover) intent |
| moving checklist | Informational | National | /guides/moving-checklist/ | 49,500 | 54 | 1.10 | n/p | Semrush phrase_these | 2026-10-27 | L: high volume, low value; build later for links |

The raw CSV holds the full list of 104 keywords, including every "movers [city]" / "moving companies [city]" pair.

## 4. Priority market candidates

**Demand index** = "movers [city]" + "moving companies [city]" (Semrush US volume, 2026-10-27).

- The two keywords overlap, so the index is a relative signal only and should not be read as an additive total.
- The KD shown is the lower of the two keywords.

| Rank | Metro | Demand index | Lowest KD | CPC range | Notes |
|---|---|---:|---:|---|---|
| 1 | New York City | 9,800 | 51 | 26.83 | Highest demand and value; "movers nyc" KD 72. Also top long-distance origin (LD NY 880, NY to FL route). |
| 2 | Chicago | 8,000 | 49 | 21.03 | LD Chicago KD 15 / CPC 51.48 is an easy long-distance entry |
| 3 | Austin | 8,000 | 52 | 21.57 | KD is high-ish for both terms |
| 4 | Dallas | 7,300 | 42 | 19.32 | Mid KD; LD Dallas KD 17 |
| 5 | Atlanta | 7,300 | 45 | 14.73-16.06 | "movers atlanta" KD 69, so target "moving companies atlanta" |
| 6 | Los Angeles | 6,800 | 36 | 22.80-24.78 | Top origin for CA to TX/FL/AZ routes; hireahelper's #1 page |
| 7 | Houston | 6,500 | 45 | 14.70 | LD Houston KD 23 |
| 8 | Orlando | 5,800 | 35 | 16.63 | Low KD; FL inbound |
| 9 | Denver | 4,800 | 34 | 26.04 | Highest city CPC, low KD |
| 10 | Seattle | 4,500 | 37 | 21.89 | |
| 11 | San Antonio | 4,300 | 48 | 14.99-20.90 | |
| 12 | Nashville | 3,900 | 38 | 19.52-19.96 | TN inbound (moving to TN KD 6) |
| 13 | Phoenix | 3,800 | 36 | 19.48 | AZ suburbs perform for hireahelper |
| 14 | Miami / Tampa / Las Vegas | 3,200 each | 37 / 46 / 46 | 15-22 | |
| 17 | Columbus OH | 2,600 | 30 | 17.19-17.42 | |
| 18 | Charlotte | 1,880 | 28 | 18.71-20.27 | |
| 19 | Raleigh | 1,180 | 41 | 21.63 | |
| 20 | Jacksonville | 930 | 36 | 18.92 | |

**State roll-up (sum of the metro demand indices above):**

1. **Texas** = 26,100 (Dallas, Austin, Houston, San Antonio), plus "moving to texas" 1,300 (KD 12).
2. **Florida** = 13,130 (Orlando, Miami, Tampa, Jacksonville), plus "moving to florida" 2,400, "moving companies florida" 1,300 and the NY to FL route.
3. **New York** = 9,800.
4. **Illinois** = 8,000.
5. **California** = 6,800 (LA only pulled).
6. **Georgia** = 7,300.

**Recommended launch set (demand x value x attainability):**

1. **Texas** (Dallas, Houston, Austin) plus CA to TX and IL to TX routes.
2. **Florida** (Orlando, Tampa, Miami) plus NY to FL, NJ to FL and CA to FL routes and the "moving to florida" guide.
3. **Denver**, because of its high CPC and low KD.
4. **Los Angeles** as the origin market for outbound long-distance moves.
5. **Atlanta / Nashville / Charlotte** as the Southeast inbound cluster ("moving to TN/NC/SC" all KD ≤18).
6. **Chicago long-distance**, given KD 15 and a $51 CPC.

New York is very valuable but competitive. Start with NY long-distance and route pages rather than the local "movers nyc" term.

## 5. Data gaps

- **Not pulled:**
  - Organic keyword lists (`resource_organic`) for competitors. Only top pages were pulled.
  - Top pages for consumeraffairs.com and homeguide.com (moving subfolders).
  - SERP top 10 for all city keywords except Dallas.
  - Keyword data for metros outside the 20 listed, and for most state x state routes.
  - Questions (`phrase_questions`) and related keywords (`phrase_related`) for cluster expansion.
  - Historical trend / seasonality columns.
- **Backlinks pulled for 4 domains only:** move.org, moving.com, movebuddha.com and hireahelper.com. There is no backlink data for the other 7 references. Referring-domain overlap and gap analysis has not been run.
- **No Authority Score in `domain_rank`.** AS comes from `backlinks_overview` only, so it exists only for the 4 domains above.
- **The city demand index double-counts** overlapping queries ("movers X" vs "moving companies X"). It is not a deduplicated total.
- **NYC used the "nyc" form** ("movers nyc"); "movers new york" was not pulled. Columbus used "columbus ohio".
- **Intent is blank (unknown)** in Semrush for "local movers", "pods cost" and "moving from illinois to texas".
- **Zero-data terms:** "moving company quotes comparison" returned 0 volume. "fmcsa mover lookup" returned 30 volume and 0 KD, so it is negligible.
- **Brokers:** no SERP check was done to see which ranking URLs are brokers versus carriers. Positioning claims need manual review.
- **Traffic and volume are Semrush estimates** for the US database as of 2026-10-27. They are not first-party analytics.
