import { eq } from 'drizzle-orm'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { badRequest, guard, json, unauthorized } from '@/lib/http'
import { parseCurrency, readJson } from '@/lib/validate'
import type { Me } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const body = await readJson(request)
    if (!body) return badRequest('invalid_body')

    const currency = parseCurrency(body.currency)
    if (!currency) return badRequest('invalid_currency')

    const [updated] = await db
      .update(users)
      .set({ currency })
      .where(eq(users.id, user.id))
      .returning()

    const me: Me = {
      id: updated.id,
      firstName: updated.firstName,
      username: updated.username,
      photoUrl: updated.photoUrl,
      currency: updated.currency,
    }

    return json({ me })
  })
}
