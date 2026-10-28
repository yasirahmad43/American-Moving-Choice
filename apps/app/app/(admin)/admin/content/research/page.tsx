import { KNOWN_RESEARCH_FILES, listResearch, researchSummary, type ResearchFilters } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { SEO_FAMILIES } from "@amc/server/seo";
import { Field, Input, PageHeader, Select, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { FilterBar, FilterInput, FilterSelect, LinkTabs, Mono, Pager, SectionTitle, StatTile, Status, When, humanize, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../../_lib/roles";
import { assignAction, importKnownAction, importUploadAction } from "./actions";

const item = adminNavItem("/admin/content/research");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const PER_PAGE = 50;

export default async function ResearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const view = param(sp.view) === "unassigned" ? "unassigned" : "all";
  const filters: ResearchFilters = {
    kind: param(sp.kind),
    family: param(sp.family),
    source: param(sp.source),
    market: param(sp.market),
    measured: param(sp.measured) as ResearchFilters["measured"],
    assigned: view === "unassigned" ? "unassigned-questions" : (param(sp.assigned) as ResearchFilters["assigned"]),
    q: param(sp.q).slice(0, 100),
  };
  const page = pageNumber(sp.page);
  const [{ rows, total, sources, markets }, summary] = await Promise.all([listResearch({ ...filters, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }), researchSummary()]);
  const canAct = hasAdminRole(adminRole, ROLES.content);
  const query = { view, kind: filters.kind, family: filters.family, source: filters.source, market: filters.market, measured: filters.measured, assigned: view === "all" ? filters.assigned : "", q: filters.q };
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description={item.description} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Research rows" value={summary.total} note={`${summary.keywords} keywords · ${summary.questions} questions`} />
        <StatTile label="Measured volume" value={summary.measured} note={`${summary.hypothesis} hypothesis rows (no invented volume)`} />
        <StatTile label="Assigned to an existing page" value={summary.assigned} note={`${summary.total - summary.assigned} point at no page yet`} />
        <StatTile label="Unassigned questions" value={summary.unassignedQuestions} href="/admin/content/research?view=unassigned" note="Questions with no page in the store" />
      </div>
      <LinkTabs
        label="Research views"
        current={view}
        items={[
          { id: "all", label: "All rows", href: "/admin/content/research" },
          { id: "unassigned", label: `Unassigned questions (${summary.unassignedQuestions})`, href: "/admin/content/research?view=unassigned" },
        ]}
      />
      <FilterBar resetHref={view === "unassigned" ? "/admin/content/research?view=unassigned" : "/admin/content/research"}>
        <input type="hidden" name="view" value={view} />
        <FilterInput id="q" name="q" label="Keyword, question, URL or geography" value={filters.q ?? ""} />
        {view === "all" ? (
          <FilterSelect id="kind" name="kind" label="Kind" value={filters.kind ?? ""} options={[{ value: "keyword", label: "Keyword" }, { value: "question", label: "Question" }]} />
        ) : null}
        <FilterSelect id="family" name="family" label="Family" value={filters.family ?? ""} options={SEO_FAMILIES.map((f) => ({ value: f, label: humanize(f) }))} />
        <FilterSelect id="source" name="source" label="Source" value={filters.source ?? ""} options={sources.map((s) => ({ value: s, label: s }))} />
        <FilterSelect id="market" name="market" label="Market" value={filters.market ?? ""} options={markets.map((m) => ({ value: m, label: m.toUpperCase() }))} />
        <FilterSelect id="measured" name="measured" label="Volume" value={filters.measured ?? ""} options={[{ value: "yes", label: "Measured" }, { value: "no", label: "Hypothesis" }]} />
        {view === "all" ? (
          <FilterSelect id="assigned" name="assigned" label="Assigned page exists" value={filters.assigned ?? ""} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        ) : null}
      </FilterBar>
      <Table sortable
        caption={`${view === "unassigned" ? "Unassigned questions" : "Research rows"} (${total})`}
        rowKey={(r) => String(r.id)}
        rows={rows}
        compact
        empty={<p className="text-text-2">{view === "unassigned" ? "Every imported question points at a page in the store." : "No research rows match. Import a CSV below."}</p>}
        columns={[
          {
            key: "keyword",
            header: "Keyword or question",
            cell: (r) => (
              <span className="grid gap-0.5">
                <span className="font-semibold">{r.keyword}</span>
                <span className="type-small text-text-2">
                  {humanize(r.kind)}
                  {r.intent ? ` · ${humanize(r.intent)}` : ""}
                  {r.geography ? ` · ${r.geography}` : ""}
                </span>
              </span>
            ),
          },
          { key: "source", header: "Source", cell: (r) => <span className="grid gap-0.5"><span>{r.source}</span><span className="type-small text-text-2 break-all">{r.source_file}</span></span> },
          { key: "market", header: "Market", cell: (r) => r.market.toUpperCase() },
          {
            key: "volume",
            header: "Volume / KD",
            numeric: true,
            cell: (r) => (r.hypothesis ? <Status value="pending" label="Hypothesis" /> : <span className="grid gap-0.5"><span>{r.volume?.toLocaleString("en-US")}/mo</span><span className="type-small text-text-2">KD {r.difficulty ?? "n/a"}{r.cpc_cents !== null ? ` · $${(r.cpc_cents / 100).toFixed(2)}` : ""}</span></span>),
          },
          { key: "family", header: "Family", cell: (r) => (r.family ? humanize(r.family) : <span className="text-text-3">None</span>) },
          {
            key: "page",
            header: "Assigned page",
            cell: (r) =>
              r.target_url ? (
                <span className="grid gap-0.5">
                  {r.page_id ? (
                    <Link href={`/admin/content/${r.page_id}`} className="font-mono text-[0.8125rem] text-link underline break-all">
                      {r.target_url}
                    </Link>
                  ) : (
                    <Mono>{r.target_url}</Mono>
                  )}
                  {r.page_status ? <Status value={r.page_status} /> : <span className="type-small text-text-3">No page at this URL yet</span>}
                </span>
              ) : (
                <span className="text-text-3">Unassigned</span>
              ),
          },
          { key: "researched", header: "Researched", cell: (r) => <When value={r.researched_on} date /> },
          {
            key: "assign",
            header: "Assign",
            cell: (r) =>
              canAct ? (
                <ActionForm action={assignAction} submitLabel="Save" submitVariant="secondary" inline resetOnSuccess={false}>
                  <input type="hidden" name="researchId" value={r.id} />
                  <Field id={`target-${r.id}`} label="Page URL" hideLabel>
                    <Input name="targetUrl" defaultValue={r.target_url ?? ""} placeholder="/questions/…/" className="min-w-[14rem]" />
                  </Field>
                </ActionForm>
              ) : null,
          },
        ]}
      />
      <Pager page={page} total={total} perPage={PER_PAGE} hrefFor={(p) => `/admin/content/research${qs({ ...query, page: p })}`} />
      {canAct ? (
        <section aria-labelledby="import" className="grid gap-4 rounded-card border border-border bg-surface p-4">
          <SectionTitle id="import" description="The pipeline's importer (packages/server/src/seo/research.ts) reads the research agent's CSV shapes. Rows marked hypothesis keep no volume. Re-importing a file updates its rows in place.">
            Import research
          </SectionTitle>
          <div className="grid gap-6 md:grid-cols-2">
            <ActionForm action={importUploadAction} submitLabel="Import uploaded CSV">
              <Field id="upload" label="CSV file" required help="keyword-inventory, question-library, competitor-gaps, mover-leads-b2b or keyword-to-page-map shape.">
                <Input name="file" type="file" accept=".csv,text/csv" required />
              </Field>
            </ActionForm>
            <ActionForm action={importKnownAction} submitLabel="Import committed file" submitVariant="secondary">
              <Field id="known" label="Committed research file" required>
                <Select name="file" required defaultValue="">
                  <option value="" disabled>
                    Choose a file
                  </option>
                  {KNOWN_RESEARCH_FILES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
          </div>
          {summary.files.length ? (
            <ul className="grid gap-1 type-small text-text-2">
              {summary.files.map((f) => (
                <li key={f.source_file}>
                  {f.source_file}: {f.rows} rows, last import <When value={f.last_import} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
