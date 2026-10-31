import "server-only";
import { env } from "../env";
import { createReportingService } from "./service";
import type { ReportingSnapshot } from "./types";

export type * from "./types";

let snapshotReader: (() => Promise<ReportingSnapshot>) | undefined;

/** Admin callers must authorize first. This function performs fixed read-only provider requests only. */
export async function reportingSnapshot(): Promise<ReportingSnapshot> {
  snapshotReader ??= createReportingService(env());
  return snapshotReader();
}
