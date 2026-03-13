"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // ✅ Verificar role para redirecionamento correto
        if (user.role === 'admin' || user.role === 'professional') {
          router.push("/dashboard");
        } else {
          // ✅ Client vai para área cliente
          router.push("/cliente");
        }
      } else {
        // ✅ Deslogado vai para landing page (cliente)
        router.push("/cliente");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold text-primary animate-pulse">Tessy Nails</h1>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando sua plataforma...</p>
      </div>
    </div>
  );
}
