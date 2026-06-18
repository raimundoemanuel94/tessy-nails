'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function MobileDrawer({ open, onClose, title, children }: Props) {
  const [visible, setVisible] = useState(false)
  const [animOut, setAnimOut] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setAnimOut(false)
      document.body.style.overflow = 'hidden'
    } else if (visible) {
      close()
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function close() {
    setAnimOut(true)
    setTimeout(() => {
      setVisible(false)
      setAnimOut(false)
      document.body.style.overflow = ''
      onClose()
    }, 280)
  }

  // Swipe down to close
  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
  }
  function onTouchMove(e: React.TouchEvent) {
    currentY.current = e.touches[0].clientY
    const delta = currentY.current - startY.current
    if (delta > 0 && drawerRef.current) {
      drawerRef.current.style.transform = `translateY(${delta}px)`
    }
  }
  function onTouchEnd() {
    const delta = currentY.current - startY.current
    if (delta > 100) {
      close()
    } else if (drawerRef.current) {
      drawerRef.current.style.transform = ''
    }
  }

  if (!visible) return null

  return (
    <div
      onClick={e => e.target === e.currentTarget && close()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: animOut ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.6)',
        transition: 'background .28s ease',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        ref={drawerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          background: '#0f0d1c',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          transform: animOut ? 'translateY(100%)' : 'translateY(0)',
          transition: animOut ? 'transform .28s ease' : 'transform .32s cubic-bezier(0.34, 1.56, 0.64, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          willChange: 'transform',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f0f0ff' }}>{title}</span>
          <button
            onClick={close}
            style={{
              width: 30, height: 30, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#8d86a8',
              fontSize: 18, fontFamily: 'inherit',
            }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
