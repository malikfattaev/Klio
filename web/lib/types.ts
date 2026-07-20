export type TxKind = 'expense' | 'income'

export type Me = {
  id: number
  firstName: string | null
  username: string | null
  photoUrl: string | null
}

export type Card = {
  id: number
  name: string
  theme: string
  currency: string
  initialBalance: number
  /** initialBalance + доходы − расходы, посчитано на сервере. */
  balance: number
  income: number
  expense: number
  txCount: number
}

export type Category = {
  id: number
  name: string
  emoji: string
  color: string
  kind: TxKind
}

export type Transaction = {
  id: number
  cardId: number
  categoryId: number | null
  kind: TxKind
  amount: number
  note: string | null
  occurredAt: string
}

export type Bootstrap = {
  me: Me
  cards: Card[]
  categories: Category[]
}

export type TransactionPage = {
  items: Transaction[]
  nextCursor: string | null
}

export type StatsSlice = {
  categoryId: number | null
  name: string
  emoji: string
  color: string
  amount: number
  /** Доля в общей сумме, 0..1. */
  share: number
}

export type StatsPoint = {
  date: string
  expense: number
  income: number
}

export type Stats = {
  currency: string
  from: string
  to: string
  expenseTotal: number
  incomeTotal: number
  expense: StatsSlice[]
  income: StatsSlice[]
  daily: StatsPoint[]
}
