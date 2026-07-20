'use client'

import { haptic } from '@/lib/client/telegram'

/** Главное действие приложения: держим его в зоне большого пальца над навигацией. */
export function Fab({ onClick, label = 'Добавить операцию' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        haptic('medium')
        onClick()
      }}
      className="press fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_28px_-6px_rgba(108,123,255,0.65)] active:bg-accent-soft"
      style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)' }}
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden>
        <path
          d="M12 5.5v13M5.5 12h13"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
