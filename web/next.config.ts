import path from 'node:path'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Railway запускает готовый образ, а не `next start` поверх node_modules.
  output: 'standalone',

  // В pnpm-воркспейсе зависимости лежат в корне репозитория, а не в web/,
  // поэтому без этого корня трассировка не находит их и standalone выходит неполным.
  outputFileTracingRoot: path.join(process.cwd(), '..'),

  // SQL-файлы миграций не импортируются кодом, поэтому трассировка их не видит.
  outputFileTracingIncludes: {
    '/**': ['./lib/db/migrations/**'],
  },
}

export default nextConfig
