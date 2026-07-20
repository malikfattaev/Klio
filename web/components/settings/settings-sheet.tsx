'use client'

import { useState } from 'react'

import { errorMessage } from '@/lib/client/api'
import { useActions } from '@/lib/client/store'
import { CURRENCIES, CURRENCY_CODES } from '@/lib/constants'
import { Sheet } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast'

export function SettingsSheet({
  open,
  onClose,
  currency,
}: {
  open: boolean
  onClose: () => void
  currency: string
}) {
  const { setCurrency } = useActions()
  const toast = useToast()
  const [pending, setPending] = useState<string | null>(null)

  const choose = async (code: string) => {
    if (code === currency) {
      onClose()
      return
    }
    setPending(code)
    try {
      await setCurrency(code)
      onClose()
    } catch (error) {
      toast.show(errorMessage(error))
    } finally {
      setPending(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Настройки">
      <div className="pb-2">
        <span className="mb-2 block text-[13px] font-medium text-muted">Валюта</span>
        <p className="mb-3 text-[13px] leading-relaxed text-faint">
          Одна валюта на все карты, иначе общий баланс складывал бы несравнимые суммы.
          Смена валюты не пересчитывает уже введённые суммы.
        </p>

        <div className="flex flex-col gap-1.5">
          {CURRENCY_CODES.map((code) => {
            const meta = CURRENCIES[code]
            const active = code === currency
            return (
              <button
                key={code}
                type="button"
                disabled={pending !== null}
                onClick={() => choose(code)}
                className={`press flex items-center justify-between rounded-2xl px-4 py-3.5 text-left ${
                  active ? 'bg-accent/20 ring-1 ring-accent' : 'bg-raised'
                }`}
              >
                <span>
                  <span className="block text-[15px] font-medium">{meta.label}</span>
                  <span className="text-[13px] text-muted">{code}</span>
                </span>
                <span className="text-[17px] font-semibold text-muted">
                  {pending === code ? '…' : meta.symbol}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}
