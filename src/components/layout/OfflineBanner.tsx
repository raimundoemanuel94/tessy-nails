'use client'

import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const setOnline = () => {
      if (offline) {
        setWasOffline(true)
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      }
      setOffline(false)
    }
    const setOfflineState = () => setOffline(true)

    // Estado inicial
    if (!navigator.onLine) setOffline(true)

    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOfflineState)
    return () => {
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOfflineState)
    }
  }, [offline])

  if (!offline && !showReconnected) return null

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(56px + env(safe-area-inset-top, 0px) + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 500,
      borderRadius: 999,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      animation: 'fadeInDown .2s ease',
      background: offline ? '#1c1020' : '#0d1f12',
      border: `1px solid ${offline ? 'rgba(248,113,113,0.35)' : 'rgba(52,211,153,0.35)'}`,
      color: offline ? '#f87171' : '#34d399',
    }}>
      <style>{`@keyframes fadeInDown { from { transform: translateX(-50%) translateY(-10px); opacity: 0 } to { transform: translateX(-50%) translateY(0); opacity: 1 } }`}</style>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: offline ? '#f87171' : '#34d399', flexShrink: 0 }} />
      {offline ? 'Sem conexão — mostrando dados em cache' : 'Conexão restaurada'}
    </div>
  )
}
