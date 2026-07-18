import { CARD_THEMES, CURRENCIES, type CardThemeKey, type CurrencyCode } from './constants'
import type { TxKind } from './types'

/** Верхняя граница суммы: 10 млрд в основной единице. Защищает от опечаток и переполнения. */
const MAX_MINOR = 1_000_000_000_000

export function parseText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed || trimmed.length > max) return null
  return trimmed
}

export function parseOptionalText(value: unknown, max: number): string | null | undefined {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length > max) return undefined
  return trimmed || null
}

export function parseId(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export function parseOptionalId(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') return null
  return parseId(value) ?? undefined
}

/** Сумма в минорных единицах: целая, положительная, в разумных границах. */
export function parseAmount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (value <= 0 || value > MAX_MINOR) return null
  return value
}

/** Стартовый баланс может быть нулевым и отрицательным (карта в минусе). */
export function parseBalance(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (Math.abs(value) > MAX_MINOR) return null
  return value
}

export function parseKind(value: unknown): TxKind | null {
  return value === 'expense' || value === 'income' ? value : null
}

export function parseTheme(value: unknown): CardThemeKey | null {
  return typeof value === 'string' && value in CARD_THEMES ? (value as CardThemeKey) : null
}

export function parseCurrency(value: unknown): CurrencyCode | null {
  return typeof value === 'string' && value in CURRENCIES ? (value as CurrencyCode) : null
}

export function parseColor(value: unknown): string | null {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null
}

export function parseEmoji(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  // Эмодзи занимают до нескольких кодовых точек (модификаторы, ZWJ-последовательности).
  return trimmed && [...trimmed].length <= 6 ? trimmed : null
}

export function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json()
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
