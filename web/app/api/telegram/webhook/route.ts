import { guard, json, unauthorized } from '@/lib/http'
import { sendBotMessage } from '@/lib/telegram-bot'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TelegramUpdate = {
  message?: {
    chat: { id: number }
    text?: string
  }
}

const START_TEXT =
  'Привет! Klio, это учёт расходов и доходов. Открой мини-апп кнопкой ниже и начни вести учёт.'

/**
 * Принимает апдейты от Telegram. Секрет из setWebhook сверяется с заголовком,
 * иначе кто угодно мог бы дёргать sendMessage через этот эндпоинт от имени бота.
 */
export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
      return unauthorized()
    }

    const update = (await request.json().catch(() => null)) as TelegramUpdate | null
    const chatId = update?.message?.chat.id
    const text = update?.message?.text

    if (chatId && text?.startsWith('/start')) {
      const appUrl = process.env.APP_URL
      await sendBotMessage(
        chatId,
        START_TEXT,
        appUrl ? { url: appUrl, buttonText: 'Открыть Klio' } : undefined,
      )
    }

    return json({ ok: true })
  })
}
