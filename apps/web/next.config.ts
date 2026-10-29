import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "../..");
// The same spellings as z.stringbool() in @amc/server/env (FLAG_TRUE there), so the robots meta,
// robots.txt and this header always agree. next.config can't import the server package.
const truthy = (value: string | undefined) => /^(1|true|yes|on|y|enabled)$/i.test(value?.trim() ?? "");

/** Preview builds stay out of search engines unless SITE_INDEXABLE=true (build plan §8). */
const indexable = truthy(process.env.SITE_INDEXABLE);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@amc/core", "@amc/server", "@amc/ui"],
  // Every public HTML page ends with a slash; slashless URLs redirect (site architecture §2.2).
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Unmatched/retired bookmarks need real server-rendered recovery HTML, without async layouts.
  experimental: { globalNotFound: true },
  // Trace from the monorepo root so serverless bundles can include files outside apps/web.
  outputFileTracingRoot: monorepoRoot,
  // Content drafts and stored texts are read from content/ at render time.
  outputFileTracingIncludes: { "/**": ["../../content/**/*.md"] },
  turbopack: { root: monorepoRoot },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: indexable ? securityHeaders : [...securityHeaders, { key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
