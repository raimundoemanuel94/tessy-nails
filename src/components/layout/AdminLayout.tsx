"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FloatingActionButton } from "../shared/FloatingActionButton";
import MensagemInicial from "@/components/MensagemInicial";
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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  // If we're on the login page, just show the content
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Client role must not see admin layout (redirect handled in useEffect)
  if (user && user.role !== "admin" && user.role !== "professional") {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-violet-500/20 selection:text-violet-600">
      {/* Mensagem Inspiracional */}
      <MensagemInicial />
      
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-violet-200/20 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
        
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 relative z-10">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
