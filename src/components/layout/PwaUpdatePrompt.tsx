'use client'

import { useEffect, useState } from 'react'

export function PwaUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [visible, setVisible] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((r) => {
      if (r.waiting) { setWaiting(r.waiting); setVisible(true) }

      r.addEventListener('updatefound', () => {
        const sw = r.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(sw); setVisible(true)
          }
        })
      })

      const poll = setInterval(() => r.update().catch(() => {}), 60_000)
      return () => clearInterval(poll)
    })

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload() }
    })
  }, [])

  async function update() {
    if (!waiting) return
    setUpdating(true)
    waiting.postMessage('SKIP_WAITING')
    // Timeout de segurança — se reload não disparar em 5s, força
    setTimeout(() => window.location.reload(), 5000)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes slideDownUpdate {
          from { transform: translateY(-100%); opacity: 0 }
          to   { transform: translateY(0);    opacity: 1 }
        }
        @keyframes spinUpdate { to { transform: rotate(360deg) } }
        .update-overlay {
          position: fixed;
          top: calc(56px + env(safe-area-inset-top, 0px) + 8px);
          left: 12px; right: 12px;
          z-index: 9000;
          animation: slideDownUpdate .3s cubic-bezier(.34,1.56,.64,1);
        }
      `}</style>

      <div className="update-overlay">
        <div style={{
          background: 'linear-gradient(135deg, #1a1035, #12082a)',
          border: '1px solid rgba(167,139,250,0.4)',
          borderRadius: 18,
          padding: '16px 18px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.1)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'grid', placeItems: 'center', fontSize: 20,
            }}>
              ✨
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, color: '#f0f0ff', fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>
                Nova versão disponível
              </p>
              <p style={{ margin: '3px 0 0', color: '#a78bfa', fontSize: 11, fontWeight: 600 }}>
                Melhorias e correções prontas para instalar
              </p>
            </div>
            {!updating && (
              <button
                onClick={() => setVisible(false)}
                style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8d86a8', fontSize: 16, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'inherit' }}
                aria-label="Depois"
              >×</button>
            )}
          </div>

          {/* O que mudou */}
          <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(167,139,250,0.07)', borderRadius: 10, border: '1px solid rgba(167,139,250,0.12)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 800, color: '#8d86a8', textTransform: 'uppercase', letterSpacing: '.07em' }}>Nesta versão</p>
            {[
              'Melhorias de velocidade no app',
              'Correções de layout no celular',
              'Atualizações de segurança',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#a78bfa', fontSize: 12, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: '#c0bbd8' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Ação */}
          <button
            onClick={update}
            disabled={updating}
            style={{
              width: '100%', height: 44, borderRadius: 12, border: 'none', cursor: updating ? 'wait' : 'pointer',
              background: updating ? 'rgba(167,139,250,0.2)' : 'linear-gradient(135deg, #7c3aed, #9d7fd4)',
              color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s',
              boxShadow: updating ? 'none' : '0 4px 16px rgba(124,92,191,0.4)',
            }}
          >
            {updating
              ? <>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spinUpdate .7s linear infinite', display: 'inline-block' }} />
                  Atualizando…
                </>
              : <>✨ Atualizar agora</>}
          </button>
          {!updating && (
            <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 11, color: '#8d86a8' }}>
              O app vai recarregar automaticamente
            </p>
          )}
        </div>
      </div>
    </>
  )
}

type ServiceRegistration = ServiceWorkerRegistration
