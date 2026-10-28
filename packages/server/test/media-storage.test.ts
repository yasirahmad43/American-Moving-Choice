import { describe, expect, it, vi } from "vitest";
import { mediaStorageConfig, SupabaseMediaStorage } from "../src/media/storage";
import { verifyMediaStorage } from "../src/media/storage-probe";

const config = { url: "https://media-project.supabase.co", key: "test-private-key-never-expose", bucket: "amc-media" };
const path = "uploads/upload-crew-abcd/1344.webp";

describe("durable media storage protocol", () => {
  it("fails closed without configuration and rejects unsafe configuration", () => {
    expect(() => mediaStorageConfig({})).toThrow(/Configure SUPABASE_URL/);
    expect(() => mediaStorageConfig({ NODE_ENV: "production", SUPABASE_URL: "http://media-project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: config.key, SUPABASE_MEDIA_BUCKET: "amc-media" })).toThrow(/secure/);
    expect(() => mediaStorageConfig({ SUPABASE_URL: config.url, SUPABASE_SERVICE_ROLE_KEY: config.key, SUPABASE_MEDIA_BUCKET: "../other" })).toThrow(/valid media bucket/);
    expect(mediaStorageConfig({ SUPABASE_URL: config.url, SUPABASE_SERVICE_ROLE_KEY: config.key, SUPABASE_MEDIA_BUCKET: config.bucket })).toEqual(config);
  });

  it("requires public reads before publishing assets", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ public: false }));
    await expect(new SupabaseMediaStorage(config, fetcher).assertPublicBucket()).rejects.toMatchObject({ code: "storage_private_bucket" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("prefers modern server secret keys and sends them only in apikey", async () => {
    const modern = mediaStorageConfig({ SUPABASE_URL: config.url, SUPABASE_SECRET_KEY: "sb_secret_test", SUPABASE_SERVICE_ROLE_KEY: "old-test-key", SUPABASE_MEDIA_BUCKET: config.bucket });
    expect(modern.key).toBe("sb_secret_test");
    const fetcher = vi.fn().mockResolvedValue(Response.json({}));
    await new SupabaseMediaStorage(modern, fetcher).upload(path, new Uint8Array([1]));
    const headers = fetcher.mock.calls[0]?.[1].headers;
    expect(headers.apikey).toBe("sb_secret_test");
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("uploads immutable WebP bytes with server authentication and returns a credential-free URL", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ Key: path }));
    const store = new SupabaseMediaStorage(config, fetcher);
    const bytes = new Uint8Array([82, 73, 70, 70]);
    await store.upload(path, bytes);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe(`${config.url}/storage/v1/object/amc-media/${path}`);
    expect(options).toMatchObject({ method: "POST", redirect: "error", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "image/webp", "x-upsert": "false" }, body: Buffer.from(bytes) });
    expect(store.publicUrl(path)).toBe(`${config.url}/storage/v1/object/public/amc-media/${path}`);
    expect(store.publicUrl(path)).not.toContain(config.key);
  });

  it("rejects failed writes without exposing provider bodies or secrets", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(`provider echoed ${config.key}`, { status: 403 }));
    const error = await new SupabaseMediaStorage(config, fetcher).upload(path, new Uint8Array([1])).catch((e: Error) => e);
    expect(error).toMatchObject({ code: "storage_upload_failed" });
    expect(String(error)).not.toContain(config.key);
    const network = vi.fn().mockRejectedValue(new Error(`failed request with ${config.key}`));
    await expect(new SupabaseMediaStorage(config, network).upload(path, new Uint8Array([1]))).rejects.toMatchObject({ code: "storage_unavailable" });
  });

  it("cleans only generated object keys and treats cleanup failure as a failure", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({}));
    const store = new SupabaseMediaStorage(config, fetcher);
    await store.remove([path]);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: "DELETE", body: JSON.stringify({ prefixes: [path] }) });
    await expect(store.remove(["uploads/"])).rejects.toThrow(/cleanup key/);
    expect(fetcher).toHaveBeenCalledOnce();
    fetcher.mockResolvedValue(new Response("unavailable", { status: 503 }));
    await expect(store.remove([path])).rejects.toMatchObject({ code: "storage_cleanup_failed" });
  });
});

const probeEnv = { AMC_VERIFY_MEDIA_STORAGE: "true", SUPABASE_URL: config.url, SUPABASE_SECRET_KEY: "sb_secret_probe-test-do-not-expose", SUPABASE_MEDIA_BUCKET: config.bucket };

function probeProvider(read: "ok" | "network" | "type" | "bytes" = "ok", cleanupOk = true) {
  let image = Buffer.alloc(0);
  let key = "";
  const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const pathname = new URL(String(url)).pathname;
    if (pathname.startsWith("/storage/v1/bucket/")) return Response.json({ public: true });
    if (init?.method === "POST") {
      image = Buffer.from(init.body as Uint8Array);
      key = pathname.split("/amc-media/")[1]!;
      return Response.json({ Key: key });
    }
    if (init?.method === "DELETE") return cleanupOk ? Response.json({}) : new Response("provider body", { status: 503 });
    if (read === "network") throw new Error(`request failed with apikey ${probeEnv.SUPABASE_SECRET_KEY}`);
    return new Response(new Uint8Array(read === "bytes" ? Buffer.from("wrong bytes") : image), { headers: { "Content-Type": read === "type" ? "image/png" : "image/webp" } });
  });
  return { fetcher, image: () => image, key: () => key };
}

describe("optional production-build storage probe", () => {
  it("does nothing without explicit opt-in and fails clearly when enabled without a key", async () => {
    const fetcher = vi.fn();
    const log = vi.fn();
    expect(await verifyMediaStorage({ env: {}, fetcher, log })).toEqual({ skipped: true });
    expect(log).not.toHaveBeenCalled();
    await expect(verifyMediaStorage({ env: { AMC_VERIFY_MEDIA_STORAGE: "true" }, fetcher, log })).rejects.toMatchObject({ code: "storage_not_configured" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("media-storage-probe: failed (storage_not_configured)");
  });

  it("proves public byte/type readback and cleanup before logging success, without exposing the key", async () => {
    const provider = probeProvider();
    const log = vi.fn();
    expect(await verifyMediaStorage({ env: probeEnv, fetcher: provider.fetcher, log })).toEqual({ skipped: false });
    const sharp = (await import("sharp")).default;
    expect(await sharp(provider.image()).metadata()).toMatchObject({ width: 800, height: 450, format: "webp" });
    expect(provider.key()).toMatch(/^uploads\/storage-check-[0-9a-f-]{36}\/readiness\.webp$/);
    const publicRead = provider.fetcher.mock.calls.find(([url]) => String(url).includes("/object/public/"))!;
    expect(publicRead[1]).not.toHaveProperty("headers");
    const cleanup = provider.fetcher.mock.calls.at(-1)!;
    expect(cleanup[1]).toMatchObject({ method: "DELETE", body: JSON.stringify({ prefixes: [provider.key()] }) });
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith("media-storage-probe: verified write/read/delete (800x450 WebP; temporary object removed)");
    expect(JSON.stringify(log.mock.calls)).not.toContain(probeEnv.SUPABASE_SECRET_KEY);
  });

  it("cleans the fresh object after a failed public read and sanitizes network exception details", async () => {
    const provider = probeProvider("network");
    const log = vi.fn();
    const error = await verifyMediaStorage({ env: probeEnv, fetcher: provider.fetcher, log }).catch((e: Error) => e);
    expect(error).toMatchObject({ code: "storage_probe_failed" });
    expect(String(error)).not.toContain(probeEnv.SUPABASE_SECRET_KEY);
    expect(provider.fetcher.mock.calls.at(-1)?.[1]).toMatchObject({ method: "DELETE", body: JSON.stringify({ prefixes: [provider.key()] }) });
    expect(JSON.stringify(log.mock.calls)).not.toContain("verified");
    expect(JSON.stringify(log.mock.calls)).not.toContain(probeEnv.SUPABASE_SECRET_KEY);
  });

  it.each(["type", "bytes"] as const)("rejects a mismatched public %s response and still cleans up", async (read) => {
    const provider = probeProvider(read);
    await expect(verifyMediaStorage({ env: probeEnv, fetcher: provider.fetcher, log: vi.fn() })).rejects.toMatchObject({ code: "storage_probe_read_failed" });
    expect(provider.fetcher.mock.calls.at(-1)?.[1]?.method).toBe("DELETE");
  });

  it("does not claim success when deleting the temporary object fails", async () => {
    const provider = probeProvider("ok", false);
    const log = vi.fn();
    await expect(verifyMediaStorage({ env: probeEnv, fetcher: provider.fetcher, log })).rejects.toMatchObject({ code: "storage_probe_cleanup_failed" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("verified");
    expect(JSON.stringify(log.mock.calls)).not.toContain(probeEnv.SUPABASE_SECRET_KEY);
  });
});
