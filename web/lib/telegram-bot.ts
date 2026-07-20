const API_BASE = 'https://api.telegram.org'

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
  return token
}

/**
 * Отправляет сообщение от имени бота. Кнопка с web_app открывает мини-апп
 * прямо из чата, в дополнение к постоянной menu button.
 */
export async function sendBotMessage(
  chatId: number,
  text: string,
  webApp?: { url: string; buttonText: string },
): Promise<void> {
  const body: Record<string, unknown> = { chat_id: chatId, text }

  if (webApp) {
    body.reply_markup = {
      inline_keyboard: [[{ text: webApp.buttonText, web_app: { url: webApp.url } }]],
    }
  }

  const response = await fetch(`${API_BASE}/bot${botToken()}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    console.error('[klio] sendMessage failed', response.status, await response.text())
  }
}
