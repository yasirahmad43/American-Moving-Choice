/**
 * Health check. Anonymous callers get only {status, migrations}; with
 * `Authorization: Bearer $CRON_SECRET` the response adds database latency, the latest migration,
 * demo mode and which integrations hold live credentials. Never returns secrets, connection
 * details or error text (driver errors can name hosts). The database probe is cached for a few
 * seconds per instance, so repeated calls can't tie up the small connection pool.
 */
import { getPool } from "@amc/server/db";
import { describeEnv, env } from "@amc/server/env";
import { safeEqual } from "@amc/server/auth";

export const dynamic = "force-dynamic";

const PROBE_TTL_MS = 5_000;

interface Probe {
  reachable: boolean;
  latencyMs: number | null;
  migrations: number | null;
  latestMigration: string | null;
  at: number;
}

let cached: Probe | null = null;
let inFlight: Promise<Probe> | null = null;

async function probeDatabase(): Promise<Probe> {
  const probe: Probe = { reachable: false, latencyMs: null, migrations: null, latestMigration: null, at: Date.now() };
  const started = performance.now();
  try {
    const result = await getPool().query<{ count: number | null; latest: string | null }>(
      `select case when to_regclass('schema_migrations') is null then null
              else (select count(*)::int from schema_migrations) end as count,
              case when to_regclass('schema_migrations') is null then null
              else (select max(name) from schema_migrations) end as latest`,
    );
    probe.reachable = true;
    probe.migrations = result.rows[0]?.count ?? null;
    probe.latestMigration = result.rows[0]?.latest ?? null;
    probe.latencyMs = Math.round(performance.now() - started);
  } catch {
    probe.reachable = false;
  }
  return probe;
}

async function cachedProbe(): Promise<Probe> {
  if (cached && Date.now() - cached.at < PROBE_TTL_MS) return cached;
  inFlight ??= probeDatabase().finally(() => {
    inFlight = null;
  });
  cached = await inFlight;
  return cached;
}

function isOperator(request: Request, cronSecret: string | undefined): boolean {
  const header = request.headers.get("authorization");
  return Boolean(cronSecret && header?.startsWith("Bearer ") && safeEqual(header.slice(7), cronSecret));
}

export async function GET(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  let summary: ReturnType<typeof describeEnv>;
  let cronSecret: string | undefined;
  try {
    const e = env();
    summary = describeEnv(e);
    cronSecret = e.CRON_SECRET;
  } catch {
    return Response.json({ status: "error" }, { status: 500, headers });
  }

  const database = await cachedProbe();
  const status = database.reachable ? "ok" : "degraded";
  const code = database.reachable ? 200 : 503;
  if (!isOperator(request, cronSecret)) {
    return Response.json({ status, migrations: database.migrations }, { status: code, headers });
  }
  return Response.json(
    {
      status,
      time: new Date().toISOString(),
      database: { reachable: database.reachable, latencyMs: database.latencyMs, migrations: database.migrations, latestMigration: database.latestMigration },
      demoMode: summary.demoMode,
      integrations: summary.integrations,
    },
    { status: code, headers },
  );
}
