"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/cliente/BottomNav";
import { InstallBanner } from "@/components/cliente/InstallBanner";
import { Toaster } from "sonner";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, needsPhoneLink } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (needsPhoneLink && pathname !== "/cliente/vincular-telefone") {
      router.push("/cliente/vincular-telefone"); return;
    }
  }, [user, loading, needsPhoneLink, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8FF]">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#1E1A2E]/30 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-[#FAF8FF] selection:bg-[#1E1A2E]/20">

      {/* Noise texture overlay sutil */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Glow suave café nos cantos */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #9D7FD4 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #1E1A2E 0%, transparent 70%)" }} />
      </div>

      {/* Install PWA banner */}
      <InstallBanner />

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto scrollbar-hide pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <BottomNav />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1E1A2E",
            color: "#FAF8FF",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "700",
          },
        }}
      />
    </div>
  );
}
