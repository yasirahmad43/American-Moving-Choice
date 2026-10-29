import { SERVICES, QUESTIONS, PLANNING } from "../../../../packages/server/src/seo/catalog.ts";
import { NATIONAL_FACTS } from "../../../../packages/server/src/seo/facts.ts";
import { publicSeoPage } from "./public-content.ts";

const source = { label: "FMCSA delivery-payment rule", url: "https://www.fmcsa.dot.gov/protect-your-move/how-to/subpartD", accessedOn: "2026-10-28" };
function page(url, text, { family = "question", sectionText = text, faq = [] } = {}) {
  return {
    id: "saved-published-record", url, family, title: "Moving guidance", h1: "Moving guidance", metaDescription: text,
    canonicalUrl: url, indexable: true, publishedAt: new Date("2026-10-27T12:00:00Z"), updatedAt: new Date("2026-10-28T12:00:00Z"),
    sources: [source], content: { schemaType: "Article", intro: { answer: text, dataPoints: [{ label: "ZIP codes", value: "110" }] },
      sections: [{ id: "payment", heading: "Keep these documents", blocks: [{ type: "paragraph", text: sectionText },
        { type: "table", columns: ["Rate", "Date", "Link"], rows: [["$110 per hour", "2026-10-28", "[Read the rule](https://www.fmcsa.dot.gov/protect-your-move/how-to/subpartD)"]] }] }],
      faq, related: [{ heading: "Help", links: [{ href: "/questions/what-is-the-110-percent-rule/", label: "110% rule", relation: "planning" }] }], quote: {}, credits: ["FMCSA"], dataAsOf: "2026-10-28" },
  };
}

function assertPreserved(stored, projected) {
  expect(projected.content.sections[0].id).toBe("payment");
  expect(projected.content.sections[0].blocks[1]).toEqual(stored.content.sections[0].blocks[1]);
  expect(projected.content.intro.dataPoints).toEqual(stored.content.intro.dataPoints);
  expect(projected.sources).toEqual(stored.sources);
  expect(projected.content.related).toEqual(stored.content.related);
  expect(projected.publishedAt).toEqual(stored.publishedAt);
  expect(projected.updatedAt).toEqual(stored.updatedAt);
  expect(projected.content.credits).toEqual(stored.content.credits);
  expect(projected.content.dataAsOf).toBe(stored.content.dataAsOf);
  expect(projected.canonicalUrl).toBe(stored.canonicalUrl);
  expect(projected.indexable).toBe(stored.indexable);
  expect(publicSeoPage(projected)).toEqual(projected);
}

describe("saved moving-rule guidance", () => {
  it("labels the actual 50-mile long-distance opening as this site's convention and preserves the complete remaining guidance", () => {
    const deployedAnswer = "A long-distance move is any move beyond the local radius: either across a state line (interstate) or more than 50 miles within one state. Long-distance movers price by shipment weight and distance rather than by the hour, and interstate moves come with federal protections: a written estimate, a survey of your goods, the 110% rule on non-binding estimates and full value protection by default.";
    const stored = page("/services/long-distance/", deployedAnswer, { family: "service", faq: [{ question: "Is a move of 300 miles within Texas a long-distance move?", answer: "Yes, an in-state long-distance (intrastate) move. It is priced by weight and band like an interstate move, but Texas rules generally govern it when the entire route stays in Texas; a shipment that passes through another state is interstate." }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toBe("On American Moving Choice, a" + deployedAnswer.slice(1));
    expect(projected.content.intro.answer).toContain("more than 50 miles within one state");
    expect(projected.content.intro.answer).toContain("110% rule on non-binding estimates and full value protection by default");
    expect(projected.content.faq).toEqual(stored.content.faq);
    expect(SERVICES.find(entry => entry.slug === "long-distance").answer).toBe(projected.content.intro.answer);
    assertPreserved(stored, projected);
  });

  it("gives the actual deployed estimate-increase answer a qualified opening while retaining every payment condition", () => {
    const deployedAnswer = "On a binding interstate estimate, no: the delivery payment can include the binding amount plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery. On a non-binding estimate the final bill follows the tariff and can be higher, but delivery payment can include up to 110% of the estimate plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery; the remaining estimate-based balance is billed later.";
    const stored = page("/questions/can-a-mover-charge-more-than-the-estimate/", deployedAnswer);
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toBe(deployedAnswer.replace("On a binding interstate estimate, no: the delivery payment can include the binding amount", "Sometimes. For a binding interstate estimate, delivery payment can include the binding amount"));
    expect(projected.content.intro.answer).toMatch(/^Sometimes\. For a binding interstate estimate,/);
    expect(projected.content.intro.answer).toContain("services requested after the bill of lading");
    expect(projected.content.intro.answer.match(/15% of all other charges due at delivery/g)).toHaveLength(2);
    expect(projected.content.intro.answer).toContain("up to 110% of the estimate");
    expect(projected.content.intro.answer).toContain("remaining estimate-based balance is billed later");
    expect(QUESTIONS.find(entry => entry.slug === "can-a-mover-charge-more-than-the-estimate").answer).toBe(projected.content.intro.answer);
    assertPreserved(stored, projected);
  });

  it("repairs the actual live estimate-increase meta description without altering its unrelated body", () => {
    // Fetched from the public page on 2026-10-29; unlike several neighboring descriptions,
    // this published absolute-cap claim is complete and matches the scoped correction.
    const actualDescription = "Binding: no, except services you add. Non-binding: yes, but no more than 110% at delivery; the rest is billed later. What changes the bill.";
    const stored = page("/questions/can-a-mover-charge-more-than-the-estimate/", "Keep this [delivery worksheet](/planning/delivery-day-checklist/) and the $110 receipt.");
    stored.metaDescription = actualDescription;
    const projected = publicSeoPage(stored);
    expect(projected.metaDescription).toBe("When a moving bill can change, and how binding and non-binding delivery payments account for later-requested services and capped impracticable operations.");
    expect(projected.metaDescription.length).toBeLessThanOrEqual(160);
    expect(projected.metaDescription).not.toMatch(/no more than 110%|…$|\.\.\.$/);
    expect(projected.content.intro.answer).toBe(stored.content.intro.answer);
    expect(projected.content.sections[0].blocks[0].text).toBe(stored.content.sections[0].blocks[0].text);
    assertPreserved(stored, projected);
  });

  it("corrects the live local-service jurisdiction contradiction without changing its pricing model or links", () => {
    const answer = "A local move is a short-distance move that starts and ends in the same state. On this site, a move of 50 miles or less between ZIP centroids counts as local (the network's local radius setting). Local moves are regulated by the state, not by FMCSA, and most local movers charge by the hour for a crew and a truck, plus a travel fee.";
    const sectionText = "FMCSA's rules don't reach a move between two points in the same state. Some states license intrastate movers themselves: Texas (TxDMV), California (BHGS, the CAL-T number) and Florida (FDACS, the IM number) are three we have sourced.";
    const stored = page("/services/local/", answer, { family: "service", sectionText });
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toContain("50 miles or less between ZIP centroids");
    expect(projected.content.intro.answer).toContain("passes through another state is interstate");
    expect(projected.content.intro.answer).toContain("Most local movers charge by the hour");
    expect(projected.content.sections[0].blocks[0].text).toContain("can be interstate if the shipment passes through another state");
    expect(projected.content.sections[0].blocks[0].text).toContain("Texas (TxDMV), California (BHGS, the CAL-T number) and Florida (FDACS, the IM number)");
    expect(JSON.stringify(stored)).toBe(before);
    assertPreserved(stored, projected);
  });

  it("repairs the actual binding-estimate short answer and Non-binding paragraph across metadata and body", () => {
    const answer = "A binding estimate is a written interstate moving estimate that guarantees the total cost of the goods and services it lists: at delivery the mover may collect no more than that amount, plus services you asked for afterwards. A non-binding estimate is the mover's reasonably accurate guess; the final bill follows its tariff, but you never pay more than 110% of the estimate at delivery.";
    const sectionText = "A non-binding estimate must be reasonably accurate and built from the estimated weight or volume, the services and the survey. It must say that the final charges come from the mover's tariff and may be higher, and that you won't pay more than 110% of the estimate at delivery. It is free.";
    const stored = page("/questions/what-is-a-binding-estimate/", answer, { sectionText });
    const projected = publicSeoPage(stored);
    for (const text of [projected.metaDescription, projected.content.intro.answer, projected.content.sections[0].blocks[0].text]) {
      expect(text).toContain("services requested after the bill of lading");
      expect(text).toContain("15% of all other charges due at delivery");
      expect(text).not.toMatch(/never pay more than|won't pay more than/);
    }
    expect(projected.content.sections[0].blocks[0].text).toContain("It is free.");
    assertPreserved(stored, projected);
  });

  it("qualifies the actual delivery-day checklist while retaining its inventory and claim instructions", () => {
    const answer = "At delivery, pay what the estimate type requires (the binding amount, or no more than 110% of a non-binding estimate), in a form the estimate says the mover accepts. Check every inventory item off as it comes in, note damage or missing items on the inventory before you sign, and keep the signed copy: it is the basis of any claim under the valuation level you chose.";
    const stored = page("/planning/delivery-day-checklist/", answer, { family: "planning", sectionText: "Non-binding estimate: up to 110% of the estimate; the rest is billed later." });
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toContain("services requested after the bill of lading");
    expect(projected.content.intro.answer).toContain("15% of all other charges due at delivery");
    expect(projected.content.intro.answer).toContain("note damage or missing items on the inventory before you sign");
    expect(projected.content.sections[0].blocks[0].text).toContain("remaining estimate-based balance is billed later");
    assertPreserved(stored, projected);
  });

  it("keeps the 110% worked example's dollar figures and makes its omitted assumptions explicit once", () => {
    const text = "FMCSA's 2004 example: a $1,000 non-binding estimate and $1,500 of actual charges means you pay $1,100 at delivery and the mover bills the remaining $400 later.";
    const stored = page("/questions/what-is-the-110-percent-rule/", text);
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toContain("no services added after the bill of lading and no impracticable-operations charges");
    for (const amount of ["$1,000", "$1,500", "$1,100", "$400"]) expect(projected.content.intro.answer).toContain(amount);
    assertPreserved(stored, projected);
  });

  it("retains the payment exceptions in the release FAQ and the same-state interstate exception", () => {
    const stored = page("/questions/what-if-a-mover-holds-my-belongings-hostage/", "On an interstate move with a non-binding estimate, the mover must release your goods once you pay up to 110% of the estimate at delivery; a mover that refuses after that payment is violating federal rules.", { faq: [{ question: "Does the 110% rule apply to moves within my state?", answer: "No. It is a federal rule for interstate moves. Your state's regulator sets the rules for in-state moves." }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toContain("amount lawfully due");
    expect(projected.content.intro.answer).toContain("15% of all other charges due at delivery");
    expect(projected.content.faq[0].answer).toContain("passes through another state");
    assertPreserved(stored, projected);
  });

  it("repairs the exact city template while preserving its regulator claim, source link and access date", () => {
    const text = "Moves within Texas from Austin are regulated by the state: TxDMV licenses intrastate movers ([TxDMV](https://www.txdmv.gov/motor-carriers), read 2026-10-28). A move that crosses the state line follows FMCSA's rules: [the 110% rule](/questions/what-is-the-110-percent-rule/).";
    const stored = page("/movers/texas/austin/", text, { family: "city" });
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toBe("Moves from Austin whose entire route stays within Texas are generally state-regulated:" + text.slice(text.indexOf(":" ) + 1));
    assertPreserved(stored, projected);
  });

  it("corrects the two shared fact specimens without dropping the route exception or recorded evidence", () => {
    const jurisdiction = "FMCSA's household-goods rules (49 CFR Part 375) cover interstate moves, including a move between two points in one state whose route passes through another state. Moves between two points in the same state are regulated by that state.";
    const payment = "On a non-binding estimate, the mover must release your goods at delivery once you pay up to 110% of the estimate (plus services you asked for after the bill of lading and any impracticable-operations charges). FMCSA guidance says the mover bills any remaining balance no sooner than 30 days after delivery.";
    const stored = page("/routes/austin-tx-to-dallas-tx/", jurisdiction, { family: "route", sectionText: payment });
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toContain("route passes through another state");
    expect(projected.content.intro.answer).toContain("entire route stays within one state");
    expect(projected.content.sections[0].blocks[0].text).toContain("15% of all other charges due at delivery");
    expect(projected.content.sections[0].blocks[0].text).toContain("no sooner than 30 days after delivery");
    assertPreserved(stored, projected);
  });

  it("leaves unrelated numbers, prices, qualified guidance, and other pages' phrases untouched", () => {
    const text = "A 110% increase is not a moving-payment rule. This room costs $110. The route stays in one state. An intrastate mover may use state rules. 2026-10-28. [110% worksheet](/planning/nonbinding-estimate-delivery-payment-checklist/)";
    const stored = page("/questions/packing-a-room/", text);
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toBe(text);
    expect(projected.content.sections[0].blocks[0].text).toBe(text);
    assertPreserved(stored, projected);
    const qualified = page("/planning/nonbinding-estimate-delivery-payment-checklist/", "The familiar 110% rule has these qualifications; separate later requested services and applicable impracticable-operations charges.");
    expect(publicSeoPage(qualified).content.intro.answer).toBe(qualified.content.intro.answer);
  });

  it.each([
    ["/questions/can-a-mover-charge-more-than-the-estimate/", "On a binding interstate estimate, no: the mover may collect only the binding amount plus services you asked for after the bill of lading and any impracticable-operations charges. On a non-binding estimate the final bill follows the tariff and can be higher, but you never pay more than 110% of the estimate at delivery, and the mover bills the remainder later."],
    ["/questions/what-is-a-moving-tariff/", "A non-binding estimate must say that the final charges come from the tariff and may be higher. The tariff is therefore the document that decides the extras and the final bill, within the 110% cap at delivery."],
  ])("qualifies the additional published estimate and tariff explanation at %s", (url, text) => {
    const stored = page(url, text);
    const projected = publicSeoPage(stored);
    expect(projected.content.intro.answer).toMatch(/later-requested services|services requested after the bill of lading/);
    expect(projected.content.intro.answer).toContain("15% of all other charges due at delivery");
    expect(projected.content.intro.answer).not.toMatch(/never pay more than|within the 110% cap/);
    assertPreserved(stored, projected);
  });
});

describe("future authored catalog", () => {
  it("keeps exceptions in the service, question and checklist entries instead of regenerating the verified errors", () => {
    expect(SERVICES.find(entry => entry.slug === "local").answer).toContain("passes through another state is interstate");
    for (const entry of [QUESTIONS.find(entry => entry.slug === "what-is-a-binding-estimate"), PLANNING.find(entry => entry.slug === "delivery-day-checklist")]) {
      expect(entry.answer).toContain("services requested after the bill of lading");
      expect(entry.answer).toContain("15% of all other charges due at delivery");
      expect(entry.answer).not.toMatch(/never pay more than|no more than 110%/);
    }
    expect(QUESTIONS.find(entry => entry.slug === "what-is-the-110-percent-rule").faq[0].answer).toContain("amount lawfully due");
    expect(QUESTIONS.find(entry => entry.slug === "who-regulates-moving-companies").answer).toContain("same-state shipment passing through another state is interstate");
  });

  it("retains the official facts' sources and recorded dates while correcting the precise qualifications", () => {
    const jurisdiction = NATIONAL_FACTS.find(fact => fact.topic === "interstate_scope");
    const payment = NATIONAL_FACTS.find(fact => fact.topic === "rule_110");
    expect(jurisdiction.claim).toContain("entire route stays within one state");
    expect(jurisdiction.sourceUrl).toContain("what-interstate-move");
    expect(payment.claim).toContain("15% of all other charges due at delivery");
    expect(payment.sourceLabel).toContain("375.407");
    expect(payment.accessedOn).toBe("2026-10-28");
    expect(jurisdiction.accessedOn).toBe("2026-10-28");
  });
});
