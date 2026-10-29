import { env } from "../env/env";
import type { Env } from "../env/schema";

/** Owner-requested demo sign-in. Real deployments and company users keep their MFA policy. */
export function demoAdminPasswordOnly(adminRole: string | null, configuration: Pick<Env, "DEMO_MODE" | "DEMO_ADMIN_PASSWORD_ONLY"> = env()): boolean {
  return adminRole !== null && configuration.DEMO_MODE && configuration.DEMO_ADMIN_PASSWORD_ONLY;
}
