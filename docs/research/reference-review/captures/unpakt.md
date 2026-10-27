# Evidence pack: unpakt
Direct capture 2026-10-27 (see `_provenance.md`). Pages captured OK: 9 of 9 (www.unpakt.com and blog.unpakt.com).

## Page inventory
| # | HTTP | type | path | title | H1 | JSON-LD | words |
|---|---|---|---|---|---|---|---|
| 1 | 200 | home | / | Compare Moving Quotes & Book Online In Minutes \| Unpakt | Book the Best Moving Companies Online | MovingCompany + aggregateRating (4.2 / 36) | 656 |
| 2 | 200 | provider | /partnership/ | Become a Partner. Help your client move and earn a referal fee | Become an Unpakt Partner | MovingCompany + aggregateRating (4.2 / 36) | 359 |
| 3 | 200 | how | /how-it-works/ | Exact Prices and No Surprises: How Unpakt works? | How Unpakt Works | MovingCompany + aggregateRating (4.2 / 36) | 510 |
| 4 | 200 | other | /sign-in/ | Compare Moving Quotes & Book Online In Minutes \| Unpakt | LOG IN TO UNPAKT | MovingCompany + aggregateRating (4.2 / 36) | 51 |
| 5 | 200 | guide | blog /category/how-to-before-moving/ | How To - Before Moving Archives - Unpakt blog | How To – Before Moving | Organization | 344 |
| 6 | 200 | cost | blog /category/moving-cost/ | Moving Cost Archives - Unpakt blog | Moving Cost | Organization | 332 |
| 7 | 200 | guide | blog / | Unpakt blog - Everything about moving: costs, packing, planning & more | (image used as H1) | WebSite; Organization | 659 |
| 8 | 200 | faq | /faq/ | FAQ - Frequently Asked Questions \| Unpakt | Unpakt FAQs | MovingCompany + aggregateRating (4.2 / 36) | 212 |
| 9 | 200 | legal | /privacy/ | Unpakt \| Our Privacy Policy | Privacy Policy | MovingCompany + aggregateRating (4.2 / 36) | 3557 |

Note: the same `MovingCompany` markup with an aggregateRating of 4.2 from 36 ratings appears sitewide, including on the sign-in and privacy pages, describing Unpakt itself.

## Navigation
- Header: About Us · FAQ · Services · Contact · Blog · Get $20 · For Service Providers · Sign Up · Log In.
- Footer groups: ABOUT US (What is Unpakt, What is included, How it Works, Press, Agreement, Privacy Policy) · PARTNERSHIPS (Become a Partner, For Service Providers, Corporate Relocation, For Real Estate Agents) · MOVING SERVICES (Local Moving, Interstate Moving, Local Moving Companies, Moving Truck Rental, Hiring Professional Movers) · STORAGE SERVICES · UNPAKT BLOG · CUSTOMER SUPPORT.

## Third-party scripts
Google Tag Manager, Google Maps (address autocomplete), Zoho PageSense, Cloudflare Insights, Facebook, Google Ads, an affiliate widget loader (affiliates.unpakt.com). No consent-certificate script detected.

## Key observations (short quotes)
- Positioning: "Book the Best Moving Companies Online" · "Compare guaranteed moving quotes from the best moving companies" · "No Phone Calls. Get Real Prices Now." · "Book online and save 45% on your moving costs on average."
- Scale claims: "800,000+ moves booked through Unpakt" · "4Million+ miles moved across USA" · "70Million+ lbs moved by our movers". No source or date is given in the capture.
- Pricing model: "Moving company quotes are not based on estimates or hourly fees, but on the size of your inventory and the distance you move." · "How much stuff you have × How far you're going + Additional services = Guaranteed price" · "All local and long distance moving companies are obligated to honor your guaranteed price and to provide an All-Inclusive Package."
- Process: "1. Plan Create your inventory list using our easy planner… 2. Compare Instantly compare guaranteed prices from multiple moving companies…" then book online.
- Payment: "Payment Protection Pay with Unpakt and be protected You don't pay the movers directly. We pay the movers after your move is comp[lete]". Unpakt handles the money flow, which is a booking intermediary model.
- Vetting claim: "pre screened moving companies" (partnership page). No verification method was found on the captured pages.
- Partner program: "Unpakt offers referral fees on all booked moves brought in through its partners. All referral fees are paid monthly…" Consumer referral: "Get $20".
- Blog freshness: category listings show posts dated "3 years ago" / "4 years ago"; one post is titled "How to compare moving companies in 2023".
- Mobile above the fold: H1 > "Book online & save 45%…" > address input "Moving From: address, city, or zip".

## Automated quote-walk: homepage
- Step 0: fields "Moving From: address, city, or zip" and "Moving To: address, city, or zip" (Google address autocomplete), button "Get Prices & Compare Movers".
- The walker typed 30303 → selected "Atlanta, GA 30303, USA". It typed 33101 into the destination, but the autocomplete returned the origin suggestion again (a walker limitation), so the form did not advance: "Page did not change after clicking". The flow beyond the first screen was not observed. Contact details had not been requested by this point. A guided deep dive is needed.

## Guided walk: homepage (2026-10-27, `runplan.js` with `browserd.js`)
- Form: Moving From / Moving To (Google address suggestions; both inputs share the same element id), Move Size (default "1 Bedroom, Small (600-800 sq ft)"), Move Date (prefilled "Nov 06"), optional extra pick-up or drop-off stop, and storage.
- After choosing "Atlanta, GA 30303, USA" and "Miami, FL 33101, USA" and clicking "Get Prices & Compare Movers", the site showed "OOPS!!! Something went wrong creating your move plan. Try refreshing your page." and redirected to `/sign-in/`. This happened on both attempts. The inventory and price-comparison steps could not be observed from the sandbox; the process is known only from `/how-it-works/`.
