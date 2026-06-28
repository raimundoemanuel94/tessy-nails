import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt";
import { PwaUpdatePrompt } from "@/components/layout/PwaUpdatePrompt";
import { PwaIosPrompt } from "@/components/layout/PwaIosPrompt";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

export const metadata: Metadata = {
  title: "Nailit — ERP para Manicures",
  description: "Gerencie seu salão com inteligência",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7C5CBF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" data-scroll-behavior="smooth">
      <head>
        {/* Apple Touch Icons — iOS usa o maior disponível */}
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />

        {/* PWA standalone */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nailit" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#080812" />
        <meta name="msapplication-TileImage" content="/icons/icon-512.png" />

        {/* Splash screens iOS — evita tela branca ao abrir em modo standalone */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/icons/splash-828x1792.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1242x2208.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/icons/splash-750x1334.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/icons/splash-640x1136.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" href="/icons/splash-1536x2048.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" href="/icons/splash-2048x2732.png" />

        <style>{`
          @media (display-mode: standalone) {
            body { background: #080812; }
          }
        `}</style>
      </head>
      <body>
        {children}
        <Toaster theme="system" position="top-right" richColors />
        <OfflineBanner />
        <PwaInstallPrompt />
        <PwaUpdatePrompt />
        <PwaIosPrompt />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {})
            })
          }
        `}} />
      </body>
    </html>
  );
}
