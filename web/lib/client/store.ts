'use client'

import { useCallback } from 'react'
import useSWR, { useSWRConfig, type SWRConfiguration } from 'swr'
import useSWRInfinite from 'swr/infinite'

import type {
  Bootstrap,
  Card,
  Category,
  Me,
  Stats,
  Transaction,
  TransactionPage,
  TxKind,
} from '@/lib/types'
import { apiFetch, del, patchJson, postJson } from './api'
import { periodRange, timeZone, type Period } from './period'

const BOOTSTRAP_KEY = '/api/bootstrap'
const PAGE_SIZE = 40

const shared: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: true,
  keepPreviousData: true,
  dedupingInterval: 2000,
}

export function useBootstrap() {
  return useSWR<Bootstrap>(BOOTSTRAP_KEY, apiFetch, shared)
}

export type TransactionFilters = {
  cardId?: number | null
  categoryId?: number | 'none' | null
  kind?: TxKind | null
}

function filtersToQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (filters.cardId) params.set('cardId', String(filters.cardId))
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
  if (filters.kind) params.set('kind', filters.kind)
  return params.toString()
}

/** Постраничная лента истории: следующая страница берётся по курсору предыдущей. */
export function useTransactions(filters: TransactionFilters = {}) {
  const query = filtersToQuery(filters)

  const getKey = (index: number, previous: TransactionPage | null) => {
    if (previous && !previous.nextCursor) return null
    if (index === 0) return `/api/transactions?${query}`
    return `/api/transactions?${query}&cursor=${encodeURIComponent(previous!.nextCursor!)}`
  }

  // Первую страницу перезапрашиваем: новая операция попадает именно в её начало,
  // и без этого добавленная запись не появлялась бы в списке.
  const swr = useSWRInfinite<TransactionPage>(getKey, apiFetch, shared)

  const items = swr.data ? swr.data.flatMap((page) => page.items) : []
  const last = swr.data?.[swr.data.length - 1]
  const hasMore = Boolean(last?.nextCursor)
  const isLoadingMore = swr.isValidating && swr.size > (swr.data?.length ?? 0)

  return { ...swr, items, hasMore, isLoadingMore }
}

export function useStats(period: Period, cardId?: number | null) {
  const { from, to } = periodRange(period)
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    tz: timeZone(),
  })
  if (cardId) params.set('cardId', String(cardId))

  return useSWR<Stats>(`/api/stats?${params.toString()}`, apiFetch, shared)
}

type TransactionInput = {
  cardId: number
  categoryId: number | null
  kind: TxKind
  amount: number
  /** Поле описания убрано из UI; сервер трактует его отсутствие как null. */
  note?: string | null
  occurredAt: string
}

export function useActions() {
  const { mutate } = useSWRConfig()

  /** Обновляем карты из ответа сервера — балансы уже пересчитаны в БД. */
  const applyCards = useCallback(
    (cards: Card[]) => {
      mutate<Bootstrap>(BOOTSTRAP_KEY, (prev) => (prev ? { ...prev, cards } : prev), {
        revalidate: false,
      })
    },
    [mutate],
  )

  const applyCategories = useCallback(
    (categories: Category[]) => {
      mutate<Bootstrap>(BOOTSTRAP_KEY, (prev) => (prev ? { ...prev, categories } : prev), {
        revalidate: false,
      })
    },
    [mutate],
  )

  /**
   * Обновляет всё, что зависит от операций: короткую ленту главной и статистику.
   *
   * Постраничный список истории сюда НЕ попадает: SWR намеренно исключает ключи
   * useSWRInfinite («$inf$…») из мутации по фильтру, поэтому его нельзя достать
   * отсюда. Страница истории обновляет себя сама через onSaved у TxSheet.
   */
  const refreshDerived = useCallback(() => {
    mutate(
      (key) =>
        typeof key === 'string' &&
        (key.includes('/api/transactions') || key.includes('/api/stats')),
    )
  }, [mutate])

  const createTransaction = useCallback(
    async (input: TransactionInput) => {
      const result = await postJson<{ transaction: Transaction; cards: Card[] }>(
        '/api/transactions',
        input,
      )
      applyCards(result.cards)
      refreshDerived()
      return result.transaction
    },
    [applyCards, refreshDerived],
  )

  const updateTransaction = useCallback(
    async (id: number, input: Partial<TransactionInput>) => {
      const result = await patchJson<{ transaction: Transaction; cards: Card[] }>(
        `/api/transactions/${id}`,
        input,
      )
      applyCards(result.cards)
      refreshDerived()
      return result.transaction
    },
    [applyCards, refreshDerived],
  )

  const deleteTransaction = useCallback(
    async (id: number) => {
      const result = await del<{ id: number; cards: Card[] }>(`/api/transactions/${id}`)
      applyCards(result.cards)
      refreshDerived()
    },
    [applyCards, refreshDerived],
  )

  const createCard = useCallback(
    async (input: { name: string; theme: string; initialBalance: number }) => {
      const result = await postJson<{ cards: Card[] }>('/api/cards', input)
      applyCards(result.cards)
    },
    [applyCards],
  )

  const updateCard = useCallback(
    async (id: number, input: { name?: string; theme?: string; initialBalance?: number }) => {
      const result = await patchJson<{ cards: Card[] }>(`/api/cards/${id}`, input)
      applyCards(result.cards)
    },
    [applyCards],
  )

  const deleteCard = useCallback(
    async (id: number) => {
      const result = await del<{ cards: Card[] }>(`/api/cards/${id}`)
      applyCards(result.cards)
      refreshDerived()
    },
    [applyCards, refreshDerived],
  )

  const createCategory = useCallback(
    async (input: { name: string; kind: TxKind; emoji: string; color: string }) => {
      const result = await postJson<{ categories: Category[] }>('/api/categories', input)
      applyCategories(result.categories)
    },
    [applyCategories],
  )

  const updateCategory = useCallback(
    async (id: number, input: { name?: string; emoji?: string; color?: string }) => {
      const result = await patchJson<{ categories: Category[] }>(`/api/categories/${id}`, input)
      applyCategories(result.categories)
      refreshDerived()
    },
    [applyCategories, refreshDerived],
  )

  const deleteCategory = useCallback(
    async (id: number) => {
      const result = await del<{ categories: Category[] }>(`/api/categories/${id}`)
      applyCategories(result.categories)
      refreshDerived()
    },
    [applyCategories, refreshDerived],
  )

  const setCurrency = useCallback(
    async (currency: string) => {
      const result = await patchJson<{ me: Me }>('/api/me', { currency })
      mutate<Bootstrap>(BOOTSTRAP_KEY, (prev) => (prev ? { ...prev, me: result.me } : prev), {
        revalidate: false,
      })
      refreshDerived()
    },
    [mutate, refreshDerived],
  )

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCard,
    updateCard,
    deleteCard,
    createCategory,
    updateCategory,
    deleteCategory,
    setCurrency,
  }
}
