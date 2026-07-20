'use client'

import { useMemo } from 'react'

import { formatCompact } from '@/lib/format'

type Point = { date: string; value: number }

const dayLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' })
const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'short' })

/**
 * Динамика по периоду. Столбики: div'ы с height в процентах. Для полусотни
 * точек это дешевле, чем SVG, и не требует пересчёта при ресайзе.
 */
export function Bars({
  points,
  color,
  currency,
  granularity,
}: {
  points: Point[]
  color: string
  currency: string
  granularity: 'day' | 'month'
}) {
  const max = useMemo(() => Math.max(...points.map((point) => point.value), 1), [points])
  const peak = useMemo(
    () => points.reduce((best, point) => (point.value > best.value ? point : best), points[0]),
    [points],
  )

  if (points.length === 0) return null

  const formatter = granularity === 'day' ? dayLabel : monthLabel
  // Подписываем не каждый столбик, иначе они наезжают друг на друга.
  const labelStep = Math.max(1, Math.ceil(points.length / 6))

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-[13px] text-muted">Динамика</span>
        {peak && peak.value > 0 ? (
          <span className="tnum text-[13px] text-faint">
            пик {formatCompact(peak.value, currency)}
          </span>
        ) : null}
      </div>

      <div className="flex h-[92px] items-end gap-[3px]">
        {points.map((point) => {
          const ratio = point.value / max
          return (
            <div
              key={point.date}
              className="flex-1 rounded-t-[3px]"
              style={{
                height: `${Math.max(ratio * 100, point.value > 0 ? 4 : 2)}%`,
                backgroundColor: point.value > 0 ? color : 'rgba(255,255,255,0.06)',
                opacity: point.value > 0 ? 0.35 + ratio * 0.65 : 1,
                transition: 'height 320ms cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          )
        })}
      </div>

      <div className="mt-1.5 flex gap-[3px]">
        {points.map((point, index) => (
          <span
            key={point.date}
            className="flex-1 text-center text-[10px] text-faint"
            style={{ visibility: index % labelStep === 0 ? 'visible' : 'hidden' }}
          >
            {formatter.format(new Date(point.date))}
          </span>
        ))}
      </div>
    </div>
  )
}
