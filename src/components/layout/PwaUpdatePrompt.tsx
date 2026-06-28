'use client'

import { useEffect, useState } from 'react'

export function PwaUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reg: ServiceRegistration | null = null

    navigator.serviceWorker.ready.then((r) => {
      reg = r

      // Já tem SW em espera ao carregar a página (update foi instalado em background)
      if (r.waiting) {
        setWaiting(r.waiting)
        setVisible(true)
      }

      // SW novo instala enquanto a página está aberta
      r.addEventListener('updatefound', () => {
        const newSW = r.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(newSW)
            setVisible(true)
          }
        })
      })

      // Polling a cada 60s para checar atualização (importante para apps que ficam
      // abertas por horas sem recarregar — comum em celular de salão)
      const poll = setInterval(() => r.update().catch(() => {}), 60_000)
      return () => clearInterval(poll)
    })

    // Recarrega quando o SW novo assume controle (após SKIP_WAITING)
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  function update() {
    if (!waiting) return
    waiting.postMessage('SKIP_WAITING')
    setVisible(false)
  }

  function dismiss() {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(56px + env(safe-area-inset-top, 0px) + 8px)',
      left: 16,
      right: 16,
      zIndex: 400,
      background: '#1a1730',
      border: '1px solid rgba(167,139,250,0.30)',
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      animation: 'slideDown .22s ease',
    }}>
      <style>{`@keyframes slideDown { from { transform: translateY(-16px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
      <div style={{ fontSize: 18, flexShrink: 0 }}>🔄</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: '#f0f0ff', fontSize: 13, fontWeight: 700 }}>Nova versão disponível</p>
        <p style={{ margin: '2px 0 0', color: '#8d86a8', fontSize: 11 }}>Toque em Atualizar para aplicar</p>
      </div>
      <button
        onClick={update}
        style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: '#7C5CBF', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
      >
        Atualizar
      </button>
      <button
        onClick={dismiss}
        style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8d86a8', fontSize: 14, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'inherit' }}
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  )
}

// Workaround de tipo para ServiceWorkerRegistration
type ServiceRegistration = ServiceWorkerRegistration
