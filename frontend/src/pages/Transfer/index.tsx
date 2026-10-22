import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { EyeOff } from 'lucide-react'
import { DepositModal, maxAmount, useBalance } from '@oasisprotocol/privana-sdk'
import { useConnection } from 'wagmi'
import { useOperations } from '@/api/operations'
import { useTokenPrices } from '@/api/prices'
import { useTokens } from '@/api/swap'
import { AssetRow } from '@/components/AssetRow'
import { BackHeader } from '@/components/BackHeader'
import { Notice } from '@/components/Notice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ALLOWED_TOKEN_IDS } from '@/config/tokens'
import { useGoBack } from '@/hooks/use-go-back'
import { useFunds } from '@/hooks/useFunds'
import { DESKTOP_CARD } from '@/lib/surface'
import { amountFiat, amountInputError, exceedsAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'
import { RecipientField } from './RecipientField'
import { recipientError } from './recipient'
import { useSystemAddresses } from './useSystemAddresses'

export const Transfer = () => {
  const goBack = useGoBack(dashboardPath())
  const { address } = useConnection()
  const systemAddresses = useSystemAddresses()
  const { data: operationsData, refetch: refetchOperations } = useOperations()
  // Swaps and Earn deposits sign the same transfer nonce; a scheduled one hasn't spent it yet.
  const nonceBusy = (operationsData?.operations ?? []).some(
    op => op.operation_type !== 'earn_withdraw' && op.status === 'scheduled',
  )
  useEffect(() => {
    if (!nonceBusy) return
    const timer = setInterval(() => void refetchOperations(), 10_000)
    return () => clearInterval(timer)
  }, [nonceBusy, refetchOperations])
  const { data, isLoading: tokensLoading, error: tokensError } = useTokens()
  const { availableTokenIds, isLoading: fundsLoading, isError: fundsError } = useFunds()
  const [depositOpen, setDepositOpen] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [amount, setAmount] = useState('')
  const tokens = useMemo(
    () =>
      (data?.tokens ?? []).filter(
        t => (ALLOWED_TOKEN_IDS as string[]).includes(t.token_id) && availableTokenIds.has(t.token_id),
      ),
    [data, availableTokenIds],
  )
  const token = tokens.find(t => t.token_id === tokenId) ?? tokens[0]
  const selectedId = token?.token_id
  const decimals = token?.token_decimals
  const balance = useBalance({ tokenId: selectedId as `0x${string}` | undefined, enabled: !!selectedId })
  const priceTokenIds = useMemo(() => (selectedId ? [selectedId] : []), [selectedId])
  const { data: prices } = useTokenPrices(priceTokenIds)

  const toError = recipient.trim() ? recipientError(recipient.trim(), address, systemAddresses) : null
  const notEnough = !balance.isLoading && exceedsAmount(amount, decimals, BigInt(balance.balanceWei || '0'))
  const amountError = amountInputError(amount, decimals) ?? (notEnough ? 'Not enough in Available' : null)
  const fiatValue = selectedId ? amountFiat(amount, decimals, prices?.[selectedId]) : undefined

  let amountField: ReactNode
  if (tokensError) {
    amountField = <p className="text-sm text-destructive">Failed to load tokens: {tokensError.message}</p>
  } else if (fundsError) {
    amountField = <p className="text-sm text-destructive">Failed to load your balances.</p>
  } else if (tokensLoading || fundsLoading) {
    amountField = <Skeleton className="h-[60px] w-full rounded-full" />
  } else if (tokens.length === 0) {
    amountField = (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted p-5 text-center">
        <p className="text-sm text-muted-foreground">Deposit funds to send.</p>
        <Button variant="outline" onClick={() => setDepositOpen(true)}>
          Deposit
        </Button>
      </div>
    )
  } else {
    amountField = (
      <AssetRow
        tokens={tokens}
        token={token}
        onTokenChange={id => {
          setTokenId(id)
          setAmount('')
        }}
        amount={amount}
        onAmountChange={setAmount}
        balance={{ wei: balance.balanceWei, loading: balance.isLoading }}
        balanceTitle="Available"
        amountError={amountError}
        fiatValue={fiatValue}
        onMax={() => {
          if (!token || decimals == null || !balance.balanceWei) return
          setAmount(
            maxAmount(BigInt(balance.balanceWei), { symbol: token.token_symbol ?? '', decimals }).input,
          )
        }}
      />
    )
  }

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Send" onBack={goBack} />
      <div className="mt-5 flex flex-col gap-6">
        <RecipientField value={recipient} onChange={setRecipient} error={toError} />
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground">Amount</p>
          {amountField}
        </div>
        <Notice icon={EyeOff}>
          <span className="font-semibold">Private, not anonymous.</span> It settles inside Privana — nothing
          on Base or Ethereum.
        </Notice>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {nonceBusy && (
          <p className="text-center text-sm text-muted-foreground">
            Wait for your swap or Earn deposit to finish.
          </p>
        )}
        <Button size="lg" className="h-14 w-full text-base" disabled>
          Review
        </Button>
      </div>
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onDepositSuccess={() => setDepositOpen(false)}
      />
    </div>
  )
}
