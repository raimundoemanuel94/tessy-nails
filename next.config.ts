import type { NextConfig } from "next";

// v1.0.3 - Agresive PWA Cache Buster + Optimization

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // ✅ Forçar atualização imediata do service worker
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "http-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 0, // ✅ Sem cache para forçar atualização
        },
      },
    },
  ],
  reloadOnOnline: true,
  buildExcludes: [/middleware-manifest\.json$/]
});

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Adicione configurações personalizadas do webpack aqui, se necessário
    return config;
  },
  turbopack: {},
  // ✅ Headers para evitar cache agressivo
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
