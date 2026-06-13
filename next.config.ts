import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  turbopack: { root: process.cwd() },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
