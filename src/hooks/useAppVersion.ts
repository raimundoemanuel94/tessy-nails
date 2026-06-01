"use client";

/**
 * Detecção de nova versão do app.
 * 
 * Estratégia dupla:
 * 1. BUILD_ID embarcado no JS (disponível imediatamente, sem fetch)
 * 2. /api/version como fallback (para confirmar)
 * 
 * Quando BUILD_ID muda → limpa caches → reload automático
 */

import { useEffect, useRef } from "react";

const VERSION_KEY    = "nailit_build_id";
const CHECK_INTERVAL = 60 * 1000; // 1 minuto
let   lastCheck      = 0;

// BUILD_ID é injetado pelo next.config.ts em cada deploy
const CURRENT_BUILD = process.env.NEXT_PUBLIC_BUILD_ID || "dev";

async function clearCaches() {
  if (!("caches" in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.allSettled(
      keys.filter(k =>
        k.startsWith("nailit-") ||
        k.startsWith("workbox-") ||
        k.startsWith("next-")
      ).map(k => caches.delete(k))
    );
    console.log("[Nailit] Caches limpos");
  } catch {}
}

async function checkAndReload(reloading: React.MutableRefObject<boolean>) {
  if (reloading.current) return;
  if (Date.now() - lastCheck < 15_000) return;
  lastCheck = Date.now();

  const stored = localStorage.getItem(VERSION_KEY);

  // 1. Verificação rápida pelo BUILD_ID embutido no JS
  if (stored && stored !== CURRENT_BUILD && CURRENT_BUILD !== "dev") {
    console.log(`[Nailit] Build mudou: ${stored} → ${CURRENT_BUILD}`);
    reloading.current = true;
    localStorage.setItem(VERSION_KEY, CURRENT_BUILD);
    await clearCaches();
    setTimeout(() => window.location.reload(), 300);
    return;
  }

  if (!stored) {
    localStorage.setItem(VERSION_KEY, CURRENT_BUILD);
  }

  // 2. Verificação via API (fallback para quando BUILD_ID = "dev")
  try {
    const res = await fetch("/api/version", {
      cache: "no-store",
      headers: { "pragma": "no-cache", "cache-control": "no-cache" },
    });
    if (!res.ok) return;
    const { buildId } = await res.json() as { buildId: string };
    const storedApi = localStorage.getItem(VERSION_KEY + "_api");

    if (!storedApi) {
      localStorage.setItem(VERSION_KEY + "_api", buildId);
      return;
    }

    if (storedApi !== buildId) {
      console.log(`[Nailit] API build mudou: ${storedApi} → ${buildId}`);
      reloading.current = true;
      localStorage.setItem(VERSION_KEY + "_api", buildId);
      await clearCaches();
      setTimeout(() => window.location.reload(), 300);
    }
  } catch {
    // offline — sem problema
  }
}

export function useAppVersion() {
  const reloading = useRef(false);

  useEffect(() => {
    // Verificar imediatamente ao montar
    void checkAndReload(reloading);

    // Ao voltar para o app
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkAndReload(reloading);
      }
    };

    // Ao voltar online
    const onOnline = () => void checkAndReload(reloading);

    // Ao receber foco (iOS PWA)
    const onFocus = () => void checkAndReload(reloading);

    const interval = setInterval(() => checkAndReload(reloading), CHECK_INTERVAL);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}
