import { and, asc, desc, eq, gte, isNull, lte, sql, type SQL } from 'drizzle-orm'

import { db } from './db'
import { cards, categories, transactions, type TransactionRow } from './db/schema'
import type { Card, Category, Transaction, TransactionPage } from './types'
import { parseDate, parseId, parseKind } from './validate'

/**
 * Агрегаты приходят из raw-SQL, минуя маппинг колонок drizzle, поэтому драйвер
 * может отдать их строкой (int8), поэтому приводим в одном месте.
 */
export function num(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

/** Карты с балансами, посчитанными в БД: клиенту не нужно ничего суммировать. */
export async function listCards(userId: number): Promise<Card[]> {
  const rows = await db
    .select({
      id: cards.id,
      name: cards.name,
      theme: cards.theme,
      initialBalance: cards.initialBalance,
      income: sql`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amount} else 0 end), 0)`,
      expense: sql`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amount} else 0 end), 0)`,
      txCount: sql`count(${transactions.id})`,
    })
    .from(cards)
    .leftJoin(transactions, eq(transactions.cardId, cards.id))
    .where(eq(cards.userId, userId))
    .groupBy(cards.id)
    .orderBy(asc(cards.createdAt), asc(cards.id))

  return rows.map((row) => {
    const income = num(row.income)
    const expense = num(row.expense)
    return {
      id: row.id,
      name: row.name,
      theme: row.theme,
      initialBalance: row.initialBalance,
      balance: row.initialBalance + income - expense,
      income,
      expense,
      txCount: num(row.txCount),
    }
  })
}

export async function listCategories(userId: number): Promise<Category[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      emoji: categories.emoji,
      color: categories.color,
      kind: categories.kind,
    })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.kind), asc(categories.name))

  return rows
}

export function toTransactionDto(row: TransactionRow): Transaction {
  return {
    id: row.id,
    cardId: row.cardId,
    categoryId: row.categoryId,
    kind: row.kind,
    amount: row.amount,
    note: row.note,
    occurredAt: row.occurredAt.toISOString(),
  }
}

/**
 * Фильтры истории из query-параметров. Пустой или мусорный параметр просто
 * игнорируется: на списке операций это безопаснее, чем ронять запрос ошибкой.
 */
export function transactionFilters(userId: number, params: URLSearchParams): SQL[] {
  const conditions: SQL[] = [eq(transactions.userId, userId)]

  const cardId = parseId(params.get('cardId'))
  if (cardId) conditions.push(eq(transactions.cardId, cardId))

  const rawCategory = params.get('categoryId')
  if (rawCategory === 'none') {
    conditions.push(isNull(transactions.categoryId))
  } else {
    const categoryId = parseId(rawCategory)
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId))
  }

  const kind = parseKind(params.get('kind'))
  if (kind) conditions.push(eq(transactions.kind, kind))

  const from = parseDate(params.get('from'))
  if (from) conditions.push(gte(transactions.occurredAt, from))

  const to = parseDate(params.get('to'))
  if (to) conditions.push(lte(transactions.occurredAt, to))

  return conditions
}

const encodeCursor = (row: TransactionRow) => `${row.occurredAt.toISOString()}_${row.id}`

function cursorCondition(cursor: string | null): SQL | null {
  if (!cursor) return null
  const separator = cursor.lastIndexOf('_')
  if (separator < 0) return null

  const occurredAt = parseDate(cursor.slice(0, separator))
  const id = parseId(cursor.slice(separator + 1))
  if (!occurredAt || !id) return null

  // Кортежное сравнение даёт стабильную страницу даже когда у операций
  // совпадает время, а обычная сортировка по одной дате их бы перемешала.
  return sql`(${transactions.occurredAt}, ${transactions.id}) < (${occurredAt.toISOString()}::timestamptz, ${id}::bigint)`
}

export async function listTransactions(
  userId: number,
  params: URLSearchParams,
): Promise<TransactionPage> {
  const requested = Number(params.get('limit') ?? 40)
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 100) : 40

  const conditions = transactionFilters(userId, params)
  const cursor = cursorCondition(params.get('cursor'))
  if (cursor) conditions.push(cursor)

  // Берём на одну строку больше запрошенного: лишняя строка означает, что
  // следующая страница существует, и избавляет от отдельного count-запроса.
  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  return {
    items: page.map(toTransactionDto),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  }
}
