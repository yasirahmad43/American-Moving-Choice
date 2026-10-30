import { describe, expect, it } from "vitest";
import { adaptPilotDrafts, pilotSha256 } from "../src/seo/claude-pilot-adapter";
import { CATALOG } from "../src/seo/catalog";

const existing = CATALOG.find(entry => entry.family === "question")!;
const relatedUrl = `/questions/${existing.slug}/`;
const source = { id: "reviewed-source", label: "FMCSA planning guidance", url: "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist", accessedOn: "2026-10-30" };
const claim = { id: "reviewed-claim", sourceId: source.id, text: "FMCSA recommends comparing estimates and the services provided." };
const manifest = () => ({ version: 1, sources: [{ ...source }], claims: [{ ...claim }], briefs: [{
  id: "pilot-brief", family: "question", slug: "pilot-furniture-preparation-worksheet", primaryKeyword: "pilot furniture preparation worksheet", intent: "commercial", supportingKeywords: ["fixture moving scope"],
  related: [relatedUrl], relatedExistingUrls: [relatedUrl], factTopics: [], sourceIds: [source.id], sourceClaimIds: [claim.id], readiness: "draft_ready",
}] });
const paragraph = Array.from({ length: 215 }, (_, index) => ["Record", "each", "item", "room", "access", "path", "responsibility", "and", "written", "service", "scope", "before", "comparing", "providers"][index % 14]).join(" ");
const draft = () => ({ briefId: "pilot-brief", family: "question", slug: "pilot-furniture-preparation-worksheet", title: "Furniture preparation worksheet before a move", h1: "Prepare a clear furniture moving request", metaDescription: "Record furniture, access and preparation responsibilities so each provider responds to the same written scope.",
  answer: "Prepare your furniture moving request by listing the pieces, recording access at both homes and assigning preparation tasks. Ask each provider to describe the work it includes in writing. Use the same details when comparing responses, and update the list when the inventory changes.",
  sections: [
    { heading: "Build a usable room inventory", blocks: [{ type: "paragraph", text: paragraph }] },
    { heading: "Separate access and preparation decisions", blocks: [{ type: "paragraph", text: paragraph }] },
    { heading: "Compare the same written scope", blocks: [{ type: "paragraph", text: paragraph }, { type: "list", items: ["Confirm which pieces move and which stay.", "Ask who handles disassembly and reassembly."] }] },
  ], faq: [{ question: "What changes the request?", answer: "Update it when items, access or responsibilities change." }], sourceClaimIds: [claim.id],
});

describe("reviewed Claude pilot adapter", () => {
  it("injects exact researcher-owned facts and preserves immutable brief intent", () => {
    const input = manifest(), model = draft();
    const result = adaptPilotDrafts(input, [model]);
    expect(result.held).toEqual([]);
    expect(result.publicationAuthorized).toBe(false);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ primaryKeyword: input.briefs[0]!.primaryKeyword, intent: "commercial", related: [`question:${existing.slug}`], sources: [{ label: source.label, url: source.url, accessedOn: source.accessedOn }] });
    expect(result.entries[0]!.sections.at(-1)).toEqual({ heading: "Sourced reference points", blocks: [{ type: "facts", items: [{ claim: claim.text, source: { label: source.label, url: source.url, accessedOn: source.accessedOn } }] }] });
    expect(result.audit[0]).toMatchObject({ manifestSha256: pilotSha256(input), draftSha256: pilotSha256(model), sourceClaimIds: [claim.id] });
    expect(result.audit[0]!.answerWords).toBeGreaterThanOrEqual(40);
    expect(result.audit[0]!.modelWords).toBeGreaterThanOrEqual(600);
  });

  it("holds missing, source-held and thin drafts instead of claiming they are ready", () => {
    expect(adaptPilotDrafts(manifest(), []).held[0]!.briefId).toBe("pilot-brief");
    const held = manifest(); held.briefs[0]!.readiness = "needs_specific_source";
    expect(adaptPilotDrafts(held, [draft()], { selectedBriefIds: ["pilot-brief"] }).held[0]!.reasons.join(" ")).toContain("held");
    const thin = draft(); thin.sections = thin.sections.map(section => ({ ...section, blocks: [{ type: "paragraph", text: "A short unsourced summary." }] }));
    expect(adaptPilotDrafts(manifest(), [thin]).held[0]!.reasons.join(" ")).toContain("600");
  });

  it("rejects model identity, source and content-block escalation", () => {
    expect(adaptPilotDrafts(manifest(), [{ ...draft(), family: "planning" }]).held[0]!.reasons.join(" ")).toContain("identity");
    expect(adaptPilotDrafts(manifest(), [{ ...draft(), sourceClaimIds: ["invented-claim"] }]).held[0]!.reasons.join(" ")).toContain("unapproved claim");
    expect(adaptPilotDrafts(manifest(), [{ ...draft(), sources: [{ url: "https://unapproved.example" }] }]).entries).toEqual([]);
    const injected = draft(); injected.sections[0]!.blocks = [{ type: "facts", items: [{ claim: "Invented legal rule" }] }] as never;
    expect(adaptPilotDrafts(manifest(), [injected]).entries).toEqual([]);
  });

  it("allows only reviewed consumer paths and rejects unsafe markup and pricing precision", () => {
    for (const invalid of ["<script>steal()</script>", "[Secret portal](/admin/)", "[New reference](https://unapproved.example/)", "A fixed price of $900", "A guaranteed 20% saving"]) {
      const model = draft(); model.sections[0]!.blocks[0] = { type: "paragraph", text: paragraph + " " + invalid };
      expect(adaptPilotDrafts(manifest(), [model]).entries).toEqual([]);
    }
    const allowed = draft(); allowed.sections[0]!.blocks[0] = { type: "paragraph", text: paragraph + ` [Existing guide](${relatedUrl}) [Quote request](/get-quotes/) [Approved source](${source.url})` };
    expect(adaptPilotDrafts(manifest(), [allowed]).entries).toHaveLength(1);
  });

  it("rejects malformed evidence registries and duplicate or unselected responses", () => {
    const unknown = manifest(); unknown.claims[0]!.sourceId = "not-a-source";
    expect(() => adaptPilotDrafts(unknown, [draft()])).toThrow("unknown source");
    const insecure = manifest(); insecure.sources[0] = { ...source, url: "http://example.com/reference" };
    expect(() => adaptPilotDrafts(insecure, [draft()])).toThrow("HTTPS");
    expect(() => adaptPilotDrafts(manifest(), [draft(), draft()])).toThrow("duplicate");
    expect(() => adaptPilotDrafts(manifest(), [{ ...draft(), briefId: "not-selected" }])).toThrow("unselected");
  });

  it("does not allow a new article to take an existing keyword, URL or unreviewed related target", () => {
    const duplicate = manifest(); duplicate.briefs[0]!.primaryKeyword = existing.primaryKeyword; duplicate.briefs[0]!.intent = existing.intent;
    expect(adaptPilotDrafts(duplicate, [draft()]).held[0]!.reasons.join(" ")).toContain("intent");
    const url = manifest(); url.briefs[0]!.slug = existing.slug;
    expect(adaptPilotDrafts(url, [{ ...draft(), slug: existing.slug }]).held[0]!.reasons.join(" ")).toContain("URL already");
    const related = manifest(); related.briefs[0]!.related = ["/questions/not-a-reviewed-page/"];
    expect(adaptPilotDrafts(related, [draft()]).held[0]!.reasons.join(" ")).toContain("related URL");
  });

  it("requires table cells to align with their supplied headings", () => {
    const model = draft(); model.sections[0]!.blocks.push({ type: "table", columns: ["Item", "Responsibility"], rows: [["Sofa", "Confirm preparation"], ["Bed", "Confirm preparation", "Unexpected extra cell"]] } as never);
    expect(adaptPilotDrafts(manifest(), [model]).held[0]!.reasons.join(" ")).toContain("table rows");
  });
});
