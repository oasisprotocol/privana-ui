import { cn } from '@/lib/utils'
import { formatFiat } from '@/lib/tokens'

type BalanceSegmentKey = 'available' | 'earning' | 'locked'

const SEGMENTS: { key: BalanceSegmentKey; label: string; className: string }[] = [
  { key: 'available', label: 'Available', className: 'bg-primary' },
  { key: 'earning', label: 'Earning', className: 'bg-chart-positive' },
  { key: 'locked', label: 'In use', className: 'bg-violet-600' },
]

export const BalanceBreakdown = ({
  available,
  earning,
  locked,
  error,
  size = 'sm',
  className,
}: {
  available: number | undefined
  earning: number | undefined
  locked: number | undefined
  error: boolean
  size?: 'sm' | 'md'
  className?: string
}) => {
  const values: Record<BalanceSegmentKey, number | undefined> = { available, earning, locked }
  const ready = !error && available !== undefined && earning !== undefined && locked !== undefined
  const total = (available ?? 0) + (earning ?? 0) + (locked ?? 0)
  const md = size === 'md'

  return (
    <div className={className}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        {ready &&
          total > 0 &&
          SEGMENTS.map(segment => {
            const pct = ((values[segment.key] ?? 0) / total) * 100
            return pct > 0 ? (
              <span
                key={segment.key}
                className={cn('h-full', segment.className)}
                style={{ width: `${pct}%` }}
              />
            ) : null
          })}
      </div>

      <div
        className={cn(
          'mt-3 flex gap-x-5',
          md
            ? 'flex-wrap items-center gap-y-1.5 text-sm'
            : 'touch-pan-x overflow-x-auto pb-0.5 text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {SEGMENTS.map(segment => (
          <span key={segment.key} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', segment.className)} />
            <span className={md ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {segment.label}
            </span>
            <span
              className={cn('tabular-nums', md ? 'text-muted-foreground' : 'font-semibold text-foreground')}
            >
              {ready ? formatFiat(values[segment.key] ?? 0) : '-'}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
