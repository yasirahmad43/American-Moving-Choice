import { randomUUID } from "node:crypto";
import { AdminError } from "../admin/common";
import { mediaStorageConfig, SupabaseMediaStorage } from "./storage";

/** Optional deployment proof. No manifest/DB entry, customer input, or persistent test object. */
export async function verifyMediaStorage(options: {
  env?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch;
  log?: (line: string) => void;
} = {}): Promise<{ skipped: boolean }> {
  const env = options.env ?? process.env;
  if (env.AMC_VERIFY_MEDIA_STORAGE?.trim().toLowerCase() !== "true") return { skipped: true };
  const log = options.log ?? console.log;
  const fetcher = options.fetcher ?? fetch;
  let config;
  try {
    config = mediaStorageConfig(env);
  } catch (error) {
    log("media-storage-probe: failed (storage_not_configured)");
    throw error;
  }
  const store = new SupabaseMediaStorage(config, fetcher);
  const path = `uploads/storage-check-${randomUUID()}/readiness.webp`;
  let mayExist = false;
  let failure: AdminError | null = null;
  try {
    await store.assertPublicBucket();
    const sharp = (await import("sharp")).default;
    const image = await sharp({ create: { width: 800, height: 450, channels: 3, background: "#0c1f3f" } }).webp({ quality: 70 }).toBuffer();
    mayExist = true; // A timed-out write can still have reached Storage; its fresh key is ours.
    try {
      await store.upload(path, image);
    } catch (error) {
      if (error instanceof AdminError && error.code === "storage_upload_failed") mayExist = false;
      throw error;
    }
    // Deliberately omit all credentials: this proves the image is publicly retrievable.
    const response = await fetcher(store.publicUrl(path), { method: "GET", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new AdminError(`Media storage probe could not read the public test image (${response.status}).`, "storage_probe_read_failed");
    if (response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "image/webp") {
      throw new AdminError("Media storage probe received the wrong public image type.", "storage_probe_read_failed");
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.equals(image)) throw new AdminError("Media storage probe received different public image bytes.", "storage_probe_read_failed");
  } catch (error) {
    // Provider/network exception messages can contain request headers. Never log or rethrow them.
    failure = error instanceof AdminError ? error : new AdminError("Media storage probe could not verify the temporary image.", "storage_probe_failed");
  } finally {
    if (mayExist) {
      try {
        await store.remove([path]);
      } catch {
        failure = new AdminError(`Media storage probe could not remove its temporary image at ${path}. Verification failed; inspect this fresh test key before retrying.`, "storage_probe_cleanup_failed");
      }
    }
  }
  if (failure) {
    log(`media-storage-probe: failed (${failure.code})`);
    throw failure;
  }
  log("media-storage-probe: verified write/read/delete (800x450 WebP; temporary object removed)");
  return { skipped: false };
}
