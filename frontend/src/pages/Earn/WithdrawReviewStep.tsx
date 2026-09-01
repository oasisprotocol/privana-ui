import type { EarnBalance, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Skeleton } from '@/components/ui/skeleton'
import { getProtocolLabel } from '@/config/protocols'
import {
  ReviewAmountCard,
  ReviewConfirmButton,
  ReviewDetails,
  ReviewDisclaimer,
  ReviewHeader,
} from './ReviewParts'

type WithdrawReviewStepProps = {
  pool: EarnPool | undefined
  position: EarnBalance | undefined
  token: TokenInfo | undefined
  amount: string
  isLoading: boolean
  isCorrectChain: boolean
  canConfirm?: boolean
  onSwitchChain: () => void
  onBack: () => void
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}

export const WithdrawReviewStep = ({
  pool,
  position,
  token,
  amount,
  isLoading,
  isCorrectChain,
  canConfirm = true,
  onSwitchChain,
  onBack,
  onConfirm,
  loading,
  error,
}: WithdrawReviewStepProps) => {
  const tokenSymbol = token?.token_symbol ?? token?.token_type_name ?? ''
  const protocol = pool ? getProtocolLabel(pool.strategy) : ''

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-110 mx-auto">
        <Skeleton className="h-7 w-40 mx-auto" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!pool || !position) {
    return <p className="text-center text-destructive">Position not found</p>
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-110 mx-auto">
      <ReviewHeader title="Review transaction" onBack={onBack} disabled={loading} />

      <ReviewAmountCard
        eyebrow="You're moving out"
        amount={amount}
        symbol={tokenSymbol}
        subline={`${protocol} → Available`}
      />

      <ReviewDetails
        rows={[
          { label: 'From', value: protocol },
          { label: 'To', value: 'Available balance' },
          { label: 'Stops earning', value: `${amount} ${tokenSymbol}`, muted: true },
          { label: 'Fee', value: 'Free', muted: true },
        ]}
      />

      <ReviewDisclaimer>
        These funds stop earning and return to your Available balance as {tokenSymbol}. From there you can
        withdraw, swap, or move them back to Earn anytime.
      </ReviewDisclaimer>

      <ReviewConfirmButton
        isCorrectChain={isCorrectChain}
        onSwitchChain={onSwitchChain}
        onConfirm={onConfirm}
        disabled={loading || !canConfirm}
        loading={loading}
        label="Confirm"
      />

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
