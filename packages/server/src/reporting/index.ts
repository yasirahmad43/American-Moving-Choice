import "server-only";
import { env } from "../env";
import { createReportingService } from "./service";
import type { ReportingSnapshot } from "./types";
import { bingConnectionManager } from "./bing-connection";

export type * from "./types";
export { beginBingConnection, completeBingConnection, bingConnectionAvailable, getBingConnectionStatus, BingConnectionError } from "./bing-connection";
export type { BingConnectionStatus, BingConnectionIdentity } from "./bing-connection";

let snapshotReader: (() => Promise<ReportingSnapshot>) | undefined;

/** Admin callers must authorize first. This function performs fixed read-only provider requests only. */
export async function reportingSnapshot(): Promise<ReportingSnapshot> {
  const bing = bingConnectionManager();
  snapshotReader ??= createReportingService(env(), { bingAccessToken: bing.accessToken, bingInvalidateAccessToken: bing.invalidateAccessToken });
  return snapshotReader();
}
