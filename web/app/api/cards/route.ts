import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { cards } from '@/lib/db/schema'
import { badRequest, guard, json, unauthorized } from '@/lib/http'
import { listCards } from '@/lib/queries'
import { parseBalance, parseText, parseTheme, readJson } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Больше карт одному человеку не нужно, а список остаётся мгновенным. */
const MAX_CARDS = 20

export async function GET(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()
    return json({ cards: await listCards(user.id) })
  })
}

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const body = await readJson(request)
    if (!body) return badRequest('invalid_body')

    const name = parseText(body.name, 32)
    if (!name) return badRequest('invalid_name')

    const theme = parseTheme(body.theme) ?? 'indigo'
    const initialBalance = parseBalance(body.initialBalance ?? 0)
    if (initialBalance === null) return badRequest('invalid_balance')

    const existing = await listCards(user.id)
    if (existing.length >= MAX_CARDS) return badRequest('too_many_cards')

    await db.insert(cards).values({ userId: user.id, name, theme, initialBalance })

    return json({ cards: await listCards(user.id) }, 201)
  })
}
