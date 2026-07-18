import { CURRENCIES, type CurrencyCode } from './constants'

const MINOR = 100

export function currencyMeta(currency: string) {
  return CURRENCIES[currency as CurrencyCode] ?? CURRENCIES.UZS
}

/** Минорные единицы (сотые) → число для отображения. */
export function toMajor(minor: number): number {
  return minor / MINOR
}

/** Пользовательский ввод («12 500,50») → минорные единицы. */
export function parseAmountToMinor(input: string): number | null {
  const normalized = input.replace(/\s| /g, '').replace(',', '.')
  if (!normalized || !/^\d*\.?\d*$/.test(normalized)) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * MINOR)
}

const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(fractionDigits: number): Intl.NumberFormat {
  const key = String(fractionDigits)
  let formatter = formatterCache.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    formatterCache.set(key, formatter)
  }
  return formatter
}

/** Число без символа валюты. Дробная часть скрывается, когда она нулевая. */
export function formatNumber(minor: number, currency: string): string {
  const { decimals } = currencyMeta(currency)
  const value = toMajor(minor)
  const hasFraction = decimals > 0 && Math.round(minor) % MINOR !== 0
  return getFormatter(hasFraction ? decimals : 0).format(value)
}

/** Полная сумма с символом валюты. */
export function formatAmount(minor: number, currency: string): string {
  return `${formatNumber(minor, currency)} ${currencyMeta(currency).symbol}`
}

/** Сумма со знаком — для строк операций. */
export function formatSigned(minor: number, currency: string, kind: 'expense' | 'income'): string {
  const sign = kind === 'income' ? '+' : '−'
  return `${sign}${formatAmount(Math.abs(minor), currency)}`
}

/** Компактная запись для крупных чисел: 1,2 млн. */
export function formatCompact(minor: number, currency: string): string {
  const value = Math.abs(toMajor(minor))
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    const digits = millions >= 100 ? 0 : 1
    return `${new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    }).format(millions)} млн ${currencyMeta(currency).symbol}`
  }
  return formatAmount(minor, currency)
}

const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const dayWithYearFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** «Сегодня» / «Вчера» / «14 марта» — заголовки групп в истории. */
export function formatDayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Вчера'
  const sameYear = date.getFullYear() === now.getFullYear()
  return (sameYear ? dayFormatter : dayWithYearFormatter).format(date)
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

export function formatDateTimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}
