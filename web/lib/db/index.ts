import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

type Sql = ReturnType<typeof postgres>
type Db = ReturnType<typeof drizzle<typeof schema>>

/** Пул переживает hot reload: иначе каждая пересборка открывает новые соединения. */
const globalForDb = globalThis as unknown as { klioSql?: Sql; klioDb?: Db }

function connect(): Db {
  if (globalForDb.klioDb) return globalForDb.klioDb

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const sql =
    globalForDb.klioSql ??
    postgres(connectionString, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    })

  const instance = drizzle(sql, { schema })

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.klioSql = sql
    globalForDb.klioDb = instance
  } else {
    globalForDb.klioDb = instance
  }

  return instance
}

/**
 * Подключение создаётся при первом обращении, а не при импорте модуля. На сборке
 * Next загружает все route-файлы, а DATABASE_URL там ещё нет — жадная инициализация
 * роняла бы билд. Прокси сохраняет привычный вызов `db.select()` на месте.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, property, receiver) {
    return Reflect.get(connect(), property, receiver)
  },
})

export { schema }
