import { requireUser } from '@/lib/auth'
import { CATEGORY_COLORS } from '@/lib/constants'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { badRequest, guard, json, unauthorized } from '@/lib/http'
import { listCategories } from '@/lib/queries'
import { parseColor, parseEmoji, parseKind, parseText, readJson } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_CATEGORIES = 60

export async function GET(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()
    return json({ categories: await listCategories(user.id) })
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

    const kind = parseKind(body.kind)
    if (!kind) return badRequest('invalid_kind')

    const emoji = parseEmoji(body.emoji) ?? (kind === 'income' ? '💰' : '💸')
    const color = parseColor(body.color) ?? CATEGORY_COLORS[0]

    const existing = await listCategories(user.id)
    if (existing.length >= MAX_CATEGORIES) return badRequest('too_many_categories')

    const [created] = await db
      .insert(categories)
      .values({ userId: user.id, name, kind, emoji, color })
      .onConflictDoNothing()
      .returning({ id: categories.id })

    // Уникальный индекс (user, kind, name) — значит такая категория уже есть.
    if (!created) return badRequest('duplicate_category')

    return json({ categories: await listCategories(user.id) }, 201)
  })
}
