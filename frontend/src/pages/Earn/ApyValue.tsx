import { cn } from '@/lib/utils'
import { formatApyBps } from '@/lib/apy'

type ApyValueProps = {
  bps: number | null | undefined
  signed?: boolean
  className?: string
}

export const ApyValue = ({ bps, signed, className }: ApyValueProps) => {
  if (bps == null) return <span className={className}>-</span>
  const tone = bps > 0 ? 'text-chart-positive' : bps < 0 ? 'text-destructive' : 'text-foreground'
  return <span className={cn(tone, className)}>{formatApyBps(bps, { signed })}</span>
}
