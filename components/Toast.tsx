'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'vibe'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
  vibe: <Zap size={16} />,
}

const colors = {
  success: { border: '#2EFF2E', icon: '#2EFF2E', glow: 'rgba(46,255,46,0.15)' },
  error: { border: '#FF4444', icon: '#FF4444', glow: 'rgba(255,68,68,0.15)' },
  info: { border: '#888888', icon: '#888888', glow: 'rgba(136,136,136,0.1)' },
  vibe: { border: '#FFE048', icon: '#FFE048', glow: 'rgba(255,224,72,0.15)' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 320,
      }}>
        <AnimatePresence>
          {toasts.map(t => {
            const c = colors[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  background: '#161616',
                  border: `1px solid ${c.border}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  boxShadow: `0 0 20px ${c.glow}, 0 8px 32px rgba(0,0,0,0.5)`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  cursor: 'pointer',
                }}
                onClick={() => dismiss(t.id)}
              >
                <span style={{ color: c.icon, marginTop: 2, flexShrink: 0 }}>
                  {icons[t.type]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#F5F5F5',
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}>{t.title}</div>
                  {t.message && (
                    <div style={{
                      color: '#888',
                      fontSize: 12,
                      marginTop: 3,
                      lineHeight: 1.4,
                    }}>{t.message}</div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(t.id) }}
                  style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
