'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Não mostrar se já instalado ou se usuário descartou antes
    const isPwa = window.matchMedia('(display-mode: standalone)').matches
    const wasDismissed = localStorage.getItem('nailit-install-dismissed') === '1'
    if (isPwa || wasDismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      // Aguarda 30s para não interromper o primeiro uso
      setTimeout(() => setVisible(true), 30_000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible || dismissed || !prompt) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      setDismissed(true)
    }
  }

  function dismiss() {
    localStorage.setItem('nailit-install-dismissed', '1')
    setVisible(false)
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(74px + env(safe-area-inset-bottom, 0px))',
      left: 16,
      right: 16,
      zIndex: 300,
      background: '#1a1730',
      border: '1px solid rgba(167,139,250,0.25)',
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideUp .25s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#9D7FD4,#7C5CBF)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 20 }}>
        💅
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: '#f0f0ff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>Instalar Nailit</p>
        <p style={{ margin: '2px 0 0', color: '#8d86a8', fontSize: 11 }}>Acesso rápido direto da tela inicial</p>
      </div>
      <button
        onClick={install}
        style={{ height: 34, padding: '0 14px', borderRadius: 10, border: 'none', background: '#7C5CBF', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
      >
        Instalar
      </button>
      <button
        onClick={dismiss}
        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8d86a8', fontSize: 16, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'inherit' }}
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  )
}
