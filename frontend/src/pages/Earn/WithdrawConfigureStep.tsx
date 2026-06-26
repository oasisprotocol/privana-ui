import { useMemo } from 'react'
import type { EarnBalance, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { exceedsAmount, formatAmount, isPositiveAmount } from '@/lib/tokens'
import { EarnAmountField } from './EarnAmountField'
import { PROTOCOL_LABELS } from './labels'

type WithdrawConfigureStepProps = {
  pool: EarnPool | undefined
  position: EarnBalance | undefined
  token: TokenInfo | undefined
  isLoading: boolean
  amount: string
  onAmountChange: (v: string) => void
  onReview: () => void
}

export const WithdrawConfigureStep = ({
  pool,
  position,
  token,
  isLoading,
  amount,
  onAmountChange,
  onReview,
}: WithdrawConfigureStepProps) => {
  const decimals = token?.token_decimals
  const protocol = pool ? (PROTOCOL_LABELS[pool.strategy] ?? pool.strategy) : ''
  const tokenSymbol = token?.token_symbol ?? token?.token_type_name ?? ''

  const positionWei = useMemo(() => {
    if (!position?.underlying_amount) return 0n
    try {
      return BigInt(position.underlying_amount)
    } catch {
      return 0n
    }
  }, [position])
  const positionLabel = decimals != null ? formatAmount(positionWei, decimals) : '-'

  const canReview =
    !!position && isPositiveAmount(amount, decimals) && !exceedsAmount(amount, decimals, positionWei)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-110 mx-auto">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-6 h-14 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!pool || !position) {
    return <p className="text-center text-destructive">Position not found</p>
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-110 mx-auto">
      <h2 className="text-xl font-semibold text-foreground">Remove from {protocol}</h2>

      <EarnAmountField
        amount={amount}
        onAmountChange={onAmountChange}
        token={token}
        maxWei={positionWei}
        ariaLabel="Amount to remove"
        sublabel={
          <>
            In Earn:{' '}
            <span className="font-medium text-foreground">
              {positionLabel} {tokenSymbol}
            </span>
          </>
        }
      />

      <Button size="lg" className="mt-4 h-12 w-full text-base" disabled={!canReview} onClick={onReview}>
        Review
      </Button>
    </div>
  )
}
