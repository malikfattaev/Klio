/**
 * Node-специфичный код держим за динамическим импортом внутри проверки рантайма:
 * instrumentation собирается и под Edge, где `postgres` и его зависимости
 * недоступны, и статический импорт ронял бы сборку.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.KLIO_AUTO_MIGRATE === '0') return

  const { migrateOnBoot } = await import('./lib/db/migrate-on-boot')

  try {
    await migrateOnBoot()
  } catch (error) {
    console.error('[klio] migration failed', error)
    // Падаем осознанно: работать на старой схеме хуже, чем не подняться вовсе.
    throw error
  }
}
