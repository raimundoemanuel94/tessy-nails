"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FloatingActionButton } from "../shared/FloatingActionButton";
import MensagemInicial from "@/components/shared/MensagemInicial";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") {
      router.push("/login");
      return;
    }
    if (user && pathname !== "/login" && user.role !== "admin" && user.role !== "professional") {
      router.push("/cliente");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-background">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (user && user.role !== "admin" && user.role !== "professional") {
    return null;
  }

  return (
    <div className="flex h-screen bg-brand-background text-brand-text overflow-hidden font-sans selection:bg-brand-primary/20 selection:text-brand-primary">
      {/* Inspirational Message */}
      <MensagemInicial />
      
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Premium Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative z-10">
          <div className="mx-auto max-w-[1600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
