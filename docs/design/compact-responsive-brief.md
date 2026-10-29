# Compact responsive public experience

The owner requests complete, compact layouts on phones, tablets and computers, without
sideways scrolling in maps, tables, charts or any other public container. Text must wrap within
its card. Section gaps and gutters should be consistent, adjacent cards should share edges,
and short information cards should fit two or three across when readable.

## Layout decisions

- Public spacing uses shared section, gap and card-padding variables. Oversized fixed minimum
  heights are removed. Hero, reading and closing-survey gutters share the content width.
- Wide reference tables become labeled record cards. Four records appear initially; native
  disclosures expose every remaining record and secondary field. Sorting includes the full
  dataset before dividing it into preview and remaining records. All data has one DOM copy.
- Smaller comparisons wrap inside their actual container. Markdown and native JSX tables keep
  their values, row/header associations, IDs and source links; blank row-label headers say Item.
- Catalog topics, category filters, results and guide hubs wrap into compact grids. Phone cards
  normally use two columns; wider layouts add columns. Odd final rows fill the available tracks.
- The desktop national map fits its panel. Phones and tablets use regional native disclosures
  containing every state/district's name, outline and guide link, without a wide map canvas.
- Long readers use inline contents and full-width chapters, rather than a permanently empty
  sidebar. Original headings and anchors move into compact image headers. Long narrative text
  can balance into two readable desktop columns; data and task cards occupy the full width.
- The original article text, tables, dates, figures, links and sources remain. Native disclosures
  work without JavaScript; imagery and motion retain their existing accessibility controls.
- Quote surveys remain in each hero and immediately before the footer. Consent, contact limits
  and the policy of introducing companies only when they contact the consumer are unchanged.

## Verification contract

Check active containers and text at 320, 390, 768, 1024 and 1440 pixels. Document width alone
does not establish success: nested scroll areas, clipped text and text spilling out of visible
cards are independently checked. Closed native disclosures and decorative graphics are
distinguished from concealed content. Calibration includes a genuinely clipped example,
working wrapping, closed details and visible multi-column text.

Compare every captured reference row, cell and link, including collapsed records. Exercise
sorting, expansion, native state links, filters, pagination, JavaScript-disabled reading and
keyboard focus. Retain failed attempts with their actual source. Final browser and deployment
reports must identify the tested revision; an earlier production snapshot is not a new full crawl.

This is a public presentation change. Demo/indexing policy, publication gates, geographic
identities, stored content, market matching, business data and backend credentials are unchanged.
