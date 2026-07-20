import { eq } from 'drizzle-orm'

import { DEFAULT_CATEGORIES } from './constants'
import { db } from './db'
import { categories, users, type UserRow } from './db/schema'
import { verifyInitData, type TelegramUser } from './telegram'

/**
 * Мини-апп живёт в iframe на web.telegram.org, поэтому сессионные куки там
 * третьесторонние и часть браузеров их режет. Вместо кук каждый запрос несёт
 * `Authorization: tma <initData>` и проверяется подписью: это дёшево и без состояния.
 */
export async function requireUser(request: Request): Promise<UserRow | null> {
  const telegramUser = resolveTelegramUser(request)
  if (!telegramUser) return null
  return provisionUser(telegramUser)
}

function resolveTelegramUser(request: Request): TelegramUser | null {
  const header = request.headers.get('authorization') ?? ''
  const [scheme, ...rest] = header.split(' ')
  const initData = rest.join(' ')

  if (scheme === 'tma' && initData) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set, every request will be rejected')
      return null
    }
    return verifyInitData(initData, botToken)
  }

  return devUser()
}

/** Лазейка для локальной разработки вне Telegram. В production всегда закрыта. */
function devUser(): TelegramUser | null {
  if (process.env.NODE_ENV === 'production') return null
  const devId = Number(process.env.KLIO_DEV_TELEGRAM_ID)
  if (!Number.isFinite(devId) || devId <= 0) return null
  return { id: devId, first_name: 'Dev', username: 'dev' }
}

async function provisionUser(telegramUser: TelegramUser): Promise<UserRow> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramUser.id))
    .limit(1)

  if (existing[0]) return existing[0]

  const [created] = await db
    .insert(users)
    .values({
      telegramId: telegramUser.id,
      firstName: telegramUser.first_name ?? null,
      lastName: telegramUser.last_name ?? null,
      username: telegramUser.username ?? null,
      photoUrl: telegramUser.photo_url ?? null,
      languageCode: telegramUser.language_code ?? null,
    })
    .onConflictDoNothing({ target: users.telegramId })
    .returning()

  if (created) {
    await db
      .insert(categories)
      .values(DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: created.id })))
      .onConflictDoNothing()
    return created
  }

  // Клиент шлёт несколько запросов параллельно, и на первом запуске они гонятся
  // за создание одной и той же строки. Проигравший просто перечитывает победителя.
  const [raced] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramUser.id))
    .limit(1)

  if (!raced) throw new Error('failed to provision user')
  return raced
}
