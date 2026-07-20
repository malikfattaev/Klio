import type { StatsPoint } from '@/lib/types'

/** Больше столбиков экран телефона всё равно не разрешит различить. */
const MAX_BUCKETS = 120

/** 'YYYY-MM-DD' → локальная дата. new Date(строка) трактовал бы её как UTC и сдвигал день. */
function parseBucket(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function bucketKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Сервер отдаёт только непустые интервалы, без заполнения дыр график врал бы,
 * рисуя дни без трат вплотную друг к другу.
 */
export function fillSeries(
  points: StatsPoint[],
  to: Date,
  granularity: 'day' | 'month',
): StatsPoint[] {
  if (points.length === 0) return []

  const byDate = new Map(points.map((point) => [point.date, point]))
  const cursor = parseBucket(points[0].date)
  const end = granularity === 'month' ? new Date(to.getFullYear(), to.getMonth(), 1) : to

  const filled: StatsPoint[] = []
  while (cursor <= end && filled.length < MAX_BUCKETS) {
    const key = bucketKey(cursor)
    filled.push(byDate.get(key) ?? { date: key, expense: 0, income: 0 })

    if (granularity === 'month') {
      cursor.setMonth(cursor.getMonth() + 1)
    } else {
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  return filled
}
