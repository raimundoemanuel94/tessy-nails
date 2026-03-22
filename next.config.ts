import type { NextConfig } from "next";

// v1.0.3 - Agresive PWA Cache Buster + Optimization

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // ✅ Usando StaleWhileRevalidate para balancear cache rápido e conteúdo atualizado
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "tessy-pwa-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas de cache
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "tessy-api-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 min para APIs
        },
      },
    }
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
  // Removidos os headers agressivos de no-cache para permitir funcionamento offline e carregamento ultra-rápido no Mobile.
};

export default withPWA(nextConfig);
