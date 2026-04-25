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
  // Use webpack instead of Turbopack for Yjs compatibility
  // Turbopack has known issues with Yjs module deduplication
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
