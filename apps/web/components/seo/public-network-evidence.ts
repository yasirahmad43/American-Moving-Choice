import type {ContentBlock, ContentSection, SeoPageRecord} from "@amc/server/seo";

// The public site does not publish participating-company availability or internal matching
// counts. Archived records cannot establish that a real company serves a particular move.
const NETWORK = /\b(?:our|the) network\b|\bnetwork (?:movers?|carriers?)\b|\bcoverage rules?\b|\bcounty-based coverage\b|\b(?:county|ZIP|statewide|nationwide) (?:coverage )?rules?\b|\b(?:local|interstate|total) (?:coverage|match(?:ing)?) counts?\b|\bcoverage counts?\b|\b(?:eligible|matched|matching) movers?\b|\b(?:total|named) matches\b|\b(?:movers?|moving companies)(?:\s+that)?\s+(?:cover|covering|serve|serving|name|naming|list|listing)\b|\b(?:network\s+)?movers?\s+can receive\b|\b(?:none|no mover)\s+(?:names?|lists?|covers?|serves?)\b|\b(?:check|checks|checked)[^.]{0,65}\beligibility\b|\b(?:check|checks|show|shows) coverage\b|\b(?:check|checks|show|shows|see)[^.]{0,40}(?:eligible count|coverage count|count for (?:your|the) exact route)\b|\bexact route eligibility\b|\bsurvey[^.]{0,90}(?:eligible count|matching|matches|total count)\b|company_coverages|\b(?:screened|vetted|verified) (?:movers|moving companies|carriers|network)\b|\b(?:all|every) (?:participating|listed|network) movers?\b/iu;
const COUNT_COLUMN = /movers? (?:naming|listing|covering|serving)|rules? naming|(?:local )?rule counts?|(?:named|total) matches|^eligible movers?$|^matched movers?$|^coverage counts?$/iu;
const CENSUS_COLUMN = /population|housing|ZIP|county|counties|land|area|density|centroid|latitude|longitude|income|rent/iu;
const SENTENCES = new Intl.Segmenter("en",{granularity:"sentence"});
const REQUEST = "Describe your move and choose the maximum number of companies you want to hear from. Companies identify themselves when they contact you about your move.";

function clean(text:string):string {
  // This is a site distance convention, not a claim that any company serves the move.
  const input=text.replace(/\(the network's local radius setting\)/giu,"(this site's local radius setting)");
  return [...SENTENCES.segment(input)].flatMap(({segment})=>{
    if(!NETWORK.test(segment))return [segment];
    const clauses=segment.split(/;\s*/u).filter(clause=>!NETWORK.test(clause)).map(clause=>clause.trim().replace(/[;,]+$/u,""));
    const kept=clauses.join("; ");
    return kept?[`${kept}${/[.!?]$/u.test(kept)?"":"."} `]:[];
  }).join("").trim();
}
/** Titles in navigation and catalogs receive the same truthful wording as full pages. */
export function publicNetworkSummary<T extends {title:string;h1:string}>(entry:T):T {
  const normalize=(value:string)=>{
    const withoutLegacySuffix=value.replace(/: compare screened moving companies$/iu,"");
    const colon=withoutLegacySuffix.indexOf(": ");
    if(colon>=0 && NETWORK.test(withoutLegacySuffix.slice(colon+2)))return clean(withoutLegacySuffix.slice(0,colon));
    return clean(withoutLegacySuffix);
  };
  const h1=normalize(entry.h1)||"Moving guidance";
  return {...entry,h1,title:normalize(entry.title)||h1};
}
function blockProjection(block:ContentBlock,section:ContentSection):ContentBlock[] {
  if(block.type==="movers")return [];
  if(block.type==="paragraph"||block.type==="note") {const text=clean(block.text);return text?[{...block,text}]:[];}
  if(block.type==="list") {const items=block.items.map(clean).filter(Boolean);return items.length?[{...block,items}]:[];}
  if(block.type==="facts") {const items=block.items.filter(item=>!NETWORK.test(`${item.claim} ${item.source.label} ${item.source.url}`));return items.length?[{...block,items}]:[];}
  if(block.type==="table") {
    const hasCoverageCount=block.columns.some(column=>/^coverage$/iu.test(column)) && block.columns.some(column=>/^count$/iu.test(column));
    const removed=new Set(block.columns.map((column,index)=>({column,index})).filter(({column,index})=>COUNT_COLUMN.test(column)||(hasCoverageCount&&/^count$/iu.test(column))||(/^movers?$/iu.test(column)&&block.rows.every(row=>/^\d[\d,]*$/u.test(row[index]??"")))).map(({index})=>index));
    const indexes=block.columns.map((column,index)=>({column,index})).filter(({index})=>!removed.has(index));
    if(!indexes.length || ((hasCoverageCount||NETWORK.test(section.heading)||removed.size>0) && !indexes.some(({column})=>CENSUS_COLUMN.test(column))))return [];
    const rows=block.rows.map(row=>row.filter((_,index)=>!removed.has(index))).filter(row=>!row.some(cell=>NETWORK.test(cell)));
    if(!rows.length)return [];
    return [{...block,columns:indexes.map(({column})=>column),rows,...(block.caption?{caption:clean(block.caption)||undefined}:{})}];
  }
  return [block];
}

/** Pure projection: retain geographic and legal facts, without advertising internal availability. */
export function suppressUnverifiedNetworkEvidence(page:SeoPageRecord):SeoPageRecord {
  const summary=publicNetworkSummary(page);
  const h1=summary.h1;
  const sections=page.content.sections.flatMap(section=>{
    const blocks=section.blocks.flatMap(block=>blockProjection(block,section));
    if(!blocks.length)return [];
    return [{...section,heading:clean(section.heading)||"Plan your move",blocks}];
  });
  const meta=clean(page.metaDescription);
  return {...page,h1,title:summary.title,metaDescription:meta||`${h1}. Explore moving guidance and request written estimates for your move.`,
    content:{...page.content,
      intro:{...page.content.intro,answer:clean(page.content.intro.answer)||REQUEST,...(Array.isArray(page.content.intro.dataPoints)?{dataPoints:page.content.intro.dataPoints.filter(point=>!NETWORK.test(`${point.label} ${point.value} ${point.basis}`)&&!/^movers?\b/iu.test(point.label))}:{})},
      sections,
      faq:page.content.faq.flatMap(item=>{
        if(NETWORK.test(item.question)||/how many (?:network )?movers|check (?:moving )?coverage/iu.test(item.question))return [];
        const answer=clean(item.answer);return answer?[{...item,answer}]:[];
      }),
      quote:{...page.content.quote,text:clean(page.content.quote.text)||REQUEST},
    },sources:page.sources.filter(source=>!NETWORK.test(`${source.label} ${source.url}`)),
  };
}
