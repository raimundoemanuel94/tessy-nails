"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "tn_pwa_update_dismiss_until";
const DISMISS_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export function PwaUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState(0);
  const didReload = useRef(false);

  const isDismissed = dismissedUntil > Date.now();
  const shouldShow = Boolean(waitingWorker) && !isDismissed;

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let isMounted = true;
    let registration: ServiceWorkerRegistration | null = null;
    let updateInterval: number | null = null;

    const savedDismissUntil = Number(sessionStorage.getItem(DISMISS_KEY) ?? "0");
    if (savedDismissUntil > Date.now()) {
      setDismissedUntil(savedDismissUntil);
    }

    const registerInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const onStateChange = () => {
        if (!isMounted) return;
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
        }
      };
      worker.addEventListener("statechange", onStateChange);
      onStateChange();
    };

    const inspectRegistration = async () => {
      try {
        registration = (await navigator.serviceWorker.getRegistration()) ?? null;
        if (!isMounted || !registration) return;

        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
        }

        registerInstallingWorker(registration.installing);

        registration.addEventListener("updatefound", () => {
          registerInstallingWorker(registration?.installing ?? null);
        });
      } catch (error) {
        console.error("PWA update check failed:", error);
      }
    };

    const onControllerChange = () => {
      if (didReload.current) return;
      didReload.current = true;
      window.location.reload();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        registration?.update().catch(() => {
          // noop
        });
      }
    };

    inspectRegistration();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    updateInterval = window.setInterval(() => {
      registration?.update().catch(() => {
        // noop
      });
    }, 60 * 1000);

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (updateInterval) window.clearInterval(updateInterval);
    };
  }, []);

  const depositMessage = useMemo(
    () =>
      isApplying
        ? "Instalando atualizacao..."
        : "Temos melhorias de desempenho e estabilidade prontas para uso.",
    [isApplying]
  );

  const handleDismiss = () => {
    const nextDismissUntil = Date.now() + DISMISS_WINDOW_MS;
    sessionStorage.setItem(DISMISS_KEY, String(nextDismissUntil));
    setDismissedUntil(nextDismissUntil);
  };

  const handleUpdateNow = () => {
    if (!waitingWorker || isApplying) return;
    setIsApplying(true);
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Fallback: some browsers delay controllerchange.
    window.setTimeout(() => {
      if (!didReload.current) {
        window.location.reload();
      }
    }, 8000);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[80] px-4 sm:px-6"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-brand-accent/20 bg-white/90 shadow-[0_28px_70px_rgba(75,46,43,0.28)] backdrop-blur-2xl">
            <div className="relative p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-primary/10 blur-3xl" />

              <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-text-sub/70 transition-colors hover:bg-brand-soft/40 hover:text-brand-text-main"
                aria-label="Fechar aviso de atualizacao"
              >
                <X size={16} />
              </button>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-background/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-primary">
                <Sparkles size={12} />
                Nova versao disponivel
              </div>

              <h3 className="pr-10 text-lg font-black tracking-tight text-brand-text-main">
                Atualizacao pronta para instalar
              </h3>
              <p className="mt-1 text-xs font-bold leading-relaxed text-brand-text-sub">
                {depositMessage}
              </p>

              <div className="mt-5 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-10 flex-1 text-[10px] font-black tracking-[0.18em]"
                >
                  Depois
                </Button>
                <Button
                  type="button"
                  variant="premium"
                  size="sm"
                  onClick={handleUpdateNow}
                  disabled={isApplying}
                  className="h-10 flex-1 text-[10px] font-black tracking-[0.18em]"
                >
                  <RefreshCw className={isApplying ? "animate-spin" : ""} />
                  {isApplying ? "Atualizando" : "Atualizar"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
