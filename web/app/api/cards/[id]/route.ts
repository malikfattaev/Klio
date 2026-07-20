import { and, eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { cards } from '@/lib/db/schema'
import { badRequest, guard, json, notFound, unauthorized } from '@/lib/http'
import { listCards } from '@/lib/queries'
import { parseBalance, parseId, parseText, parseTheme, readJson } from '@/lib/validate'

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

    const patch: Partial<typeof cards.$inferInsert> = {}

    if (body.name !== undefined) {
      const name = parseText(body.name, 32)
      if (!name) return badRequest('invalid_name')
      patch.name = name
    }

    if (body.theme !== undefined) {
      const theme = parseTheme(body.theme)
      if (!theme) return badRequest('invalid_theme')
      patch.theme = theme
    }

    if (body.initialBalance !== undefined) {
      const initialBalance = parseBalance(body.initialBalance)
      if (initialBalance === null) return badRequest('invalid_balance')
      patch.initialBalance = initialBalance
    }

    if (Object.keys(patch).length === 0) return badRequest('nothing_to_update')

    const [updated] = await db
      .update(cards)
      .set(patch)
      .where(and(eq(cards.id, id), eq(cards.userId, user.id)))
      .returning({ id: cards.id })

    if (!updated) return notFound()

    return json({ cards: await listCards(user.id) })
  })
}

/** Удаление карты уносит её операции: на связи в схеме стоит ON DELETE CASCADE. */
export async function DELETE(request: Request, context: Context): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const id = parseId((await context.params).id)
    if (!id) return badRequest('invalid_id')

    const [deleted] = await db
      .delete(cards)
      .where(and(eq(cards.id, id), eq(cards.userId, user.id)))
      .returning({ id: cards.id })

    if (!deleted) return notFound()

    return json({ cards: await listCards(user.id) })
  })
}
