import { BLOCKING_GATES, GATE_LABELS, STATUS_LABELS, STATUS_TRANSITIONS, faqToText, getContentPage, mediaForPage, regenerateKey, transitionProblem } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { isUuid } from "@amc/server/db";
import { env } from "@amc/server/env";
import type { ContentBlock } from "@amc/server/seo";
import { Alert, Card, Field, Input, PageHeader, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { Facts, JsonDetails, LinkTabs, Mono, SectionTitle, Status, When, humanize, param } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../../_lib/roles";
import { editAction, indexableAction, redirectAction, regenerateAction, reviewAction, statusAction } from "../actions";

const item = adminNavItem("/admin/content");

export const metadata: Metadata = { title: "Page · Content · Admin" };

const TABS = [
  { id: "content", label: "Content" },
  { id: "gates", label: "Gates and sources" },
  { id: "links", label: "Links and media" },
  { id: "edit", label: "Edit" },
  { id: "history", label: "History" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-text">{block.text}</p>;
    case "note":
      return <p className="rounded-control bg-surface-2 px-3 py-2 type-small text-text-2">{block.text}</p>;
    case "list":
      return block.ordered ? <ol className="list-decimal pl-5">{block.items.map((i) => <li key={i}>{i}</li>)}</ol> : <ul className="list-disc pl-5">{block.items.map((i) => <li key={i}>{i}</li>)}</ul>;
    case "table":
      return (
        <table className="w-full border-collapse type-small">
          {block.caption ? <caption className="text-left font-semibold">{block.caption}</caption> : null}
          <thead>
            <tr>
              {block.columns.map((c) => (
                <th key={c} scope="col" className="border-b border-border-strong px-2 py-1 text-left">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border-b border-border px-2 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "facts":
      return (
        <ul className="grid gap-2">
          {block.items.map((f) => (
            <li key={f.claim} className="grid gap-0.5">
              <span>{f.claim}</span>
              <span className="type-small text-text-2">
                Source: {f.source.label} ({f.source.accessedOn})
              </span>
            </li>
          ))}
        </ul>
      );
    case "cost":
      return (
        <div className="grid gap-1 type-small">
          <p className="font-semibold">
            Cost block: {block.block.scope} ({block.block.moveType}
            {block.block.band ? `, ${block.block.band}` : ""}; {block.block.modelVersion}, as of {block.block.asOf})
          </p>
          {block.block.noData ? <p className="text-text-2">{block.block.noData}</p> : <ul className="list-disc pl-5">{block.block.rows.map((r) => <li key={r.homeSize}>{`${r.homeSize}: ${r.low} to ${r.high} (${r.movers} movers; ${r.typical})`}</li>)}</ul>}
        </div>
      );
    case "movers":
      return (
        <div className="grid gap-1 type-small">
          {block.heading ? <p className="font-semibold">{block.heading}</p> : null}
          <ul className="list-disc pl-5">
            {block.items.map((m) => (
              <li key={m.slug}>
                {m.name}
                {m.basedIn ? ` (${m.basedIn})` : ""}: {m.coverageNote}
              </li>
            ))}
          </ul>
          {block.paidLine ? <p className="text-text-2">Shows the paid-placement line.</p> : null}
        </div>
      );
  }
}

export default async function ContentPageDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const detail = await getContentPage(id);
  if (!detail) notFound();
  const sp = await searchParams;
  const tab = (TABS.some((t) => t.id === param(sp.tab)) ? param(sp.tab) : "content") as Tab;
  const p = detail.page;
  const media = await mediaForPage(p.media_ids);
  const webUrl = env().WEB_URL;
  const canAct = hasAdminRole(adminRole, ROLES.content);
  const transitions = STATUS_TRANSITIONS[p.status].map((to) => ({ to, problem: transitionProblem(p, to) }));
  const gateEntries = Object.entries(p.gate_results);
  return (
    <div className="grid gap-6">
      <PageHeader
        size="portal"
        title={p.h1}
        description={
          <span className="grid gap-1">
            <Mono>{p.url}</Mono>
            <span>
              {humanize(p.family)} page · {p.primary_keyword} ({humanize(p.intent)}; {detail.hypothesis ? "hypothesis keyword" : "measured keyword"})
            </span>
          </span>
        }
        actions={
          <span className="flex flex-wrap items-center gap-2">
            <Status value={p.status} label={STATUS_LABELS[p.status]} />
            {p.indexable ? <Status value="live" label="Indexable" /> : <Status value="hidden" label="Noindex" />}
            {p.status === "published" ? (
              <a href={`${webUrl}${p.url}`} className="font-semibold text-link underline" target="_blank" rel="noreferrer">
                Open on the site
              </a>
            ) : null}
          </span>
        }
      />
      {p.blocked_reason ? (
        <Alert tone="warning" title="Held by a gate" role="none">
          {p.blocked_reason}
        </Alert>
      ) : null}
      <LinkTabs label="Page views" current={tab} items={TABS.map((t) => ({ id: t.id, label: t.label, href: `/admin/content/${id}?tab=${t.id}` }))} />

      {tab === "content" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(18rem,22rem)]">
          <div className="grid gap-6">
            <Card title="Title and description" titleAs="h2">
              <Facts items={[{ label: "Title", value: p.title }, { label: "Meta description", value: p.meta_description }, { label: "H1", value: p.h1 }, { label: "Canonical", value: <Mono>{p.canonical_url}</Mono> }, { label: "Schema", value: p.content.schemaType }, { label: "Data as of", value: p.content.dataAsOf }]} />
            </Card>
            <Card title="First-screen answer" titleAs="h2">
              <p>{p.content.intro.answer}</p>
              {p.content.intro.dataPoints.length ? (
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {p.content.intro.dataPoints.map((d) => (
                    <div key={d.label} className="rounded-control border border-border p-3">
                      <dt className="type-small font-semibold text-text-2">{d.label}</dt>
                      <dd className="font-semibold">{d.value}</dd>
                      <dd className="type-small text-text-3">{d.basis}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </Card>
            {p.content.sections.map((section) => (
              <Card key={section.id} title={section.heading} titleAs="h2">
                <div className="grid gap-3">
                  {section.blocks.map((block, i) => (
                    <Block key={i} block={block} />
                  ))}
                </div>
              </Card>
            ))}
            <Card title={`FAQ (${p.content.faq.length})`} titleAs="h2">
              {p.content.faq.length ? (
                <dl className="grid gap-3">
                  {p.content.faq.map((f) => (
                    <div key={f.question}>
                      <dt className="font-semibold">{f.question}</dt>
                      <dd className="text-text-2">{f.answer}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-text-2">No FAQ on this page.</p>
              )}
            </Card>
            <Card title="Quote entry and credits" titleAs="h2">
              <Facts items={[{ label: "Quote heading", value: p.content.quote.heading }, { label: "Prefill", value: `${p.content.quote.entry}; origin ${p.content.quote.originZip ?? "none"}, destination ${p.content.quote.destZip ?? "none"}` }, { label: "Credits", value: p.content.credits.join(" ") || "None" }]} />
            </Card>
          </div>
          <aside className="grid content-start gap-4">
            <Card title="Workflow" titleAs="h2">
              <Facts items={[{ label: "Status", value: <Status value={p.status} label={STATUS_LABELS[p.status]} /> }, { label: "Published", value: <When value={p.published_at} /> }, { label: "Reviewed", value: p.last_reviewed_at ? <span>{p.reviewed_by} · <When value={p.last_reviewed_at} /></span> : "Not yet" }, { label: "Updated", value: <When value={p.updated_at} /> }, { label: "Parent", value: p.parent_url ? <span>{p.parent_url} {detail.parentPublished === false ? <Status value="draft" label="Not published" /> : null}</span> : "Hub" }, { label: "Children", value: detail.children }]} />
              {canAct ? (
                <div className="mt-4 grid gap-3">
                  {transitions.map(({ to, problem }) =>
                    problem ? (
                      <p key={to} className="type-small text-text-2">
                        Can't move to {STATUS_LABELS[to].toLowerCase()}: {problem}
                      </p>
                    ) : (
                      <ActionForm
                        key={to}
                        action={statusAction}
                        submitLabel={to === "published" ? "Publish" : p.status === "published" ? "Unpublish (back to draft)" : `Move to ${STATUS_LABELS[to].toLowerCase()}`}
                        submitVariant={to === "published" ? "primary" : p.status === "published" ? "danger" : "secondary"}
                        confirm={to === "published" || p.status === "published" ? { title: to === "published" ? `Publish ${p.url}?` : `Unpublish ${p.url}?`, description: to === "published" ? "The page goes live, becomes indexable when no gate blocks it, and the link graph is rebuilt." : "The page returns a 404, leaves the sitemaps and its links are dropped.", confirmLabel: to === "published" ? "Publish" : "Unpublish" } : undefined}
                      >
                        <input type="hidden" name="pageId" value={id} />
                        <input type="hidden" name="to" value={to} />
                        <Field id={`note-${to}`} label="Note" optional>
                          <Input name="note" maxLength={500} />
                        </Field>
                      </ActionForm>
                    ),
                  )}
                </div>
              ) : null}
            </Card>
            {canAct && p.status === "published" ? (
              <Card title={p.indexable ? "Take out of the index" : "Allow indexing"} titleAs="h2">
                <ActionForm action={indexableAction} submitLabel={p.indexable ? "Set noindex" : "Set indexable"} submitVariant="secondary">
                  <input type="hidden" name="pageId" value={id} />
                  <input type="hidden" name="indexable" value={p.indexable ? "false" : "true"} />
                  <Field id="index-reason" label="Reason (recorded in the audit log)" required>
                    <Textarea name="reason" rows={2} required minLength={3} maxLength={500} />
                  </Field>
                </ActionForm>
              </Card>
            ) : null}
            {canAct ? (
              <Card title="Record a review" titleAs="h2">
                <ActionForm action={reviewAction} submitLabel="Mark reviewed" submitVariant="secondary">
                  <input type="hidden" name="pageId" value={id} />
                  <Field id="reviewer" label="Reviewer" required>
                    <Input name="reviewer" required minLength={3} maxLength={120} defaultValue={p.reviewed_by ?? ""} />
                  </Field>
                </ActionForm>
              </Card>
            ) : null}
            {canAct ? (
              <Card title="Regenerate from the brief" titleAs="h2" description={regenerateKey(p.family, p.url) ? "Rebuilds the page from the current data (geo tables, facts, coverage, rate cards, research), re-runs the gates and keeps its media claims. A published page that regenerates clean stays published." : "Cost pages regenerate as a family from the publication page."}>
                {regenerateKey(p.family, p.url) ? (
                  <ActionForm action={regenerateAction} submitLabel="Regenerate" submitVariant="secondary" confirm={{ title: `Regenerate ${p.url}?`, description: "Hand edits to the title, description, answer and FAQ are replaced by the generator's text.", confirmLabel: "Regenerate" }}>
                    <input type="hidden" name="pageId" value={id} />
                  </ActionForm>
                ) : null}
              </Card>
            ) : null}
          </aside>
        </div>
      ) : null}

      {tab === "gates" ? (
        <div className="grid gap-6">
          <section aria-labelledby="gates">
            <SectionTitle id="gates" description="Automated gates from the generator (docs/seo/programmatic-pipeline.md). Evidence, uniqueness, duplicate content and duplicate intent block publication; the others trigger review.">
              Gate results
            </SectionTitle>
            <ul className="grid gap-2 md:grid-cols-2">
              {gateEntries.map(([key, gate]) => (
                <li key={key} className="flex items-start gap-3 rounded-card border border-border bg-surface p-3">
                  <Status value={gate.passed ? "pass" : "fail"} label={gate.passed ? "Pass" : "Fail"} />
                  <span className="grid gap-0.5">
                    <span className="font-semibold">
                      {GATE_LABELS[key] ?? humanize(key)}
                      {(BLOCKING_GATES as readonly string[]).includes(key) ? "" : " (review trigger)"}
                    </span>
                    <span className="type-small text-text-2">{gate.detail}</span>
                  </span>
                </li>
              ))}
              {!gateEntries.length ? <li className="text-text-2">No gate results stored.</li> : null}
            </ul>
            <div className="mt-4">
              <Facts items={[{ label: "Evidence count", value: p.evidence_count }, { label: "Unique share", value: p.unique_share === null ? "Not measured" : `${Math.round(p.unique_share * 100)}%` }, { label: "Content hash", value: <Mono>{p.content_hash}</Mono> }, { label: "Supporting keywords", value: p.supporting_keywords.join(", ") || "None" }]} />
            </div>
          </section>
          <section aria-labelledby="sources">
            <SectionTitle id="sources">Sources ({p.sources.length})</SectionTitle>
            {p.sources.length ? (
              <ul className="grid gap-1">
                {p.sources.map((s) => (
                  <li key={`${s.url}-${s.label}`}>
                    <a href={s.url} className="text-link underline" target="_blank" rel="noreferrer">
                      {s.label}
                    </a>{" "}
                    <span className="type-small text-text-2">read {s.accessedOn}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-2">No sources on this page.</p>
            )}
          </section>
          <section aria-labelledby="research">
            <SectionTitle id="research">Research rows targeting this URL ({detail.research.length})</SectionTitle>
            {detail.research.length ? (
              <ul className="grid gap-1">
                {detail.research.map((r) => (
                  <li key={r.id}>
                    {r.keyword} <span className="type-small text-text-2">({r.kind}; {r.volume === null ? "hypothesis" : `${r.volume.toLocaleString("en-US")}/mo, KD ${r.difficulty ?? "n/a"}`}; {r.source})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-2">No research row maps to this URL.</p>
            )}
          </section>
        </div>
      ) : null}

      {tab === "links" ? (
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Inbound links" titleAs="h2">
              <p className="text-[1.75rem] font-semibold tabular">{detail.linksIn}</p>
            </Card>
            <Card title="Outbound links" titleAs="h2">
              <p className="text-[1.75rem] font-semibold tabular">{detail.linksOut}</p>
            </Card>
            <Card title="Redirects here" titleAs="h2">
              <p className="text-[1.75rem] font-semibold tabular">{detail.redirects.length}</p>
            </Card>
          </div>
          <section aria-labelledby="media">
            <SectionTitle id="media" description="One asset belongs to one page. Reassign or unclaim from the media library.">
              Claimed media ({media.length})
            </SectionTitle>
            {media.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {media.map((m) => (
                  <li key={m.id} className="grid gap-1 rounded-card border border-border bg-surface p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={new URL(m.thumb, webUrl).href} alt={m.alt} width={m.width} height={m.height} className="aspect-video w-full rounded-control object-cover" loading="eager" />
                    <Link href={`/admin/content/media?q=${encodeURIComponent(m.id)}`} className="font-mono text-[0.8125rem] text-link underline break-all">
                      {m.id}
                    </Link>
                    <span className="type-small text-text-2">{m.credit.creator}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-2">No media claimed; the page renders without an image.</p>
            )}
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="inbound">
              <SectionTitle id="inbound">Inbound ({detail.inbound.length})</SectionTitle>
              <ul className="grid gap-1 type-small">
                {detail.inbound.map((l) => (
                  <li key={`${l.from_url}-${l.relation}`}>
                    <Mono>{l.from_url}</Mono> <span className="text-text-2">{l.relation}: {l.anchor}</span>
                  </li>
                ))}
                {!detail.inbound.length ? <li className="text-text-2">No inbound links (links exist only between published pages).</li> : null}
              </ul>
            </section>
            <section aria-labelledby="outbound">
              <SectionTitle id="outbound">Outbound ({detail.outbound.length})</SectionTitle>
              <ul className="grid gap-1 type-small">
                {detail.outbound.map((l) => (
                  <li key={`${l.to_url}-${l.relation}`}>
                    <Mono>{l.to_url}</Mono> <span className="text-text-2">{l.relation}: {l.anchor}</span>
                  </li>
                ))}
                {!detail.outbound.length ? <li className="text-text-2">No outbound links stored (the graph is rebuilt on publish).</li> : null}
              </ul>
            </section>
          </div>
          <section aria-labelledby="redirects">
            <SectionTitle id="redirects">Redirects to this page</SectionTitle>
            <ul className="grid gap-1 type-small">
              {detail.redirects.map((r) => (
                <li key={r.source_url}>
                  <Mono>{r.source_url}</Mono> <span className="text-text-2">{r.reason} · <When value={r.created_at} date /></span>
                </li>
              ))}
              {!detail.redirects.length ? <li className="text-text-2">None.</li> : null}
            </ul>
            {canAct ? (
              <div className="mt-4 max-w-xl">
                <ActionForm action={redirectAction} submitLabel="Add redirect" submitVariant="secondary">
                  <input type="hidden" name="pageId" value={id} />
                  <Field id="redirect-source" label="Old URL (301 source)" required help="A retired path such as /moving-routes/texas-to-florida/.">
                    <Input name="sourceUrl" required pattern="/[a-z0-9/-]*/" />
                  </Field>
                  <Field id="redirect-target" label="New URL" required>
                    <Input name="targetUrl" required defaultValue={p.url} />
                  </Field>
                  <Field id="redirect-reason" label="Reason" required>
                    <Input name="reason" required minLength={3} maxLength={300} />
                  </Field>
                </ActionForm>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "edit" ? (
        <div className="max-w-3xl">
          {canAct ? (
            <ActionForm action={editAction} submitLabel="Save and re-run the gates" resetOnSuccess={false}>
              <input type="hidden" name="pageId" value={id} />
              <Field id="edit-title" label="Title (10 to 120 characters)" required>
                <Input name="title" required minLength={10} maxLength={120} defaultValue={p.title} />
              </Field>
              <Field id="edit-description" label="Meta description (40 to 320 characters)" required>
                <Textarea name="metaDescription" rows={3} required minLength={40} maxLength={320} defaultValue={p.meta_description} />
              </Field>
              <Field id="edit-intro" label="First-screen answer" required>
                <Textarea name="intro" rows={5} required minLength={3} maxLength={4000} defaultValue={p.content.intro.answer} />
              </Field>
              <Field id="edit-faq" label="FAQ" help="One item per paragraph: the question on the first line, the answer on the lines below. Leave empty to remove the FAQ.">
                <Textarea name="faq" rows={12} maxLength={20000} defaultValue={faqToText(p.content.faq)} />
              </Field>
              <p className="type-small text-text-2">Saving stores the new content hash and re-runs the uniqueness, duplicate-content and word-count gates. A page that then fails a blocking gate drops to draft and out of the index.</p>
            </ActionForm>
          ) : (
            <p className="text-text-2">Your role can read this page but not edit it.</p>
          )}
        </div>
      ) : null}

      {tab === "history" ? (
        <section aria-labelledby="history">
          <SectionTitle id="history">Audit history</SectionTitle>
          <ul className="grid gap-2">
            {detail.history.map((h) => (
              <li key={h.id} className="rounded-card border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{h.action}</span>
                  <span className="type-small text-text-2">
                    <When value={h.created_at} /> · actor {h.actor_id ? <Mono>{h.actor_id.slice(0, 8)}</Mono> : "system"}
                  </span>
                </div>
                <JsonDetails value={{ before: h.before, after: h.after }} summary="Show before and after" />
              </li>
            ))}
            {!detail.history.length ? <li className="text-text-2">No admin decision on this page yet.</li> : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
