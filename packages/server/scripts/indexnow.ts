/** Explicit operator CLI. Default is a read-only public inventory/plan; --submit sends URLs. */
import { open, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  collectPublishedInventory, INDEXNOW_ENDPOINT, INDEXNOW_KEY_PATH, newIndexNowLedger,
  parseIndexNowLedger, planIndexNow, submitIndexNow, validateIndexNowKey,
} from "../src/indexing/indexnow";

const root = fileURLToPath(new URL("../../../", import.meta.url));
async function main(): Promise<void> {
  const { values } = parseArgs({ options: {
    site: { type: "string" }, "key-file": { type: "string" }, out: { type: "string" }, revision: { type: "string" },
    "batch-size": { type: "string" }, limit: { type: "string" }, submit: { type: "boolean", default: false },
    "retry-uncertain": { type: "boolean", default: false }, help: { type: "boolean", default: false },
  } });
  if (values.help) {
    console.log("indexnow.ts --site https://www.example.com --key-file work/tracking/indexnow-key.txt [--out work/tracking/indexnow] [--revision meaningful-content-version] [--batch-size 1000] [--limit 10000] [--submit] [--retry-uncertain]");
    return;
  }
  const site = values.site ?? process.env.WEB_URL;
  if (!site) throw new Error("Provide --site or WEB_URL for the canonical public origin");
  const key = validateIndexNowKey(values["key-file"] ? (await readFile(resolve(root, values["key-file"]), "utf8")).trim() : process.env.INDEXNOW_KEY?.trim() ?? "");
  const options = { key, batchSize: values["batch-size"] === undefined ? undefined : Number(values["batch-size"]), limit: values.limit === undefined ? undefined : Number(values.limit), revision: values.revision, retryUncertain: values["retry-uncertain"] };
  const out = resolve(root, values.out ?? "work/tracking/indexnow"); await mkdir(out, { recursive: true });
  const lock = await open(resolve(out, ".lock"), "wx").catch(() => { throw new Error("An IndexNow run already owns this evidence directory; inspect its lock before retrying"); });
  const stamp = `${new Date().toISOString().replace(/[:.]/gu, "-")}-${randomBytes(4).toString("hex")}`;
  const evidencePath = resolve(out, `${stamp}.json`), ledgerPath = resolve(out, "ledger.json");
  let evidence: Record<string, unknown> = { mode: values.submit ? "submit" : "plan", startedAt: new Date().toISOString(), endpoint: INDEXNOW_ENDPOINT, keyLocation: `${site.replace(/\/+$/u, "")}${INDEXNOW_KEY_PATH}`, deliveryMeaning: "HTTP 200 means received; HTTP 202 means received with key verification pending. Neither confirms indexing or rankings." };
  try {
    const inventory = await collectPublishedInventory(site);
    let ledger = newIndexNowLedger(inventory.site, key);
    try {
      const bytes = await readFile(ledgerPath);
      if (bytes.byteLength > 64_000_000) throw new Error("IndexNow ledger exceeds its byte limit");
      ledger = parseIndexNowLedger(JSON.parse(bytes.toString("utf8")), inventory.site, key);
    } catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error; }
    const plan = planIndexNow(inventory, ledger, options);
    evidence = { ...evidence, source: inventory, plan, completedAt: null };
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx" });
    if (values.submit) {
      const persist = async (updated: typeof ledger) => {
        const temporary = `${ledgerPath}.${stamp}.tmp`;
        await writeFile(temporary, `${JSON.stringify(updated, null, 2)}\n`, { flag: "wx" });
        await rename(temporary, ledgerPath);
      };
      const result = await submitIndexNow(inventory, ledger, { ...options, persist });
      evidence = { ...evidence, result };
      if (result.outcome === "partial" || plan.heldUncertain || plan.heldRateLimited) process.exitCode = 1;
    }
    evidence.completedAt = new Date().toISOString();
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(JSON.stringify({ mode: evidence.mode, publishedUrls: inventory.urls.length, plannedUrls: plan.chunks.flat().length, chunks: plan.chunks.length, skippedReceived: plan.skippedReceived, heldUncertain: plan.heldUncertain, heldRateLimited: plan.heldRateLimited, remaining: plan.remaining, result: evidence.result ?? null, evidencePath, ledgerPath: values.submit ? ledgerPath : null }));
  } catch (error) {
    evidence = { ...evidence, completedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "IndexNow run failed" };
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
    throw error;
  } finally { await lock.close(); await rm(resolve(out, ".lock")); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : "IndexNow run failed"); process.exitCode = 1; });
