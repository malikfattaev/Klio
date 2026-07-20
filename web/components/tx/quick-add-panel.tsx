'use client'

import { useMemo, useState } from 'react'

import { errorMessage } from '@/lib/client/api'
import { useActions } from '@/lib/client/store'
import { haptic } from '@/lib/client/telegram'
import { parseAmountToMinor } from '@/lib/format'
import type { Card, Category, TxKind } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/ui/money-input'
import { Segmented } from '@/components/ui/segmented'
import { useToast } from '@/components/ui/toast'

const KIND_OPTIONS: { value: TxKind; label: string }[] = [
  { value: 'expense', label: 'Расход' },
  { value: 'income', label: 'Доход' },
]

/**
 * Инлайн-форма на главной вместо шторки: логировать трату должно занимать
 * одно нажатие. После сохранения сумма и категория сбрасываются, а тип и
 * карта остаются: обычно подряд добавляют несколько похожих операций.
 */
export function QuickAddPanel({
  cards,
  categories,
}: {
  cards: Card[]
  categories: Category[]
}) {
  const { createTransaction } = useActions()
  const toast = useToast()

  const [kind, setKind] = useState<TxKind>('expense')
  const [amount, setAmount] = useState('')
  const [cardId, setCardId] = useState<number | null>(cards[0]?.id ?? null)
  const [pickedCategoryId, setPickedCategoryId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.kind === kind),
    [categories, kind],
  )

  // Категория расхода не подходит доходу, поэтому считаем актуальный выбор в рендере,
  // а не сбрасываем эффектом (см. tx-sheet.tsx для того же паттерна).
  const categoryId = visibleCategories.some((category) => category.id === pickedCategoryId)
    ? pickedCategoryId
    : null

  const accent = kind === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
  const resolvedCardId = cardId ?? cards[0]?.id ?? null
  // Сумма вводится в валюте выбранной карты, а не какой-то общей для аккаунта.
  const currency = cards.find((card) => card.id === resolvedCardId)?.currency ?? 'UZS'

  const submit = async () => {
    const minor = parseAmountToMinor(amount)
    if (minor === null) {
      toast.show('Введите сумму больше нуля')
      return
    }
    if (!resolvedCardId) {
      toast.show('Выберите карту')
      return
    }

    setSaving(true)
    try {
      await createTransaction({
        cardId: resolvedCardId,
        categoryId,
        kind,
        amount: minor,
        occurredAt: new Date().toISOString(),
      })
      haptic('medium')
      setAmount('')
      setPickedCategoryId(null)
    } catch (error) {
      toast.show(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel flex flex-col gap-3 p-4">
      <Segmented options={KIND_OPTIONS} value={kind} onChange={setKind} accent={accent} />

      <MoneyInput value={amount} onChange={setAmount} currency={currency} />

      {cards.length > 1 ? (
        <div className="scroll-x -mx-1 flex gap-2 px-1">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setCardId(card.id)}
              className={`press shrink-0 rounded-xl px-3 py-2 text-[13px] font-medium ${
                card.id === resolvedCardId ? 'bg-accent text-white' : 'bg-raised text-muted'
              }`}
            >
              {card.name} · {card.currency}
            </button>
          ))}
        </div>
      ) : null}

      {visibleCategories.length > 0 ? (
        <div className="scroll-x -mx-1 flex gap-2 px-1">
          {visibleCategories.map((category) => {
            const active = category.id === categoryId
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setPickedCategoryId(active ? null : category.id)}
                className={`press flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium ${
                  active ? '' : 'bg-raised text-muted'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: `${category.color}26`,
                        boxShadow: `inset 0 0 0 1px ${category.color}`,
                        color: 'var(--color-text)',
                      }
                    : undefined
                }
              >
                <span>{category.emoji}</span>
                {category.name}
              </button>
            )
          })}
        </div>
      ) : null}

      <Button
        onClick={submit}
        loading={saving}
        className="text-white"
        style={{ backgroundColor: accent }}
      >
        Добавить
      </Button>
    </section>
  )
}
