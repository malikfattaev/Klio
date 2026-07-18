'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { haptic } from '@/lib/client/telegram'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white active:bg-accent-soft disabled:bg-accent/40',
  secondary: 'bg-raised text-text active:bg-white/12',
  ghost: 'bg-transparent text-muted active:bg-white/8',
  danger: 'bg-expense/12 text-expense active:bg-expense/20',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      onClick={(event) => {
        haptic('light')
        onClick?.(event)
      }}
      className={`press flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  )
}
