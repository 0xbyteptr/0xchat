import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return {
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: "http://localhost:3001/api/:path*",
          },
          {
            source: "/cdn/:path*",
            destination: "http://localhost:3003/cdn/:path*",
          },
        ],
      };
    }
    return { beforeFiles: [] };
  },
};

export default nextConfig;
