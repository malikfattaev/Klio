'use client'

import type { ReactNode } from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-white/5 ${className}`} aria-hidden />
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rise-in flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 text-[44px] leading-none">{emoji}</span>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6 w-full max-w-[240px]">{action}</div> : null}
    </div>
  )
}
