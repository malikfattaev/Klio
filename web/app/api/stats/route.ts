import { and, sql } from 'drizzle-orm'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories, transactions } from '@/lib/db/schema'
import { guard, json, unauthorized } from '@/lib/http'
import { num, transactionFilters } from '@/lib/queries'
import type { Stats, StatsPoint, StatsSlice, TxKind } from '@/lib/types'
import { parseDate } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Дальше этого порога дневные столбики нечитаемы, поэтому переключаемся на месяцы. */
const DAILY_GRANULARITY_LIMIT_DAYS = 62

let zoneCache: Set<string> | null = null

/**
 * Имя таймзоны уходит в `AT TIME ZONE`, поэтому его мало экранировать:
 * неизвестная зона роняет запрос. Сверяем со списком, известным среде выполнения.
 */
function safeTimeZone(value: string | null): string {
  if (!value) return 'UTC'
  if (!zoneCache) {
    try {
      zoneCache = new Set(Intl.supportedValuesOf('timeZone'))
    } catch {
      zoneCache = new Set()
    }
  }
  return zoneCache.has(value) ? value : 'UTC'
}

export async function GET(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)

    const to = parseDate(searchParams.get('to')) ?? new Date()
    const from =
      parseDate(searchParams.get('from')) ?? new Date(to.getTime() - 29 * 86_400_000)
    const timeZone = safeTimeZone(searchParams.get('tz'))

    // Период уже разобран выше, поэтому переиспользуем общие фильтры только для карты.
    const scoped = new URLSearchParams(searchParams)
    scoped.delete('from')
    scoped.delete('to')
    scoped.delete('kind')

    const conditions = [
      ...transactionFilters(user.id, scoped),
      sql`${transactions.occurredAt} >= ${from.toISOString()}::timestamptz`,
      sql`${transactions.occurredAt} <= ${to.toISOString()}::timestamptz`,
    ]

    const rangeDays = (to.getTime() - from.getTime()) / 86_400_000
    const bucket = rangeDays <= DAILY_GRANULARITY_LIMIT_DAYS ? 'day' : 'month'

    const [byCategory, series] = await Promise.all([
      db
        .select({
          kind: transactions.kind,
          categoryId: transactions.categoryId,
          name: categories.name,
          emoji: categories.emoji,
          color: categories.color,
          amount: sql`sum(${transactions.amount})`,
        })
        .from(transactions)
        .leftJoin(categories, sql`${categories.id} = ${transactions.categoryId}`)
        .where(and(...conditions))
        .groupBy(
          transactions.kind,
          transactions.categoryId,
          categories.name,
          categories.emoji,
          categories.color,
        ),

      db
        .select({
          bucket: sql<string>`to_char(date_trunc(${sql.raw(`'${bucket}'`)}, ${transactions.occurredAt} at time zone ${timeZone}), 'YYYY-MM-DD')`,
          expense: sql`sum(case when ${transactions.kind} = 'expense' then ${transactions.amount} else 0 end)`,
          income: sql`sum(case when ${transactions.kind} = 'income' then ${transactions.amount} else 0 end)`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
    ])

    const slices: Record<TxKind, StatsSlice[]> = { expense: [], income: [] }
    const totals: Record<TxKind, number> = { expense: 0, income: 0 }

    for (const row of byCategory) {
      const amount = num(row.amount)
      if (amount <= 0) continue
      totals[row.kind] += amount
      slices[row.kind].push({
        categoryId: row.categoryId,
        name: row.name ?? 'Без категории',
        emoji: row.emoji ?? '🗂️',
        color: row.color ?? '#64748b',
        amount,
        share: 0,
      })
    }

    for (const kind of ['expense', 'income'] as TxKind[]) {
      const total = totals[kind]
      slices[kind].sort((a, b) => b.amount - a.amount)
      for (const slice of slices[kind]) {
        slice.share = total > 0 ? slice.amount / total : 0
      }
    }

    const daily: StatsPoint[] = series.map((row) => ({
      date: row.bucket,
      expense: num(row.expense),
      income: num(row.income),
    }))

    const payload: Stats = {
      currency: user.currency,
      from: from.toISOString(),
      to: to.toISOString(),
      expenseTotal: totals.expense,
      incomeTotal: totals.income,
      expense: slices.expense,
      income: slices.income,
      daily,
    }

    return json(payload)
  })
}
