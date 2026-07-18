import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/**
 * Применяет непроставленные миграции на старте сервера. Схема и код выкатываются
 * одной операцией, поэтому откат образа откатывает приложение целиком.
 * Рассчитано на один инстанс: несколько реплик будут спорить за таблицу миграций.
 */
export async function migrateOnBoot(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn('[klio] DATABASE_URL is not set — skipping migrations')
    return
  }

  // Отдельное одиночное соединение: миграции не должны делить пул с приложением.
  const sql = postgres(connectionString, { max: 1, onnotice: () => {} })
  try {
    await migrate(drizzle(sql), { migrationsFolder: `${process.cwd()}/lib/db/migrations` })
    console.log('[klio] migrations up to date')
  } finally {
    await sql.end()
  }
}
