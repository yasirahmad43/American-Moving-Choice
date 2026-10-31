/** Aggregate reporting only. Credentials, provider errors and raw responses never enter these DTOs. */
export type ReportingStatus = "connected" | "not_configured" | "access_denied" | "unavailable";

export interface ProviderSnapshot<T> {
  status: ReportingStatus;
  checkedAt: string | null;
  reportedThrough: string | null;
  data: T | null;
}

export const REPORTING_EVENTS = ["page_view", "survey_start", "survey_step", "generate_lead"] as const;
export type ReportingEvent = (typeof REPORTING_EVENTS)[number];

export interface Ga4ReportingData {
  windowMinutes: 30;
  activeUsers: number;
  screenPageViews: number;
  events: Record<ReportingEvent, number>;
}

export interface SearchConsoleSitemap {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  errors: number;
  warnings: number;
  submittedUrls: number;
}

export interface SearchConsoleReportingData {
  siteUrl: string;
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
  sitemaps: SearchConsoleSitemap[];
}

export interface TagManagerReportingData {
  versionId: string;
  tagCount: number;
}

export interface BingReportingData {
  siteUrl: string;
  traffic: { date: string; clicks: number; impressions: number }[];
  feeds: { url: string; status: string; lastCrawled: string | null; submitted: string | null; urlCount: number }[];
}

export interface ReportingSnapshot {
  generatedAt: string;
  ga4: ProviderSnapshot<Ga4ReportingData>;
  searchConsole: ProviderSnapshot<SearchConsoleReportingData>;
  tagManager: ProviderSnapshot<TagManagerReportingData>;
  bing: ProviderSnapshot<BingReportingData>;
}

/** Server-only configuration; never include this object in a rendered response. */
export interface ReportingConfiguration {
  WEB_URL: string;
  GOOGLE_REPORTING_CLIENT_EMAIL?: string;
  GOOGLE_REPORTING_PRIVATE_KEY?: string;
  GOOGLE_REPORTING_PROPERTY_ID?: string;
  GOOGLE_REPORTING_GTM_ACCOUNT_ID?: string;
  GOOGLE_REPORTING_GTM_CONTAINER_ID?: string;
  GOOGLE_REPORTING_SITE_URL?: string;
  BING_REPORTING_CLIENT_ID?: string;
  BING_REPORTING_CLIENT_SECRET?: string;
  BING_REPORTING_REFRESH_TOKEN?: string;
  BING_REPORTING_SITE_URL?: string;
}

export interface ReportingDependencies {
  fetch?: typeof globalThis.fetch;
  now?: () => number;
}
