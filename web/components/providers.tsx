'use client'

import { useEffect, type ReactNode } from 'react'

import { initWebApp } from '@/lib/client/telegram'
import { ConfirmProvider } from './ui/confirm'
import { ToastProvider } from './ui/toast'

/** Совпадает с --color-ink: системные полосы Telegram красим в фон приложения. */
const BACKGROUND = '#0b0d13'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initWebApp(BACKGROUND)
  }, [])

  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}
