import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ACTIVITY_TITLES } from './labels'
import { ActivityAmountRow, ActivityCard, ActivityCardHeader } from './ActivityCardParts'

// Chain rows are by definition on-chain settled, so status is fixed.
const SETTLED = 'completed' as const

type Props = {
  row: ClassifiedHistoryEntry
  timestamp?: number
}

export const ChainActivityCard = ({ row, timestamp }: Props) => {
  const { getTokenById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined

  return (
    <ActivityCard>
      <ActivityCardHeader title={ACTIVITY_TITLES[row.kind]} status={SETTLED} timestamp={timestamp} />

      {token && row.amount && (
        <ActivityAmountRow
          kind={row.kind}
          token={{ id: token.id, symbol: token.symbol, decimals: token.decimals }}
          amount={row.amount}
        />
      )}
    </ActivityCard>
  )
}
