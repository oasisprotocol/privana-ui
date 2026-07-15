import { Link } from 'react-router'
import { type MergedRow, rowKey } from '@/hooks/use-merged-activity'
import { Skeleton } from '@/components/ui/skeleton'
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
          Latest activity
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
        latest.map(r => <ActivityRow key={rowKey(r)} row={r} />)
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from({ length: MAX_ROWS }).map((_, i) => (
            <Skeleton key={i} className="h-[90px] w-full rounded-2xl" />
          ))}
        </div>
      )}
    </div>
  )
}
