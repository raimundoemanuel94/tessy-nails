"use client";

/**
 * useAppVersion — detecta nova versão e recarrega automaticamente
 *
 * Como funciona:
 * 1. CURRENT_BUILD é embutido no JS pelo next.config (muda a cada deploy)
 * 2. Na primeira visita: salva o CURRENT_BUILD no localStorage
 * 3. Em visitas seguintes: compara CURRENT_BUILD com o salvo
 *    → Se diferente: nova versão detectada → limpa caches → reload
 * 4. Fallback via fetch /api/version para casos edge
 * 5. Triggers: mount, visibilitychange, focus, online
 */

import { useEffect, useRef } from "react";

const KEY = "nailit_v";
const CURRENT = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export function useAppVersion() {
  const reloading = useRef(false);
  const checked   = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (reloading.current) return;

      const stored = localStorage.getItem(KEY);

      // ── Verificação 1: BUILD_ID no bundle JS ──────────────
      if (stored && stored !== CURRENT && CURRENT !== "dev") {
        console.info(`[Nailit] Versão nova: ${stored} → ${CURRENT}`);
        reloading.current = true;
        localStorage.setItem(KEY, CURRENT);
        await wipeCaches();
        // Aguardar SW processar antes de recarregar
        setTimeout(() => window.location.reload(), 400);
        return;
      }

      // Primeira visita — apenas salvar
      if (!stored) {
        localStorage.setItem(KEY, CURRENT);
        checked.current = true;
        return;
      }

      // ── Verificação 2: /api/version como fallback ─────────
      // Só faz se já passou > 30s desde a última checagem
      const lastFetch = Number(sessionStorage.getItem("nailit_last_check") || "0");
      if (Date.now() - lastFetch < 30_000) return;
      sessionStorage.setItem("nailit_last_check", String(Date.now()));

      try {
        const r = await fetch(`/api/version?_=${Date.now()}`, {
          cache: "no-store",
          headers: { "pragma": "no-cache", "cache-control": "no-cache" },
        });
        if (!r.ok) return;
        const { buildId } = await r.json() as { buildId: string };

        const storedApi = localStorage.getItem(KEY + "_api");
        if (!storedApi) {
          localStorage.setItem(KEY + "_api", buildId);
          return;
        }

        if (storedApi !== buildId && buildId !== "unknown") {
          console.info(`[Nailit] API versão nova: ${storedApi} → ${buildId}`);
          reloading.current = true;
          localStorage.setItem(KEY + "_api", buildId);
          await wipeCaches();
          setTimeout(() => window.location.reload(), 400);
        }
      } catch {
        // Offline — sem problema
      }
    };

    // Executar imediatamente
    void check();

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    const onFocus  = () => void check();
    const onOnline = () => void check();

    // Intervalo de 90 segundos
    const iv = setInterval(check, 90_000);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, []);
}

async function wipeCaches() {
  if (!("caches" in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.allSettled(
      keys.filter(k =>
        k.startsWith("nailit-") ||
        k.startsWith("workbox-") ||
        k.startsWith("next-")   ||
        k.startsWith("sw-")
      ).map(k => {
        console.info(`[Nailit] Removendo cache: ${k}`);
        return caches.delete(k);
      })
    );
  } catch {}
}
