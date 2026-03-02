import type { NextConfig } from "next";

const AI_BASE = process.env.AI_BASE_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async rewrites() {
    return [
      {
        source: "/ai/:path*",
        destination: `${AI_BASE}/ai/:path*`,
      },
      {
        source: "/rag/:path*",
        destination: `${AI_BASE}/rag/:path*`,
      },
    ];
  },
};

export default nextConfig;
