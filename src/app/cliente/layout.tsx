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
    <div className="relative min-h-screen bg-brand-background overflow-x-hidden selection:bg-brand-primary/20">
      {/* Premium Background Gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-brand-primary/10 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] h-[30%] w-[30%] rounded-full bg-brand-accent/20 blur-[100px]" />
        <div className="absolute -bottom-[10%] right-[20%] h-[25%] w-[25%] rounded-full bg-brand-secondary/15 blur-[80px]" />
      </div>

      {/* Main Content Shell */}
      <main className="relative z-10 mx-auto min-h-screen pb-32">
        {children}
      </main>

      {/* Modern Navigation */}
      <BottomNav />
      
      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
