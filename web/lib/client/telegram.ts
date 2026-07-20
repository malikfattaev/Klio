export type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'

type TelegramWebApp = {
  initData: string
  version: string
  colorScheme: 'light' | 'dark'
  isExpanded: boolean
  ready: () => void
  expand: () => void
  close: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  disableVerticalSwipes?: () => void
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  BackButton?: {
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp ?? null
}

/** Пустая строка вне Telegram, тогда сервер отвечает по dev-лазейке. */
export function getInitData(): string {
  return getWebApp()?.initData ?? ''
}

/**
 * Готовит окно мини-аппа: разворачивает на весь экран, красит системные полосы
 * под фон приложения и глушит вертикальный свайп, который иначе закрывает окно
 * прямо во время скролла списка.
 */
export function initWebApp(backgroundColor: string): void {
  const app = getWebApp()
  if (!app) return

  app.ready()
  if (!app.isExpanded) app.expand()
  app.setHeaderColor?.(backgroundColor)
  app.setBackgroundColor?.(backgroundColor)
  app.disableVerticalSwipes?.()
}

export function haptic(style: HapticStyle = 'light'): void {
  getWebApp()?.HapticFeedback?.impactOccurred(style)
}

export function hapticSelection(): void {
  getWebApp()?.HapticFeedback?.selectionChanged()
}

export function hapticNotify(type: 'error' | 'success' | 'warning'): void {
  getWebApp()?.HapticFeedback?.notificationOccurred(type)
}
