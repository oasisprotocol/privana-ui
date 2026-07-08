import { useEffect, useState } from 'react'
import { ArrowRight, Check, EyeOff, Loader2, X } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { Button } from '@/components/ui/button'
import { Row } from '@/components/Row'
import { SurfaceCard } from '@/components/SurfaceCard'
import { formatAmount, formatFiat } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import type { ActivityTokenInfo, SwapActivity } from '@/contexts/ActivityProvider/context'

// Estimated settlement is "< 20s"; if we blow past that, surface a reassurance
// and an escape hatch so the user isn't stuck watching an indefinite spinner.
const SLOW_SETTLEMENT_MS = 20_000

const TokenAmount = ({
  wei,
  token,
  align = 'start',
}: {
  wei: string
  token: ActivityTokenInfo
  align?: 'start' | 'end'
}) => (
  <div
    className={cn(
      'mt-0.5 flex flex-wrap items-center gap-1.5 text-base font-semibold tabular-nums',
      align === 'end' && 'justify-end',
    )}
  >
    <span className="break-all">{formatAmount(BigInt(wei || '0'), token.decimals)}</span>
    {token.symbol && (
      <span className="shrink-0 size-4 overflow-hidden rounded-full">{getTokenIcon(token.symbol, 16)}</span>
    )}
    <span>{token.symbol}</span>
  </div>
)

type SwapResultProps = {
  activity: SwapActivity
  onDone: () => void
  onViewActivity: () => void
}

export const SwapResult = ({ activity, onDone, onViewActivity }: SwapResultProps) => {
  const { fromToken, toToken, fromAmount, toAmount, rateLabel, feeFiat, status, error } = activity
  const receiveFormatted = formatAmount(BigInt(toAmount || '0'), toToken.decimals)

  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (status !== 'in-progress') {
      setSlow(false)
      return
    }
    const timer = window.setTimeout(() => setSlow(true), SLOW_SETTLEMENT_MS)
    return () => window.clearTimeout(timer)
  }, [status])

  if (status === 'in-progress') {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Swapping…</h1>
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
          {formatAmount(BigInt(fromAmount || '0'), fromToken.decimals)} {fromToken.symbol}
          <ArrowRight className="h-3.5 w-3.5" />
          {receiveFormatted} {toToken.symbol}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <EyeOff className="h-3.5 w-3.5" />
          Private execution — no public trace
        </p>
        {slow && (
          <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
            <p className="max-w-xs text-xs text-muted-foreground">
              This is taking longer than usual. It&apos;s safe to leave this page — your swap will keep
              processing in the background.
            </p>
            <Button variant="outline" size="sm" onClick={onViewActivity}>
              View in activity
            </Button>
          </div>
        )}
      </div>
    )
  }

  const failed = status === 'failed'

  return (
    <div className="mt-6 flex flex-col animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full animate-scale-in',
            failed ? 'bg-destructive/15 text-destructive' : 'bg-chart-positive/15 text-chart-positive',
          )}
        >
          {failed ? <X className="h-9 w-9" strokeWidth={3} /> : <Check className="h-9 w-9" strokeWidth={3} />}
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {failed ? 'Swap failed' : 'Swap complete'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {failed
            ? error || 'Something went wrong. Please try again.'
            : `${receiveFormatted} ${toToken.symbol} is in your wallet.`}
        </p>
      </div>

      <SurfaceCard className="mt-8 flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">You paid</div>
          <TokenAmount wei={fromAmount} token={fromToken} />
        </div>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <ArrowRight className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-right text-xs text-muted-foreground">You received</div>
          <TokenAmount wei={toAmount} token={toToken} align="end" />
        </div>
      </SurfaceCard>

      <SurfaceCard className="mt-4 flex flex-col gap-0 p-0">
        <Row size="md" className="px-4 py-3 border-b border-border" label="Rate" value={rateLabel || '-'} />
        <Row
          size="md"
          className="px-4 py-3 border-b border-border"
          label="Fee"
          value={feeFiat != null ? `~${formatFiat(feeFiat)}` : '-'}
          mutedValue
        />
        <Row size="md" className="px-4 py-3" label="Status" value={failed ? 'Failed' : 'Completed'} />
      </SurfaceCard>

      <Button size="lg" className="mt-6 h-14 w-full text-base" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
