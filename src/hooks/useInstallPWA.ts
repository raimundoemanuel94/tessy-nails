/**
 * Hook para detectar e disparar a instalação do PWA.
 * Funciona em Android/Chrome. iOS usa "Adicionar à tela inicial" manualmente.
 */

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Detectar se já está instalado
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || (navigator as { standalone?: boolean }).standalone === true);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    setIsInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setPrompt(null);
        setIsInstalled(true);
        return true;
      }
      return false;
    } finally {
      setIsInstalling(false);
    }
  };

  return {
    canInstall: !!prompt && !isInstalled,
    isInstalled,
    isInstalling,
    install,
    // iOS não tem beforeinstallprompt — detectar para mostrar instrução manual
    isIOS: /iPad|iPhone|iPod/.test(navigator?.userAgent ?? "") && !(window as { MSStream?: unknown }).MSStream,
  };
}
