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
  // `allowedDevOrigins` is a runtime-only dev option that isn't yet
  // reflected in the shipped TypeScript types for this Next.js version.
  // Cast to `any` so the option is passed through at runtime without
  // producing a type error during development.
  experimental: ({
    allowedDevOrigins: ["https://chat.byteptr.xyz", "https://ws.byteptr.xyz", "https://cdn.byteptr.xyz"],
  } as any),
};

export default nextConfig;
