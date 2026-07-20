import {
  bigint,
  bigserial,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Направление операции. */
export const txKind = pgEnum('tx_kind', ['expense', 'income'])

export const users = pgTable(
  'users',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    telegramId: bigint('telegram_id', { mode: 'number' }).notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    username: text('username'),
    photoUrl: text('photo_url'),
    languageCode: text('language_code'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_telegram_id_key').on(t.telegramId)],
)

export const cards = pgTable(
  'cards',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    theme: text('theme').notNull().default('indigo'),
    /** Своя валюта на карту: так можно держать сумовую и долларовую карты одновременно. */
    currency: text('currency').notNull().default('UZS'),
    /** Стартовый баланс в минорных единицах (сотых) этой же валюты. */
    initialBalance: bigint('initial_balance', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cards_user_id_idx').on(t.userId)],
)

export const categories = pgTable(
  'categories',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    emoji: text('emoji').notNull().default('💸'),
    color: text('color').notNull().default('#6366f1'),
    kind: txKind('kind').notNull().default('expense'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('categories_user_kind_name_key').on(t.userId, t.kind, t.name)],
)

export const transactions = pgTable(
  'transactions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cardId: bigint('card_id', { mode: 'number' })
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    categoryId: bigint('category_id', { mode: 'number' }).references(() => categories.id, {
      onDelete: 'set null',
    }),
    kind: txKind('kind').notNull(),
    /** Всегда положительная сумма в минорных единицах (сотых). */
    amount: bigint('amount', { mode: 'number' }).notNull(),
    note: text('note'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('transactions_user_occurred_idx').on(t.userId, t.occurredAt.desc(), t.id.desc()),
    index('transactions_card_idx').on(t.cardId),
    index('transactions_category_idx').on(t.categoryId),
  ],
)

export type UserRow = typeof users.$inferSelect
export type CardRow = typeof cards.$inferSelect
export type CategoryRow = typeof categories.$inferSelect
export type TransactionRow = typeof transactions.$inferSelect
