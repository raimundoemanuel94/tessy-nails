import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt";

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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nailit" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#080812" />
        <meta name="msapplication-TileImage" content="/icons/icon-512.png" />
        <style>{`
          @media (display-mode: standalone) {
            body { background: #080812; }
          }
        `}</style>
      </head>
      <body>
        {children}
        <Toaster theme="system" position="top-right" richColors />
        <PwaInstallPrompt />
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
