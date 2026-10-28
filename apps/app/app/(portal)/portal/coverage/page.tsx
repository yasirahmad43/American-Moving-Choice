import { requireMembership } from "@amc/server/auth";
import {
  COVERAGE_LIMITS,
  MOVE_SIZES,
  MOVE_SIZE_LABELS,
  MOVE_TYPES,
  MOVE_TYPE_LABELS,
  SERVICES,
  SERVICE_SHORT_LABELS,
  getCoverage,
} from "@amc/server/coverage";
import { countyByFips, statesList } from "@amc/server/geo";
import { PageHeader } from "@amc/ui";
import type { Metadata } from "next";
import { portalNavItem } from "@/lib/nav/portal";
import { CoverageEditor } from "@/components/portal/onboarding/coverage-editor";

const item = portalNavItem("/portal/coverage");

export const metadata: Metadata = { title: item.label };

/** Coverage rules, the capability ceiling and the "test a move" tool (owners and managers). */
export default async function CoveragePage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const coverage = await getCoverage({ userId: user.id, companyId: membership.companyId });
  const countyNames: Record<string, string> = {};
  for (const rule of coverage.rules) {
    for (const fips of [...rule.origin.counties, ...rule.destination.counties]) {
      const county = countyByFips(fips);
      if (county) countyNames[fips] = `${county.name}, ${county.state}`;
    }
  }
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title="Coverage" description="Where you move people and which moves you take. Requests reach you only inside this coverage." />
      <CoverageEditor
        rules={coverage.rules.map((r) => ({
          id: r.id,
          kind: r.kind,
          label: r.label,
          origin: r.origin,
          destination: r.destination,
          moveTypes: r.moveTypes,
          moveSizes: r.moveSizes,
          services: r.services,
          paused: r.paused,
          updatedAt: r.updatedAt.toISOString(),
        }))}
        capabilities={coverage.capabilities}
        coverageVersion={coverage.coverageVersion}
        options={{
          states: statesList().map((s) => ({ value: s.code, label: s.name })),
          moveTypes: MOVE_TYPES.map((v) => ({ value: v, label: MOVE_TYPE_LABELS[v] })),
          moveSizes: MOVE_SIZES.map((v) => ({ value: v, label: MOVE_SIZE_LABELS[v] })),
          services: SERVICES.map((v) => ({ value: v, label: SERVICE_SHORT_LABELS[v] })),
        }}
        countyNames={countyNames}
        limits={{ zipsPerSide: COVERAGE_LIMITS.zipsPerSide, countiesPerSide: COVERAGE_LIMITS.countiesPerSide, rulesPerCompany: COVERAGE_LIMITS.rulesPerCompany }}
      />
    </div>
  );
}
