import { Check, Loader2, X } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { Button } from '@/components/ui/button'
import { Row } from '@/components/Row'
import { SurfaceCard } from '@/components/SurfaceCard'
import { formatAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { useSlowSettlement } from '@/hooks/useSlowSettlement'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'

type EarnDepositResultProps = {
  activity: EarnActivity
  onDone: () => void
  onViewActivity: () => void
}

export const EarnDepositResult = ({ activity, onDone, onViewActivity }: EarnDepositResultProps) => {
  const { token, amount, protocol, status, error } = activity
  const amountFormatted = formatAmount(BigInt(amount || '0'), token.decimals)

  const slow = useSlowSettlement(status)

  if (status === 'in-progress') {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Moving to Earn…</h1>
        <p className="mt-2 text-sm text-muted-foreground">This usually takes a few minutes.</p>
        {slow && (
          <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
            <p className="max-w-xs text-xs text-muted-foreground">
              This is taking longer than usual. It&apos;s safe to leave this page — your deposit will keep
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
          {failed ? 'Deposit failed' : 'Now earning'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {failed
            ? error || 'Something went wrong. Please try again.'
            : `${amountFormatted} ${token.symbol} is now earning in ${protocol}.`}
        </p>
      </div>

      <SurfaceCard className="mt-8 flex flex-col gap-0 p-0">
        <Row size="md" className="px-4 py-3 border-b border-border" label="To" value={protocol} />
        <Row
          size="md"
          className="px-4 py-3 border-b border-border"
          label="Amount"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span className="tabular-nums">{amountFormatted}</span>
              {token.symbol && (
                <span className="size-4 shrink-0 overflow-hidden rounded-full">
                  {getTokenIcon(token.symbol, 16)}
                </span>
              )}
              {token.symbol}
            </span>
          }
        />
        <Row size="md" className="px-4 py-3" label="Status" value={failed ? 'Failed' : 'Completed'} />
      </SurfaceCard>

      <Button size="lg" className="mt-6 h-14 w-full text-base" onClick={onDone}>
        Back to dashboard
      </Button>
    </div>
  )
}
