import type { NextConfig } from "next";

const AI_BASE_URL = process.env.PYTHON_AI_URL
  ? new URL(process.env.PYTHON_AI_URL).origin
  : "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/ai/:path*",
        destination: `${AI_BASE_URL}/ai/:path*`,
      },
      {
        source: "/rag/:path*",
        destination: `${AI_BASE_URL}/rag/:path*`,
      },
    ];
  },
};

export default nextConfig;
