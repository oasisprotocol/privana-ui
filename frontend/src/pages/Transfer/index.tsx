import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { EyeOff } from 'lucide-react'
import { useTokens } from '@/api/swap'
import { AssetRow } from '@/components/AssetRow'
import { BackHeader } from '@/components/BackHeader'
import { Button } from '@/components/ui/button'
import { ALLOWED_TOKEN_IDS } from '@/config/tokens'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'
import { RecipientField } from './RecipientField'

export const Transfer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data } = useTokens()
  const [recipient, setRecipient] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [amount, setAmount] = useState('')
  const tokens = useMemo(
    () => (data?.tokens ?? []).filter(t => (ALLOWED_TOKEN_IDS as string[]).includes(t.token_id)),
    [data],
  )
  const token = tokens.find(t => t.token_id === tokenId)

  const goBack = () => (location.key === 'default' ? navigate(dashboardPath()) : navigate(-1))

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Send" onBack={goBack} />
      <div className="mt-5 flex flex-col gap-6">
        <RecipientField value={recipient} onChange={setRecipient} />
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground">Amount</p>
          <AssetRow
            tokens={tokens}
            token={token}
            disabledId=""
            onTokenChange={id => {
              setTokenId(id)
              setAmount('')
            }}
            amount={amount}
            onAmountChange={setAmount}
          />
        </div>
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <EyeOff className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">Private, not anonymous.</span> It settles inside Privana — nothing
            on Base or Ethereum.
          </p>
        </div>
      </div>
      <Button size="lg" className="mt-6 h-14 w-full text-base" disabled>
        Review
      </Button>
    </div>
  )
}
