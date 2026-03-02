import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async rewrites() {
    return [
      {
        source: "/ai/:path*",
        destination: "http://127.0.0.1:8000/ai/:path*",
      },
      {
        source: "/rag/:path*",
        destination: "http://127.0.0.1:8000/rag/:path*",
      },
    ];
  },
};

export default nextConfig;
