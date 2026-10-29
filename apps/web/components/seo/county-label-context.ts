import { normalizeLegacyCountyEquivalentLabels, type CountyLabelContext } from "@amc/core";
import type { ContentBlock, SeoPageRecord } from "@amc/server/seo";

const LOUISIANA = { stateCode: "LA" } as const;
type TableBlock = Extract<ContentBlock, { type: "table" }>;

/** A link/State cell describes its particular row; a route's origin state does not. */
function rowState(columns: readonly string[], row: readonly string[]): "LA" | "other" | undefined {
  const stateColumn = columns.findIndex(column => /^(?:state|state code)$/i.test(column.trim()));
  if (stateColumn >= 0 && row[stateColumn]?.trim()) return /^(?:LA|Louisiana)$/i.test(row[stateColumn]!.trim()) ? "LA" : "other";
  const cityColumn = columns.findIndex(column => /^(?:city|place)$/i.test(column.trim()));
  if (cityColumn < 0) return undefined;
  const city = row[cityColumn] ?? "";
  const linkedState = linkState(city);
  if (linkedState) return linkedState;
  // Below-threshold route cities are plain "City, ST" rather than published city links.
  if (/,\s*[^,]+$/.test(city.trim())) return /,\s*(?:LA|Louisiana)$/i.test(city.trim()) ? "LA" : "other";
  return undefined;
}

function linkState(text: string): "LA" | "other" | undefined {
  const states = [...text.matchAll(/\]\(\/movers\/([^/)\s]+)\/[^)\s]*\)/g)].map(match => match[1]);
  if (!states.length) return undefined;
  return states.every(state => state === "louisiana") ? "LA" : "other";
}

function tableLabels(table: TableBlock, fallback?: CountyLabelContext, ownTable?: CountyLabelContext): TableBlock {
  const countyColumn = table.columns.findIndex(column => /^county$/i.test(column.trim()));
  const pageRow = table.rows.find(row => row[0]?.trim() === "Page");
  if (countyColumn < 0 && !pageRow && !ownTable) return table;
  return { ...table, rows: table.rows.map(row => {
    const state = rowState(table.columns, row);
    const context = state === "LA" ? LOUISIANA : state === "other" ? undefined : fallback;
    return row.map((cell, index) => {
      // In end-point Fact/Value tables, the Page link establishes each County cell's state.
      if (row[0]?.trim() === "County" && pageRow && index > 0) return linkState(pageRow[index] ?? "") === "LA" ? normalizeLegacyCountyEquivalentLabels(cell, LOUISIANA) : cell;
      if (index === countyColumn && context) return normalizeLegacyCountyEquivalentLabels(cell, context);
      // Housing fact labels and the ZIP glance are wholly about the verified own location.
      return ownTable && state !== "other" ? normalizeLegacyCountyEquivalentLabels(cell, ownTable) : cell;
    });
  }) };
}

/** The second, structured pass runs only after identities are redacted and global unambiguous
 * labels are repaired. Never apply the state of a mixed-state page to every string on it. */
export function repairCountyLabelContexts(page: SeoPageRecord): SeoPageRecord {
  const ownLouisiana = page.stateCode === "LA" && ["city", "state", "zip"].includes(page.family);
  const primaryLabel = page.content.intro.dataPoints?.find(point => point.label === "County")?.value;
  const ownContext: CountyLabelContext | undefined = ownLouisiana && primaryLabel ? { stateCode: "LA", legacyLabel: primaryLabel } : undefined;
  const introContext = ownLouisiana && page.family === "state" ? LOUISIANA : ownContext;
  const repair = (text: string, context?: CountyLabelContext) => context ? normalizeLegacyCountyEquivalentLabels(text, context) : text;
  return { ...page,
    metaDescription: repair(page.metaDescription, introContext),
    content: { ...page.content,
      intro: { ...page.content.intro,
        answer: repair(page.content.intro.answer, introContext),
        ...(page.content.intro.dataPoints ? { dataPoints: page.content.intro.dataPoints.map(point => /^(?:County|Time zone)$/.test(point.label) ? { ...point, value: repair(point.value, ownContext), basis: repair(point.basis, ownContext) } : point) } : {}),
      },
      sections: page.content.sections.map(section => {
        const ownCitySection = ownLouisiana && page.family === "city" && ["county", "zips", "movers", "housing", "nearby-zips"].includes(section.id);
        const stateCounties = ownLouisiana && page.family === "state" && section.id === "counties";
        const zipGlance = ownLouisiana && page.family === "zip" && section.id === "glance";
        const zipMovers = ownLouisiana && page.family === "zip" && section.id === "movers";
        const narrative = stateCounties ? LOUISIANA : ownCitySection || zipMovers ? ownContext : undefined;
        const ownCountyTable = ownLouisiana && ((page.family === "state" && ["counties", "cities"].includes(section.id)) || (page.family === "city" && section.id === "nearby-zips"));
        const factTableContext = zipGlance ? LOUISIANA : ownCitySection && section.id === "housing" ? ownContext : undefined;
        return { ...section, heading: repair(section.heading, narrative), blocks: section.blocks.map(block => {
          if (block.type === "table") return tableLabels(block, ownCountyTable ? LOUISIANA : undefined, factTableContext);
          if ((block.type === "paragraph" || block.type === "note") && narrative) return { ...block, text: repair(block.text, narrative) };
          return block;
        }) };
      }),
      faq: page.content.faq.map(item => {
        const ownCityQuestion = ownLouisiana && page.family === "city" && /^How many movers cover local moves in /.test(item.question);
        const ownStateQuestion = ownLouisiana && page.family === "state" && /^How many ZIP codes and counties does Louisiana have\?$/.test(item.question);
        const ownZipQuestion = ownLouisiana && page.family === "zip" && /^(?:Is ZIP |How many movers cover ZIP )/.test(item.question);
        const context = ownStateQuestion ? LOUISIANA : ownCityQuestion || ownZipQuestion ? ownContext : undefined;
        return context ? { ...item, question: repair(item.question, context), answer: repair(item.answer, context) } : item;
      }),
    },
  };
}
