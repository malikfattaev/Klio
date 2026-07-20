'use client'

import { useMemo } from 'react'

import { formatAmount, formatDayLabel } from '@/lib/format'
import type { Card, Category, Transaction } from '@/lib/types'
import { TxRow } from './tx-row'

type Group = {
  key: string
  label: string
  /** Итог дня считается по каждой валюте отдельно: карты могут быть в разных валютах. */
  netByCurrency: Map<string, number>
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
  onSelect,
  grouped = true,
}: {
  items: Transaction[]
  cards: Card[]
  categories: Category[]
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
    if (!grouped) return [{ key: 'all', label: '', netByCurrency: new Map(), items }]

    const map = new Map<string, Group>()
    for (const transaction of items) {
      const key = dayKey(transaction.occurredAt)
      let group = map.get(key)
      if (!group) {
        group = {
          key,
          label: formatDayLabel(transaction.occurredAt),
          netByCurrency: new Map(),
          items: [],
        }
        map.set(key, group)
      }
      group.items.push(transaction)

      const currency = cardById.get(transaction.cardId)?.currency ?? 'UZS'
      const delta = transaction.kind === 'income' ? transaction.amount : -transaction.amount
      group.netByCurrency.set(currency, (group.netByCurrency.get(currency) ?? 0) + delta)
    }
    return [...map.values()]
  }, [items, grouped, cardById])

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.key}>
          {grouped ? (
            <header className="mb-1 flex items-baseline justify-between gap-2 px-2">
              <h3 className="text-[13px] font-semibold text-muted">{group.label}</h3>
              <span className="flex flex-wrap justify-end gap-x-2">
                {[...group.netByCurrency.entries()].map(([currency, net]) => (
                  <span
                    key={currency}
                    className={`tnum text-[13px] font-medium ${
                      net > 0 ? 'text-income' : 'text-faint'
                    }`}
                  >
                    {net > 0 ? '+' : net < 0 ? '−' : ''}
                    {formatAmount(Math.abs(net), currency)}
                  </span>
                ))}
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
                currency={cardById.get(transaction.cardId)?.currency ?? 'UZS'}
                onClick={() => onSelect(transaction)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
