import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { badRequest, guard, json, unauthorized } from '@/lib/http'
import { assertOwnership } from '@/lib/ownership'
import { listCards, listTransactions, toTransactionDto } from '@/lib/queries'
import {
  parseAmount,
  parseDate,
  parseId,
  parseKind,
  parseOptionalId,
  parseOptionalText,
  readJson,
} from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    return json(await listTransactions(user.id, searchParams))
  })
}

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const body = await readJson(request)
    if (!body) return badRequest('invalid_body')

    const cardId = parseId(body.cardId)
    if (!cardId) return badRequest('invalid_card')

    const kind = parseKind(body.kind)
    if (!kind) return badRequest('invalid_kind')

    const amount = parseAmount(body.amount)
    if (!amount) return badRequest('invalid_amount')

    const categoryId = parseOptionalId(body.categoryId)
    if (categoryId === undefined) return badRequest('invalid_category')

    const note = parseOptionalText(body.note, 200)
    if (note === undefined) return badRequest('invalid_note')

    const occurredAt = body.occurredAt === undefined ? new Date() : parseDate(body.occurredAt)
    if (!occurredAt) return badRequest('invalid_date')

    const ownership = await assertOwnership(user.id, cardId, categoryId, kind)
    if (ownership) return ownership

    const [created] = await db
      .insert(transactions)
      .values({ userId: user.id, cardId, categoryId, kind, amount, note, occurredAt })
      .returning()

    // Отдаём карты вместе с операцией: баланс пересчитан в БД, клиенту не нужен
    // второй запрос и он не рискует разойтись с сервером.
    return json({ transaction: toTransactionDto(created), cards: await listCards(user.id) }, 201)
  })
}
