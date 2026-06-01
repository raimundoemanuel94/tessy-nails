"use client";

/**
 * Hook que verifica periodicamente se há uma nova versão do app no servidor.
 * Funciona mesmo sem Service Worker — checa a API /api/version.
 * 
 * Estratégia:
 * - Ao montar: salva o SHA atual
 * - A cada 5 minutos (ou ao reabrir o app): checa o servidor
 * - Se SHA mudou: recarrega automaticamente
 */

import { useEffect, useRef } from "react";

const VERSION_KEY     = "nailit_deploy_sha";
const CHECK_INTERVAL  = 5 * 60 * 1000; // 5 minutos
let   lastCheck       = 0;

export function useAppVersion() {
  const reloading = useRef(false);

  const checkVersion = async () => {
    if (reloading.current) return;
    if (Date.now() - lastCheck < 30_000) return; // throttle 30s
    lastCheck = Date.now();

    try {
      const res = await fetch("/api/version", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;

      const { sha } = await res.json() as { sha: string };
      const stored  = localStorage.getItem(VERSION_KEY);

      if (!stored) {
        // Primeira visita — apenas salvar
        localStorage.setItem(VERSION_KEY, sha);
        return;
      }

      if (stored !== sha) {
        // Nova versão detectada!
        console.log(`[Nailit] Nova versão: ${stored} → ${sha}`);
        reloading.current = true;
        localStorage.setItem(VERSION_KEY, sha);

        // Limpar caches do Service Worker
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.allSettled(
            keys.filter(k => k.startsWith("nailit-") || k.startsWith("workbox-"))
                .map(k => caches.delete(k))
          );
        }

        // Dar 800ms para o SW processar e recarregar
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      // Silencioso — sem internet, sem problema
    }
  };

  useEffect(() => {
    // Verificar imediatamente
    void checkVersion();

    // Verificar ao reabrir o app (tab/app em background → foreground)
    const onVisibility = () => {
      if (document.visibilityState === "visible") void checkVersion();
    };

    // Verificar ao voltar online
    const onOnline = () => void checkVersion();

    // Intervalo periódico
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, []);
}
