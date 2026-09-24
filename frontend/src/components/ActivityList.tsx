import type { ReactNode } from 'react'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { type MergedRow, rowKey } from '@/hooks/use-merged-activity'
import { ActivityRow } from '@/pages/Activity/ActivityRow'

export const ActivityList = ({
  rows,
  isLoading,
  isError = false,
  onRetry,
  max,
  emptyState = null,
}: {
  rows: MergedRow[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  max: number
  emptyState?: ReactNode
}) => {
  const latest = rows.slice(0, max)

  if (isError) return <ActivityUnavailable onRetry={onRetry} />

  if (latest.length > 0) {
    return (
      <SurfaceCard className="overflow-hidden">
        {latest.map((row, i) => (
          <ActivityRow key={rowKey(row)} row={row} divider={i > 0} />
        ))}
      </SurfaceCard>
    )
  }

  if (isLoading) {
    return (
      <SurfaceCard className="overflow-hidden">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className={cn('p-4', i > 0 && 'border-t border-border')}>
            <Skeleton className="h-14 w-full" />
          </div>
        ))}
      </SurfaceCard>
    )
  }

  return <>{emptyState}</>
}

// A source failed, so the list is unknown rather than empty.
export const ActivityUnavailable = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex flex-col items-start gap-3">
    <p className="text-sm text-destructive">Activity could not be loaded right now.</p>
    {onRetry && (
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
)
