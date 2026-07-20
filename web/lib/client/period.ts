export type Period = 'week' | 'month' | 'year' | 'all'

export const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
  { value: 'all', label: 'Всё' },
]

/**
 * Верхняя граница: конец суток, а не текущий момент. Иначе значение менялось бы
 * на каждый рендер, ключ SWR не совпадал бы сам с собой и статистика
 * перезапрашивалась бы бесконечно.
 */
function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/**
 * Границы считаются от календарных единиц («этот месяц»), а не «последние 30 дней»,
 * так цифры сходятся с тем, как человек сам думает о своих тратах.
 */
export function periodRange(period: Period, now = new Date()): { from: Date; to: Date } {
  const to = endOfDay(now)
  switch (period) {
    case 'week': {
      const day = now.getDay()
      // В JS неделя начинается с воскресенья, у нас с понедельника.
      const shift = day === 0 ? 6 : day - 1
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - shift)
      return { from, to }
    }
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to }
    case 'all':
      return { from: new Date(2000, 0, 1), to }
  }
}

export function periodLabel(period: Period, now = new Date()): string {
  switch (period) {
    case 'week':
      return 'На этой неделе'
    case 'month':
      return new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(now)
    case 'year':
      return String(now.getFullYear())
    case 'all':
      return 'За всё время'
  }
}

export function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
