import { listConsentVersions, listSharingPolicies } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { SETTING_DEFINITIONS, SETTING_KEYS, getSettings, type SettingKey } from "@amc/server/settings";
import { Card, Field, Input, PageHeader, Select, Table, Textarea } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { Mono, SectionTitle, Status, When, humanize } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { consentDecisionAction, createConsentAction, updateSettingsAction } from "./actions";

const item = adminNavItem("/admin/settings");

export const metadata: Metadata = { title: `${item.label} · Admin` };

export default async function SettingsPage() {
  await requireAdmin({ roles: item.roles });
  const [settings, consent, policies] = await Promise.all([getSettings(), listConsentVersions(), listSharingPolicies()]);
  const consentOptions = consent.filter((v) => v.kind === "contact_consent" && v.status !== "retired");
  const control = (key: SettingKey) => {
    const def = SETTING_DEFINITIONS[key];
    const value = settings[key];
    if (typeof def.default === "boolean") {
      return (
        <Select name={key} defaultValue={String(value)}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </Select>
      );
    }
    if (key === "active_policy_version") {
      return (
        <Select name={key} defaultValue={String(value)}>
          {policies.map((p) => (
            <option key={p.version} value={p.version}>
              {p.version} ({p.factors_bp.length} buyers)
            </option>
          ))}
        </Select>
      );
    }
    if (key === "active_consent_version") {
      return (
        <Select name={key} defaultValue={String(value)}>
          {consentOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} ({v.status})
            </option>
          ))}
        </Select>
      );
    }
    return <Input name={key} defaultValue={String(value)} inputMode={typeof def.default === "number" ? "decimal" : undefined} required />;
  };
  return (
    <div className="grid gap-8">
      <PageHeader
        size="portal"
        title={item.label}
        description={
          <>
            Platform settings and consent text. Sharing policies are on <Link className="text-link underline" href="/admin/pricing">Pricing and policies</Link>; admin accounts on{" "}
            <Link className="text-link underline" href="/admin/users">Admin users</Link>.
          </>
        }
      />
      <Card title="Platform settings" titleAs="h2" description="Each value is validated (the sharing limit must fit the active policy) and every change is written to the audit log.">
        <ActionForm action={updateSettingsAction} submitLabel="Save settings" resetOnSuccess={false}>
          <div className="grid gap-4 md:grid-cols-2">
            {SETTING_KEYS.map((key) => (
              <Field key={key} id={`setting-${key}`} label={SETTING_DEFINITIONS[key].label} help={SETTING_DEFINITIONS[key].description}>
                {control(key)}
              </Field>
            ))}
          </div>
        </ActionForm>
      </Card>

      <section aria-labelledby="consent" className="grid gap-4">
        <SectionTitle id="consent" description="Text a consumer saw never changes: approved versions are frozen and can only be retired. Approval records the counsel sign-off.">
          Consent text versions
        </SectionTitle>
        {consent.map((v) => (
          <Card
            key={v.id}
            as="article"
            title={<Mono>{v.id}</Mono>}
            titleAs="h3"
            description={
              <span className="flex flex-wrap items-center gap-2">
                <Status value={v.status} /> {humanize(v.kind)} · created <When value={v.created_at} date />
                {v.approved_by ? <> · approved by {v.approved_by} on <When value={v.effective_from} date /></> : null}
                {v.id === settings.active_consent_version ? <Status value="approved" label="Active" /> : null}
                <span className="tabular">· cited by {v.cited} request{v.cited === 1 ? "" : "s"}</span>
              </span>
            }
          >
            <pre className="rounded-control bg-surface-2 p-3 font-sans whitespace-pre-wrap text-text">{v.body}</pre>
            <p className="mt-2 type-small text-text-3">
              sha256 <Mono>{v.sha256}</Mono>
            </p>
            {v.status === "draft" ? (
              <ActionForm
                action={consentDecisionAction}
                submitLabel="Mark approved"
                className="mt-4"
                confirm={{ title: `Approve ${v.id}?`, description: "The text is frozen once approved. Make sure counsel signed off on exactly this text.", confirmLabel: "Approve" }}
              >
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="decision" value="approve" />
                <Field id={`approver-${v.id}`} label="Approver (counsel sign-off reference)" required>
                  <Input name="approver" required minLength={3} maxLength={200} />
                </Field>
              </ActionForm>
            ) : null}
            {v.status === "approved" && v.id !== settings.active_consent_version ? (
              <ActionForm action={consentDecisionAction} submitLabel="Retire" submitVariant="secondary" className="mt-4" confirm={{ title: `Retire ${v.id}?`, description: "It can't be used for new requests again.", confirmLabel: "Retire" }}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="decision" value="retire" />
              </ActionForm>
            ) : null}
          </Card>
        ))}
        <Card title="New draft" titleAs="h3" description="Contact-consent text must include {N}, replaced by the number of movers the consumer chose.">
          <ActionForm action={createConsentAction} submitLabel="Save draft">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="consent-id" label="Version ID" required help="Lowercase letters, numbers and hyphens, such as consent-v1.">
                <Input name="id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={60} />
              </Field>
              <Field id="consent-kind" label="Kind" required>
                <Select name="kind" required defaultValue="contact_consent">
                  <option value="contact_consent">Contact consent</option>
                  <option value="terms_privacy_ack">Terms and privacy acknowledgment</option>
                </Select>
              </Field>
            </div>
            <Field id="consent-body" label="Text" required>
              <Textarea name="body" rows={6} required minLength={20} maxLength={5000} />
            </Field>
          </ActionForm>
        </Card>
      </section>

      <Table sortable
        caption="Setting keys"
        compact
        rowKey={(k) => k}
        rows={SETTING_KEYS}
        columns={[
          { key: "key", header: "Key", cell: (k) => <Mono>{k}</Mono> },
          { key: "value", header: "Current value", cell: (k) => <Mono>{JSON.stringify(settings[k])}</Mono> },
          { key: "default", header: "Default", cell: (k) => <Mono>{JSON.stringify(SETTING_DEFINITIONS[k].default)}</Mono> },
        ]}
      />
    </div>
  );
}
