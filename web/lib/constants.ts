export type CurrencyCode = 'UZS' | 'RUB' | 'USD' | 'EUR' | 'KZT'

export const CURRENCIES: Record<CurrencyCode, { symbol: string; decimals: number; label: string }> = {
  UZS: { symbol: "сум", decimals: 0, label: 'Узбекский сум' },
  RUB: { symbol: '₽', decimals: 2, label: 'Российский рубль' },
  USD: { symbol: '$', decimals: 2, label: 'Доллар США' },
  EUR: { symbol: '€', decimals: 2, label: 'Евро' },
  KZT: { symbol: '₸', decimals: 0, label: 'Казахский тенге' },
}

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[]

export type CardThemeKey =
  | 'indigo'
  | 'violet'
  | 'ocean'
  | 'emerald'
  | 'sunset'
  | 'rose'
  | 'amber'
  | 'graphite'

export const CARD_THEMES: Record<CardThemeKey, { from: string; to: string; label: string }> = {
  indigo: { from: '#6366f1', to: '#3730a3', label: 'Индиго' },
  violet: { from: '#a855f7', to: '#6d28d9', label: 'Фиолет' },
  ocean: { from: '#38bdf8', to: '#0369a1', label: 'Океан' },
  emerald: { from: '#34d399', to: '#047857', label: 'Изумруд' },
  sunset: { from: '#fb923c', to: '#c2410c', label: 'Закат' },
  rose: { from: '#fb7185', to: '#be123c', label: 'Роза' },
  amber: { from: '#fbbf24', to: '#b45309', label: 'Янтарь' },
  graphite: { from: '#64748b', to: '#1e293b', label: 'Графит' },
}

export const CARD_THEME_KEYS = Object.keys(CARD_THEMES) as CardThemeKey[]

/** Палитра для категорий — согласована с диаграммой на странице статистики. */
export const CATEGORY_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#84cc16',
  '#94a3b8',
]

export const CATEGORY_EMOJIS = [
  '🍔', '🛒', '🚗', '🏠', '🎬', '💊', '👕', '📱',
  '✈️', '🎓', '🐾', '🎁', '💇', '⛽', '☕', '🍺',
  '🏋️', '🧾', '🛠️', '💳', '💼', '💰', '📈', '🏦',
]

export const DEFAULT_CATEGORIES: {
  name: string
  emoji: string
  color: string
  kind: 'expense' | 'income'
}[] = [
  { name: 'Продукты', emoji: '🛒', color: '#10b981', kind: 'expense' },
  { name: 'Кафе и рестораны', emoji: '🍔', color: '#f97316', kind: 'expense' },
  { name: 'Транспорт', emoji: '🚗', color: '#3b82f6', kind: 'expense' },
  { name: 'Жильё', emoji: '🏠', color: '#8b5cf6', kind: 'expense' },
  { name: 'Развлечения', emoji: '🎬', color: '#ec4899', kind: 'expense' },
  { name: 'Здоровье', emoji: '💊', color: '#14b8a6', kind: 'expense' },
  { name: 'Одежда', emoji: '👕', color: '#f43f5e', kind: 'expense' },
  { name: 'Связь', emoji: '📱', color: '#06b6d4', kind: 'expense' },
  { name: 'Прочее', emoji: '🧾', color: '#94a3b8', kind: 'expense' },
  { name: 'Зарплата', emoji: '💼', color: '#10b981', kind: 'income' },
  { name: 'Подработка', emoji: '📈', color: '#3b82f6', kind: 'income' },
  { name: 'Подарок', emoji: '🎁', color: '#ec4899', kind: 'income' },
]
