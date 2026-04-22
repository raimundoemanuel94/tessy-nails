"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Phone, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const formatPhone = (value: string) => {
  const n = value.replace(/\D/g, "");
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
};

export default function VincularTelefonePage() {
  const { linkOrCreateByPhone } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setError("Informe um telefone válido com DDD (10 ou 11 dígitos).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await linkOrCreateByPhone(digits);
      router.replace("/cliente");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível continuar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <Phone size={28} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-black text-brand-text-main">Qual é o seu número?</h1>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Informe seu WhatsApp para encontrarmos seu cadastro ou criarmos um novo.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted"
            />
            <Input
              type="tel"
              placeholder="(66) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              disabled={loading}
              className="pl-12 h-14 rounded-2xl text-base font-bold border-slate-200/60 bg-white focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary"
            />
          </div>

          {error && (
            <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-brand-primary hover:opacity-90 text-white font-black text-base shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Continuar <ChevronRight size={18} />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
