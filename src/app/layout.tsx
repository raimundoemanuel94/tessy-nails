import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Nailit — ERP para Manicures",
  description: "Gerencie seu salão com inteligência",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7C5CBF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" data-scroll-behavior="smooth">
      <body>
        {children}
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
