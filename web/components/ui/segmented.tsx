'use client'

import { hapticSelection } from '@/lib/client/telegram'

type Option<T extends string> = { value: T; label: string }

/**
 * Переключатель с «плиткой», которая едет к выбранному пункту. Двигаем transform
 * одного элемента, а не перекрашиваем кнопки: так анимация идёт на композиторе.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accent = 'var(--color-accent)',
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  accent?: string
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  return (
    <div className="relative flex rounded-2xl bg-raised p-1">
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-xl transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(calc(${index} * 100%))`,
          backgroundColor: accent,
          left: 4,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            if (option.value === value) return
            hapticSelection()
            onChange(option.value)
          }}
          className={`relative z-10 flex-1 rounded-xl py-2.5 text-[14px] font-semibold transition-colors duration-200 ${
            option.value === value ? 'text-white' : 'text-muted'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
