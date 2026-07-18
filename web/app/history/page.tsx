'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Fab } from '@/components/shell/fab'
import { TxSheet } from '@/components/tx/tx-sheet'
import { TxList } from '@/components/tx/tx-list'
import { Spinner } from '@/components/ui/button'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { Segmented } from '@/components/ui/segmented'
import { useBootstrap, useTransactions } from '@/lib/client/store'
import type { Transaction, TxKind } from '@/lib/types'

type KindFilter = 'all' | TxKind

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'expense', label: 'Расходы' },
  { value: 'income', label: 'Доходы' },
]

export default function HistoryPage() {
  const { data: bootstrap } = useBootstrap()
  const [kind, setKind] = useState<KindFilter>('all')
  const [cardId, setCardId] = useState<number | null>(null)
  const [pickedCategoryId, setPickedCategoryId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [creating, setCreating] = useState(false)

  const cards = useMemo(() => bootstrap?.cards ?? [], [bootstrap])
  const categories = useMemo(() => bootstrap?.categories ?? [], [bootstrap])
  const currency = bootstrap?.me.currency ?? 'UZS'

  const visibleCategories = useMemo(
    () => (kind === 'all' ? categories : categories.filter((category) => category.kind === kind)),
    [categories, kind],
  )

  // Смена типа может выбросить выбранную категорию из списка. Считаем
  // действующий фильтр в рендере: сброс через эффект дал бы лишний запрос
  // со старым, уже неверным значением.
  const categoryId = visibleCategories.some((category) => category.id === pickedCategoryId)
    ? pickedCategoryId
    : null

  const filters = useMemo(
    () => ({
      cardId,
      categoryId,
      kind: kind === 'all' ? null : kind,
    }),
    [cardId, categoryId, kind],
  )

  const { items, hasMore, isLoadingMore, isLoading, data, setSize, mutate } =
    useTransactions(filters)

  // Догружаем следующую страницу заранее, за 240px до конца списка.
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setSize((size) => size + 1)
      },
      { rootMargin: '240px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, setSize])

  return (
    <>
      <header className="mb-4">
        <h1 className="mb-4 text-[24px] font-bold">История</h1>

        <div className="flex flex-col gap-2.5">
          <Segmented options={KIND_OPTIONS} value={kind} onChange={setKind} />

          {cards.length > 1 ? (
            <ChipRow>
              <Chip active={cardId === null} onClick={() => setCardId(null)}>
                Все карты
              </Chip>
              {cards.map((card) => (
                <Chip
                  key={card.id}
                  active={cardId === card.id}
                  onClick={() => setCardId(card.id)}
                >
                  {card.name}
                </Chip>
              ))}
            </ChipRow>
          ) : null}

          {visibleCategories.length > 0 ? (
            <ChipRow>
              <Chip active={categoryId === null} onClick={() => setPickedCategoryId(null)}>
                Все категории
              </Chip>
              {visibleCategories.map((category) => (
                <Chip
                  key={category.id}
                  active={categoryId === category.id}
                  onClick={() => setPickedCategoryId(category.id)}
                >
                  {category.emoji} {category.name}
                </Chip>
              ))}
            </ChipRow>
          ) : null}
        </div>
      </header>

      {isLoading && !data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Ничего не найдено"
          description={
            cardId || categoryId || kind !== 'all'
              ? 'Попробуйте снять фильтры.'
              : 'Здесь появятся все ваши операции.'
          }
        />
      ) : (
        <>
          <TxList
            items={items}
            cards={cards}
            categories={categories}
            currency={currency}
            onSelect={setSelected}
          />

          <div ref={sentinel} className="flex justify-center py-6">
            {isLoadingMore ? <Spinner className="text-faint" /> : null}
          </div>
        </>
      )}

      {cards.length > 0 ? <Fab onClick={() => setCreating(true)} /> : null}

      <TxSheet
        open={selected !== null || creating}
        onClose={() => {
          setSelected(null)
          setCreating(false)
        }}
        transaction={selected}
        cards={cards}
        categories={categories}
        currency={currency}
        defaultCardId={cardId}
        onSaved={() => mutate()}
      />
    </>
  )
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="scroll-x -mx-4 flex gap-2 px-4 pb-0.5">{children}</div>
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium whitespace-nowrap ${
        active ? 'bg-accent text-white' : 'bg-raised text-muted'
      }`}
    >
      {children}
    </button>
  )
}
