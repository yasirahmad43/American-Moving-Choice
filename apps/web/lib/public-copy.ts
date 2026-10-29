/** Current owner-selected consumer copy. Historical stored texts and consent records stay intact. */
export const PUBLIC_ROLE_STATEMENT = "American Moving Choice connects people planning a move with independent moving companies. We don't transport belongings, give moving estimates, or book your move. You choose the maximum number of companies who may contact you. Follow-up about your request is by calls and email. Companies introduce themselves when they contact you.";
export const PUBLIC_REQUEST_ASSURANCE = "Free to request. You choose how many companies may contact you about your move.";

/** Current consumer presentation. Historical permission records are not processed here. */
export function publicMarketingText(value: string): string {
  const updated = value
    .replace(/You choose the maximum number of movers who may contact you and the contact channels they may use\./gi, "You choose the maximum number of movers who may contact you. Follow-up about your request is by calls and email.")
    .replace(/You choose how many (?:participating )?companies may contact you and the channels they may use\./gi, "You choose how many companies may contact you. Follow-up about your request is by calls and email.")
    .replace(/,\s*and (?:those )?movers pay us for (?:the )?(?:move )?requests(?: they (?:choose to )?buy)?\./gi, ".")
    .replace(/(?:and )?movers pay us for requests\.[ \t]*/gi, "")
    .replace(/Movers(?: in our network)? pay (?:us|American Moving Choice) for (?:the )?(?:move )?requests they (?:choose to )?buy[.;]?[ \t]*/gi, "")
    .replace(/Participating moving companies pay us for requests\.[ \t]*/gi, "")
    .replace(/Eligible movers pay American Moving Choice for the requests they buy\.[ \t]*/gi, "")
    .replace(/American Moving Choice is paid by movers in our network for the move requests they buy, not by you;?/gi, "American Moving Choice is free for consumers.")
    .replace(/Our income comes from movers, who pay us for the requests they buy(?:\s*\([^.!?]*\))?\.[ \t]*/gi, "")
    .replace(/What movers spend with us never goes into the cost model\./gi, "The cost model uses eligible rate cards and the published moving inputs.")
    .replace(/A mover's payment buys it move requests, nothing more\.[ \t]*/gi, "")
    .replace(/You pay us nothing\./gi, "Requesting quotes is free.")
    .replace(/A mover's spending doesn't change our screening standards or your chosen contact limit\.[ \t]*/gi, "")
    .replace(/Movers that buy your request contact you directly\./gi, "Eligible movers contact you directly within your chosen limit and contact channels.")
    .replace(/Only eligible movers recorded for your request that complete a purchase,/gi, "Only eligible movers recorded for your request,")
    .replace(/Only eligible (movers|companies) recorded for your request may (?:purchase|buy) it/gi, "Only eligible $1 recorded for your request may receive your details")
    .replace(/cannot buy requests here/gi, "cannot receive requests here")
    .replace(/We never resell your request beyond that limit, and every mover in our network agrees not to resell it\./gi, "We do not share your request beyond that limit, and each mover agrees to keep it within its own company.")
    .replace(/agree not to resell your request or hand your move to another company/gi, "agree to keep your request within their own company and not hand your move to another company")
    .replace(/,? and (?:their spending|payment) (?:doesn't change|never changes) (?:our|their) screening(?: standards)?(?:, ratings or order| or your contact limit)\./gi, ".")
    .replace(/\[How AMC makes money\](?:\([^)]*\))?(?:\s+(?:explains (?:how that works|that relationship|the relationship|who pays us and what payment never changes|what their payment never changes|how we['’]re paid|our financial relationship with companies|our paid relationship with movers)|has the details|has the full statement))?[.;]?(?:,\s+and\s+)?/gi, "");
  // An unchanged price, token, source or prose string retains every byte, including whitespace.
  return updated === value ? value : updated.replace(/,\s*\./g, ".").replace(/:\s*,/g, ":").replace(/,\s*$/g, ".").trim();
}

/** Operates only on affected prose nodes in our already-sanitized Markdown HTML. In particular,
 * pre/code contents and every unaffected HTML fragment retain their exact original bytes.
 */
export function publicMarketingHtml(html: string): string {
  const protectedNodes: string[] = [];
  const protectedHtml = html.replace(/<(pre|code|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (node) => `\u0000AMC_LITERAL_${protectedNodes.push(node) - 1}\u0000`);
  const moneyLink = /<a\b[^>]*href=["'](?:https?:\/\/[^/"']+)?\/(?:advertising-disclosure|how-we-make-money)\/["'][^>]*>[\s\S]*?<\/a>(?:\s+(?:explains (?:how that works|that relationship|the relationship|who pays us and what payment never changes|what their payment never changes|how we['’]re paid|our financial relationship with companies|our paid relationship with movers)|has the details|has the full statement))?[.;]?(?:,\s+and\s+)?/gi;
  const changed = protectedHtml.replace(/(<(p|li|span)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (original, open: string, _tag: string, inner: string, close: string) => {
    let body = inner.replace(moneyLink, "");
    body = publicMarketingText(body);
    if (body === inner) return original;
    const text = body.replace(/<[^>]+>/g, "").trim();
    if (!text || /^:\s*who pays us,?\s*and what payment never changes\.?$/i.test(text)) return "";
    body = body.replace(/^[\s,;:]*and\s+(?=<a\b)/i, "");
    return `${open}${body}${close}`;
  });
  return changed.replace(/\u0000AMC_LITERAL_(\d+)\u0000/g, (_marker, index: string) => protectedNodes[Number(index)]!);
}
