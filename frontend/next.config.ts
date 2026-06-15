import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
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
