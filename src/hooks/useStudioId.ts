"use client";

/**
 * useStudioId — Hook simples para páginas da manicure
 * Retorna o studioId do profissional logado.
 * Se não tiver studio, redireciona para /login.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudio } from "@/contexts/StudioContext";
import { useAuth } from "@/contexts/AuthContext";

export function useStudioId() {
  const { user, loading: authLoading } = useAuth();
  const { studio, loading: studioLoading, studioId } = useStudio();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || studioLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role === "client") { router.replace("/cliente"); return; }
  }, [user, authLoading, studioLoading]);

  return {
    studioId,
    studio,
    loading: authLoading || studioLoading,
    ready:   !authLoading && !studioLoading && !!studioId,
  };
}
