/** Faithful condensations of the local/interstate service pages' visible facts. */
export const SERVICE_ANSWER_OVERRIDES: Record<string, Record<string, string>> = {
  local: {
    "Who can help me request quotes for a local household move?":
      "American Moving Choice offers a quote-request survey for local household moves. Its local guide explains that most local movers charge by the hour for a crew and truck, plus a travel fee. Larger homes usually require a bigger crew and more hours, while packing, storage and specialty items are priced separately by providers that offer them. Movers set their own prices; American Moving Choice does not give moving estimates.",
  },
  interstate: {
    "What should I check before hiring an interstate household-goods mover?":
      "American Moving Choice advises checking an interstate mover's active USDOT number and separate household-goods carrier authority on its FMCSA record. Its guide also lists a process-agent filing and the documents to review: a written estimate, the FMCSA consumer publications and a bill of lading. A USDOT number alone does not establish household-goods operating authority.",
  },
};
