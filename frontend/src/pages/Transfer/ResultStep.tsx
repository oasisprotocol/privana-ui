import { Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, shortenAddress } from '@/lib/utils'

type ResultStepProps = {
  status: 'sent' | 'unknown'
  recipient: string
  amount: string
  symbol: string
  onViewActivity: () => void
  onDone: () => void
}

export const ResultStep = ({
  status,
  recipient,
  amount,
  symbol,
  onViewActivity,
  onDone,
}: ResultStepProps) => {
  const sent = status === 'sent'

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="flex flex-col items-center py-6 text-center">
        <div
          className={cn(
            'flex size-20 items-center justify-center rounded-full animate-scale-in',
            sent ? 'bg-chart-positive/15 text-chart-positive' : 'bg-amber-500/15 text-amber-500',
          )}
        >
          {sent ? (
            <Check className="size-9" strokeWidth={3} />
          ) : (
            <Clock className="size-9" strokeWidth={2.5} />
          )}
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {sent ? `Sent ${amount} ${symbol}` : 'Transfer not confirmed'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sent ? 'to' : `${amount} ${symbol} to`}{' '}
          <span className="font-mono text-foreground">{shortenAddress(recipient)}</span>
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {sent
            ? 'Settled inside Privana'
            : 'It may still go through. Check your activity before sending again.'}
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" className="h-14 w-full text-base" onClick={onViewActivity}>
          View in activity
        </Button>
        <Button size="lg" variant="outline" className="h-14 w-full text-base" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
