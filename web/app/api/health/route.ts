export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Healthcheck Railway: намеренно не трогает БД, чтобы моргание Postgres не роняло деплой. */
export function GET(): Response {
  return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } })
}
