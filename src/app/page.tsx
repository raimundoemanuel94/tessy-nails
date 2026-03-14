"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'admin' || user.role === 'professional') {
          router.push("/dashboard");
        } else {
          router.push("/cliente");
        }
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold text-primary animate-pulse">Tessy Nails</h1>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Tessy <span className="text-pink-600">Nails</span>
          </h1>
          <p className="text-lg text-slate-600">
            Sua beleza, nossa arte. Agende seu horário com as melhores profissionais.
          </p>
        </div>

        <div className="grid gap-4">
          <Button 
            size="lg" 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-pink-200"
            onClick={() => router.push("/login")}
          >
            Agendar Agora
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full border-slate-200 h-14 text-lg font-medium rounded-2xl bg-white hover:bg-slate-50 transition-all"
            onClick={() => router.push("/login")}
          >
            Entrar na minha conta
          </Button>
        </div>

        <div className="pt-8 text-slate-400 text-sm">
          Aberto de Segunda a Sábado • 09:00 às 19:00
        </div>
      </div>
    </div>
  );
}
