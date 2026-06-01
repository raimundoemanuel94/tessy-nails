"use client";

/**
 * PWA Update Manager — Nailit
 *
 * Estratégia:
 * 1. skipWaiting: true no next.config → novo SW assume imediatamente
 * 2. controllerchange → reload automático silencioso
 * 3. visibilitychange → verifica update ao reabrir o app
 * 4. Intervalo de 2min → checagem periódica em background
 * 5. Toast suave de "Atualizando..." sem precisar de ação do usuário
 * 6. Fallback: se reload não ocorrer em 3s, força window.location.reload()
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

// Versão do app — atualizar a cada deploy para forçar cache bust
const APP_VERSION_KEY = "nailit_app_version";
const APP_VERSION     = "1.2.0"; // bump em cada deploy significativo

export function PwaUpdatePrompt() {
  const [updating, setUpdating] = useState(false);
  const reloadRef  = useRef(false);
  const regRef     = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Detectar mudança de versão via localStorage
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);
    if (storedVersion && storedVersion !== APP_VERSION) {
      // Nova versão detectada — limpar caches antigos e recarregar
      localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
      clearOldCaches().then(() => {
        if (!reloadRef.current) {
          reloadRef.current = true;
          window.location.reload();
        }
      });
      return;
    }
    localStorage.setItem(APP_VERSION_KEY, APP_VERSION);

    let isMounted = true;

    // ── Reload automático quando SW atualiza ──────────────────────
    const onControllerChange = () => {
      if (reloadRef.current || !isMounted) return;
      reloadRef.current = true;

      // Mostrar toast de "Atualizando..." por 1.5s antes de recarregar
      setUpdating(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // ── Registrar SW e monitorar atualizações ──────────────────────
    const init = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg || !isMounted) return;
        regRef.current = reg;

        // Se já tem SW waiting → aplicar imediatamente
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Monitorar novos SWs encontrados
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Novo SW instalado e há um controlador ativo → aplicar
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Verificar update ao reabrir o app (visibilitychange)
        const checkUpdate = () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", checkUpdate);

        // Checagem periódica a cada 2 minutos
        const interval = setInterval(() => {
          reg.update().catch(() => {});
        }, 2 * 60 * 1000);

        // Cleanup
        return () => {
          document.removeEventListener("visibilitychange", checkUpdate);
          clearInterval(interval);
        };
      } catch (err) {
        console.warn("[PWA] Update check failed:", err);
      }
    };

    const cleanup = init();

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      cleanup?.then(fn => fn?.());
    };
  }, []);

  // Toast de atualização automática
  return (
    <AnimatePresence>
      {updating && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed top-[calc(env(safe-area-inset-top)+12px)] inset-x-4 z-[500] max-w-sm mx-auto"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #1E1A2E, #2A1A4E)",
              border: "1px solid rgba(157,127,212,0.3)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(157,127,212,0.2)" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={13} className="text-[#9D7FD4]" />
              </motion.div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white leading-none">Atualizando Nailit</p>
              <p className="text-[9px] text-white/40 mt-0.5">Nova versão disponível ✨</p>
            </div>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <motion.div key={i}
                  className="h-1 w-1 rounded-full bg-[#9D7FD4]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Limpa caches antigos do nailit ao detectar nova versão
async function clearOldCaches(): Promise<void> {
  if (!("caches" in window)) return;
  try {
    const keys = await caches.keys();
    const oldKeys = keys.filter(k =>
      k.startsWith("nailit-") ||
      k.startsWith("tessy-") ||
      k.startsWith("workbox-")
    );
    await Promise.allSettled(oldKeys.map(k => caches.delete(k)));
  } catch {}
}
