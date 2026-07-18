'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { getWebApp, haptic } from '@/lib/client/telegram'

const EXIT_MS = 200

/** На сервере document нет, поэтому портал монтируется только после гидрации. */
const neverChanges = () => () => {}
const onClient = () => true
const onServer = () => false

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Нижняя шторка. Пока она открыта, страница под ней не скроллится, а системная
 * кнопка «назад» в Telegram закрывает шторку вместо всего мини-аппа.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const mounted = useSyncExternalStore(neverChanges, onClient, onServer)
  const [rendered, setRendered] = useState(open)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  // Подстройка состояния прямо в рендере: открытие должно попасть в тот же кадр,
  // иначе шторка появляется с заметной задержкой в один проход эффектов.
  if (open && !rendered) setRendered(true)

  // Уход анимируем, пока узел ещё в DOM, и снимаем его по окончании.
  const closing = rendered && !open
  const visible = rendered

  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => setRendered(false), EXIT_MS)
    return () => clearTimeout(timer)
  }, [closing])

  useEffect(() => {
    if (!visible) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKeyDown)

    const backButton = getWebApp()?.BackButton
    const handleBack = () => closeRef.current()
    backButton?.onClick(handleBack)
    backButton?.show()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      backButton?.offClick(handleBack)
      backButton?.hide()
    }
  }, [visible])

  if (!mounted || !visible) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ opacity: closing ? 0 : 1, transition: `opacity ${EXIT_MS}ms ease-out` }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={() => {
          haptic('light')
          onClose()
        }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-in relative flex max-h-[92dvh] flex-col rounded-t-[28px] border-t border-white/10 bg-surface shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
        style={
          closing
            ? { transform: 'translateY(100%)', transition: `transform ${EXIT_MS}ms ease-in` }
            : undefined
        }
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {title ? (
          <h2 className="px-5 pt-1 pb-3 text-center text-[17px] font-semibold">{title}</h2>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">{children}</div>

        {footer ? (
          <div
            className="border-t border-white/8 px-5 pt-3"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 14px)' }}
          >
            {footer}
          </div>
        ) : (
          <div style={{ height: 'calc(var(--safe-bottom) + 14px)' }} />
        )}
      </div>
    </div>,
    document.body,
  )
}
