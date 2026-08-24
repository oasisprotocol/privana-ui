import { Link } from 'react-router'
import type { MergedRow } from '@/hooks/use-merged-activity'
import { activityPath } from '@/paths'
import { ActivityList } from '@/components/ActivityList'
import { MAX_ROWS } from './latestActivity.constants'

export const LatestActivity = ({ rows, isLoading }: { rows: MergedRow[]; isLoading: boolean }) => {
  if (!isLoading && rows.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base md:text-lg md:tracking-tight font-semibold text-foreground">Vault activity</h2>

      <ActivityList rows={rows} isLoading={isLoading} max={MAX_ROWS} />

      <Link
        to={activityPath()}
        viewTransition
        className="self-center text-sm font-medium text-foreground hover:underline"
      >
        See all activities
      </Link>
    </div>
  )
}
