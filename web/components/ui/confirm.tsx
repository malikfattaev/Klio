'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import { Button } from './button'
import { Sheet } from './sheet'

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

/**
 * Императивный confirm: `await confirm({...})` возвращает выбор пользователя.
 * Одна шторка на всё приложение вместо копии состояния в каждом экране.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const settle = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setOptions(null)
  }, [])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Sheet open={options !== null} onClose={() => settle(false)} title={options?.title}>
        {options?.description ? (
          <p className="pb-5 text-center text-[15px] leading-relaxed text-muted">
            {options.description}
          </p>
        ) : (
          <div className="h-2" />
        )}
        <div className="flex flex-col gap-2 pb-2">
          <Button
            variant={options?.destructive ? 'danger' : 'primary'}
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? 'Подтвердить'}
          </Button>
          <Button variant="ghost" onClick={() => settle(false)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used inside ConfirmProvider')
  return context
}
