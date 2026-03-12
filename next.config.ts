import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Adicione configurações personalizadas do webpack aqui, se necessário
    return config;
  },
  turbopack: {},
};

export default withPWA(nextConfig);
