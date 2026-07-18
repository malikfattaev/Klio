'use client'

import { useMemo } from 'react'

import { formatAmount, formatDayLabel } from '@/lib/format'
import type { Card, Category, Transaction } from '@/lib/types'
import { TxRow } from './tx-row'

type Group = {
  key: string
  label: string
  net: number
  items: Transaction[]
}

/** Ключ дня в локальной зоне: по ISO-строке день «уезжает» под UTC. */
function dayKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function TxList({
  items,
  cards,
  categories,
  currency,
  onSelect,
  grouped = true,
}: {
  items: Transaction[]
  cards: Card[]
  categories: Category[]
  currency: string
  onSelect: (transaction: Transaction) => void
  grouped?: boolean
}) {
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const cardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const showCardName = cards.length > 1

  const groups = useMemo<Group[]>(() => {
    if (!grouped) return [{ key: 'all', label: '', net: 0, items }]

    const map = new Map<string, Group>()
    for (const transaction of items) {
      const key = dayKey(transaction.occurredAt)
      let group = map.get(key)
      if (!group) {
        group = { key, label: formatDayLabel(transaction.occurredAt), net: 0, items: [] }
        map.set(key, group)
      }
      group.items.push(transaction)
      group.net += transaction.kind === 'income' ? transaction.amount : -transaction.amount
    }
    return [...map.values()]
  }, [items, grouped])

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.key}>
          {grouped ? (
            <header className="mb-1 flex items-baseline justify-between px-2">
              <h3 className="text-[13px] font-semibold text-muted">{group.label}</h3>
              <span
                className={`tnum text-[13px] font-medium ${
                  group.net > 0 ? 'text-income' : 'text-faint'
                }`}
              >
                {group.net > 0 ? '+' : group.net < 0 ? '−' : ''}
                {formatAmount(Math.abs(group.net), currency)}
              </span>
            </header>
          ) : null}

          <div className="flex flex-col">
            {group.items.map((transaction) => (
              <TxRow
                key={transaction.id}
                transaction={transaction}
                category={
                  transaction.categoryId ? categoryById.get(transaction.categoryId) : undefined
                }
                cardName={
                  showCardName ? (cardById.get(transaction.cardId)?.name ?? null) : null
                }
                currency={currency}
                onClick={() => onSelect(transaction)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
