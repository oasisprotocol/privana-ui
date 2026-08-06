import type { MergedRow } from '@/hooks/use-merged-activity'
import { SwapActivityCard } from './SwapActivityCard'
import { EarnActivityCard } from './EarnActivityCard'
import { ChainActivityCard } from './ChainActivityCard'

export const ActivityRow = ({ row, divider }: { row: MergedRow; divider?: boolean }) => {
  if (row.source === 'local') {
    return row.activity.type === 'swap' ? (
      <SwapActivityCard activity={row.activity} timestamp={row.timestamp} divider={divider} />
    ) : (
      <EarnActivityCard activity={row.activity} timestamp={row.timestamp} divider={divider} />
    )
  }
  return <ChainActivityCard row={row.row} timestamp={row.timestamp} divider={divider} />
}
