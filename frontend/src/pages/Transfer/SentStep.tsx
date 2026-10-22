import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'

type SentStepProps = {
  recipient: string
  amount: string
  symbol: string
  onViewActivity: () => void
  onDone: () => void
}

export const SentStep = ({ recipient, amount, symbol, onViewActivity, onDone }: SentStepProps) => (
  <div className="flex flex-col animate-fade-in">
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-chart-positive/15 text-chart-positive animate-scale-in">
        <Check className="size-9" strokeWidth={3} />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Sent {amount} {symbol}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        to <span className="font-mono text-foreground">{shortenAddress(recipient)}</span>
      </p>
      <p className="mt-4 text-xs text-muted-foreground">Settled inside Privana</p>
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
