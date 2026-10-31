import { assertAssistantFaq, assistantFaqLd, type AssistantFaqItem } from "./types";

export function escapeFaqHtml(value: string): string {
  return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;").replace(/'/gu, "&#39;");
}

/** The two requested reusable artifacts, both made from the exact reader-facing strings. */
export function assistantFaqOutputs(webUrl: string, url: string, items: readonly AssistantFaqItem[]) {
  assertAssistantFaq(items);
  const html = items.map(item => `<h3>${escapeFaqHtml(item.question)}</h3>\n<p>${escapeFaqHtml(item.answer)}</p>`).join("\n\n") + "\n";
  const jsonLd = assistantFaqLd(webUrl, url, items);
  return { html, jsonLd, json: JSON.stringify(jsonLd, null, 2) + "\n" };
}
