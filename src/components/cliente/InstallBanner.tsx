"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { useInstallPWA } from "@/hooks/useInstallPWA";

export function InstallBanner() {
  const { canInstall, isInstalled, isInstalling, install, isIOS } = useInstallPWA();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Não mostrar se já instalado, dispensado, ou não elegível
  if (isInstalled || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed top-[calc(env(safe-area-inset-top)+8px)] inset-x-4 z-[60] max-w-lg mx-auto"
          >
            <div className="bg-[#1E1A2E] rounded-2xl border border-[#9D7FD4]/20 shadow-2xl shadow-black/20 px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#9D7FD4]/20 flex items-center justify-center shrink-0">
                <Smartphone size={16} className="text-[#9D7FD4]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white leading-none">Instalar app</p>
                <p className="text-[10px] text-white/40 mt-0.5">Acesso rápido na sua tela inicial</p>
              </div>
              <button
                onClick={async () => {
                  if (isIOS) { setShowIOSGuide(true); return; }
                  const ok = await install();
                  if (!ok) setDismissed(true);
                }}
                disabled={isInstalling}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#9D7FD4] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isInstalling ? "..." : "Instalar"}
              </button>
              <button onClick={() => setDismissed(true)}
                className="shrink-0 h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                <X size={12} className="text-white/60" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guia iOS */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
            style={{ backgroundColor: "rgba(30,26,46,0.7)", backdropFilter: "blur(8px)" }}
          >
            <div className="absolute inset-0" onClick={() => setShowIOSGuide(false)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="h-12 w-12 rounded-2xl bg-[#EDE5FF] flex items-center justify-center mx-auto mb-3">
                  <Download size={20} className="text-[#7C5CBF]" />
                </div>
                <h3 className="text-base font-black text-[#1E1A2E] mb-1">Instalar no iPhone</h3>
                <p className="text-xs text-[#9B8FC0]">3 passos simples</p>
              </div>
              <div className="space-y-3">
                {[
                  { step: "1", text: 'Toque no ícone de compartilhar (□↑) na barra do Safari' },
                  { step: "2", text: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
                  { step: "3", text: 'Toque em "Adicionar" no canto superior direito' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-full bg-[#EDE5FF] text-[#7C5CBF] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {step}
                    </span>
                    <p className="text-xs text-[#6B6480] leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setShowIOSGuide(false); setDismissed(true); }}
                className="w-full mt-5 h-11 rounded-2xl bg-[#1E1A2E] text-white text-xs font-black uppercase tracking-widest"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
