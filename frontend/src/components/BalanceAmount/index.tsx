import { cn } from '@/lib/utils'
import { fiatFormatter } from '@/lib/tokens'

export const BalanceAmount = ({ value, className }: { value: number; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-baseline tabular-nums text-5xl font-semibold tracking-tight text-foreground',
      className,
    )}
  >
    {fiatFormatter.formatToParts(value).map((part, i) => {
      const muted = part.type === 'currency' || part.type === 'decimal' || part.type === 'fraction'
      return (
        <span
          key={i}
          data-testid="amount-part"
          className={cn(part.type === 'currency' && 'text-[0.75em]', muted && 'text-muted-foreground')}
        >
          {part.value}
        </span>
      )
    })}
  </span>
)
