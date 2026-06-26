import { ChevronLeft, ShieldCheck } from 'lucide-react'
import type { EarnBalance, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Row } from '@/components/Row'
import { PROTOCOL_LABELS } from './labels'

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
  const protocol = pool ? (PROTOCOL_LABELS[pool.strategy] ?? pool.strategy) : ''

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
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          aria-label="Back"
          className="absolute left-0 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="text-xl font-semibold text-foreground">Review move</h2>
      </div>

      <SurfaceCard className="p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You're moving out</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">{amount}</span>
          <span className="text-xl font-semibold text-muted-foreground">{tokenSymbol}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{protocol} → Available</p>
      </SurfaceCard>

      <SurfaceCard className="flex flex-col px-5">
        <Row size="md" className="border-b border-border py-3.5" label="From" value={protocol} />
        <Row size="md" className="border-b border-border py-3.5" label="To" value="Available balance" />
        <Row
          size="md"
          mutedValue
          className="border-b border-border py-3.5"
          label="Stops earning"
          value={`${amount} ${tokenSymbol}`}
        />
        <Row size="md" mutedValue className="py-3.5" label="Fee" value="Free" />
      </SurfaceCard>

      <div className="flex gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          These funds stop earning and return to your Available balance as {tokenSymbol}. From there you can
          withdraw, swap, or move them back to Earn anytime.
        </p>
      </div>

      {!isCorrectChain ? (
        <Button size="lg" className="mt-2 h-12 w-full text-base" onClick={onSwitchChain} disabled={loading}>
          Switch Network
        </Button>
      ) : (
        <Button
          size="lg"
          className="mt-2 h-12 w-full text-base"
          onClick={onConfirm}
          disabled={loading || !canConfirm}
        >
          {loading ? 'Submitting...' : 'Confirm'}
        </Button>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
