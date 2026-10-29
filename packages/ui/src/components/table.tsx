/**
 * Data table (VD §9.8, pass 2): a sticky header, zebra rows, hover highlight, sortable headers for
 * static lists (client-side, by each cell's data-sort value), right-aligned tabular numerics,
 * status chips, inline mini-bars and sparklines, a row-actions column, loading skeletons, an
 * empty state, a density toggle and a card layout under 720px (depth.css .dt). Server-rendered:
 * only the small TableEnhancer runs on the client, and it never receives the cell renderers.
 */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { SortableTableHeader, TableBody, TableControls, TableEnhancer, TableRecords, TableScroll } from "./table-enhancer";

export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  /** Label shown before the value on small screens; defaults to the header when it is text. */
  mobileLabel?: string;
  cell: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** Tabular figures, right-aligned (money, counts, dates, USDOT numbers). */
  numeric?: boolean;
  /** System monospace (IDs). */
  mono?: boolean;
  /** Sort state for aria-sort on the header (server-sorted lists). */
  sort?: "ascending" | "descending" | "none";
  /** Client-side sorting for static lists; the value compared, when the cell text is not it. */
  sortable?: boolean;
  sortValue?: (row: Row) => string | number | null | undefined;
  /** 0..1 fill for an inline mini-bar drawn after the cell content. */
  bar?: (row: Row) => number | null | undefined;
  /** Values for an inline sparkline drawn after the cell content. */
  spark?: (row: Row) => number[] | null | undefined;
  /** The row's primary cell: bold and left-aligned in card mode. */
  primary?: boolean;
  /** A key fact shown beside the primary field in compact record summaries (up to two). */
  summary?: boolean;
  /** Stop the column from wrapping. */
  nowrap?: boolean;
  className?: string;
}

export interface TableProps<Row> {
  /** Accessible name; shown as a visible caption unless hideCaption. */
  caption: ReactNode;
  hideCaption?: boolean;
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Shown instead of the table when there are no rows. */
  empty?: ReactNode;
  compact?: boolean;
  /** Row actions, rendered in a trailing column that brightens on hover and focus. */
  actions?: (row: Row) => ReactNode;
  actionsHeader?: ReactNode;
  /** Renders this many skeleton rows instead of the rows. */
  loading?: number;
  /** Show the Comfortable/Compact toggle in the toolbar. Default: on for 6+ rows. */
  densityToggle?: boolean;
  /** Extra toolbar content (filters summary, counts). */
  toolbar?: ReactNode;
  /** Initial client-side sort for static lists. */
  defaultSort?: { key: string; dir: "ascending" | "descending" };
  /** Makes every column sortable client-side (static lists, or one page of a server-paged list). */
  sortable?: boolean;
  /** Stable id for the density preference and the enhancer; derived from the caption otherwise. */
  id?: string;
  /** Vertical scrolling with the sticky header past this height, e.g. "32rem". */
  maxHeight?: string;
  /** Dense reference data stays a bounded table on phones; action lists keep card layout. */
  mobileLayout?: "cards" | "scroll";
  /** Public reference data fits its container; wide tables become labeled, expandable records. */
  layout?: "standard" | "adaptive";
  /** Lets each row carry an href: the primary cell becomes a link covering the row on hover. */
  className?: string;
}

function slug(value: ReactNode): string {
  return String(typeof value === "string" ? value : "table")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

/** An inline bar, 0..1, drawn after a value; aria-hidden because the text carries the number. */
export function MiniBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className={cx("mini-bar-track", className)} aria-hidden="true">
      <span className="mini-bar-fill block" style={{ "--v": v.toFixed(3) } as CSSProperties} />
    </span>
  );
}

/** A tiny inline sparkline (polyline) for a short numeric series; aria-hidden. */
export function Sparkline({ values, width = 64, height = 18, className }: { values: number[]; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`).join(" ");
  const last = values[values.length - 1]!;
  const lx = ((values.length - 1) * step).toFixed(1);
  const ly = (height - 2 - ((last - min) / span) * (height - 4)).toFixed(1);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className={cx("inline-block align-middle text-primary", className)}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.2" fill="var(--display-red)" />
    </svg>
  );
}

export function Table<Row>({
  caption,
  hideCaption,
  columns,
  rows,
  rowKey,
  empty,
  compact,
  actions,
  actionsHeader = "Actions",
  loading,
  densityToggle,
  toolbar,
  defaultSort,
  sortable: allSortable,
  id,
  maxHeight,
  mobileLayout = "cards",
  layout = "standard",
  className,
}: TableProps<Row>) {
  if (!loading && rows.length === 0 && empty) return <>{empty}</>;
  const tableId = id ?? `dt-${slug(caption)}`;
  const density = compact ? "compact" : "comfortable";
  columns = columns.map((c, i) => ({ ...c, sortable: c.sortable ?? (allSortable && rows.length > 1), primary: c.primary ?? i === 0 }));
  const sortable = columns.filter((c) => c.sortable).map((c) => ({ key: c.key, label: typeof c.header === "string" ? c.header : c.mobileLabel ?? c.key }));
  const showToggle = densityToggle ?? rows.length >= 6;
  const cellPad = "px-3.5";
  const skeletonRows = loading ? Array.from({ length: loading }, (_, i) => i) : [];
  const adaptive = layout === "adaptive";
  const records = adaptive && columns.length > 4;
  const primary = columns.find((column) => column.primary) ?? columns[0];
  const explicitSummary = columns.filter((column) => !column.primary && column.summary);
  const summary = (explicitSummary.length ? explicitSummary : columns.filter((column) => column !== primary)).slice(0, 2);
  const summaryKeys = new Set([primary?.key, ...summary.map((column) => column.key)]);
  const secondary = columns.filter((column) => !summaryKeys.has(column.key));

  const recordField = (column: TableColumn<Row>, row: Row) => {
    const sortValue = column.sortValue?.(row);
    const bar = column.bar?.(row);
    const spark = column.spark?.(row);
    const content = column.cell(row);
    return <div key={column.key} className={cx("dt-record-field", column === primary && "dt-record-primary")} data-label={column.mobileLabel ?? (typeof column.header === "string" ? column.header : column.key)}>
      <dt>{column.header}</dt>
      <dd data-col={column.key} data-col-index={columns.indexOf(column)} data-label={column.mobileLabel ?? (typeof column.header === "string" ? column.header : column.key)} data-sort={sortValue === null || sortValue === undefined ? undefined : String(sortValue)} className={cx(column.numeric && "tabular", column.mono && "font-mono", column.className)}>
        {bar !== null && bar !== undefined ? <span className="mini-bar"><MiniBar value={bar} /><span>{content}</span></span>
          : spark && spark.length > 1 ? <span className="dt-record-spark"><Sparkline values={spark} /><span>{content}</span></span> : content}
      </dd>
    </div>;
  };

  return (
    <TableEnhancer tableId={tableId} sortable={sortable} defaultSort={defaultSort} density={density} densityToggle={showToggle} adaptive={adaptive} className={cx("dt-shell grid w-full min-w-0 gap-3", adaptive && "dt-adaptive", records && "dt-record-shell", className)}>
      {Boolean(!hideCaption || toolbar || showToggle || sortable.length > 0) && (
        <div className="dt-toolbar flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {!hideCaption ? <p className="type-h4 text-text">{caption}</p> : null}
            {toolbar}
            <p className="mt-1 type-small text-text-3">{loading ? "Loading records…" : `${rows.length.toLocaleString("en-US")} ${rows.length === 1 ? "record" : "records"}${records ? "" : " shown"}`}</p>
          </div>
          <TableControls />
        </div>
      )}
      {records ? <div id={tableId} className="dt-records" data-table-caption={typeof caption === "string" ? caption : "Reference records"}>
        {loading ? <div className="dt-record-grid" aria-busy="true" aria-label="Loading records">{skeletonRows.map((index) => <div key={index} className="dt-record" data-content-inset="compact" aria-hidden="true"><span className="skeleton block h-4 w-2/3" /><span className="skeleton mt-3 block h-3 w-full" /></div>)}</div>
          : !rows.length ? <p className="rounded-card border border-border bg-surface p-4 text-text-3">No records to show.</p>
          : <TableRecords label={typeof caption === "string" ? caption : "Reference records"} previewCount={4} rows={rows.map((row) => ({ key: rowKey(row), content: <div key={rowKey(row)} role="listitem" data-row-key={rowKey(row)} data-record-key={rowKey(row)} className="dt-record" data-content-inset="compact">
              <dl className="dt-record-fields">{columns.filter((column) => summaryKeys.has(column.key)).map((column) => recordField(column, row))}</dl>
              {secondary.length > 0 ? <details className="dt-record-details"><summary>All details <span aria-hidden="true">+</span></summary><dl className="dt-record-fields">{secondary.map((column) => recordField(column, row))}</dl></details> : null}
              {actions ? <div className="dt-record-actions" role="group" aria-label={typeof actionsHeader === "string" ? actionsHeader : "Actions"}>{actions(row)}</div> : null}
            </div> }))} />}
      </div> : <div id={tableId} className={cx("dt", (adaptive ? columns.length > 2 : mobileLayout === "cards") && "dt-responsive")}>
        <TableScroll caption={caption} maxHeight={maxHeight} adaptive={adaptive}>
          <table role="table" aria-busy={loading ? true : undefined}>
            <caption className="sr-only">{caption}</caption>
            <thead role="rowgroup">
              <tr role="row">
                {columns.map((column) => {
                  const label = typeof column.header === "string" ? column.header : column.mobileLabel ?? column.key;
                  const right = column.numeric || column.align === "right";
                  if (column.sortable) return (
                    <SortableTableHeader key={column.key} columnKey={column.key} label={label} staticLabel={adaptive} right={right} initialSort={column.sort} className={cx("px-3.5 py-2.5 text-left", right && "text-right", column.className)}>
                      {column.header}
                    </SortableTableHeader>
                  );
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      role="columnheader"
                      data-key={column.key}
                      data-label={label}
                      aria-sort={column.sort && column.sort !== "none" ? column.sort : undefined}
                      className={cx("px-3.5 py-2.5 text-left", right && "text-right", column.className)}
                    >
                      {column.header}
                    </th>
                  );
                })}
                {actions ? (
                  <th scope="col" className="px-3.5 py-2.5 text-right">
                    <span className="sr-only">{actionsHeader}</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            {loading ? <tbody>
              {skeletonRows.map((i) => (
                    <tr key={`skeleton-${i}`} aria-hidden="true">
                      {columns.map((column, j) => (
                        <td key={column.key} className={cx(cellPad, "py-3")}>
                          <span className="skeleton block h-3.5" style={{ width: `${55 + ((i * 7 + j * 13) % 40)}%` }} />
                        </td>
                      ))}
                      {actions ? <td className={cellPad} /> : null}
                    </tr>
                  ))}
            </tbody> : rows.length === 0 ? <tbody><tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-text-3">No records to show.</td></tr></tbody> : <TableBody rows={rows.map((row) => ({
                  key: rowKey(row),
                  content: <tr key={rowKey(row)} role="row" data-row-key={rowKey(row)}>
                      {columns.map((column) => {
                        const label = column.mobileLabel ?? (typeof column.header === "string" ? column.header : "");
                        const right = column.numeric || column.align === "right";
                        const sortValue = column.sortValue ? column.sortValue(row) : undefined;
                        const bar = column.bar ? column.bar(row) : null;
                        const spark = column.spark ? column.spark(row) : null;
                        const content = column.cell(row);
                        return (
                          <td
                            key={column.key}
                            role="cell"
                            data-col={column.key}
                            data-label={label}
                            data-sort={sortValue === null || sortValue === undefined ? undefined : String(sortValue)}
                            className={cx(
                              cellPad,
                              "py-3 text-text",
                              right && "text-right",
                              column.numeric && "tabular",
                              column.mono && "font-mono text-[0.9375rem]",
                              column.primary && "dt-primary",
                              column.nowrap && "whitespace-nowrap",
                              column.className,
                            )}
                          >
                            <div className="dt-value min-w-0">{bar !== null && bar !== undefined ? (
                              <span className={cx("mini-bar", right && "justify-end")}>
                                <MiniBar value={bar} />
                                <span>{content}</span>
                              </span>
                            ) : spark && spark.length > 1 ? (
                              <span className={cx("inline-flex items-center gap-2", right && "justify-end")}>
                                <Sparkline values={spark} />
                                <span>{content}</span>
                              </span>
                            ) : (
                              content
                            )}</div>
                          </td>
                        );
                      })}
                      {actions ? (
                        <td data-label="" className={cx(cellPad, "py-2 text-right")}>
                          <span className="dt-actions inline-flex flex-wrap justify-end gap-1.5">{actions(row)}</span>
                        </td>
                      ) : null}
                    </tr>,
                  }))} />}
          </table>
        </TableScroll>
      </div>}
    </TableEnhancer>
  );
}
