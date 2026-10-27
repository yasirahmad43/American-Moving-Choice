# Evidence pack: hireahelper
Direct capture 2026-10-27 (see `_provenance.md`). Pages captured OK: 13 of 14. `/affiliate/` returned the Cloudflare interstitial ("Just a moment...", HTTP 403); no attempt was made to bypass it.

## Page inventory
| # | HTTP | type | path | title | H1 | JSON-LD | words |
|---|---|---|---|---|---|---|---|
| 1 | 200 | profile | /movers/dalton_ga/a-1-moving/ | A-1 Moving - A Local Dalton Moving Company \| HireAHelper | HireAHelper's Review Of A-1 Moving… | MovingCompany + aggregateRating (5.0 / 10) | 1176 |
| 2 | 200 | home | / | Compare and Hire Local Movers By The Hour \| HireAHelper | Compare and Hire Local Movers By The Hour — Get Matched in… | WebSite, Organization, CollectionPage, Service… | 2555 |
| 3 | 200 | city | /movers/los-angeles_ca/ | Hire & Compare Top Local Movers in Los Angeles, CA | Hire and Compare Top Movers in Los Angeles, CA | Organization, CollectionPage, BreadcrumbList, City, Service… | 4717 |
| 4 | 200 | service | /services/moving-companies/ | Book Vetted Local Full-Service Movers | Book Vetted Local Full-Service Movers | Organization, ItemPage, BreadcrumbList, Service… | 2908 |
| 5 | 200 | city | /movers/tallahassee_fl/ | Hire & Compare Top Local Movers in Tallahassee, FL | Hire and Compare Top Movers in Tallahassee, FL | (as row 3) | 4390 |
| 6 | 403 | other | /affiliate/ | Just a moment... | | | |
| 7 | 200 | how | /how-it-works/ | How HireAHelper Works | How HireAHelper Works: Compare, Book, Pay When Done | | 2889 |
| 8 | 200 | about | /about/ | About HireAHelper \| Our Story, Team & Mission | About HireAHelper | | 574 |
| 9 | 200 | profile | /movers/los-angeles_ca/excellent-movers-los-angeles/ | Excellent Movers - A Local Los Angeles Moving Company | HireAHelper's Review Of Excellent Movers… | MovingCompany + aggregateRating (4.9 / 827) | 966 |
| 10 | 200 | directory | /movers/ | Find and Compare Movers From HireAHelper's Nationwide Provider Network | (same) | Organization, ItemPage, BreadcrumbList, Service… | 3112 |
| 11 | 200 | city | /movers/dalton_ga/ | Hire & Compare Top Local Movers in Dalton, GA | Hire and Compare Top Movers in Dalton, GA | (as row 3) | 4246 |
| 12 | 200 | calculator | /moving-cost-calculator/ | Moving Cost Calculator \| Get an Accurate Moving Estimate | HireAHelper's Moving Cost Calculator | Organization, WebPage, WebApplication… | 3013 |
| 13 | 200 | guide | /advice/ | Moving Advice & Tips from HireAHelper | Moving Advice & Tips | CollectionPage, Blog, ItemList | 1439 |
| 14 | 200 | service | /services/ | HireAHelper: We Have Every Moving Service You Need | HireAHelper Has Every Moving Service You Need | CollectionPage, Service… | 2618 |

## Navigation
- Header: Services · Locations · Moving Advice · Why Book with HireAHelper? · phone.
- Footer: Get Listed on HireAHelper · Help · Complaints & Claims · License & Insurance · Service Guarantee · Contact · Moving Advice · Porch Group · Affiliate · Provider Sign Up / Login / Software · Movers Academy · About Us · Terms · Privacy · Best Price Guarantee · Do not sell my information · Sitemap. The footer names Porch Group and sister brands (ISN, EIG, Simple Moving Labor, MovingPlace).
- Three different phone numbers appear across pages ((800) 995-5003, (866) 426-5169, (866) 761-6071), which suggests call-tracking numbers.

## Third-party scripts
HubSpot (banner, analytics, scripts), FullStory, MNTN (mountain.com), Optimizely, Sentry, Google Maps, Tidio chat. No consent-certificate script detected.

## Key observations (short quotes)

### Model: a booking marketplace for hourly labor and local full-service moves
- "Compare and Hire Local Movers By The Hour — Get Matched in Minutes" · "Get real quotes and upfront pricing from reliable movers--all in one place."
- Two primary choices at the top of the page: "Recommended Movers + Truck" / "Movers Only (Movers to help load/unload)".
- How it works: "Compare, Book, Pay When Done" · "No spam, no surprises, no calling around for quotes." · "Our proprietary algorithm scans 1,700+ vetted Helpers and instantly surfaces the best options for your move".
- Guarantees: "$1,000 of damage coverage included for free" · "Every booking is backed by our $1,000 Service Guarantee." · "Best Price guaranteed!" · promo code banner ("Use Code SAVE50LFS at checkout for $50 off…").
- Advocacy line: "When you hire moving labor through us, we act as your advocate, stepping in if something goes w[rong]".
- Scale claims: "1,700+ vetted movers in our network nationwide" · "Over 1,000,000 moves (and counting!)" · "Showing 1848 vetted movers across all 50 states + DC." · since 2007.
- Rating counts differ by page: "4.6 on 9,100+ reviews" (Trustpilot logo), "4.6 out of 5 with 13k reviews", and "4.8/5 average rating from real customers" (About).

### Vetting (published checklist)
- "Every business in our network passes a five-point vetting process before they can take their first booking — and we hold them to ongoing standards on every job after."
- Items quoted: "✔ Owner Background Check" · "✔ Verified Business & Payment Info W-9, business registration, and payment info verified before day one." · "✔ Real Review History 10+ reviews and a 4-star rating…"
- Ongoing monitoring: "providers are continuously monitored on job completion rates, customer ratings, pricing consistency, and compliance."
- Extra checks for full-service bookings: "Verified Commercial General Liability Insurance — active COI on file before any full-service booking." · "Ongoing COI Expiration T[racking]".

### Reviews
- "Every review on HireAHelper comes from a real, paid move" · "Reviews are only collected after a completed, paid booking — never opened to the general public."
- Profiles show "Unedited, unfiltered reviews" and published mover replies ("Mover's response: Thank you for taking the time to leave your review…").
- Profile header pattern: rating and count · city · service radius ("Up to 57 miles"; one profile shows "Up to 0 miles", which looks like a data gap) · "Booked on 2,513 moves through HireAHelper" · "827 Verified Customer Reviews" · opening hours · years in business.

### City pages (`/movers/<city>_<state>/`)
- One template for every city: "Compare the Best 69 Vetted Movers in Los Angeles, CA" (10 in Tallahassee, 20 in Dalton), "How We Vet Every Mover", "The Cost of Moving in <City>", "What Is Labor-Only?", "Real Advice from <City> Movers", FAQ.
- Listings include movers based elsewhere that serve the city: the Tallahassee page lists movers based in Orlando FL and Newton GA; the Dalton page lists movers from Cumming and Atlanta GA. Matching is by service area, not by headquarters.
- Cards show price terms up front: "$90/hr After 2 movers, 2 hr min" · "$120/hr After 2 movers, 2 hr min".
- Local stats block: "10 vetted movers ready to help in Tallahassee · 4.8★ average rating across local jobs · 250+ verified customer reviews nearby".

### Cost calculator
- "built on real-world data—not estimates, not ads, and not le[ad forms]" · "no phone calls, no email required".
- Methodology: "For transportation costs (rental trucks and moving containers), we analyzed over 10,000 completed moves across 12 national brands spanning six years."
- Inputs: a distance slider (miles) and house size.

## Automated quote-walks
- Homepage: the service chooser is a custom widget, so the walker found no next button.
- Company profile CTA (`/movers/dalton_ga/a-1-moving/`):
  - Step 0: Loading ZIP, Loading Date, Unloading ZIP, Unloading Date → "Start A Quote" (typed 30303 and 33101).
  - Step 1: `/checkoutv2/moveitems/` — "Any stairs or heavy items?" (flights of stairs; heavy items yes/no; packing yes/no) → "See Movers".
  - Step 2: `/checkoutv2/helperlist/` — the list of matched movers with prices and a sort control (Best Match / Quality Rating / Most Reviewed / Price). An email box ("save your future move details") is offered with a skip link: "Skip, let me see Movers & Prices first".
  - Result: movers and prices are shown before any contact details, and the email request is optional. The walk stopped at the email field; nothing was entered.
