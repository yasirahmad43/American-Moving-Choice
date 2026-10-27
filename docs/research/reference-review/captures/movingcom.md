# Evidence pack: movingcom
Direct capture 2026-10-27 (see `_provenance.md`).

**Access: partial.** 6 of 13 pages loaded. The others, including the homepage, About and the "best moving companies" lists, returned the bot-protection interstitial "Pardon Our Interruption…" ("Please complete the Challenge below…"). No attempt was made to bypass it. The `/leads/` page rendered on desktop but showed the interstitial on the mobile re-render.

## Page inventory
| # | HTTP | type | path | title | H1 | JSON-LD | words |
|---|---|---|---|---|---|---|---|
| 1 | blocked | home | / | (bot interstitial) | | | |
| 2 | 200 | calculator | /movers/moving-cost-calculator.asp | Moving Cost Calculator for Moving Estimates \| Moving.com | Moving Cost Calculator for Moving Estimates | BreadcrumbList; FAQPage | 4977 |
| 3 | 200 | quote | /movers/moving-company-quotes.asp | Online Moving Quotes - Compare and Save \| Moving.com | Compare Moving Quotes Online | Organization ×2; BreadcrumbList; FAQPage | 3503 |
| 4 | 200 | provider | /leads/ | Moving Leads - Quick Setup, Large Realtor.com Network, Quality Leads … | Moving Leads That Work | | 241 |
| 5 | blocked | about | /about-us/ | | | | |
| 6 | blocked | best | /best-moving-companies/ | | | | |
| 7 | 200 | guide | /tips/cheap-ways-to-move-cross-country/ | 13 Cheap Ways To Move Across The Country - Moving.com | 13 Cheap Ways To Move Across the Country | BlogPosting; BreadcrumbList; FAQPage | 3234 |
| 8 | blocked | review | /allied-van-lines-moving-review.asp | | | | |
| 9 | 200 | cost | /tips/car-trailer-rental-cost-and-tips/ | Car Trailer Rental Cost and Tips - Moving.com | Before You Rent a Car Trailer: The Cost and Helpful Tips | BlogPosting; BreadcrumbList | 1801 |
| 10 | blocked | calculator | /moving-boxes/packing-calculator.asp | | | | |
| 11 | blocked | best | /best-moving-labor-companies/ | | | | |
| 12 | 200 | guide | /tips/tipping-movers/ | Tipping Movers - How Much to Tip - Moving.com | Tipping Movers – How Much to Tip | BlogPosting; BreadcrumbList | 875 |
| 13 | blocked | legal | /privacy-policy/ | | | | |

## Navigation
- Top bar: Advertise · Sign In. Main nav: Moving Companies · Moving Containers · Truck Rental · Storage · Car Shipping · Resources.
- Blog pages show author names (e.g. Laura Mueller, Marian White) and tag clouds (truck rental, cross country, moving container, auto transport…).

## Third-party scripts
Clarity, TikTok, OpenAI pixel host, Bing UET, Google Tag Manager/Ads/Analytics, Facebook, comScore (scorecardresearch), Google CSE, AddToAny, Hotjar, Qualtrics site intercept, Adobe DTM, Optimizely, Google publisher ads, Criteo, RTB House (creativecdn), WordPress stats, Pinterest. No consent-certificate script detected, but pages call `getTcpa(...)`, which suggests a dynamically loaded TCPA disclaimer.

## Key observations (short quotes)

### Moving cost calculator (`/movers/moving-cost-calculator.asp`), the top organic traffic page per Semrush
- Form fields: Moving from (tel/ZIP) · Moving to · Move size {Studio, 1 Bedroom, 2 Bedroom, 2-3 Bedroom, 3 Bedroom, 4 Bedroom…} · Packing services (None/Partial/Full) · Move Date. "Moving Distance: 0 miles" is shown live.
- After an estimate: "Now get FREE quotes from professional movers! We have found up to 4 licensed and insured movers who are ready to provide a detailed quote on your move."
- Trust line: "We require our movers to be licensed and insured. We work hard to keep your personal information safe and secure."
- Shows a "Recent Estimates" feed (e.g. "2-3 Bedroom Moving From: Decatur, GA … Estimated Cost: $1,307 - $1,761").
- Cost figures stated: "The average cost of a local move is $1,400." · "The average cost of a long distance move is $5,450 (distance of 1,000 miles)." · Long-distance range "$1,252 to more than $15,729". Car shipping "$600 to upwards of $3,000". No source or date is attached in the captured text.
- Advice: "We recommend obtaining quotes from at least three moving companies. The mover should conduct either an in-person inspection or a video survey…"
- Long-form sections (H2): How much do movers cost? / How to Calculate Moving Costs / Factors that Affect Your Moving Cost / Additional Moving Costs and Fees / 10 Easy Ways to Cut Moving Costs / FAQ.
- Mobile above the fold: logo > H1 > the calculator form starts immediately (Moving from).

### Quote page (`/movers/moving-company-quotes.asp`)
- Form: Move type {Full Service (They Load - They Drive), Self Service, Moving Labor, Truck Rental, Auto Transport, International} · Moving from (ZIP) · Moving to (ZIP or City, State) · Move size · Move date · buttons "Get Quotes" | "Compare Movers".
- Process copy: "To compare moving quotes online, simply give us your move details and contact information, and we'll send you moving quotes from trustworthy interstate moving companies."
- Education blocks: How to Find Trustworthy Movers · The 3 Different Types of Moving Estimates (binding / non-binding / binding not-to-exceed) · Why You Should Get at Least 3 Quotes · "You can check a company's USDOT Number in the Federal Motor Carrier Safety Administration's database."

### Provider page (`/leads/`)
- H1 "Moving Leads That Work". Meta: "…get high quality moving leads with verified phone numbers."
- Network claim: "The realtor.com network of sites reaches over 80 million unique users a month".
- Sharing cap: "Compete with no more than three other licensed and insured moving companies" · "We will match a consumer with up to 4 licensed and insured moving companies which means you will never compete against more than three other moving companies."
- Setup: "Create your profile … Set your campaign — Customize your moving leads by route, weight, size, daily and monthly budget." · "All moving requests are verified using third party email and phone verification services".
- Logos shown: Moving.com, realtor.com, move.com, avail.co ("part of the Realtor.com network").

### Guides
- "13 Cheap Ways To Move Across The Country" (BlogPosting + FAQPage JSON-LD): cost table "Full-service moving company $4,000-$9,000 · Moving container $2,000-$4,000 · Freight trailer $2,500-$3,000 · DIY truck rental $1,200-$2,000"; "average cost of hiring professional movers for an interstate move is $4,890 (based on an average weight of 7,500 pounds and an average distance of 1,000 miles)". Includes an embedded lead form ("billboard") with a TCPA disclaimer element.
- Car trailer rental guide: author byline (Laura Mueller); says it "got quotes from three of the major moving truck rental companies based on a long-distance move from Chicago to New York City."
- Tipping guide: "if it's a half-day (4 hours) move, $10 per person… full-day move (8 hours), then $20…"

## Automated quote-walk
Not run, because the homepage was blocked. The calculator and quote forms above were captured but not walked.
