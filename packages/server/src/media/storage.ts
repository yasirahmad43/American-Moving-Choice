import { AdminError } from "../admin/common";

export interface MediaStorageConfig { url: string; key: string; bucket: string }
export interface StoredObject { path: string; bytes: number }

/** No demo success: uploads require a configured, existing public bucket in every environment. */
export function mediaStorageConfig(env: NodeJS.ProcessEnv = process.env): MediaStorageConfig {
  const raw = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = env.SUPABASE_MEDIA_BUCKET?.trim();
  if (!raw || !key || !bucket) throw new AdminError("Media uploads are unavailable. Configure SUPABASE_URL, SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) and SUPABASE_MEDIA_BUCKET on the app server.", "storage_not_configured");
  if (key.startsWith("sb_publishable_")) throw new AdminError("Media storage requires a server secret key, not a publishable key.", "storage_not_configured");
  let url: URL;
  try { url = new URL(raw); } catch { throw new AdminError("SUPABASE_URL must be a valid project URL.", "storage_not_configured"); }
  const local = env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash || url.pathname !== "/" || !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(bucket)) {
    throw new AdminError("Configure a secure Supabase project URL and a valid media bucket name.", "storage_not_configured");
  }
  return { url: url.origin, key, bucket };
}

export class SupabaseMediaStorage {
  constructor(readonly config: MediaStorageConfig, private readonly fetcher: typeof fetch = fetch) {}

  private async request(path: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetcher(`${this.config.url}/storage/v1${path}`, {
        ...init, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(30_000),
        // New sb_secret_ keys are opaque API keys, never bearer JWTs. The legacy service_role
        // JWT continues to work through both headers during an incremental migration.
        headers: { apikey: this.config.key, ...(!this.config.key.startsWith("sb_secret_") ? { Authorization: `Bearer ${this.config.key}` } : {}), ...init.headers },
      });
    } catch {
      throw new AdminError("Media storage could not be reached. No upload was saved. Please try again.", "storage_unavailable");
    }
  }

  async assertPublicBucket(): Promise<void> {
    const response = await this.request(`/bucket/${encodeURIComponent(this.config.bucket)}`, { method: "GET" });
    if (!response.ok) throw new AdminError(`Media storage is unavailable (bucket check ${response.status}). Check the server credential and bucket configuration.`, "storage_unavailable");
    const bucket = await response.json().catch(() => null) as { public?: boolean } | null;
    if (bucket?.public !== true) throw new AdminError("The media bucket must allow public reads so published images can load. No upload was saved.", "storage_private_bucket");
  }

  publicUrl(path: string): string {
    return `${this.config.url}/storage/v1/object/public/${encodeURIComponent(this.config.bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  }

  async upload(path: string, data: Uint8Array): Promise<void> {
    if (!/^uploads\/[a-z0-9_-]+\/[a-z0-9_-]+\.webp$/.test(path)) throw new Error("Invalid generated media storage key");
    const response = await this.request(`/object/${encodeURIComponent(this.config.bucket)}/${path}`, {
      method: "POST", headers: { "Content-Type": "image/webp", "Cache-Control": "31536000", "x-upsert": "false" }, body: Buffer.from(data),
    });
    if (!response.ok) throw new AdminError(`Media storage refused the upload (${response.status}). No library entry was created.`, "storage_upload_failed");
  }

  /** Called only for fresh random keys belonging to an upload whose DB transaction failed. */
  async remove(paths: string[]): Promise<void> {
    if (!paths.length) return;
    if (paths.some((path) => !/^uploads\/[a-z0-9_-]+\/[a-z0-9_-]+\.webp$/.test(path))) throw new Error("Invalid generated media cleanup key");
    const response = await this.request(`/object/${encodeURIComponent(this.config.bucket)}`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: paths }),
    });
    if (!response.ok) throw new AdminError("The incomplete upload could not be cleaned up. Contact an administrator before retrying.", "storage_cleanup_failed");
  }
}
