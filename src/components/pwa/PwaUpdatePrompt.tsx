"use client";

/**
 * PWA Update — detecta novo Service Worker e recarrega automaticamente.
 * skipWaiting: true no next.config → SW assume imediatamente.
 * controllerchange → reload silencioso com toast.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function PwaUpdatePrompt() {
  const [updating, setUpdating] = useState(false);
  const reloadRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let isMounted = true;

    // Reload quando SW troca de controller
    const onControllerChange = () => {
      if (reloadRef.current || !isMounted) return;
      reloadRef.current = true;
      setUpdating(true);
      // Aguarda 1.5s para o toast aparecer
      setTimeout(() => window.location.reload(), 1500);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Registrar e monitorar
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg || !isMounted) return;

        // SW já esperando → aplicar imediatamente
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Novo SW encontrado
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              sw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Checar update ao voltar para o app
        const checkUpdate = () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", checkUpdate);
        window.addEventListener("focus", checkUpdate);

        // Checar periodicamente
        const t = setInterval(() => reg.update().catch(() => {}), 60_000);

        return () => {
          document.removeEventListener("visibilitychange", checkUpdate);
          window.removeEventListener("focus", checkUpdate);
          clearInterval(t);
        };
      } catch {}
    })();

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return (
    <AnimatePresence>
      {updating && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed top-[calc(env(safe-area-inset-top)+10px)] inset-x-4 z-[500] max-w-sm mx-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #1E1A2E, #2A1A4E)",
              border: "1px solid rgba(157,127,212,0.35)",
            }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-xl bg-[#9D7FD4]/20 flex items-center justify-center shrink-0"
            >
              <RefreshCw size={14} className="text-[#9D7FD4]" />
            </motion.div>
            <div className="flex-1">
              <p className="text-[12px] font-black text-white">Atualizando Nailit ✨</p>
              <p className="text-[9px] text-white/40 mt-0.5">Nova versão disponível</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
