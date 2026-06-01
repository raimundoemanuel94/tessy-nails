import type { NextConfig } from "next";

// v1.2.0 - Nailit PWA: cache renomeado, offline melhorado, performance

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Firebase Auth — sempre rede (tokens JWT)
    {
      urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
      handler: "NetworkOnly",
    },
    // Firebase Firestore — Network First com fallback
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "nailit-firestore-cache",
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 2 },
      },
    },
    // APIs internas — Network First
    {
      urlPattern: /\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "nailit-api-cache",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "nailit-fonts-cache",
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // Imagens e SVGs estáticos
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "nailit-images-cache",
        expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // JS/CSS estático do Next.js
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "nailit-static-cache",
        expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Páginas HTML — Stale While Revalidate
    {
      urlPattern: /^https?.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "nailit-pages-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline.html',
  },
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => config,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
          // Cache de assets estáticos
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Cache longo para assets imutáveis
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/brand/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
