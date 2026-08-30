import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com"],
  },
  // In Next.js 15, allowedDevOrigins is top-level
  // @ts-ignore
  allowedDevOrigins: ["192.168.1.110", "192.168.1.110:3005", "localhost:3005"],
};

export default nextConfig;
