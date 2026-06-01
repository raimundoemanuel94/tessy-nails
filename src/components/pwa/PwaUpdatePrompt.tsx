"use client";

/**
 * PwaUpdatePrompt — detecta novo Service Worker e recarrega.
 *
 * Funciona em paralelo com useAppVersion.
 * skipWaiting: true → SW novo assume imediatamente.
 * controllerchange → toast "Atualizando..." + reload 1.5s.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function PwaUpdatePrompt() {
  const [show, setShow]   = useState(false);
  const reloadRef         = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let mounted = true;

    // Quando SW muda de controller → recarregar
    const onController = () => {
      if (reloadRef.current || !mounted) return;
      reloadRef.current = true;
      setShow(true);
      setTimeout(() => window.location.reload(), 1500);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg || !mounted) return;

        // SW já esperando → aplicar
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Monitorar novo SW
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              sw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Checar ao voltar pro app
        const tryUpdate = () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", tryUpdate);
        window.addEventListener("focus", tryUpdate);

        // A cada 90s
        const iv = setInterval(() => reg.update().catch(() => {}), 90_000);

        return () => {
          document.removeEventListener("visibilitychange", tryUpdate);
          window.removeEventListener("focus", tryUpdate);
          clearInterval(iv);
        };
      } catch {}
    };

    const cleanup = setup();

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
      cleanup?.then(fn => fn?.());
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="fixed inset-x-4 z-[500] max-w-sm mx-auto"
          style={{ top: "calc(env(safe-area-inset-top) + 10px)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#1E1A2E,#2A1A4E)",
              border: "1px solid rgba(157,127,212,0.35)",
            }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(157,127,212,0.2)" }}
            >
              <RefreshCw size={14} className="text-[#9D7FD4]" />
            </motion.div>
            <div>
              <p className="text-[12px] font-black text-white">Atualizando Nailit ✨</p>
              <p className="text-[9px] text-white/40 mt-0.5">Nova versão disponível</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
