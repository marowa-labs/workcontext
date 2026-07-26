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
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
  // Turbopack configuration for Yjs compatibility
  turbopack: {
    resolveAlias: {
      yjs: "yjs",
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

export default nextConfig;
