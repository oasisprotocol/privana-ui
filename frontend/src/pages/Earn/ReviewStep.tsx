import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import type { DepositQuoteResponse, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { StepCard } from '@/components/StepCard'
import { formatAmount } from '@/lib/tokens'
import { formatApyBps, STRATEGY_LABELS } from './labels'

const tokenLabel = (token: TokenInfo) => token.token_symbol ?? token.token_type_name

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-xs font-medium leading-4">
    <p className="text-muted-foreground">{label}</p>
    <p className="text-foreground">{value}</p>
  </div>
)

type ReviewStepProps = {
  pool: EarnPool | undefined
  token: TokenInfo | undefined
  amount: string
  quote: DepositQuoteResponse | undefined
  isLoading: boolean
  quoteLoading: boolean
  quoteError?: string | null
  quoteExpired?: boolean
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
  quoteExpired,
  isCorrectChain,
  onSwitchChain,
  onBack,
  onConfirm,
  loading,
  error,
}: ReviewStepProps) => {
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

  if (!pool) {
    return <p className="text-destructive">Pool not found</p>
  }

  const decimals = token?.token_decimals
  const sharesLabel = quote && decimals != null ? formatAmount(BigInt(quote.shares_estimate), decimals) : '-'
  const exchangeRateLabel = quote
    ? `1 ${token?.token_symbol ?? 'token'} ≈ ${Number(quote.exchange_rate).toFixed(4)} shares`
    : '-'

  return (
    <StepCard className="gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-medium text-foreground leading-8">Review activation</h2>
        <p className="text-sm text-muted-foreground">Confirm before activating yield.</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground leading-4">Deposit</p>
        <div className="flex gap-2 items-center">
          <span className="text-xl font-semibold text-foreground leading-none">{amount}</span>
          {token?.token_symbol && (
            <span className="shrink-0 size-5 overflow-hidden rounded-full">
              {getTokenIcon(token.token_symbol, 20)}
            </span>
          )}
          {token && (
            <span className="text-base font-semibold text-foreground leading-none">{tokenLabel(token)}</span>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Row label="Strategy" value={STRATEGY_LABELS[pool.strategy] ?? pool.strategy} />
        <Row label="APY" value={formatApyBps(pool.apy_bps)} />
        {quoteLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : quoteError ? (
          <p className="text-sm text-destructive">Failed to fetch quote: {quoteError}</p>
        ) : (
          <>
            <Row label="Estimated shares" value={sharesLabel} />
            <Row label="Exchange rate" value={exchangeRateLabel} />
          </>
        )}
        <Row label="Privacy" value="🔒 No public trace" />
      </div>

      {quoteExpired && (
        <div className="rounded-lg border bg-card p-4 text-sm">
          <p className="text-destructive">Quote expired. Go back to fetch a new one.</p>
        </div>
      )}
      <div className="flex gap-5 w-full">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack} disabled={loading}>
          Back
        </Button>
        {!isCorrectChain ? (
          <Button size="lg" className="flex-1" onClick={onSwitchChain} disabled={loading}>
            Switch Network
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading || !quote || quoteExpired}
          >
            {loading ? 'Signing & submitting...' : 'Activate yield'}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-center text-destructive">{error}</p>}
    </StepCard>
  )
}
