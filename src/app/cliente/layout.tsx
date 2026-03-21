"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Toaster } from "sonner";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh flex flex-col bg-brand-background overflow-hidden selection:bg-brand-primary/20">
      {/* Premium Background Gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] h-[30%] w-[30%] rounded-full bg-brand-accent/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] right-[20%] h-[25%] w-[25%] rounded-full bg-brand-secondary/5 blur-[80px]" />
      </div>

      {/* Main Content Shell - Scrollable with hide scrollbar */}
      <main className="relative z-10 flex-1 overflow-y-auto scrollbar-hide pb-24">
        {children}
      </main>

      {/* Modern Navigation */}
      <BottomNav />
      
      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
