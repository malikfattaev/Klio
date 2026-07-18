'use client'

import { useMemo, useState } from 'react'

import { CategorySheet } from '@/components/categories/category-sheet'
import { Bars } from '@/components/stats/bars'
import { Donut } from '@/components/stats/donut'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { Segmented } from '@/components/ui/segmented'
import { periodRange, PERIODS, type Period } from '@/lib/client/period'
import { fillSeries } from '@/lib/client/series'
import { useBootstrap, useStats } from '@/lib/client/store'
import { formatAmount } from '@/lib/format'
import type { Category, TxKind } from '@/lib/types'

const KIND_OPTIONS: { value: TxKind; label: string }[] = [
  { value: 'expense', label: 'Расходы' },
  { value: 'income', label: 'Доходы' },
]

export default function StatsPage() {
  const { data: bootstrap } = useBootstrap()
  const [period, setPeriod] = useState<Period>('month')
  const [kind, setKind] = useState<TxKind>('expense')
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: stats, isLoading } = useStats(period)

  const currency = bootstrap?.me.currency ?? 'UZS'
  const categories = useMemo(() => bootstrap?.categories ?? [], [bootstrap])
  const accent = kind === 'income' ? 'var(--color-income)' : 'var(--color-expense)'

  const slices = kind === 'income' ? (stats?.income ?? []) : (stats?.expense ?? [])
  const total = kind === 'income' ? (stats?.incomeTotal ?? 0) : (stats?.expenseTotal ?? 0)

  const granularity = period === 'year' || period === 'all' ? 'month' : 'day'

  const series = useMemo(() => {
    if (!stats) return []
    const { to } = periodRange(period)
    return fillSeries(stats.daily, to, granularity).map((point) => ({
      date: point.date,
      value: kind === 'income' ? point.income : point.expense,
    }))
  }, [stats, period, granularity, kind])

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  return (
    <>
      <header className="mb-5">
        <h1 className="mb-4 text-[24px] font-bold">Категории</h1>
        <div className="flex flex-col gap-2">
          <Segmented options={PERIODS} value={period} onChange={setPeriod} />
          <Segmented options={KIND_OPTIONS} value={kind} onChange={setKind} accent={accent} />
        </div>
      </header>

      {isLoading && !stats ? (
        <StatsSkeleton />
      ) : total === 0 ? (
        <EmptyState
          emoji="📊"
          title={kind === 'income' ? 'Доходов пока нет' : 'Расходов пока нет'}
          description="Добавьте операции за этот период — здесь появится разбивка по категориям."
        />
      ) : (
        <>
          <section className="panel mb-4 px-4 py-5">
            <Donut
              slices={slices}
              centerLabel={kind === 'income' ? 'Доход' : 'Расход'}
              centerValue={formatAmount(total, currency)}
            />
          </section>

          {series.length > 1 ? (
            <section className="panel mb-4 px-4 py-4">
              <Bars
                points={series}
                color={kind === 'income' ? '#34d399' : '#fb7185'}
                currency={currency}
                granularity={granularity}
              />
            </section>
          ) : null}

          <section className="mb-4">
            <h2 className="mb-2 px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">
              Разбивка
            </h2>
            <div className="flex flex-col gap-1">
              {slices.map((slice) => {
                const category = slice.categoryId ? categoryById.get(slice.categoryId) : undefined
                return (
                  <button
                    key={slice.categoryId ?? 'none'}
                    type="button"
                    disabled={!category}
                    onClick={() => category && setEditing(category)}
                    className="press flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left active:bg-white/5 disabled:active:bg-transparent"
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-[18px]"
                      style={{ backgroundColor: `${slice.color}26` }}
                    >
                      {slice.emoji}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[15px] font-medium">{slice.name}</span>
                        <span className="tnum shrink-0 text-[15px] font-semibold">
                          {formatAmount(slice.amount, currency)}
                        </span>
                      </span>

                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${Math.max(slice.share * 100, 2)}%`,
                              backgroundColor: slice.color,
                              transition: 'width 360ms cubic-bezier(0.22,1,0.36,1)',
                            }}
                          />
                        </span>
                        <span className="tnum w-9 shrink-0 text-right text-[12px] text-muted">
                          {Math.round(slice.share * 100)}%
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </>
      )}

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">
          Все категории
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((category) => category.kind === kind)
            .map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setEditing(category)}
                className="press flex items-center gap-2 rounded-full bg-raised py-2 pr-3.5 pl-2.5 text-[14px]"
              >
                <span>{category.emoji}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="press flex items-center gap-1.5 rounded-full border border-dashed border-white/15 py-2 pr-3.5 pl-3 text-[14px] font-medium text-muted"
          >
            <span className="text-[16px] leading-none font-light">+</span>
            Новая
          </button>
        </div>
      </section>

      <CategorySheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        category={editing}
        kind={editing?.kind ?? kind}
      />

      <CategorySheet
        open={creating}
        onClose={() => setCreating(false)}
        category={null}
        kind={kind}
      />
    </>
  )
}

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[236px]" />
      <Skeleton className="h-[140px]" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-14" />
        ))}
      </div>
    </div>
  )
}
