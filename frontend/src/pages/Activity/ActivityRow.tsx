import type { MergedRow } from '@/hooks/use-merged-activity'
import { activityDetailsPath } from '@/paths'
import { SwapActivityCard } from './SwapActivityCard'
import { EarnActivityCard } from './EarnActivityCard'
import { ChainActivityCard } from './ChainActivityCard'
import { detailsIdOf } from './details'

export const ActivityRow = ({ row, divider }: { row: MergedRow; divider?: boolean }) => {
  const detailsId = detailsIdOf(row)
  const href = detailsId ? activityDetailsPath(detailsId) : undefined
  if (row.source === 'local') {
    return row.activity.type === 'swap' ? (
      <SwapActivityCard activity={row.activity} divider={divider} href={href} />
    ) : (
      <EarnActivityCard activity={row.activity} divider={divider} href={href} />
    )
  }
  return (
    <ChainActivityCard
      row={row.row}
      pending={row.source === 'pending' || row.pending}
      divider={divider}
      href={href}
    />
  )
}
