import { KNOWN_RESEARCH_FILES, PIPELINE_STEP_LABELS, publicationDashboard } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { SEO_FAMILIES } from "@amc/server/seo";
import { Alert, Card, Checkbox, Field, Input, PageHeader, Select, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { JsonDetails, Mono, SectionTitle, StatTile, Status, When, humanize, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../../_lib/roles";
import { runStepAction } from "./actions";

const item = adminNavItem("/admin/content/publication");

export const metadata: Metadata = { title: `${item.label} · Admin` };

export default async function PublicationPage() {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const d = await publicationDashboard();
  const canRun = hasAdminRole(adminRole, ROLES.content);
  const familyOptions = SEO_FAMILIES.filter((f) => f !== "mover-profile");
  return (
    <div className="grid gap-8">
      <PageHeader size="portal" title={item.label} description={item.description} />
      {d.running.length ? (
        <Alert tone="info" title="Pipeline running" role="status">
          {d.running.map((r) => humanize(r)).join(", ")} in progress. Reload to follow it; a run older than 15 minutes is treated as abandoned.
        </Alert>
      ) : null}
      <section aria-labelledby="totals">
        <SectionTitle id="totals">Store</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Pages in the store" value={d.totals.pages} href="/admin/content" note={`${d.totals.reviewed} with a recorded review`} />
          <StatTile label="Published" value={d.totals.published} href={`/admin/content${qs({ status: "published" })}`} note={`${d.totals.indexable} indexable`} />
          <StatTile label="Ready to publish" value={d.totals.ready} href={`/admin/content${qs({ status: "ready" })}`} note={`${d.totals.review} in review · ${d.totals.draft} draft`} />
          <StatTile label="Blocked by a gate" value={d.totals.blocked} href={`/admin/content${qs({ blocked: "yes" })}`} note={`${d.totals.hypothesis} pages on a hypothesis keyword`} />
        </div>
      </section>
      <section aria-labelledby="families">
        <SectionTitle id="families" description="The pipeline report (pnpm seo:report): planned is the candidate pool in the geo tables and catalog; researched counts pages whose primary keyword has a measured Semrush row.">
          By family and status
        </SectionTitle>
        <Table sortable
          caption="Counts by family"
          hideCaption
          compact
          rowKey={(r) => r.family}
          rows={d.counts}
          columns={[
            { key: "family", header: "Family", cell: (r) => <Link href={`/admin/content${qs({ family: r.family })}`} className="font-semibold text-link underline">{humanize(r.family)}</Link> },
            { key: "planned", header: "Planned", numeric: true, cell: (r) => r.planned.toLocaleString("en-US") },
            { key: "drafted", header: "In store", numeric: true, cell: (r) => r.drafted },
            { key: "researched", header: "Researched", numeric: true, cell: (r) => r.researched },
            { key: "reviewed", header: "Reviewed", numeric: true, cell: (r) => r.reviewed },
            { key: "ready", header: "Ready", numeric: true, cell: (r) => r.ready },
            { key: "published", header: "Published", numeric: true, cell: (r) => r.published },
            { key: "indexable", header: "Indexable", numeric: true, cell: (r) => r.indexable },
            { key: "blocked", header: "Blocked", numeric: true, cell: (r) => r.blocked },
          ]}
        />
      </section>
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="blocked">
          <SectionTitle id="blocked" description="Why pages are held as draft and noindex (blocked_reason), across families.">
            Blocked reasons
          </SectionTitle>
          <Table sortable
            caption="Blocked reasons"
            hideCaption
            compact
            rowKey={(r) => r.reason}
            rows={d.blockedReasons}
            empty={<p className="text-text-2">No page is blocked.</p>}
            columns={[
              { key: "reason", header: "Reason", cell: (r) => r.reason },
              { key: "pages", header: "Pages", numeric: true, cell: (r) => r.pages },
              { key: "families", header: "Families", cell: (r) => Object.entries(r.families).map(([f, n]) => `${humanize(f)} ${n}`).join(", ") },
            ]}
          />
        </section>
        <section aria-labelledby="sitemaps">
          <SectionTitle id="sitemaps" description={`Segmented sitemaps (apps/web/lib/sitemaps.ts): core.xml and companies.xml always exist; a family segment appears once it has indexable pages, in files of 1,000 URLs. Last build (latest lastmod): ${d.sitemap.lastBuild ? d.sitemap.lastBuild.toISOString() : "no indexable page yet"}.`}>
            Sitemap status: {d.sitemap.files} files, {d.sitemap.urls.toLocaleString("en-US")} programmatic URLs
          </SectionTitle>
          <Table sortable
            caption="Sitemap segments"
            hideCaption
            compact
            rowKey={(r) => r.name}
            rows={d.sitemap.segments}
            columns={[
              { key: "segment", header: "Segment", cell: (r) => <Mono>{r.name}{r.files > 1 ? `-1…${r.files}` : ""}.xml</Mono> },
              { key: "files", header: "Files", numeric: true, cell: (r) => r.files },
              { key: "urls", header: "URLs", numeric: true, cell: (r) => r.urls },
              { key: "lastmod", header: "Last change", cell: (r) => <When value={r.lastmod} /> },
            ]}
          />
        </section>
      </div>
      <section aria-labelledby="crawl">
        <SectionTitle id="crawl" description={d.crawl ? `docs/seo/crawl-report.md, generated ${d.crawl.generatedAt ?? "unknown"} against ${d.crawl.base ?? "unknown"} by pnpm seo:crawl.` : "No docs/seo/crawl-report.md on this server. Run pnpm seo:crawl against a built site to produce one."}>
          Latest crawl
        </SectionTitle>
        {d.crawl ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(16rem,20rem)]">
            <Table sortable
              caption="Crawl checks"
              hideCaption
              compact
              rowKey={(r) => r.check}
              rows={d.crawl.checks}
              columns={[
                { key: "check", header: "Check", cell: (r) => r.check },
                { key: "result", header: "Result", cell: (r) => r.result },
              ]}
            />
            <div className="grid content-start gap-4">
              <Card title="Indexable pages by prefix" titleAs="h3">
                <ul className="grid gap-0.5 type-small tabular">
                  {d.crawl.byPrefix.map((p) => (
                    <li key={p.prefix} className="flex justify-between gap-3">
                      <Mono>{p.prefix}</Mono>
                      <span>{p.pages}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title={`Broken links (${d.crawl.brokenLinks.length})`} titleAs="h3">
                {d.crawl.brokenLinks.length ? (
                  <ul className="grid gap-1 type-small break-all">
                    {d.crawl.brokenLinks.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="type-small text-text-2">None.</p>
                )}
              </Card>
            </div>
          </div>
        ) : null}
      </section>
      {canRun ? (
        <section aria-labelledby="pipeline" className="grid gap-4">
          <SectionTitle id="pipeline" description="Each step runs after the response as a job (job_runs row, one run at a time per step) through the same functions as the CLI: importGeo, importResearch, generateFamily, publishPages and the media sync. Media the admin rejected is never offered to the generator.">
            Run a pipeline step
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card title={PIPELINE_STEP_LABELS.import_geo} titleAs="h3" description="51 states, 29,639 cities, 40,977 ZIPs, route candidates and the facts registry (idempotent).">
              <ActionForm action={runStepAction} submitLabel="Run import" submitVariant="secondary" confirm={{ title: "Import geo entities?", description: "Several minutes on a fresh database.", confirmLabel: "Run" }}>
                <input type="hidden" name="step" value="import_geo" />
              </ActionForm>
            </Card>
            <Card title={PIPELINE_STEP_LABELS.import_research} titleAs="h3" description="The committed research CSVs; rows marked hypothesis keep no volume.">
              <ActionForm action={runStepAction} submitLabel="Run import" submitVariant="secondary">
                <input type="hidden" name="step" value="import_research" />
                <div className="grid gap-2">
                  {KNOWN_RESEARCH_FILES.map((f) => (
                    <Checkbox key={f} id={`file-${f.replace(/[^a-z0-9]/gi, "-")}`} name="files" value={f} label={f} defaultChecked />
                  ))}
                </div>
              </ActionForm>
            </Card>
            <Card title={PIPELINE_STEP_LABELS.generate} titleAs="h3" description="Writes ready or draft rows for a family; reruns are idempotent and keep media claims.">
              <ActionForm action={runStepAction} submitLabel="Run generate" submitVariant="secondary">
                <input type="hidden" name="step" value="generate" />
                <Field id="generate-family" label="Family" required>
                  <Select name="family" required defaultValue="state">
                    {familyOptions.map((f) => (
                      <option key={f} value={f}>
                        {humanize(f)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="generate-limit" label="Limit" required>
                  <Input name="limit" type="number" min={1} max={100000} defaultValue={50} required inputMode="numeric" />
                </Field>
              </ActionForm>
            </Card>
            <Card title={PIPELINE_STEP_LABELS.publish} titleAs="h3" description="Publishes pages in the chosen status, marks them indexable when nothing blocks them and rebuilds the link graph.">
              <ActionForm action={runStepAction} submitLabel="Run publish" confirm={{ title: "Publish pages?", description: "Every page in the chosen status (and family) goes live.", confirmLabel: "Publish" }}>
                <input type="hidden" name="step" value="publish" />
                <Field id="publish-status" label="From status" required>
                  <Select name="status" defaultValue="ready">
                    <option value="ready">Ready</option>
                    <option value="review">In review</option>
                    <option value="draft">Draft</option>
                  </Select>
                </Field>
                <Field id="publish-family" label="Family" optional>
                  <Select name="family" defaultValue="">
                    <option value="">Every family</option>
                    {familyOptions.map((f) => (
                      <option key={f} value={f}>
                        {humanize(f)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="publish-limit" label="Limit" optional>
                  <Input name="limit" type="number" min={1} max={100000} inputMode="numeric" />
                </Field>
              </ActionForm>
            </Card>
            <Card title={PIPELINE_STEP_LABELS.media_sync} titleAs="h3" description="Writes the pages' media claims into the manifest's usedOn so pnpm media:check validates them.">
              <ActionForm action={runStepAction} submitLabel="Run sync" submitVariant="secondary">
                <input type="hidden" name="step" value="media_sync" />
              </ActionForm>
            </Card>
          </div>
        </section>
      ) : null}
      <section aria-labelledby="runs">
        <SectionTitle id="runs">Pipeline runs</SectionTitle>
        <Table sortable
          caption="Pipeline runs"
          hideCaption
          compact
          rowKey={(r) => r.id}
          rows={d.runs}
          empty={<p className="text-text-2">No pipeline step has run from the admin yet.</p>}
          columns={[
            { key: "job", header: "Step", cell: (r) => humanize(r.job_name) },
            { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
            { key: "started", header: "Started", cell: (r) => <When value={r.started_at} /> },
            { key: "duration", header: "Seconds", numeric: true, cell: (r) => (r.finished_at ? ((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000).toFixed(1) : "Running") },
            { key: "items", header: "Items", numeric: true, cell: (r) => r.items_processed ?? "None" },
            { key: "details", header: "Details", cell: (r) => (r.error ? <span className="text-error">{r.error}</span> : <JsonDetails value={r.details} summary="Show details" />) },
          ]}
        />
      </section>
    </div>
  );
}
