"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Verificar pagamento em background e redirecionar
    const verify = async () => {
      if (sessionId) {
        try {
          await fetch("/api/stripe/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
        } catch { /* silencioso */ }
      }
      router.replace("/cliente/agendamentos");
    };
    void verify();
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4] animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

export default function PagamentoSucessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8FF]" />}>
      <SuccessContent />
    </Suspense>
  );
}
