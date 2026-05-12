import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import type { EarnBalance, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StepCard } from '@/components/StepCard'

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

  if (isLoading) {
    return (
      <StepCard>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-full max-w-80" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </StepCard>
    )
  }

  if (!pool || !position) {
    return <p className="text-destructive">Position not found</p>
  }

  return (
    <StepCard className="gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-medium text-foreground leading-8">Review withdrawal</h2>
        <p className="text-sm text-muted-foreground">Confirm before executing.</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground leading-4">Amount</p>
        <div className="flex gap-1 items-center">
          <span className="text-xl font-semibold text-foreground leading-none">{amount}</span>
          {tokenSymbol && (
            <span className="shrink-0 size-4 overflow-hidden rounded-full">
              {getTokenIcon(tokenSymbol, 16)}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground leading-none">{tokenSymbol}</span>
        </div>
      </div>

      <div className="flex gap-5 w-full">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack} disabled={loading}>
          Back
        </Button>
        {!isCorrectChain ? (
          <Button size="lg" className="flex-1" onClick={onSwitchChain} disabled={loading}>
            Switch Network
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={onConfirm} disabled={loading || !canConfirm}>
            {loading ? 'Submitting...' : 'Confirm'}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-center text-destructive">{error}</p>}
    </StepCard>
  )
}
