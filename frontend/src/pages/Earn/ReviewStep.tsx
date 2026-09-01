import { useMemo } from 'react'
import type { DepositQuoteResponse, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Skeleton } from '@/components/ui/skeleton'
import { QuoteCountdown } from '@/components/QuoteCountdown'
import { formatFiat } from '@/lib/tokens'
import { apyBpsToFraction } from '@/lib/apy'
import { useAmountFiat } from '@/hooks/useAmountFiat'
import { getProtocolLabel } from '@/config/protocols'
import { VenueHeader } from './VenueHeader'
import {
  ReviewAmountCard,
  ReviewConfirmButton,
  ReviewDetails,
  ReviewDisclaimer,
  ReviewHeader,
  type ReviewDetailRow,
} from './ReviewParts'

type ReviewStepProps = {
  pool: EarnPool | undefined
  token: TokenInfo | undefined
  amount: string
  quote: DepositQuoteResponse | undefined
  isLoading: boolean
  quoteLoading: boolean
  quoteError?: string | null
  expiresAt?: number
  isCorrectChain: boolean
  onSwitchChain: () => void
  onBack: () => void
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}

export const ReviewStep = ({
  pool,
  token,
  amount,
  quote,
  isLoading,
  quoteLoading,
  quoteError,
  expiresAt,
  isCorrectChain,
  onSwitchChain,
  onBack,
  onConfirm,
  loading,
  error,
}: ReviewStepProps) => {
  const tokenSymbol = token?.token_symbol ?? token?.token_type_name ?? ''
  const protocol = pool ? getProtocolLabel(pool.strategy) : ''
  const chain = token?.chain_name ?? ''

  const fiatAmount = useAmountFiat(token, amount)
  const projected = useMemo(() => {
    if (!pool || fiatAmount == null) return undefined
    const perYear = fiatAmount * apyBpsToFraction(pool.apy_bps)
    return { perMonth: perYear / 12, perYear }
  }, [pool, fiatAmount])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-110 mx-auto">
        <Skeleton className="h-7 w-40 mx-auto" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!pool) {
    return <p className="text-center text-destructive">Pool not found</p>
  }

  const rows: ReviewDetailRow[] = [
    { label: 'Lock-up', value: 'None — withdraw anytime' },
    ...(projected
      ? [
          { label: 'Projected / month', value: formatFiat(projected.perMonth), muted: true },
          { label: 'Projected / year', value: formatFiat(projected.perYear), muted: true },
        ]
      : []),
    { label: 'Returns to', value: 'Available balance' },
  ]

  return (
    <div className="flex flex-col gap-4 w-full max-w-110 mx-auto">
      <ReviewHeader title="Review transaction" onBack={onBack} disabled={loading} />

      <div className="flex justify-end">
        <QuoteCountdown quoteLoading={quoteLoading} expiresAt={expiresAt} />
      </div>

      <ReviewAmountCard
        eyebrow="You're moving"
        amount={amount}
        symbol={tokenSymbol}
        subline={`Available → ${protocol}`}
      />

      <ReviewDetails
        header={
          <VenueHeader strategyKey={pool.strategy} asset={tokenSymbol} chain={chain} apyBps={pool.apy_bps} />
        }
        rows={rows}
      />

      <ReviewDisclaimer>
        Funds move from your Available balance into {protocol} and start earning right away. No lock-up — move
        them back anytime.
      </ReviewDisclaimer>

      {quoteError && (
        <p className="text-center text-sm text-destructive">Failed to fetch quote: {quoteError}</p>
      )}

      <ReviewConfirmButton
        isCorrectChain={isCorrectChain}
        onSwitchChain={onSwitchChain}
        onConfirm={onConfirm}
        disabled={loading || quoteLoading || !quote}
        loading={loading}
        label="Confirm"
        loadingLabel="Signing & submitting..."
      />

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
