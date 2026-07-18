import { getInitData } from './telegram'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
    this.name = 'ApiError'
  }
}

const MESSAGES: Record<string, string> = {
  unauthorized: 'Откройте приложение через Telegram',
  invalid_name: 'Проверьте название',
  invalid_amount: 'Введите сумму больше нуля',
  invalid_balance: 'Проверьте баланс',
  invalid_date: 'Проверьте дату',
  invalid_note: 'Описание слишком длинное',
  duplicate_category: 'Такая категория уже есть',
  too_many_cards: 'Больше карт добавить нельзя',
  too_many_categories: 'Больше категорий добавить нельзя',
  card_not_found: 'Карта не найдена',
  category_not_found: 'Категория не найдена',
  category_kind_mismatch: 'Категория не подходит под тип операции',
  not_found: 'Запись не найдена',
  server_error: 'Что-то пошло не так',
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return MESSAGES[error.code] ?? 'Что-то пошло не так'
  return 'Нет соединения'
}

/**
 * Мини-апп открыт в iframe на web.telegram.org, где куки третьесторонние и часть
 * браузеров их режет. Поэтому подпись Telegram едет заголовком на каждом запросе.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  const initData = getInitData()
  if (initData) headers.set('Authorization', `tma ${initData}`)
  if (init?.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(path, { ...init, headers, cache: 'no-store' })

  if (!response.ok) {
    let code = 'server_error'
    try {
      const body = (await response.json()) as { error?: string }
      if (body?.error) code = body.error
    } catch {
      // Ответ без JSON — оставляем общий код ошибки.
    }
    throw new ApiError(response.status, code)
  }

  return response.json() as Promise<T>
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
}

export function del<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' })
}
