import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker multi-stage build (runner stage copies .next/standalone)
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/proxy/telephony/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:3333"}/api/crm/telephony/:path*`,
      },
      {
        source: "/api/proxy/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:3333"}/:path*`, // Proxy to Backend
      },
      {
        source: "/api/marketing/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:3333"}/api/marketing/:path*`, // Direct Marketing API Proxy
      },
      {
        source: "/api/crm/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:3333"}/api/crm/:path*`, // Direct CRM API Proxy
      },
    ];
  },
};

export default nextConfig;
