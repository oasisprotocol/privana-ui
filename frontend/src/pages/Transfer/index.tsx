import { useMemo, useState } from 'react'
import { EyeOff } from 'lucide-react'
import { useConnection } from 'wagmi'
import { useTokens } from '@/api/swap'
import { AssetRow } from '@/components/AssetRow'
import { BackHeader } from '@/components/BackHeader'
import { Notice } from '@/components/Notice'
import { Button } from '@/components/ui/button'
import { ALLOWED_TOKEN_IDS } from '@/config/tokens'
import { useGoBack } from '@/hooks/use-go-back'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'
import { RecipientField } from './RecipientField'
import { recipientError } from './recipient'
import { useSystemAddresses } from './useSystemAddresses'

export const Transfer = () => {
  const goBack = useGoBack(dashboardPath())
  const { address } = useConnection()
  const systemAddresses = useSystemAddresses()
  const { data } = useTokens()
  const [recipient, setRecipient] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [amount, setAmount] = useState('')
  const tokens = useMemo(
    () => (data?.tokens ?? []).filter(t => (ALLOWED_TOKEN_IDS as string[]).includes(t.token_id)),
    [data],
  )
  const token = tokens.find(t => t.token_id === tokenId)
  const toError = recipient.trim() ? recipientError(recipient.trim(), address, systemAddresses) : null

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Send" onBack={goBack} />
      <div className="mt-5 flex flex-col gap-6">
        <RecipientField value={recipient} onChange={setRecipient} error={toError} />
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground">Amount</p>
          <AssetRow
            tokens={tokens}
            token={token}
            onTokenChange={id => {
              setTokenId(id)
              setAmount('')
            }}
            amount={amount}
            onAmountChange={setAmount}
          />
        </div>
        <Notice icon={EyeOff}>
          <span className="font-semibold">Private, not anonymous.</span> It settles inside Privana — nothing
          on Base or Ethereum.
        </Notice>
      </div>
      <Button size="lg" className="mt-6 h-14 w-full text-base" disabled>
        Review
      </Button>
    </div>
  )
}
