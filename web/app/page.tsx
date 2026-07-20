'use client'

import { useMemo, useState } from 'react'

import { CardSheet } from '@/components/cards/card-sheet'
import { AddCardTile, CardTile } from '@/components/cards/card-tile'
import { QuickAddPanel } from '@/components/tx/quick-add-panel'
import { Button } from '@/components/ui/button'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { ApiError } from '@/lib/client/api'
import { useBootstrap } from '@/lib/client/store'
import { formatAmount } from '@/lib/format'
import type { Card } from '@/lib/types'

/** Валюта главного итога: суммировать карты в разных валютах напрямую нельзя. */
const PRIMARY_CURRENCY = 'UZS'

export default function HomePage() {
  const { data, isLoading, error } = useBootstrap()

  const [cardSheet, setCardSheet] = useState<{ open: boolean; card: Card | null }>({
    open: false,
    card: null,
  })

  const cards = useMemo(() => data?.cards ?? [], [data])
  const categories = useMemo(() => data?.categories ?? [], [data])

  const primaryTotal = useMemo(
    () =>
      cards
        .filter((card) => card.currency === PRIMARY_CURRENCY)
        .reduce((sum, card) => sum + card.balance, 0),
    [cards],
  )

  // Карты в остальных валютах не входят в общий итог: сумма долларов и сумов
  // не значит ничего. Каждая валюта показывается отдельной плашкой рядом.
  const secondaryTotals = useMemo(() => {
    const byCurrency = new Map<string, number>()
    for (const card of cards) {
      if (card.currency === PRIMARY_CURRENCY) continue
      byCurrency.set(card.currency, (byCurrency.get(card.currency) ?? 0) + card.balance)
    }
    return [...byCurrency.entries()]
  }, [cards])

  if (error) {
    // Вне Telegram подписи initData нет, и сервер отвечает 401, а это не сбой сети,
    // поэтому и подсказка должна быть про способ открытия, а не про соединение.
    const unauthorized = error instanceof ApiError && error.status === 401
    return (
      <EmptyState
        emoji={unauthorized ? '🔒' : '🔌'}
        title={unauthorized ? 'Откройте через Telegram' : 'Не удалось загрузить'}
        description={
          unauthorized
            ? 'Klio работает внутри Telegram: запустите приложение кнопкой в чате с ботом.'
            : 'Проверьте соединение и откройте приложение заново.'
        }
      />
    )
  }

  if (isLoading && !data) return <HomeSkeleton />

  return (
    <>
      <header className="rise-in mb-6">
        <p className="text-[13px] font-medium text-muted">
          {data?.me.firstName ? `Привет, ${data.me.firstName}` : 'Общий баланс'}
        </p>
        <h1 className="tnum mt-1 text-[32px] leading-tight font-bold break-all">
          {formatAmount(primaryTotal, PRIMARY_CURRENCY)}
        </h1>

        {secondaryTotals.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {secondaryTotals.map(([currency, amount]) => (
              <span
                key={currency}
                className="panel px-3 py-1 text-[14px] font-semibold tabular-nums"
              >
                {formatAmount(amount, currency)}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <section className="mb-5">
        <div className="scroll-x -mx-4 flex gap-3 px-4 pb-1">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} onClick={() => setCardSheet({ open: true, card })} />
          ))}
          <AddCardTile onClick={() => setCardSheet({ open: true, card: null })} />
        </div>
      </section>

      {cards.length > 0 ? (
        <QuickAddPanel cards={cards} categories={categories} />
      ) : (
        <EmptyState
          emoji="💳"
          title="Начните с карты"
          description="Добавьте карту и её начальный баланс, потом можно будет записывать расходы и доходы."
          action={
            <Button onClick={() => setCardSheet({ open: true, card: null })}>
              Добавить карту
            </Button>
          }
        />
      )}

      <CardSheet
        open={cardSheet.open}
        onClose={() => setCardSheet({ open: false, card: null })}
        card={cardSheet.card}
      />
    </>
  )
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-9 w-52" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-[148px] w-[248px] shrink-0" />
        <Skeleton className="h-[148px] w-[132px] shrink-0" />
      </div>
      <Skeleton className="h-[220px]" />
    </div>
  )
}
