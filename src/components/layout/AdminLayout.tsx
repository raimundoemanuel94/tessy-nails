"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FloatingActionButton } from "../shared/FloatingActionButton";
import MensagemInicial from "@/components/shared/MensagemInicial";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") { router.push("/login"); return; }
    if (user && pathname !== "/login" && user.role !== "admin" && user.role !== "professional") {
      router.push("/cliente");
    }
  }, [user, loading, router, pathname]);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-2xl flex items-center justify-center"
          style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
          <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Carregando...</p>
      </div>
    </div>
  );

  if (!user && pathname !== "/login") return null;
  if (pathname === "/login") return <>{children}</>;
  if (user && user.role !== "admin" && user.role !== "professional") return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <MensagemInicial />

      {/* Sidebar desktop */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity:0, y:8 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-4 }}
                transition={{ duration:0.25, ease:[0.22,1,0.36,1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <FloatingActionButton />
    </div>
  );
}
