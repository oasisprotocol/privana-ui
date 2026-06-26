import { useMemo } from 'react'
import type { DepositQuoteResponse, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Skeleton } from '@/components/ui/skeleton'
import { QuoteCountdown } from '@/components/QuoteCountdown'
import { formatFiat } from '@/lib/tokens'
import { apyBpsToFraction } from '@/lib/apy'
import { useAmountFiat } from '@/hooks/useAmountFiat'
import { ApyValue } from './ApyValue'
import { PROTOCOL_LABELS } from './labels'
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
  const protocol = pool ? (PROTOCOL_LABELS[pool.strategy] ?? pool.strategy) : ''

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
    { label: 'From', value: 'Available balance' },
    { label: 'To', value: protocol },
    { label: 'Rate', value: <ApyValue bps={pool.apy_bps} /> },
    { label: 'Lock-up', value: 'None — withdraw anytime', muted: true },
    ...(projected
      ? [
          { label: 'Projected / month', value: formatFiat(projected.perMonth), muted: true },
          { label: 'Projected / year', value: formatFiat(projected.perYear), muted: true },
        ]
      : []),
    { label: 'Fee', value: 'Free', muted: true },
  ]

  return (
    <div className="flex flex-col gap-4 w-full max-w-110 mx-auto">
      <ReviewHeader title="Review move" onBack={onBack} disabled={loading} />

      <ReviewAmountCard
        eyebrow="You're moving"
        amount={amount}
        symbol={tokenSymbol}
        subline={`Available → ${protocol}`}
      />

      <ReviewDetails rows={rows} />

      <ReviewDisclaimer>
        Funds move from your Available balance into {protocol} and start earning right away. No lock-up — move
        them back anytime.
      </ReviewDisclaimer>

      <QuoteCountdown quoteLoading={quoteLoading} expiresAt={expiresAt} />

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
