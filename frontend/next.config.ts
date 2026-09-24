import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import { execSync } from "child_process";

const nextConfig: NextConfig = {
  env: {
    BUILD_VERSION: (() => {
      try {
        return execSync("git rev-parse --short HEAD").toString().trim();
      } catch {
        return Date.now().toString(36);
      }
    })(),
  },
  compiler: {
    // Strip console.* noise in production builds, but keep error/warn for
    // real debugging signal.
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  async rewrites() {
    return [
      // PostHog reverse proxy — routes /ingest/* through Next.js to avoid ad-blockers
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // Turbopack configuration for Yjs compatibility
  turbopack: {
    resolveAlias: {
      yjs: "yjs",
      "@": "./",
    },
  },
  // Keep webpack config for development if using --webpack flag
  webpack: (config, { isServer }) => {
    // Ensure only one instance of Yjs is loaded
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: require.resolve("yjs"),
    };

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "audacity-impact",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
