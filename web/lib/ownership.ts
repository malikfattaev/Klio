import { and, eq } from 'drizzle-orm'

import { db } from './db'
import { cards, categories } from './db/schema'
import { badRequest } from './http'
import type { TxKind } from './types'

/**
 * Карта и категория обязаны принадлежать этому пользователю — иначе подставленный
 * чужой id позволил бы писать в чужие данные. Возвращает ответ с ошибкой либо null.
 */
export async function assertOwnership(
  userId: number,
  cardId: number,
  categoryId: number | null,
  kind: TxKind,
): Promise<Response | null> {
  const [card] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .limit(1)

  if (!card) return badRequest('card_not_found')

  if (categoryId !== null) {
    const [category] = await db
      .select({ id: categories.id, kind: categories.kind })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1)

    if (!category) return badRequest('category_not_found')
    if (category.kind !== kind) return badRequest('category_kind_mismatch')
  }

  return null
}
