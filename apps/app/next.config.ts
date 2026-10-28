import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@amc/core", "@amc/server", "@amc/ui"],
  poweredByHeader: false,
  reactStrictMode: true,
  // 3 MB media files plus multipart fields, below Vercel's 4.5 MB request ceiling.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  async headers() {
    return [
      {
        // Portal, admin and auth pages are private: never indexed (site architecture §8.3, §8.6).
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
