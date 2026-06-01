"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Sparkles, X } from "lucide-react";

const DISMISS_KEY = "nailit_pwa_update_dismiss_until";
const DISMISS_WINDOW_MS = 30 * 60 * 1000;

export function PwaUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isApplying, setIsApplying]       = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState(0);
  const didReload = useRef(false);

  const isDismissed = dismissedUntil > Date.now();
  const shouldShow  = Boolean(waitingWorker) && !isDismissed;

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let isMounted = true;
    let reg: ServiceWorkerRegistration | null = null;
    let interval: number | null = null;

    const saved = Number(sessionStorage.getItem(DISMISS_KEY) ?? "0");
    if (saved > Date.now()) setDismissedUntil(saved);

    const trackWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (!isMounted) return;
        if (worker.state === "installed" && navigator.serviceWorker.controller)
          setWaitingWorker(worker);
      });
      if (worker.state === "installed" && navigator.serviceWorker.controller)
        setWaitingWorker(worker);
    };

    (async () => {
      try {
        reg = (await navigator.serviceWorker.getRegistration()) ?? null;
        if (!isMounted || !reg) return;
        if (reg.waiting) setWaitingWorker(reg.waiting);
        trackWorker(reg.installing);
        reg.addEventListener("updatefound", () => trackWorker(reg?.installing ?? null));
      } catch {}
    })();

    const onController = () => {
      if (didReload.current) return;
      didReload.current = true;
      window.location.reload();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") reg?.update().catch(() => {});
    };

    navigator.serviceWorker.addEventListener("controllerchange", onController);
    document.addEventListener("visibilitychange", onVisibility);
    interval = window.setInterval(() => reg?.update().catch(() => {}), 60_000);

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
      document.removeEventListener("visibilitychange", onVisibility);
      if (interval) clearInterval(interval);
    };
  }, []);

  const message = useMemo(() =>
    isApplying
      ? "Instalando atualização..."
      : "Melhorias de desempenho e novas funcionalidades prontas.",
  [isApplying]);

  const dismiss = () => {
    const until = Date.now() + DISMISS_WINDOW_MS;
    sessionStorage.setItem(DISMISS_KEY, String(until));
    setDismissedUntil(until);
  };

  const update = () => {
    if (!waitingWorker || isApplying) return;
    setIsApplying(true);
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => { if (!didReload.current) window.location.reload(); }, 8000);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={  { opacity: 0, y: 20,  scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-[90] px-4"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-white/95 shadow-2xl backdrop-blur-2xl"
            style={{ border: "1px solid rgba(157,127,212,0.2)", boxShadow: "0 16px 48px rgba(30,26,46,0.18)" }}>

            <div className="relative p-5">
              {/* Glow decorativo */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #9D7FD4, transparent)" }} />

              {/* Fechar */}
              <button onClick={dismiss}
                className="absolute right-3 top-3 h-8 w-8 rounded-full flex items-center justify-center text-[#9B8FC0] hover:bg-[#EDE5FF] transition-colors">
                <X size={15} />
              </button>

              {/* Badge */}
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#DDD5F5] bg-[#F0EBFF] px-3 py-1">
                <Sparkles size={11} className="text-[#7C5CBF]" />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7C5CBF]">Nova versão disponível</span>
              </div>

              <h3 className="pr-8 text-[15px] font-black tracking-tight text-[#1E1A2E]">
                Atualização pronta para instalar
              </h3>
              <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#9B8FC0]">{message}</p>

              <div className="mt-4 flex items-center gap-2.5">
                <button onClick={dismiss}
                  className="flex-1 h-10 rounded-2xl border border-[#EDE5FF] text-[10px] font-black tracking-[0.15em] text-[#9B8FC0] uppercase hover:bg-[#FAF8FF] transition-colors">
                  Depois
                </button>
                <button onClick={update} disabled={isApplying}
                  className="flex-1 h-10 rounded-2xl text-[10px] font-black tracking-[0.15em] text-white uppercase flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                  style={{ background: "linear-gradient(135deg, #1E1A2E, #7C5CBF)" }}>
                  <RefreshCw size={13} className={isApplying ? "animate-spin" : ""} />
                  {isApplying ? "Atualizando" : "Atualizar agora"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
