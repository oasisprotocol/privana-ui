import { type ReactNode, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { EyeOff } from 'lucide-react'
import {
  AccountingApiError,
  DepositModal,
  NetworkError,
  maxAmount,
  sortTokensByBalance,
  useBalance,
  useBatchBalances,
  usePrivanaContext,
  useTransfer,
} from '@oasisprotocol/privana-sdk'
import { useConnection } from 'wagmi'
import { type Operation, useOperations } from '@/api/operations'
import { useTokenPrices } from '@/api/prices'
import { useTokens } from '@/api/swap'
import { AssetRow } from '@/components/AssetRow'
import { BackHeader } from '@/components/BackHeader'
import { Notice } from '@/components/Notice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ALLOWED_TOKEN_IDS } from '@/config/tokens'
import { useGoBack } from '@/hooks/use-go-back'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { extractErrorMessage } from '@/lib/errors'
import { DESKTOP_CARD } from '@/lib/surface'
import { amountFiat, amountInputError, exceedsAmount, isPositiveAmount, parseAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { describeFailure } from '@/pages/Activity/failureCopy'
import { activityPath, dashboardPath } from '@/paths'
import { RecipientField } from './RecipientField'
import { ReviewStep } from './ReviewStep'
import { SentStep } from './SentStep'
import { recipientError } from './recipient'
import { useSystemAddresses } from './useSystemAddresses'

const IN_FLIGHT_MESSAGE = 'Wait for your swap or Earn deposit to finish.'

// Swaps and Earn deposits sign the same transfer nonce; a scheduled one hasn't spent it yet.
const holdsNonce = (operations: readonly Operation[] | undefined) =>
  (operations ?? []).some(op => op.operation_type !== 'earn_withdraw' && op.status === 'scheduled')

const transferFailure = (err: unknown): string => {
  if (err instanceof NetworkError || (err instanceof AccountingApiError && err.statusCode >= 500)) {
    return "We couldn't confirm the transfer. Check your activity before trying again."
  }
  if (err instanceof AccountingApiError) return describeFailure(err.detail ?? err.message)
  return extractErrorMessage(err, 'Transfer failed')
}

export const Transfer = () => {
  const goBack = useGoBack(dashboardPath())
  const navigate = useNavigate()
  const { address } = useConnection()
  const { addresses: systemAddresses, ready: systemAddressesReady } = useSystemAddresses()
  const { transfer } = useTransfer()
  const resetBalanceCaches = useResetBalanceCaches()
  const { data: operationsData, isError: operationsError, refetch: refetchOperations } = useOperations()
  const nonceBusy = holdsNonce(operationsData?.operations)
  const { data, isLoading: tokensLoading, error: tokensError } = useTokens()
  const { enabledTokens, tokensStatus } = usePrivanaContext()
  const balanceTokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const {
    balances,
    isLoading: balancesLoading,
    isError: balancesError,
  } = useBatchBalances({ tokenIds: balanceTokenIds })
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sent, setSent] = useState<{ recipient: string; amount: string; symbol: string } | null>(null)
  const [depositOpen, setDepositOpen] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [amount, setAmount] = useState('')
  const tokens = useMemo(() => {
    const available = new Map<string, bigint>(balances.map(b => [b.token_id, BigInt(b.balance || '0')]))
    const held = (data?.tokens ?? []).filter(
      t => (ALLOWED_TOKEN_IDS as string[]).includes(t.token_id) && (available.get(t.token_id) ?? 0n) > 0n,
    )
    // Same order as the token picker (SDK TokenSelectList), so the default is its top entry.
    return sortTokensByBalance(
      held.map(t => ({
        ...t,
        name: t.token_name ?? t.token_symbol ?? t.token_type_name,
        decimals: t.token_decimals ?? 0,
      })),
      t => available.get(t.token_id),
    )
  }, [data, balances])
  const token = tokens.find(t => t.token_id === tokenId)
  if (!token && tokens[0]) {
    setTokenId(tokens[0].token_id)
    setAmount('')
  }
  const selectedId = token?.token_id
  const decimals = token?.token_decimals
  const balance = useBalance({ tokenId: selectedId as `0x${string}` | undefined, enabled: !!selectedId })
  const { data: prices } = useTokenPrices(selectedId ? [selectedId] : [])

  const toError = recipient.trim() ? recipientError(recipient.trim(), address, systemAddresses) : null
  const notEnough = !balance.isLoading && exceedsAmount(amount, decimals, BigInt(balance.balanceWei || '0'))
  const amountError = amountInputError(amount, decimals) ?? (notEnough ? 'Not enough in Available' : null)
  const fiatValue = selectedId ? amountFiat(amount, decimals, prices?.[selectedId]) : undefined
  const canReview =
    !!recipient.trim() &&
    !toError &&
    systemAddressesReady &&
    !!token &&
    !balance.isLoading &&
    isPositiveAmount(amount, decimals) &&
    !amountError &&
    !!operationsData &&
    !operationsError &&
    !nonceBusy

  const send = async () => {
    const raw = parseAmount(amount, decimals)
    if (!token || raw == null) return
    setSending(true)
    setSendError(null)
    try {
      const { data: latest } = await refetchOperations()
      if (holdsNonce(latest?.operations)) return
      await transfer({
        toAddress: recipient.trim() as `0x${string}`,
        tokenId: token.token_id as `0x${string}`,
        amount: raw,
      })
      setSent({ recipient: recipient.trim(), amount, symbol: token.token_symbol ?? '' })
      resetBalanceCaches()
    } catch (err) {
      setSendError(transferFailure(err))
    } finally {
      setSending(false)
    }
  }

  let amountField: ReactNode
  if (tokensError) {
    amountField = <p className="text-sm text-destructive">Failed to load tokens: {tokensError.message}</p>
  } else if (tokensStatus === 'error' || balancesError) {
    amountField = <p className="text-sm text-destructive">Failed to load your balances.</p>
  } else if (tokensLoading || tokensStatus === 'loading' || balancesLoading) {
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

  if (sent) {
    return (
      <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
        <SentStep
          {...sent}
          onViewActivity={() => navigate(activityPath())}
          onDone={() => navigate(dashboardPath())}
        />
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
        <ReviewStep
          recipient={recipient.trim()}
          amount={amount}
          symbol={token?.token_symbol ?? ''}
          fiatValue={fiatValue}
          sending={sending}
          error={sendError}
          blockedReason={nonceBusy ? IN_FLIGHT_MESSAGE : amountError}
          onBack={() => {
            setSendError(null)
            setStep('form')
          }}
          onConfirm={() => void send()}
        />
      </div>
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
        {operationsError ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-sm text-destructive">
              Couldn't check for a pending swap or Earn deposit.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetchOperations()}>
              Try again
            </Button>
          </div>
        ) : (
          nonceBusy && <p className="text-center text-sm text-muted-foreground">{IN_FLIGHT_MESSAGE}</p>
        )}
        <Button
          size="lg"
          className="h-14 w-full text-base"
          disabled={!canReview}
          onClick={() => setStep('review')}
        >
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
