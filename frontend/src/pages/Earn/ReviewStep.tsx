import { useMemo } from 'react'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import type { DepositQuoteResponse, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { useTokenPrices } from '@/api/coin-gecko'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QuoteCountdown } from '@/components/QuoteCountdown'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Row } from '@/components/Row'
import { formatFiat } from '@/lib/tokens'
import { apyBpsToFraction } from '@/lib/apy'
import { ApyValue } from './ApyValue'
import { PROTOCOL_LABELS } from './labels'

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

  const priceTokenIds = useMemo(() => (token ? [token.token_id] : []), [token])
  const { data: prices } = useTokenPrices(priceTokenIds)
  const projected = useMemo(() => {
    if (!pool || !token || !prices) return undefined
    const price = prices[token.token_id]
    const asNum = Number(amount)
    if (price == null || !Number.isFinite(asNum)) return undefined
    const perYear = asNum * price * apyBpsToFraction(pool.apy_bps)
    return { perMonth: perYear / 12, perYear }
  }, [pool, token, prices, amount])

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
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You're moving</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">{amount}</span>
          <span className="text-xl font-semibold text-muted-foreground">{tokenSymbol}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Available → {protocol}</p>
      </SurfaceCard>

      <SurfaceCard className="flex flex-col px-5">
        <Row size="md" className="border-b border-border py-3.5" label="From" value="Available balance" />
        <Row size="md" className="border-b border-border py-3.5" label="To" value={protocol} />
        <Row
          size="md"
          className="border-b border-border py-3.5"
          label="Rate"
          value={<ApyValue bps={pool.apy_bps} />}
        />
        <Row
          size="md"
          mutedValue
          className="border-b border-border py-3.5"
          label="Lock-up"
          value="None — withdraw anytime"
        />
        {projected && (
          <>
            <Row
              size="md"
              mutedValue
              className="border-b border-border py-3.5"
              label="Projected / month"
              value={formatFiat(projected.perMonth)}
            />
            <Row
              size="md"
              mutedValue
              className="border-b border-border py-3.5"
              label="Projected / year"
              value={formatFiat(projected.perYear)}
            />
          </>
        )}
        <Row size="md" mutedValue className="py-3.5" label="Fee" value="Free" />
      </SurfaceCard>

      <div className="flex gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Funds move from your Available balance into {protocol} and start earning right away. No lock-up —
          move them back anytime.
        </p>
      </div>

      <QuoteCountdown quoteLoading={quoteLoading} expiresAt={expiresAt} />

      {quoteError && (
        <p className="text-center text-sm text-destructive">Failed to fetch quote: {quoteError}</p>
      )}

      {!isCorrectChain ? (
        <Button size="lg" className="h-12 w-full text-base" onClick={onSwitchChain} disabled={loading}>
          Switch Network
        </Button>
      ) : (
        <Button
          size="lg"
          className="h-12 w-full text-base"
          onClick={onConfirm}
          disabled={loading || quoteLoading || !quote}
        >
          {loading ? 'Signing & submitting...' : 'Confirm'}
        </Button>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
