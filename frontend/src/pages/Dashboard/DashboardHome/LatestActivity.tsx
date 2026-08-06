import { Link } from 'react-router'
import { type MergedRow, rowKey } from '@/hooks/use-merged-activity'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { cn } from '@/lib/utils'
import { activityPath } from '@/paths'
import { ActivityRow } from '@/pages/Activity/ActivityRow'
import { MAX_ROWS } from './latestActivity.constants'

export const LatestActivity = ({ rows, isLoading }: { rows: MergedRow[]; isLoading: boolean }) => {
  const latest = rows.slice(0, MAX_ROWS)

  if (!isLoading && latest.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-lg md:tracking-tight font-semibold text-foreground">
          Vault activity
        </h2>
        <Link
          to={activityPath()}
          viewTransition
          className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
        >
          See all
        </Link>
      </div>

      {latest.length > 0 ? (
        <SurfaceCard className="overflow-hidden">
          {latest.map((r, i) => (
            <ActivityRow key={rowKey(r)} row={r} divider={i > 0} />
          ))}
        </SurfaceCard>
      ) : (
        <SurfaceCard className="overflow-hidden">
          {Array.from({ length: MAX_ROWS }).map((_, i) => (
            <div key={i} className={cn('p-4', i > 0 && 'border-t border-border')}>
              <Skeleton className="h-14 w-full" />
            </div>
          ))}
        </SurfaceCard>
      )}
    </div>
  )
}
