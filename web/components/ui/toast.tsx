'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import { hapticNotify } from '@/lib/client/telegram'

type ToastTone = 'error' | 'success'
type Toast = { id: number; message: string; tone: ToastTone }

const ToastContext = createContext<{
  show: (message: string, tone?: ToastTone) => void
} | null>(null)

const VISIBLE_MS = 2600

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, tone: ToastTone = 'error') => {
    const id = nextId.current++
    hapticNotify(tone)
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, VISIBLE_MS)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-100 flex flex-col items-center gap-2 px-4"
        style={{ top: 'calc(var(--safe-top) + 12px)' }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rise-in max-w-full rounded-2xl px-4 py-3 text-[14px] font-medium shadow-lg backdrop-blur-xl ${
              toast.tone === 'error'
                ? 'bg-expense/90 text-white'
                : 'bg-income/90 text-[#04221a]'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
