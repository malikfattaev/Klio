export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

export function unauthorized(): Response {
  return json({ error: 'unauthorized' }, 401)
}

export function badRequest(message: string): Response {
  return json({ error: message }, 400)
}

export function notFound(): Response {
  return json({ error: 'not_found' }, 404)
}

export function serverError(error: unknown): Response {
  console.error(error)
  return json({ error: 'server_error' }, 500)
}

/** Оборачивает обработчик, чтобы неожиданное исключение не утекло клиенту как HTML. */
export async function guard(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler()
  } catch (error) {
    return serverError(error)
  }
}
