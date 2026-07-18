import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

import { Providers } from '@/components/providers'
import { BottomNav } from '@/components/shell/bottom-nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Klio — учёт расходов',
  description: 'Карты, расходы, доходы и статистика по категориям',
  applicationName: 'Klio',
}

export const viewport: Viewport = {
  themeColor: '#0b0d13',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Контент уходит под «чёлку», отступы держим сами через safe-area.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // SDK Telegram дописывает свои CSS-переменные в style у <html> до гидрации.
    // React 19 всё равно сообщает о лишнем атрибуте на корне (флаг сюда не достаёт),
    // но не трогает его: дерево гидрируется нормально, переменные Telegram выживают.
    <html lang="ru" className="antialiased" suppressHydrationWarning>
      <head>
        {/* SDK обязан быть готов до гидрации: initData нужен уже первому запросу. */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>
        <Providers>
          <main
            className="mx-auto w-full max-w-lg px-4"
            style={{
              paddingTop: 'calc(var(--safe-top) + 12px)',
              paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)',
            }}
          >
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
