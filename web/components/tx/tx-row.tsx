'use client'

import { memo } from 'react'

import { formatSigned, formatTime } from '@/lib/format'
import type { Category, Transaction } from '@/lib/types'

export const TxRow = memo(function TxRow({
  transaction,
  category,
  cardName,
  currency,
  onClick,
}: {
  transaction: Transaction
  category: Category | undefined
  /** Показываем только когда карт несколько, иначе это шум. */
  cardName: string | null
  currency: string
  onClick: () => void
}) {
  const income = transaction.kind === 'income'
  const title = category?.name ?? 'Без категории'
  const subtitle = [cardName, formatTime(transaction.occurredAt)].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      className="press list-virtual flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left active:bg-white/5"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-[19px]"
        style={{ backgroundColor: `${category?.color ?? '#64748b'}26` }}
      >
        {category?.emoji ?? '🗂️'}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-muted">{subtitle}</span>
      </span>

      <span
        className={`tnum shrink-0 text-[15px] font-semibold ${income ? 'text-income' : 'text-text'}`}
      >
        {formatSigned(transaction.amount, currency, transaction.kind)}
      </span>
    </button>
  )
})
