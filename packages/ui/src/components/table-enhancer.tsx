"use client";

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "../cx";
import { compareTableValues, tableSortValue } from "./table-sort";

type Sort = { key: string; dir: "ascending" | "descending" } | null;
type Density = "compact" | "comfortable";
interface TableState {
  id: string;
  sort: Sort;
  setSort: (sort: Sort) => void;
  density: Density;
  setDensity: (density: Density) => void;
  densityToggle: boolean;
  adaptive: boolean;
  columns: { key: string; label: string }[];
}
const Context = createContext<TableState | null>(null);
function useTable() {
  const state = useContext(Context);
  if (!state) throw new Error("Table controls must be rendered inside Table.");
  return state;
}

/** Keyboard access also works before hydration; card layouts shed the unnecessary tab stop. */
export function TableScroll({ caption, maxHeight, children, adaptive = false }: { caption: ReactNode; maxHeight?: string; children: ReactNode; adaptive?: boolean }) {
  const scroll = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [scrollable, setScrollable] = useState(!adaptive);
  useLayoutEffect(() => {
    if (adaptive) return;
    const node = scroll.current;
    if (!node) return;
    const measure = () => {
      const style = getComputedStyle(node);
      const x = /^(auto|scroll)$/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
      const y = /^(auto|scroll)$/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
      setScrollable(x || y);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    const table = node.querySelector("table");
    if (table) observer?.observe(table);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [children, adaptive]);
  return (
    <div ref={scroll} className="dt-scroll" tabIndex={scrollable ? 0 : -1} role={scrollable ? "region" : undefined}
      aria-labelledby={scrollable ? labelId : undefined} style={!adaptive && maxHeight ? ({ "--dt-max-height": maxHeight } as CSSProperties) : undefined}>
      {!adaptive ? <span id={labelId} className="sr-only" aria-hidden={!scrollable}>{caption}: scrollable table</span> : null}
      {children}
    </div>
  );
}

/** Cells are rendered by the server; the client receives React nodes, never cell functions. */
export function TableEnhancer({ tableId, sortable, defaultSort, density, densityToggle, adaptive = false, children, className }: {
  tableId: string;
  sortable: { key: string; label: string }[];
  defaultSort?: Exclude<Sort, null>;
  density: Density;
  densityToggle: boolean;
  adaptive?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [current, setCurrent] = useState(density);
  const [sort, setSort] = useState<Sort>(defaultSort ?? null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`amc.table.density.${tableId}`);
      setCurrent(stored === "compact" || stored === "comfortable" ? stored : density);
    } catch { /* Preferences are optional when storage is blocked. */ }
  }, [tableId, density]);
  const setDensity = (next: Density) => {
    setCurrent(next);
    try { localStorage.setItem(`amc.table.density.${tableId}`, next); } catch { /* Still works for this view. */ }
  };
  const column = sortable.find((item) => item.key === sort?.key);
  return (
    <Context.Provider value={{ id: tableId, sort, setSort, density: current, setDensity, densityToggle, adaptive, columns: sortable }}>
      <div className={className} data-density={current}>
        {children}
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {sort && column ? `Sorted by ${column.label}, ${sort.dir}.` : "Original row order."}
        </p>
      </div>
    </Context.Provider>
  );
}

export function TableControls() {
  const { sort, setSort, density, setDensity, densityToggle, columns, id, adaptive } = useTable();
  const chooser = useRef<HTMLDetailsElement>(null);
  const selected = columns.find(column => column.key === sort?.key);
  const choose = (next: Sort) => {
    setSort(next);
    // Keep focus on a visible control before the chosen button's disclosure closes.
    chooser.current?.querySelector("summary")?.focus();
    if (chooser.current) chooser.current.open = false;
  };
  return (
    <div className="dt-controls flex min-w-0 flex-wrap items-center gap-3">
      {columns.length > 0 && adaptive ? <details ref={chooser} className="dt-sort-picker" data-adaptive-sort="">
        <summary aria-controls={id}><span><span className="dt-sort-kicker">Sort records</span><span className="dt-sort-current">{sort && selected ? `${selected.label} · ${sort.dir === "ascending" ? "Ascending" : "Descending"}` : "Original order"}</span></span><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></summary>
        <div className="dt-sort-options" role="group" aria-label="Sort displayed records">
          <button type="button" aria-controls={id} aria-pressed={!sort} onClick={() => choose(null)}>Original order</button>
          {columns.flatMap(column => (["ascending", "descending"] as const).map(direction => <button key={`${column.key}:${direction}`} type="button" data-sort-choice={`${column.key}:${direction}`} aria-controls={id} aria-pressed={sort?.key === column.key && sort.dir === direction} onClick={() => choose({ key: column.key, dir: direction })}><span>{column.label}</span><small>{direction === "ascending" ? "Ascending" : "Descending"}</small></button>))}
        </div>
      </details> : columns.length > 0 ? (
        <label className="dt-mobile-sort min-w-0 text-[0.8125rem] font-semibold text-text-2">
          <span className="sr-only">Sort displayed rows</span>
          <select
            aria-controls={id}
            className="min-h-11 max-w-full rounded-control border border-border-strong bg-surface px-3 text-text"
            value={sort ? `${sort.key}:${sort.dir}` : ""}
            onChange={(event) => {
              const selection = event.target.value;
              const option = columns.find((item) => selection.startsWith(`${item.key}:`));
              setSort(option ? { key: option.key, dir: selection.endsWith(":descending") ? "descending" : "ascending" } : null);
            }}
          >
            <option value="">Original order</option>
            {columns.flatMap((item) => [
              <option key={`${item.key}:ascending`} value={`${item.key}:ascending`}>{item.label}: ascending</option>,
              <option key={`${item.key}:descending`} value={`${item.key}:descending`}>{item.label}: descending</option>,
            ])}
          </select>
        </label>
      ) : null}
      {densityToggle ? (
        <div className="inline-flex rounded-pill border border-border bg-surface p-0.5 shadow-[var(--edge-light)]" role="group" aria-label="Row density">
          {(["comfortable", "compact"] as const).map((option) => (
            <button key={option} type="button" aria-controls={id} aria-pressed={density === option} onClick={() => setDensity(option)}
              className={cx("inline-flex min-h-11 items-center rounded-pill px-3 text-[0.8125rem] font-semibold transition-colors duration-[var(--d1)]", density === option ? "bg-primary text-on-primary" : "text-text-2 hover:bg-surface-2 hover:text-text")}>
              {option === "comfortable" ? "Comfortable" : "Compact"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SortableTableHeader({ columnKey, label, children, className, right, initialSort, staticLabel }: {
  columnKey: string; label: string; children: ReactNode; className?: string; right?: boolean; initialSort?: "ascending" | "descending" | "none"; staticLabel?: boolean;
}) {
  const { sort, setSort, id } = useTable();
  const direction = sort ? sort.key === columnKey ? sort.dir : undefined : initialSort;
  return (
    <th role="columnheader" scope="col" aria-sort={direction && direction !== "none" ? direction : undefined} className={className}>
      {staticLabel ? children : <button type="button" aria-label={`Sort by ${label}`} aria-controls={id} className={cx("dt-sort", right && "flex-row-reverse")} onClick={() => {
        setSort(sort?.key === columnKey ? sort.dir === "ascending" ? { key: columnKey, dir: "descending" } : null : { key: columnKey, dir: "ascending" });
      }}>
        {children}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M6 1.5 2.5 5h7L6 1.5Z" fill="currentColor" />
          <path d="M6 10.5 2.5 7h7L6 10.5Z" fill="currentColor" opacity="0.4" />
        </svg>
      </button>}
    </th>
  );
}

/** Read displayed values, then let React move keyed rows; never reorder React's DOM manually. */
export function TableBody({ rows }: { rows: { key: string; content: ReactNode }[] }) {
  const { sort } = useTable();
  const body = useRef<HTMLTableSectionElement>(null);
  const [order, setOrder] = useState<string[]>([]);
  useLayoutEffect(() => {
    const values = new Map(Array.from(body.current?.rows ?? []).map((row) => {
      const cell = Array.from(row.cells).find((item) => item.dataset.col === sort?.key);
      return [row.dataset.rowKey!, tableSortValue(cell?.dataset.sort ?? cell?.textContent ?? "", cell?.querySelector("time[datetime]")?.getAttribute("datetime") ?? undefined)] as const;
    }));
    const next = [...rows];
    if (sort) next.sort((a, b) => compareTableValues(values.get(a.key) ?? null, values.get(b.key) ?? null, sort.dir));
    const keys = next.map((row) => row.key);
    setOrder((previous) => previous.length === keys.length && previous.every((key, index) => key === keys[index]) ? previous : keys);
  }, [rows, sort?.key, sort?.dir]);
  const position = new Map(order.map((key, index) => [key, index]));
  const ordered = order.length > 0 ? [...rows].sort((a, b) => (position.get(a.key) ?? rows.length) - (position.get(b.key) ?? rows.length)) : rows;
  return <tbody ref={body} role="rowgroup">{ordered.map((row) => row.content)}</tbody>;
}

/** All records are server rendered once; sorting includes records inside the native disclosure. */
export function TableRecords({ rows, previewCount = 4, label }: { rows: { key: string; content: ReactNode }[]; previewCount?: number; label: string }) {
  const { sort } = useTable();
  const root = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<string[]>([]);
  useLayoutEffect(() => {
    const values = new Map(Array.from(root.current?.querySelectorAll<HTMLElement>("[data-record-key]") ?? []).map((record) => {
      const cell = Array.from(record.querySelectorAll<HTMLElement>("[data-col]")).find((item) => item.dataset.col === sort?.key);
      return [record.dataset.recordKey!, tableSortValue(cell?.dataset.sort ?? cell?.textContent ?? "", cell?.querySelector("time[datetime]")?.getAttribute("datetime") ?? undefined)] as const;
    }));
    const next = [...rows];
    if (sort) next.sort((a, b) => compareTableValues(values.get(a.key) ?? null, values.get(b.key) ?? null, sort.dir));
    const keys = next.map((row) => row.key);
    setOrder((previous) => previous.length === keys.length && previous.every((key, index) => key === keys[index]) ? previous : keys);
  }, [rows, sort?.key, sort?.dir]);
  const positions = new Map(order.map((key, index) => [key, index]));
  const ordered = order.length ? [...rows].sort((a, b) => (positions.get(a.key) ?? rows.length) - (positions.get(b.key) ?? rows.length)) : rows;
  return <div ref={root} data-record-list="" data-record-count={rows.length}>
    <div className="dt-record-grid" role="list" aria-label={`${label}: preview`}>{ordered.slice(0, previewCount).map((row) => row.content)}</div>
    {rows.length > previewCount ? <details className="dt-record-more"><summary>View all {rows.length.toLocaleString("en-US")} records <span aria-hidden="true">+</span></summary><div className="dt-record-grid" role="list" aria-label={`${label}: remaining records`}>{ordered.slice(previewCount).map((row) => row.content)}</div></details> : null}
  </div>;
}
