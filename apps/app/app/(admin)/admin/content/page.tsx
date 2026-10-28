import { STATUS_LABELS, contentFilterOptions, listContentPages, type ContentFilters } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { Field, Input, PageHeader, Select, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { FilterBar, FilterInput, FilterSelect, Pager, SectionTitle, Status, When, humanize, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../_lib/roles";
import { bulkPublishAction, bulkReviewAction } from "./actions";

const item = adminNavItem("/admin/content");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const PER_PAGE = 50;
const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default async function ContentInventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const filters: ContentFilters = {
    family: param(sp.family),
    status: param(sp.status),
    indexable: param(sp.indexable) as ContentFilters["indexable"],
    intent: param(sp.intent),
    state: param(sp.state).toUpperCase(),
    parent: param(sp.parent),
    blocked: param(sp.blocked) as ContentFilters["blocked"],
    hypothesis: param(sp.hypothesis) as ContentFilters["hypothesis"],
    reviewed: param(sp.reviewed) as ContentFilters["reviewed"],
    media: param(sp.media) as ContentFilters["media"],
    q: param(sp.q).slice(0, 100),
  };
  const page = pageNumber(sp.page);
  const [{ rows, total }, options] = await Promise.all([listContentPages({ ...filters, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }), contentFilterOptions()]);
  const canAct = hasAdminRole(adminRole, ROLES.content);
  const query = { family: filters.family, status: filters.status, indexable: filters.indexable, intent: filters.intent, state: filters.state, parent: filters.parent, blocked: filters.blocked, hypothesis: filters.hypothesis, reviewed: filters.reviewed, media: filters.media, q: filters.q };
  const hidden = Object.entries(query).filter(([, v]) => v);
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description={item.description} />
      <FilterBar resetHref="/admin/content">
        <FilterInput id="q" name="q" label="URL, title or keyword" value={filters.q ?? ""} />
        <FilterSelect id="family" name="family" label="Family" value={filters.family ?? ""} options={options.families.map((f) => ({ value: f, label: humanize(f) }))} />
        <FilterSelect id="status" name="status" label="Status" value={filters.status ?? ""} options={options.statuses.map((s) => ({ value: s, label: STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s }))} />
        <FilterSelect id="indexable" name="indexable" label="Indexable" value={filters.indexable ?? ""} options={YES_NO} />
        <FilterSelect id="intent" name="intent" label="Intent" value={filters.intent ?? ""} options={options.intents.map((i) => ({ value: i, label: humanize(i) }))} />
        <FilterSelect id="state" name="state" label="State" value={filters.state ?? ""} options={options.states.map((s) => ({ value: s, label: s }))} />
        <FilterInput id="parent" name="parent" label="Parent URL" value={filters.parent ?? ""} placeholder="/movers/texas/" />
        <FilterSelect id="blocked" name="blocked" label="Blocked by a gate" value={filters.blocked ?? ""} options={YES_NO} />
        <FilterSelect id="hypothesis" name="hypothesis" label="Keyword is a hypothesis" value={filters.hypothesis ?? ""} options={YES_NO} />
        <FilterSelect id="reviewed" name="reviewed" label="Reviewed" value={filters.reviewed ?? ""} options={YES_NO} />
        <FilterSelect id="media" name="media" label="Has media" value={filters.media ?? ""} options={YES_NO} />
      </FilterBar>
      <Table
        caption={`Pages (${total})`}
        rowKey={(r) => r.id}
        rows={rows}
        compact
        empty={<p className="text-text-2">No pages match these filters. Generate a family from the publication page first.</p>}
        columns={[
          {
            key: "url",
            header: "Page",
            cell: (r) => (
              <span className="grid gap-0.5">
                <Link href={`/admin/content/${r.id}`} className="font-mono text-[0.875rem] font-semibold text-link underline break-all">
                  {r.url}
                </Link>
                <span className="type-small text-text-2">{r.title}</span>
              </span>
            ),
          },
          { key: "family", header: "Family", cell: (r) => humanize(r.family) },
          { key: "status", header: "Status", cell: (r) => <Status value={r.status} label={STATUS_LABELS[r.status]} /> },
          { key: "indexable", header: "Index", cell: (r) => (r.indexable ? <Status value="live" label="Indexable" /> : <Status value="hidden" label="Noindex" />) },
          {
            key: "keyword",
            header: "Primary keyword · intent",
            cell: (r) => (
              <span className="grid gap-0.5">
                <span>{r.primary_keyword}</span>
                <span className="type-small text-text-2">
                  {humanize(r.intent)}
                  {r.hypothesis ? " · hypothesis" : " · measured"}
                </span>
              </span>
            ),
          },
          { key: "geo", header: "Geo", cell: (r) => r.state_code ?? <span className="text-text-3">National</span> },
          { key: "parent", header: "Parent", cell: (r) => (r.parent_url ? <span className="font-mono text-[0.8125rem] break-all">{r.parent_url}</span> : <span className="text-text-3">Hub</span>) },
          { key: "reviewed", header: "Last review", cell: (r) => (r.last_reviewed_at ? <span className="grid gap-0.5"><When value={r.last_reviewed_at} date /><span className="type-small text-text-2">{r.reviewed_by}</span></span> : <span className="text-text-3">None</span>) },
          { key: "media", header: "Media", numeric: true, cell: (r) => r.media_count },
          {
            key: "gates",
            header: "Gates",
            cell: (r) => (
              <span className="grid gap-0.5">
                <span className="tabular">
                  {r.gates_passed}/{r.gates_total} pass
                </span>
                {r.gates_failed.length ? <span className="type-small text-error">{r.gates_failed.join(", ")}</span> : null}
                {r.blocked_reason ? <span className="type-small text-text-2">{r.blocked_reason}</span> : null}
              </span>
            ),
          },
        ]}
      />
      <Pager page={page} total={total} perPage={PER_PAGE} hrefFor={(p) => `/admin/content${qs({ ...query, page: p })}`} />
      {canAct ? (
        <section aria-labelledby="bulk" className="grid gap-4 rounded-card border border-border bg-surface p-4">
          <SectionTitle id="bulk" description="Actions on the filtered set above. Publishing uses the pipeline's publisher: every ready page of the chosen family (or all families) goes live and the link graph is rebuilt.">
            Bulk actions
          </SectionTitle>
          <div className="grid gap-6 md:grid-cols-2">
            <ActionForm
              action={bulkPublishAction}
              submitLabel="Publish all ready pages"
              confirm={{ title: "Publish every ready page?", description: `Every page in status "ready"${filters.family ? ` in the ${filters.family} family` : ""} is published and, when no gate blocks it, made indexable.`, confirmLabel: "Publish" }}
            >
              <input type="hidden" name="family" value={filters.family ?? ""} />
              <Field id="bulk-limit" label="At most (pages)" optional help="Leave empty to publish every ready page.">
                <Input name="limit" type="number" min={1} max={100000} inputMode="numeric" />
              </Field>
            </ActionForm>
            <ActionForm action={bulkReviewAction} submitLabel={`Mark ${total} filtered page${total === 1 ? "" : "s"} reviewed`} submitVariant="secondary" confirm={{ title: `Mark ${total} pages as reviewed?`, description: "Records the reviewer and the time on every page matching the current filters.", confirmLabel: "Mark reviewed" }}>
              {hidden.map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value ?? ""} />
              ))}
              <Field id="bulk-reviewer" label="Reviewer" required>
                <Input name="reviewer" required minLength={3} maxLength={120} />
              </Field>
            </ActionForm>
          </div>
        </section>
      ) : null}
    </div>
  );
}
