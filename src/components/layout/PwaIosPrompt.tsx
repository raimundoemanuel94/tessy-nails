'use client'

import { useEffect, useState } from 'react'

export function PwaIosPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Só mostra no Safari/iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const wasDismissed = localStorage.getItem('nailit-ios-prompt-dismissed') === '1'

    if (!isIos || !isSafari || isStandalone || wasDismissed) return

    // Mostra após 20s de uso
    const t = setTimeout(() => setVisible(true), 20_000)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    localStorage.setItem('nailit-ios-prompt-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(74px + env(safe-area-inset-bottom, 0px))',
      left: 12,
      right: 12,
      zIndex: 300,
      background: '#1a1730',
      border: '1px solid rgba(167,139,250,0.25)',
      borderRadius: 16,
      padding: '16px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      animation: 'slideUp .25s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#9D7FD4,#7C5CBF)', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>
            💅
          </div>
          <div>
            <p style={{ margin: 0, color: '#f0f0ff', fontSize: 13, fontWeight: 700 }}>Instalar Nailit</p>
            <p style={{ margin: '2px 0 0', color: '#8d86a8', fontSize: 11 }}>Adicione à tela inicial para acesso rápido</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8d86a8', fontSize: 14, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'inherit' }}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      {/* Passo a passo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '⬆️', text: 'Toque em Compartilhar na barra do Safari (ícone de caixa com seta)' },
          { icon: '➕', text: 'Toque em "Adicionar à Tela de Início"' },
          { icon: '✅', text: 'Toque em "Adicionar" no canto superior direito' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center' }}>{icon}</span>
            <span style={{ color: '#c0bbd8', fontSize: 12, lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Seta apontando para a barra de ferramentas do Safari */}
      <div style={{
        position: 'absolute',
        bottom: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '8px solid rgba(167,139,250,0.25)',
      }} />
    </div>
  )
}
