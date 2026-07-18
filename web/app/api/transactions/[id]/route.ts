import { and, eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { badRequest, guard, json, notFound, unauthorized } from '@/lib/http'
import { assertOwnership } from '@/lib/ownership'
import { listCards, toTransactionDto } from '@/lib/queries'
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

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const id = parseId((await context.params).id)
    if (!id) return badRequest('invalid_id')

    const body = await readJson(request)
    if (!body) return badRequest('invalid_body')

    const [current] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .limit(1)

    if (!current) return notFound()

    const patch: Partial<typeof transactions.$inferInsert> = {}

    if (body.cardId !== undefined) {
      const cardId = parseId(body.cardId)
      if (!cardId) return badRequest('invalid_card')
      patch.cardId = cardId
    }

    if (body.kind !== undefined) {
      const kind = parseKind(body.kind)
      if (!kind) return badRequest('invalid_kind')
      patch.kind = kind
    }

    if (body.amount !== undefined) {
      const amount = parseAmount(body.amount)
      if (!amount) return badRequest('invalid_amount')
      patch.amount = amount
    }

    if (body.categoryId !== undefined) {
      const categoryId = parseOptionalId(body.categoryId)
      if (categoryId === undefined) return badRequest('invalid_category')
      patch.categoryId = categoryId
    }

    if (body.note !== undefined) {
      const note = parseOptionalText(body.note, 200)
      if (note === undefined) return badRequest('invalid_note')
      patch.note = note
    }

    if (body.occurredAt !== undefined) {
      const occurredAt = parseDate(body.occurredAt)
      if (!occurredAt) return badRequest('invalid_date')
      patch.occurredAt = occurredAt
    }

    if (Object.keys(patch).length === 0) return badRequest('nothing_to_update')

    // Сверяем результат слияния, а не только присланные поля: смена одного лишь
    // kind может рассогласовать операцию с её старой категорией.
    const ownership = await assertOwnership(
      user.id,
      patch.cardId ?? current.cardId,
      patch.categoryId !== undefined ? patch.categoryId : current.categoryId,
      patch.kind ?? current.kind,
    )
    if (ownership) return ownership

    const [updated] = await db
      .update(transactions)
      .set(patch)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .returning()

    if (!updated) return notFound()

    return json({ transaction: toTransactionDto(updated), cards: await listCards(user.id) })
  })
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const id = parseId((await context.params).id)
    if (!id) return badRequest('invalid_id')

    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .returning({ id: transactions.id })

    if (!deleted) return notFound()

    return json({ id: deleted.id, cards: await listCards(user.id) })
  })
}
