import { listSharingPolicies } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { many } from "@amc/server/db";
import { getSettings } from "@amc/server/settings";
import { Card, Field, Input, Money, PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { Mono, SectionTitle, Status, When } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { activatePolicyAction, createPolicyAction } from "./actions";

const item = adminNavItem("/admin/pricing");

export const metadata: Metadata = { title: `${item.label} · Admin` };

export default async function PricingPage() {
  await requireAdmin({ roles: item.roles });
  const [policies, settings, prices] = await Promise.all([
    listSharingPolicies(),
    getSettings(),
    many<{ id: string; legal_name: string; status: string; exclusive_cents: number | null; shared_cents: number | null; effective_from: Date | null }>(
      `select c.id, c.legal_name, c.status, p.exclusive_cents, p.shared_cents, p.effective_from
       from companies c left join lateral (select * from current_price(c.id)) p on true
       where c.status in ('approved', 'suspended') order by c.legal_name`,
    ),
  ]);
  return (
    <div className="grid gap-8">
      <PageHeader size="portal" title={item.label} description="Sharing policy versions and each company's current prices. Prices are set per company (append-only); purchases keep the price row and policy version they used." />

      <section aria-labelledby="policies" className="grid gap-4">
        <SectionTitle id="policies" description={<>Factor n applies once a shared request has n buyers. The maximum movers per request is {settings.max_sharing_limit} (<Link className="text-link underline" href="/admin/settings">settings</Link>); the active policy must cover at least that many buyers.</>}>
          Sharing policies
        </SectionTitle>
        <Table
          caption="Sharing policy versions"
          hideCaption
          rowKey={(r) => r.version}
          rows={policies}
          columns={[
            { key: "version", header: "Version", cell: (r) => <Mono>{r.version}</Mono> },
            { key: "factors", header: "Factors (%)", cell: (r) => <span className="tabular">{r.factors_bp.map((f) => f / 100).join(" · ")}</span> },
            { key: "buyers", header: "Buyers covered", numeric: true, cell: (r) => r.factors_bp.length },
            { key: "groups", header: "Requests using it", numeric: true, cell: (r) => r.groups },
            { key: "created", header: "Created", cell: (r) => <When value={r.created_at} date /> },
            {
              key: "active",
              header: "Active",
              cell: (r) =>
                r.version === settings.active_policy_version ? (
                  <Status value="approved" label="Active" />
                ) : (
                  <ActionForm
                    action={activatePolicyAction}
                    submitLabel="Activate"
                    submitVariant="secondary"
                    confirm={{ title: `Activate ${r.version}?`, description: "New requests use this policy. Requests already submitted keep theirs.", confirmLabel: "Activate" }}
                  >
                    <input type="hidden" name="version" value={r.version} />
                  </ActionForm>
                ),
            },
          ]}
        />
        <Card title="New policy version" titleAs="h3" description="Policies are never edited. Start at 100 and never increase, e.g. 100, 80, 65, 55, 50.">
          <ActionForm action={createPolicyAction} submitLabel="Create version">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="policy-version" label="Version name" required help="Lowercase letters, numbers and hyphens.">
                <Input name="version" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={60} />
              </Field>
              <Field id="policy-factors" label="Factors (%)" required help="Comma-separated, first one 100.">
                <Input name="factors" required maxLength={200} />
              </Field>
            </div>
          </ActionForm>
        </Card>
      </section>

      <section aria-labelledby="prices">
        <SectionTitle id="prices" description="Change a company's prices from its Prices tab.">Current company prices</SectionTitle>
        <Table
          caption="Current company prices"
          hideCaption
          compact
          rowKey={(r) => r.id}
          rows={prices}
          columns={[
            { key: "company", header: "Company", cell: (r) => <Link className="text-link underline" href={`/admin/companies/${r.id}?tab=prices`}>{r.legal_name}</Link> },
            { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
            { key: "excl", header: "Exclusive", numeric: true, cell: (r) => (r.exclusive_cents !== null ? <Money cents={r.exclusive_cents} /> : "Not set") },
            { key: "shared", header: "Shared", numeric: true, cell: (r) => (r.shared_cents !== null ? <Money cents={r.shared_cents} /> : "Not set") },
            { key: "from", header: "Since", cell: (r) => <When value={r.effective_from} date /> },
          ]}
        />
      </section>
    </div>
  );
}
