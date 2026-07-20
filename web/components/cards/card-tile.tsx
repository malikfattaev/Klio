'use client'

import { memo } from 'react'

import { CARD_THEMES, type CardThemeKey } from '@/lib/constants'
import { formatAmount } from '@/lib/format'
import type { Card } from '@/lib/types'

export const CardTile = memo(function CardTile({
  card,
  onClick,
}: {
  card: Card
  onClick: () => void
}) {
  const theme = CARD_THEMES[card.theme as CardThemeKey] ?? CARD_THEMES.indigo
  const negative = card.balance < 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="press relative flex h-[148px] w-[248px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl p-4 text-left text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]"
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
    >
      {/* Блик поверх градиента: без него плитка выглядит плоской заливкой. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.22), transparent 58%)',
        }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[15px] font-semibold">{card.name}</span>
        <span className="mt-0.5 shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-medium text-white/85">
          {card.txCount}
        </span>
      </div>

      <div className="relative">
        <span className="block text-[11px] font-medium tracking-wide text-white/70 uppercase">
          Баланс
        </span>
        <span
          className={`tnum mt-0.5 block text-[24px] leading-tight font-bold ${
            negative ? 'text-rose-100' : ''
          }`}
        >
          {formatAmount(card.balance, card.currency)}
        </span>
      </div>
    </button>
  )
})

export function AddCardTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex h-[148px] w-[132px] shrink-0 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-white/15 bg-white/3 text-muted"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white/8 text-[22px] leading-none font-light">
        +
      </span>
      <span className="text-[13px] font-medium">Добавить</span>
    </button>
  )
}
