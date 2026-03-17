"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CalendarDays, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetch("/api/stripe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Stripe Verify Result:", data);
          setVerifying(false);
        })
        .catch((err) => {
          console.error("Stripe Verify Error:", err);
          setVerifying(false);
        });
    } else {
      setVerifying(false);
    }
  }, [sessionId]);

  return (
    <div className="bg-purple-600 p-8 text-center text-white">
      <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
        {verifying ? (
          <Loader2 size={32} className="text-white animate-spin" />
        ) : (
          <CheckCircle2 size={32} className="text-white" />
        )}
      </div>
      <h1 className="text-2xl font-bold mb-2">
        {verifying ? "Validando Pagamento..." : "Pagamento Confirmado!"}
      </h1>
      <p className="text-purple-100">
        {verifying
          ? "Por favor, aguarde enquanto confirmamos seu horário..."
          : "Sua reserva no Tessy Nails foi garantida com sucesso."}
      </p>
    </div>
  );
}

export default function PagamentoSucessoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-purple-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
        <Suspense fallback={
          <div className="bg-purple-600 p-8 text-center text-white">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Carregando Sessão...</h1>
          </div>
        }>
          <SuccessContent />
        </Suspense>
        
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-lg">Próximos passos</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <div className="mt-1 bg-purple-100 p-1 rounded text-purple-600">
                  <CalendarDays size={16} />
                </div>
                <span>Seu horário está confirmado e você receberá um lembrete antes do atendimento.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link href="/cliente/agendamentos" passHref>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl text-md font-semibold group">
                Ver Meus Agendamentos
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
