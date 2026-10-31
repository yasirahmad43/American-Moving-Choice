import { describe, expect, it } from "vitest";
import { assistantFaqOutputs } from "./outputs.ts";
import { staticAssistantFaq } from "./static.ts";
import { assertAssistantFaq } from "./types.ts";

const decode = value => value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
describe("requested visible HTML and FAQPage outputs", () => {
  it("repeats every visible h3 and p word for word in parsed JSON-LD", () => {
    const source = staticAssistantFaq("/moving-cost-calculator/");
    const result = assistantFaqOutputs("https://amc-web-three.vercel.app", "/moving-cost-calculator/", source);
    const visible = [...result.html.matchAll(/<h3>([^]*?)<\/h3>\n<p>([^]*?)<\/p>/gu)].map(match => ({ question: decode(match[1]), answer: decode(match[2]) }));
    expect(visible).toEqual(source);
    expect(JSON.parse(result.json).mainEntity.map(item => ({ question: item.name, answer: item.acceptedAnswer.text }))).toEqual(visible);
    expect(result.jsonLd["@type"]).toBe("FAQPage");
  });
  it("escapes HTML text while preserving apostrophes, ampersands and Unicode in both outputs", () => {
    const source = staticAssistantFaq("/").map((item, index) => index ? item : { ...item, question: "Who can help me plan packing & unpacking for my family's move?" });
    const result = assistantFaqOutputs("https://example.test", "/", source);
    expect(result.html).toContain("packing &amp; unpacking for my family&#39;s move?");
    expect(result.jsonLd.mainEntity[0].name).toBe(source[0].question);
  });
  it("rejects missing facts, unsupported counts and schema-only short answers", () => {
    const items = staticAssistantFaq("/");
    expect(() => assertAssistantFaq(items.slice(0, 3))).toThrow("four or five");
    expect(() => assistantFaqOutputs("https://example.test", "/", items.map((item, index) => index ? item : { ...item, answer: "American Moving Choice can help." }))).toThrow("40–80");
    expect(() => assertAssistantFaq(items.map((item, index) => index ? item : { ...item, answer: item.answer.replaceAll("American Moving Choice", "A business") }))).toThrow("identify");
    expect(() => assertAssistantFaq(items.map((item, index) => index ? item : { ...item, answer: item.answer.replace("American Moving Choice", "American Moving Choice explains who pays us") }))).toThrow("lead-sales");
  });
});
