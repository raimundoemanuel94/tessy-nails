"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
        <Sparkles size={28} className="text-brand-primary" />
      </div>
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-brand-text-main">404</h1>
        <p className="text-sm font-semibold text-brand-text-muted">Página não encontrada</p>
      </div>
      <button
        onClick={() => router.back()}
        className="h-12 px-8 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:opacity-90 transition-all"
      >
        Voltar
      </button>
    </div>
  );
}
