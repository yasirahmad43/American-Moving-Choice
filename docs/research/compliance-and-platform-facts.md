# American Moving Choice: compliance and platform facts

**Prepared:** 2026-10-27. **Status:** research notes for the product team, counsel and the accountant. **This is not legal or tax advice.** Everything under "Questions for counsel/accountant" is a question for a licensed professional to answer.

## How this was researched (read first)

- **Access date for every citation below: 2026-10-27.**
- Direct page fetches did not work in this research environment. WebFetch could not resolve any host, and the egress proxy refused curl to `federalregister.gov` and `fmcsa.dot.gov` with a 403. So every fact here comes from **web-search excerpts of the cited primary pages**. Where possible, searches were limited to the official domain (fmcsa.dot.gov, ftc.gov, developers.google.com, docs.stripe.com and so on). Before launch, someone should open each cited URL and confirm the wording, especially items marked **[confirm]**.
- **UNVERIFIED** means no primary source confirmed the item. It may come from secondary sources or general knowledge.
- Secondary sources (law-firm alerts, vendor blogs) are cited only where no primary source was reachable, and they are labeled as secondary.

---

## Summary: where the facts conflict with the client's assumptions

| Client assumption | What the sources show | Design consequence |
|---|---|---|
| Every eligible mover has an MC number, and MC numbers will keep existing | **MC numbers are still issued and still valid as of the latest sources, but FMCSA has formally said it plans to eliminate them.** The elimination was taken out of the Motus Phase II release (FR notice of 2026-04-29) and pushed to a future rulemaking. No NPRM was found as of late Sept 2026. Motus also now issues **randomized** new USDOT and docket numbers. | Build the data model around the **USDOT number as the primary key**, and store the MC/docket number as an optional, multi-valued attribute. A hard "MC required" rule will exclude legitimate intrastate-only movers today, and could exclude new interstate entrants later. Put the rule behind configuration. |
| An MC number proves a company is a mover and not a broker | An MC docket number by itself does not tell you the authority type. One record can carry common, contract and/or broker authority, with HHG or property scope. You must check the authority-type and status fields (SAFER/L&I/QCMobile). | Verify with the API and store the authority type. Reject or flag records where broker authority is the only active authority, and flag dual carrier+broker registrations. |
| Local movers will have a USDOT/MC number | Intrastate-only movers have **no federal operating authority, so no MC number**. Whether they have a USDOT number depends on the state, for example TX requires an intrastate USDOT number. They hold **state** credentials instead: CA Cal-T (BHGS), TX TxDMV number, FL FDACS IM number, NYSDOT authority. | Decide whether to serve local moves at all. If so, add a state-license verification path. |
| The FCC "one-to-one consent" rule will force one-seller-per-consent | **The rule never took effect.** The 11th Circuit vacated it on 2025-01-24, and the FCC formally deleted the text (effective 2025-08-29 per secondary sources). The **pre-2023 PEWC definition** applies. That does **not** make multi-seller consent risk-free: state laws, *McLaughlin v. McKesson* (2025), and case law on whether consent covers a seller who was not named all still apply. | Still name the specific movers the lead will go to, at the point of consent. That is best practice and works for both exclusive and shared leads. Capture full consent evidence. |
| Card and ACH are similar for charging movers for leads | **ACH Direct Debit is not final for about 4 business days** (T+2 settlement for eligible accounts after 120+ days on Stripe). Unauthorized-debit returns are possible for **60 days** on consumer accounts and **2 banking days** on business accounts (R29). | Do not show lead contact details on an unsettled ACH debit unless you accept the credit risk. Use prepaid ACH balance/credits, or card for instant purchases. |
| FAQ rich results are available to us | **Google retired FAQ rich results for all sites on 2026-05-07.** The earlier 2023 government/health-only restriction no longer matters. HowTo rich results were removed in 2023. | Do not plan SERP features around FAQ or HowTo markup. Keep FAQ content for users and AI answers only. |

---

## 1. FMCSA: registration, operating authority, MC numbers, lookup tools, state licensing

### Verified facts

**USDOT registration and operating authority (MC docket) are separate**
- A USDOT number is required for interstate commerce that meets FMCSA's criteria. Some states also require intrastate carriers to get one, and FMCSA keeps a list of those states. Source: FMCSA, "Do I Need a USDOT Number?" https://www7.fmcsa.dot.gov/registration/do-i-need-usdot-number-5 and https://www.fmcsa.dot.gov/registration/getting-started (accessed 2026-10-27).
- Operating authority is a separate grant applied for on Form OP-1. Its categories include *Motor Common Carrier of Household Goods*, *Motor Contract Carrier of Household Goods*, *Broker of Household Goods*, and property (non-HHG) variants. **Each authority type is a separate $300 fee**, and an entity cannot operate until the authority is published in the FMCSA Register. Source: OP-1 form (exp. 07/31/2027), https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2025-09/OP-1%20Form.pdf (accessed 2026-10-27).
- FMCSA says MC docket numbers "were never a statutory or regulatory requirement" (search excerpt of FMCSA registration pages). **[confirm]** Source: https://www.fmcsa.dot.gov/registration/modernization-faqs (accessed 2026-10-27).
- USDOT suffixes include C (property carrier), H (household goods carrier) and B (broker). Same FAQ source. **[confirm]**

**HHG carrier vs HHG broker: financial responsibility**
- HHG motor carriers must file **both** BI&PD liability (for example, a $750,000 minimum for HHG carriers with GVWR of 10,001 lb or more) **and** cargo insurance ($5,000 per vehicle / $10,000 per occurrence; forms BMC-91/91X or BMC-82 and BMC-34 or BMC-83) to get interstate authority. Source: FMCSA Insurance Filing Requirements, https://www.fmcsa.dot.gov/registration/insurance-filing-requirements (accessed 2026-10-27).
- Brokers (including HHG brokers) file a $75,000 surety bond or trust (BMC-84/BMC-85), not liability or cargo insurance. Every carrier and broker must file a **BOC-3** (process agent). Sources: https://www.fmcsa.dot.gov/registration/broker-registration and the insurance-requirements page above (accessed 2026-10-27).
- An HHG broker may arrange transport only through carriers with valid HHG authority (49 CFR 371.105). Source: eCFR 49 CFR 371 Subpart B, https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-371/subpart-B (accessed 2026-10-27).

**How to tell carrier from broker in official records**
- SAFER's company snapshot shows USDOT status (ACTIVE / INACTIVE / OUT-OF-SERVICE) and an Operating Authority Status. That status can read "AUTHORIZED FOR {Passenger, Property, HHG}" or "NOT AUTHORIZED". NOT AUTHORIZED means the USDOT number is active but the entity holds no interstate for-hire authority. INACTIVE can result from a missed biennial MCS-150 update (49 CFR 390.19(b)(4)). Sources: SAFER help, https://safer.fmcsa.dot.gov/saferhelp.aspx; FMCSA FAQ, https://www.fmcsa.dot.gov/faq/why-my-operating-authority-status-shown-not-authorized-safety-and-fitness-electronic-records (accessed 2026-10-27).
- Snapshots link to Licensing & Insurance (L&I) for authority-type history, insurance filings and BOC-3 status. Source: https://li-public.fmcsa.dot.gov/LIVIEW/pkg_li_std_routines.prc_help?pn_pageid=5 (accessed 2026-10-27).
- Under Motus, **one unique docket number is assigned to each newly granted authority**, even when several authorities are requested in one application. So a new entity that gets both carrier and broker authority will have **separate docket numbers**. Source: FMCSA "About FMCSA Registration Changes", https://www.fmcsa.dot.gov/registration/whats-coming (accessed 2026-10-27). **[confirm]**
- For legacy registrations, one carrier record exposes `commonAuthorityStatus`, `contractAuthorityStatus` and `brokerAuthorityStatus` side by side. This implies one legacy MC docket can hold carrier **and** broker authority. The field names come from a third-party Go client of QCMobile, https://pkg.go.dev/github.com/brandenc40/qcmobile (accessed 2026-10-27). **UNVERIFIED against official field docs.**

**MC numbers and Motus: status as of 2026-10-27 (critical)**
- The Federal Register notice "Availability of Motus, FMCSA's New Registration System" (2026-04-29, FR Doc. 2026-08334, cited as 91 FR 23144) says the Phase II release (Q2 2026, open to all regulated entities) **will not include** safety registration, **the elimination of MC/FF numbers**, or changes to BOC-3 filing. FMCSA will implement those "in later releases". The notice expected a **Spring 2026 rulemaking** that would, among other things, require all registrants to use Motus. Source: https://www.federalregister.gov/documents/2026/04/29/2026-08334/availability-of-motus-fmcsas-new-registration-system (accessed 2026-10-27, via search excerpt).
- FMCSA FAQ "Will FMCSA stop issuing MC Numbers?": FMCSA "has proposed no longer assigning MC Numbers". The change "is under consideration and will be available to comment on in a Notice of Proposed Rulemaking" and "will not go into effect with the first release". Sources: https://www.fmcsa.dot.gov/faq/will-fmcsa-stop-issuing-mc-numbers and https://www.fmcsa.dot.gov/registration/modernization-faqs (accessed 2026-10-27).
- FMCSA "What's coming": Motus "will continue to issue docket numbers", the prefixes (MC/MX/FF) "will remain the same", **all newly issued USDOT and docket numbers are randomized**, and existing numbers will not change. Sources: https://www.fmcsa.dot.gov/registration/whats-coming; https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2026-05/Motus%20Changes%20to%20FMCSA%20Registrations.pdf (accessed 2026-10-27).
- Motus has been open for submitting and managing filings since May 2026 (one secondary source gives 2026-05-19). Sources: https://www.fmcsa.dot.gov/faq/what-motus-usdot-registration-system; secondary: https://www.digitalpermitbook.com/post/what-is-motus-fmcsa-registration-system (accessed 2026-10-27).
- **No NPRM eliminating MC numbers was found.** A secondary source says that as of 2026-09-24 it had not appeared in the Federal Register. Source (secondary): https://simplexgroup.net/fmcsa-motus-registration-system/ (accessed 2026-10-27). **UNVERIFIED for 2026-09-24 through 2026-10-27**, so check federalregister.gov.
- Claims that "MC numbers were eliminated October 1, 2025" (for example fleetcollect.net, a Yahoo article) **conflict with FMCSA's own pages and should be disregarded**.

**Official lookup tools and APIs**
- **QCMobile API** (FMCSA Developer): base `https://mobile.fmcsa.dot.gov/qc/services/`. Endpoints include `/carriers/:dotNumber`, `/carriers/:dotNumber/authority`, `/carriers/:dotNumber/docket-numbers` and `/carriers/docket-number/:docketNumber`. Responses are JSON. Every call needs a `webKey` query parameter. You get the WebKey by signing in with **Login.gov** and creating a key under "My WebKeys", where you declare commercial, non-commercial or academic use. Older keys were reset. Multi-carrier results are capped at 50, with a `start` parameter for paging. Sources: https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi, https://mobile.fmcsa.dot.gov/QCDevsite/docs/getStarted, https://mobile.fmcsa.dot.gov/QCDevsite/docs/apiAccess, https://mobile.fmcsa.dot.gov/QCDevsite/logingovInfo (accessed 2026-10-27).
- Field names reported in the carrier record include `allowedToOperate`, `bipdInsuranceOnFile`, `bipdInsuranceRequired`, `cargoInsuranceOnFile` (UNVERIFIED), `commonAuthorityStatus`, `contractAuthorityStatus`, `brokerAuthorityStatus` and `authorizedForHouseholdGoods` (third-party client). `allowedToOperate` reportedly means only "USDOT active, no out-of-service order". **It does not indicate for-hire authority.** Sources (secondary): https://pkg.go.dev/github.com/brandenc40/qcmobile; https://github.com/Teatechnologies/tea-mcp-server-app/pull/12 (accessed 2026-10-27). **UNVERIFIED against the official response-element reference.**
- QCMobile returns current state only, with no history (secondary: https://runalphaloops.com/fmcsa-api/guide).
- **Rate limits:** none published in the sources found. **UNVERIFIED.**
- **Open data (bulk):** FMCSA publishes daily-difference L&I datasets on data.transportation.gov / data.gov, including **ActPendInsur** (insurer, BI&PD limits, policy dates, DOT and docket) and **BOC3** (process agents), in the public domain. Sources: https://catalog.data.gov/dataset/actpendinsur, https://catalog.data.gov/dataset/boc3, https://catalog.data.gov/dataset/licensing-and-insurance (accessed 2026-10-27). An authority-history dataset ("AuthHist") was **UNVERIFIED**.
- **Protect Your Move** (FMCSA consumer site): consumers can search interstate movers and brokers by name, state, USDOT or MC number and see complaint history and safety records. Source: https://www.fmcsa.dot.gov/protect-your-move/how-to/faqs (accessed 2026-10-27).
- Whether Motus exposes a new public API, and whether SAFER/L&I keep showing MC numbers after Motus: **UNVERIFIED**. No source said display would change. FMCSA says existing numbers do not change.

**Interstate vs intrastate, with state examples**
- Interstate HHG movers need USDOT and HHG operating authority. Intrastate-only movers fall under state rules and **have no FMCSA operating authority (no MC number)**.
- **Texas:** anyone transporting household goods for compensation must register with TxDMV (TxDMV number), whatever the vehicle weight. Intrastate HHG carriers must file a tariff and other documents and carry $5,000/$10,000 cargo coverage. Carriers operating only in Texas register with USDOT as **intrastate**. Sources: https://www.txdmv.gov/motor-carriers/txdmv-number; TxDMV tips PDF https://www.txdmv.gov/sites/default/files/body-files/Tips-for-Compliant_Operations-as-a_Texas-Intrastate-Motor-Carrier.pdf (2019); secondary J.J. Keller https://jjkellercompliancenetwork.com/regsense/details/stxfhca (accessed 2026-10-27).
- **California:** intrastate household movers hold a **Household Mover Permit ("CAL-T" + 7 digits)** issued by the **Bureau of Household Goods and Services (BHGS)**, not the CPUC (older CPUC pages are out of date). The number must be shown on vehicles (B&P Code §19236) and can be checked through the BHGS license search. Under AB 2956 (effective 2023-01-01), BHGS-permitted movers are exempt from DMV motor carrier of property registration. Sources: https://www.bhgs.dca.ca.gov/licensee/ab2956.pdf; BHGS enforcement example https://bhgs.dca.ca.gov/enforcement/20210122_weststar_relocation_dao.pdf (accessed 2026-10-27).
- **Florida:** intrastate movers **and moving brokers** must register with **FDACS** under Ch. 507, F.S. (Household Moving Services Act). The registration is the "IM#", with a $600 biennial fee per the FDACS package and proof of insurance under §507.04. Sources: https://ccmedia.fdacs.gov/content/download/116043/file/Household-Moving-Services-Registration-Package-Guide.pdf; https://flsenate.gov/Laws/Statutes/2017/Chapter507/All (accessed 2026-10-27). The current statute text should be confirmed.
- **New York:** NYSDOT issues intrastate household goods authority. Insurance is filed on Form E (liability) and Form H (cargo). A USDOT number is required for vehicles over 10,000 lb. Sources: https://nyc-business.nyc.gov/nycbusiness/description/authority-to-transport-household-goods; secondary J.J. Keller https://jjkellercompliancenetwork.com/regsense/for-hire-carrier-authority-new-york (accessed 2026-10-27). A NY "T number" format is **UNVERIFIED**.
- **Advertising:** 49 CFR 375.207 requires an interstate HHG carrier's ads to be truthful and to include its name as registered and its **USDOT number**. "Advertisement" (375.103) is broad and covers websites. Sources: eCFR Part 375; secondary text https://jjkellercompliancenetwork.com/regsense/375207-375207-what-items-must-be-in-my-advertisements (accessed 2026-10-27). Paragraph (c) text: **UNVERIFIED**.

### Implications for American Moving Choice design
1. **Primary identifier = USDOT number.** Store `dot_number` (required for interstate), `docket_numbers[]` (prefix + number, 0..n), `authority_records[]` (type: common/contract/broker; scope: HHG/property; status; dates), `state_licenses[]` (state, license type, number, status, verified_at).
2. **Eligibility rule (configurable):** for interstate service, require USDOT ACTIVE, an **active HHG common or contract carrier authority**, and BI&PD plus cargo on file and BOC-3 on file. **Exclude** entities whose only active authority is broker authority. **Flag for manual review** anything with both carrier and broker authority (dual registration), and decide on a policy for it.
3. Keep "MC number required" as a **feature flag**, not a schema constraint. If FMCSA eliminates MC numbers, switch verification to USDOT plus authority type with no data migration.
4. **Randomized numbers:** don't validate by format, range or check digit. Validate only by API lookup.
5. Re-verify on a schedule (for example nightly using the daily-difference datasets, plus a live QCMobile call before each lead purchase or at least weekly), since authority and insurance can be revoked.
6. Show the mover's USDOT number (and MC if present) on profile pages. That matches FMCSA consumer guidance ("avoid movers who don't show USDOT numbers") and 375.207.
7. Link consumers to FMCSA Protect Your Move and to the Rights & Responsibilities booklet.

### Questions for counsel
- Can the platform lawfully **require** an MC number when FMCSA has said it may stop issuing them? Any exposure for excluding intrastate movers that hold only state credentials?
- If the platform serves intrastate moves, must it verify state credentials (CA Cal-T, FL IM#, TX TxDMV)? Does advertising an unlicensed intrastate mover create liability under state law (for example, FL Ch. 507 regulates "moving brokers")?
- How should a mover that holds both carrier and HHG broker authority be treated? Could it re-broker leads bought on the platform?
- Does displaying movers' USDOT numbers on the platform make the platform's pages "advertisements" under 375.103/375.207 or state equivalents?

---

## 2. FMCSA rules on HHG brokers, Protect Your Move, and the lead-marketplace "broker" risk

### Verified facts
- 49 CFR Part 371 Subpart B ("Special Rules for Household Goods Brokers") covers brokers that serve individual shippers. It requires them to use only properly authorized HHG carriers, to make disclosures in ads, on **Internet homepages** and to shippers, and to give written estimates only on the conditions it sets (a written agreement with the carrier, a physical survey by the carrier where the goods are within 50 miles, and distribution of the "Ready to Move?" and "Your Rights and Responsibilities When You Move" booklets). Ads must state that the company is an HHG broker, that it does not transport goods, and that it arranges transport by an FMCSA-authorized carrier, along with its MC and USDOT numbers. Sources: https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-371/subpart-B; FMCSA Small Entity Compliance Guide for Broker Operations https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/docs/small-entity-comp-guide-broker-operations-508.pdf (accessed 2026-10-27).
- **FMCSA final guidance, "Definitions of Broker and Bona Fide Agents"** (88 FR 39368, 2023-06-16). This is guidance and does not have the force of law. FMCSA said that "merely making information about potential shippers publicly available, regardless of whether a fee is charged, does not require an entity to obtain broker authority **as long as the entity making the leads available is not otherwise involved in any transaction between the shipper and a motor carrier**." The guidance stresses that the analysis is fact-specific and gives weight to whether an entity **handles money exchanged between shipper and carrier**, and whether it exercises discretion in allocating traffic. Sources: https://www.federalregister.gov/documents/2023/06/16/2023-13080/definitions-of-broker-and-bona-fide-agents; secondary summaries https://scopelitis.com/law-alerts/fmcsa-announces-final-guidance-on-definition-of-broker-and-bona-fide-agent-as-well-as-on-role-of-dispatch-services/, https://www.ttnews.com/articles/fmcsa-guidance-brokerage (accessed 2026-10-27). Exact quote: **[confirm]** against the FR text.
- **Protect Your Move** (FMCSA campaign and site) red flags: estimates given by phone or online "sight unseen" without an onsite inspection; demands for cash or large deposits; no written estimate; no local address or registration/insurance information on the website; ads without USDOT numbers. Also covered: the 110% rule on non-binding estimates and the complaint line 1-888-368-7238. FMCSA also runs "Operation Protect Your Move" enforcement against fraudulent movers and brokers. Sources: https://www.fmcsa.dot.gov/protect-your-move/red-flags, https://www.fmcsa.dot.gov/protect-your-move/select-mover, https://www.fmcsa.dot.gov/newsroom/fmcsa-launches-operation-protect-your-move-nationwide-crackdown-moving-scams (accessed 2026-10-27).
- FMCSA records showed HHG brokers rising from 652 to 1,256 (2024 FMCSA notice). Source: https://govinfo.gov/content/pkg/FR-2024-01-22/pdf/2024-01044.pdf (accessed 2026-10-27).

### Implications for American Moving Choice design
- To stay inside the "lead provider, not broker" position in the 2023 guidance, the platform should **not**: give or adjust price estimates or quotes on movers' behalf, collect deposits or move payments from consumers, pick or assign the mover with discretion and present it as "your mover", negotiate terms, or take part in booking. Lead fees are charged to movers only. Consumers pay nothing to the platform.
- **Copy matters:** avoid "we'll book your mover", "get your move price", "our movers". Use "compare quotes from licensed, independent movers", and state clearly that the platform does not transport goods and is not a broker. Show any "instant estimate" tools only as clearly labeled ranges, if at all. Sight-unseen estimates are an FMCSA red flag.
- The "movers only, no brokers" rule fits well with FMCSA's consumer messaging and makes a good trust feature.
- Matching logic (who gets a shared lead) should be rule-based and transparent, driven by the consumer's choices and the mover's service area, so it doesn't look like "allocating traffic" with discretion.

### Questions for counsel
- Given the 2023 guidance and 49 USC 13102(2) (the statutory broker definition), does **exclusive** lead sale, where the platform effectively chooses one mover, or platform-run scheduling or messaging, risk being treated as "arranging" transport and so require HHG broker authority?
- Do 371 Subpart B disclosure duties ever apply to a lead platform? Do state laws (for example FL Ch. 507's "moving broker" definition) define a broker more broadly than federal law?
- Can the platform show price ranges or calculators without counting as "providing an estimate"?
- Exposure if a listed mover turns out to be a disguised broker or a fraudulent operator. What diligence and takedown process is enough?

---

## 3. Call and text consent (TCPA, state mini-TCPAs, CAN-SPAM)

### Verified facts

**FCC one-to-one consent rule: vacated and removed**
- *Insurance Marketing Coalition v. FCC*, No. 24-10277 (11th Cir., decided **2025-01-24**), vacated the 2023 amendment to 47 CFR 64.1200(f)(9). That amendment would have limited prior express written consent (PEWC) to **one identified seller** and to calls "logically and topically associated" with the interaction. The court held the FCC exceeded its statutory authority, and under the common law consent need not be limited to one seller. The FCC had already postponed the rule's effective date (2025-01-27) by order DA 25-90. Sources: https://www.mofo.com/resources/insights/250130-eleventh-circuit-vacates-fcc-s-tcpa-one-to-one-consent-rule; https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/eleventh-circuit-vacates-tcpa-11-consent-rule (law-firm secondary; accessed 2026-10-27).
- The mandate issued on 2025-04-30. On 2025-07-14 the FCC's CGB **removed the vacated text and reinstated the prior (f)(9) definition**, reported as 90 FR 42137, **effective 2025-08-29**. Sources (secondary): https://www.womblebonddickinson.com/us/insights/tcpa-defense-force/102ndra/fcc-repeals-one-to-one-consent-rule-following-eleventh-circuit-decision; https://www.goodwinlaw.com/en/insights/blogs/2025/09/the-fcc-issues-final-rule-formally-eliminating-the-one-to-one-consent-requirement; https://www.faegredrinker.com/en/insights/publications/2025/7/fcc-ends-quest-to-amend-its-definition-of-prior-consent-in-the-wake-of-eleventh-circuit-ruling (accessed 2026-10-27). FR citation: **[confirm]**.
- **Current PEWC (reinstated):** an agreement in writing bearing the signature of the person called. It must clearly authorize the seller to deliver telemarketing calls or texts using an autodialer or artificial/prerecorded voice, identify the phone number, and include a clear and conspicuous disclosure that the person is authorizing such calls and that **consent is not a condition of purchase**. Source: 47 CFR 64.1200(f)(9) (eCFR); background in 2024 FR https://www.govinfo.gov/content/pkg/FR-2024-01-26/pdf/2023-28834.pdf (accessed 2026-10-27). Whether the E-SIGN Act satisfies the signature requirement, and in what form: **UNVERIFIED here** (widely relied on in industry, but a question for counsel).
- **Unchallenged provisions** of the same 2023 order (text-blocking and related) remain in effect. Source: secondary, Womble Bond Dickinson above.

**Revocation-of-consent rule (affects opt-out handling)**
- 47 CFR 64.1200(a)(10) "revoke-all" provision: CGB order **DA 26-12** (2026-01-06) extended the waiver to **2027-01-31**. Source: https://www.fcc.gov/document/cgb-extends-effective-date-tcpas-consent-revocation-rule (accessed 2026-10-27).
- In **September 2026** the FCC adopted a Report & Order and FNPRM narrowing revoke-all. Sources disagree on the date (Sept 9 or Sept 30). Under it, an opt-out from an informational call or text revokes only that category, **but the narrowing does not apply to telemarketing or advertising messages**. It also lets callers designate an FCC-approved exclusive opt-out method. It takes effect 30 days after FR publication and supersedes the 2027-01-31 date. Sources: https://www.crowell.com/en/insights/client-alerts/fcc-officially-adopts-amendments-to-tcpa-rules; https://www.hunton.com/insights/legal/fcc-adopts-clarifying-changes-to-the-tcpa-revoke-all-rule-to-be-effective-30-days-after-publication (accessed 2026-10-27). **FR publication/effective date: UNVERIFIED.**

**Other federal context**
- *McLaughlin Chiropractic Assocs. v. McKesson Corp.* (U.S. Supreme Court, **2025-06-20**, 6-3): district courts in private TCPA suits are **not bound** by FCC interpretations. They interpret the statute themselves and give the agency "appropriate respect". FCC guidance therefore carries less weight as a safe harbor. Sources: https://www.huschblackwell.com/newsandinsights/supreme-court-clarifies-district-courts-independence-from-fccs-tcpa-interpretations; https://www.faegredrinker.com/en/insights/publications/2025/6/supreme-court-decides-mclaughlin-chiropractic-associates-v-mckesson-corp (accessed 2026-10-27).
- *Facebook v. Duguid* (2021): an "ATDS" must use a random or sequential number generator to store or produce numbers. This narrows the autodialer hook, but artificial/prerecorded voice rules and Do-Not-Call rules still apply. Source: https://www.law.cornell.edu/supremecourt/text/19-511 (accessed 2026-10-27).
- National DNC: telephone solicitations to registered numbers are permitted with an established business relationship (EBR), which includes an **inquiry within the prior 3 months** (64.1200(f)(5)), or with the person's signed written permission. Whether an inquiry made **to the platform** creates an EBR with a **mover** is a question for counsel. Source (secondary quoting CFR): https://www.dnc.com/blog/understanding-the-established-business-relationship-exemption-ebr (accessed 2026-10-27). **[confirm against eCFR]**

**State mini-TCPAs (examples, not exhaustive)**
- **Florida (FTSA, §501.059):** private right of action. HB 761 (signed 2023-05-25) narrowed the autodialer definition to systems that select **and** dial. It allowed PEWC by checkbox or by affirmatively replying to texts, and it requires a plaintiff to send a stop request and allow **15 days** before suing over unsolicited texts. Sources: enrolled bill https://flsenate.gov/Session/Bill/2023/761/BillText/er/PDF; https://www.klgates.com/thought-leadership/Florida-Legislature-Passes-Bill-to-Bring-Common-Sense-Changes-to-the-Florida-Telephone-Solicitation-Act-5-9-2023 (accessed 2026-10-27).
- **Oklahoma (Telephone Solicitation Act, 15 O.S. §775C), effective 2022-11-01:** PEWC for automated solicitation, a cap of 3 calls per 24 hours, and a private right of action. Source (secondary): https://www.goodwinlaw.com/en/insights/publications/2023/02/02_28-mini-tcpa-laws-you-should-know (accessed 2026-10-27). **[confirm statute]**
- **Maryland (Stop the Spam Calls Act, 2023):** sources say it requires written consent for automated calls and caps calls at 3 per 24 hours. Private right of action: **UNVERIFIED** (sources conflict).
- **Texas (SB 140, effective 2025-09-01):** "telephone solicitation" now includes texts and images, with a private remedy (reported through the DTPA). The registration duties under Bus. & Com. Code Ch. 302 may reach texting marketers. Sources: secondary https://www.leadgen-economy.com/blog/state-mini-tcpa-laws-ftsa-otsa/ (accessed 2026-10-27). **[confirm statute]** Whether movers or the platform must register in TX: **UNVERIFIED**.
- About 12-13 states have mini-TCPA-style laws. A complete current list: **UNVERIFIED**.

**CAN-SPAM (email)**
- Requirements: accurate header and "from" information; non-deceptive subject lines; identification as an ad (for commercial messages); a valid physical postal address; a working opt-out honored within **10 business days** and kept working for at least 30 days after sending; no fee or extra personal data required to opt out; no selling or transferring opted-out addresses. Applies to B2B email too. Penalties are inflation-adjusted per email. Source: FTC, CAN-SPAM Act: A Compliance Guide for Business, https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business (accessed 2026-10-27). The current per-email penalty amount: **[confirm]**.

**Consent-evidence tooling**
- TrustedForm (ActiveProspect) records the form session (including page metadata and keystroke-level events) and produces a certificate URL showing that the consumer saw the consent language. TrustedForm Retain stores certificates for the statute-of-limitations period. Sources: https://support.activeprospect.com/hc/en-us/articles/44098172771988-Overview-of-TrustedForm; https://activeprospect.com/trustedform/api-retain/ (accessed 2026-10-27). Exact retention terms: **UNVERIFIED**.
- Jornaya LeadiD timestamps and fingerprints the lead event. Reported: ActiveProspect acquired Verisk Marketing Solutions (Jornaya's owner) on 2026-01-08. **UNVERIFIED** (single secondary source: https://www.leadgen-economy.com/blog/trustedform-vs-jornaya-comparison/).

### Implications for American Moving Choice design
1. **Consent capture at quote submission:** an unchecked checkbox, separate from the Terms acceptance, with a clear and conspicuous disclosure that:
   - **names the sellers**, meaning the specific mover(s) the lead will go to. For shared leads, show the matched movers (for example up to N) before submission, and let the consumer deselect any. For exclusive leads, name the single mover.
   - covers calls, texts and prerecorded/automated technology, at the number provided.
   - states that consent is not a condition of purchase, gives message frequency and the "msg & data rates may apply" notice for SMS, and explains how to opt out (STOP).
   - offers a no-consent path (for example "email me only" or "I'll contact movers myself").
2. **Evidence record per lead (immutable):** disclosure text version ID and the full rendered text; timestamp (UTC); IP address; user agent; page URL; phone and email; checkbox state; the list of named sellers shown; a TrustedForm-style certificate ID (optional but recommended); a hash of the form state. Keep it at least as long as the longest limitations period (TCPA is 4 years; state laws vary), and hand the record to each buying mover.
3. **Only deliver a lead to movers named in its consent.** A late-added buyer requires new consent.
4. **Opt-out propagation:** a STOP or "do not contact" received by the platform must reach every mover that bought the lead, and movers must be contractually required to honor opt-outs and to report opt-outs they receive. Plan for the narrowed revoke-all rule. Telemarketing opt-outs remain broad.
5. **Quiet hours and frequency:** enforce the strictest common state limits by default (for example 8am-8pm consumer local time, and at most 3 attempts per 24h where FL, OK or MD apply) in any platform-sent messages, and require the same of movers by contract.
6. Platform-sent email (lead confirmations, review requests): treat review requests and marketing as commercial (CAN-SPAM), with postal address and one-click unsubscribe.

### Questions for counsel
- After *IMC v. FCC* and *McLaughlin*, is consent naming multiple movers on one form enough under federal law **and** under FL, OK, MD and TX law? How many sellers is too many?
- Do the platform's own SMS and calls (verification codes, "your movers will contact you") need PEWC, or are they informational?
- Does the consumer's inquiry to the platform create an EBR for the movers (DNC exemption), or must movers rely only on written consent?
- Does TX SB 140 (and the Ch. 302 registration duty) apply to the platform or to the movers?
- Should the platform indemnify movers, or require indemnities from them, for TCPA claims? Is vicarious liability a risk for the platform?
- What wording works for SMS short code / 10DLC carrier approval (CTIA guidelines)? **UNVERIFIED here.**

---

## 4. FTC: Consumer Reviews and Testimonials Rule, platform review guide, Endorsement Guides

### Verified facts
- **16 CFR Part 465** (Trade Regulation Rule on the Use of Consumer Reviews and Testimonials), FR 2024-08-22 (Doc. 2024-18519), **effective 2024-10-21**. Civil penalties are available. Sources: https://www.federalregister.gov/documents/2024/08/22/2024-18519/trade-regulation-rule-on-the-use-of-consumer-reviews-and-testimonials; https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465; FTC warning-letter template https://www.ftc.gov/system/files/ftc_gov/pdf/2025-Fake-Review-Warning-Template.pdf (accessed 2026-10-27).
- Key prohibitions:
  - §465.2: fake or false reviews and testimonials (non-existent reviewers, reviewers misrepresenting their experience, AI-generated fakes). Creating, selling, buying or knowingly disseminating them is prohibited.
  - §465.4: incentives **conditioned, expressly or implicitly, on a particular sentiment**.
  - §465.5: insider reviews without clear disclosure of the material connection. Officers or managers who solicit reviews from employees or relatives have extra duties.
  - §465.6: misrepresenting that a site or entity the business controls provides **independent** reviews.
  - §465.7: review suppression through unfounded legal threats or intimidation, or misrepresenting displayed reviews as all or most of the reviews when negative ones were suppressed. Withholding on neutral criteria (fake, unrelated, objectionable) is allowed if applied evenly.
  - §465.8: fake social-media indicators.
  - The FTC Q&A says the rule does **not** ban incentives for reviews if there is no sentiment condition.
  - Sources: FTC press release https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials; Q&A https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers (accessed 2026-10-27).
- **"Featuring Online Customer Reviews: A Guide for Platforms"** (FTC, Jan 2022):
  - *Collecting:* don't ask only likely-positive customers; don't condition incentives on positive reviews; note that even unconditioned incentives may bias reviews.
  - *Moderating:* have reasonable, current processes to verify reviews are genuine; apply them equally to positive and negative reviews; don't edit in ways that change meaning.
  - *Publishing:* publish negative reviews too; don't display reviews in a misleading way (for example giving positive ones more prominence); disclose material connections; **clearly disclose how reviews are collected, processed and displayed**, including how ratings are calculated; have procedures for flagged or suspicious reviews.
  - Source: https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms (accessed 2026-10-27).
- **Endorsement Guides (16 CFR Part 255, revised 2023):**
  - Reviews that don't clearly and conspicuously disclose an incentive are likely deceptive.
  - Incentivized reviews that materially inflate an average star rating may be deceptive even with disclosure.
  - There is a new principle against procuring, suppressing, boosting, organizing or editing reviews in ways that distort what consumers think.
  - A platform's built-in disclosure tool may not be enough.
  - Sources: https://www.ftc.gov/news-events/news/press-releases/2023/06/federal-trade-commission-announces-updated-advertising-guides-combat-deceptive-reviews-endorsements; https://www.ftc.gov/system/files/ftc_gov/pdf/p204500_endorsement_guides_in_2023.pdf (accessed 2026-10-27).

### Implications for American Moving Choice design
- **Verified-move reviews only:** invite reviews only from consumers whose lead was delivered to that mover. Mark them "Verified quote request". Invite **all** such consumers automatically, not just ones a mover selects.
- **Movers must not gate reviews.** No mover-selected invites, no "rate us 5 stars". Any platform incentive (for example a sweepstakes) must not depend on sentiment and must be disclosed on each review. Track the rating effect of incentivized reviews separately.
- **Moderation policy:** publish the neutral criteria, apply them evenly, log every rejection with its reason, and offer a dispute or appeal process. Never let a paying mover remove negative reviews. Don't let payment tier affect review display or order.
- **Ranking disclosure:** if paid placement affects ordering on directory pages, label it clearly ("Sponsored"), and explain how ranking and ratings are calculated.
- **Independence:** because the platform is paid by movers, don't call reviews "independent" without disclosing that movers pay for leads (§465.6 risk).
- Don't import movers' Google or Yelp reviews as if they were the platform's own.

### Questions for counsel
- Could a lead-fee relationship with movers create a "material connection" that must be disclosed next to ratings or rankings?
- Does selling "featured" or sponsored placement on city pages require per-listing ad disclosures?
- Liability if a mover posts fake reviews of itself or competitors on the platform. Takedown and notice procedures.

---

## 5. Google Search policies and features

### Verified facts
- **Spam policies** (https://developers.google.com/search/docs/essentials/spam-policies, last updated late Aug 2026; accessed 2026-10-27):
  - *Doorway abuse:* sites or pages created to rank for specific, similar queries that lead users to intermediate pages less useful than the final destination. Examples include **city- or region-targeted pages that funnel users to one page**.
  - *Scaled content abuse:* generating many pages mainly to manipulate rankings, with little value to users, **no matter how it is created** (AI, human or both).
  - *Site reputation abuse:* third-party pages that exploit the host site's ranking signals. Since Aug 30, 2026, manual actions under this policy do not apply in the EEA but do apply elsewhere (https://developers.google.com/search/blog/2026/08/update-site-reputation-policy).
  - *Expired domain abuse* was also added in March 2024.
  - Google's generative-AI content guidance says automation is spam if its primary purpose is manipulating rankings: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content.
- **AI optimization guide: the URL exists.** https://developers.google.com/search/docs/fundamentals/ai-optimization-guide, titled "Optimizing your website for generative AI features on Google Search", was published in May 2026 (blog: https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing) and updated in June 2026 to clarify llms.txt. Key points:
  - AI Overviews and AI Mode rely on core Search ranking and quality systems, with retrieval and "query fan-out" from the index, so "generative AI search is still SEO".
  - Pages must be indexed and **eligible to show a snippet**.
  - Google says you **don't need llms.txt, "chunking", or manufactured brand mentions**. llms.txt "won't negatively or positively impact" visibility.
  - Performance shows in a Search Console generative-AI performance report.
  - The companion page "AI features and your website" (https://developers.google.com/search/docs/appearance/ai-features) says there are no additional requirements or special optimizations, and that nosnippet, max-snippet and noindex control appearance in AI features.
  - (Accessed 2026-10-27.)
- **FAQ rich results:** restricted in Aug 2023 to "well-known, authoritative government and health websites" (https://developers.google.com/search/blog/2023/08/howto-faq-changes). **Now retired for all sites.** Google's updates log says FAQ rich results stopped appearing **2026-05-07**. The FAQ docs, report and Rich Results Test support were removed in June 2026, and Search Console API support in August 2026. Source: https://developers.google.com/search/updates (accessed 2026-10-27). Secondary sources say Google still uses FAQ markup for understanding pages (**UNVERIFIED** as a Google statement).
- **HowTo rich results:** removed. No longer shown on desktop from 2023-09-13, then fully deprecated, and the documentation was removed. Sources: 2023 blog above; https://developers.google.com/search/updates (accessed 2026-10-27).
- **Self-serving reviews:** pages using LocalBusiness or any Organization type are **ineligible for review stars** when the reviewed entity controls the reviews about itself (including embedded third-party widgets). Review and aggregateRating markup on LocalBusiness is meant for sites that capture reviews **about other** businesses. Ratings must come from users, not editors. Sources: https://developers.google.com/search/docs/appearance/structured-data/review-snippet; https://developers.google.com/search/docs/appearance/structured-data/local-business; https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful (accessed 2026-10-27).

### Implications for American Moving Choice design
- **City and route pages** ("movers in Austin", "Austin to Denver movers") are a doorway risk if they are templated, interchangeable and funnel to the same form. Each page must carry unique, useful data: actual verified movers serving that area, real review excerpts, local regulations (for example state license requirements), price data from the platform's own leads (aggregated), and seasonality. Don't create pages for places with no mover coverage. Noindex thin combinations.
- AI-assisted copy is fine if it adds value. Avoid mass generation of near-duplicate pages.
- **Review stars:** as a third-party review platform, the platform's mover profile pages (LocalBusiness/MovingCompany for *other* businesses) may be eligible for review snippets. The platform's own Organization page is not. Implement only with genuine on-page user reviews.
- Don't build FAQ or HowTo rich-result features into the SEO plan. Keep FAQ sections for users and AI answer engines.
- Make sure key pages are indexable and snippet-eligible (avoid `nosnippet` on content you want cited in AI Overviews).

### Questions for counsel
- None legal. Note for the SEO owner: re-check the spam policies before launching programmatic pages.

---

## 6. AI crawlers and llms.txt

### Verified facts (all accessed 2026-10-27)
| Operator | User agent / token | Documented purpose | Source |
|---|---|---|---|
| OpenAI | `OAI-SearchBot` | Surfaces sites in ChatGPT search. Allow it to appear. Changes take about 24h. | https://developers.openai.com/api/docs/bots |
| OpenAI | `GPTBot` | Training foundation models. Disallowing it opts out of training. | same |
| OpenAI | `ChatGPT-User` | User-initiated fetches. Robots.txt **may not apply**. Not used for search eligibility. | same |
| OpenAI | `OAI-AdsBot` | Ad landing-page validation. | https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers |
| Anthropic | `ClaudeBot` | Collects training data. | https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler |
| Anthropic | `Claude-SearchBot` | Indexing to improve search result quality. | same |
| Anthropic | `Claude-User` | Fetches for user queries. Blocking it reduces visibility in user-directed search. | same |
| Perplexity | `PerplexityBot` | Search indexing and links. **Not** used to train foundation models. Respects robots.txt. | https://docs.perplexity.ai/docs/resources/perplexity-crawlers |
| Perplexity | `Perplexity-User` | User-triggered fetch. **Generally ignores robots.txt**. | same; https://www.perplexity.ai/help-center/en/articles/10354969-how-does-perplexity-follow-robots-txt |
| Google | `Googlebot` | Search crawling, which also feeds AI Overviews and AI Mode (they use the Search index). | https://developers.google.com/search/docs/crawling-indexing/googlebot; AI features page above |
| Google | `Google-Extended` (robots.txt **token only**, no separate UA) | Controls use of content for **Gemini training and grounding in Gemini Apps**. **Does not affect Search inclusion or ranking.** | https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers |
| Microsoft | `bingbot` | Bing crawling. Use **NOARCHIVE** (keeps content out of Copilot answers and grounding, and out of foundation-model training) and **NOCACHE** (URL, title and snippet only) meta tags or X-Robots-Tag for AI control. Robots.txt is not the AI control. | https://www.bing.com/webmasters/help/robots-meta-tags-and-attributes-that-bing-supports-5198d240; https://blogs.bing.com/webmaster/september-2023/Announcing-new-options-for-webmasters-to-control-usage-of-their-content-in-Bing-Chat |
| Apple | `Applebot` / `Applebot-Extended` (control token; does not crawl) | Applebot powers Apple search features. Disallowing Applebot-Extended opts out of training Apple foundation models. Search inclusion is unaffected. | https://support.apple.com/en-us/119829 |

- **llms.txt:** Google says it is not needed and has no positive or negative effect on Google Search visibility (AI optimization guide, June 2026 update). Official **consumption** of llms.txt by OpenAI, Anthropic, Perplexity, Microsoft or Apple crawlers: **UNVERIFIED**. No primary source was found saying any of them use it for ranking or crawling. (Perplexity publishes its own `docs.perplexity.ai/llms.txt`, but that is not evidence it reads other sites' files.)

### Implications for American Moving Choice design
- Recommended robots.txt stance (business decision): **allow** search and answer agents (Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot, Applebot). Decide on training opt-outs (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended) separately. Blocking training bots does not hurt search visibility, according to each vendor.
- **Never expose lead or consumer PII to crawlers.** Lead detail pages, mover dashboards and consumer quote pages must sit behind auth and use `noindex`. Don't rely on robots.txt, since user-triggered fetchers may ignore it.
- Allowlist these bots in the CDN or WAF (Cloudflare bot rules), or they will be blocked even when robots.txt allows them.
- An llms.txt is optional and cheap, but don't expect ranking benefit.

### Questions for counsel
- Does publishing mover profile data (including reviews) that AI systems may reuse raise any contractual issues with movers? Add a license clause to the mover terms.

---

## 7. Stripe: saved payment methods, card vs ACH timing, fees, Connect, Tax

### Verified facts (all accessed 2026-10-27)
- **SetupIntents:** save a payment method without charging, then charge later with a PaymentIntent using `off_session=true, confirm=true`. If authentication is required (for example 3DS), the off-session attempt fails with a 402 / `authentication_required`, the PaymentIntent goes to `requires_payment_method`, and you must bring the customer back on-session. Sources: https://docs.stripe.com/payments/save-and-reuse; https://docs.stripe.com/payments/cards/save-and-reuse.
- **ACH mandates:** Stripe-hosted UIs (Checkout, Payment Element) collect and store mandate acceptance. Custom integrations must show mandate terms and give the customer an electronic or paper copy (Nacha). Stripe recommends keeping authorization records for 2 years. Default SEC code is WEB for consumer accounts and CCD for business accounts. Sources: https://support.stripe.com/questions/collecting-ach-direct-debit-mandates-from-customers; https://docs.stripe.com/payments/ach-direct-debit/sec-codes; https://docs.stripe.com/payments/ach-direct-debit.
- **ACH timing:** standard settlement is **4 business days** on PaymentIntents (6 on the legacy Charges API). **Faster settlement (T+2)** is for eligible US accounts, typically after **120+ days** of processing in good standing, with confirmation at about T+3 vs T+4. If a payment fails after funds are made available, Stripe removes the funds. Sources: https://support.stripe.com/questions/ach-direct-debit-payment-settlement-time; https://support.stripe.com/questions/two-day-settlement-for-ach-direct-debit; https://docs.stripe.com/payments/ach-direct-debit.
- **ACH returns and disputes:** R10 (consumer unauthorized) can be returned up to **60 days** with a Written Statement of Unauthorized Debit. Non-consumer unauthorized (R29) must be returned within **2 banking days** after settlement. The Nacha unauthorized-return threshold is 0.5%. WEB debits need a "commercially reasonable" fraud-detection method (for example prenotes, micro-deposits, verification services). Stripe maps R10/R29 to `debit_not_authorized`. Sources: https://www.nacha.org/rules/differentiating-unauthorized-return-reasons; https://www.nacha.org/rules/ach-network-risk-and-enforcement-topics; https://docs.stripe.com/declines/network-codes.
- **Financial Connections:** `verification_method` can be `automatic` (default: instant via Financial Connections, with a microdeposit fallback), `instant` (no fallback) or `microdeposits`. Microdeposits take **1-2 business days** to land, plus customer confirmation, with a 10-day verification window and a 10-failed-attempt limit. Accounts verified by microdeposit get no balance or ownership data. Sources: https://docs.stripe.com/financial-connections/ach-direct-debit-payments; https://docs.stripe.com/payments/ach-direct-debit/set-up-payment.
- **Fees** (pricing pages; confirm on the live page):
  - Domestic cards: **2.9% + 30¢**, plus 0.5% if manually entered, 1.5% for international cards, 1% for currency conversion.
  - **ACH Direct Debit: 0.8%, capped at $5.00**. Faster (T+2) settlement is reported at 1.2% (**[confirm]**). Failed and disputed ACH payments carry separate fees.
  - Financial Connections: **$1.50 per verification** (**[confirm]**).
  - Instant Payouts: 1.5% (min 50¢) on the standard account; Connect pricing differs.
  - Sources: https://stripe.com/pricing; https://stripe.com/pricing/local-payment-methods; https://stripe.com/payments/us-bank-payments.
- **Customer credit balance:** an **invoices-only** mechanism. The balance applies automatically to the next finalized invoice, up to the invoice total. You can't target a specific invoice, currencies must match, and it doesn't apply to Checkout-created invoices. Sources: https://docs.stripe.com/invoicing/customer/balance; https://docs.stripe.com/billing/customer/balance. **Billing Credit Grants** (prepaid or promotional credits) currently work only with **metered prices tied to a Billing Meter**. Source: https://docs.stripe.com/api/billing/credit-grant.
- **Connect:** for platforms that move money between parties (marketplaces that pay out sellers, or SaaS where connected accounts are merchant of record). Sources: https://docs.stripe.com/connect/how-connect-works; https://docs.stripe.com/connect/saas-platforms-and-marketplaces. If the platform only charges movers for its own service (leads) and never pays movers out, Connect is not needed. That is an inference from Stripe's description, **not a quote**.
- **Stripe Tax:** 0.5% per transaction (no-code) or $0.50 per API calculation, charged only in jurisdictions where you're registered. Tax Complete plans run $90-$1,500 per month. Sources: https://stripe.com/tax/pricing; https://support.stripe.com/questions/understanding-stripe-tax-pricing. The right product tax code for "lead generation" is **UNVERIFIED**.
- **Lead-gen taxability examples:**
  - **Washington ESSB 5814** made "advertising services" retail sales from **2025-10-01**. The definition includes "online referrals", search engine marketing and similar. Whether pay-per-lead sales fall inside it: **UNVERIFIED** (strong candidate). Source: WA DOR interim guidance https://dor.wa.gov/laws-rules/interim_guidance_statements/interim-guidance-statement-regarding-changes-made-essb-5814-advertising-services.
  - **Texas:** the Comptroller proposed in 2024 to classify lead generation as taxable "data processing" (80% taxable). The final rule wording on lead generation: **UNVERIFIED**. Source (secondary): https://taxnews.ey.com/news/2024-1861-texas-comptroller-proposes-significant-changes-to-sales-and-use-tax-regulations-for-data-processing-services.

### Implications for American Moving Choice design
1. **Don't release a lead on an unsettled ACH debit.** Options, in order of preference:
   - **(a) Prepaid wallet:** the mover funds a balance by ACH (or card). Credit becomes spendable only when the PaymentIntent reaches `succeeded` (about T+4 business days). Lead purchases draw down the platform's **internal ledger**, and contact details reveal instantly. Keep the ledger in your own DB. Stripe's customer balance is invoice-only and Credit Grants are meter-bound, so either use them through invoices or meters, or (simpler) run an internal ledger reconciled to Stripe top-up payments.
   - **(b) Card on file** (SetupIntent, off-session) for instant per-lead charges. Reveal the lead on `succeeded`. Handle `authentication_required` by asking the mover to re-authenticate in the dashboard.
   - **(c) ACH per-lead with deferred reveal:** this hurts lead freshness, the core value of a moving lead. Not recommended.
2. Even after ACH settles, a **business** account can return an unauthorized debit within 2 banking days, and a consumer account (sole proprietors may use personal accounts) within **60 days**. Set limits: cap wallet top-ups for new movers, require Financial Connections `instant` verification (ownership data), and hold funds or delay withdrawals of unused balance.
3. **Refunds and credits for bad leads** (wrong number, duplicate): credit the internal wallet instead of refunding to card, to reduce fees. Disclose the policy in the mover terms.
4. **Connect is not needed** for the core model. Revisit only if the platform ever pays movers (for example referral rebates) or takes consumer deposits on movers' behalf, which is also a broker-risk red flag (§2).
5. Fee planning: on a $40 lead, card costs about $1.46 (3.65%). An ACH $500 wallet top-up costs $4.00 (0.8%), or $5 capped at $625 and above. Wallet top-ups by ACH are much cheaper.
6. Turn on Stripe Tax only after the accountant decides on taxability and registration (nexus).

### Questions for accountant / counsel
- Is selling consumer moving leads taxable in WA (advertising services under ESSB 5814), TX (data processing or information services), and other states that tax digital or information services? Which Stripe product tax code applies?
- Where does the platform have economic nexus, given that movers buy from many states? Which state's rules apply: the buyer's location, or the location of the lead's consumer?
- Prepaid wallet balances: revenue recognition (deferred revenue), escheat/unclaimed-property treatment of unused balances, and whether a refund policy is required.
- Is a prepaid, platform-only stored balance outside money-transmitter licensing? (It is generally a closed-loop prepaid service, but **counsel should confirm**.)

---

## 8. Core Web Vitals (current)

### Verified facts
- **INP replaced FID as a Core Web Vital on 2024-03-12.** Chrome tooling support for FID ended on 2024-09-09. Sources: https://web.dev/blog/inp-cwv-march-12; https://web.dev/blog/inp-cwv-launch; https://web.dev/blog/fid; https://developers.google.com/search/blog/2023/05/introducing-inp (accessed 2026-10-27).
- **Thresholds ("good" / "poor"),** measured at the **75th percentile** of page loads, split by mobile and desktop:

  | Metric | Good | Poor |
  |---|---|---|
  | LCP | ≤ 2.5 s | > 4.0 s |
  | INP | ≤ 200 ms | > 500 ms |
  | CLS | ≤ 0.1 | > 0.25 |

  Sources: https://web.dev/articles/vitals; https://web.dev/articles/defining-core-web-vitals-thresholds (accessed 2026-10-27).

### Implications for American Moving Choice design
- The quote form is the conversion-critical, interaction-heavy surface. Keep the INP budget under 200 ms: avoid heavy synchronous validation, and lazy-load third-party scripts (consent certificate scripts, chat, analytics) after the first interaction where compliance allows. Note that **TrustedForm-style scripts must load before the consumer sees the consent language**, so test their INP and LCP cost.
- Reserve space for the mover-list and consent blocks to avoid CLS when matched movers load.
- Measure with field data (CrUX / web-vitals library), not only lab data.

---

## Consolidated open items (UNVERIFIED or needing confirmation)
1. Whether FMCSA published an NPRM on MC/docket elimination or mandatory Motus between 2026-09-24 and 2026-10-27. Check federalregister.gov for FMCSA "registration system" rulemakings.
2. The exact QCMobile response field names and meanings, including cargo insurance fields, and any rate limits.
3. Whether Motus exposes a public API and whether SAFER/L&I output changes.
4. The FR citation and effective date for the FCC's Sept 2026 revocation-of-consent R&O, and the 90 FR 42137 citation for the one-to-one removal.
5. Statute texts for OK, MD and TX (SB 140) mini-TCPAs; the full state list.
6. Exact Stripe fees for T+2 ACH and Financial Connections; the lead-gen product tax code.
7. Texas final data-processing rule wording on lead generation; WA DOR treatment of pay-per-lead.
8. llms.txt consumption by any non-Google AI vendor.
9. 49 CFR 375.207(c) text; NY intrastate HHG certificate number format.
