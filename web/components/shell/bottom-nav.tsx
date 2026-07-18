'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { hapticSelection } from '@/lib/client/telegram'

const TABS = [
  { href: '/', label: 'Главная', icon: WalletIcon },
  { href: '/stats', label: 'Категории', icon: ChartIcon },
  { href: '/history', label: 'История', icon: ClockIcon },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-ink/85 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          const Icon = tab.icon
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                prefetch
                onClick={() => {
                  if (!active) hapticSelection()
                }}
                className="press flex h-[62px] flex-col items-center justify-center gap-1"
              >
                <Icon active={active} />
                <span
                  className={`text-[11px] font-medium transition-colors ${
                    active ? 'text-accent' : 'text-faint'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

type IconProps = { active: boolean }

function iconClass(active: boolean) {
  return `size-6 transition-colors ${active ? 'text-accent' : 'text-faint'}`
}

function WalletIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(active)} aria-hidden>
      <path
        d="M3 8.5A2.5 2.5 0 0 1 5.5 6H17a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="8.5"
        width="18"
        height="10.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <circle cx="16.5" cy="13.75" r="1.35" fill="currentColor" />
    </svg>
  )
}

function ChartIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(active)} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <path
        d="M12 4a8 8 0 0 1 8 8h-8V4Z"
        fill="currentColor"
        fillOpacity={active ? 0.9 : 0.45}
      />
    </svg>
  )
}

function ClockIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(active)} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8.2"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <path
        d="M12 7.6V12l2.9 1.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
