import { createBingReporter, hasBingCredentials } from "./bing";
import { notConfigured, providerCache } from "./cache";
import { createGoogleReporters, hasGoogleCredentials } from "./google";
import type { BingReportingData, Ga4ReportingData, ReportingConfiguration, ReportingDependencies, ReportingSnapshot, SearchConsoleReportingData, TagManagerReportingData } from "./types";

/** Process-local cache; serverless cold starts may refresh sooner, never fabricate a persisted success. */
export function createReportingService(
  config: ReportingConfiguration,
  dependencies: ReportingDependencies = {},
): () => Promise<ReportingSnapshot> {
  const now = dependencies.now ?? Date.now;
  const fetcher = dependencies.fetch ?? globalThis.fetch.bind(globalThis);
  const google = createGoogleReporters(config, { fetch: fetcher, now });
  const configuredGoogle = hasGoogleCredentials(config);
  const ga4 = configuredGoogle ? providerCache(30_000, now, google.ga4) : async () => notConfigured<Ga4ReportingData>();
  const searchConsole = configuredGoogle ? providerCache(1_800_000, now, google.searchConsole) : async () => notConfigured<SearchConsoleReportingData>();
  const tagManager = configuredGoogle ? providerCache(300_000, now, google.tagManager) : async () => notConfigured<TagManagerReportingData>();
  const bing = hasBingCredentials(config)
    ? providerCache(21_600_000, now, createBingReporter(config, { fetch: fetcher, now }))
    : async () => notConfigured<BingReportingData>();

  return async () => {
    const [ga4Result, searchResult, tagResult, bingResult] = await Promise.all([ga4(), searchConsole(), tagManager(), bing()]);
    return {
      generatedAt: new Date(now()).toISOString(), ga4: ga4Result, searchConsole: searchResult,
      tagManager: tagResult, bing: bingResult,
    };
  };
}
