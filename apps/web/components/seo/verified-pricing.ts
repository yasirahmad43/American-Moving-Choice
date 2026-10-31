import type { ContentBlock, ContentSection, SeoPageRecord } from "@amc/server/seo";

/** Saved SEO records have no rate approval/demo provenance. Never treat their rows as live prices. */
export const VERIFIED_PRICE_GUIDANCE = "This guide does not publish a verified moving-price range. Ask a moving company for a written estimate based on the belongings you will move, your route, requested services and address access. Compare the work included and any additional charges before agreeing to the move.";
const RATE_EVIDENCE = /\brate[-_\s]?cards?\b|\bcost-model(?:-v1)?\b|\b(?:movers?[’']?|active)\s+cards\b|\bcards (?:cover|covering|as of)\b|\bstates? (?:with|without) (?:a )?(?:range|one)\b/iu;
const TYPICAL_SAMPLE = /\btypical(?:ly)?[^.]{0,120}\b\d[\d,.]*\s*(?:movers?|hours?|hrs?|lb|pounds?)\b|\bmedian (?:crew|hours|shipment weight)\b/iu;
const MONEY_RANGE = /\$\s*\d[\d,.]*\s*(?:to|–|—|-)\s*\$?\s*\d/iu;
const ECONOMIC_CONTEXT = /Census|\bACS\b|\bBLS\b|housing|rent|income|home value|wage|occupation/iu;
const GEOGRAPHIC = new Set(["state", "city", "route", "zip", "cost"]);
const SENTENCES = new Intl.Segmenter("en", { granularity: "sentence" });
const claim = (text: string, geographic: boolean) => RATE_EVIDENCE.test(text) || TYPICAL_SAMPLE.test(text) || (geographic && MONEY_RANGE.test(text));
function cleanText(text: string, movingCostContext: boolean): string {
  return [...SENTENCES.segment(text)].map(part=>part.segment).filter(part=>!claim(part,(movingCostContext || /moving[- ](?:cost|price|rate|range)|(?:local|interstate).{0,30}(?:price|range|rate)/iu.test(part)) && !ECONOMIC_CONTEXT.test(part))).join("").trim();
}
function costContext(page: SeoPageRecord): string {
  const state=/^Moving costs in (.+)$/iu.exec(page.h1)?.[1];
  return state ? `a move in ${state}` : page.slug === "local" ? "a local household move" : "a long-distance household move";
}
export function verifiedCostSections(page: SeoPageRecord): ContentSection[] {
  const context=costContext(page);
  const local=page.slug==="local";
  const state=/^Moving costs in /iu.test(page.h1);
  const drivers=local ? "most local movers charge by the hour for a crew and truck, and may add a travel fee" : state ? "local hourly pricing differs from long-distance pricing based on shipment weight and distance" : "shipment weight, distance and the services requested can change a long-distance moving price";
  return [
    {id:"verified-pricing-policy",heading:"Get a price for your actual move",blocks:[{type:"paragraph",text:`American Moving Choice does not currently publish a verified moving-price range for ${context}. Ask the moving company for a written estimate covering your belongings, route, requested services and address access. Compare what each estimate includes before choosing a company; a generic planning figure does not price your individual move.`}]},
    {id:"verified-pricing-drivers",heading:"What changes the work and the price",blocks:[{type:"paragraph",text:`For ${context}, American Moving Choice explains that ${drivers}. Home size, packing, storage, stairs, elevators and carrying distance can affect the work. Discuss the actual job directly with the moving company so its written estimate covers the services and access involved.`}]},
    {id:"verified-estimate-details",heading:"Prepare the details for an estimate",blocks:[{type:"paragraph",text:`Before requesting a written estimate for ${context}, American Moving Choice recommends identifying the belongings to be moved, pickup and delivery addresses, date, packing or storage needs, and any stairs, elevators or parking limitations. Discuss these details directly with the moving company and confirm which services its estimate covers.`}]},
    {id:"verified-estimate-comparison",heading:"Compare the same work in writing",blocks:[{type:"paragraph",text:`When comparing estimates for ${context}, American Moving Choice recommends checking the listed services, access-related work, packing, storage and any additional charges. Ask each company to explain unclear items in writing. Compare estimates for the same job and retain the written terms so you can review what was actually agreed.`}]},
  ];
}

/** Presentation only: preserve the original database record, Census amounts and legal examples. */
export function suppressUnverifiedSeoPricing(page: SeoPageRecord): SeoPageRecord {
  const hadRateEvidence=RATE_EVIDENCE.test(JSON.stringify(page.content));
  const geographic=GEOGRAPHIC.has(page.family);
  const clean=(text:string)=>cleanText(text,false);
  const costSection=(section:ContentSection)=>/cost|price|range|summary/iu.test(`${section.id} ${section.heading}`);
  const blocks=(section:ContentSection):ContentBlock[]=>section.blocks.flatMap((block):ContentBlock[]=>{
    const priceContext=costSection(section)&&!ECONOMIC_CONTEXT.test(section.heading);
    const cleanBlock=(text:string)=>cleanText(text,priceContext);
    if(block.type==="cost")return [];
    if(block.type==="paragraph"||block.type==="note") {
      const text=cleanBlock(block.text);return text?[{...block,text}]:[];
    }
    if(block.type==="list") {const items=block.items.map(cleanBlock).filter(Boolean);return items.length?[{...block,items}]:[];}
    if(block.type==="facts") {const items=block.items.filter(item=>!claim(item.claim,priceContext&&!ECONOMIC_CONTEXT.test(`${item.claim} ${item.source.label}`)));return items.length?[{...block,items}]:[];}
    if(block.type==="table") {
      const economicTable=ECONOMIC_CONTEXT.test(`${section.heading} ${block.caption??""} ${block.columns.join(" ")}`);
      const moneyRateTable=geographic && !economicTable && (priceContext || block.columns.some(column=>/\b(?:rate|local|interstate)\b/iu.test(column)));
      if(moneyRateTable && block.columns.some(column=>/^(?:date|link|reference|source|read on)$/iu.test(column))) {
        const removed=new Set(block.columns.map((column,index)=>({column,index})).filter(({column})=>/\b(?:rate|price|range|local|interstate)\b/iu.test(column)||RATE_EVIDENCE.test(column)||/^movers?$/iu.test(column)).map(({index})=>index));
        const columns=block.columns.filter((_,index)=>!removed.has(index));
        const rows=block.rows.map(row=>row.filter((_,index)=>!removed.has(index)));
        return columns.length?[{...block,columns,rows}]:[];
      }
      const rows=block.rows.filter(row=>!row.some(cell=>claim(cell,priceContext&&!economicTable)) && !(moneyRateTable && row.some(cell=>/\$\s*\d/u.test(cell))));
      return rows.length?[{...block,rows,...(block.caption?{caption:clean(block.caption)||undefined}:{})}]:[];
    }
    return [block];
  });
  page.h1=page.h1.replace(/: compare screened moving companies$/iu, "");
  page.title=page.title.replace(/: compare screened moving companies$/iu, "");
  const screeningClaim=/(?:movers|moving companies)\s+screened|screened (?:moving companies|movers|network)|verified (?:network|moving companies)/iu;
  page.metaDescription=screeningClaim.test(page.metaDescription)?`${page.h1}. Explore local facts and moving guidance, then request written estimates.`:clean(page.metaDescription)||`${page.h1}. Understand cost factors and request a written estimate for your actual move.`;
  if(screeningClaim.test(page.title))page.title=page.h1;
  page.title=clean(page.title)||page.h1;
  page.content.intro.answer=clean(page.content.intro.answer)||VERIFIED_PRICE_GUIDANCE;
  if(Array.isArray(page.content.intro.dataPoints))page.content.intro.dataPoints=page.content.intro.dataPoints.filter(point=>!claim(`${point.label} ${point.value} ${point.basis}`,/price|cost|range/iu.test(point.label)&&!ECONOMIC_CONTEXT.test(`${point.label} ${point.basis}`)) && !/move types with a range|typical (?:crew|job|hours|weight)/iu.test(point.label));
  page.content.sections=page.content.sections.flatMap(section=>{
    const projected=blocks(section);
    if(!projected.length)return page.family!=="cost" && costSection(section)?[{...section,heading:"Plan the price with a written estimate",blocks:[{type:"paragraph" as const,text:VERIFIED_PRICE_GUIDANCE}]}]:[];
    return [{...section,heading:RATE_EVIDENCE.test(section.heading)||/ranges by|range.*home size|one table:.*ranges/iu.test(section.heading)?"Plan the price with a written estimate":section.heading,blocks:projected}];
  });
  if(geographic && page.family!=="cost") {
    const existing=page.content.sections.find(section=>section.id==="costs");
    if(existing) {
      if(!existing.blocks.some(block=>block.type==="paragraph"&&block.text===VERIFIED_PRICE_GUIDANCE)) existing.blocks.unshift({type:"paragraph",text:VERIFIED_PRICE_GUIDANCE});
    } else page.content.sections.push({id:"costs",heading:"Plan the price with a written estimate",blocks:[{type:"paragraph",text:VERIFIED_PRICE_GUIDANCE}]});
  }
  if(!geographic && hadRateEvidence && !page.content.sections.some(section=>section.id==="verified-pricing-policy"))page.content.sections.push({id:"verified-pricing-policy",heading:"Get a written price for your actual move",blocks:[{type:"paragraph",text:VERIFIED_PRICE_GUIDANCE}]});
  page.content.faq=page.content.faq.flatMap(item=>{
    if(page.family==="cost"||claim(item.question,geographic)||/typical.*job|how many.*cards/iu.test(item.question))return [];
    const answer=clean(item.answer);return answer?[{...item,answer}]:[];
  });
  page.sources=page.sources.filter(source=>!RATE_EVIDENCE.test(`${source.label} ${source.url}`));
  if(page.family==="cost") {
    const sections=verifiedCostSections(page);
    page.content.intro.answer=sections[0]!.blocks[0]!.type==="paragraph"?sections[0]!.blocks[0]!.text:VERIFIED_PRICE_GUIDANCE;
    page.content.sections=[...sections,...page.content.sections.filter(section=>!section.id.startsWith("verified-") && !/^(?:summary|ranges)$/iu.test(section.id))];
  }
  return page;
}
