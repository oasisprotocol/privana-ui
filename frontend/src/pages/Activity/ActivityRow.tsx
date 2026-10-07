import type { MergedRow } from '@/hooks/use-merged-activity'
import { SwapActivityCard } from './SwapActivityCard'
import { EarnActivityCard } from './EarnActivityCard'
import { ChainActivityCard } from './ChainActivityCard'

export const ActivityRow = ({ row, divider }: { row: MergedRow; divider?: boolean }) => {
  if (row.source === 'local') {
    return row.activity.type === 'swap' ? (
      <SwapActivityCard activity={row.activity} divider={divider} />
    ) : (
      <EarnActivityCard activity={row.activity} divider={divider} />
    )
  }
  return (
    <ChainActivityCard row={row.row} pending={row.source === 'pending' || row.pending} divider={divider} />
  )
}
