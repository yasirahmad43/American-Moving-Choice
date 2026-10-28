import { listMailbox, mailboxTemplates } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { Alert, PageHeader } from "@amc/ui";
import type { Metadata } from "next";
import { FilterBar, FilterInput, FilterSelect, Pager, Status, When, humanize, pageNumber, param, qs } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/mailbox");

export const metadata: Metadata = { title: `${item.label} · Admin`, referrer: "no-referrer" };

const PER_PAGE = 50;

/**
 * The outbox as admins may see it (canViewMessage / mailboxBody in @amc/server/outbox): messages
 * whose links can take over or create an account are hidden from ops and support, and their links
 * show only to a super admin in demo mode.
 */
export default async function MailboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const filters = { q: param(sp.q).slice(0, 120), template: param(sp.template), status: param(sp.status) };
  const page = pageNumber(sp.page);
  const demoMode = env().DEMO_MODE;
  const [{ rows, total }, templates] = await Promise.all([
    listMailbox({ adminRole, demoMode }, { q: filters.q || null, template: filters.template || null, status: filters.status || null, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    mailboxTemplates({ adminRole }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description={item.description} />
      <Alert tone="info">
        {adminRole === "super_admin"
          ? demoMode
            ? "You can open password-reset and invitation links here because this is a demo build. Treat them as passwords."
            : "Password-reset and invitation links stay hidden: they go to the recipient only."
          : "Password-reset and invitation emails are not listed for your role."}
      </Alert>
      <FilterBar resetHref="/admin/mailbox">
        <FilterInput id="q" name="q" label="Recipient" value={filters.q} />
        <FilterSelect id="template" name="template" label="Template" value={filters.template} options={templates.map((t) => ({ value: t, label: humanize(t) }))} />
        <FilterSelect id="status" name="status" label="Status" value={filters.status} options={["queued", "sending", "sent", "demo", "failed"].map((s) => ({ value: s, label: humanize(s) }))} />
      </FilterBar>
      {rows.length === 0 ? <p className="text-text-2">No messages.</p> : null}
      <ul className="grid gap-3">
        {rows.map((m) => (
          <li key={m.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-text">{m.subject ?? humanize(m.template)}</p>
                <p className="type-small text-text-2 break-all">
                  {humanize(m.channel)} to {m.to_address} · {humanize(m.template)} · <When value={m.created_at} />
                </p>
              </div>
              <span className="flex items-center gap-2">
                {m.sensitive ? <Status value="pending" label="Contains a private link" /> : null}
                <Status value={m.status} />
              </span>
            </div>
            {m.error ? <p className="mt-2 type-small text-error">Delivery error: {m.error} (attempts {m.attempts})</p> : null}
            <details className="mt-2">
              <summary className="min-h-11 cursor-pointer py-2 type-small font-semibold text-link">Show message</summary>
              <pre className="mt-1 rounded-control bg-surface-2 p-3 font-sans text-[0.9375rem] whitespace-pre-wrap break-words text-text">{m.body}</pre>
            </details>
          </li>
        ))}
      </ul>
      <Pager page={page} total={total} perPage={PER_PAGE} hrefFor={(p) => `/admin/mailbox${qs({ ...filters, page: p })}`} />
    </div>
  );
}
