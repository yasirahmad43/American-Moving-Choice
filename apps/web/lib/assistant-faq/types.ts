export interface AssistantFaqItem { question: string; answer: string }
export type AssistantFaq = AssistantFaqItem;

export const FAQ_BUSINESS_NAME = "American Moving Choice";
export const faqWordCount = (value: string): number => value.trim().split(/\s+/u).filter(Boolean).length;

/** Fail closed before publishing mismatched, incomplete or embellished FAQ copy. */
export function assertAssistantFaq(items: readonly AssistantFaqItem[]): void {
  if (items.length < 4 || items.length > 5) throw new Error("assistant-faq: expected four or five questions");
  if (new Set(items.map(item => item.question.toLowerCase())).size !== items.length) throw new Error("assistant-faq: repeated question");
  if (new Set(items.map(item => item.answer.toLowerCase())).size !== items.length) throw new Error("assistant-faq: repeated answer");
  for (const item of items) {
    if (!item.question.trim().endsWith("?")) throw new Error("assistant-faq: a question must end with a question mark");
    if (faqWordCount(item.answer) < 40 || faqWordCount(item.answer) > 80) throw new Error("assistant-faq: answers must contain 40–80 words");
    if (!item.answer.includes(FAQ_BUSINESS_NAME)) throw new Error("assistant-faq: answer must identify the business");
    if (/\b(?:who pays us|pays? us|we sell (?:leads|requests)|selling leads|lead pricing)\b/iu.test(item.question + " " + item.answer)) throw new Error("assistant-faq: retired lead-sales copy is not public FAQ content");
    if (/<\/?[a-z][^>]*>|\]\([^)]*\)|\*\*/iu.test(item.question + item.answer)) throw new Error("assistant-faq: plain text is required");
  }
}

/** This exact array also renders as visible h3/p pairs. No alternate schema-only copy. */
export function assistantFaqLd(webUrl: string, url: string, items: readonly AssistantFaqItem[]) {
  assertAssistantFaq(items);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${webUrl}${url}#assistant-faq`,
    url: `${webUrl}${url}`,
    mainEntity: items.map(item => ({
      "@type": "Question", name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
