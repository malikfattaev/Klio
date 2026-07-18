'use client'

import type { ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[12px] text-faint">{hint}</span> : null}
    </label>
  )
}

export function TextInput({
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`h-13 w-full rounded-2xl border border-white/8 bg-raised px-4 text-[16px] transition-colors focus:border-accent/60 ${className}`}
    />
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">
      {children}
    </h2>
  )
}
