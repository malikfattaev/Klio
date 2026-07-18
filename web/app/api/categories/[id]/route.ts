import { and, eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { badRequest, guard, json, notFound, unauthorized } from '@/lib/http'
import { listCategories } from '@/lib/queries'
import { parseColor, parseEmoji, parseId, parseText, readJson } from '@/lib/validate'

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

    const patch: Partial<typeof categories.$inferInsert> = {}

    if (body.name !== undefined) {
      const name = parseText(body.name, 32)
      if (!name) return badRequest('invalid_name')
      patch.name = name
    }

    if (body.emoji !== undefined) {
      const emoji = parseEmoji(body.emoji)
      if (!emoji) return badRequest('invalid_emoji')
      patch.emoji = emoji
    }

    if (body.color !== undefined) {
      const color = parseColor(body.color)
      if (!color) return badRequest('invalid_color')
      patch.color = color
    }

    // Направление не меняем: у категории уже могут быть операции противоположного типа.
    if (Object.keys(patch).length === 0) return badRequest('nothing_to_update')

    const [updated] = await db
      .update(categories)
      .set(patch)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .returning({ id: categories.id })

    if (!updated) return notFound()

    return json({ categories: await listCategories(user.id) })
  })
}

/** Операции удалённой категории остаются: category_id обнуляется по ON DELETE SET NULL. */
export async function DELETE(request: Request, context: Context): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const id = parseId((await context.params).id)
    if (!id) return badRequest('invalid_id')

    const [deleted] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .returning({ id: categories.id })

    if (!deleted) return notFound()

    return json({ categories: await listCategories(user.id) })
  })
}
