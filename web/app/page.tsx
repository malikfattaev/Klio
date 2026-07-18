'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { CardSheet } from '@/components/cards/card-sheet'
import { AddCardTile, CardTile } from '@/components/cards/card-tile'
import { SettingsSheet } from '@/components/settings/settings-sheet'
import { Fab } from '@/components/shell/fab'
import { TxSheet } from '@/components/tx/tx-sheet'
import { TxList } from '@/components/tx/tx-list'
import { Button } from '@/components/ui/button'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { useBootstrap, useRecentTransactions, useStats } from '@/lib/client/store'
import { formatAmount } from '@/lib/format'
import type { Card, Transaction } from '@/lib/types'

export default function HomePage() {
  const { data, isLoading, error } = useBootstrap()
  const recent = useRecentTransactions(8)
  const stats = useStats('month')

  const [txSheet, setTxSheet] = useState<{ open: boolean; transaction: Transaction | null }>({
    open: false,
    transaction: null,
  })
  const [cardSheet, setCardSheet] = useState<{ open: boolean; card: Card | null }>({
    open: false,
    card: null,
  })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const cards = useMemo(() => data?.cards ?? [], [data])
  const categories = useMemo(() => data?.categories ?? [], [data])
  const currency = data?.me.currency ?? 'UZS'

  const total = useMemo(() => cards.reduce((sum, card) => sum + card.balance, 0), [cards])

  if (error) {
    return (
      <EmptyState
        emoji="🔌"
        title="Не удалось загрузить"
        description="Проверьте соединение и откройте приложение заново."
      />
    )
  }

  if (isLoading && !data) return <HomeSkeleton />

  return (
    <>
      <header className="rise-in mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted">
              {data?.me.firstName ? `Привет, ${data.me.firstName}` : 'Общий баланс'}
            </p>
            <h1 className="tnum mt-1 text-[32px] leading-tight font-bold break-all">
              {formatAmount(total, currency)}
            </h1>
          </div>

          <button
            type="button"
            aria-label="Настройки"
            onClick={() => setSettingsOpen(true)}
            className="press mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-raised text-muted"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
              <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15.1 4.7a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.06a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <MonthTile
            label="Доходы за месяц"
            value={formatAmount(stats.data?.incomeTotal ?? 0, currency)}
            tone="income"
          />
          <MonthTile
            label="Расходы за месяц"
            value={formatAmount(stats.data?.expenseTotal ?? 0, currency)}
            tone="expense"
          />
        </div>
      </header>

      <section className="mb-7">
        <h2 className="mb-3 px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">
          Карты
        </h2>
        <div className="scroll-x -mx-4 flex gap-3 px-4 pb-1">
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              currency={currency}
              onClick={() => setCardSheet({ open: true, card })}
            />
          ))}
          <AddCardTile onClick={() => setCardSheet({ open: true, card: null })} />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">
            Последние операции
          </h2>
          <Link href="/history" className="text-[13px] font-medium text-accent">
            Вся история
          </Link>
        </div>

        {recent.isLoading && !recent.data ? (
          <ListSkeleton rows={4} />
        ) : recent.data && recent.data.items.length > 0 ? (
          <TxList
            items={recent.data.items}
            cards={cards}
            categories={categories}
            currency={currency}
            onSelect={(transaction) => setTxSheet({ open: true, transaction })}
          />
        ) : cards.length === 0 ? (
          <EmptyState
            emoji="💳"
            title="Начните с карты"
            description="Добавьте карту и её начальный баланс — потом можно будет записывать расходы и доходы."
            action={
              <Button onClick={() => setCardSheet({ open: true, card: null })}>
                Добавить карту
              </Button>
            }
          />
        ) : (
          <EmptyState
            emoji="✍️"
            title="Пока пусто"
            description="Запишите первый расход или доход — он появится здесь."
            action={
              <Button onClick={() => setTxSheet({ open: true, transaction: null })}>
                Добавить операцию
              </Button>
            }
          />
        )}
      </section>

      {cards.length > 0 ? (
        <Fab onClick={() => setTxSheet({ open: true, transaction: null })} />
      ) : null}

      <TxSheet
        open={txSheet.open}
        onClose={() => setTxSheet({ open: false, transaction: null })}
        transaction={txSheet.transaction}
        cards={cards}
        categories={categories}
        currency={currency}
      />

      <CardSheet
        open={cardSheet.open}
        onClose={() => setCardSheet({ open: false, card: null })}
        card={cardSheet.card}
        currency={currency}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currency={currency}
      />
    </>
  )
}

function MonthTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'income' | 'expense'
}) {
  return (
    <div className="panel px-3.5 py-3">
      <span className="block text-[12px] text-muted">{label}</span>
      <span
        className={`tnum mt-1 block truncate text-[16px] font-semibold ${
          tone === 'income' ? 'text-income' : 'text-expense'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16" />
      ))}
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-9 w-52" />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-[148px] w-[248px] shrink-0" />
        <Skeleton className="h-[148px] w-[132px] shrink-0" />
      </div>
      <ListSkeleton rows={4} />
    </div>
  )
}
