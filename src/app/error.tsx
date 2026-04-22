"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-black text-brand-text-main">Algo deu errado</h1>
        <p className="text-sm text-brand-text-muted">
          Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="h-12 px-6 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          Tentar novamente
        </button>
        <button
          onClick={() => router.push("/")}
          className="h-12 px-6 rounded-2xl border border-brand-soft text-brand-text-main font-bold text-sm hover:bg-brand-soft/30 transition-all"
        >
          Início
        </button>
      </div>
    </div>
  );
}
