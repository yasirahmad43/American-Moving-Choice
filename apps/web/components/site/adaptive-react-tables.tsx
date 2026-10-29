import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type DomProps = { children?: ReactNode; className?: string; [key: string]: unknown };
type Element = ReactElement<DomProps>;
const elements = (children: ReactNode): Element[] => Children.toArray(children).flatMap(child => isValidElement<DomProps>(child) ? child.type === Fragment ? elements(child.props.children) : [child] : []);
const mapChildren = (children: ReactNode, transform: (child: Element) => ReactNode): ReactNode => Children.map(children, child => isValidElement<DomProps>(child) ? child.type === Fragment ? cloneElement(child, {}, mapChildren(child.props.children, transform)) : transform(child) : child);
const parts = (parent: Element, tag: string) => elements(parent.props.children).filter(child => child.type === tag);
const textOf = (children: ReactNode): string => Children.toArray(children).map(child => typeof child === "string" || typeof child === "number" ? String(child) : isValidElement<DomProps>(child) ? textOf(child.props.children) : "").join("");
const empty = (children: ReactNode) => Children.toArray(children).every(child => typeof child === "string" && !child.trim());
const hasInteractiveContent = (children: ReactNode): boolean => elements(children).some(child => typeof child.type !== "string" || ["a", "button", "input", "select", "textarea"].includes(child.type) || hasInteractiveContent(child.props.children));

function tableInfo(table: Element) {
  const header = parts(table, "thead")[0];
  const headerRow = header && parts(header, "tr")[0];
  const headers = headerRow ? elements(headerRow.props.children).filter(child => child.type === "th" || child.type === "td") : [];
  const labels = headers.map((cell, index) => textOf(cell.props.children).trim() || String(cell.props["aria-label"] ?? (empty(cell.props.children) ? "Item" : `Field ${index + 1}`)));
  const rows = elements(table.props.children).filter(group => group.type === "thead" || group.type === "tbody").flatMap(group => parts(group, "tr"));
  const complex = !headers.length || rows.some(row => {
    const cells = elements(row.props.children).filter(cell => cell.type === "td" || cell.type === "th");
    return cells.length !== headers.length || cells.some(cell => Number(cell.props.colSpan ?? 1) !== 1 || Number(cell.props.rowSpan ?? 1) !== 1);
  });
  return { headers, labels, complex, rich: headers.some(cell => hasInteractiveContent(cell.props.children)) };
}

function adaptTable(table: Element, info: ReturnType<typeof tableInfo>): ReactNode {
  return cloneElement(table, { role: "table" }, mapChildren(table.props.children, group => {
    if (group.type !== "thead" && group.type !== "tbody") return group;
    const head = group.type === "thead";
    return cloneElement(group, { role: "rowgroup" }, mapChildren(group.props.children, row => {
      if (row.type !== "tr") return row;
      let column = 0;
      return cloneElement(row, { role: "row" }, mapChildren(row.props.children, cell => {
        if (cell.type !== "th" && cell.type !== "td") return cell;
        const index = column++;
        const role = head ? "columnheader" : cell.type === "th" ? "rowheader" : "cell";
        const attributes = { role, ...(cell.type === "th" ? { scope: head ? "col" : cell.props.scope ?? "row" } : {}),
          ...(!head && !info.complex && info.headers.length > 2 ? { "data-label": info.labels[index], "data-col-index": index } : {}) };
        return cloneElement(cell, attributes, head && empty(cell.props.children) ? "Item" : cell.props.children);
      }));
    }));
  }));
}

/** Normalize authored TSX table wrappers without executing components or discarding their data. */
export function adaptiveReactTables(children: ReactNode): ReactNode {
  return mapChildren(children, node => {
    if (node.type === "div" && node.props.className?.split(/\s+/).includes("table-wrap")) {
      const tables = parts(node, "table");
      if (tables.length !== 1) return cloneElement(node, { tabIndex: node.props.tabIndex === 0 ? undefined : node.props.tabIndex, "data-complex-table": "true" }, adaptiveReactTables(node.props.children));
      const info = tableInfo(tables[0]!);
      return cloneElement(node, {
        tabIndex: node.props.tabIndex === 0 ? undefined : node.props.tabIndex,
        "data-column-count": info.headers.length,
        ...(!info.complex && info.headers.length > 2 ? { "data-reflow": "true" } : {}),
        ...(!info.complex && info.headers.length > 4 ? { "data-wide": "true" } : {}),
        ...(info.rich ? { "data-rich-header": "true" } : {}),
        ...(info.complex ? { "data-complex-table": "true" } : {}),
      }, mapChildren(node.props.children, child => child.type === "table" ? adaptTable(child, info) : cloneElement(child, {}, adaptiveReactTables(child.props.children))));
    }
    return cloneElement(node, {}, adaptiveReactTables(node.props.children));
  });
}
