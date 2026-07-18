'use client'

import { useState } from 'react'

import { errorMessage } from '@/lib/client/api'
import { useActions } from '@/lib/client/store'
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/lib/constants'
import type { Category, TxKind } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm'
import { Field, TextInput } from '@/components/ui/field'
import { Sheet } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast'

type CategorySheetProps = {
  open: boolean
  onClose: () => void
  /** null — создание новой категории. */
  category: Category | null
  kind: TxKind
  onCreated?: () => void
}

export function CategorySheet(props: CategorySheetProps) {
  // Ключ пересобирает форму на каждое открытие: поля берут начальные значения
  // из props, поэтому отдельный эффект-сбрасыватель не нужен.
  const key = props.open ? `open-${props.category?.id ?? `new-${props.kind}`}` : 'closed'
  return <CategoryForm key={key} {...props} />
}

function CategoryForm({ open, onClose, category, kind, onCreated }: CategorySheetProps) {
  const { createCategory, updateCategory, deleteCategory } = useActions()
  const toast = useToast()
  const confirm = useConfirm()

  const [name, setName] = useState(category?.name ?? '')
  const [emoji, setEmoji] = useState(
    category?.emoji ?? (kind === 'income' ? '💰' : CATEGORY_EMOJIS[0]),
  )
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0])
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.show('Введите название категории')
      return
    }

    setSaving(true)
    try {
      if (category) {
        await updateCategory(category.id, { name: trimmed, emoji, color })
      } else {
        await createCategory({ name: trimmed, kind, emoji, color })
        onCreated?.()
      }
      onClose()
    } catch (error) {
      toast.show(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!category) return
    const confirmed = await confirm({
      title: `Удалить «${category.name}»?`,
      description: 'Операции этой категории останутся, но перейдут в «Без категории».',
      confirmLabel: 'Удалить',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteCategory(category.id)
      onClose()
    } catch (error) {
      toast.show(errorMessage(error))
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={category ? 'Категория' : 'Новая категория'}
      footer={
        <div className="flex flex-col gap-2">
          <Button onClick={submit} loading={saving}>
            {category ? 'Сохранить' : 'Создать'}
          </Button>
          {category ? (
            <Button variant="danger" onClick={remove}>
              Удалить категорию
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex items-center gap-3">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-[26px]"
            style={{ backgroundColor: `${color}26` }}
          >
            {emoji}
          </span>
          <div className="min-w-0 flex-1">
            <Field label="Название">
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={kind === 'income' ? 'Например, Премия' : 'Например, Такси'}
                maxLength={32}
                autoFocus={!category}
              />
            </Field>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-muted">Значок</span>
          <div className="grid grid-cols-8 gap-1.5">
            {CATEGORY_EMOJIS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEmoji(option)}
                className={`press flex aspect-square items-center justify-center rounded-xl text-[20px] ${
                  option === emoji ? 'bg-accent/25 ring-1 ring-accent' : 'bg-raised'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-muted">Цвет</span>
          <div className="grid grid-cols-12 gap-1.5">
            {CATEGORY_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={option}
                onClick={() => setColor(option)}
                className={`press aspect-square rounded-full ${
                  option === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                }`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
