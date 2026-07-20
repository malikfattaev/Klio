'use client'

import { useMemo, useState } from 'react'

import { errorMessage } from '@/lib/client/api'
import { useActions } from '@/lib/client/store'
import { formatDateTimeLocalValue, parseAmountToMinor } from '@/lib/format'
import type { Card, Category, Transaction, TxKind } from '@/lib/types'
import { CategorySheet } from '@/components/categories/category-sheet'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm'
import { Field } from '@/components/ui/field'
import { groupMoney, MoneyInput } from '@/components/ui/money-input'
import { Segmented } from '@/components/ui/segmented'
import { Sheet } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast'

const KIND_OPTIONS: { value: TxKind; label: string }[] = [
  { value: 'expense', label: 'Расход' },
  { value: 'income', label: 'Доход' },
]

function amountToInput(minor: number): string {
  const whole = Math.trunc(minor / 100)
  const fraction = minor % 100
  return groupMoney(`${whole}${fraction ? `,${String(fraction).padStart(2, '0')}` : ''}`)
}

type TxSheetProps = {
  open: boolean
  onClose: () => void
  /** null: создание новой операции. */
  transaction: Transaction | null
  cards: Card[]
  categories: Category[]
  currency: string
  defaultCardId?: number | null
  /**
   * Для списков на useSWRInfinite: их ключи недоступны глобальной мутации,
   * поэтому владелец списка обновляет себя сам.
   */
  onSaved?: () => void
}

export function TxSheet(props: TxSheetProps) {
  // Ключ пересобирает форму на каждое открытие, поэтому поля берут начальные
  // значения прямо из props, поэтому отдельный эффект-сбрасыватель не нужен, а состояние
  // от прошлой операции не может утечь в следующую.
  const key = props.open ? `open-${props.transaction?.id ?? 'new'}` : 'closed'
  return <TxForm key={key} {...props} />
}

function TxForm({
  open,
  onClose,
  transaction,
  cards,
  categories,
  currency,
  defaultCardId,
  onSaved,
}: TxSheetProps) {
  const { createTransaction, updateTransaction, deleteTransaction } = useActions()
  const toast = useToast()
  const confirm = useConfirm()

  const [kind, setKind] = useState<TxKind>(transaction?.kind ?? 'expense')
  const [amount, setAmount] = useState(transaction ? amountToInput(transaction.amount) : '')
  const [cardId, setCardId] = useState<number | null>(
    transaction?.cardId ?? defaultCardId ?? cards[0]?.id ?? null,
  )
  const [pickedCategoryId, setPickedCategoryId] = useState<number | null>(
    transaction?.categoryId ?? null,
  )
  const [occurredAt, setOccurredAt] = useState(() =>
    formatDateTimeLocalValue(transaction?.occurredAt ?? new Date().toISOString()),
  )
  const [saving, setSaving] = useState(false)
  const [categorySheet, setCategorySheet] = useState(false)

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.kind === kind),
    [categories, kind],
  )

  // Категория расхода не подходит доходу. Считаем актуальный выбор прямо в рендере:
  // сброс через эффект дал бы лишний проход и кадр с недопустимым состоянием.
  const categoryId = visibleCategories.some((category) => category.id === pickedCategoryId)
    ? pickedCategoryId
    : null

  const accent = kind === 'income' ? 'var(--color-income)' : 'var(--color-expense)'

  const submit = async () => {
    const minor = parseAmountToMinor(amount)
    if (minor === null) {
      toast.show('Введите сумму больше нуля')
      return
    }
    if (!cardId) {
      toast.show('Выберите карту')
      return
    }

    const parsedDate = new Date(occurredAt)
    if (Number.isNaN(parsedDate.getTime())) {
      toast.show('Проверьте дату')
      return
    }

    const payload = {
      cardId,
      categoryId,
      kind,
      amount: minor,
      occurredAt: parsedDate.toISOString(),
    }

    setSaving(true)
    try {
      if (transaction) {
        await updateTransaction(transaction.id, payload)
      } else {
        await createTransaction(payload)
      }
      onSaved?.()
      onClose()
    } catch (error) {
      toast.show(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!transaction) return
    const confirmed = await confirm({
      title: 'Удалить операцию?',
      description: 'Баланс карты пересчитается.',
      confirmLabel: 'Удалить',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteTransaction(transaction.id)
      onSaved?.()
      onClose()
    } catch (error) {
      toast.show(errorMessage(error))
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={transaction ? 'Операция' : 'Новая операция'}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              onClick={submit}
              loading={saving}
              className="text-white"
              style={{ backgroundColor: accent }}
            >
              {transaction ? 'Сохранить' : 'Добавить'}
            </Button>
            {transaction ? (
              <Button variant="danger" onClick={remove}>
                Удалить операцию
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-5 pb-2">
          <Segmented options={KIND_OPTIONS} value={kind} onChange={setKind} accent={accent} />

          <MoneyInput
            value={amount}
            onChange={setAmount}
            currency={currency}
            autoFocus={!transaction}
            large
          />

          <div>
            <span className="mb-2 block text-[13px] font-medium text-muted">Карта</span>
            <div className="scroll-x -mx-4 flex gap-2 px-4 pb-1">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setCardId(card.id)}
                  className={`press shrink-0 rounded-xl px-3.5 py-2.5 text-[14px] font-medium ${
                    card.id === cardId ? 'bg-accent text-white' : 'bg-raised text-muted'
                  }`}
                >
                  {card.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-medium text-muted">Категория</span>
            <div className="grid grid-cols-3 gap-2">
              {visibleCategories.map((category) => {
                const active = category.id === categoryId
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setPickedCategoryId(active ? null : category.id)}
                    className={`press flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 ${
                      active ? '' : 'bg-raised'
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: `${category.color}26`,
                            boxShadow: `inset 0 0 0 1px ${category.color}`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-[20px] leading-none">{category.emoji}</span>
                    <span className="line-clamp-1 text-[12px] font-medium text-text/90">
                      {category.name}
                    </span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setCategorySheet(true)}
                className="press flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-white/15 px-2 py-3 text-muted"
              >
                <span className="text-[20px] leading-none font-light">+</span>
                <span className="text-[12px] font-medium">Новая</span>
              </button>
            </div>
          </div>

          <Field label="Дата и время">
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              className="h-13 w-full rounded-2xl border border-white/8 bg-raised px-4 text-[16px]"
            />
          </Field>
        </div>
      </Sheet>

      <CategorySheet
        open={categorySheet}
        onClose={() => setCategorySheet(false)}
        category={null}
        kind={kind}
      />
    </>
  )
}
