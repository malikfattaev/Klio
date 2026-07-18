'use client'

import { useMemo } from 'react'

import type { StatsSlice } from '@/lib/types'

const SIZE = 180
const STROKE = 18
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Зазор между секторами, чтобы соседние цвета не сливались. */
const GAP = 2

export function Donut({
  slices,
  centerLabel,
  centerValue,
  emptyColor = '#1c2333',
}: {
  slices: StatsSlice[]
  centerLabel: string
  centerValue: string
  emptyColor?: string
}) {
  const segments = useMemo(() => {
    const result: { key: string; color: string; length: number; offset: number }[] = []
    let offset = 0

    for (const slice of slices) {
      if (slice.share <= 0) continue
      const raw = slice.share * CIRCUMFERENCE
      result.push({
        key: `${slice.categoryId ?? 'none'}`,
        color: slice.color,
        // Совсем узкий сектор после вычета зазора мог бы стать отрицательным.
        length: Math.max(raw - GAP, 1),
        offset,
      })
      offset += raw
    }

    return result
  }, [slices])

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={emptyColor}
            strokeWidth={STROKE}
          />
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
              style={{ transition: 'stroke-dasharray 420ms cubic-bezier(0.22,1,0.36,1)' }}
            />
          ))}
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {centerLabel}
        </span>
        <span className="tnum mt-1 text-[19px] leading-tight font-bold break-all">
          {centerValue}
        </span>
      </div>
    </div>
  )
}
