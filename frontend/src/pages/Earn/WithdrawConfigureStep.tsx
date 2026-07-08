import { useMemo } from 'react'
import type { EarnBalance, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { exceedsAmount, formatAmount, isPositiveAmount } from '@/lib/tokens'
import { formatApyBps } from '@/lib/apy'
import { EarnAmountField } from './EarnAmountField'
import { ProtocolIcon } from './ProtocolLabel'
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
  const chain = token?.chain_name ?? ''

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
      <div className="flex w-full items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-base [&>img]:size-full [&>svg]:size-6">
          <ProtocolIcon strategy={pool.strategy} size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold leading-tight text-foreground">{protocol}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tokenSymbol} · {chain}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-chart-positive/15 px-2.5 py-1 text-xs font-semibold text-chart-positive">
          {formatApyBps(pool.apy_bps)} APY
        </span>
      </div>

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
