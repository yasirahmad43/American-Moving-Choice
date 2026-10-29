import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Table, type TableColumn } from "../src/components/table";

type Row = { id: string; cells: string[] };
const rows: Row[] = Array.from({ length: 8 }, (_, row) => ({ id: `record-${row}`, cells: Array.from({ length: 6 }, (_, column) => `value_${row}_${column}`) }));
const columns: TableColumn<Row>[] = Array.from({ length: 6 }, (_, index) => ({ key: `column-${index}`, header: `Field ${index}`, cell: row => index === 5 ? createElement("a", { href: `/source/${row.id}/` }, row.cells[index]) : row.cells[index] }));
const render = (extra: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(Table<Row>, { caption: "Complete reference", columns, rows, rowKey: row => row.id, layout: "adaptive", sortable: true, ...extra }));

describe("adaptive reference records", () => {
  it("server-renders every row and field once, including native closed details", () => {
    const html = render();
    expect(html.match(/data-record-key=/g)).toHaveLength(rows.length);
    expect(html.match(/<div role="listitem"/g)).toHaveLength(rows.length);
    expect(html).not.toContain('<article role="listitem"');
    expect(html.match(/data-col-index=/g)).toHaveLength(rows.length * columns.length);
    for (const row of rows) {
      for (const value of row.cells) expect(html.split(value)).toHaveLength(2);
      expect(html.split(`href="/source/${row.id}/"`)).toHaveLength(2);
    }
    expect(html).toContain("View all 8 records");
    expect(html.indexOf('data-record-key="record-3"')).toBeLessThan(html.indexOf('class="dt-record-more"'));
    expect(html.indexOf('data-record-key="record-4"')).toBeGreaterThan(html.indexOf('class="dt-record-more"'));
    expect(html).not.toContain("<table");
    expect(html).not.toContain("scrollable table");
  });

  it("exposes sorting choices for every field and retains explicit key-field selection", () => {
    const html = render({ columns: columns.map((column, index) => ({ ...column, summary: index === 4 || index === 5 })) });
    for (const column of columns) {
      expect(html).toContain(`data-sort-choice="${column.key}:ascending"`);
      expect(html).toContain(`data-sort-choice="${column.key}:descending"`);
    }
    const first = html.slice(html.indexOf('data-record-key="record-0"'), html.indexOf('data-record-key="record-1"'));
    expect(first.indexOf("value_0_4")).toBeLessThan(first.indexOf('class="dt-record-details"'));
    expect(first.indexOf("value_0_1")).toBeGreaterThan(first.indexOf('class="dt-record-details"'));
  });

  it("keeps narrow comparisons as one native table with all labels and values", () => {
    const html = render({ columns: columns.slice(0, 3) });
    expect(html.match(/<table\b/g)).toHaveLength(1);
    expect(html.match(/<td\b/g)).toHaveLength(24);
    expect(html).not.toContain('tabindex="0"');
    expect(html).not.toContain("scrollable table");
    for (let index = 0; index < 3; index += 1) {
      expect(html).toMatch(new RegExp(`<th[^>]*>Field ${index}</th>`));
      expect(html).toContain(`data-sort-choice="column-${index}:ascending"`);
    }
    expect(html).not.toContain('aria-label="Sort by Field');
  });

  it("retains the standard table API for existing application workflows", () => {
    const html = render({ layout: "standard" });
    expect(html.match(/<table\b/g)).toHaveLength(1);
    expect(html.match(/<td\b/g)).toHaveLength(48);
    expect(html).toContain("scrollable table");
    expect(html).toContain('<select');
    expect(html).toContain('aria-label="Sort by Field 2"');
  });

  it("keeps full long sort labels in native disclosure choices rather than clipped select options", () => {
    const label = "Local rule counts (named / total matches), recorded geographic coverage";
    const html = render({ columns: columns.map((column, index) => ({ ...column, header: index === 3 ? label : column.header })) });
    expect(html).toContain('data-adaptive-sort=""');
    expect(html).toContain(`<span>${label}</span><small>Ascending</small>`);
    expect(html).toContain(`<span>${label}</span><small>Descending</small>`);
    expect(html).not.toContain('<select');
    expect(html).not.toContain('…');
  });
});
