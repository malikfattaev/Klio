import { createHmac, timingSafeEqual } from 'node:crypto'

export type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

/** Максимальный возраст initData. Telegram переиздаёт его при каждом открытии. */
const MAX_AGE_SECONDS = 60 * 60 * 24

function hmac(key: string | Buffer, message: string): Buffer {
  return createHmac('sha256', key).update(message).digest()
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

/**
 * Проверяет подпись initData ботовым токеном по схеме из документации Telegram:
 * secret = HMAC_SHA256("WebAppData", bot_token), затем HMAC_SHA256(secret, data_check_string).
 *
 * Возвращает пользователя либо null: вызывающий код обязан трактовать null как 401.
 */
export function verifyInitData(initData: string, botToken: string): TelegramUser | null {
  if (!initData || !botToken) return null

  let params: URLSearchParams
  try {
    params = new URLSearchParams(initData)
  } catch {
    return null
  }

  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = hmac('WebAppData', botToken)
  const computed = hmac(secretKey, dataCheckString).toString('hex')
  if (!safeEqualHex(computed, hash)) return null

  const authDate = Number(params.get('auth_date'))
  if (!Number.isFinite(authDate)) return null
  if (Math.floor(Date.now() / 1000) - authDate > MAX_AGE_SECONDS) return null

  const rawUser = params.get('user')
  if (!rawUser) return null

  try {
    const user = JSON.parse(rawUser) as TelegramUser
    return typeof user?.id === 'number' ? user : null
  } catch {
    return null
  }
}
