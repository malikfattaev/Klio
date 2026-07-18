'use client'

import { useState } from 'react'

import { useActions } from '@/lib/client/store'
import { CARD_THEMES, CARD_THEME_KEYS, type CardThemeKey } from '@/lib/constants'
import { errorMessage } from '@/lib/client/api'
import { parseAmountToMinor } from '@/lib/format'
import type { Card } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm'
import { Field, TextInput } from '@/components/ui/field'
import { groupMoney, MoneyInput } from '@/components/ui/money-input'
import { Sheet } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast'

/** Стартовый баланс приходит как минорные единицы, а поле работает со строкой. */
function balanceToInput(minor: number): string {
  if (minor === 0) return ''
  const sign = minor < 0 ? '-' : ''
  const absolute = Math.abs(minor)
  const whole = Math.trunc(absolute / 100)
  const fraction = absolute % 100
  return groupMoney(`${sign}${whole}${fraction ? `,${String(fraction).padStart(2, '0')}` : ''}`)
}

function inputToBalance(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return 0
  const negative = trimmed.startsWith('-')
  const parsed = parseAmountToMinor(trimmed.replace('-', ''))
  if (parsed === null) return null
  return negative ? -parsed : parsed
}

type CardSheetProps = {
  open: boolean
  onClose: () => void
  /** null — создание новой карты. */
  card: Card | null
  currency: string
}

export function CardSheet(props: CardSheetProps) {
  // Ключ пересобирает форму на каждое открытие: поля берут начальные значения
  // из props, поэтому отдельный эффект-сбрасыватель не нужен.
  const key = props.open ? `open-${props.card?.id ?? 'new'}` : 'closed'
  return <CardForm key={key} {...props} />
}

function CardForm({ open, onClose, card, currency }: CardSheetProps) {
  const { createCard, updateCard, deleteCard } = useActions()
  const toast = useToast()
  const confirm = useConfirm()

  const [name, setName] = useState(card?.name ?? '')
  const [theme, setTheme] = useState<CardThemeKey>((card?.theme as CardThemeKey) ?? 'indigo')
  const [balance, setBalance] = useState(card ? balanceToInput(card.initialBalance) : '')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.show('Введите название карты')
      return
    }

    const initialBalance = inputToBalance(balance)
    if (initialBalance === null) {
      toast.show('Проверьте начальный баланс')
      return
    }

    setSaving(true)
    try {
      if (card) {
        await updateCard(card.id, { name: trimmedName, theme, initialBalance })
      } else {
        await createCard({ name: trimmedName, theme, initialBalance })
      }
      onClose()
    } catch (error) {
      toast.show(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!card) return
    const confirmed = await confirm({
      title: `Удалить «${card.name}»?`,
      description:
        card.txCount > 0
          ? `Вместе с картой удалятся её операции — ${card.txCount} шт. Отменить это нельзя.`
          : 'Отменить это нельзя.',
      confirmLabel: 'Удалить',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteCard(card.id)
      onClose()
    } catch (error) {
      toast.show(errorMessage(error))
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={card ? 'Карта' : 'Новая карта'}
      footer={
        <div className="flex flex-col gap-2">
          <Button onClick={submit} loading={saving}>
            {card ? 'Сохранить' : 'Добавить карту'}
          </Button>
          {card ? (
            <Button variant="danger" onClick={remove}>
              Удалить карту
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Field label="Название">
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Humo"
            maxLength={32}
            autoFocus={!card}
          />
        </Field>

        <Field
          label="Начальный баланс"
          hint="Сколько было на карте до начала учёта. Это значение можно поменять в любой момент."
        >
          <MoneyInput
            value={balance}
            onChange={setBalance}
            currency={currency}
            allowNegative
          />
        </Field>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-muted">Цвет</span>
          <div className="grid grid-cols-8 gap-2">
            {CARD_THEME_KEYS.map((key) => {
              const option = CARD_THEMES[key]
              const active = key === theme
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={option.label}
                  onClick={() => setTheme(key)}
                  className={`press aspect-square rounded-full transition-[box-shadow] ${
                    active ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                  }`}
                  style={{ background: `linear-gradient(135deg, ${option.from}, ${option.to})` }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
