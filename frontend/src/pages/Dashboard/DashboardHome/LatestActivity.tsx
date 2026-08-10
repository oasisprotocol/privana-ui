import { Link } from 'react-router'
import type { MergedRow } from '@/hooks/use-merged-activity'
import { activityPath } from '@/paths'
import { ActivityList } from '@/pages/Activity/ActivityList'
import { MAX_ROWS } from './latestActivity.constants'

export const LatestActivity = ({ rows, isLoading }: { rows: MergedRow[]; isLoading: boolean }) => {
  if (!isLoading && rows.length === 0) return null

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

      <ActivityList rows={rows} isLoading={isLoading} max={MAX_ROWS} />
    </div>
  )
}
