# Movers-Only Verification, Preferred Mover Program, Profiles and Reviews

**Status:** Proposed operating rules for owner and counsel review. Facts about FMCSA, the FTC and Google are sourced in `docs/research/compliance-and-platform-facts.md`; statements below that depend on them link back to that file.
**Last updated:** 2026-10-27

---

## 1. Eligibility policy (platform rule, not a statement of law)

American Moving Choice works only with **moving carriers**: companies that physically perform and are responsible for the move. To join, a company must:

1. Provide its **USDOT number** and **MC number**. This is *our* network requirement, not a universal legal requirement for every moving business. Many intrastate-only local movers legitimately hold no MC number, and FMCSA has announced plans to stop assigning MC numbers to new carriers in the future. The requirement is therefore an admin setting (`require_mc_number`, default **on**) rather than hard-coded. See §9, decision 1.
2. Hold **active household-goods (HHG) carrier operating authority** appropriate to the services offered (interstate moves require federal HHG carrier authority), plus the applicable **state** credentials for intrastate work (examples: CA Cal-T from the Bureau of Household Goods and Services, TX TxDMV number, FL FDACS registration, NYSDOT authority).
3. Have **no broker authority**. Dual carrier/broker registrations are **excluded** under our strict policy, even when the carrier authority is active.
4. Carry the required insurance (federal filings for interstate authority, plus a certificate of insurance for general liability/cargo as our policy requires).
5. Agree to the mover terms: no reselling of leads, no brokering or handing a customer's move to another business, and accurate identification of the carrier that will transport the customer's goods.

**(Enforced in SQL):** an unapproved company, a company with broker authority, a company missing USDOT (or MC while required), or a company with expired credentials cannot reserve or buy a lead and never receives contact details (`company_can_purchase`, tests *brokers, unapproved and expired-credential companies cannot purchase* and *the MC-number requirement is a platform setting*).

## 2. Application data

Legal business name and DBAs; business address (physical, not a PO box); authorized representative (name, title, email, mobile) and their authority to bind the company; USDOT number; MC/docket number(s); services and move types; service areas; state credentials by state; insurance certificate(s) with expiry dates; logo and description; team owner account.

## 3. Verification workflow

```
Application ──► Verification (automated + document checks) ──► Admin Review ──► Approved
                                                                     └────────► Rejected (reason; may reapply after fixing)
Approved ──► Suspended (credential failure, broker activity, fraud, non-payment) ──► Reinstated after re-verification
```

**Automated checks** (FMCSA QCMobile API with a WebKey, plus FMCSA open-data snapshots; see compliance facts §1):

| Check | Pass condition | Failure handling |
|---|---|---|
| USDOT record exists and is active | Status active, not out-of-service | Block |
| Identity match | Legal name/DBA and physical address match the application (normalized, with fuzzy match scored and shown to the reviewer) | Reviewer decides; mismatches are highlighted |
| Authority type | Active **carrier** authority with HHG scope where interstate services are claimed; **no** broker authority on any linked docket | Broker or dual registration means reject |
| Authority status | Granted and active (not pending, revoked or inactive) | Block |
| Insurance filings | Required filings on file and active | Block until resolved |
| Recent record changes | Flag recent contact/address/officer changes on the FMCSA record (a common identity-hijack pattern) | Extra review |
| Callback verification | Reviewer confirms the application by calling the phone number on the **official** record, not the one supplied | Required before approval |
| State credentials | Number verified against the state lookup, with a screenshot/PDF stored as evidence (manual at launch) | Block for intrastate services in that state |
| Insurance certificate | Certificate parsed, named insured matches, expiry captured | Block |

**Evidence record** for every check: source (API/endpoint/page URL), retrieved payload snapshot and hash, retrieval timestamp, automated result, reviewer, reviewer decision and note. Evidence is append-only.

**Recheck schedule:**
- Automated FMCSA status/authority/insurance recheck: **weekly** for all approved companies (daily diff against open-data files when available).
- Expiry alerts for insurance and state credentials at **30 / 14 / 7 / 0 days**.
- Full re-verification **annually**, and immediately on triggers: consumer report of broker activity, credential complaint, ownership change, chargeback pattern.
- On any failure that can't be confirmed: **automatically suspend new lead purchases and Preferred status** and notify the company owner. Purchased leads, CRM history, invoices and support access stay available. Profile pages show the current status honestly ("Verification under review"), or are removed from the directory per policy.

## 4. Preferred Mover program

**Public definition (draft):**
> "Preferred Mover — American Moving Choice" means the company has joined our network of moving carriers and passed our published screening standards on the date shown: active USDOT registration and household-goods carrier authority, no broker authority, required insurance on file, and agreement to our movers-only terms. It is not a government endorsement, a guarantee of performance, or a statement about customer satisfaction. Customer reviews are shown separately.

- Every newly approved company gets: a public profile, a listing in the Preferred Movers directory, placement on service-area pages where it genuinely serves the area (coverage rules plus verified capabilities), the badge, and profile management in the portal.
- Preferred status is **conditional**. It is removed automatically with suspension.
- Every badge has an adjacent "What this means" explainer and shows **verified on {date}** with links to the official FMCSA records.
- **Paid placement** (if ever offered) is labelled "Sponsored", is visually distinct, and cannot change verification results, rating calculations or review visibility.

## 5. Company profiles

Content: company name, logo, original description (company-written, moderated); services and actual coverage areas; USDOT and MC numbers; verification status and last-checked date; links to the official FMCSA company snapshot and licensing records; verified credentials and insurance-check information (what was checked and when, without exposing documents); genuine reviews with company responses; photos/videos the company confirms it is authorized to publish; a quote button that opens the standard survey pre-scoped to this company's service area.

**Honest empty states:** "New to our network" (approved within the last 90 days, configurable) and "No customer reviews yet". **Never** shown without evidence: ratings, review counts, years in business, number of moves, awards, or "top-rated".

**Profile quote requests** go through the same survey, consent, sharing limit, matching and purchase rules as every other lead. A consumer who starts from a profile sees that company named first in the consent list, but the company still buys the lead under the normal rules. The consumer's sharing limit is honored, and choosing 1 means only one company can buy.

## 6. Reviews

### Evidence labels

| Label | Evidence required | What it can rate |
|---|---|---|
| **Verified platform inquiry** | The reviewer is the consumer on a request that this company bought through American Moving Choice (purchase + disclosure records). | The **quoting/sales experience** only |
| **Verified customer** | Platform inquiry **plus** documentary evidence of a business relationship: a written estimate, order for service or deposit receipt from this company, uploaded by the reviewer and checked by moderation. | Quoting experience, and booking experience |
| **Verified completed move** | Verified customer **plus** evidence of completion (bill of lading, final invoice or delivery receipt) checked by moderation. A company marking a CRM lead "Completed" is **not** sufficient on its own. | The **moving experience** |
| *(no label)* | Not accepted for publication at launch. | — |

A purchased lead alone never proves a completed move. Quote-experience and move-experience ratings are **shown separately** and never blended.

### Collection
- **American Moving Choice sends the invitations**, not the company, so companies can't choose only happy customers. Every consumer whose request was purchased gets a quote-experience invitation after a set delay (e.g. 7 days), subject to their contact preferences.
- Companies can request move-experience reviews for customers they mark Booked/Completed. These invitations are also sent by the platform, every request is logged, and selective-invitation patterns (e.g. inviting only a small share of booked customers) are monitored and can trigger audit.
- Secure single-use review links; reviewer contact details are never shown publicly or to the company beyond what it already purchased.
- **No incentives conditioned on sentiment.** If any incentive is ever offered (e.g. a prize draw for all reviewers), it is disclosed on every review it applies to and offered regardless of rating.

### Moderation and integrity
- Published content guidelines. Reviews are rejected only for policy reasons (e.g. no evidence, unrelated, abusive, private data, conflict of interest), never for being negative.
- Companies **cannot edit or delete** reviews. They can respond publicly (owner/manager roles) and report a review with a reason. Reports go to admin moderation with an appeal path for both sides.
- Every moderation action is audit-logged with reason and moderator.
- Ratings: simple mean per experience type (1–5) with review count, distribution and dates. No hidden weighting. Removed reviews are excluded only under the published policy. A rating is displayed only when at least one eligible review exists; otherwise the profile says "No customer reviews yet".
- Published **Review Methodology** page covering eligibility, verification labels, moderation, calculation and appeals.
- Structured data: review markup only where it reflects visible, genuine third-party reviews and matches Google's current eligibility rules. Stars in search results are never promised.

## 7. Complaints, reports and trust features

- Public "How We Verify Movers" page (§3 in plain language), a "Movers vs Brokers" explainer, and badge explainers next to every badge.
- **Report a problem:** consumers can report suspected broker activity, inaccurate credentials, misconduct or a review issue. Each report creates a case with an SLA, an assignee and an outcome, and can trigger re-verification or suspension.
- Complaint and resolution process published, including how to file complaints with FMCSA (National Consumer Complaint Database) and state agencies.
- Clear statement on every quote flow and confirmation page of **which companies may receive the request** and how many.
- Customer stories are published only with written permission and real attribution. Generated images are never presented as real customers, staff or moves.
- Accessible support contact (email, phone, web form) on every page footer.

## 8. Acceptance tests (from the addendum)

| Requirement | Status |
|---|---|
| Brokers and unapproved companies cannot purchase leads or receive contact details | **Automated test passing** (`db/test/purchase.test.ts`) |
| Submitted numbers match the approved company and required carrier authority | To build (Phase 6: verification service with recorded FMCSA fixtures) |
| Credential failures suspend new purchases and Preferred status | Purchase block **tested** (expired credentials); automatic suspension job to build (Phase 6) |
| Newly approved companies receive accurate public listings | To build (Phase 6/7) |
| Companies without reviews display no fabricated rating | To build (Phase 6/7; component test plus profile-rendering test) |
| Companies cannot alter reviews or suppress valid criticism | To build (Phase 6; permission tests) |
| Review badges reflect the actual evidence collected | To build (Phase 6) |
| Profile quote requests follow the consumer's sharing limit and purchase rules | Core rules **tested**; profile entry point to build (Phase 4/7) |

## 9. Decisions for the owner

1. **MC requirement vs local movers.** Keep "USDOT + MC required" (excludes intrastate-only local movers and may exclude future new carriers once FMCSA stops issuing MC numbers), or allow a state-licensed local-mover track with USDOT + state credentials? Recommendation: launch with the requirement on (your policy), keep the setting, and revisit before FMCSA's MC change takes effect.
2. Local moves at launch: served only by interstate carriers that also do local work, or not offered in markets without enough of them?
3. Insurance minimums beyond federal filings (e.g. general liability/cargo amounts on the certificate).
4. "New to our network" duration (proposed 90 days).
5. Whether paid placement will exist at all (recommendation: not at launch).
