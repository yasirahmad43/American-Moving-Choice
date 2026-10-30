import { PilotError, fail } from "./contracts.mjs";

const BASE = "https://api.anthropic.com/v1/messages/batches";
export function credentials(env = process.env) {
  const key = env.ANTHROPIC_API_KEY, workspace = env.ANTHROPIC_WORKSPACE_ID;
  if (!key || !workspace) fail("credentials_missing", "ANTHROPIC_API_KEY and ANTHROPIC_WORKSPACE_ID must be supplied privately in the process environment.");
  if (/\s/.test(key) || !/^wrkspc_[A-Za-z0-9]+$/.test(workspace)) fail("credentials_invalid", "Invalid private API credential configuration.");
  return { Authorization: `Bearer ${key}`, "anthropic-workspace-id": workspace, "anthropic-version": "2023-06-01", "content-type": "application/json" };
}
export function batchPath(batchId, results = false) {
  if (!/^msgbatch_[A-Za-z0-9_-]{1,120}$/.test(batchId)) fail("batch_id", "Invalid provider batch ID.");
  return `${BASE}/${batchId}${results ? "/results" : ""}`;
}
export async function apiFetch(url, { method = "GET", body, fetchImpl = fetch, env = process.env, timeoutMs = 60_000 } = {}) {
  // Never use arbitrary result URLs or an environment-configured base URL with these credentials.
  if (!(url === BASE || /^https:\/\/api\.anthropic\.com\/v1\/messages\/batches\/msgbatch_[A-Za-z0-9_-]+(?:\/results)?$/.test(url))) fail("api_origin", "The API origin is not approved.");
  let response;
  try { response = await fetchImpl(url, { method, headers: credentials(env), ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeoutMs), redirect: "error" }); }
  catch (error) {
    if (error instanceof PilotError) throw error;
    throw new PilotError("api_network", "The provider request did not return a confirmed outcome.", { method });
  }
  if (!response.ok) {
    let type = "provider_error";
    try { const data = await response.json(); if (/^[a-z_]{1,80}$/.test(data?.error?.type ?? "")) type = data.error.type; } catch { /* Never print a provider body. */ }
    throw new PilotError("api_http", "The provider rejected or failed the request.", { status: response.status, type, method });
  }
  return response;
}
export async function createBatch(requests, options) {
  const response = await apiFetch(BASE, { ...options, method: "POST", body: { requests: requests.map(request => ({ custom_id: request.customId, params: request.params })) } });
  try { return validateBatch(await response.json()); } catch (error) { if (error instanceof PilotError) throw error; fail("api_shape", "The provider returned an unreadable batch response."); }
}
export function validateBatch(batch, expectedId) {
  if (!batch || !/^msgbatch_[A-Za-z0-9_-]{1,120}$/.test(batch.id ?? "") || (expectedId && batch.id !== expectedId) || !["in_progress", "canceling", "ended"].includes(batch.processing_status)) fail("api_shape", "The provider returned an unexpected batch shape.");
  const counts = batch.request_counts ?? {};
  const requestCounts = {};
  for (const key of ["processing", "succeeded", "errored", "canceled", "expired"]) {
    if (!Number.isSafeInteger(counts[key]) || counts[key] < 0) fail("api_shape", "The provider returned invalid request counts.");
    requestCounts[key] = counts[key];
  }
  return { id: batch.id, processingStatus: batch.processing_status, requestCounts };
}
export async function getBatch(batchId, options) {
  const response = await apiFetch(batchPath(batchId), options);
  try { return validateBatch(await response.json(), batchId); } catch (error) { if (error instanceof PilotError) throw error; fail("api_shape", "The provider returned an unreadable status response."); }
}
export async function resultLines(batchId, options) {
  const response = await apiFetch(batchPath(batchId, true), options);
  const reader = response.body?.getReader();
  if (!reader) fail("api_shape", "The provider returned no result stream.");
  const decoder = new TextDecoder();
  let carry = "", bytes = 0;
  const lines = [];
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 32 * 1024 * 1024) fail("api_size", "The result stream exceeds the bounded pilot size.");
      carry += decoder.decode(part.value, { stream: true });
      const pieces = carry.split(/\r?\n/); carry = pieces.pop();
      for (const line of pieces) if (line.trim()) lines.push(JSON.parse(line));
    }
    carry += decoder.decode(); if (carry.trim()) lines.push(JSON.parse(carry));
  } catch (error) { await reader.cancel().catch(() => undefined); if (error instanceof PilotError) throw error; fail("api_results", "The provider result stream was incomplete or invalid."); }
  return lines;
}
