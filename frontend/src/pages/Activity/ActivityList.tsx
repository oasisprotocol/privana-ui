import type { ReactNode } from 'react'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { type MergedRow, rowKey } from '@/hooks/use-merged-activity'
import { ActivityRow } from './ActivityRow'

export const ActivityList = ({
  rows,
  isLoading,
  max,
  emptyState = null,
}: {
  rows: MergedRow[]
  isLoading: boolean
  max: number
  emptyState?: ReactNode
}) => {
  const latest = rows.slice(0, max)

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
