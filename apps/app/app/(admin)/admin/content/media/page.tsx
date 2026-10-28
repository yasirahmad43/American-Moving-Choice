import { listMedia, uploadsFootprint, type MediaClaimState, type MediaFilters } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { Field, Input, PageHeader, Select, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { FilterBar, FilterInput, FilterSelect, Pager, SectionTitle, StatTile, Status, humanize, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../../_lib/roles";
import { assignMediaAction, rejectMediaAction, restoreMediaAction, unclaimMediaAction, uploadMediaAction } from "./actions";

const item = adminNavItem("/admin/content/media");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const PER_PAGE = 36;
const STATES: { value: MediaClaimState; label: string }[] = [
  { value: "unclaimed", label: "Unclaimed" },
  { value: "claimed", label: "Claimed by a page" },
  { value: "static", label: "Used on a static page" },
  { value: "rejected", label: "Rejected" },
];
const STATE_TONE: Record<MediaClaimState, string> = { unclaimed: "available", claimed: "live", static: "submitted", rejected: "rejected" };

export default async function MediaLibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const filters: MediaFilters = {
    tag: param(sp.tag),
    family: param(sp.family),
    state: param(sp.state) as MediaFilters["state"],
    kind: param(sp.kind) as MediaFilters["kind"],
    q: param(sp.q).slice(0, 100),
  };
  const page = pageNumber(sp.page);
  const library = await listMedia({ ...filters, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  const footprint = uploadsFootprint();
  const webUrl = env().WEB_URL;
  const canAct = hasAdminRole(adminRole, ROLES.content);
  const query = { tag: filters.tag, family: filters.family, state: filters.state, kind: filters.kind, q: filters.q };
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description={`${item.description} One asset belongs to one page; the manifest's usedOn follows the claims in seo_media_usage.`} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATES.map((s) => (
          <StatTile key={s.value} label={s.label} value={library.counts[s.value]} href={`/admin/content/media${qs({ state: s.value })}`} />
        ))}
      </div>
      <FilterBar resetHref="/admin/content/media">
        <FilterInput id="q" name="q" label="ID, alt text, prompt or page" value={filters.q ?? ""} />
        <FilterSelect id="family" name="family" label="Family (first tag)" value={filters.family ?? ""} options={library.families.map((f) => ({ value: f, label: humanize(f) }))} />
        <FilterSelect id="tag" name="tag" label="Tag" value={filters.tag ?? ""} options={library.tags.map((t) => ({ value: t, label: t }))} />
        <FilterSelect id="state" name="state" label="Claim state" value={filters.state ?? ""} options={STATES} />
        <FilterSelect id="kind" name="kind" label="Kind" value={filters.kind ?? ""} options={[{ value: "image", label: "Image" }, { value: "video", label: "Video" }]} />
      </FilterBar>
      <section aria-labelledby="grid">
        <SectionTitle id="grid">
          Assets ({library.total})
        </SectionTitle>
        {library.rows.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {library.rows.map((a) => (
              <li key={a.id} className="grid content-start gap-2 rounded-card border border-border bg-surface p-3 shadow-e1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${webUrl}${a.thumb}`} alt={a.alt} width={a.width} height={a.height} loading="eager" className="aspect-video w-full rounded-control bg-surface-2 object-cover" />
                <div className="flex flex-wrap items-center gap-2">
                  <Status value={STATE_TONE[a.state]} label={STATES.find((s) => s.value === a.state)?.label ?? a.state} />
                  <span className="type-small text-text-2">
                    {a.kind} · {a.width}×{a.height} · {a.family}
                  </span>
                </div>
                <p className="font-mono text-[0.8125rem] break-all">{a.id}</p>
                <p className="type-small text-text">{a.alt}</p>
                <dl className="grid gap-0.5 type-small text-text-2">
                  <div>
                    <dt className="inline font-semibold">Credit: </dt>
                    <dd className="inline">{a.credit.creator}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Licence: </dt>
                    <dd className="inline">
                      {a.credit.license}
                      {a.credit.attribution_required ? " (attribution required)" : ""}
                    </dd>
                  </div>
                  {a.prompt ? (
                    <div>
                      <dt className="inline font-semibold">Prompt{a.model ? ` (${a.model})` : ""}: </dt>
                      <dd className="inline">{a.prompt}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="inline font-semibold">Used on: </dt>
                    <dd className="inline">
                      {a.usedOn.length
                        ? a.usedOn.map((u, i) => (
                            <span key={u}>
                              {i ? ", " : ""}
                              {a.claimedBy ? (
                                <Link href={`/admin/content/${a.claimedBy.pageId}`} className="font-mono text-link underline">
                                  {u}
                                </Link>
                              ) : (
                                <span className="font-mono">{u}</span>
                              )}
                            </span>
                          ))
                        : "No page"}
                    </dd>
                  </div>
                  {a.rejected ? (
                    <div>
                      <dt className="inline font-semibold">Rejected: </dt>
                      <dd className="inline">{a.rejected.reason}</dd>
                    </div>
                  ) : null}
                  {a.upload ? (
                    <div>
                      <dt className="inline font-semibold">Upload: </dt>
                      <dd className="inline">
                        {a.upload.originalName}, {a.upload.at.slice(0, 10)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <p className="flex flex-wrap gap-1 type-small text-text-3">{a.tags.join(" · ")}</p>
                {canAct ? (
                  <details className="mt-1">
                    <summary className="min-h-11 cursor-pointer py-2 type-small font-semibold text-link">Actions</summary>
                    <div className="grid gap-4 pt-2">
                      {a.rejected ? (
                        <ActionForm action={restoreMediaAction} submitLabel="Restore" submitVariant="secondary">
                          <input type="hidden" name="mediaId" value={a.id} />
                        </ActionForm>
                      ) : (
                        <>
                          {a.kind === "image" && a.state !== "static" ? (
                            <ActionForm action={assignMediaAction} submitLabel={a.claimedBy ? "Reassign" : "Assign"} submitVariant="secondary" resetOnSuccess={false}>
                              <input type="hidden" name="mediaId" value={a.id} />
                              <Field id={`assign-${a.id}`} label="Page URL" help="A programmatic page, such as /movers/texas/. The asset leaves the page that holds it.">
                                <Input name="pageUrl" defaultValue={a.claimedBy?.url ?? ""} placeholder="/movers/texas/" />
                              </Field>
                            </ActionForm>
                          ) : null}
                          {a.claimedBy ? (
                            <ActionForm action={unclaimMediaAction} submitLabel="Unclaim" submitVariant="secondary">
                              <input type="hidden" name="mediaId" value={a.id} />
                            </ActionForm>
                          ) : null}
                          <ActionForm action={rejectMediaAction} submitLabel="Reject" submitVariant="danger" confirm={{ title: `Reject ${a.id}?`, description: "The asset is hidden from claims and taken off any page holding it. It can be restored later.", confirmLabel: "Reject" }}>
                            <input type="hidden" name="mediaId" value={a.id} />
                            <Field id={`reject-${a.id}`} label="Reason" required>
                              <Input name="reason" required minLength={3} maxLength={500} />
                            </Field>
                          </ActionForm>
                        </>
                      )}
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-2">No assets match these filters.</p>
        )}
      </section>
      <Pager page={page} total={library.total} perPage={PER_PAGE} hrefFor={(p) => `/admin/content/media${qs({ ...query, page: p })}`} />
      {canAct ? (
        <section aria-labelledby="upload" className="grid gap-4 rounded-card border border-border bg-surface p-4">
          <SectionTitle id="upload" description={`Stored under apps/web/public/media/uploads in the library's tiers (WebP at the capped native width and at 800px, plus a blur placeholder) and added to the manifest unclaimed. A file whose SHA-256 the library already holds is refused. Uploads so far: ${footprint.files} files, ${(footprint.bytes / 1048576).toFixed(1)} MB.`}>
            Upload an image
          </SectionTitle>
          <ActionForm action={uploadMediaAction} submitLabel="Upload" className="max-w-2xl">
            <Field id="file" label="Image (PNG, JPEG or WebP, at least 800×450, up to 20 MB)" required>
              <Input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
            </Field>
            <Field id="alt" label="Alt text" required>
              <Input name="alt" required minLength={3} maxLength={300} />
            </Field>
            <Field id="tags" label="Tags (comma separated; the first is the family)" required help="For example: state, state:TX, hero. The orientation tag is added from the image.">
              <Input name="tags" required placeholder="state, state:TX, hero" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="creator" label="Credit: creator" required>
                <Input name="creator" required minLength={3} maxLength={200} />
              </Field>
              <Field id="license" label="Credit: licence" required>
                <Input name="license" required minLength={3} maxLength={300} />
              </Field>
              <Field id="sourceUrl" label="Credit: source URL" optional>
                <Input name="sourceUrl" type="url" maxLength={500} />
              </Field>
              <Field id="attributionRequired" label="Attribution required" required>
                <Select name="attributionRequired" defaultValue="false">
                  <option value="false">No</option>
                  <option value="true">Yes (the credit line renders on the page)</option>
                </Select>
              </Field>
            </div>
            <Field id="prompt" label="Generation prompt" optional help="For AI-generated images, the prompt used.">
              <Textarea name="prompt" rows={2} maxLength={1000} />
            </Field>
          </ActionForm>
        </section>
      ) : null}
    </div>
  );
}
