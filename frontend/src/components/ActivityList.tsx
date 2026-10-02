import type { ReactNode } from 'react'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { type MergedRow, rowKey } from '@/hooks/use-merged-activity'
import { ActivityRow } from '@/pages/Activity/ActivityRow'
import { groupRowsByDay } from '@/pages/Activity/groupByDay'

export const ActivityGroups = ({ rows }: { rows: MergedRow[] }) => (
  <div className="flex flex-col gap-5">
    {groupRowsByDay(rows).map(group => (
      <div key={group.key}>
        <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">{group.label}</p>
        <SurfaceCard className="overflow-hidden">
          {group.rows.map((row, i) => (
            <ActivityRow key={rowKey(row)} row={row} divider={i > 0} />
          ))}
        </SurfaceCard>
      </div>
    ))}
  </div>
)

export const ActivitySkeleton = ({ rows }: { rows: number }) => (
  <SurfaceCard className="overflow-hidden">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={cn('px-4 py-2.5', i > 0 && 'border-t border-border')}>
        <Skeleton className="h-9 w-full" />
      </div>
    ))}
  </SurfaceCard>
)

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

  if (latest.length > 0) return <ActivityGroups rows={latest} />

  if (isLoading) return <ActivitySkeleton rows={max} />

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
