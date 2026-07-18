'use client'

import { useId } from 'react'

import { currencyMeta } from '@/lib/format'

/** Оставляем цифры, один разделитель дробной части и — по разрешению — минус. */
export function sanitizeMoney(input: string, allowNegative: boolean): string {
  const negative = allowNegative && input.trimStart().startsWith('-')
  const digitsAndSeparator = input.replace(/[^\d.,]/g, '').replace(/[.,]/g, ',')

  const [whole, ...rest] = digitsAndSeparator.split(',')
  const fraction = rest.join('').slice(0, 2)
  const body = rest.length > 0 ? `${whole},${fraction}` : whole

  return negative ? `-${body}` : body
}

/** Разбивает целую часть по три разряда — «1 250 000». */
export function groupMoney(input: string): string {
  if (!input) return ''
  const negative = input.startsWith('-')
  const [whole, fraction] = input.replace('-', '').split(',')
  if (!whole) return input
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${negative ? '-' : ''}${grouped}${fraction !== undefined ? `,${fraction}` : ''}`
}

type MoneyInputProps = {
  value: string
  onChange: (value: string) => void
  currency: string
  allowNegative?: boolean
  autoFocus?: boolean
  large?: boolean
}

/**
 * Форматирование выполняется на blur, а не на каждый символ: перестройка строки
 * во время набора сбивает каретку на мобильных клавиатурах.
 */
export function MoneyInput({
  value,
  onChange,
  currency,
  allowNegative = false,
  autoFocus = false,
  large = false,
}: MoneyInputProps) {
  const id = useId()
  const { symbol } = currencyMeta(currency)

  return (
    <div
      className={`flex items-baseline justify-center gap-2 rounded-2xl border border-white/8 bg-raised ${
        large ? 'px-4 py-5' : 'h-13 px-4'
      }`}
    >
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(sanitizeMoney(event.target.value, allowNegative))}
        onBlur={() => onChange(groupMoney(value))}
        onFocus={() => onChange(value.replace(/\s/g, ''))}
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        aria-label="Сумма"
        className={`tnum min-w-0 flex-1 bg-transparent text-right font-semibold ${
          large ? 'text-[34px]' : 'text-[17px]'
        }`}
        style={large ? { fontSize: 34 } : undefined}
      />
      <span className={`shrink-0 text-muted ${large ? 'text-[20px]' : 'text-[15px]'}`}>
        {symbol}
      </span>
    </div>
  )
}
