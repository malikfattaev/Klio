import { requireUser } from '@/lib/auth'
import { guard, json, unauthorized } from '@/lib/http'
import { listCards, listCategories } from '@/lib/queries'
import type { Bootstrap } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Одна загрузка на старте приложения: профиль, карты с балансами и категории. */
export async function GET(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser(request)
    if (!user) return unauthorized()

    const [cards, categories] = await Promise.all([
      listCards(user.id),
      listCategories(user.id),
    ])

    const payload: Bootstrap = {
      me: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        photoUrl: user.photoUrl,
        currency: user.currency,
      },
      cards,
      categories,
    }

    return json(payload)
  })
}
